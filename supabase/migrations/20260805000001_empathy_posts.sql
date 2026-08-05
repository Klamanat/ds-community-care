-- 20260805000001_empathy_posts.sql
-- Real "post" records for empathy kudos, separate from replies (empathy_comments).
-- Additive/non-invasive: empathy_comments, its RLS, and the existing points trigger
-- are left completely untouched — a DB trigger keeps empathy_posts in sync going
-- forward, so no client/RPC that already reads empathy_comments needs to change.

-- ── 1. Table ─────────────────────────────────────────────────
create table if not exists empathy_posts (
  id          text primary key,       -- reuses the originating empathy_comments.id
  channel_id  text not null,          -- recipient (matches empathy_comments.post_id)
  author_name text,
  text        text,
  created_at  timestamptz default now()
);
create index if not exists idx_empathy_posts_channel on empathy_posts(channel_id);
create index if not exists idx_empathy_posts_created  on empathy_posts(created_at desc);

alter table empathy_posts enable row level security;

drop policy if exists "public read"    on empathy_posts;
drop policy if exists "public insert"  on empathy_posts;
drop policy if exists "author update"  on empathy_posts;
drop policy if exists "author delete"  on empathy_posts;

create policy "public read"   on empathy_posts for select using (true);
create policy "public insert" on empathy_posts for insert with check (true);
create policy "author update" on empathy_posts for update using (true) with check (true);
create policy "author delete" on empathy_posts for delete using (true);

-- ── 2. Backfill from existing top-level comments ────────────
insert into empathy_posts (id, channel_id, author_name, text, created_at)
select id, post_id, author_name, text, created_at
from empathy_comments
where parent_id is null or parent_id = ''
on conflict (id) do nothing;

-- ── 3. Keep in sync going forward ───────────────────────────
-- Mirrors INSERT/UPDATE/DELETE of top-level rows (parent_id null) in
-- empathy_comments into empathy_posts. Replies never touch this table.
create or replace function sync_empathy_post()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  if TG_OP = 'DELETE' then
    if OLD.parent_id is null or OLD.parent_id = '' then
      delete from empathy_posts where id = OLD.id;
    end if;
    return OLD;
  end if;

  if NEW.parent_id is null or NEW.parent_id = '' then
    insert into empathy_posts (id, channel_id, author_name, text, created_at)
    values (NEW.id, NEW.post_id, NEW.author_name, NEW.text, NEW.created_at)
    on conflict (id) do update
      set author_name = excluded.author_name,
          text        = excluded.text;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_sync_empathy_post on empathy_comments;
create trigger trg_sync_empathy_post
  after insert or update or delete on empathy_comments
  for each row execute function sync_empathy_post();

grant select, insert, update, delete on empathy_posts to anon, authenticated;
