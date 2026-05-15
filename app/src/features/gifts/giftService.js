// giftService.js — Gift management via Supabase
import { supabase } from '../../core/services/supabase.js'

function mapGift(g) {
  return {
    id:          g.id,
    name:        g.name        || '',
    description: g.description || '',
    category:    g.category    || '',
    icon:        g.icon        || '',
    price:       g.price       != null ? Number(g.price)    : null,
    quantity:    g.quantity    != null ? Number(g.quantity) : null,
    imgId:       g.img_id      || '',
    imgUrl:      g.img_url     || '',
    status:      g.status      || 'available',
    createdAt:   g.created_at  || '',
  }
}

export async function fetchGifts() {
  const { data, error } = await supabase
    .from('gifts')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []).map(mapGift)
}

export async function adminAddGift(fields) {
  const { data, error } = await supabase
    .from('gifts')
    .insert(fields)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return mapGift(data)
}

export async function adminUpdateGift(id, fields) {
  const { data, error } = await supabase
    .from('gifts')
    .update(fields)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return mapGift(data)
}

export async function adminDeleteGift(id) {
  const { error } = await supabase.from('gifts').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Surprise Box ───────────────────────────────────────────────────────

/** Fetch gifts that are available to give (status=available, quantity>0 or unlimited) */
export async function fetchAvailableGifts() {
  const { data, error } = await supabase
    .from('gifts')
    .select('*')
    .eq('status', 'available')
    .or('quantity.is.null,quantity.gt.0')
  if (error) throw new Error(error.message)
  return (data || []).map(mapGift)
}

/** Check if employee already claimed a Surprise Box this year */
export async function checkSurpriseBoxClaim(employeeId) {
  const year = new Date().getFullYear()
  const { data } = await supabase
    .from('gift_claims')
    .select('id, gift_name')
    .eq('employee_id', String(employeeId))
    .eq('claimed_year', year)
    .maybeSingle()
  return data || null  // null = not yet claimed
}

/**
 * Claim a random Surprise Box gift for the employee.
 * Returns: { gift } | { alreadyClaimed, giftName } | { noGifts }
 *
 * Requires Supabase table:
 *   create table gift_claims (
 *     id            uuid primary key default gen_random_uuid(),
 *     employee_id   text not null,
 *     employee_name text,
 *     gift_id       uuid references gifts(id) on delete set null,
 *     gift_name     text,
 *     claimed_year  integer not null default extract(year from now())::int,
 *     claimed_at    timestamptz not null default now()
 *   );
 *   create unique index on gift_claims(employee_id, claimed_year);
 *   alter table gift_claims enable row level security;
 *   create policy "allow all" on gift_claims for all using (true) with check (true);
 */
/** Admin: fetch all gift claims, newest first */
export async function fetchGiftClaims() {
  const { data, error } = await supabase
    .from('gift_claims')
    .select('id, employee_id, employee_name, gift_name, claimed_year, claimed_at')
    .order('claimed_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

/**
 * Quantity-weighted random:
 *   P(gift_i) = qty_i / total_qty
 *
 * ของที่เหลือน้อย → โอกาสออกต่ำ (หายาก)
 * ของที่เหลือมาก → โอกาสออกสูง (หาง่าย)
 * ของที่ quantity = null (ไม่จำกัด) → ใช้ค่า max ของที่มี qty ทั้งหมด
 *   ซึ่งทำให้มันมีโอกาส "ปกติ" ไม่หายากและไม่ล้นตลาด
 */
function quantityWeightedRandom(gifts) {
  const limited    = gifts.filter(g => g.quantity != null)
  const maxQty     = limited.length ? Math.max(...limited.map(g => g.quantity)) : 10
  const unlimitedW = Math.max(maxQty, 10)  // unlimited = เทียบเท่า qty สูงสุด (อย่างน้อย 10)

  const weights = gifts.map(g => g.quantity != null ? g.quantity : unlimitedW)
  const total   = weights.reduce((s, w) => s + w, 0)

  let r = Math.random() * total
  for (let i = 0; i < gifts.length; i++) {
    r -= weights[i]
    if (r <= 0) return gifts[i]
  }
  return gifts[gifts.length - 1]  // fallback
}

export async function claimSurpriseBox(employeeId, employeeName) {
  const year = new Date().getFullYear()

  // Try atomic RPC first (requires migration 20260515_phase1_constraints_rls.sql)
  const { data: rpcData, error: rpcErr } = await supabase.rpc('claim_surprise_box', {
    p_employee_id:   String(employeeId),
    p_employee_name: employeeName || '',
  })
  if (!rpcErr) return rpcData
  // If error is unique violation (race) treat as already claimed
  if (rpcErr.code === '23505') return { alreadyClaimed: true, giftName: '' }
  // RPC not deployed yet → fallback to direct queries
  if (!rpcErr.message?.includes('Could not find the function')) throw new Error(rpcErr.message)

  // ── Fallback: direct queries ──────────────────────────────
  const existing = await checkSurpriseBoxClaim(employeeId)
  if (existing) return { alreadyClaimed: true, giftName: existing.gift_name }

  const gifts = await fetchAvailableGifts()
  if (!gifts.length) return { noGifts: true }

  const gift = quantityWeightedRandom(gifts)

  const { error: claimErr } = await supabase.from('gift_claims').insert({
    employee_id: String(employeeId), employee_name: employeeName || '',
    gift_id: gift.id, gift_name: gift.name, claimed_year: year,
  })
  // Unique violation = race condition, already claimed
  if (claimErr?.code === '23505') return { alreadyClaimed: true, giftName: gift.name }
  if (claimErr) throw new Error(claimErr.message)

  // Decrement stock (awaited — not fire-and-forget)
  if (gift.quantity != null && gift.quantity > 0) {
    await supabase.from('gifts').update({ quantity: gift.quantity - 1 }).eq('id', gift.id)
  }

  return { gift }
}
