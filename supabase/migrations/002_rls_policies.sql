-- ============================================================
-- 002_rls_policies.sql
-- Row Level Security policies
-- ============================================================

-- Enable RLS on all tables
alter table settings              enable row level security;
alter table employees             enable row level security;
alter table birthdays             enable row level security;
alter table birthday_wishes       enable row level security;
alter table empathy_comments      enable row level security;
alter table empathy_likes         enable row level security;
alter table comment_likes         enable row level security;
alter table channel_likes         enable row level security;
alter table empathy_photos        enable row level security;
alter table ideas                 enable row level security;
alter table activities            enable row level security;
alter table activity_joins        enable row level security;
alter table annual_trainings      enable row level security;
alter table idp_trainings         enable row level security;
alter table external_trainings    enable row level security;
alter table compulsory_trainings  enable row level security;
alter table superskills_trainings enable row level security;
alter table leadership_trainings  enable row level security;
alter table training_registrations enable row level security;
alter table training_reviews      enable row level security;
alter table site_visits           enable row level security;
alter table site_votes            enable row level security;
alter table points                enable row level security;
alter table point_rules           enable row level security;
alter table blog_posts            enable row level security;
alter table idp_posters           enable row level security;
alter table idp_videos            enable row level security;
alter table mental_advisors       enable row level security;
alter table consult_requests      enable row level security;
alter table site_suggestions      enable row level security;

-- ── Helper: is admin ─────────────────────────────────────────
-- Admin users have user_metadata->>'role' = 'admin' in Supabase Auth
create or replace function is_admin()
returns boolean language sql security definer as $$
  select coalesce(
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- ── Public read (anon + authenticated) ───────────────────────
-- These tables are read-only for everyone; only admins can write

create policy "public read" on employees             for select using (true);
create policy "public read" on birthdays             for select using (true);
create policy "public read" on empathy_comments      for select using (true);
create policy "public read" on empathy_likes         for select using (true);
create policy "public read" on comment_likes         for select using (true);
create policy "public read" on channel_likes         for select using (true);
create policy "public read" on empathy_photos        for select using (true);
create policy "public read" on ideas                 for select using (true);
create policy "public read" on activities            for select using (true);
create policy "public read" on activity_joins        for select using (true);
create policy "public read" on annual_trainings      for select using (true);
create policy "public read" on idp_trainings         for select using (true);
create policy "public read" on external_trainings    for select using (true);
create policy "public read" on compulsory_trainings  for select using (true);
create policy "public read" on superskills_trainings for select using (true);
create policy "public read" on leadership_trainings  for select using (true);
create policy "public read" on training_registrations for select using (true);
create policy "public read" on training_reviews      for select using (true);
create policy "public read" on site_visits           for select using (true);
create policy "public read" on site_votes            for select using (true);
create policy "public read" on point_rules           for select using (true);
create policy "public read" on blog_posts            for select using (true);
create policy "public read" on idp_posters           for select using (true);
create policy "public read" on idp_videos            for select using (true);
create policy "public read" on mental_advisors       for select using (true);
create policy "public read" on birthday_wishes       for select using (true);
create policy "public read" on settings              for select using (true);

-- ── Authenticated write (logged-in employees) ────────────────
create policy "auth insert" on empathy_comments      for insert with check (auth.role() = 'authenticated');
create policy "auth insert" on empathy_likes         for insert with check (auth.role() = 'authenticated');
create policy "auth delete" on empathy_likes         for delete using (auth.role() = 'authenticated');
create policy "auth insert" on comment_likes         for insert with check (auth.role() = 'authenticated');
create policy "auth delete" on comment_likes         for delete using (auth.role() = 'authenticated');
create policy "auth insert" on channel_likes         for insert with check (auth.role() = 'authenticated');
create policy "auth delete" on channel_likes         for delete using (auth.role() = 'authenticated');
create policy "auth insert" on birthday_wishes       for insert with check (auth.role() = 'authenticated');
create policy "auth insert" on ideas                 for insert with check (auth.role() = 'authenticated');
create policy "auth insert" on activity_joins        for insert with check (auth.role() = 'authenticated');
create policy "auth insert" on training_registrations for insert with check (auth.role() = 'authenticated');
create policy "auth delete" on training_registrations for delete using (auth.role() = 'authenticated');
create policy "auth insert" on training_reviews      for insert with check (auth.role() = 'authenticated');
create policy "auth insert" on site_votes            for insert with check (auth.role() = 'authenticated');
create policy "auth delete" on site_votes            for delete using (auth.role() = 'authenticated');
create policy "auth insert" on site_suggestions      for insert with check (auth.role() = 'authenticated');
create policy "auth select" on site_suggestions      for select using (auth.role() = 'authenticated');
create policy "auth insert" on consult_requests      for insert with check (auth.role() = 'authenticated');
create policy "auth select own" on consult_requests  for select using (
  auth.role() = 'authenticated'
);
create policy "auth insert" on empathy_photos        for insert with check (auth.role() = 'authenticated');
create policy "auth update" on empathy_photos        for update using (auth.role() = 'authenticated');
create policy "auth insert" on points                for insert with check (auth.role() = 'authenticated');
create policy "auth select" on points                for select using (auth.role() = 'authenticated');

-- ── Admin-only write ─────────────────────────────────────────
create policy "admin all" on employees              for all using (is_admin());
create policy "admin insert" on employees           for insert with check (is_admin());
create policy "admin all" on activities             for insert with check (is_admin());
create policy "admin update" on activities          for update using (is_admin());
create policy "admin delete" on activities          for delete using (is_admin());
create policy "admin all" on annual_trainings       for all using (is_admin());
create policy "admin all" on idp_trainings          for all using (is_admin());
create policy "admin all" on external_trainings     for all using (is_admin());
create policy "admin all" on compulsory_trainings   for all using (is_admin());
create policy "admin all" on superskills_trainings  for all using (is_admin());
create policy "admin all" on leadership_trainings   for all using (is_admin());
create policy "admin all" on site_visits            for all using (is_admin());
create policy "admin all" on mental_advisors        for all using (is_admin());
create policy "admin all" on blog_posts             for all using (is_admin());
create policy "admin all" on idp_posters            for all using (is_admin());
create policy "admin all" on idp_videos             for all using (is_admin());
create policy "admin all" on ideas                  for update using (is_admin());
create policy "admin all" on settings               for all using (is_admin());
create policy "admin all" on point_rules            for all using (is_admin());
create policy "admin delete comment" on empathy_comments for delete using (is_admin());
create policy "admin all consult" on consult_requests for update using (is_admin());
