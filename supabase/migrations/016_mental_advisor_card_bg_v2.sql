-- ============================================================
-- 016_mental_advisor_card_bg_v2.sql
-- Separate emoji from bg type:
--   card_bg_type  : 'color' | 'image' | null  (emoji type removed)
--   card_bg_emoji : emoji char (independent, combinable with any bg type)
-- ============================================================

alter table mental_advisors
  add column if not exists card_bg_emoji text;

-- Migrate existing 'emoji'-type rows → move value to card_bg_emoji, clear type+value
update mental_advisors
  set card_bg_emoji = card_bg_value,
      card_bg_type  = null,
      card_bg_value = null
  where card_bg_type = 'emoji';
