-- ============================================================
-- 013_passcode_rpc.sql
-- User-set passcode with bcrypt hashing
-- NULL = first login (user must set passcode)
-- ============================================================

create extension if not exists pgcrypto;

-- Hash and store passcode (only if admin has enabled it: passcode = '')
create or replace function set_user_passcode(p_emp_code text, p_passcode text)
returns boolean language plpgsql security definer as $$
begin
  update employees
  set passcode = crypt(p_passcode, gen_salt('bf', 8))
  where emp_code = p_emp_code
    and passcode = '';
  return found;
end;
$$;

-- Verify passcode — returns true/false
create or replace function verify_user_passcode(p_emp_code text, p_passcode text)
returns boolean language plpgsql security definer as $$
declare v_stored text;
begin
  select passcode into v_stored from employees where emp_code = p_emp_code limit 1;
  if v_stored is null or v_stored = '' then return false; end if;
  return v_stored = crypt(p_passcode, v_stored);
end;
$$;

-- Admin reset: set passcode = null so user re-sets on next login
-- (admin can call: update employees set passcode = null where id = ...)
