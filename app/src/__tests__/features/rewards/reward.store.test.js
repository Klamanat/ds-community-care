// Unit tests for features/rewards/reward.store.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('../../../features/rewards/rewardService.js', () => ({
  fetchMyPoints: vi.fn(),
  fetchRewardRules: vi.fn(),
  postDailyCheckin: vi.fn(),
}))

vi.mock('../../../core/utils/cache.js', () => ({
  lsGet: vi.fn(() => null),
  lsSet: vi.fn(),
  lsDel: vi.fn(),
  stripBase64: vi.fn(arr => arr),
}))

import { useRewardStore } from '../../../features/rewards/reward.store.js'
import * as svc from '../../../features/rewards/rewardService.js'

describe('reward.store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    store = useRewardStore()
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('has total 0', () => {
      expect(store.total).toBe(0)
    })

    it('has level 0', () => {
      expect(store.level).toBe(0)
    })

    it('has isLoading false', () => {
      expect(store.isLoading).toBe(false)
    })

    it('has loadError empty', () => {
      expect(store.loadError).toBe('')
    })

    it('has checkedInToday false', () => {
      expect(store.checkedInToday).toBe(false)
    })

    it('has checkinLoading false', () => {
      expect(store.checkinLoading).toBe(false)
    })

    it('has loaded false', () => {
      expect(store.loaded).toBe(false)
    })

    it('has progress 0', () => {
      expect(store.progress).toBe(0)
    })
  })

  describe('load', () => {
    const today = new Date().toISOString().slice(0, 10)
    const ptsResponse = {
      total: 250,
      level: 1,
      levelName: '⭐ Member',
      nextPts: 300,
      nextName: '🔥 Active',
      history: [
        { id: 1, type: 'checkin', amount: 10, desc: 'Daily checkin', createdAt: today + 'T00:00:00Z' },
      ],
    }
    const rulesData = [{ id: 1, name: 'Checkin', pts: 10, active: true }]

    it('fetches points and rules', async () => {
      svc.fetchMyPoints.mockResolvedValue(ptsResponse)
      svc.fetchRewardRules.mockResolvedValue(rulesData)

      await store.load('Alice')

      expect(svc.fetchMyPoints).toHaveBeenCalledWith('Alice')
      expect(store.total).toBe(250)
      expect(store.level).toBe(1)
      expect(store.levelName).toBe('⭐ Member')
      expect(store.nextPts).toBe(300)
      expect(store.nextName).toBe('🔥 Active')
      expect(store.history).toEqual(ptsResponse.history)
      expect(store.rules).toEqual(rulesData)
      expect(store.loaded).toBe(true)
      expect(store.isLoading).toBe(false)
    })

    it('skips fetch if already loaded and not forced', async () => {
      svc.fetchMyPoints.mockResolvedValue(ptsResponse)
      svc.fetchRewardRules.mockResolvedValue(rulesData)

      await store.load('Alice')
      // fetchRewardRules is called 2x: once from fire-and-forget loadRules()
      // and once from Promise.all ternary (rules.value.length still 0 when it executes)
      expect(svc.fetchMyPoints).toHaveBeenCalledTimes(1)
      expect(svc.fetchRewardRules).toHaveBeenCalledTimes(2)

      // Reset mock counts
      vi.clearAllMocks()

      // Second call without force should skip
      await store.load('Alice')
      expect(svc.fetchMyPoints).not.toHaveBeenCalled()
    })

    it('re-fetches on force=true', async () => {
      svc.fetchMyPoints.mockResolvedValue(ptsResponse)
      svc.fetchRewardRules.mockResolvedValue(rulesData)

      await store.load('Alice')
      vi.clearAllMocks()

      svc.fetchMyPoints.mockResolvedValue({ ...ptsResponse, total: 500 })
      svc.fetchRewardRules.mockResolvedValue(rulesData)

      await store.load('Alice', true)
      expect(svc.fetchMyPoints).toHaveBeenCalledTimes(1)
      expect(store.total).toBe(500)
    })

    it('does nothing if employeeName is empty', async () => {
      await store.load('')
      expect(svc.fetchMyPoints).not.toHaveBeenCalled()
    })

    it('sets loadError on failure', async () => {
      svc.fetchMyPoints.mockRejectedValue(new Error('Connection failed'))

      await store.load('Alice')

      expect(store.loadError).toBe('Connection failed')
      expect(store.total).toBe(0)
      expect(store.isLoading).toBe(false)
    })

    it('syncs checkedInToday from history', async () => {
      svc.fetchMyPoints.mockResolvedValue(ptsResponse)
      svc.fetchRewardRules.mockResolvedValue(rulesData)

      await store.load('Alice')

      expect(store.checkedInToday).toBe(true)
    })

    it('leaves checkedInToday false when no checkin in history', async () => {
      const noCheckinHistory = {
        ...ptsResponse,
        history: [{ id: 2, type: 'earn', amount: 50, desc: 'Submitted idea', createdAt: '2026-05-17T00:00:00Z' }],
      }
      svc.fetchMyPoints.mockResolvedValue(noCheckinHistory)
      svc.fetchRewardRules.mockResolvedValue(rulesData)

      await store.load('Alice')

      expect(store.checkedInToday).toBe(false)
    })

    it('load sets default error message when error has no message', async () => {
      svc.fetchMyPoints.mockRejectedValue(new Error())

      await store.load('Alice')

      expect(store.loadError).toBe('โหลดคะแนนไม่สำเร็จ')
      expect(store.isLoading).toBe(false)
    })
  })

  describe('doCheckin', () => {
    it('returns alreadyCheckedIn if already checked in today', async () => {
      store.checkedInToday = true
      const result = await store.doCheckin('Alice')
      expect(result).toEqual({ alreadyCheckedIn: true })
      expect(svc.postDailyCheckin).not.toHaveBeenCalled()
    })

    it('returns alreadyCheckedIn if checkinLoading is true (prevents double-click)', async () => {
      store.checkinLoading = true
      const result = await store.doCheckin('Alice')
      expect(result).toEqual({ alreadyCheckedIn: true })
      expect(svc.postDailyCheckin).not.toHaveBeenCalled()
    })

    it('returns alreadyCheckedIn if no employeeName', async () => {
      const result = await store.doCheckin('')
      expect(result).toEqual({ alreadyCheckedIn: true })
      expect(svc.postDailyCheckin).not.toHaveBeenCalled()
    })

    it('performs checkin successfully', async () => {
      svc.postDailyCheckin.mockResolvedValue({ pts: 10 })
      svc.fetchMyPoints.mockResolvedValue({
        total: 260, level: 1, levelName: '⭐ Member', nextPts: 300,
        nextName: '🔥 Active', history: [],
      })
      svc.fetchRewardRules.mockResolvedValue([])

      const result = await store.doCheckin('Alice')

      expect(svc.postDailyCheckin).toHaveBeenCalledWith('Alice')
      expect(result).toEqual({ pts: 10, alreadyCheckedIn: false })
      expect(store.checkedInToday).toBe(true)
      expect(store.checkinLoading).toBe(false)
    })

    it('handles already checked in response from server', async () => {
      svc.postDailyCheckin.mockResolvedValue({ pts: 0 })

      const result = await store.doCheckin('Alice')

      // When pts is 0, store treats it as already checked in
      expect(result.alreadyCheckedIn).toBe(true)
      expect(result.pts).toBe(0)
      expect(store.checkedInToday).toBe(true)
    })

    it('returns error on failure', async () => {
      svc.postDailyCheckin.mockRejectedValue(new Error('Server error'))

      const result = await store.doCheckin('Alice')

      expect(result).toEqual({ alreadyCheckedIn: false, error: true })
      expect(store.checkinLoading).toBe(false)
    })
  })

  describe('progress (computed)', () => {
    it('returns 100 when at max level', () => {
      store.level = 4
      store.total = 1000
      expect(store.progress).toBe(100)
    })

    it('calculates correct percentage within a level', () => {
      store.level = 1
      store.total = 200 // min=100, next=300 → (200-100)/(300-100)=50%
      expect(store.progress).toBe(50)
    })

    it('returns 0 when total equals level min', () => {
      store.level = 1
      store.total = 100
      expect(store.progress).toBe(0)
    })
  })

  describe('reset', () => {
    it('clears all state', async () => {
      // Set some state
      store.total = 500
      store.level = 2
      store.levelName = '🔥 Active'
      store.nextPts = 600
      store.nextName = '💎 Champion'
      store.history = [{ id: 1, type: 'checkin', amount: 10 }]
      store.rules = [{ id: 1, name: 'Checkin', pts: 10 }]
      store.loaded = true
      store.checkedInToday = true
      localStorage.setItem('ds_checkin_date', '2026-05-18')

      store.reset()

      expect(store.total).toBe(0)
      expect(store.level).toBe(0)
      expect(store.levelName).toBe('🌱 Newcomer')
      expect(store.nextPts).toBe(100)
      expect(store.nextName).toBeNull()
      expect(store.history).toEqual([])
      expect(store.rules).toEqual([])
      expect(store.loaded).toBe(false)
      expect(store.loadError).toBe('')
      expect(store.checkedInToday).toBe(false)
      expect(localStorage.getItem('ds_checkin_date')).toBeNull()
    })
  })
})
