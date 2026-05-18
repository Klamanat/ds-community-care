// Unit tests for core/services/presenceService.js
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockSupabase } = vi.hoisted(() => {
  const chain = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    upsert: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    order: vi.fn(() => chain),
    maybeSingle: vi.fn(() => chain),
    from: vi.fn(() => chain),
  }
  return { mockSupabase: chain }
})

vi.mock('../../../core/services/supabase.js', () => ({
  supabase: mockSupabase,
}))

import { pingPresence, fetchDailyActiveUsers, fetchOnlineUsers, fetchTodayUsers } from '../../../core/services/presenceService.js'

describe('presenceService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('pingPresence', () => {
    it('calls upsert on user_presence and user_presence_log', async () => {
      mockSupabase.upsert.mockResolvedValue({ data: null, error: null })

      await pingPresence('Alice', 'IT')

      // Should call upsert for user_presence
      expect(mockSupabase.from).toHaveBeenCalledWith('user_presence')
      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        { employee_name: 'Alice', dept: 'IT', last_seen_at: expect.any(String) },
        { onConflict: 'employee_name' },
      )

      // Should also call upsert for user_presence_log
      expect(mockSupabase.from).toHaveBeenCalledWith('user_presence_log')
      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        { date: expect.any(String), employee_name: 'Alice', dept: 'IT' },
        { onConflict: 'date,employee_name', ignoreDuplicates: true },
      )
    })

    it('does nothing when employeeName is empty', async () => {
      await pingPresence('', 'IT')
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    it('passes null dept when dept is not provided', async () => {
      mockSupabase.upsert.mockResolvedValue({ data: null, error: null })
      await pingPresence('Bob')
      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        { employee_name: 'Bob', dept: null, last_seen_at: expect.any(String) },
        { onConflict: 'employee_name' },
      )
    })
  })

  describe('fetchDailyActiveUsers', () => {
    it('returns grouped counts for given number of days', async () => {
      const today = new Date().toISOString().slice(0, 10)
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.gte.mockReturnValue(mockSupabase)
      mockSupabase.order.mockResolvedValue({
        data: [
          { date: today, employee_name: 'Alice' },
          { date: today, employee_name: 'Bob' },
          { date: yesterday, employee_name: 'Alice' },
        ],
      })

      const result = await fetchDailyActiveUsers(3)

      expect(result.length).toBe(3)
      // Today should have 2 users
      const todayEntry = result.find(r => r.date === today)
      expect(todayEntry.count).toBe(2)

      // Yesterday should have 1 user
      const yesterdayEntry = result.find(r => r.date === yesterday)
      expect(yesterdayEntry.count).toBe(1)
    })

    it('returns zeros for days with no activity', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.gte.mockReturnValue(mockSupabase)
      mockSupabase.order.mockResolvedValue({ data: [] })

      const result = await fetchDailyActiveUsers(7)
      expect(result.length).toBe(7)
      result.forEach(entry => {
        expect(entry.count).toBe(0)
      })
    })
  })

  describe('fetchOnlineUsers', () => {
    it('queries user_presence with correct time range', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.gte.mockReturnValue(mockSupabase)
      mockSupabase.order.mockResolvedValue({
        data: [
          { employee_name: 'Alice', dept: 'IT', last_seen_at: new Date().toISOString() },
        ],
      })

      const result = await fetchOnlineUsers(5)

      expect(mockSupabase.from).toHaveBeenCalledWith('user_presence')
      expect(mockSupabase.select).toHaveBeenCalledWith('employee_name, dept, last_seen_at')
      expect(mockSupabase.order).toHaveBeenCalledWith('last_seen_at', { ascending: false })
      expect(result).toHaveLength(1)
      expect(result[0].employee_name).toBe('Alice')
    })

    it('returns empty array when no data', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.gte.mockReturnValue(mockSupabase)
      mockSupabase.order.mockResolvedValue({ data: null })

      const result = await fetchOnlineUsers()
      expect(result).toEqual([])
    })
  })

  describe('fetchTodayUsers', () => {
    it('queries user_presence for last 24h', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.gte.mockReturnValue(mockSupabase)
      mockSupabase.order.mockResolvedValue({
        data: [
          { employee_name: 'Alice', dept: 'IT', last_seen_at: new Date().toISOString() },
          { employee_name: 'Bob', dept: 'HR', last_seen_at: new Date().toISOString() },
        ],
      })

      const result = await fetchTodayUsers()

      expect(mockSupabase.from).toHaveBeenCalledWith('user_presence')
      expect(result).toHaveLength(2)
    })

    it('returns empty array when no data', async () => {
      mockSupabase.from.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.gte.mockReturnValue(mockSupabase)
      mockSupabase.order.mockResolvedValue({ data: null })

      const result = await fetchTodayUsers()
      expect(result).toEqual([])
    })
  })
})
