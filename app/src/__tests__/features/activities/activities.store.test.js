// Unit tests for features/activities/activities.store.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('../../../features/activities/activitiesService.js', () => ({
  fetchAll: vi.fn(),
  fetchByMonth: vi.fn(),
}))

vi.mock('../../../core/services/imageService.js', () => ({
  fetchImages: vi.fn(() => Promise.resolve({})),
  getCached: vi.fn(() => ''),
}))

vi.mock('../../../core/utils/cache.js', () => ({
  lsGet: vi.fn(() => null),
  lsSet: vi.fn(),
  stripBase64: vi.fn(arr => arr),
}))

import { useActivitiesStore } from '../../../features/activities/activities.store.js'
import * as svc from '../../../features/activities/activitiesService.js'
import { fetchImages, getCached } from '../../../core/services/imageService.js'
import { lsGet, lsSet, stripBase64 } from '../../../core/utils/cache.js'

function makeAct(overrides = {}) {
  return {
    id: 1,
    monthIdx: 5,
    name: 'Test Activity',
    emoji: '🎉',
    date: '2026-05-20',
    dateEnd: '',
    loc: 'Office',
    desc: '',
    steps: '',
    joinUrl: '',
    joinOpen: true,
    joinLabel: '',
    joinOpenAt: '',
    joinCloseAt: '',
    feedbackUrl: '',
    imgUrl: '',
    imgId: '',
    createdAt: '2026-05-01T00:00:00Z',
    ticketEnabled: false,
    ticketTitle: '',
    ticketPrice: 0,
    ticketCapacity: null,
    ticketNote: '',
    ticketOpenAt: '',
    ...overrides,
  }
}

