-- 022_seed_point_rules.sql
-- Seed default point rules (insert if not already exists by type+subtype)

insert into point_rules (id, type, subtype, icon, name, desc, pts, color, active)
values
  ('rule_daily_checkin',       'daily_checkin',    '',          '📅', 'Check-in รายวัน',           'เช็คอินทุกวันเพื่อสะสมคะแนน',          5,   '#06C755', true),
  ('rule_send_empathy',        'send_empathy',      '',          '💌', 'ส่ง Empathy ให้เพื่อน',     'ส่งคำชื่นชมให้เพื่อนร่วมงาน',           10,  '#EC4899', true),
  ('rule_birthday_wish',       'birthday_wish',     '',          '🎂', 'อวยพรวันเกิดเพื่อน',        'ส่งคำอวยพรวันเกิดให้เพื่อนร่วมงาน',     5,   '#A855F7', true),
  ('rule_join_activity',       'join_activity',     '',          '🙌', 'เข้าร่วมกิจกรรม',           'เข้าร่วมกิจกรรมของบริษัท',              50,  '#6366F1', true),
  ('rule_join_co_host',        'join_activity',     'co_host',   '🤝', 'ร่วมจัดงาน (Co-host)',      'ร่วมเป็นผู้จัดงานกิจกรรม',              80,  '#4F46E5', true),
  ('rule_join_presenter',      'join_activity',     'presenter', '🎤', 'วิทยากร / ผู้นำเสนอ',       'เป็นวิทยากรหรือผู้นำเสนอในกิจกรรม',    100, '#7C3AED', true),
  ('rule_join_organizer',      'join_activity',     'organizer', '⚡', 'ผู้จัดงานหลัก',             'เป็นผู้จัดงานหลักของกิจกรรม',           150, '#6D28D9', true),
  ('rule_activity_checkin',    'activity_checkin',  '',          '📍', 'Check-in กิจกรรม',          'Check-in ณ สถานที่จัดกิจกรรม',          30,  '#3B82F6', true)
on conflict (id) do nothing;
