-- 028_fix_points_complete.sql
-- Comprehensive fix for points system — safe to run even if 021-027 already applied
-- Root causes:
--   1. award_points in 003 uses unquoted `desc` → syntax error on INSERT
--   2. No SET LOCAL row_security = OFF → RLS blocks insert from SECURITY DEFINER
--   3. daily_checkin uses current_date (UTC) not Bangkok timezone

-- ── 1. Fix points RLS ────────────────────────────────────────
drop policy if exists "auth select"  on points;
drop policy if exists "auth insert"  on points;
drop policy if exists "public read"  on points;
drop policy if exists "public insert" on points;

create policy "public read"   on points for select using (true);
create policy "public insert" on points for insert with check (true);

-- ── 2. Fix award_points ──────────────────────────────────────
create or replace function award_points(
  p_emp_name  text,
  p_type      text,
  p_subtype   text default '',
  p_desc      text default ''
) returns integer language plpgsql security definer
set search_path = public
as $$
declare
  v_pts integer;
begin
  set local row_security = off;

  select pts into v_pts
  from point_rules
  where type = p_type
    and (subtype = p_subtype or subtype = '')
    and active = true
  order by (subtype = p_subtype) desc
  limit 1;

  if v_pts is null or v_pts <= 0 then return 0; end if;

  insert into points(employee_name, type, subtype, amount, "desc")
  values (p_emp_name, p_type, p_subtype, v_pts, p_desc);

  return v_pts;
end;
$$;

-- ── 3. Fix daily_checkin (Bangkok TZ) ───────────────────────
create or replace function daily_checkin(p_emp_name text)
returns integer language plpgsql security definer
set search_path = public
as $$
begin
  set local row_security = off;

  if exists(
    select 1 from points
    where employee_name = p_emp_name
      and type = 'daily_checkin'
      and created_at::date = (now() at time zone 'Asia/Bangkok')::date
  ) then
    return 0;
  end if;

  return award_points(p_emp_name, 'daily_checkin', '', 'Check-in รายวัน');
end;
$$;

-- ── 4. Fix get_my_points ─────────────────────────────────────
create or replace function get_my_points(p_emp_name text)
returns integer language sql security definer
set search_path = public
as $$
  select coalesce(sum(amount), 0)::integer
  from points
  where employee_name = p_emp_name;
$$;

-- ── 5. Fix get_my_points_history ─────────────────────────────
create or replace function get_my_points_history(p_emp_name text)
returns table (
  id           text,
  type         text,
  subtype      text,
  amount       integer,
  description  text,
  created_at   text
) language sql security definer
set search_path = public
as $$
  select
    id,
    type,
    subtype,
    amount,
    coalesce("desc", '') as description,
    created_at::text
  from points
  where employee_name = p_emp_name
  order by created_at desc
  limit 50;
$$;

-- ── 6. Fix send_empathy trigger (once per channel) ───────────
create or replace function trg_award_send_empathy()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  set local row_security = off;

  if NEW.parent_id is not null and NEW.parent_id != '' then
    return NEW;
  end if;

  if NEW.author_name is null or NEW.author_name = '' then
    return NEW;
  end if;

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

drop trigger if exists trg_empathy_points on empathy_comments;
create trigger trg_empathy_points
  after insert on empathy_comments
  for each row execute function trg_award_send_empathy();

-- ── 7. Fix birthday_wish trigger (once per person per year) ──
create or replace function trg_award_birthday_wish()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  set local row_security = off;

  if NEW.from_name is null or NEW.from_name = '' then
    return NEW;
  end if;

  if not exists (
    select 1 from birthday_wishes
    where from_name    = NEW.from_name
      and birthday_key = NEW.birthday_key
      and year         = NEW.year
      and id != NEW.id
  ) then
    perform award_points(NEW.from_name, 'birthday_wish', '', 'อวยพรวันเกิดเพื่อน');
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_birthday_points on birthday_wishes;
create trigger trg_birthday_points
  after insert on birthday_wishes
  for each row execute function trg_award_birthday_wish();

-- ── 8. Fix join_activity trigger ─────────────────────────────
create or replace function trg_award_join_activity()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  set local row_security = off;

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

-- ── 9. Fix activity_checkin trigger ──────────────────────────
create or replace function trg_award_activity_checkin()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  set local row_security = off;

  if NEW.reward_claimed = true
     and (OLD.reward_claimed is null or OLD.reward_claimed = false)
     and NEW.employee_name is not null and NEW.employee_name != ''
  then
    perform award_points(
      NEW.employee_name,
      'activity_checkin',
      '',
      'Check-in กิจกรรม: ' || coalesce(NEW.activity_name, '')
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_activity_checkin_points on activity_joins;
create trigger trg_activity_checkin_points
  after update on activity_joins
  for each row execute function trg_award_activity_checkin();

-- ── 10. Seed point_rules if empty ────────────────────────────
insert into point_rules (id, type, subtype, icon, name, desc, pts, color, active)
values
  ('rule_daily_checkin',    'daily_checkin',   '',          '📅', 'Check-in รายวัน',          'เช็คอินทุกวันเพื่อสะสมคะแนน',        5,   '#06C755', true),
  ('rule_send_empathy',     'send_empathy',    '',          '💌', 'ส่ง Empathy ให้เพื่อน',    'ส่งคำชื่นชมให้เพื่อนร่วมงาน',        10,  '#EC4899', true),
  ('rule_birthday_wish',    'birthday_wish',   '',          '🎂', 'อวยพรวันเกิดเพื่อน',       'ส่งคำอวยพรวันเกิดให้เพื่อนร่วมงาน',  5,   '#A855F7', true),
  ('rule_join_activity',    'join_activity',   '',          '🙌', 'เข้าร่วมกิจกรรม',          'เข้าร่วมกิจกรรมของบริษัท',            50,  '#6366F1', true),
  ('rule_join_co_host',     'join_activity',   'co_host',   '🤝', 'ร่วมจัดงาน (Co-host)',     'ร่วมเป็นผู้จัดงานกิจกรรม',            80,  '#4F46E5', true),
  ('rule_join_presenter',   'join_activity',   'presenter', '🎤', 'วิทยากร / ผู้นำเสนอ',      'เป็นวิทยากรหรือผู้นำเสนอในกิจกรรม',  100, '#7C3AED', true),
  ('rule_join_organizer',   'join_activity',   'organizer', '⚡', 'ผู้จัดงานหลัก',            'เป็นผู้จัดงานหลักของกิจกรรม',         150, '#6D28D9', true),
  ('rule_activity_checkin', 'activity_checkin','',          '📍', 'Check-in กิจกรรม',         'Check-in ณ สถานที่จัดกิจกรรม',        30,  '#3B82F6', true)
on conflict (id) do nothing;

-- ── 11. Grant execute ─────────────────────────────────────────
grant execute on function award_points          to anon, authenticated;
grant execute on function daily_checkin         to anon, authenticated;
grant execute on function get_my_points         to anon, authenticated;
grant execute on function get_my_points_history to anon, authenticated;
