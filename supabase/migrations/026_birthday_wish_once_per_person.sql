-- 026_birthday_wish_once_per_person.sql
-- birthday_wish points: award only on the FIRST wish per birthday_key per year per sender

create or replace function trg_award_birthday_wish()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  set local row_security = off;

  if NEW.from_name is null or NEW.from_name = '' then
    return NEW;
  end if;

  -- Only award if this is the FIRST wish by this sender to this birthday_key this year
  if not exists (
    select 1
    from birthday_wishes
    where from_name    = NEW.from_name
      and birthday_key = NEW.birthday_key
      and year         = NEW.year
      and id != NEW.id   -- exclude the row being inserted
  ) then
    perform award_points(NEW.from_name, 'birthday_wish', '', 'อวยพรวันเกิดเพื่อน');
  end if;

  return NEW;
end;
$$;

-- recreate trigger to pick up new function body
drop trigger if exists trg_birthday_points on birthday_wishes;
create trigger trg_birthday_points
  after insert on birthday_wishes
  for each row execute function trg_award_birthday_wish();
