// Unit tests for features/activities/activitiesService.js
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
  chain.maybeSingle = vi.fn(() => chain)
  chain.neq = vi.fn(() => chain)
  chain.in = vi.fn(() => chain)
  chain.rpc = vi.fn(() => chain)
  chain.from = vi.fn(() => chain)
  return { supabase: chain }
})

vi.mock('../../../core/services/edgeFunctions.js', () => ({
  uploadImage: vi.fn(() => Promise.resolve({ id: 'img123', url: 'https://test.url' })),
}))

import { supabase } from '../../../core/services/supabase.js'
import { uploadImage as edgeUpload } from '../../../core/services/edgeFunctions.js'
import {
  fetchAll, fetchByMonth, addActivity, updateActivity, deleteActivity,
  joinActivity, getMyStamps, claimReward,
  fetchTicketActivities, bookTicket, cancelTicket, getMyTickets, getMyTicketForActivity,
  getActivityTickets, getActivityBookedCount, verifyTicket, checkInTicket,
  uploadTicketSlip, uploadImage,
} from '../../../features/activities/activitiesService.js'

function makeActivityRow(overrides = {}) {
  return {
    id: 1, name: 'Party', month_idx: 5, emoji: '🎉', date: '2026-05-20',
    date_end: '', loc: 'Office', desc: '', steps: '',
    join_url: '', join_open: true, join_label: '', join_open_at: '', join_close_at: '',
    feedback_url: '', img_url: '', img_id: '',
    created_at: '2026-05-01T00:00:00Z',
    ticket_enabled: false, ticket_title: '', ticket_price: 0,
    ticket_capacity: null, ticket_note: '', ticket_open_at: '',
    ...overrides,
  }
}

function makeTicketRow(overrides = {}) {
  return {
    id: 10, activity_id: 1, employee_id: '42', employee_name: 'Alice',
    ticket_no: 'TKT-0001', qr_token: 'qr_abc123', status: 'booked',
    quantity: 1, price: 0, slip_url: '',
    created_at: '2026-05-18T00:00:00Z', cancelled_at: null, checked_in_at: null,
    ...overrides,
  }
}

