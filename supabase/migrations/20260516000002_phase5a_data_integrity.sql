-- ============================================================
-- Phase 5A — Data Integrity Quick Wins
-- DS Community Care
-- Fixes: SITE-VOTE-01, REWARDS-ADMIN-01, MENTAL-NAME-01
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. SITE-VOTE-01: Unique constraint on site_votes
--    Prevents duplicate votes per (site_id, employee_id)
-- ────────────────────────────────────────────────────────────

ALTER TABLE site_votes
  ADD COLUMN IF NOT EXISTS employee_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS site_votes_unique_emp
  ON site_votes (site_id, employee_id)
  WHERE employee_id IS NOT NULL;

-- ────────────────────────────────────────────────────────────
-- 2. REWARDS-ADMIN-01: RLS on point_rules and rewards tables
--    Only admin can write; all authenticated users can read
-- ────────────────────────────────────────────────────────────

-- point_rules
ALTER TABLE point_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "point_rules read authenticated" ON point_rules;
CREATE POLICY "point_rules read authenticated"
  ON point_rules FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "point_rules write admin" ON point_rules;
CREATE POLICY "point_rules write admin"
  ON point_rules FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- rewards
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rewards read authenticated" ON rewards;
CREATE POLICY "rewards read authenticated"
  ON rewards FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "rewards write admin" ON rewards;
CREATE POLICY "rewards write admin"
  ON rewards FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ────────────────────────────────────────────────────────────
-- 3. MENTAL-NAME-01: Add employee_id to consult_requests
--    Allows RLS to link requests to real employees
-- ────────────────────────────────────────────────────────────

ALTER TABLE consult_requests
  ADD COLUMN IF NOT EXISTS employee_id TEXT;

CREATE INDEX IF NOT EXISTS consult_requests_employee_id_idx
  ON consult_requests (employee_id)
  WHERE employee_id IS NOT NULL;

-- ────────────────────────────────────────────────────────────
-- DONE
-- ────────────────────────────────────────────────────────────
