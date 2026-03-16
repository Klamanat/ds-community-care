-- ============================================================
-- 001_initial_schema.sql
-- DS Community Care — all 28 tables
-- ============================================================

-- ── Settings ──────────────────────────────────────────────────
create table if not exists settings (
  key   text primary key,
  value text
);

-- ── Employees ─────────────────────────────────────────────────
create table if not exists employees (
  id               text primary key,
  emp_code         text unique,
  name             text not null,
  role             text,
  dept             text,
  img_url          text,
  img_id           text,
  grad             text,
  in_team          boolean default false,
  in_star_gang     boolean default false,
  star_gang_name   text,
  star_gang_role   text,
  star_gang_slogan text,
  month_idx        integer,
  bd_date          text,
  fallback_idx     integer
);

-- ── Birthdays (legacy — data now in employees) ───────────────
create table if not exists birthdays (
  key          text primary key,
  employee_id  text references employees(id),
  name         text,
  role         text,
  month_idx    integer,
  date         text,
  fallback_idx integer,
  img_url      text
);

-- ── Birthday Wishes ───────────────────────────────────────────
create table if not exists birthday_wishes (
  id           text primary key default gen_random_uuid()::text,
  birthday_key text,
  from_name    text,
  from_av_idx  integer,
  msg          text,
  time         text,
  year         integer,
  from_img_id  text
);

-- ── Empathy ───────────────────────────────────────────────────
create table if not exists empathy_comments (
  id          text primary key default gen_random_uuid()::text,
  post_id     text not null,
  parent_id   text,
  author_name text,
  text        text,
  created_at  timestamptz default now()
);
create index if not exists idx_empathy_comments_post_id on empathy_comments(post_id);

create table if not exists empathy_likes (
  post_id  text not null,
  user_key text not null,
  primary key (post_id, user_key)
);

create table if not exists comment_likes (
  comment_id text not null,
  user_key   text not null,
  primary key (comment_id, user_key)
);

create table if not exists channel_likes (
  channel_id text not null,
  user_key   text not null,
  primary key (channel_id, user_key)
);

create table if not exists empathy_photos (
  employee_id text primary key,
  img_url     text,
  updated_at  timestamptz default now()
);

-- ── Ideas ─────────────────────────────────────────────────────
create table if not exists ideas (
  id             text primary key default gen_random_uuid()::text,
  category       text,
  title          text,
  detail         text,
  submitter_name text,
  created_at     timestamptz default now(),
  status         text default 'pending'
);

-- ── Activities ────────────────────────────────────────────────
create table if not exists activities (
  id            text primary key default gen_random_uuid()::text,
  month_idx     integer,
  name          text,
  emoji         text,
  date          text,
  date_end      text,
  loc           text,
  desc          text,
  steps         text,
  join_url      text,
  join_open     boolean default true,
  join_label    text,
  join_open_at  text,
  join_close_at text,
  feedback_url  text,
  img_url       text,
  img_id        text,
  created_at    timestamptz default now()
);

create table if not exists activity_joins (
  id             text primary key default gen_random_uuid()::text,
  activity_id    text,
  activity_name  text,
  employee_name  text,
  stamped_at     timestamptz default now(),
  reward_claimed boolean default false,
  reward_type    text
);

-- ── Trainings (6 categories — same schema) ───────────────────
create table if not exists annual_trainings (
  id          text primary key default gen_random_uuid()::text,
  title       text,
  description text,
  instructor  text,
  section     text,
  created_at  timestamptz default now()
);

create table if not exists idp_trainings (
  id          text primary key default gen_random_uuid()::text,
  title       text,
  description text,
  instructor  text,
  section     text,
  created_at  timestamptz default now()
);

create table if not exists external_trainings (
  id          text primary key default gen_random_uuid()::text,
  title       text,
  description text,
  instructor  text,
  section     text,
  created_at  timestamptz default now()
);

