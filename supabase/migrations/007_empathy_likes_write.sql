-- ============================================================
-- 007_empathy_likes_write.sql
-- Allow anon users to insert/delete likes (same pattern as 005)
-- ============================================================

-- empathy_likes
drop policy if exists "auth insert" on empathy_likes;
drop policy if exists "auth delete" on empathy_likes;
create policy "public insert" on empathy_likes for insert with check (true);
create policy "public delete" on empathy_likes for delete using (true);

-- channel_likes
drop policy if exists "auth insert" on channel_likes;
drop policy if exists "auth delete" on channel_likes;
create policy "public insert" on channel_likes for insert with check (true);
create policy "public delete" on channel_likes for delete using (true);

-- comment_likes
drop policy if exists "auth insert" on comment_likes;
drop policy if exists "auth delete" on comment_likes;
create policy "public insert" on comment_likes for insert with check (true);
create policy "public delete" on comment_likes for delete using (true);
