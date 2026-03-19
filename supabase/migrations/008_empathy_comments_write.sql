-- ============================================================
-- 008_empathy_comments_write.sql
-- Allow anon users to insert empathy comments (same pattern as 005)
-- ============================================================

drop policy if exists "auth insert" on empathy_comments;
create policy "public insert" on empathy_comments for insert with check (true);
