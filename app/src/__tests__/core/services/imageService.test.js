// Unit tests for core/services/imageService.js — 3-tier image cache
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── Mock edgeFunctions ────────────────────────────────────────────────
vi.mock('../../../core/services/edgeFunctions.js', () => ({
  getImages: vi.fn(),
}))

// Stub env vars BEFORE the module is imported so that STORAGE_BASE is
// predictable across test runs (even after vi.resetModules).
vi.stubEnv('VITE_SUPABASE_URL', 'https://test-project.supabase.co')
vi.stubEnv('VITE_STORAGE_CDN', '')

const STORAGE_BASE = 'https://test-project.supabase.co/storage/v1/object/public/images/'
const LS_KEY = 'dsc_imgcache_v3'

async function importImageService() {
  vi.resetModules()
  return import('../../../core/services/imageService.js')
}

describe('imageService — 3-tier cache', () => {
  let service
  let edgeSvc

  beforeEach(async () => {
    localStorage.clear()
    vi.clearAllMocks()
    service = await importImageService()
    edgeSvc = await import('../../../core/services/edgeFunctions.js')
  })

  // ── getCached ─────────────────────────────────────────────────────

  describe('getCached', () => {
    it('returns empty string for null / undefined / empty input', () => {
      expect(service.getCached(null)).toBe('')
      expect(service.getCached(undefined)).toBe('')
      expect(service.getCached('')).toBe('')
    })

    it('returns full URL as-is when input starts with http', () => {
      const url = 'https://cdn.example.com/photo.jpg'
      expect(service.getCached(url)).toBe(url)
    })

    it('builds Supabase Storage URL for storage paths (contains /)', () => {
      const result = service.getCached('empathy/1710425_image.jpg')
      expect(result).toBe(STORAGE_BASE + 'empathy/1710425_image.jpg')

      // Verify encoding for special characters
      const withSpecial = service.getCached('activities/2026/hello world.png')
      expect(withSpecial).toBe(STORAGE_BASE + 'activities/2026/hello%20world.png')
    })

    it('returns empty string for unknown Drive IDs (not in cache)', () => {
      expect(service.getCached('unknownDriveId123')).toBe('')
      expect(service.getCached('1ABCdef2GHIjkl3')).toBe('')
    })
  })

  // ── fetchImages ───────────────────────────────────────────────────

  describe('fetchImages', () => {
    beforeEach(() => { vi.useFakeTimers() })
    afterEach(() => { vi.useRealTimers() })

    it('resolves Drive IDs via edge function and caches result', async () => {
      edgeSvc.getImages.mockResolvedValue({
        tgt001: 'https://drive.google.com/thumbnail?id=tgt001&sz=w800',
      })

      const promise = service.fetchImages(['tgt001'])

      // Advance the 50ms batch timer
      await vi.advanceTimersByTimeAsync(50)

      const result = await promise

      expect(edgeSvc.getImages).toHaveBeenCalledTimes(1)
      expect(edgeSvc.getImages).toHaveBeenCalledWith(['tgt001'])
      expect(result).toEqual({
        tgt001: 'https://drive.google.com/thumbnail?id=tgt001&sz=w800',
      })

      // Verify value is now cached for synchronous access
      expect(service.getCached('tgt001')).toBe(
        'https://drive.google.com/thumbnail?id=tgt001&sz=w800'
      )
    })

    it('returns immediate results for storage paths without calling edge function', async () => {
      const result = await service.fetchImages(['empathy/test.jpg'])

      expect(edgeSvc.getImages).not.toHaveBeenCalled()
      expect(result).toEqual({
        'empathy/test.jpg': STORAGE_BASE + 'empathy/test.jpg',
      })
    })

    it('coalesces multiple calls within the 50ms batch window into one request', async () => {
      edgeSvc.getImages.mockResolvedValue({
        batch1: 'https://img1.url',
        batch2: 'https://img2.url',
      })

      // Make two calls without advancing timers — both queue into same batch
      const promise1 = service.fetchImages(['batch1'])
      const promise2 = service.fetchImages(['batch2'])

      // Advance timers past the 50ms batch window
      await vi.advanceTimersByTimeAsync(50)

      const [result1, result2] = await Promise.all([promise1, promise2])

      // Edge function should be called ONCE with both IDs
      expect(edgeSvc.getImages).toHaveBeenCalledTimes(1)
      expect(edgeSvc.getImages).toHaveBeenCalledWith(['batch1', 'batch2'])

      // Each promise resolves only with the IDs its caller asked for
      expect(result1).toEqual({ batch1: 'https://img1.url' })
      expect(result2).toEqual({ batch2: 'https://img2.url' })
    })

    it('only requests missing Drive IDs, reusing cached ones', async () => {
      // First call populates cache for cacheA and cacheB
      edgeSvc.getImages.mockResolvedValueOnce({
        cacheA: 'https://cached.url',
        cacheB: 'https://cached.url',
      })
      const first = service.fetchImages(['cacheA', 'cacheB'])
      await vi.advanceTimersByTimeAsync(50)
      await first

      edgeSvc.getImages.mockClear()

      // Second call — cacheA is cached, freshC is new
      edgeSvc.getImages.mockResolvedValue({
        freshC: 'https://fresh.url',
      })
      const promise = service.fetchImages(['cacheA', 'freshC'])
      await vi.advanceTimersByTimeAsync(50)
      const result = await promise

      // Only the uncached ID should be fetched
      expect(edgeSvc.getImages).toHaveBeenCalledTimes(1)
      expect(edgeSvc.getImages).toHaveBeenCalledWith(['freshC'])

      expect(result).toEqual({
        cacheA: 'https://cached.url',
        freshC: 'https://fresh.url',
      })
    })

    // ── New: Drive thumbnail fallback when edge function fails ──────

    it('falls back to Drive thumbnail URL when edge function throws', async () => {
      edgeSvc.getImages.mockRejectedValue(new Error('Network error'))

      const promise = service.fetchImages(['fallbackId'])
      await vi.advanceTimersByTimeAsync(50)
      const result = await promise

      // The fallback URL should be used
      expect(result).toEqual({
        fallbackId: 'https://drive.google.com/thumbnail?id=fallbackId&sz=w800',
      })

      // The value should also be cached for synchronous access
      expect(service.getCached('fallbackId')).toBe(
        'https://drive.google.com/thumbnail?id=fallbackId&sz=w800'
      )
    })

    it('fallback Drive thumbnail populates cache even on edge function failure', async () => {
      edgeSvc.getImages.mockRejectedValue(new Error('Timeout'))

      // First request triggers the fallback
      const promise1 = service.fetchImages(['timeoutId'])
      await vi.advanceTimersByTimeAsync(50)
      await promise1

      // Second request should use the cached fallback, not call edge function again
      edgeSvc.getImages.mockClear()

      const promise2 = service.fetchImages(['timeoutId'])
      await vi.advanceTimersByTimeAsync(50)
      const result2 = await promise2

      expect(edgeSvc.getImages).not.toHaveBeenCalled()
      expect(result2).toEqual({
        timeoutId: 'https://drive.google.com/thumbnail?id=timeoutId&sz=w800',
      })
    })
  })

  // ── forceRefreshImage ─────────────────────────────────────────────

  describe('forceRefreshImage', () => {
    beforeEach(() => { vi.useFakeTimers() })
    afterEach(() => { vi.useRealTimers() })

    it('bypasses cache and re-fetches a Drive ID from the edge function', async () => {
      // Populate cache first
      edgeSvc.getImages.mockResolvedValueOnce({ staleV: 'https://stale.url' })
      const fetchPromise = service.fetchImages(['staleV'])
      await vi.advanceTimersByTimeAsync(50)
      await fetchPromise
      expect(service.getCached('staleV')).toBe('https://stale.url')

      // Now set up fresh response and force refresh
      edgeSvc.getImages.mockResolvedValue({ staleV: 'https://fresh.url' })

      const fresh = await service.forceRefreshImage('staleV')

      // Should call edge function again despite cached value
      expect(edgeSvc.getImages).toHaveBeenCalledWith(['staleV'])
      expect(fresh).toBe('https://fresh.url')

      // Cache should now hold the fresh value
      expect(service.getCached('staleV')).toBe('https://fresh.url')
    })

    it('returns empty string for non-Drive IDs', async () => {
      const result1 = await service.forceRefreshImage('')
      expect(result1).toBe('')
      expect(edgeSvc.getImages).not.toHaveBeenCalled()

      const result2 = await service.forceRefreshImage('https://example.com/img.jpg')
      expect(result2).toBe('')
      expect(edgeSvc.getImages).not.toHaveBeenCalled()

      const result3 = await service.forceRefreshImage('empathy/test.jpg')
      expect(result3).toBe('')
      expect(edgeSvc.getImages).not.toHaveBeenCalled()
    })
  })

  // ── NEW: localStorage cache loading (_loadLs) ─────────────────────

  describe('localStorage cache (_loadLs)', () => {
    it('loads Drive IDs from localStorage into memory cache on module init', async () => {
      // Seed localStorage before importing the module
      const cached = { abc123: 'https://drive.url/abc123', def456: 'https://drive.url/def456' }
      localStorage.setItem(LS_KEY, JSON.stringify({
        exp: Date.now() + 3600000, // valid for 1 hour
        data: cached,
      }))

      // Re-import so _loadLs runs with seeded data
      service = await importImageService()

      expect(service.getCached('abc123')).toBe('https://drive.url/abc123')
      expect(service.getCached('def456')).toBe('https://drive.url/def456')
    })

    it('ignores expired cache and removes it from localStorage', async () => {
      localStorage.setItem(LS_KEY, JSON.stringify({
        exp: Date.now() - 1000, // expired 1 second ago
        data: { expiredId: 'https://old.url' },
      }))

      service = await importImageService()

      // Expired entries should not be in memory
      expect(service.getCached('expiredId')).toBe('')

      // The expired key should be removed from localStorage
      expect(localStorage.getItem(LS_KEY)).toBeNull()
    })

    it('handles missing localStorage key gracefully', async () => {
      // No localStorage item set
      service = await importImageService()

      // Should not throw; cache is empty
      expect(service.getCached('anyId')).toBe('')
    })

    it('handles corrupted JSON in localStorage gracefully', async () => {
      localStorage.setItem(LS_KEY, '{invalid json!!!')

      // Should not throw on import
      service = await importImageService()

      expect(service.getCached('anyId')).toBe('')
    })

    it('skips non-Drive IDs that leaked into localStorage cache', async () => {
      const cached = {
        validDriveId: 'https://drive.url/valid',
        'empathy/leaked.jpg': 'https://storage.url/leaked',
      }
      localStorage.setItem(LS_KEY, JSON.stringify({
        exp: Date.now() + 3600000,
        data: cached,
      }))

      service = await importImageService()

      // Valid Drive IDs should be loaded
      expect(service.getCached('validDriveId')).toBe('https://drive.url/valid')
      // Storage paths that leaked in should not be cached
      expect(service.getCached('empathy/leaked.jpg')).not.toBe('https://storage.url/leaked')
    })

    it('handles empty data object in cache without error', async () => {
      localStorage.setItem(LS_KEY, JSON.stringify({
        exp: Date.now() + 3600000,
        data: {},
      }))

      service = await importImageService()

      expect(service.getCached('anyId')).toBe('')
    })
  })

  // ── NEW: scheduled save (_scheduleSave) ──────────────────────────

  describe('scheduled save (_scheduleSave)', () => {
    beforeEach(() => { vi.useFakeTimers() })
    afterEach(() => { vi.useRealTimers() })

    it('persists in-memory cache to localStorage after 500ms', async () => {
      // Populate cache by fetching images
      edgeSvc.getImages.mockResolvedValue({
        persistId: 'https://drive.url/persist',
      })

      const promise = service.fetchImages(['persistId'])
      vi.advanceTimersByTime(50)   // flush batch timer
      await promise                 // let the flush complete

      // At this point _scheduleSave was called with a 500ms timer
      expect(localStorage.getItem(LS_KEY)).toBeNull()

      // Advance past the 500ms save threshold (sync advancement)
      vi.advanceTimersByTime(500)

      const stored = JSON.parse(localStorage.getItem(LS_KEY))
      expect(stored).toBeTruthy()
      expect(stored.data).toEqual({
        persistId: 'https://drive.url/persist',
      })
      expect(stored.exp).toBeGreaterThan(Date.now())
    })

    it('debounces multiple writes: only saves once after the last change', async () => {
      edgeSvc.getImages
        .mockResolvedValueOnce({ id1: 'https://url1' })
        .mockResolvedValueOnce({ id2: 'https://url2' })

      const p1 = service.fetchImages(['id1'])
      vi.advanceTimersByTime(50)
      await p1

      const p2 = service.fetchImages(['id2'])
      vi.advanceTimersByTime(50)
      await p2

      vi.advanceTimersByTime(500)

      const stored = JSON.parse(localStorage.getItem(LS_KEY))
      expect(stored.data).toHaveProperty('id1')
      expect(stored.data).toHaveProperty('id2')
    })

    it('handles setItem error gracefully (e.g. quota exceeded)', async () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
        .mockImplementation(() => { throw new Error('QuotaExceededError') })

      edgeSvc.getImages.mockResolvedValue({ quotaId: 'https://drive.url/quota' })

      const promise = service.fetchImages(['quotaId'])
      vi.advanceTimersByTime(50)
      await promise

      // Trigger the scheduled save (should not throw)
      vi.advanceTimersByTime(500)

      setItemSpy.mockRestore()
    })
  })

  // ── Drive thumbnail fallback (lines 75-76) ────────────────────────

  describe('Drive thumbnail fallback', () => {
    beforeEach(() => { vi.useFakeTimers() })
    afterEach(() => { vi.useRealTimers() })

    it('falls back to drive.google.com/thumbnail when edge function fails', async () => {
      edgeSvc.getImages.mockRejectedValue(new Error('Edge down'))

      const promise = service.fetchImages(['fallbackId'])
      await vi.advanceTimersByTimeAsync(50)
      const result = await promise

      expect(result).toEqual({
        fallbackId: 'https://drive.google.com/thumbnail?id=fallbackId&sz=w800',
      })
      expect(service.getCached('fallbackId'))
        .toBe('https://drive.google.com/thumbnail?id=fallbackId&sz=w800')
    })

    it('does not overwrite existing cache when edge returns empty map', async () => {
      edgeSvc.getImages.mockResolvedValueOnce({ keepId: 'https://good.url' })
      const p1 = service.fetchImages(['keepId'])
      await vi.advanceTimersByTimeAsync(50)
      await p1
      expect(service.getCached('keepId')).toBe('https://good.url')

      edgeSvc.getImages.mockResolvedValue({})
      const fresh = await service.forceRefreshImage('keepId')
      expect(fresh).toBe('')
    })
  })
})