describe('activities.store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useActivitiesStore()
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('initial state', () => {
    it('all is empty array', () => {
      expect(store.all).toEqual([])
    })

    it('isLoading is false', () => {
      expect(store.isLoading).toBe(false)
    })

    it('loaded is false', () => {
      expect(store.loaded).toBe(false)
    })

    it('loadError is empty string', () => {
      expect(store.loadError).toBe('')
    })
  })

  describe('byMonth (computed)', () => {
    it('groups activities by monthIdx', () => {
      store.all = [
        makeAct({ id: 1, monthIdx: 3 }),
        makeAct({ id: 2, monthIdx: 5 }),
        makeAct({ id: 3, monthIdx: 3 }),
        makeAct({ id: 4, monthIdx: 7 }),
      ]
      const map = store.byMonth
      expect(Object.keys(map)).toEqual(['3', '5', '7'])
      expect(map[3]).toHaveLength(2)
      expect(map[5]).toHaveLength(1)
      expect(map[7]).toHaveLength(1)
    })

    it('returns empty object when no activities', () => {
      expect(store.byMonth).toEqual({})
    })
  })

  describe('getMonth', () => {
    beforeEach(() => {
      store.all = [
        makeAct({ id: 1, monthIdx: 3 }),
        makeAct({ id: 2, monthIdx: 5 }),
        makeAct({ id: 3, monthIdx: 3 }),
      ]
    })

    it('returns activities for a specific month', () => {
      const acts = store.getMonth(3)
      expect(acts).toHaveLength(2)
      expect(acts.map(a => a.id)).toEqual([1, 3])
    })

    it('returns activities for month 5', () => {
      const acts = store.getMonth(5)
      expect(acts).toHaveLength(1)
      expect(acts[0].id).toBe(2)
    })

    it('returns empty array for unknown month', () => {
      expect(store.getMonth(12)).toEqual([])
    })

    it('returns empty array for month with no activities', () => {
      expect(store.getMonth(0)).toEqual([])
    })
  })

  describe('load', () => {
    const mockData = [
      makeAct({ id: 1, monthIdx: 3, name: 'Workshop' }),
      makeAct({ id: 2, monthIdx: 5, name: 'Party' }),
    ]

    it('fetches data from service and populates all', async () => {
      svc.fetchAll.mockResolvedValue(mockData)

      await store.load()

      expect(store.all).toHaveLength(2)
      expect(store.all[0].name).toBe('Workshop')
      expect(store.all[1].name).toBe('Party')
      expect(store.isLoading).toBe(false)
      expect(store.loaded).toBe(true)
      expect(store.loadError).toBe('')
    })

    it('respects loaded flag and skips fetch when already loaded', async () => {
      svc.fetchAll.mockResolvedValue(mockData)
      await store.load()
      expect(svc.fetchAll).toHaveBeenCalledTimes(1)

      svc.fetchAll.mockResolvedValue([makeAct({ id: 3 })])
      await store.load()
      expect(svc.fetchAll).toHaveBeenCalledTimes(1)
    })

    it('force=true re-fetches even when already loaded', async () => {
      svc.fetchAll.mockResolvedValue(mockData)
      await store.load()
      expect(svc.fetchAll).toHaveBeenCalledTimes(1)

      svc.fetchAll.mockResolvedValue([makeAct({ id: 3, name: 'New' })])
      await store.load(true)
      expect(svc.fetchAll).toHaveBeenCalledTimes(2)
      expect(store.all).toHaveLength(1)
      expect(store.all[0].name).toBe('New')
    })

    it('hydrates from cache when all is empty', async () => {
      const cached = [makeAct({ id: 99, name: 'Cached' })]
      lsGet.mockReturnValue(cached)
      svc.fetchAll.mockResolvedValue(mockData)

      await store.load()

      // Cache hydrated before fetch
      expect(lsGet).toHaveBeenCalledWith('activities')
      expect(store.loaded).toBe(true)
    })

    it('saves to cache after successful fetch', async () => {
      svc.fetchAll.mockResolvedValue(mockData)

      await store.load()

      expect(lsSet).toHaveBeenCalledWith('activities', mockData, expect.any(Number))
      expect(stripBase64).toHaveBeenCalledWith(mockData, 'imgUrl')
    })

    it('applies cached images before lazy-fetch', async () => {
      const dataWithImg = [
        makeAct({ id: 1, imgId: 'abc123', imgUrl: '' }),
      ]
      getCached.mockReturnValue('https://cached.url/img.jpg')
      svc.fetchAll.mockResolvedValue(dataWithImg)

      await store.load()

      expect(store.all[0].imgUrl).toBe('https://cached.url/img.jpg')
    })

    it('keeps existing http imgUrl from DB', async () => {
      const dataWithHttp = [
        makeAct({ id: 1, imgId: 'abc123', imgUrl: 'https://db.url/img.jpg' }),
      ]
      svc.fetchAll.mockResolvedValue(dataWithHttp)

      await store.load()

      expect(store.all[0].imgUrl).toBe('https://db.url/img.jpg')
    })

    it('lazy-fetches Drive images after render', async () => {
      const dataWithDrive = [
        makeAct({ id: 1, imgId: 'drive123', imgUrl: '' }),
      ]
      svc.fetchAll.mockResolvedValue(dataWithDrive)
      fetchImages.mockResolvedValue({ drive123: 'https://drive.url/img.jpg' })

      await store.load()

      // wait for the lazy fetch promise
      await vi.dynamicImportSettled?.() || new Promise(r => setTimeout(r, 10))

      expect(fetchImages).toHaveBeenCalledWith(['drive123'])
    })

    it('sets error on fetch failure', async () => {
      svc.fetchAll.mockRejectedValue(new Error('Network error'))

      await store.load()

      expect(store.loadError).toBe('Network error')
      expect(store.isLoading).toBe(false)
    })

    it('sets error message with Thai fallback when error has no message', async () => {
      svc.fetchAll.mockRejectedValue(new Error())

      await store.load()

      expect(store.loadError).toBe('โหลดข้อมูลไม่สำเร็จ')
      expect(store.isLoading).toBe(false)
    })

    it('sets loaded true if all had cached data even when fetch fails', async () => {
      const cached = [makeAct({ id: 1 })]
      lsGet.mockReturnValue(cached)
      svc.fetchAll.mockRejectedValue(new Error('Network error'))

      await store.load()

      expect(store.loaded).toBe(true)
      expect(store.all).toEqual(cached)
    })
  })

  describe('localAdd', () => {
    it('adds an activity to the all array', () => {
      const act = makeAct({ id: 1, name: 'New Activity' })
      store.localAdd(act)
      expect(store.all).toHaveLength(1)
      expect(store.all[0].name).toBe('New Activity')
    })

    it('appends multiple activities', () => {
      store.localAdd(makeAct({ id: 1 }))
      store.localAdd(makeAct({ id: 2 }))
      expect(store.all).toHaveLength(2)
    })

    it('adds activity to the end of the array', () => {
      store.all = [makeAct({ id: 1 })]
      store.localAdd(makeAct({ id: 2 }))
      expect(store.all[1].id).toBe(2)
    })
  })

  describe('localUpdate', () => {
    beforeEach(() => {
      store.all = [
        makeAct({ id: 1, name: 'First', loc: 'Room A' }),
        makeAct({ id: 2, name: 'Second', loc: 'Room B' }),
      ]
    })

    it('updates fields of an existing activity by id', () => {
      store.localUpdate(1, { name: 'Updated First', loc: 'Room C' })
      expect(store.all[0].name).toBe('Updated First')
      expect(store.all[0].loc).toBe('Room C')
      expect(store.all[1].name).toBe('Second') // unchanged
    })

    it('does nothing when id not found', () => {
      store.localUpdate(999, { name: 'Ghost' })
      expect(store.all).toHaveLength(2)
      expect(store.all[0].name).toBe('First')
    })

    it('preserves fields not in the update', () => {
      store.localUpdate(1, { name: 'Renamed' })
      expect(store.all[0].loc).toBe('Room A')
    })
  })

  describe('localDelete', () => {
    beforeEach(() => {
      store.all = [
        makeAct({ id: 1, name: 'First' }),
        makeAct({ id: 2, name: 'Second' }),
        makeAct({ id: 3, name: 'Third' }),
      ]
    })

    it('removes activity by id', () => {
      store.localDelete(2)
      expect(store.all).toHaveLength(2)
      expect(store.all.map(a => a.id)).toEqual([1, 3])
    })

    it('removes the first activity', () => {
      store.localDelete(1)
      expect(store.all.map(a => a.id)).toEqual([2, 3])
    })

    it('removes the last activity', () => {
      store.localDelete(3)
      expect(store.all.map(a => a.id)).toEqual([1, 2])
    })

    it('does nothing when id not found', () => {
      store.localDelete(999)
      expect(store.all).toHaveLength(3)
    })
  })

  describe('snapshot', () => {
    it('creates a snapshot of the current all array', () => {
      store.all = [
        makeAct({ id: 1, name: 'Original' }),
      ]
      const rollback = store.snapshot()
      store.all[0].name = 'Modified'
      expect(store.all[0].name).toBe('Modified')
      rollback()
      expect(store.all[0].name).toBe('Original')
    })

    it('restores deep copy (not reference)', () => {
      store.all = [makeAct({ id: 1, name: 'Original' })]
      const rollback = store.snapshot()
      store.all.push(makeAct({ id: 2, name: 'New' }))
      rollback()
      expect(store.all).toHaveLength(1)
    })

    it('rollback restores multiple items', () => {
      store.all = [
        makeAct({ id: 1, name: 'A' }),
        makeAct({ id: 2, name: 'B' }),
      ]
      const rollback = store.snapshot()
      store.all = []
      rollback()
      expect(store.all).toHaveLength(2)
    })

    it('rollback can be called multiple times', () => {
      store.all = [makeAct({ id: 1 })]
      const rollback = store.snapshot()
      store.all = []
      rollback()
      expect(store.all).toHaveLength(1)
      store.all = []
      rollback()
      expect(store.all).toHaveLength(1)
    })
  })
})
