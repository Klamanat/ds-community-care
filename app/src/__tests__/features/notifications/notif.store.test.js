// Unit tests for features/notifications/notif.store.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('../../../features/notifications/notificationService.js', () => ({
  fetchNotifications: vi.fn(),
}))

import { useNotifStore } from '../../../features/notifications/notif.store.js'
import * as svc from '../../../features/notifications/notificationService.js'

describe('notif store', () => {
  let store

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    store = useNotifStore()
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('has empty items array', () => {
      expect(store.items).toEqual([])
    })

    it('has empty readIds set', () => {
      expect(store.readIds.size).toBe(0)
    })

    it('has loading false and loadError empty', () => {
      expect(store.loading).toBe(false)
      expect(store.loadError).toBe('')
    })

    it('has unreadCount of 0', () => {
      expect(store.unreadCount).toBe(0)
    })
  })

  describe('isRead', () => {
    it('returns false for unread item', () => {
      expect(store.isRead(1)).toBe(false)
    })

    it('returns true after markRead', () => {
      store.markRead(1)
      expect(store.isRead(1)).toBe(true)
    })
  })

  describe('markRead', () => {
    it('adds id to readIds', () => {
      store.markRead('notif-1')
      expect(store.readIds.has('notif-1')).toBe(true)
    })

    it('persists readIds to localStorage', () => {
      store.markRead('notif-1')
      const saved = JSON.parse(localStorage.getItem('notif_read'))
      expect(saved).toContain('notif-1')
    })

    it('does not duplicate id on second call', () => {
      store.markRead('notif-1')
      store.markRead('notif-1')
      expect(store.readIds.size).toBe(1)
    })
  })

  describe('markAllRead', () => {
    it('marks all items as read', () => {
      store.items = [
        { id: 1, title: 'A' },
        { id: 2, title: 'B' },
        { id: 3, title: 'C' },
      ]
      store.markAllRead()
      expect(store.readIds.has(1)).toBe(true)
      expect(store.readIds.has(2)).toBe(true)
      expect(store.readIds.has(3)).toBe(true)
    })

    it('persists to localStorage', () => {
      store.items = [{ id: 'x' }, { id: 'y' }]
      store.markAllRead()
      const saved = JSON.parse(localStorage.getItem('notif_read'))
      expect(saved).toContain('x')
      expect(saved).toContain('y')
    })
  })

  describe('unreadCount', () => {
    it('returns correct count', () => {
      store.items = [
        { id: 1, title: 'Read' },
        { id: 2, title: 'Unread' },
        { id: 3, title: 'Unread 2' },
      ]
      store.markRead(1)
      expect(store.unreadCount).toBe(2)
    })

    it('returns 0 when all items are read', () => {
      store.items = [{ id: 1 }, { id: 2 }]
      store.markAllRead()
      expect(store.unreadCount).toBe(0)
    })
  })

  describe('load', () => {
    it('fetches notifications and stores them', async () => {
      const mockNotifs = [
        { id: 1, message: 'Notif 1' },
        { id: 2, message: 'Notif 2' },
      ]
      svc.fetchNotifications.mockResolvedValue(mockNotifs)

      await store.load('Alice', false)

      expect(svc.fetchNotifications).toHaveBeenCalledWith('Alice', expect.any(Number))
      expect(store.items).toEqual(mockNotifs)
      expect(store.loading).toBe(false)
      expect(store.loadError).toBe('')
    })

    it('caches to localStorage with TTL', async () => {
      svc.fetchNotifications.mockResolvedValue([{ id: 1, message: 'Cached' }])
      await store.load('Alice')

      const cache = JSON.parse(localStorage.getItem('notif_cache'))
      expect(cache.emp).toBe('Alice')
      expect(cache.items).toEqual([{ id: 1, message: 'Cached' }])
      expect(cache.exp).toBeGreaterThan(Date.now())
    })

    it('sets loadError on failure', async () => {
      svc.fetchNotifications.mockRejectedValue(new Error('Network error'))
      await store.load('Alice')
      expect(store.loadError).toBe('Network error')
      expect(store.loading).toBe(false)
    })

    it('skips fetch when within cache TTL and same employee', async () => {
      svc.fetchNotifications.mockResolvedValue([{ id: 1 }])
      await store.load('Alice')
      expect(svc.fetchNotifications).toHaveBeenCalledTimes(1)

      // Second call within TTL (5 min) should be fresh
      await store.load('Alice')
      expect(svc.fetchNotifications).toHaveBeenCalledTimes(1)
    })

    it('re-fetches when force=true', async () => {
      svc.fetchNotifications.mockResolvedValue([{ id: 1 }])
      await store.load('Alice')
      await store.load('Alice', true)
      expect(svc.fetchNotifications).toHaveBeenCalledTimes(2)
    })
  })

  describe('reset', () => {
    it('clears items, readIds, and localStorage', () => {
      store.items = [{ id: 1 }]
      store.markRead(1)
      store.reset()

      expect(store.items).toEqual([])
      expect(store.readIds.size).toBe(0)
      expect(localStorage.getItem('notif_read')).toBeNull()
      expect(localStorage.getItem('notif_cache')).toBeNull()
    })
  })

  describe('persisted readIds on re-instantiation', () => {
    it('loads readIds from localStorage', () => {
      localStorage.setItem('notif_read', JSON.stringify([1, 2, 3]))
      setActivePinia(createPinia())
      const s = useNotifStore()
      expect(s.readIds.has(1)).toBe(true)
      expect(s.readIds.has(2)).toBe(true)
      expect(s.readIds.has(3)).toBe(true)
      expect(s.readIds.size).toBe(3)
    })
  })
})
