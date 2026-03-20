-- 033_quiz_multi_question.sql
-- Extend quiz_answers to support multiple questions per announcement

ALTER TABLE quiz_answers ADD COLUMN IF NOT EXISTS question_id text NOT NULL DEFAULT 'q1';

ALTER TABLE quiz_answers DROP CONSTRAINT IF EXISTS quiz_answers_ann_id_employee_name_key;

ALTER TABLE quiz_answers ADD CONSTRAINT quiz_answers_multi_key
  UNIQUE (ann_id, employee_name, question_id);
