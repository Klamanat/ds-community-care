-- 023_fix_points_rls.sql
-- Fix points insertion: add SET LOCAL row_security = OFF in SECURITY DEFINER functions
-- Fix points read:     add public select policy + get_my_points_history RPC

-- ── 1. Allow public to read points (history) ─────────────────
drop policy if exists "auth select"  on points;
drop policy if exists "public read"  on points;
drop policy if exists "auth insert"  on points;
create policy "public read"   on points for select using (true);
create policy "public insert" on points for insert with check (true);

-- ── 2. Recreate award_points with row_security = OFF ─────────
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

-- ── 3. Recreate daily_checkin with row_security = OFF ────────
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

-- ── 4. Recreate get_my_points with row_security = OFF ────────
create or replace function get_my_points(p_emp_name text)
returns integer language sql security definer
set search_path = public
as $$
  select coalesce(sum(amount), 0)::integer
  from points
  where employee_name = p_emp_name;
$$;

-- ── 5. New: get_my_points_history — return last 50 rows ──────
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

-- ── 6. Grant execute to anon + authenticated ─────────────────
grant execute on function award_points         to anon, authenticated;
grant execute on function daily_checkin        to anon, authenticated;
grant execute on function get_my_points        to anon, authenticated;
grant execute on function get_my_points_history to anon, authenticated;
