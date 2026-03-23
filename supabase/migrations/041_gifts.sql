-- 041_gifts.sql — Gift catalog + Surprise Box claims

-- ── gifts ─────────────────────────────────────────────────────────────────
create table if not exists gifts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  category    text,
  icon        text,            -- emoji icon เช่น 🎁 🏆 ⭐
  price       integer,         -- ราคาโดยประมาณ (บาท)
  quantity    integer,         -- null = ไม่จำกัด
  img_id      text,            -- Supabase Storage path
  img_url     text,            -- Public URL
  status      text not null default 'available',  -- 'available' | 'unavailable'
  created_at  timestamptz not null default now()
);

alter table gifts enable row level security;
drop policy if exists "public read" on gifts;
drop policy if exists "admin all"   on gifts;
create policy "public read" on gifts for select using (true);
create policy "admin all"   on gifts for all   using (true) with check (true);

-- ── gift_claims ───────────────────────────────────────────────────────────
create table if not exists gift_claims (
  id            uuid primary key default gen_random_uuid(),
  employee_id   text not null,
  employee_name text,
  gift_id       uuid references gifts(id) on delete set null,
  gift_name     text,
  claimed_year  integer not null default extract(year from now())::int,
  claimed_at    timestamptz not null default now()
);

-- 1 claim per employee per year
create unique index if not exists gift_claims_emp_year
  on gift_claims(employee_id, claimed_year);

alter table gift_claims enable row level security;
drop policy if exists "allow all" on gift_claims;
create policy "allow all" on gift_claims for all using (true) with check (true);
