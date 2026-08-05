-- 20260805000003_empathy_posts_direct_write.sql
-- New kudos now insert directly into empathy_posts (which owns its own
-- author_name/text — no more deriving content from a linked comment row).
-- empathy_comments becomes purely for replies/discussion under a post,
-- linked via empathy_post_id.
--
-- Old data: one post per channel (recipient) — aggregates every historical
-- message that channel ever received. author_name/text are NULL on these
-- (there's no single message to show — the app shows recipient info only).
-- All historical comments (former top-level "kudos" AND their replies) stay
-- exactly as they were and link to that one channel post.

-- ── 1. Drop the now-obsolete sync mechanism ──────────────────────
drop trigger if exists trg_sync_empathy_post on empathy_comments;
drop function if exists sync_empathy_post();

-- ── 2. Posts own their content again ─────────────────────────────
alter table empathy_posts add column if not exists author_name text;
alter table empathy_posts add column if not exists text        text;

-- ── 3. Re-backfill: one post per channel ─────────────────────────
truncate table empathy_posts;

insert into empathy_posts (id, channel_id, author_name, text, created_at)
select gen_random_uuid()::text, post_id, null, null, max(created_at)
from empathy_comments
group by post_id;

update empathy_comments c
set empathy_post_id = p.id
from empathy_posts p
where p.channel_id = c.post_id;

-- ── 4. Move the send_empathy points award to empathy_posts ──────
-- Old trigger (empathy_comments) is superseded — new top-level kudos no
-- longer flow through that table, so it would never fire again anyway.
drop trigger if exists trg_empathy_points on empathy_comments;

create or replace function trg_award_send_empathy_post()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  set local row_security = off;

  if NEW.author_name is null or NEW.author_name = '' then
    return NEW;
  end if;

  -- Award only on this author's FIRST post to this channel
  if not exists (
    select 1 from empathy_posts
    where author_name = NEW.author_name
      and channel_id   = NEW.channel_id
      and id != NEW.id
  ) then
    perform award_points(NEW.author_name, 'send_empathy', '', 'ส่ง Empathy ให้เพื่อน');
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_empathy_points_posts on empathy_posts;
create trigger trg_empathy_points_posts
  after insert on empathy_posts
  for each row execute function trg_award_send_empathy_post();
