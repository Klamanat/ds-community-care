-- 030_fix_trigger_and_rules.sql
-- Root cause: migrations 022 + 028 both failed silently at INSERT point_rules
-- because unquoted `desc` caused a syntax error → transaction rolled back →
-- trigger was dropped but never recreated + point_rules remains empty.
--
-- This migration:
--   1. Fixes NULL subtype → '' in existing point_rules
--      (award_points looks for subtype='' but existing rows have NULL)
--   2. Recreates trg_award_send_empathy function (once per channel)
--   3. Recreates trigger on empathy_comments

-- ── 1. Fix NULL subtype → '' so award_points query can match ─
-- award_points uses: WHERE subtype = '' OR subtype = p_subtype
-- NULL != '' in SQL → all existing rules (rule_1/2/4/5) were never found
update point_rules set subtype = '' where subtype is null;

-- ── 2. Recreate trg_award_send_empathy (once per channel) ────
create or replace function trg_award_send_empathy()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  set local row_security = off;

  -- Skip replies
  if NEW.parent_id is not null and NEW.parent_id != '' then
    return NEW;
  end if;

  -- Skip anonymous
  if NEW.author_name is null or NEW.author_name = '' then
    return NEW;
  end if;

  -- Award only on FIRST top-level comment per (author, channel)
  if not exists (
    select 1 from empathy_comments
    where author_name = NEW.author_name
      and post_id     = NEW.post_id
      and (parent_id is null or parent_id = '')
      and id != NEW.id
  ) then
    perform award_points(NEW.author_name, 'send_empathy', '', 'ส่ง Empathy ให้เพื่อน');
  end if;

  return NEW;
end;
$$;

-- ── 3. Recreate trigger ───────────────────────────────────────
drop trigger if exists trg_empathy_points on empathy_comments;
create trigger trg_empathy_points
  after insert on empathy_comments
  for each row execute function trg_award_send_empathy();
