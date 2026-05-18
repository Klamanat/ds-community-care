// Unit tests for features/rewards/rewardService.js
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
import {
  fetchMyPoints,
  fetchRewardRules,
  postDailyCheckin,
  adminAddRewardRule,
  adminUpdateRewardRule,
  adminDeleteRewardRule,
  fetchRewards,
  adminFetchRewards,
  adminAddReward,
  adminUpdateReward,
  adminDeleteReward,
} from '../../../features/rewards/rewardService.js'

describe('rewardService', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('fetchMyPoints', () => {
    it('returns points with level calculation for 0 points', async () => {
      supabase.rpc
        .mockResolvedValueOnce({ data: 0, error: null })
        .mockResolvedValueOnce({ data: [], error: null })

      const result = await fetchMyPoints('Alice')

      expect(result.total).toBe(0)
      expect(result.level).toBe(0)
      expect(result.levelName).toBe('🌱 Newcomer')
      expect(result.nextPts).toBe(100)
      expect(result.history).toEqual([])
    })

    it('returns points with level calculation for champion tier', async () => {
      supabase.rpc
        .mockResolvedValueOnce({ data: 750, error: null })
        .mockResolvedValueOnce({ data: [{ id: 1, type: 'checkin', amount: 5, created_at: '2025-01-01' }], error: null })

      const result = await fetchMyPoints('Alice')

      expect(result.total).toBe(750)
      expect(result.level).toBe(3)
      expect(result.levelName).toBe('💎 Champion')
      expect(result.nextPts).toBe(1000)
      expect(result.history).toHaveLength(1)
      expect(result.history[0].type).toBe('checkin')
    })

    it('returns level 4 for legend tier (1000+)', async () => {
      supabase.rpc
        .mockResolvedValueOnce({ data: 1500, error: null })
        .mockResolvedValueOnce({ data: [], error: null })

      const result = await fetchMyPoints('Bob')

      expect(result.total).toBe(1500)
      expect(result.level).toBe(4)
      expect(result.levelName).toBe('👑 Legend')
      expect(result.nextPts).toBeNull()
    })

    it('throws on error', async () => {
      supabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'DB fail' } })

      await expect(fetchMyPoints('Alice')).rejects.toThrow('DB fail')
    })

    it('returns Newcomer level for negative points', async () => {
      supabase.rpc
        .mockResolvedValueOnce({ data: -5, error: null })
        .mockResolvedValueOnce({ data: [], error: null })

      const result = await fetchMyPoints('Alice')

      expect(result.total).toBe(-5)
      expect(result.level).toBe(0)
      expect(result.levelName).toBe('🌱 Newcomer')
      expect(result.nextPts).toBe(100)
      expect(result.nextName).toBe('⭐ Member')
    })
  })

  describe('fetchRewardRules', () => {
    it('returns active rules ordered by pts descending', async () => {
      const mockRules = [
        { id: 1, name: 'Check-in', pts: 5, active: true },
        { id: 2, name: 'Comment', pts: 3, active: true },
      ]
      // Source chain: from('point_rules').select('*').eq('active', true).order('pts', ...)
      // eq is INTERMEDIATE -> restore; order is TERMINAL
      supabase.eq.mockImplementation(() => supabase)
      supabase.order.mockResolvedValue({ data: mockRules, error: null })

      const result = await fetchRewardRules()

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Check-in')
      expect(supabase.from).toHaveBeenCalledWith('point_rules')
      expect(supabase.select).toHaveBeenCalledWith('*')
      expect(supabase.eq).toHaveBeenCalledWith('active', true)
      expect(supabase.order).toHaveBeenCalled()
    })

    it('returns empty array when no data', async () => {
      supabase.eq.mockImplementation(() => supabase)
      supabase.order.mockResolvedValue({ data: null, error: null })

      const result = await fetchRewardRules()
      expect(result).toEqual([])
    })

    it('throws on error', async () => {
      supabase.eq.mockImplementation(() => supabase)
      supabase.order.mockResolvedValue({ data: null, error: { message: 'Fail' } })

      await expect(fetchRewardRules()).rejects.toThrow('Fail')
    })
  })

  describe('postDailyCheckin', () => {
    it('calls rpc and returns pts', async () => {
      supabase.rpc.mockResolvedValue({ data: 5, error: null })

      const result = await postDailyCheckin('Alice')

      expect(result.pts).toBe(5)
      expect(supabase.rpc).toHaveBeenCalledWith('daily_checkin', { p_emp_name: 'Alice' })
    })

    it('returns 0 when data is null', async () => {
      supabase.rpc.mockResolvedValue({ data: null, error: null })

      const result = await postDailyCheckin('Alice')
      expect(result.pts).toBe(0)
    })

    it('throws on error', async () => {
      supabase.rpc.mockResolvedValue({ data: null, error: { message: 'Fail' } })

      await expect(postDailyCheckin('Alice')).rejects.toThrow('Fail')
    })
  })

  describe('adminAddRewardRule', () => {
    it('inserts rule and returns data via single', async () => {
      const inserted = { id: 1, name: 'Check-in', pts: 5, active: true }
      // Source chain: from('point_rules').insert(fields).select().single()
      // single is TERMINAL
      supabase.single.mockResolvedValue({ data: inserted, error: null })

      const result = await adminAddRewardRule('token', { name: 'Check-in', pts: 5 })

      expect(result).toEqual(inserted)
      expect(supabase.from).toHaveBeenCalledWith('point_rules')
      expect(supabase.insert).toHaveBeenCalled()
      expect(supabase.select).toHaveBeenCalled()
    })

    it('throws on error', async () => {
      supabase.single.mockResolvedValue({ data: null, error: { message: 'Fail' } })

      await expect(adminAddRewardRule('token', {})).rejects.toThrow('Fail')
    })
  })

  describe('adminUpdateRewardRule', () => {
    it('updates rule and returns data via single', async () => {
      const updated = { id: 1, name: 'Check-in', pts: 10, active: true }
      // Source chain: from('point_rules').update(fields).eq('id', id).select().single()
      // eq is INTERMEDIATE -> restore; single is TERMINAL
      supabase.eq.mockImplementation(() => supabase)
      supabase.single.mockResolvedValue({ data: updated, error: null })

      const result = await adminUpdateRewardRule('token', 1, { pts: 10 })

      expect(result).toEqual(updated)
      expect(supabase.from).toHaveBeenCalledWith('point_rules')
      expect(supabase.update).toHaveBeenCalled()
      expect(supabase.eq).toHaveBeenCalledWith('id', 1)
      expect(supabase.select).toHaveBeenCalled()
    })

    it('throws on error', async () => {
      supabase.eq.mockImplementation(() => supabase)
      supabase.single.mockResolvedValue({ data: null, error: { message: 'Fail' } })

      await expect(adminUpdateRewardRule('token', 1, {})).rejects.toThrow('Fail')
    })
  })

  describe('adminDeleteRewardRule', () => {
    it('deletes rule by id', async () => {
      // Source chain: from('point_rules').delete().eq('id', id)
      // eq is TERMINAL (called once)
      supabase.eq.mockResolvedValue({ error: null })

      await adminDeleteRewardRule('token', 5)

      expect(supabase.from).toHaveBeenCalledWith('point_rules')
      expect(supabase.delete).toHaveBeenCalled()
      expect(supabase.eq).toHaveBeenCalledWith('id', 5)
    })

    it('throws on error', async () => {
      supabase.eq.mockResolvedValue({ error: { message: 'Fail' } })

      await expect(adminDeleteRewardRule('token', 5)).rejects.toThrow('Fail')
    })
  })

  describe('fetchRewards (active only)', () => {
    it('returns mapped active rewards ordered by pts_cost', async () => {
      const mockData = [
        { id: 1, name: 'Gift Card', pts_cost: 100, active: true, image_url: 'img.jpg', stock: 5, created_at: '2025-01-01' },
        { id: 2, name: 'Mug', pts_cost: 50, active: true, image_url: '', stock: null, created_at: '2025-01-02' },
      ]
      // Source chain: from('rewards').select('*').eq('active', true).order('pts_cost', ...)
      // eq is INTERMEDIATE -> restore; order is TERMINAL
      supabase.eq.mockImplementation(() => supabase)
      supabase.order.mockResolvedValue({ data: mockData, error: null })

      const result = await fetchRewards()

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Gift Card')
      expect(result[0].ptsCost).toBe(100)
      expect(result[0].active).toBe(true)
      expect(result[1].stock).toBeNull()
      expect(supabase.from).toHaveBeenCalledWith('rewards')
      expect(supabase.select).toHaveBeenCalledWith('*')
      expect(supabase.eq).toHaveBeenCalledWith('active', true)
      expect(supabase.order).toHaveBeenCalled()
    })

    it('returns empty array when no data', async () => {
      supabase.eq.mockImplementation(() => supabase)
      supabase.order.mockResolvedValue({ data: null, error: null })

      const result = await fetchRewards()
      expect(result).toEqual([])
    })

    it('throws on error', async () => {
      supabase.eq.mockImplementation(() => supabase)
      supabase.order.mockResolvedValue({ data: null, error: { message: 'Fail' } })

      await expect(fetchRewards()).rejects.toThrow('Fail')
    })

    it('maps reward with zero stock correctly', async () => {
      const mockData = [
        { id: 1, name: 'Gift Card', pts_cost: 100, active: true, image_url: 'img.jpg', stock: 0, created_at: '2025-01-01' },
      ]
      supabase.eq.mockImplementation(() => supabase)
      supabase.order.mockResolvedValue({ data: mockData, error: null })

      const result = await fetchRewards()

      expect(result).toHaveLength(1)
      expect(result[0].stock).toBe(0) // 0 ?? null → 0, not null
    })
  })

  describe('adminFetchRewards (all)', () => {
    it('returns all rewards ordered by pts_cost', async () => {
      const mockData = [
        { id: 1, name: 'Gift Card', pts_cost: 100, active: true, image_url: '', stock: 5, created_at: '2025-01-01' },
        { id: 2, name: 'Old Mug', pts_cost: 50, active: false, image_url: '', stock: null, created_at: '2025-01-02' },
      ]
      // Source chain: from('rewards').select('*').order('pts_cost', ...)
      // order is TERMINAL (called once, no eq in between)
      supabase.order.mockResolvedValue({ data: mockData, error: null })

      const result = await adminFetchRewards()

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Gift Card')
      expect(result[1].active).toBe(false)
      expect(supabase.from).toHaveBeenCalledWith('rewards')
      expect(supabase.select).toHaveBeenCalledWith('*')
      expect(supabase.order).toHaveBeenCalled()
    })

    it('throws on error', async () => {
      supabase.order.mockResolvedValue({ data: null, error: { message: 'Fail' } })

      await expect(adminFetchRewards()).rejects.toThrow('Fail')
    })
  })

  describe('adminAddReward', () => {
    it('inserts reward and returns mapped data via single', async () => {
      const inserted = { id: 1, name: 'New Reward', pts_cost: 200, active: true, image_url: '', stock: 10, created_at: '2025-03-01' }
      // Source chain: from('rewards').insert(fields).select().single()
      // single is TERMINAL
      supabase.single.mockResolvedValue({ data: inserted, error: null })

      const result = await adminAddReward({ name: 'New Reward', ptsCost: 200 })

      expect(result.id).toBe(1)
      expect(result.name).toBe('New Reward')
      expect(result.ptsCost).toBe(200)
      expect(supabase.from).toHaveBeenCalledWith('rewards')
      expect(supabase.insert).toHaveBeenCalled()
      expect(supabase.select).toHaveBeenCalled()
    })

    it('throws on error', async () => {
      supabase.single.mockResolvedValue({ data: null, error: { message: 'Fail' } })

      await expect(adminAddReward({})).rejects.toThrow('Fail')
    })
  })

  describe('adminUpdateReward', () => {
    it('updates reward and returns mapped data via single', async () => {
      const updated = { id: 1, name: 'Updated', pts_cost: 150, active: true, image_url: '', stock: 5, created_at: '2025-03-01' }
      // Source chain: from('rewards').update(fields).eq('id', id).select().single()
      // eq is INTERMEDIATE -> restore; single is TERMINAL
      supabase.eq.mockImplementation(() => supabase)
      supabase.single.mockResolvedValue({ data: updated, error: null })

      const result = await adminUpdateReward(1, { name: 'Updated' })

      expect(result.id).toBe(1)
      expect(result.name).toBe('Updated')
      expect(result.ptsCost).toBe(150)
      expect(supabase.from).toHaveBeenCalledWith('rewards')
      expect(supabase.update).toHaveBeenCalled()
      expect(supabase.eq).toHaveBeenCalledWith('id', 1)
      expect(supabase.select).toHaveBeenCalled()
    })

    it('throws on error', async () => {
      supabase.eq.mockImplementation(() => supabase)
      supabase.single.mockResolvedValue({ data: null, error: { message: 'Fail' } })

      await expect(adminUpdateReward(1, {})).rejects.toThrow('Fail')
    })
  })

  describe('adminDeleteReward', () => {
    it('deletes reward by id', async () => {
      // Source chain: from('rewards').delete().eq('id', id)
      // eq is TERMINAL (called once)
      supabase.eq.mockResolvedValue({ error: null })

      await adminDeleteReward(5)

      expect(supabase.from).toHaveBeenCalledWith('rewards')
      expect(supabase.delete).toHaveBeenCalled()
      expect(supabase.eq).toHaveBeenCalledWith('id', 5)
    })

    it('throws on error', async () => {
      supabase.eq.mockResolvedValue({ error: { message: 'Fail' } })

      await expect(adminDeleteReward(5)).rejects.toThrow('Fail')
    })
  })

  describe('fetchMyPoints edge cases', () => {
    it('returns Newcomer for negative points (LEVELS fallback)', async () => {
      supabase.rpc
        .mockResolvedValueOnce({ data: -5, error: null })
        .mockResolvedValueOnce({ data: [], error: null })

      const result = await fetchMyPoints('Bob')
      expect(result.level).toBe(0)
      expect(result.levelName).toBe('🌱 Newcomer')
    })
  })

  describe('fetchRewards edge cases', () => {
    it('maps reward with zero stock correctly (?? operator)', async () => {
      supabase.eq.mockImplementation(() => supabase)
      supabase.order.mockResolvedValue({
        data: [{ id: 1, name: 'Free Item', pts_cost: 0, active: true, image_url: '', stock: 0, image_id: '', created_at: '' }],
        error: null,
      })

      const result = await fetchRewards()
      expect(result[0].ptsCost).toBe(0)
      expect(result[0].stock).toBe(0) // 0 ?? null === 0
    })

    it('throws on error', async () => {
      supabase.eq.mockImplementation(() => supabase)
      supabase.order.mockResolvedValue({ data: null, error: { message: 'DB fail' } })
      await expect(fetchRewards()).rejects.toThrow('DB fail')
    })
  })
})
