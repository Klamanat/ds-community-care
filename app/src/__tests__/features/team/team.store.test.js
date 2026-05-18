// Unit tests for features/team/team.store.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('../../../features/team/teamService.js', () => ({
  fetchTeam: vi.fn(),
  fetchStarGang: vi.fn(),
  fetchDirectory: vi.fn(),
  joinStarGang: vi.fn(),
  addTeamMember: vi.fn(),
}))

vi.mock('../../../core/services/imageService.js', () => ({
  fetchImages: vi.fn(() => Promise.resolve({})),
  getCached: vi.fn(() => ''),
}))

vi.mock('../../../core/stores/ui.js', () => ({
  useUiStore: vi.fn(() => ({ showToast: vi.fn() })),
}))

vi.mock('../../../core/utils/cache.js', () => ({
  lsGet: vi.fn(() => null),
  lsSet: vi.fn(),
  lsDel: vi.fn(),
  stripBase64: vi.fn(arr => arr),
}))

import { useTeamStore } from '../../../features/team/team.store.js'
import * as svc from '../../../features/team/teamService.js'

describe('team.store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useTeamStore()
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('initial state', () => {
    it('has empty empTeam', () => {
      expect(store.empTeam).toEqual([])
    })

    it('has empty empDirectory', () => {
      expect(store.empDirectory).toEqual([])
    })

    it('has empty sgMembers', () => {
      expect(store.sgMembers).toEqual([])
    })

    it('has joinCount 0', () => {
      expect(store.joinCount).toBe(0)
    })

    it('has isLoading false', () => {
      expect(store.isLoading).toBe(false)
    })

    it('has loadError empty', () => {
      expect(store.loadError).toBe('')
    })
  })

  describe('loadTeam', () => {
    const mockTeam = [
      { id: 1, empCode: 'E001', name: 'Alice', role: 'Developer', dept: 'IT', grad: '', imgUrl: '', imgId: '', inTeam: true },
      { id: 2, empCode: 'E002', name: 'Bob', role: 'Designer', dept: 'Creative', grad: '', imgUrl: '', imgId: '', inTeam: true },
    ]

    it('fetches and stores team members', async () => {
      svc.fetchTeam.mockResolvedValue(mockTeam)

      await store.loadTeam()

      expect(svc.fetchTeam).toHaveBeenCalled()
      expect(store.empTeam).toEqual(mockTeam)
      expect(store.lastFetched).not.toBeNull()
      expect(store.isLoading).toBe(false)
      expect(store.loadError).toBe('')
    })

    it('skips fetch if called within 60s cache window', async () => {
      svc.fetchTeam.mockResolvedValue(mockTeam)

      await store.loadTeam()
      expect(svc.fetchTeam).toHaveBeenCalledTimes(1)

      vi.clearAllMocks()
      await store.loadTeam()
      expect(svc.fetchTeam).not.toHaveBeenCalled()
    })

    it('re-fetches on force=true', async () => {
      svc.fetchTeam.mockResolvedValue(mockTeam)
      await store.loadTeam()
      vi.clearAllMocks()

      svc.fetchTeam.mockResolvedValue([mockTeam[0]])
      await store.loadTeam(true)
      expect(svc.fetchTeam).toHaveBeenCalledTimes(1)
    })

    it('sets loadError on failure', async () => {
      svc.fetchTeam.mockRejectedValue(new Error('Network error'))

      await store.loadTeam()

      expect(store.loadError).toBe('Network error')
      expect(store.isLoading).toBe(false)
    })
  })

  describe('loadDirectory', () => {
    const mockDirectory = [
      { id: 1, empCode: 'E001', name: 'Alice', role: 'Developer', dept: 'IT' },
      { id: 2, empCode: 'E002', name: 'Bob', role: 'Designer', dept: 'Creative' },
    ]

    it('fetches and stores directory', async () => {
      svc.fetchDirectory.mockResolvedValue(mockDirectory)

      await store.loadDirectory()

      expect(svc.fetchDirectory).toHaveBeenCalled()
      expect(store.empDirectory).toEqual(mockDirectory)
    })

    it('sets loadError on failure', async () => {
      svc.fetchDirectory.mockRejectedValue(new Error('Load failed'))

      await store.loadDirectory()

      expect(store.loadError).toBe('Load failed')
    })
  })

  describe('loadStarGang', () => {
    const mockSg = [
      { id: 3, empCode: 'E003', name: 'Charlie', role: 'PM', imgUrl: '', imgId: '', inStarGang: true },
    ]

    it('fetches and stores star gang members', async () => {
      svc.fetchStarGang.mockResolvedValue(mockSg)

      await store.loadStarGang()

      expect(svc.fetchStarGang).toHaveBeenCalled()
      expect(store.sgMembers).toEqual(mockSg)
      expect(store.joinCount).toBe(1)
    })

    it('sets loadError on failure', async () => {
      svc.fetchStarGang.mockRejectedValue(new Error('Failed'))

      await store.loadStarGang()

      expect(store.loadError).toBe('Failed')
    })

    it('handles empty response', async () => {
      svc.fetchStarGang.mockResolvedValue([])

      await store.loadStarGang()

      expect(store.sgMembers).toEqual([])
      expect(store.joinCount).toBe(0)
    })

    it('handles fetch error gracefully', async () => {
      svc.fetchStarGang.mockRejectedValue(new Error('Network error'))

      await store.loadStarGang()

      expect(store.loadError).toBe('Network error')
      expect(store.sgMembers).toEqual([])
      expect(store.joinCount).toBe(0)
    })

    it('loadStarGang handles non-Error rejection with fallback message', async () => {
      svc.fetchStarGang.mockRejectedValue('string error')

      await store.loadStarGang()

      expect(store.loadError).toBe('โหลดข้อมูลไม่สำเร็จ')
      expect(store.sgMembers).toEqual([])
      expect(store.joinCount).toBe(0)
    })
  })

  describe('getSgFallback', () => {
    it('returns correct color for index', () => {
      expect(store.getSgFallback(0)).toBe('#FDE68A')
    })

    it('wraps around for large indices', () => {
      expect(store.getSgFallback(6)).toBe(store.getSgFallback(0))
    })
  })

  describe('getGrad', () => {
    it('returns correct gradient for index', () => {
      const grad = store.getGrad(0)
      expect(grad).toContain('linear-gradient')
    })

    it('wraps around for large indices', () => {
      expect(store.getGrad(5)).toBe(store.getGrad(0))
    })
  })

  describe('addToTeam (optimistic)', () => {
    const newMember = { id: 10, name: 'Diana', role: 'QA', dept: 'IT' }

    it('adds member optimistically and persists on success', async () => {
      svc.addTeamMember.mockResolvedValue({ ...newMember, inTeam: true })

      await store.addToTeam(newMember)

      expect(store.empTeam).toHaveLength(1)
      expect(store.empTeam[0].name).toBe('Diana')
      expect(svc.addTeamMember).toHaveBeenCalled()
    })

    it('removes member on API failure', async () => {
      svc.addTeamMember.mockRejectedValue(new Error('Insert failed'))

      await store.addToTeam(newMember)

      expect(store.empTeam).toEqual([])
    })

    it('does not add duplicate member', async () => {
      svc.addTeamMember.mockResolvedValue({ ...newMember, inTeam: true })
      await store.addToTeam(newMember)
      vi.clearAllMocks()

      // Try adding Diana again (same id)
      await store.addToTeam(newMember)
      expect(store.empTeam).toHaveLength(1)
      expect(svc.addTeamMember).not.toHaveBeenCalled()
    })
  })

  describe('joinStarGang (optimistic)', () => {
    const member = { name: 'Eve', role: 'Dev' }

    it('adds member optimistically', async () => {
      svc.joinStarGang.mockResolvedValue({ ...member, inStarGang: true })

      await store.joinStarGang(member)

      expect(store.sgMembers).toHaveLength(1)
      expect(store.joinCount).toBe(1)
      expect(svc.joinStarGang).toHaveBeenCalledWith(member)
    })

    it('removes member on API failure', async () => {
      svc.joinStarGang.mockRejectedValue(new Error('Insert failed'))

      await store.joinStarGang(member)

      expect(store.sgMembers).toEqual([])
      expect(store.joinCount).toBe(0)
    })
  })
})
