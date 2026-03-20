-- 024_backfill_activity_points.sql
-- Backfill points for ALL types from existing data
-- Dedup: skip if matching points record already exists

do $$
declare
  rec     record;
  v_pts   integer;
  v_sub   text;
  v_have  integer;
  v_need  integer;
begin
  set local row_security = off;

  -- ────────────────────────────────────────────────────────────
  -- 1. join_activity  (from activity_joins)
  -- ────────────────────────────────────────────────────────────
  for rec in
    select *
    from activity_joins
    where employee_name is not null and employee_name != ''
      and not exists (
        select 1 from points p
        where p.employee_name = activity_joins.employee_name
          and p.type          = 'join_activity'
          and p.subtype       = coalesce(activity_joins.reward_type, '')
          and p.created_at between activity_joins.stamped_at - interval '1 hour'
                               and activity_joins.stamped_at + interval '1 hour'
      )
  loop
    v_sub := coalesce(rec.reward_type, '');
    select pts into v_pts
    from point_rules
    where type = 'join_activity'
      and (subtype = v_sub or subtype = '') and active = true
    order by (subtype = v_sub) desc limit 1;

    if v_pts is not null and v_pts > 0 then
      insert into points(employee_name, type, subtype, amount, "desc", created_at)
      values (rec.employee_name, 'join_activity', v_sub, v_pts,
              'เข้าร่วมกิจกรรม: ' || coalesce(rec.activity_name, ''), rec.stamped_at);
    end if;
  end loop;

  -- ────────────────────────────────────────────────────────────
  -- 2. activity_checkin  (reward_claimed = true)
  -- ────────────────────────────────────────────────────────────
  for rec in
    select *
    from activity_joins
    where reward_claimed = true
      and employee_name is not null and employee_name != ''
      and not exists (
        select 1 from points p
        where p.employee_name = activity_joins.employee_name
          and p.type          = 'activity_checkin'
          and p.created_at between activity_joins.stamped_at - interval '1 hour'
                               and activity_joins.stamped_at + interval '1 hour'
      )
  loop
    select pts into v_pts
    from point_rules
    where type = 'activity_checkin' and active = true limit 1;

    if v_pts is not null and v_pts > 0 then
      insert into points(employee_name, type, subtype, amount, "desc", created_at)
      values (rec.employee_name, 'activity_checkin', '', v_pts,
              'Check-in กิจกรรม: ' || coalesce(rec.activity_name, ''), rec.stamped_at);
    end if;
  end loop;

  -- ────────────────────────────────────────────────────────────
  -- 3. send_empathy  (top-level comments only, parent_id is null/'')
  -- ────────────────────────────────────────────────────────────
  for rec in
    select *
    from empathy_comments
    where author_name is not null and author_name != ''
      and (parent_id is null or parent_id = '')
      and not exists (
        select 1 from points p
        where p.employee_name = empathy_comments.author_name
          and p.type          = 'send_empathy'
          and p.created_at between empathy_comments.created_at - interval '1 hour'
                               and empathy_comments.created_at + interval '1 hour'
      )
  loop
    select pts into v_pts
    from point_rules
    where type = 'send_empathy' and active = true limit 1;

    if v_pts is not null and v_pts > 0 then
      insert into points(employee_name, type, subtype, amount, "desc", created_at)
      values (rec.author_name, 'send_empathy', '', v_pts,
              'ส่ง Empathy ให้เพื่อน', rec.created_at);
    end if;
  end loop;

  -- ────────────────────────────────────────────────────────────
  -- 4. birthday_wish  (dedup by count: wishes sent vs points earned)
  --    birthday_wishes.time is TEXT → can't use timestamp window
  --    strategy: for each employee, award (wish_count - existing_points_count)
  -- ────────────────────────────────────────────────────────────
  select pts into v_pts
  from point_rules
  where type = 'birthday_wish' and active = true limit 1;

  if v_pts is not null and v_pts > 0 then
    for rec in
      select
        from_name                                    as employee_name,
        count(*)                                     as wish_count,
        (select count(*) from points p
         where p.employee_name = bw.from_name
           and p.type = 'birthday_wish')             as pts_count
      from birthday_wishes bw
      where from_name is not null and from_name != ''
      group by from_name
      having count(*) > (
        select count(*) from points p2
        where p2.employee_name = bw.from_name
          and p2.type = 'birthday_wish'
      )
    loop
      v_need := rec.wish_count - rec.pts_count;
      for i in 1..v_need loop
        insert into points(employee_name, type, subtype, amount, "desc")
        values (rec.employee_name, 'birthday_wish', '', v_pts, 'อวยพรวันเกิดเพื่อน');
      end loop;
    end loop;
  end if;

end;
$$;
