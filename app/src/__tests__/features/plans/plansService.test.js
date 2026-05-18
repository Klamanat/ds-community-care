// Unit tests for features/plans/plansService.js
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
  chain.from = vi.fn(() => chain)
  return { supabase: chain }
})

vi.mock('../../../core/services/edgeFunctions.js', () => ({
  uploadImage: vi.fn(),
}))

import { supabase } from '../../../core/services/supabase.js'
import { uploadImage as edgeUpload } from '../../../core/services/edgeFunctions.js'
import { fetchAll, addPlan, updatePlan, deletePlan, uploadImage } from '../../../features/plans/plansService.js'

const mockPlanRow = {
  id: 1,
  year_month: '2026-05',
  title: 'May Plan',
  description: 'Team building activities',
  poster_url: 'https://example.com/poster.jpg',
  poster_id: 'plans/poster.jpg',
  created_at: '2026-05-01T00:00:00Z',
}

const mockMappedPlan = {
  id: 1,
  yearMonth: '2026-05',
  title: 'May Plan',
  description: 'Team building activities',
  posterUrl: 'https://example.com/poster.jpg',
  posterId: 'plans/poster.jpg',
  createdAt: '2026-05-01T00:00:00Z',
}

describe('plansService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchAll', () => {
    it('returns mapped plans from Supabase ordered by year_month desc', async () => {
      supabase.order.mockResolvedValue({ data: [mockPlanRow], error: null })

      const result = await fetchAll()

      expect(supabase.from).toHaveBeenCalledWith('monthly_plans')
      expect(supabase.select).toHaveBeenCalledWith('*')
      expect(supabase.order).toHaveBeenCalledWith('year_month', { ascending: false })
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(mockMappedPlan)
    })

    it('returns empty array when data is null', async () => {
      supabase.order.mockResolvedValue({ data: null, error: null })

      const result = await fetchAll()

      expect(result).toEqual([])
    })

    it('returns empty array when data is empty array', async () => {
      supabase.order.mockResolvedValue({ data: [], error: null })

      const result = await fetchAll()

      expect(result).toEqual([])
    })

    it('throws on Supabase error', async () => {
      supabase.order.mockResolvedValue({ data: null, error: { message: 'fetch failed' } })

      await expect(fetchAll()).rejects.toThrow('fetch failed')
    })

    it('maps snake_case fields to camelCase', async () => {
      supabase.order.mockResolvedValue({
        data: [{
          id: 42,
          year_month: '2026-06',
          title: 'June Plan',
          description: 'Desc',
          poster_url: 'url',
          poster_id: 'id',
          created_at: '2026-06-01T00:00:00Z',
        }],
        error: null,
      })

      const result = await fetchAll()

      expect(result[0]).toEqual({
        id: 42,
        yearMonth: '2026-06',
        title: 'June Plan',
        description: 'Desc',
        posterUrl: 'url',
        posterId: 'id',
        createdAt: '2026-06-01T00:00:00Z',
      })
    })

    it('handles missing optional fields gracefully', async () => {
      supabase.order.mockResolvedValue({
        data: [{ id: 1 }],
        error: null,
      })

      const result = await fetchAll()

      expect(result[0]).toEqual({
        id: 1,
        yearMonth: '',
        title: '',
        description: '',
        posterUrl: '',
        posterId: '',
        createdAt: '',
      })
    })
  })

  describe('addPlan', () => {
    const input = {
      yearMonth: '2026-07',
      title: 'July Plan',
      description: 'Q3 kickoff',
      posterUrl: 'https://example.com/july.jpg',
      posterId: 'plans/july.jpg',
    }

    it('inserts a new plan with correct field mapping', async () => {
      supabase.single.mockResolvedValue({ data: mockPlanRow, error: null })

      const result = await addPlan(input)

      expect(supabase.from).toHaveBeenCalledWith('monthly_plans')
      expect(supabase.insert).toHaveBeenCalledWith({
        year_month: '2026-07',
        title: 'July Plan',
        description: 'Q3 kickoff',
        poster_url: 'https://example.com/july.jpg',
        poster_id: 'plans/july.jpg',
      })
      expect(supabase.select).toHaveBeenCalled()
      expect(supabase.single).toHaveBeenCalled()
      expect(result).toEqual(mockMappedPlan)
    })

    it('throws on Supabase error', async () => {
      supabase.single.mockResolvedValue({ data: null, error: { message: 'insert failed' } })

      await expect(addPlan(input)).rejects.toThrow('insert failed')
    })
  })

  describe('updatePlan', () => {
    const planId = 1
    const input = {
      yearMonth: '2026-08',
      title: 'Updated Plan',
      description: 'Updated desc',
      posterUrl: 'https://example.com/updated.jpg',
      posterId: 'plans/updated.jpg',
    }

    it('updates plan by id with correct field mapping', async () => {
      supabase.single.mockResolvedValue({ data: { ...mockPlanRow, title: 'Updated Plan' }, error: null })

      const result = await updatePlan(planId, input)

      expect(supabase.from).toHaveBeenCalledWith('monthly_plans')
      expect(supabase.update).toHaveBeenCalledWith({
        year_month: '2026-08',
        title: 'Updated Plan',
        description: 'Updated desc',
        poster_url: 'https://example.com/updated.jpg',
        poster_id: 'plans/updated.jpg',
      })
      expect(supabase.eq).toHaveBeenCalledWith('id', 1)
      expect(supabase.select).toHaveBeenCalled()
      expect(supabase.single).toHaveBeenCalled()
      expect(result.title).toBe('Updated Plan')
    })

    it('throws on Supabase error', async () => {
      supabase.single.mockResolvedValue({ data: null, error: { message: 'update failed' } })

      await expect(updatePlan(planId, input)).rejects.toThrow('update failed')
    })
  })

  describe('deletePlan', () => {
    it('deletes plan by id', async () => {
      supabase.eq.mockResolvedValue({ error: null })

      await deletePlan(42)

      expect(supabase.from).toHaveBeenCalledWith('monthly_plans')
      expect(supabase.delete).toHaveBeenCalled()
      expect(supabase.eq).toHaveBeenCalledWith('id', 42)
    })

    it('throws on Supabase error', async () => {
      supabase.eq.mockResolvedValue({ error: { message: 'delete failed' } })

      await expect(deletePlan(42)).rejects.toThrow('delete failed')
    })
  })

  describe('uploadImage', () => {
    it('delegates to edgeFunctions uploadImage with correct args', async () => {
      edgeUpload.mockResolvedValue({ id: 'img-1', url: 'https://example.com/img.jpg' })

      const result = await uploadImage('base64data', 'poster.jpg')

      expect(edgeUpload).toHaveBeenCalledWith('base64data', 'poster.jpg', 'plans')
      expect(result).toEqual({ id: 'img-1', url: 'https://example.com/img.jpg' })
    })

    it('uses default fileName "plan.jpg" when not provided', async () => {
      edgeUpload.mockResolvedValue({ id: 'img-2', url: 'https://example.com/default.jpg' })

      const result = await uploadImage('base64data')

      expect(edgeUpload).toHaveBeenCalledWith('base64data', 'plan.jpg', 'plans')
      expect(result).toEqual({ id: 'img-2', url: 'https://example.com/default.jpg' })
    })

    it('forwards errors from edge function', async () => {
      edgeUpload.mockRejectedValue(new Error('upload failed'))

      await expect(uploadImage('bad-data', 'fail.jpg')).rejects.toThrow('upload failed')
    })
  })
})
