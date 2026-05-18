// Unit tests for features/mental/mentalService.js
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../core/services/supabase.js', () => {
  const chain = () => chain
  chain.select = vi.fn(() => chain)
  chain.insert = vi.fn(() => chain)
  chain.update = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.order = vi.fn(() => chain)
  chain.single = vi.fn(() => chain)
  chain.from = vi.fn(() => chain)
  return { supabase: chain }
})

import { supabase } from '../../../core/services/supabase.js'
import {
  fetchAdvisors, fetchCounselorRequests, fetchSenderRequests,
  submitConsultRequest, markConsultRead, addConsultReply,
} from '../../../features/mental/mentalService.js'

describe('mentalService', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('fetchAdvisors', () => {
    it('fetches and maps advisors ordered by order', async () => {
      supabase.from().select().order.mockResolvedValue({ data: [{ id: 1, name: 'Dr. Smith', role: 'counselor', employee_id: 'e1', order: 1 }], error: null })
      const result = await fetchAdvisors()
      expect(result).toHaveLength(1)
      expect(result[0].employeeId).toBe('e1')
    })

    it('returns empty array on null data', async () => {
      supabase.from().select().order.mockResolvedValue({ data: null, error: null })
      expect(await fetchAdvisors()).toEqual([])
    })
  })

  describe('fetchCounselorRequests', () => {
    it('fetches requests for a counselor', async () => {
      supabase.from().select().eq().order.mockResolvedValue({ data: [{ id: 1, counselor_employee_id: 'e1', message: 'Help', employee_name: 'Alice' }], error: null })
      const result = await fetchCounselorRequests('e1')
      expect(result).toHaveLength(1)
      expect(result[0].employeeName).toBe('Alice')
    })
  })

  describe('fetchSenderRequests', () => {
    it('fetches requests sent by employee', async () => {
      supabase.from().select().eq().order.mockResolvedValue({ data: [], error: null })
      const result = await fetchSenderRequests('e1')
      expect(result).toEqual([])
    })
  })

  describe('submitConsultRequest', () => {
    it('inserts a consult request', async () => {
      supabase.from().insert.mockResolvedValue({ error: null })
      await submitConsultRequest('e1', 'Need help', 'e2', 'Bob')
      expect(supabase.from).toHaveBeenCalledWith('consult_requests')
      const args = supabase.from().insert.mock.calls[0][0]
      expect(args.counselor_employee_id).toBe('e1')
      expect(args.message).toBe('Need help')
    })
  })

  describe('markConsultRead', () => {
    it('updates is_read to true', async () => {
      supabase.from().update().eq.mockResolvedValue({ error: null })
      await markConsultRead(1)
      expect(supabase.from).toHaveBeenCalledWith('consult_requests')
    })
  })

  describe('addConsultReply', () => {
    it('updates with reply', async () => {
      supabase.eq.mockResolvedValue({ error: null })
      await addConsultReply(1, 'Thank you', 'e1')
      expect(supabase.from).toHaveBeenCalledWith('consult_requests')
    })
  })
})
