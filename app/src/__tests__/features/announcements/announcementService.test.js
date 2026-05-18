// Unit tests for features/announcements/announcementService.js
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../core/services/supabase.js', () => {
  const chain = () => chain
  chain.select = vi.fn(() => chain)
  chain.insert = vi.fn(() => chain)
  chain.upsert = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.in = vi.fn(() => chain)
  chain.order = vi.fn(() => chain)
  chain.maybeSingle = vi.fn(() => chain)
  chain.from = vi.fn(() => chain)
  return { supabase: chain }
})

import { supabase } from '../../../core/services/supabase.js'
import { fetchAnnouncement, submitQuizAnswer, fetchQuizResults, getMyQuizAnswer } from '../../../features/announcements/announcementService.js'

describe('announcementService', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  describe('fetchAnnouncement', () => {
    it('returns null when no settings found', async () => {
      supabase.from().select().in.mockResolvedValue({ data: null, error: null })
      const result = await fetchAnnouncement()
      expect(result).toBeNull()
    })

    it('returns null when ann_enabled is not true', async () => {
      supabase.from().select().in.mockResolvedValue({ data: [{ key: 'ann_enabled', value: 'false' }], error: null })
      const result = await fetchAnnouncement()
      expect(result).toBeNull()
    })

    it('returns parsed announcement when enabled', async () => {
      supabase.from().select().in.mockResolvedValue({
        data: [
          { key: 'ann_enabled', value: 'true' },
          { key: 'ann_id', value: 'a1' },
          { key: 'ann_title', value: 'Welcome' },
          { key: 'ann_desc', value: 'Hello everyone' },
        ],
        error: null,
      })
      const result = await fetchAnnouncement()
      expect(result.id).toBe('a1')
      expect(result.title).toBe('Welcome')
    })

    it('parses quiz questions when quiz enabled', async () => {
      supabase.from().select().in.mockResolvedValue({
        data: [
          { key: 'ann_enabled', value: 'true' },
          { key: 'ann_quiz_enabled', value: 'true' },
          { key: 'ann_quiz_questions', value: JSON.stringify([{ id: 1, question: 'Q?', options: ['A', 'B'] }]) },
        ],
        error: null,
      })
      const result = await fetchAnnouncement()
      expect(result.quiz).toHaveLength(1)
    })
  })

  describe('submitQuizAnswer', () => {
    it('upserts quiz answer', async () => {
      supabase.from().upsert.mockResolvedValue({ error: null })
      await submitQuizAnswer('a1', 'Alice', 'q1', ['A'])
      expect(supabase.from).toHaveBeenCalledWith('quiz_answers')
    })
  })

  describe('fetchQuizResults', () => {
    it('returns counts and total', async () => {
      // Chain: .select('selected').eq('ann_id', annId).eq('question_id', questionId)
      // First .eq() returns chain, second .eq() is terminal
      supabase.eq.mockReset()
      let eqCalls = 0
      supabase.eq.mockImplementation(() => {
        eqCalls++
        if (eqCalls === 1) return supabase
        return Promise.resolve({ data: [{ selected: ['A'] }, { selected: ['A'] }, { selected: ['B'] }], error: null })
      })
      const result = await fetchQuizResults('a1', 'q1')
      expect(result.total).toBe(3)
      expect(result.counts.A).toBe(2)
    })
  })

  describe('getMyQuizAnswer', () => {
    it('returns null when no answer', async () => {
      supabase.from().select().eq().eq().eq().maybeSingle.mockResolvedValue({ data: null })
      const result = await getMyQuizAnswer('a1', 'Alice', 'q1')
      expect(result).toBeNull()
    })
  })
})
