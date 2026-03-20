-- 020_empathy_comments_edit_delete.sql
-- Allow updating and deleting empathy comments

drop policy if exists "author update" on empathy_comments;
drop policy if exists "author delete" on empathy_comments;
create policy "author update" on empathy_comments for update using (true) with check (true);
create policy "author delete" on empathy_comments for delete using (true);
