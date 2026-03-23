// giftService.js — Gift management via Supabase
import { supabase } from './supabase.js'

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

export async function claimSurpriseBox(employeeId, employeeName) {
  const year = new Date().getFullYear()

  // Guard: already claimed?
  const existing = await checkSurpriseBoxClaim(employeeId)
  if (existing) return { alreadyClaimed: true, giftName: existing.gift_name }

  // Fetch available gifts
  const gifts = await fetchAvailableGifts()
  if (!gifts.length) return { noGifts: true }

  // Pick random gift
  const gift = gifts[Math.floor(Math.random() * gifts.length)]

  // Record claim
  const { error: claimErr } = await supabase.from('gift_claims').insert({
    employee_id:   String(employeeId),
    employee_name: employeeName || '',
    gift_id:       gift.id,
    gift_name:     gift.name,
    claimed_year:  year,
  })
  if (claimErr) throw new Error(claimErr.message)

  // Decrement quantity (fire-and-forget — ignore race condition for internal use)
  if (gift.quantity != null && gift.quantity > 0) {
    supabase.from('gifts').update({ quantity: gift.quantity - 1 }).eq('id', gift.id).then(() => {})
  }

  return { gift }
}
