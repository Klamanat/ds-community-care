-- 018_notifications_grouped_bday.sql
-- Group all birthday notifications for the month into a single row

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

    -- Recent kudos sent to this person (last 7 days)
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
