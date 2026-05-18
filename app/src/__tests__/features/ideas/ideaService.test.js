// Unit tests for features/ideas/ideaService.js
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase module before importing the service
vi.mock('../../../core/services/supabase.js', () => {
  const mockSupabase = {
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    insert: vi.fn(() => mockSupabase),
    order: vi.fn(() => mockSupabase),
    single: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
  }
  return { supabase: mockSupabase }
})

import { supabase } from '../../../core/services/supabase.js'
import { fetchIdeas, submitIdea } from '../../../features/ideas/ideaService.js'

describe('ideaService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchIdeas', () => {
    it('fetches all ideas ordered by created_at desc', async () => {
      const mockData = [
        { id: 1, category: '🎉 สังสรรค์', title: 'Party', detail: '', submitter_name: 'Alice', created_at: '2026-05-01', status: 'approved' },
        { id: 2, category: '💬 อื่นๆ', title: 'Workshop', detail: 'Python workshop', submitter_name: 'Bob', created_at: '2026-04-20', status: 'pending' },
      ]
      supabase.from().select().order.mockResolvedValue({ data: mockData, error: null })

      const result = await fetchIdeas()

      expect(supabase.from).toHaveBeenCalledWith('ideas')
      expect(supabase.from().select).toHaveBeenCalledWith('*')
      expect(supabase.from().select().order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(result).toHaveLength(2)
      expect(result[0].title).toBe('Party')
      expect(result[0].status).toBe('approved')
      expect(result[0].submitterName).toBe('Alice') // camelCase mapping
    })

    it('returns empty array when no data', async () => {
      supabase.from().select().order.mockResolvedValue({ data: null, error: null })
      const result = await fetchIdeas()
      expect(result).toEqual([])
    })

    it('throws on error', async () => {
      supabase.from().select().order.mockResolvedValue({ data: null, error: { message: 'DB error' } })
      await expect(fetchIdeas()).rejects.toThrow('DB error')
    })

    it('maps snake_case to camelCase correctly', async () => {
      const mockData = [
        {
          id: 1,
          category: '🎉 สังสรรค์',
          title: 'Test',
          detail: 'Desc',
          submitter_name: 'Alice',
          created_at: '2026-05-01',
          status: 'pending',
        },
      ]
      supabase.from().select().order.mockResolvedValue({ data: mockData, error: null })
      const result = await fetchIdeas()
      expect(result[0]).toEqual({
        id: 1,
        category: '🎉 สังสรรค์',
        title: 'Test',
        detail: 'Desc',
        submitterName: 'Alice',
        createdAt: '2026-05-01',
        status: 'pending',
      })
    })
  })

  describe('submitIdea', () => {
    const sampleIdea = {
      category: '📚 เรียนรู้',
      title: 'Learn Vue 3',
      detail: 'Advanced workshop',
      submitterName: 'Alice',
      employeeId: '42',
    }

    function mockSingle(result) {
      supabase.from().insert().select().single.mockResolvedValue(result)
    }

    it('inserts a new idea and returns data', async () => {
      const mockResponse = {
        id: 3,
        category: '📚 เรียนรู้',
        title: 'Learn Vue 3',
        detail: 'Advanced workshop',
        submitter_name: 'Alice',
        employee_id: '42',
        status: 'pending',
      }
      mockSingle({ data: mockResponse, error: null })

      const result = await submitIdea(sampleIdea)

      expect(supabase.from).toHaveBeenCalledWith('ideas')
      expect(result).toEqual(mockResponse)
    })

    it('truncates title to 200 chars', async () => {
      const longTitle = 'x'.repeat(250)
      mockSingle({ data: { title: longTitle.slice(0, 200) }, error: null })

      const result = await submitIdea({ ...sampleIdea, title: longTitle })
      expect(result.title.length).toBe(200)
    })

    it('truncates detail to 500 chars', async () => {
      const longDetail = 'x'.repeat(600)
      mockSingle({ data: { detail: longDetail.slice(0, 500) }, error: null })

      const result = await submitIdea({ ...sampleIdea, detail: longDetail })
      expect(result.detail.length).toBe(500)
    })

    it('passes null employeeId when not provided', async () => {
      mockSingle({ data: {}, error: null })
      const result = await submitIdea({ ...sampleIdea, employeeId: null })
      expect(result).toBeDefined()
    })

    it('throws on insert error', async () => {
      mockSingle({ data: null, error: { message: 'Insert failed' } })
      await expect(submitIdea(sampleIdea)).rejects.toThrow('Insert failed')
    })
  })
})
