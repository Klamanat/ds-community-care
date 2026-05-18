// Unit tests for features/team/teamService.js
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../core/services/supabase.js', () => {
  const chain = () => chain
  chain.select = vi.fn(() => chain)
  chain.insert = vi.fn(() => chain)
  chain.update = vi.fn(() => chain)
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
  fetchAllEmployees, fetchTeam, fetchStarGang,
  joinStarGang, addToTeam, updateSelf,
} from '../../../features/team/teamService.js'

describe('teamService', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('fetchAllEmployees', () => {
    it('fetches and maps all employees', async () => {
      supabase.from().select().order.mockResolvedValue({ data: [{ id: 1, emp_code: 'E1', name: 'Alice', role: 'employee', in_team: true, in_star_gang: false }], error: null })
      const result = await fetchAllEmployees()
      expect(result).toHaveLength(1)
      expect(result[0].empCode).toBe('E1')
      expect(result[0].inTeam).toBe(true)
    })

    it('handles drive: img_url', async () => {
      supabase.from().select().order.mockResolvedValue({ data: [{ id: 1, emp_code: 'E1', name: 'Bob', img_url: 'drive:abc123' }], error: null })
      const result = await fetchAllEmployees()
      expect(result[0].imgId).toBe('abc123')
      expect(result[0].imgUrl).toBe('')
    })
  })

  describe('fetchTeam', () => {
    it('filters by in_team = true', async () => {
      supabase.from().select().eq().order.mockResolvedValue({ data: [{ id: 1, name: 'Alice' }], error: null })
      const result = await fetchTeam()
      expect(result).toHaveLength(1)
    })
  })

  describe('fetchStarGang', () => {
    it('filters by in_star_gang = true', async () => {
      supabase.from().select().eq().order.mockResolvedValue({ data: [], error: null })
      const result = await fetchStarGang()
      expect(result).toEqual([])
    })
  })

  describe('joinStarGang', () => {
    it('upserts with in_star_gang=true', async () => {
      supabase.single.mockResolvedValue({ data: { id: 1, name: 'Alice', role: 'employee', in_star_gang: true }, error: null })
      const result = await joinStarGang({ id: 1, name: 'Alice' })
      expect(result).toBeDefined()
    })
  })

  describe('addToTeam', () => {
    it('upserts with in_team=true', async () => {
      supabase.single.mockResolvedValue({ data: { id: 1, name: 'Alice', in_team: true }, error: null })
      const result = await addToTeam({ id: 1, name: 'Alice' })
      expect(result).toBeDefined()
    })
  })

  describe('updateSelf', () => {
    it('updates by emp_code with provided fields', async () => {
      supabase.maybeSingle.mockResolvedValue({ data: { id: 1, name: 'Alice', role: 'senior' }, error: null })
      const result = await updateSelf('E1', { role: 'senior' })
      expect(result).toBeDefined()
    })

    it('skips null fields', async () => {
      supabase.maybeSingle.mockResolvedValue({ data: { id: 1 }, error: null })
      await updateSelf('E1', { name: undefined, role: null })
      const payload = supabase.from().update.mock.calls[0][0]
      expect(Object.keys(payload)).toHaveLength(0)
    })

    it('returns null on not found', async () => {
      supabase.maybeSingle.mockResolvedValue({ data: null, error: null })
      const result = await updateSelf('NONEXIST', { name: 'Test' })
      expect(result).toBeNull()
    })
  })
})
