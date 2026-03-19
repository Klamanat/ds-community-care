-- ============================================================
-- 009_monthly_plans.sql
-- Monthly plan posters — admin managed
-- ============================================================

create table if not exists monthly_plans (
  id          text primary key default gen_random_uuid()::text,
  year_month  text not null,   -- "YYYY-MM" e.g. "2026-03"
  title       text,
  description text,
  poster_url  text,
  poster_id   text,
  created_at  timestamptz default now()
);

alter table monthly_plans enable row level security;
create policy "public read" on monthly_plans for select using (true);
create policy "admin all"   on monthly_plans for all   using (is_admin());
