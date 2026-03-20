-- 031_backfill_empathy_points.sql
-- Retroactively award points for ALL missed rule types.
-- Trigger was missing + point_rules subtype=NULL → no points recorded at all.
--
-- Covers:
--   A. send_empathy    ← empathy_comments   (first top-level per author+channel)
--   B. birthday_wish   ← birthday_wishes    (first wish per from_name+key+year)
--   C. join_activity   ← activity_joins     (each join, dedup by existing points)
--   D. activity_checkin← activity_joins     (where reward_claimed = true)

-- ── A. send_empathy ──────────────────────────────────────────
insert into points (employee_name, type, subtype, amount, "desc", created_at)
select
  ec.author_name,
  'send_empathy',
  '',
  pr.pts,
  'ส่ง Empathy ให้เพื่อน',
  ec.created_at
from (
  select distinct on (author_name, post_id)
    author_name, post_id, created_at
  from empathy_comments
  where (parent_id is null or parent_id = '')
    and author_name is not null and author_name != ''
  order by author_name, post_id, created_at asc
) ec
join point_rules pr on pr.type = 'send_empathy' and pr.subtype = '' and pr.active = true
where not exists (
  select 1 from points p
  where p.employee_name = ec.author_name
    and p.type = 'send_empathy'
    and (p.created_at at time zone 'Asia/Bangkok')::date
      = (ec.created_at at time zone 'Asia/Bangkok')::date
);

-- ── B. birthday_wish ─────────────────────────────────────────
-- birthday_wishes.time is TEXT (no timestamp) → count-based dedup, same as migration 024
do $$
declare
  v_pts  integer;
  v_need integer;
  rec    record;
begin
  select pts into v_pts
  from point_rules
  where type = 'birthday_wish' and subtype = '' and active = true
  limit 1;

  if v_pts is not null then
    for rec in
      select
        bw.from_name                                                           as employee_name,
        count(distinct bw.birthday_key || '|' || coalesce(bw.year::text,''))  as wish_count,
        (select count(*) from points p
         where p.employee_name = bw.from_name
           and p.type = 'birthday_wish')                                       as pts_count
      from birthday_wishes bw
      where bw.from_name is not null and bw.from_name != ''
      group by bw.from_name
      having count(distinct bw.birthday_key || '|' || coalesce(bw.year::text,'')) > (
        select count(*) from points p2
        where p2.employee_name = bw.from_name
          and p2.type = 'birthday_wish'
      )
    loop
      v_need := rec.wish_count - rec.pts_count;
      for i in 1..v_need loop
        insert into points (employee_name, type, subtype, amount, "desc")
        values (rec.employee_name, 'birthday_wish', '', v_pts, 'อวยพรวันเกิดเพื่อน');
      end loop;
    end loop;
  end if;
end;
$$;

-- ── C. join_activity ─────────────────────────────────────────
insert into points (employee_name, type, subtype, amount, "desc", created_at)
select
  aj.employee_name,
  'join_activity',
  coalesce(aj.reward_type, ''),
  pr.pts,
  'เข้าร่วมกิจกรรม: ' || coalesce(aj.activity_name, ''),
  aj.stamped_at
from activity_joins aj
join point_rules pr
  on pr.type = 'join_activity'
  and pr.subtype = coalesce(aj.reward_type, '')
  and pr.active = true
where aj.employee_name is not null and aj.employee_name != ''
  and not exists (
    select 1 from points p
    where p.employee_name = aj.employee_name
      and p.type = 'join_activity'
      and p.subtype = coalesce(aj.reward_type, '')
      and (p.created_at at time zone 'Asia/Bangkok')::date
        = (aj.stamped_at at time zone 'Asia/Bangkok')::date
  );

-- ── D. activity_checkin ──────────────────────────────────────
insert into points (employee_name, type, subtype, amount, "desc", created_at)
select
  aj.employee_name,
  'activity_checkin',
  '',
  pr.pts,
  'Check-in กิจกรรม: ' || coalesce(aj.activity_name, ''),
  aj.stamped_at
from activity_joins aj
join point_rules pr on pr.type = 'activity_checkin' and pr.subtype = '' and pr.active = true
where aj.reward_claimed = true
  and aj.employee_name is not null and aj.employee_name != ''
  and not exists (
    select 1 from points p
    where p.employee_name = aj.employee_name
      and p.type = 'activity_checkin'
      and (p.created_at at time zone 'Asia/Bangkok')::date
        = (aj.stamped_at at time zone 'Asia/Bangkok')::date
  );