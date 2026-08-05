-- 20260805000005_empathy_posts_rpc_fixes.sql
-- New kudos now live in empathy_posts (20260805000003), but two RPCs still
-- only looked at empathy_comments for "who's been praised" / "recent kudos"
-- notifications — new posts would silently never show up. Fix both.

-- ── 1. get_empathy_people — count from empathy_posts, not empathy_comments ──
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
      channel_id as post_id,
      count(*)                    as comment_count,
      max(created_at)             as last_comment
    from empathy_posts
    group by channel_id
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

-- ── 2. get_notifications — add a branch for empathy_posts ───────
drop function if exists get_notifications(text, integer);

create or replace function get_notifications(p_emp_name text, p_month_idx integer default null)
returns table (
  id     text,
  type   text,
  title  text,
  msg    text,
  "time" text,
  target text,
  color  text
) language sql security definer as $$
  with raw as (

    -- Birthdays this month — ONE row for the whole month
    select
      'bday_month_' || coalesce(p_month_idx, extract(month from now())::integer)::text  as id,
      'birthday'                                                                          as type,
      case
        when count(*) = 1 then min(e.name) || ' มีวันเกิดเดือนนี้! 🎂'
        else              count(*)::text   || ' คน มีวันเกิดเดือนนี้ 🎂'
      end                                                                                 as title,
      string_agg(e.name, ', ' order by e.name)                                           as msg,
      now()                                                                               as ts,
      'bday'                                                                              as target,
      'linear-gradient(135deg,#F9A8D4,#EC4899)'                                          as color
    from employees e
    where e.bd_date is not null
      and e.month_idx = coalesce(p_month_idx, extract(month from now())::integer)
    having count(*) > 0

    union all

    -- Birthday wishes received (last 7 days) — shown only to the birthday person
    select
      'wish_' || bw.id                                          as id,
      'bday_wish'                                               as type,
      bw.from_name || ' อวยพรวันเกิดคุณ! 🎂'                  as title,
      left(coalesce(bw.msg, ''), 120)                           as msg,
      bw.time::timestamptz                                      as ts,
      'bday'                                                    as target,
      'linear-gradient(135deg,#F9A8D4,#EC4899)'                as color
    from birthday_wishes bw
    join employees e on bw.birthday_key = 'bday_' || e.id
    where e.name = p_emp_name
      and bw.time::timestamptz > now() - interval '7 days'

    union all

    -- Recent kudos sent to this person (last 7 days) — legacy empathy_comments
    -- rows (only ever historical now; new top-level kudos no longer land here)
    select
      'emp_' || ec.id                                          as id,
      'kudos'                                                  as type,
      ec.author_name || ' ส่งกำลังใจมาให้! 💝'               as title,
      left(coalesce(ec.text, ''), 120)                         as msg,
      ec.created_at                                            as ts,
      'empathy_' || ec.post_id                                 as target,
      'linear-gradient(135deg,#FDE68A,#F59E0B)'               as color
    from empathy_comments ec
    join employees e2 on (e2.emp_code = ec.post_id or e2.id = ec.post_id)
    where e2.name = p_emp_name
      and ec.created_at > now() - interval '7 days'
      and ec.parent_id is null

    union all

    -- Recent kudos sent to this person (last 7 days) — new post-based writes
    select
      'empost_' || eppost.id                                    as id,
      'kudos'                                                   as type,
      eppost.author_name || ' ส่งกำลังใจมาให้! 💝'            as title,
      left(coalesce(eppost.text, ''), 120)                      as msg,
      eppost.created_at                                         as ts,
      'empathy_' || eppost.channel_id                           as target,
      'linear-gradient(135deg,#FDE68A,#F59E0B)'                as color
    from empathy_posts eppost
    join employees e3 on (e3.emp_code = eppost.channel_id or e3.id = eppost.channel_id)
    where e3.name = p_emp_name
      and eppost.created_at > now() - interval '7 days'
      and eppost.author_name is not null

    union all

    -- Activities open this month
    select
      'act_' || a.id                                           as id,
      'activity'                                               as type,
      a.name || ' ' || coalesce(a.emoji, '')                   as title,
      coalesce(a.loc, 'กิจกรรมประจำเดือน')                    as msg,
      now()                                                    as ts,
      'month_' || a.month_idx::text                            as target,
      'linear-gradient(135deg,#A5B4FC,#6366F1)'               as color
    from activities a
    where a.join_open = true
      and a.month_idx = coalesce(p_month_idx, extract(month from now())::integer - 1) + 1

  )
  select
    id,
    type,
    title,
    msg,
    ts::text  as "time",
    target,
    color
  from raw
  order by ts desc
  limit 50;
$$;
