-- ============================================================
-- 015_mental_advisor_card_bg.sql
-- Per-advisor card background: color | emoji | image
-- ============================================================

alter table mental_advisors
  add column if not exists card_bg_type  text,   -- 'color' | 'emoji' | 'image' | null = default
  add column if not exists card_bg_value text,   -- gradient CSS | emoji char | image URL
  add column if not exists card_bg_id    text;   -- storage path (image type only)
