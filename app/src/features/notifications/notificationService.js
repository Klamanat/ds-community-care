// notificationService.js — Notifications via Supabase RPC

import { supabase } from '../../core/services/supabase.js'

/**
 * Fetch notifications for an employee.
 * Uses RPC get_notifications(emp_name, month_idx).
 */
export async function fetchNotifications(employeeName, monthIdx) {
  const { data, error } = await supabase.rpc('get_notifications', {
    p_emp_name:  employeeName,
    p_month_idx: monthIdx,
  })
  if (error) throw new Error(error.message)
  return data || []
}