describe('activitiesService', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  describe('fetchAll', () => {
    it('fetches all activities ordered by created_at', async () => {
      supabase.from().select().order.mockResolvedValue({ data: [makeActivityRow()], error: null })
      const result = await fetchAll()
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Party')
      expect(result[0].monthIdx).toBe(5)
      expect(supabase.from).toHaveBeenCalledWith('activities')
    })

    it('returns empty on null data', async () => {
      supabase.from().select().order.mockResolvedValue({ data: null, error: null })
      expect(await fetchAll()).toEqual([])
    })

    it('throws on error', async () => {
      supabase.from().select().order.mockResolvedValue({ data: null, error: { message: 'DB error' } })
      await expect(fetchAll()).rejects.toThrow('DB error')
    })
  })

  describe('fetchByMonth', () => {
    it('filters by month_idx and returns mapped activities', async () => {
      supabase.from().select().eq().order.mockResolvedValue({ data: [makeActivityRow({ id: 2, name: 'Workshop', month_idx: 3 })], error: null })
      const result = await fetchByMonth(3)
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Workshop')
      expect(result[0].monthIdx).toBe(3)
      expect(supabase.from).toHaveBeenCalledWith('activities')
    })

    it('returns empty array when no activities for that month', async () => {
      supabase.from().select().eq().order.mockResolvedValue({ data: [], error: null })
      const result = await fetchByMonth(12)
      expect(result).toEqual([])
    })

    it('returns empty on null data', async () => {
      supabase.from().select().eq().order.mockResolvedValue({ data: null, error: null })
      expect(await fetchByMonth(3)).toEqual([])
    })

    it('throws on error', async () => {
      supabase.from().select().eq().order.mockResolvedValue({ data: null, error: { message: 'Query failed' } })
      await expect(fetchByMonth(3)).rejects.toThrow('Query failed')
    })
  })

  describe('addActivity', () => {
    it('inserts and maps activity', async () => {
      supabase.from().insert().select().single.mockResolvedValue({ data: makeActivityRow({ id: 1, name: 'New', month_idx: 4, emoji: '🚀' }), error: null })
      const result = await addActivity({ name: 'New', monthIdx: 4, emoji: '🚀' })
      expect(result.name).toBe('New')
      expect(result.monthIdx).toBe(4)
    })

    it('throws on insert error', async () => {
      supabase.from().insert().select().single.mockResolvedValue({ data: null, error: { message: 'Insert failed' } })
      await expect(addActivity({ name: 'Fail' })).rejects.toThrow('Insert failed')
    })
  })

  describe('updateActivity', () => {
    it('updates and maps activity', async () => {
      supabase.from().update().eq().select().single.mockResolvedValue({ data: makeActivityRow({ id: 1, name: 'Updated', month_idx: 4 }), error: null })
      const result = await updateActivity(1, { name: 'Updated' })
      expect(result.name).toBe('Updated')
    })

    it('throws on update error', async () => {
      supabase.from().update().eq().select().single.mockResolvedValue({ data: null, error: { message: 'Update failed' } })
      await expect(updateActivity(1, { name: 'Fail' })).rejects.toThrow('Update failed')
    })
  })

  describe('deleteActivity', () => {
    it('deletes by id', async () => {
      supabase.from().delete().eq.mockResolvedValue({ error: null })
      await deleteActivity(1)
      expect(supabase.from).toHaveBeenCalledWith('activities')
    })

    it('throws on delete error', async () => {
      supabase.from().delete().eq.mockResolvedValue({ error: { message: 'Delete failed' } })
      await expect(deleteActivity(1)).rejects.toThrow('Delete failed')
    })
  })

  describe('joinActivity', () => {
    it('returns alreadyJoined when existing record found by employee_id', async () => {
      supabase.from().select().eq().eq().maybeSingle.mockResolvedValue({ data: { id: 99 } })
      const result = await joinActivity(1, 'Party', '42', 'Alice', '')
      expect(result.alreadyJoined).toBe(true)
    })

    it('falls back to name lookup when employee_id is null', async () => {
      // When employeeId is null, the code skips employee_id lookup
      // and goes directly to the employee_name lookup
      supabase.from().select().eq().eq().maybeSingle.mockResolvedValue({ data: { id: 99 } })
      const result = await joinActivity(1, 'Party', null, 'Alice', '')
      expect(result.alreadyJoined).toBe(true)
    })

    it('inserts and returns joinCount when not already joined', async () => {
      // Use call-counting: eq returns chain for first N calls (chaining),
      // then returns the count result for the terminal call
      let eqCalls = 0
      supabase.eq.mockImplementation(() => {
        eqCalls++
        if (eqCalls <= 8) return supabase     // chain calls
        return Promise.resolve({ count: 5, error: null }) // terminal
      })
      supabase.from().select().eq().eq().maybeSingle.mockResolvedValue({ data: null })
      supabase.from().select().eq().eq().maybeSingle.mockResolvedValue({ data: null })
      supabase.from().insert.mockResolvedValue({ error: null })
      const result = await joinActivity(1, 'Party', '42', 'Alice', '')
      expect(result.alreadyJoined).toBe(false)
      expect(result.joinCount).toBe(5)
    })

    it('uses fallback name when employeeName not provided', async () => {
      let eqCalls = 0
      supabase.eq.mockImplementation(() => {
        eqCalls++
        if (eqCalls <= 8) return supabase
        return Promise.resolve({ count: 0, error: null })
      })
      supabase.from().select().eq().eq().maybeSingle.mockResolvedValue({ data: null })
      supabase.from().select().eq().eq().maybeSingle.mockResolvedValue({ data: null })
      supabase.from().insert.mockResolvedValue({ error: null })

      await joinActivity(1, 'Party', '42', '', '')
      expect(supabase.from).toHaveBeenCalledWith('activity_joins')
    })

    it('throws on insert error', async () => {
      supabase.from().select().eq().eq().maybeSingle.mockResolvedValue({ data: null })
      supabase.from().select().eq().eq().maybeSingle.mockResolvedValue({ data: null })
      supabase.from().insert.mockResolvedValue({ error: { message: 'Insert failed' } })
      await expect(joinActivity(1, 'Party', '42', 'Alice', '')).rejects.toThrow('Insert failed')
    })
  })

  describe('getMyStamps', () => {
    it('queries by employee_id when available', async () => {
      supabase.from().select().order().eq.mockResolvedValue({ data: [makeActivityRow()], error: null })
      const result = await getMyStamps('42', 'Alice')
      expect(supabase.from).toHaveBeenCalledWith('activity_joins')
      expect(result).toHaveLength(1)
    })

    it('falls back to employee_name when employee_id is null', async () => {
      supabase.from().select().order().eq.mockResolvedValue({ data: [], error: null })
      await getMyStamps(null, 'Alice')
      expect(supabase.from).toHaveBeenCalledWith('activity_joins')
    })

    it('throws on error', async () => {
      supabase.from().select().order().eq.mockResolvedValue({ data: null, error: { message: 'Query failed' } })
      await expect(getMyStamps('42', 'Alice')).rejects.toThrow('Query failed')
    })
  })

  describe('claimReward', () => {
    it('updates reward_claimed', async () => {
      supabase.from().update().eq().eq().select().single.mockResolvedValue({ data: { id: 1, reward_claimed: true }, error: null })
      const result = await claimReward(1, 'Alice', 'gold')
      expect(result).toBeDefined()
      expect(result.reward_claimed).toBe(true)
    })

    it('throws on update error', async () => {
      supabase.from().update().eq().eq().select().single.mockResolvedValue({ data: null, error: { message: 'Claim failed' } })
      await expect(claimReward(1, 'Alice', 'gold')).rejects.toThrow('Claim failed')
    })
  })

  describe('uploadImage', () => {
    it('delegates to edgeUpload with folderType default', async () => {
      const result = await uploadImage('base64data', 'photo.jpg')
      expect(edgeUpload).toHaveBeenCalledWith('base64data', 'photo.jpg', 'activities')
      expect(result).toEqual({ id: 'img123', url: 'https://test.url' })
    })

    it('uses default filename when not provided', async () => {
      await uploadImage('base64data')
      expect(edgeUpload).toHaveBeenCalledWith('base64data', 'image.jpg', 'activities')
    })

    it('accepts custom folderType', async () => {
      await uploadImage('base64data', 'photo.jpg', 'custom-folder')
      expect(edgeUpload).toHaveBeenCalledWith('base64data', 'photo.jpg', 'custom-folder')
    })

    it('returns edgeUpload result directly', async () => {
      edgeUpload.mockResolvedValue({ id: 'abc', url: 'https://cdn.url/img.jpg' })
      const result = await uploadImage('data', 'img.jpg')
      expect(result.url).toBe('https://cdn.url/img.jpg')
    })
  })

  describe('fetchTicketActivities', () => {
    it('fetches ticket-enabled activities', async () => {
      supabase.from().select().eq().order.mockResolvedValue({ data: [makeActivityRow({ id: 2, ticket_enabled: true })], error: null })
      const result = await fetchTicketActivities()
      expect(result).toHaveLength(1)
      expect(result[0].ticketEnabled).toBe(true)
    })

    it('returns empty array', async () => {
      supabase.from().select().eq().order.mockResolvedValue({ data: [], error: null })
      const result = await fetchTicketActivities()
      expect(result).toEqual([])
    })

    it('throws on error', async () => {
      supabase.from().select().eq().order.mockResolvedValue({ data: null, error: { message: 'Failed' } })
      await expect(fetchTicketActivities()).rejects.toThrow('Failed')
    })
  })

  describe('bookTicket', () => {
    it('throws when booking in progress (concurrent guard)', async () => {
      supabase.rpc.mockResolvedValue({ data: makeTicketRow({ id: 10, status: 'booked' }), error: null })
      // First call starts booking, second call hits the guard
      const p1 = bookTicket(1, '42', 'Alice', 0, 1)
      await expect(bookTicket(1, '42', 'Alice', 0, 1)).rejects.toThrow('กำลังดำเนินการอยู่')
      await p1
    })

    it('books via RPC when available', async () => {
      supabase.rpc.mockResolvedValue({ data: makeTicketRow({ id: 10, status: 'booked' }), error: null })
      const result = await bookTicket(1, '42', 'Alice', 0, 1)
      expect(result.id).toBe(10)
      expect(result.status).toBe('booked')
    })

    it('throws when RPC returns error message', async () => {
      supabase.rpc.mockResolvedValue({ data: { error: 'Ticket limit reached' }, error: null })
      await expect(bookTicket(1, '42', 'Alice', 0, 1)).rejects.toThrow('Ticket limit reached')
    })

    it('falls back to direct queries when RPC not deployed', async () => {
      supabase.rpc.mockResolvedValue({ data: null, error: { message: 'Could not find the function book_activity_ticket' } })
      // Track eq call count for chaining vs terminal
      let eqCalls = 0
      supabase.eq.mockImplementation(() => {
        eqCalls++
        if (eqCalls === 3) return Promise.resolve({ count: 0, error: null })
        return supabase
      })
      let singleCalls = 0
      supabase.single.mockImplementation(() => {
        singleCalls++
        if (singleCalls === 1) return Promise.resolve({ data: { ticket_capacity: 100 }, error: null })
        return Promise.resolve({ data: makeTicketRow({ id: 20, status: 'booked' }), error: null })
      })
      supabase.in.mockResolvedValue(Promise.resolve({ data: [], error: null }))
      supabase.maybeSingle.mockResolvedValue({ data: null })
      supabase.insert.mockReturnValue(supabase)

      const result = await bookTicket(1, '42', 'Alice', 0, 1)
      expect(result.id).toBe(20)
      expect(result.status).toBe('booked')
    })

    it('re-uses cancelled ticket in fallback path', async () => {
      supabase.rpc.mockResolvedValue({ data: null, error: { message: 'Could not find the function book_activity_ticket' } })
      let eqCalls = 0
      supabase.eq.mockImplementation(() => {
        eqCalls++
        if (eqCalls === 3) return Promise.resolve({ count: 0, error: null })
        return supabase
      })
      let singleCalls = 0
      supabase.single.mockImplementation(() => {
        singleCalls++
        if (singleCalls === 1) return Promise.resolve({ data: { ticket_capacity: 100 }, error: null })
        return Promise.resolve({ data: makeTicketRow({ id: 5, status: 'booked' }), error: null })
      })
      supabase.in.mockResolvedValue(Promise.resolve({ data: [], error: null }))
      supabase.maybeSingle.mockResolvedValue({ data: { id: 5 } })
      supabase.update.mockReturnValue(supabase)

      const result = await bookTicket(1, '42', 'Alice', 0, 1)
      expect(result.id).toBe(5)
    })

    it('throws when capacity exceeded in fallback', async () => {
      supabase.rpc.mockResolvedValue({ data: null, error: { message: 'Could not find the function book_activity_ticket' } })
      supabase.from().select().single.mockResolvedValue({ data: { ticket_capacity: 2 }, error: null })
      supabase.from().select().eq().in.mockResolvedValue({ data: [{ quantity: 2 }], error: null })

      await expect(bookTicket(1, '42', 'Alice', 0, 1)).rejects.toThrow('ที่นั่งไม่เพียงพอ')
    })
  })

  describe('uploadTicketSlip', () => {
    it('uploads slip and updates ticket status to booked', async () => {
      edgeUpload.mockResolvedValue({ url: 'https://slip.url/payment.jpg' })
      supabase.from().update().eq().select().single.mockResolvedValue({ data: makeTicketRow({ id: 10, status: 'booked', slip_url: 'https://slip.url/payment.jpg' }), error: null })

      const result = await uploadTicketSlip(10, 'base64data', 'slip.jpg')

      expect(edgeUpload).toHaveBeenCalledWith('base64data', 'slip.jpg', 'slips')
      expect(result.status).toBe('booked')
      expect(result.slipUrl).toBe('https://slip.url/payment.jpg')
    })

    it('uses default filename when not provided', async () => {
      edgeUpload.mockResolvedValue({ url: 'https://slip.url/slip.jpg' })
      supabase.from().update().eq().select().single.mockResolvedValue({ data: makeTicketRow({ id: 10 }), error: null })

      await uploadTicketSlip(10, 'base64data')

      expect(edgeUpload).toHaveBeenCalledWith('base64data', 'slip.jpg', 'slips')
    })

    it('throws on edge upload error', async () => {
      edgeUpload.mockRejectedValue(new Error('Upload failed'))
      await expect(uploadTicketSlip(10, 'data', 'slip.jpg')).rejects.toThrow('Upload failed')
    })
  })

  describe('cancelTicket', () => {
    it('updates status to cancelled with timestamp', async () => {
      supabase.from().update().eq.mockResolvedValue({ error: null })
      await cancelTicket(1)
      expect(supabase.from).toHaveBeenCalledWith('activity_tickets')
    })

    it('throws on update error', async () => {
      supabase.from().update().eq.mockResolvedValue({ error: { message: 'Cancel failed' } })
      await expect(cancelTicket(1)).rejects.toThrow('Cancel failed')
    })
  })

  describe('getMyTickets', () => {
    it('fetches tickets with activity join', async () => {
      supabase.from().select().eq().order.mockResolvedValue({ data: [], error: null })
      const result = await getMyTickets('42')
      expect(result).toEqual([])
    })

    it('returns tickets with mapped activity fields', async () => {
      const t = makeTicketRow({
        activities: {
          name: 'Party', emoji: '🎉', date: '2026-05-20',
          date_end: '', loc: 'Office', ticket_note: 'Bring ID', ticket_price: 50,
        },
      })
      supabase.from().select().eq().order.mockResolvedValue({ data: [t], error: null })
      const result = await getMyTickets('42')
      expect(result).toHaveLength(1)
      expect(result[0].activityName).toBe('Party')
      expect(result[0].activityEmoji).toBe('🎉')
      expect(result[0].ticketNote).toBe('Bring ID')
      expect(result[0].ticketPrice).toBe(50)
    })

    it('throws on error', async () => {
      supabase.from().select().eq().order.mockResolvedValue({ data: null, error: { message: 'Failed' } })
      await expect(getMyTickets('42')).rejects.toThrow('Failed')
    })
  })

  describe('getMyTicketForActivity', () => {
    it('returns null when no active ticket', async () => {
      supabase.from().select().eq().eq().neq().maybeSingle.mockResolvedValue({ data: null })
      const result = await getMyTicketForActivity(1, '42')
      expect(result).toBeNull()
    })

    it('returns mapped ticket when active ticket exists', async () => {
      supabase.from().select().eq().eq().neq().maybeSingle.mockResolvedValue({ data: makeTicketRow({ id: 10, qr_token: 'qr_active' }) })
      const result = await getMyTicketForActivity(1, '42')
      expect(result).not.toBeNull()
      expect(result.id).toBe(10)
      expect(result.qrToken).toBe('qr_active')
    })
  })

  describe('getActivityTickets', () => {
    it('fetches tickets for an activity ordered by created_at', async () => {
      supabase.from().select().eq().order.mockResolvedValue({
        data: [makeTicketRow({ id: 10 }), makeTicketRow({ id: 11 })],
        error: null,
      })
      const result = await getActivityTickets(1)
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe(10)
      expect(result[1].id).toBe(11)
      expect(supabase.from).toHaveBeenCalledWith('activity_tickets')
    })

    it('returns empty array', async () => {
      supabase.from().select().eq().order.mockResolvedValue({ data: [], error: null })
      const result = await getActivityTickets(1)
      expect(result).toEqual([])
    })

    it('throws on error', async () => {
      supabase.from().select().eq().order.mockResolvedValue({ data: null, error: { message: 'Failed' } })
      await expect(getActivityTickets(1)).rejects.toThrow('Failed')
    })
  })

  describe('getActivityBookedCount', () => {
    it('returns sum of quantities for active tickets', async () => {
      supabase.from().select().eq().in.mockResolvedValue({ data: [{ quantity: 2 }, { quantity: 1 }], error: null })
      const result = await getActivityBookedCount(1)
      expect(result).toBe(3)
    })

    it('returns 0 when no active tickets', async () => {
      supabase.from().select().eq().in.mockResolvedValue({ data: [], error: null })
      const result = await getActivityBookedCount(1)
      expect(result).toBe(0)
    })

    it('handles null data gracefully', async () => {
      supabase.from().select().eq().in.mockResolvedValue({ data: null, error: null })
      const result = await getActivityBookedCount(1)
      expect(result).toBe(0)
    })

    it('uses fallback quantity of 1 when quantity is null', async () => {
      supabase.from().select().eq().in.mockResolvedValue({ data: [{ quantity: null }], error: null })
      const result = await getActivityBookedCount(1)
      expect(result).toBe(1)
    })

    it('filters by pending_slip, booked, and checked_in statuses', async () => {
      supabase.from().select().eq().in.mockResolvedValue({ data: [{ quantity: 5 }], error: null })
      await getActivityBookedCount(1)
      expect(supabase.from).toHaveBeenCalledWith('activity_tickets')
    })
  })

  describe('verifyTicket', () => {
    it('returns null for invalid qr', async () => {
      supabase.from().select().eq().single.mockResolvedValue({ data: null, error: { message: 'not found' } })
      const result = await verifyTicket('qr123')
      expect(result).toBeNull()
    })

    it('returns null when data is null despite no error', async () => {
      supabase.from().select().eq().single.mockResolvedValue({ data: null, error: null })
      const result = await verifyTicket('qr_missing')
      expect(result).toBeNull()
    })

    it('returns ticket with activity info for valid qr', async () => {
      const t = makeTicketRow({
        qr_token: 'qr_valid',
        activities: { name: 'Concert', emoji: '🎵', date: '2026-06-01', loc: 'Hall' },
      })
      supabase.from().select().eq().single.mockResolvedValue({ data: t, error: null })
      const result = await verifyTicket('qr_valid')
      expect(result).not.toBeNull()
      expect(result.qrToken).toBe('qr_valid')
      expect(result.activityName).toBe('Concert')
      expect(result.activityEmoji).toBe('🎵')
      expect(result.activityDate).toBe('2026-06-01')
      expect(result.activityLoc).toBe('Hall')
    })
  })

  describe('checkInTicket', () => {
    it('updates status to checked_in', async () => {
      supabase.from().update().eq().select().single.mockResolvedValue({ data: makeTicketRow({ id: 10, status: 'checked_in' }), error: null })
      const result = await checkInTicket('qr123')
      expect(result).toBeDefined()
      expect(result.status).toBe('checked_in')
    })

    it('throws on update error', async () => {
      supabase.from().update().eq().select().single.mockResolvedValue({ data: null, error: { message: 'Check-in failed' } })
      await expect(checkInTicket('qr123')).rejects.toThrow('Check-in failed')
    })
  })
})
