-- 017_rewards.sql — Reward items catalog (แคตาล็อกของรางวัล)

create table if not exists rewards (
  id          text primary key default gen_random_uuid()::text,
  name        text not null,
  description text,
  pts_cost    integer not null default 0,
  image_id    text,          -- Storage path e.g. "rewards/1710425_item.jpg"
  image_url   text,          -- public URL
  stock       integer,       -- null = unlimited
  active      boolean not null default true,
  created_at  timestamptz default now()
);

alter table rewards enable row level security;
drop policy if exists "public read" on rewards;
drop policy if exists "admin all"   on rewards;
create policy "public read" on rewards for select using (true);
create policy "admin all"   on rewards for all   using (is_admin());
