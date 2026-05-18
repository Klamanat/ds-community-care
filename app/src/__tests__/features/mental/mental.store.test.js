// Unit tests for features/mental/mental.store.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('../../../features/mental/mentalService.js', () => ({
  fetchAdvisors: vi.fn(),
  fetchCounselorRequests: vi.fn(),
  fetchSenderRequests: vi.fn(),
  submitConsultRequest: vi.fn(),
  markConsultRead: vi.fn(),
  addConsultReply: vi.fn(),
}))

vi.mock('../../../features/team/teamService.js', () => ({
  fetchAllEmployees: vi.fn(() => Promise.resolve([])),
}))

vi.mock('../../../core/services/imageService.js', () => ({
  fetchImages: vi.fn(() => Promise.resolve({})),
}))

import * as svc from '../../../features/mental/mentalService.js'
import { fetchAllEmployees } from '../../../features/team/teamService.js'
import { fetchImages } from '../../../core/services/imageService.js'

describe('mental.store', () => {
  let store

  async function createStore() {
    const { useMentalStore } = await import('../../../features/mental/mental.store.js')
    return useMentalStore()
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // ── 1. Initial state ─────────────────────────────────────────────

  describe('initial state', () => {
    it('has empty advisors and not loaded', async () => {
      store = await createStore()
      expect(store.advisors).toEqual([])
      expect(store.loaded).toBe(false)
      expect(store.advisorsLoading).toBe(false)
    })

    it('has empty myRequests and not loaded', async () => {
      store = await createStore()
      expect(store.myRequests).toEqual([])
      expect(store.requestsLoaded).toBe(false)
      expect(store.requestsLoading).toBe(false)
      expect(store.requestsError).toBe('')
    })

    it('has empty senderRequests and not loaded', async () => {
      store = await createStore()
      expect(store.senderRequests).toEqual([])
      expect(store.senderLoaded).toBe(false)
      expect(store.senderLoading).toBe(false)
      expect(store.senderError).toBe('')
    })

    it('unreadCount is 0', async () => {
      store = await createStore()
      expect(store.unreadCount).toBe(0)
    })
  })

  // ── 2. loadAdvisors ─────────────────────────────────────────────

  describe('loadAdvisors', () => {
    const mockAdvisors = [
      { id: 1, name: 'Dr. A', role: 'จิตแพทย์', employeeId: '101', imgId: '', imgUrl: '', order: 1 },
    ]

    it('fetches and stores advisors', async () => {
      store = await createStore()
      svc.fetchAdvisors.mockResolvedValue(mockAdvisors)
      fetchAllEmployees.mockResolvedValue([])

      await store.loadAdvisors()

      expect(svc.fetchAdvisors).toHaveBeenCalled()
      expect(store.advisors).toEqual(mockAdvisors)
      expect(store.loaded).toBe(true)
      expect(store.advisorsLoading).toBe(false)
    })

    it('skips fetch if already loaded', async () => {
      store = await createStore()
      svc.fetchAdvisors.mockResolvedValue(mockAdvisors)
      fetchAllEmployees.mockResolvedValue([])

      await store.loadAdvisors()
      expect(svc.fetchAdvisors).toHaveBeenCalledTimes(1)

      vi.clearAllMocks()
      await store.loadAdvisors()
      expect(svc.fetchAdvisors).not.toHaveBeenCalled()
    })

    it('re-fetches on force=true', async () => {
      store = await createStore()
      svc.fetchAdvisors.mockResolvedValue(mockAdvisors)
      fetchAllEmployees.mockResolvedValue([])

      await store.loadAdvisors()
      expect(svc.fetchAdvisors).toHaveBeenCalledTimes(1)

      vi.clearAllMocks()
      svc.fetchAdvisors.mockResolvedValue(mockAdvisors)
      fetchAllEmployees.mockResolvedValue([])
      await store.loadAdvisors(true)
      expect(svc.fetchAdvisors).toHaveBeenCalledTimes(1)
    })

    it('handles error gracefully', async () => {
      store = await createStore()
      svc.fetchAdvisors.mockRejectedValue(new Error('Network error'))

      await store.loadAdvisors()

      expect(store.advisors).toEqual([])
      expect(store.loaded).toBe(true)
      expect(store.advisorsLoading).toBe(false)
    })

    it('enriches advisors with employee images when emps available', async () => {
      store = await createStore()
      const advisorWithEmpId = [
        { id: 1, name: 'Dr. A', employeeId: '101', imgId: '', imgUrl: '', order: 1 },
      ]
      svc.fetchAdvisors.mockResolvedValue(advisorWithEmpId)
      fetchAllEmployees.mockResolvedValue([
        { id: 101, name: 'Employee A', imgId: 'img101', imgUrl: 'https://example.com/avatar.jpg' },
      ])

      await store.loadAdvisors()

      expect(store.advisors[0].imgId).toBe('img101')
      expect(store.advisors[0].imgUrl).toBe('https://example.com/avatar.jpg')
    })

    it('lazy-fetches images for enriched advisors with imgId but no imgUrl', async () => {
      store = await createStore()
      const advisorWithEmpId = [
        { id: 1, name: 'Dr. A', employeeId: '101', imgId: '', imgUrl: '', order: 1 },
      ]
      svc.fetchAdvisors.mockResolvedValue(advisorWithEmpId)
      fetchAllEmployees.mockResolvedValue([
        { id: 101, name: 'Employee A', imgId: 'img101', imgUrl: '' },
      ])
      fetchImages.mockResolvedValue({ img101: 'https://example.com/lazy.jpg' })

      await store.loadAdvisors()

      // After enrichment, imgId set but imgUrl empty → fetchImages is called
      expect(fetchImages).toHaveBeenCalled()
    })

    it('handles loadAdvisors failure when fetchImages rejects', async () => {
      store = await createStore()
      svc.fetchAdvisors.mockResolvedValue(mockAdvisors)
      fetchAllEmployees.mockResolvedValue([
        { id: 101, name: 'Employee A', imgId: 'img101', imgUrl: '' },
      ])
      fetchImages.mockRejectedValue(new Error('Image load failed'))

      // Should not throw
      await store.loadAdvisors()
      expect(store.advisors).toHaveLength(1)
      expect(store.loaded).toBe(true)
    })
  })

  // ── 3. isCounselor ──────────────────────────────────────────────

  describe('isCounselor', () => {
    beforeEach(async () => {
      store = await createStore()
      svc.fetchAdvisors.mockResolvedValue([
        { id: 1, name: 'Dr. A', employeeId: '101', order: 1 },
        { id: 2, name: 'Dr. B', employeeId: '202', order: 2 },
      ])
      fetchAllEmployees.mockResolvedValue([])
      await store.loadAdvisors()
    })

    it('returns true for a counselor employeeId', () => {
      expect(store.isCounselor('101')).toBe(true)
      expect(store.isCounselor(101)).toBe(true)
    })

    it('returns false for non-counselor employeeId', () => {
      expect(store.isCounselor('999')).toBe(false)
    })

    it('returns false for null/undefined employeeId', () => {
      expect(store.isCounselor(null)).toBe(false)
      expect(store.isCounselor(undefined)).toBe(false)
      expect(store.isCounselor('')).toBe(false)
    })
  })

  // ── 4. loadMyRequests ───────────────────────────────────────────

  describe('loadMyRequests', () => {
    const mockRequests = [
      { id: 1, counselorEmployeeId: '101', message: 'Help me', employeeId: '201', employeeName: 'John', createdAt: '2026-05-18T00:00:00Z', isRead: false, reply: '', counselorName: '', repliedAt: '' },
    ]

    beforeEach(async () => {
      store = await createStore()
    })

    it('fetches and stores counselor requests', async () => {
      svc.fetchCounselorRequests.mockResolvedValue(mockRequests)

      await store.loadMyRequests('101')

      expect(svc.fetchCounselorRequests).toHaveBeenCalledWith('101')
      expect(store.myRequests).toEqual(mockRequests)
      expect(store.requestsLoaded).toBe(true)
      expect(store.requestsLoading).toBe(false)
    })

    it('does nothing when counselorEmployeeId is falsy', async () => {
      await store.loadMyRequests('')
      expect(svc.fetchCounselorRequests).not.toHaveBeenCalled()
    })

    it('skips fetch if already loaded', async () => {
      svc.fetchCounselorRequests.mockResolvedValue(mockRequests)
      await store.loadMyRequests('101')
      expect(svc.fetchCounselorRequests).toHaveBeenCalledTimes(1)

      vi.clearAllMocks()
      await store.loadMyRequests('101')
      expect(svc.fetchCounselorRequests).not.toHaveBeenCalled()
    })

    it('re-fetches on force=true', async () => {
      svc.fetchCounselorRequests.mockResolvedValue(mockRequests)
      await store.loadMyRequests('101')
      vi.clearAllMocks()

      svc.fetchCounselorRequests.mockResolvedValue(mockRequests)
      await store.loadMyRequests('101', true)
      expect(svc.fetchCounselorRequests).toHaveBeenCalledTimes(1)
    })

    it('handles error gracefully', async () => {
      svc.fetchCounselorRequests.mockRejectedValue(new Error('Load failed'))

      await store.loadMyRequests('101')

      expect(store.requestsError).toBe('Load failed')
      expect(store.requestsLoaded).toBe(true)
      expect(store.requestsLoading).toBe(false)
    })
  })

  // ── 5. markRead ─────────────────────────────────────────────────

  describe('markRead', () => {
    beforeEach(async () => {
      store = await createStore()
      svc.fetchCounselorRequests.mockResolvedValue([
        { id: 1, isRead: false },
      ])
      await store.loadMyRequests('101')
    })

    it('marks a request as read', async () => {
      svc.markConsultRead.mockResolvedValue()

      await store.markRead(1)

      expect(svc.markConsultRead).toHaveBeenCalledWith(1)
      expect(store.myRequests[0].isRead).toBe(true)
    })

    it('handles error silently', async () => {
      svc.markConsultRead.mockRejectedValue(new Error('fail'))

      // Should not throw
      await expect(store.markRead(1)).resolves.toBeUndefined()
    })

    it('does nothing for non-existent request id', async () => {
      svc.markConsultRead.mockResolvedValue()

      await store.markRead(999)

      expect(svc.markConsultRead).toHaveBeenCalledWith(999)
    })
  })

  // ── 6. addReply ─────────────────────────────────────────────────

  describe('addReply', () => {
    beforeEach(async () => {
      store = await createStore()
      svc.fetchCounselorRequests.mockResolvedValue([
        { id: 1, isRead: false, reply: '', repliedAt: '' },
      ])
      svc.fetchSenderRequests.mockResolvedValue([
        { id: 1, reply: '', repliedAt: '' },
      ])
      await store.loadMyRequests('101')
      await store.loadSenderRequests('201')
    })

    it('adds reply and updates both myRequests and senderRequests', async () => {
      svc.addConsultReply.mockResolvedValue()

      await store.addReply(1, 'Thank you', '101')

      expect(svc.addConsultReply).toHaveBeenCalledWith(1, 'Thank you', '101')
      expect(store.myRequests[0].reply).toBe('Thank you')
      expect(store.myRequests[0].isRead).toBe(true)
      expect(store.senderRequests[0].reply).toBe('Thank you')
    })

    it('handles missing request gracefully', async () => {
      svc.addConsultReply.mockResolvedValue()

      await store.addReply(999, 'Reply', '101')
      expect(svc.addConsultReply).toHaveBeenCalledWith(999, 'Reply', '101')
    })
  })

  // ── 7. unreadCount ──────────────────────────────────────────────

  describe('unreadCount', () => {
    it('returns count of unread requests', async () => {
      store = await createStore()
      svc.fetchCounselorRequests.mockResolvedValue([
        { id: 1, isRead: false },
        { id: 2, isRead: true },
        { id: 3, isRead: false },
      ])
      await store.loadMyRequests('101')

      expect(store.unreadCount).toBe(2)
    })

    it('updates after markRead', async () => {
      store = await createStore()
      svc.fetchCounselorRequests.mockResolvedValue([
        { id: 1, isRead: false },
        { id: 2, isRead: false },
      ])
      svc.markConsultRead.mockResolvedValue()
      await store.loadMyRequests('101')

      expect(store.unreadCount).toBe(2)

      await store.markRead(1)

      expect(store.unreadCount).toBe(1)
    })
  })

  // ── 8. loadSenderRequests ───────────────────────────────────────

  describe('loadSenderRequests', () => {
    const mockSent = [
      { id: 1, employeeId: '201', message: 'Need help', reply: '', repliedAt: '' },
    ]

    beforeEach(async () => {
      store = await createStore()
    })

    it('fetches and stores sender requests', async () => {
      svc.fetchSenderRequests.mockResolvedValue(mockSent)

      await store.loadSenderRequests('201')

      expect(svc.fetchSenderRequests).toHaveBeenCalledWith('201')
      expect(store.senderRequests).toEqual(mockSent)
      expect(store.senderLoaded).toBe(true)
    })

    it('does nothing when senderEmployeeId is falsy', async () => {
      await store.loadSenderRequests('')
      expect(svc.fetchSenderRequests).not.toHaveBeenCalled()
    })

    it('handles error gracefully', async () => {
      svc.fetchSenderRequests.mockRejectedValue(new Error('Load failed'))

      await store.loadSenderRequests('201')

      expect(store.senderError).toBe('Load failed')
      expect(store.senderRequests).toEqual([])
      expect(store.senderLoaded).toBe(true)
    })
  })

  // ── 9. submitRequest ────────────────────────────────────────────

  describe('submitRequest', () => {
    beforeEach(async () => {
      store = await createStore()
    })

    it('submits consult request and invalidates sender cache', async () => {
      svc.submitConsultRequest.mockResolvedValue()

      await store.submitRequest('101', 'I need help', '201', 'John')

      expect(svc.submitConsultRequest).toHaveBeenCalledWith('101', 'I need help', '201', 'John')
      expect(store.senderLoaded).toBe(false)
    })
  })

  // ── 10. reset ────────────────────────────────────────────────────

  describe('reset', () => {
    it('resets all state to initial values', async () => {
      store = await createStore()
      // Populate state
      svc.fetchAdvisors.mockResolvedValue([{ id: 1, name: 'Dr. A', employeeId: '101' }])
      fetchAllEmployees.mockResolvedValue([])
      await store.loadAdvisors()
      expect(store.loaded).toBe(true)
      expect(store.advisors.length).toBe(1)

      svc.fetchCounselorRequests.mockResolvedValue([{ id: 1 }])
      svc.fetchSenderRequests.mockResolvedValue([{ id: 1 }])
      await store.loadMyRequests('101')
      await store.loadSenderRequests('201')

      store.reset()

      expect(store.advisors).toEqual([])
      expect(store.loaded).toBe(false)
      expect(store.myRequests).toEqual([])
      expect(store.requestsLoaded).toBe(false)
      expect(store.requestsError).toBe('')
      expect(store.senderRequests).toEqual([])
      expect(store.senderLoaded).toBe(false)
      expect(store.senderError).toBe('')
    })
  })
})