create table if not exists compulsory_trainings (
  id          text primary key default gen_random_uuid()::text,
  title       text,
  description text,
  instructor  text,
  section     text,
  created_at  timestamptz default now()
);

create table if not exists superskills_trainings (
  id          text primary key default gen_random_uuid()::text,
  title       text,
  description text,
  instructor  text,
  section     text,
  created_at  timestamptz default now()
);

create table if not exists leadership_trainings (
  id          text primary key default gen_random_uuid()::text,
  title       text,
  description text,
  instructor  text,
  section     text,
  created_at  timestamptz default now()
);

create table if not exists training_registrations (
  id            text primary key default gen_random_uuid()::text,
  training_id   text,
  employee_id   text,
  employee_name text,
  registered_at timestamptz default now()
);

create table if not exists training_reviews (
  id            text primary key default gen_random_uuid()::text,
  training_id   text,
  employee_id   text,
  employee_name text,
  stars         integer,
  comment       text,
  created_at    timestamptz default now()
);

-- ── Site Visits ───────────────────────────────────────────────
create table if not exists site_visits (
  id          text primary key default gen_random_uuid()::text,
  title       text,
  description text,
  instructor  text,
  color       text,
  created_at  timestamptz default now()
);

create table if not exists site_votes (
  id            text primary key default gen_random_uuid()::text,
  site_id       text,
  employee_id   text,
  employee_name text,
  voted_at      timestamptz default now()
);

-- ── Auth (internal — Supabase Auth handles passwords) ────────
create table if not exists admins (
  username      text primary key,
  password_hash text,
  name          text,
  token         text,
  token_expires text
);

create table if not exists user_auth (
  employee_id   text primary key,
  password_hash text,
  token         text,
  token_expires text
);

-- ── Points ────────────────────────────────────────────────────
create table if not exists points (
  id            text primary key default gen_random_uuid()::text,
  employee_name text,
  type          text,
  subtype       text,
  amount        integer,
  desc          text,
  created_at    timestamptz default now()
);
create index if not exists idx_points_employee_name on points(employee_name);

create table if not exists point_rules (
  id      text primary key,
  type    text,
  subtype text,
  icon    text,
  name    text,
  desc    text,
  pts     integer,
  color   text,
  active  boolean default true
);

-- ── Blog ──────────────────────────────────────────────────────
create table if not exists blog_posts (
  id          text primary key default gen_random_uuid()::text,
  title       text,
  body        text,
  category    text,
  author_name text,
  author_id   text,
  created_at  timestamptz default now()
);

-- ── IDP ───────────────────────────────────────────────────────
create table if not exists idp_posters (
  id          text primary key default gen_random_uuid()::text,
  title       text,
  image_url   text,
  description text,
  date        text,
  created_at  timestamptz default now()
);

create table if not exists idp_videos (
  id          text primary key default gen_random_uuid()::text,
  title       text,
  video_url   text,
  description text,
  created_at  timestamptz default now()
);

-- ── Mental Health ─────────────────────────────────────────────
-- (not in ALL_SHEETS but exists in codebase)
create table if not exists mental_advisors (
  id          text primary key default gen_random_uuid()::text,
  name        text,
  role        text,
  employee_id text,
  img_id      text,
  img_url     text,
  "order"     integer default 0
);

create table if not exists consult_requests (
  id                   text primary key default gen_random_uuid()::text,
  counselor_employee_id text,
  message              text,
  employee_id          text,
  employee_name        text,
  created_at           timestamptz default now(),
  is_read              boolean default false,
  reply                text,
  counselor_name       text,
  replied_at           timestamptz
);

-- ── Site Suggestions ──────────────────────────────────────────
create table if not exists site_suggestions (
  id            text primary key default gen_random_uuid()::text,
  employee_id   text,
  employee_name text,
  location      text,
  description   text,
  reasons       text,
  created_at    timestamptz default now()
);
