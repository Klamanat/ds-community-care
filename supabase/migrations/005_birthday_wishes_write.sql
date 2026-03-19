-- ============================================================
-- 005_birthday_wishes_write.sql
-- Add missing DELETE / UPDATE policies for birthday_wishes
-- ============================================================

-- Replace anon-only INSERT with permissive (anon + authenticated)
drop policy if exists "auth insert" on birthday_wishes;
create policy "public insert" on birthday_wishes
  for insert with check (true);

-- Allow any user (anon or authenticated) to update / delete wishes
create policy "public update" on birthday_wishes
  for update using (true) with check (true);

create policy "public delete" on birthday_wishes
  for delete using (true);
