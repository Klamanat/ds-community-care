-- ============================================================
-- 004_points_triggers.sql
-- Auto-award points via DB triggers instead of manual frontend calls
-- ============================================================

-- ── Trigger: send_empathy ─────────────────────────────────────
-- Award points when a top-level empathy comment is posted (not replies)

create or replace function trg_award_send_empathy()
returns trigger language plpgsql security definer as $$
begin
  -- Only top-level comments (not replies)
  if NEW.parent_id is null or NEW.parent_id = '' then
    if NEW.author_name is not null and NEW.author_name != '' then
      perform award_points(NEW.author_name, 'send_empathy', '', 'ส่ง Empathy ให้เพื่อน');
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_empathy_points on empathy_comments;
create trigger trg_empathy_points
  after insert on empathy_comments
  for each row execute function trg_award_send_empathy();

-- ── Trigger: birthday_wish ────────────────────────────────────
-- Award points when a birthday wish is sent

create or replace function trg_award_birthday_wish()
returns trigger language plpgsql security definer as $$
begin
  if NEW.from_name is not null and NEW.from_name != '' then
    perform award_points(NEW.from_name, 'birthday_wish', '', 'อวยพรวันเกิดเพื่อน');
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_birthday_points on birthday_wishes;
create trigger trg_birthday_points
  after insert on birthday_wishes
  for each row execute function trg_award_birthday_wish();

-- ── Trigger: join_activity ────────────────────────────────────
-- Award points when joining an activity
-- reward_type maps to subtype (co_host, presenter, organizer, or '' for default)

create or replace function trg_award_join_activity()
returns trigger language plpgsql security definer as $$
begin
  if NEW.employee_name is not null and NEW.employee_name != '' then
    perform award_points(
      NEW.employee_name,
      'join_activity',
      coalesce(NEW.reward_type, ''),
      'เข้าร่วมกิจกรรม: ' || coalesce(NEW.activity_name, '')
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_activity_points on activity_joins;
create trigger trg_activity_points
  after insert on activity_joins
  for each row execute function trg_award_join_activity();
