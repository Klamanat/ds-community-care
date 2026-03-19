-- Add optional passcode to employees
-- NULL or empty = no passcode required
alter table employees add column if not exists passcode text;
