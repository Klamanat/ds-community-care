-- 019_user_presence.sql — Track who is online / recently active

create table if not exists user_presence (
  employee_name text primary key,
  dept          text,
  last_seen_at  timestamptz not null default now()
);

alter table user_presence enable row level security;
drop policy if exists "public read"    on user_presence;
drop policy if exists "anyone upsert"  on user_presence;
create policy "public read"   on user_presence for select using (true);
create policy "anyone upsert" on user_presence for all   using (true) with check (true);
