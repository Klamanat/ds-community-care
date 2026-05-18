// Unit tests for features/training/trainingService.js
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../core/services/supabase.js', () => {
  const chain = () => chain
  chain.select = vi.fn(() => chain)
  chain.insert = vi.fn(() => chain)
  chain.update = vi.fn(() => chain)
  chain.delete = vi.fn(() => chain)
  chain.upsert = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.order = vi.fn(() => chain)
  chain.single = vi.fn(() => chain)
  chain.maybeSingle = vi.fn(() => chain)
  chain.from = vi.fn(() => chain)
  return { supabase: chain }
})

import { supabase } from '../../../core/services/supabase.js'
import {
  fetchTrainings, fetchMyTrainings, registerTraining, cancelRegistration,
  fetchReviews, submitReview,
  fetchSiteVisits, voteSite, cancelSiteVote, fetchMySiteVotes,
  submitSiteSuggestion, fetchMySiteSuggestion,
  fetchIdpPosters, fetchIdpVideos,
} from '../../../features/training/trainingService.js'

describe('trainingService', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('fetchTrainings', () => {
    it('fetches single category', async () => {
      supabase.from().select().order.mockResolvedValue({ data: [{ id: 1, title: 'Vue Course' }], error: null })
      const result = await fetchTrainings('annual')
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Vue Course')
    })

    it('fetches all categories when no param', async () => {
      supabase.from().select().order.mockResolvedValue({ data: [] })
      const result = await fetchTrainings()
      expect(result).toEqual([])
    })
  })

  describe('registerTraining', () => {
    it('upserts registration', async () => {
      supabase.from().upsert.mockResolvedValue({ error: null })
      await registerTraining('t1', 'e1', 'Alice')
      expect(supabase.from).toHaveBeenCalledWith('training_registrations')
    })

    it('handles 23505 (duplicate) silently', async () => {
      supabase.from().upsert.mockResolvedValue({ error: { code: '23505' } })
      await expect(registerTraining('t1', 'e1', 'Alice')).resolves.not.toThrow()
    })
  })

  describe('cancelRegistration', () => {
    it('deletes registration', async () => {
      supabase.eq.mockReturnValueOnce(supabase).mockResolvedValue({ error: null })
      await cancelRegistration('t1', 'e1')
      expect(supabase.from).toHaveBeenCalledWith('training_registrations')
      expect(supabase.eq).toHaveBeenNthCalledWith(1, 'training_id', 't1')
      expect(supabase.eq).toHaveBeenNthCalledWith(2, 'employee_id', 'e1')
    })
  })

  describe('fetchReviews', () => {
    it('fetches all reviews', async () => {
      supabase.from().select().order.mockResolvedValue({ data: [{ id: 1, stars: 5, comment: 'Great!' }], error: null })
      const result = await fetchReviews()
      expect(result).toHaveLength(1)
    })

    it('filters by training_id', async () => {
      supabase.order.mockImplementation(() => supabase)
      supabase.eq.mockResolvedValue({ data: [], error: null })
      const result = await fetchReviews('t1')
      expect(result).toEqual([])
      expect(supabase.from).toHaveBeenCalledWith('training_reviews')
      expect(supabase.order).toHaveBeenCalled()
    })
  })

  describe('submitReview', () => {
    it('inserts review', async () => {
      supabase.from().insert().select().single.mockResolvedValue({ data: { id: 1, stars: 4 }, error: null })
      const result = await submitReview('t1', 'e1', 'Alice', 4, 'Good')
      expect(result.stars).toBe(4)
    })
  })

  describe('site visit operations', () => {
    it('fetchSiteVisits returns data', async () => {
      supabase.from().select().order.mockResolvedValue({ data: [{ id: 1, name: 'Office' }], error: null })
      const result = await fetchSiteVisits()
      expect(result).toHaveLength(1)
    })

    it('voteSite upserts vote', async () => {
      supabase.from().upsert.mockResolvedValue({ error: null })
      await voteSite(1, 'e1', 'Alice')
    })

    it('cancelSiteVote deletes vote', async () => {
      supabase.eq.mockReturnValueOnce(supabase).mockResolvedValue({ error: null })
      await cancelSiteVote(1, 'e1')
      expect(supabase.from).toHaveBeenCalledWith('site_votes')
      expect(supabase.eq).toHaveBeenNthCalledWith(1, 'site_id', 1)
      expect(supabase.eq).toHaveBeenNthCalledWith(2, 'employee_id', 'e1')
    })

    it('fetchMySiteVotes returns site_ids', async () => {
      supabase.from().select().eq.mockResolvedValue({ data: [{ site_id: 1 }], error: null })
      const result = await fetchMySiteVotes('e1')
      expect(result).toEqual([1])
    })
  })

  describe('site suggestions', () => {
    it('submitSiteSuggestion upserts', async () => {
      supabase.from().upsert.mockResolvedValue({ error: null })
      await submitSiteSuggestion('e1', 'Alice', 'Visit beach')
    })

    it('fetchMySiteSuggestion returns suggestion', async () => {
      supabase.eq.mockImplementation(() => supabase)
      supabase.maybeSingle.mockResolvedValue({ data: { description: 'Visit beach' } })
      const result = await fetchMySiteSuggestion('e1')
      expect(result.suggestion).toBe('Visit beach')
      expect(supabase.from).toHaveBeenCalledWith('site_suggestions')
      expect(supabase.eq).toHaveBeenCalledWith('employee_id', 'e1')
    })
  })

  describe('IDP posters and videos', () => {
    it('fetchIdpPosters returns mapped posters', async () => {
      supabase.from().select().order.mockResolvedValue({ data: [{ id: 1, title: 'Poster', image_url: 'url' }], error: null })
      const result = await fetchIdpPosters()
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Poster')
    })

    it('fetchIdpVideos returns mapped videos', async () => {
      supabase.from().select().order.mockResolvedValue({ data: [{ id: 1, title: 'Video', video_url: 'vurl' }], error: null })
      const result = await fetchIdpVideos()
      expect(result[0].title).toBe('Video')
    })
  })
})
