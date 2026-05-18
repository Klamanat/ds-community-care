// Unit tests for features/plans/plansService.js & notifications/notificationService.js
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../core/services/supabase.js', () => {
  const chain = () => chain
  chain.select = vi.fn(() => chain)
  chain.insert = vi.fn(() => chain)
  chain.update = vi.fn(() => chain)
  chain.delete = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.order = vi.fn(() => chain)
  chain.single = vi.fn(() => chain)
  chain.rpc = vi.fn(() => chain)
  chain.from = vi.fn(() => chain)
  return { supabase: chain }
})

import { supabase } from '../../../core/services/supabase.js'
import { fetchAll } from '../../../features/plans/plansService.js'
import { fetchNotifications } from '../../../features/notifications/notificationService.js'

describe('plansService', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('fetchAll returns plans', async () => {
    supabase.order.mockResolvedValue({ data: [{ id: 1, title: 'Q1 Plan', year_month: '2026-01' }], error: null })
    const result = await fetchAll()
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Q1 Plan')
  })

  it('handles null data', async () => {
    supabase.order.mockResolvedValue({ data: null, error: null })
    const result = await fetchAll()
    expect(result).toEqual([])
  })
})

describe('notificationService', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('fetchNotifications calls RPC', async () => {
    supabase.rpc.mockResolvedValue({ data: [{ id: 1, title: 'Notif' }], error: null })
    const result = await fetchNotifications('Alice', 5)
    expect(supabase.rpc).toHaveBeenCalledWith('get_notifications', { p_emp_name: 'Alice', p_month_idx: 5 })
    expect(result).toHaveLength(1)
  })

  it('returns empty array on error', async () => {
    supabase.rpc.mockResolvedValue({ data: null, error: { message: 'fail' } })
    await expect(fetchNotifications('Alice', 5)).rejects.toThrow('fail')
  })
})
