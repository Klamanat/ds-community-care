-- 20260805000006_empathy_post_cards_rpc.sql
-- New RPC for the Home page grid: one row PER POST (not aggregated per
-- person) since each empathy_posts row is already a unique entity. A
-- person praised multiple times now appears as multiple distinct cards,
-- each opening its own post detail — unlike get_empathy_people(), which
-- stays as the one-row-per-person aggregate used for the "who to praise"
-- picker grid inside the compose flow.
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
  order by p.created_at desc;
$$;
