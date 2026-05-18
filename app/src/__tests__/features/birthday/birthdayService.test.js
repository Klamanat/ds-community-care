// Unit tests for features/birthday/birthdayService.js
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../core/services/supabase.js', () => {
  const chain = () => chain
  chain.select = vi.fn(() => chain)
  chain.insert = vi.fn(() => chain)
  chain.update = vi.fn(() => chain)
  chain.delete = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.order = vi.fn(() => chain)
  chain.in = vi.fn(() => chain)
  chain.single = vi.fn(() => chain)
  chain.maybeSingle = vi.fn(() => chain)
  chain.not = vi.fn(() => chain)
  chain.from = vi.fn(() => chain)
  return { supabase: chain }
})

vi.mock('../../../core/services/imageService.js', () => ({
  fetchImages: vi.fn(() => Promise.resolve({})),
  getCached: vi.fn(() => ''),
}))

import { supabase } from '../../../core/services/supabase.js'
import { fetchMonth, fetchWishes, addWish, deleteWish, updateWish, fetchEmployeeProfile } from '../../../features/birthday/birthdayService.js'

function mockData(result) {
  supabase.from().select().not().order.mockResolvedValue(result)
  supabase.from().select().eq().order.mockResolvedValue(result)
  supabase.from().select().maybeSingle.mockResolvedValue(result)
}

describe('birthdayService', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  describe('fetchMonth', () => {
    it('fetches employees by month_idx with wishes count', async () => {
      supabase.from().select().not().order.mockResolvedValue({ data: [{ id: 1, emp_code: 'E1', name: 'Alice', month_idx: 3, bd_date: '15', fallback_idx: 0 }], error: null })
      supabase.from().select().in.mockResolvedValue({ data: [{ birthday_key: 'bday_1' }], error: null })
      const result = await fetchMonth(3)
      expect(result).toHaveLength(1)
      expect(result[0].key).toBe('bday_1')
      expect(result[0].name).toBe('Alice')
    })

    it('returns empty array on empty data', async () => {
      supabase.from().select().not().order.mockResolvedValue({ data: null, error: null })
      expect(await fetchMonth(3)).toEqual([])
    })
  })

  describe('fetchWishes', () => {
    it('fetches and maps wishes', async () => {
      mockData({ data: [{ id: 1, from_name: 'Bob', from_av_idx: 1, from_img_id: '', msg: 'HBD!', time: '2026-01-01' }], error: null })
      const result = await fetchWishes('bday_1')
      expect(result).toHaveLength(1)
      expect(result[0].from).toBe('Bob')
    })
  })

  describe('addWish', () => {
    it('inserts a wish with truncated msg', async () => {
      supabase.from().insert().select().single.mockResolvedValue({ data: { id: 1 }, error: null })
      const result = await addWish('bday_1', 'Happy Birthday!', 'Alice', 0)
      expect(result).toEqual({ id: 1 })
    })

    it('truncates message to 500 chars', async () => {
      supabase.single.mockResolvedValue({ error: null })
      await addWish('bday_1', 'x'.repeat(600), 'Alice', 0)
      const args = supabase.insert.mock.calls[0][0]
      expect(args.msg.length).toBe(500)
    })
  })

  describe('deleteWish', () => {
    it('deletes by id', async () => {
      supabase.from().delete().eq.mockResolvedValue({ error: null })
      await deleteWish(1)
      expect(supabase.from).toHaveBeenCalledWith('birthday_wishes')
    })

    it('deletes with optional fromName filter', async () => {
      // Chain: .delete().eq('id', id).eq('from_name', fromName)
      // First .eq() returns chain, second .eq() is terminal
      supabase.eq.mockReset()
      let eqCalls = 0
      supabase.eq.mockImplementation(() => {
        eqCalls++
        if (eqCalls === 1) return supabase
        return Promise.resolve({ error: null })
      })
      await deleteWish(1, 'Alice')
      expect(supabase.eq).toHaveBeenCalledWith('from_name', 'Alice')
    })
  })

  describe('updateWish', () => {
    it('updates msg by id', async () => {
      supabase.from().update().eq.mockResolvedValue({ error: null })
      await updateWish(1, 'New message')
    })
  })

  describe('fetchEmployeeProfile', () => {
    it('returns null when employee not found', async () => {
      supabase.from().select().eq().maybeSingle.mockResolvedValue({ data: null })
      const result = await fetchEmployeeProfile('E1')
      expect(result).toBeNull()
    })

    it('returns data with imgId when employee found', async () => {
      supabase.maybeSingle.mockResolvedValue({
        data: { id: 1, emp_code: 'E1', name: 'Alice', role: 'Developer', img_url: '', img_id: 'img123', fallback_idx: 0 }
      })
      const result = await fetchEmployeeProfile('E1')
      expect(result).toEqual({
        employeeId: 1,
        empCode: 'E1',
        name: 'Alice',
        role: 'Developer',
        fallbackIdx: 0,
        photo: '',
        imgId: 'img123',
      })
    })
  })
})
