-- 20260806000001_post_cards_sort_by_activity.sql
-- Home page grid should bump a post back to the top when it gets a new
-- comment, not just sort by when the post itself was created.
create or replace function get_empathy_post_cards()
returns table (
  id          text,
  channel_id  text,
  emp_code    text,
  rec_name    text,
  rec_role    text,
  img_url     text,
  img_id      text,
  author_name text,
  text        text,
  created_at  timestamptz
) language sql security definer as $$
  select
    p.id,
    p.channel_id,
    coalesce(e.emp_code, '')            as emp_code,
    coalesce(e.name, p.channel_id)       as rec_name,
    coalesce(e.role, '')                as rec_role,
    coalesce(ep.img_url, e.img_url, '')  as img_url,
    coalesce(e.img_id, '')               as img_id,
    p.author_name,
    p.text,
    p.created_at
  from empathy_posts p
  left join employees e
    on e.emp_code = p.channel_id or e.id = p.channel_id
  left join empathy_photos ep
    on ep.employee_id = coalesce(e.id, p.channel_id)
  left join (
    select empathy_post_id, max(created_at) as latest_comment
    from empathy_comments
    where empathy_post_id is not null
    group by empathy_post_id
  ) lc on lc.empathy_post_id = p.id
  order by greatest(p.created_at, coalesce(lc.latest_comment, p.created_at)) desc;
$$;
