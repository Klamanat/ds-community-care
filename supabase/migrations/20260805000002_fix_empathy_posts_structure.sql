-- 20260805000002_fix_empathy_posts_structure.sql
-- Fix: 20260805000001 duplicated comment content (text/author_name) into
-- empathy_posts. Posts should hold no content of their own — they're just a
-- container that comments (both the original top-level message and its
-- replies) attach to via empathy_comments.empathy_post_id.

-- ── 1. Drop the old sync trigger/function (will be recreated below) ──
drop trigger if exists trg_sync_empathy_post on empathy_comments;
drop function if exists sync_empathy_post();

-- ── 2. Reshape empathy_posts — drop content columns ─────────────
alter table empathy_posts drop column if exists text;
alter table empathy_posts drop column if exists author_name;

-- ── 3. Link column on empathy_comments ──────────────────────────
alter table empathy_comments add column if not exists empathy_post_id text;
create index if not exists idx_empathy_comments_post_link on empathy_comments(empathy_post_id);

-- ── 4. Re-backfill: fresh post per existing top-level comment ───
truncate table empathy_posts;

create temporary table _post_map as
select c.id as comment_id, gen_random_uuid()::text as new_post_id, c.post_id as channel_id, c.created_at
from empathy_comments c
where c.parent_id is null or c.parent_id = '';

insert into empathy_posts (id, channel_id, created_at)
select new_post_id, channel_id, created_at from _post_map;

-- Root comment → points at its own new post
update empathy_comments c
set empathy_post_id = m.new_post_id
from _post_map m
where c.id = m.comment_id;

-- Replies → inherit their parent's new post
update empathy_comments c
set empathy_post_id = m.new_post_id
from _post_map m
where c.parent_id = m.comment_id;

drop table _post_map;

-- ── 5. Recreate the sync trigger against the new structure ──────
-- BEFORE INSERT: assign empathy_post_id on the row being written.
--   • top-level comment → create a fresh post container
--   • reply             → inherit the parent comment's post
-- BEFORE DELETE: if the deleted row was a top-level comment (i.e. a post's
--   root), remove the now-contentless post container too.
create or replace function sync_empathy_post()
returns trigger language plpgsql security definer
set search_path = public
as $$
declare
  v_post_id text;
begin
  if TG_OP = 'DELETE' then
    if OLD.parent_id is null or OLD.parent_id = '' then
      delete from empathy_posts where id = OLD.empathy_post_id;
    end if;
    return OLD;
  end if;

  if NEW.parent_id is null or NEW.parent_id = '' then
    insert into empathy_posts (id, channel_id, created_at)
    values (gen_random_uuid()::text, NEW.post_id, NEW.created_at)
    returning id into v_post_id;
  else
    select empathy_post_id into v_post_id
    from empathy_comments where id = NEW.parent_id;
  end if;

  NEW.empathy_post_id := v_post_id;
  return NEW;
end;
$$;

create trigger trg_sync_empathy_post
  before insert or delete on empathy_comments
  for each row execute function sync_empathy_post();

grant select, insert, update, delete on empathy_posts to anon, authenticated;
