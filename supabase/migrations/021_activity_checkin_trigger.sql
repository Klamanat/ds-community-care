-- 021_activity_checkin_trigger.sql
-- Add Supabase trigger for activity_checkin points
-- Fires when activity_joins.reward_claimed changes FALSE → TRUE

create or replace function trg_award_activity_checkin()
returns trigger language plpgsql security definer as $$
begin
  -- Only fire when reward_claimed flips to true
  if NEW.reward_claimed = true and (OLD.reward_claimed is null or OLD.reward_claimed = false) then
    if NEW.employee_name is not null and NEW.employee_name != '' then
      perform award_points(
        NEW.employee_name,
        'activity_checkin',
        '',
        'Check-in กิจกรรม: ' || coalesce(NEW.activity_name, '')
      );
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_activity_checkin_points on activity_joins;
create trigger trg_activity_checkin_points
  after update on activity_joins
  for each row execute function trg_award_activity_checkin();
