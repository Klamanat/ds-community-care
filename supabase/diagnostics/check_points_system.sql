-- ============================================================
-- check_points_system.sql
-- Run in Supabase SQL editor to diagnose why points aren't saving
-- ============================================================

-- 1. Check if send_empathy rule exists and is active
SELECT id, type, subtype, pts, active
FROM point_rules
WHERE type = 'send_empathy';

-- 2. Test award_points directly
SELECT award_points('__diag_test__', 'send_empathy', '', 'diagnostic') as awarded_pts;

-- 3. Check if test row was inserted
SELECT * FROM points WHERE employee_name = '__diag_test__';

-- 4. Clean up
DELETE FROM points WHERE employee_name = '__diag_test__';

-- 5. Check trigger exists on empathy_comments
SELECT trigger_name, event_manipulation, action_timing, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'empathy_comments';

-- 6. Check if there are PRIOR empathy_comments blocking dedup
-- (replace 'ชื่อผู้ส่ง' and 'empCodeผู้รับ' with actual values)
SELECT COUNT(*) as prior_rows
FROM empathy_comments
WHERE author_name = 'ชื่อผู้ส่ง'
  AND post_id     = 'empCodeผู้รับ'
  AND (parent_id IS NULL OR parent_id = '');
