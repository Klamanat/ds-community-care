-- ============================================================
-- 003_rpc_functions.sql
-- PostgreSQL RPC functions replacing complex GAS logic
-- ============================================================

-- ── get_empathy_people() ─────────────────────────────────────
-- Replaces GAS getEmpathyPeople — joins empathy_comments + employees + empathy_photos
-- Returns one card per person with comment count, latest image, sorted by recency

create or replace function get_empathy_people()
returns table (
  id            text,
  emp_code      text,
  name          text,
  role          text,
  img_url       text,
  img_id        text,
  comment_count bigint,
  last_comment  timestamptz
) language sql security definer as $$
  with channel_stats as (
    select
      post_id,
      count(*)                    as comment_count,
      max(created_at)             as last_comment
    from empathy_comments
    group by post_id
  ),
  merged as (
    select
      coalesce(e.id, cs.post_id)                          as id,
      coalesce(e.emp_code, '')                            as emp_code,
      coalesce(e.name, cs.post_id)                        as name,
      coalesce(e.role, '')                                as role,
      coalesce(ep.img_url, e.img_url, '')                 as img_url,
      coalesce(e.img_id, '')                              as img_id,
      cs.comment_count,
      cs.last_comment
    from channel_stats cs
    left join employees e
      on e.emp_code = cs.post_id or e.id = cs.post_id
    left join empathy_photos ep
      on ep.employee_id = coalesce(e.id, cs.post_id)
  )
  select distinct on (id)
    id, emp_code, name, role, img_url, img_id, comment_count, last_comment
  from merged
  order by id, last_comment desc nulls last;
$$;

-- ── toggle_empathy_like(post_id, user_key) ───────────────────
-- Replaces GAS toggleLike — atomic upsert/delete in empathy_likes

create or replace function toggle_empathy_like(p_post_id text, p_user_key text)
returns table (liked boolean, like_count bigint) language plpgsql security definer as $$
declare
  v_exists boolean;
begin
  select exists(
    select 1 from empathy_likes where post_id = p_post_id and user_key = p_user_key
  ) into v_exists;

  if v_exists then
    delete from empathy_likes where post_id = p_post_id and user_key = p_user_key;
  else
    insert into empathy_likes(post_id, user_key) values (p_post_id, p_user_key)
    on conflict do nothing;
  end if;

  return query
    select not v_exists, count(*) from empathy_likes where post_id = p_post_id;
end;
$$;

-- ── toggle_comment_like(comment_id, user_key) ────────────────
create or replace function toggle_comment_like(p_comment_id text, p_user_key text)
returns table (liked boolean, like_count bigint) language plpgsql security definer as $$
declare
  v_exists boolean;
begin
  select exists(
    select 1 from comment_likes where comment_id = p_comment_id and user_key = p_user_key
  ) into v_exists;

  if v_exists then
    delete from comment_likes where comment_id = p_comment_id and user_key = p_user_key;
  else
    insert into comment_likes(comment_id, user_key) values (p_comment_id, p_user_key)
    on conflict do nothing;
  end if;

  return query
    select not v_exists, count(*) from comment_likes where comment_id = p_comment_id;
end;
$$;

-- ── toggle_channel_like(channel_id, user_key) ────────────────
create or replace function toggle_channel_like(p_channel_id text, p_user_key text)
returns table (liked boolean, like_count bigint) language plpgsql security definer as $$
declare
  v_exists boolean;
begin
  select exists(
    select 1 from channel_likes where channel_id = p_channel_id and user_key = p_user_key
  ) into v_exists;

  if v_exists then
    delete from channel_likes where channel_id = p_channel_id and user_key = p_user_key;
  else
    insert into channel_likes(channel_id, user_key) values (p_channel_id, p_user_key)
    on conflict do nothing;
  end if;

  return query
    select not v_exists, count(*) from channel_likes where channel_id = p_channel_id;
end;
$$;

-- ── award_points(emp_name, type, subtype, desc_text) ─────────
-- Replaces GAS addPoints — looks up rule → inserts into points

create or replace function award_points(
  p_emp_name  text,
  p_type      text,
  p_subtype   text default '',
  p_desc      text default ''
) returns integer language plpgsql security definer as $$
declare
  v_pts integer;
begin
  select pts into v_pts
  from point_rules
  where type = p_type
    and (subtype = p_subtype or subtype = '')
    and active = true
  order by (subtype = p_subtype) desc
  limit 1;

  if v_pts is null or v_pts <= 0 then return 0; end if;

  insert into points(employee_name, type, subtype, amount, desc)
  values (p_emp_name, p_type, p_subtype, v_pts, p_desc);

  return v_pts;
end;
$$;

-- ── get_my_points(emp_name) ───────────────────────────────────
create or replace function get_my_points(p_emp_name text)
returns integer language sql security definer as $$
  select coalesce(sum(amount), 0)::integer
  from points
  where employee_name = p_emp_name;
$$;

-- ── daily_checkin(emp_name) ───────────────────────────────────
-- Returns points awarded (0 if already checked in today)
create or replace function daily_checkin(p_emp_name text)
returns integer language plpgsql security definer as $$
begin
  if exists(
    select 1 from points
    where employee_name = p_emp_name
      and type = 'daily_checkin'
      and created_at::date = current_date
  ) then
    return 0;
  end if;

  return award_points(p_emp_name, 'daily_checkin', '', 'Check-in รายวัน');
end;
$$;

-- ── get_notifications(emp_name, month_idx) ───────────────────
-- Replaces GAS getNotifications — generates notification list from DB

create or replace function get_notifications(p_emp_name text, p_month_idx integer default null)
returns table (
  id       text,
  type     text,
  title    text,
  subtitle text,
  ts       timestamptz,
  meta     jsonb
) language sql security definer as $$
  -- Birthday notifications (this month)
  select
    'bday_' || e.id          as id,
    'birthday'               as type,
    e.name || ' วันเกิดใกล้มาแล้ว! 🎂' as title,
    'เดือน ' || e.month_idx::text as subtitle,
    now()                    as ts,
    jsonb_build_object('employeeId', e.id, 'monthIdx', e.month_idx) as meta
  from employees e
  where e.bd_date is not null
    and e.month_idx = coalesce(p_month_idx, extract(month from now())::integer)

  union all

  -- Recent empathy comments addressed to this person
  select
    'emp_' || ec.id          as id,
    'empathy'                as type,
    ec.author_name || ' ส่งกำลังใจมาให้! 💝' as title,
    ec.text                  as subtitle,
    ec.created_at            as ts,
    jsonb_build_object('postId', ec.post_id) as meta
  from empathy_comments ec
  join employees e2 on (e2.emp_code = ec.post_id or e2.id = ec.post_id)
  where e2.name = p_emp_name
    and ec.created_at > now() - interval '7 days'
    and ec.parent_id is null

  union all

  -- Upcoming activities
  select
    'act_' || a.id           as id,
    'activity'               as type,
    a.name || ' ' || coalesce(a.emoji, '') as title,
    coalesce(a.loc, '')      as subtitle,
    now()                    as ts,
    jsonb_build_object('activityId', a.id, 'monthIdx', a.month_idx) as meta
  from activities a
  where a.join_open = true

  order by ts desc
  limit 50;
$$;
