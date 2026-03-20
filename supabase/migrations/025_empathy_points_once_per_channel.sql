-- 025_empathy_points_once_per_channel.sql
-- send_empathy points: award only on the FIRST top-level comment per channel per author

create or replace function trg_award_send_empathy()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  set local row_security = off;

  -- Only top-level comments (not replies)
  if NEW.parent_id is not null and NEW.parent_id != '' then
    return NEW;
  end if;

  if NEW.author_name is null or NEW.author_name = '' then
    return NEW;
  end if;

  -- Only award if this is the FIRST top-level comment by this author in this channel
  if not exists (
    select 1
    from empathy_comments
    where author_name = NEW.author_name
      and post_id     = NEW.post_id
      and (parent_id is null or parent_id = '')
      and id != NEW.id   -- exclude the row being inserted
  ) then
    perform award_points(NEW.author_name, 'send_empathy', '', 'ส่ง Empathy ให้เพื่อน');
  end if;

  return NEW;
end;
$$;

-- trigger already exists (trg_empathy_points) — recreate to pick up new function body
drop trigger if exists trg_empathy_points on empathy_comments;
create trigger trg_empathy_points
  after insert on empathy_comments
  for each row execute function trg_award_send_empathy();
