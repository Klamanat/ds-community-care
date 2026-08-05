-- 20260805000004_empathy_posts_id_default.sql
-- empathy_posts.id had no default — fine while only backfill/trigger code
-- generated ids explicitly, but now the client inserts directly and needs one.
alter table empathy_posts alter column id set default gen_random_uuid()::text;
