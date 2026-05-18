// Unit tests for features/ideas/ideas.store.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock the ideaService module
vi.mock('../../../features/ideas/ideaService.js', () => ({
  fetchIdeas: vi.fn(),
  submitIdea: vi.fn(),
}))

// Mock ui store's showToast
vi.mock('../../../core/stores/ui.js', () => ({
  useUiStore: vi.fn(() => ({
    showToast: vi.fn(),
  })),
}))

import { useIdeasStore } from '../../../features/ideas/ideas.store.js'
import * as svc from '../../../features/ideas/ideaService.js'

describe('ideas.store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useIdeasStore()
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('initial state', () => {
    it('has empty ideas array', () => {
      expect(store.ideas).toEqual([])
    })

    it('has default categories', () => {
      expect(store.categories.length).toBe(6)
      expect(store.categories[0]).toContain('สังสรรค์')
    })

    it('has isLoading false', () => {
      expect(store.isLoading).toBe(false)
    })

    it('has loadError empty', () => {
      expect(store.loadError).toBe('')
    })

    it('has selectedCategory null', () => {
      expect(store.selectedCategory).toBeNull()
    })
  })

  describe('loadIdeas', () => {
    it('fetches and stores ideas', async () => {
      const mockIdeas = [
        { id: 1, title: 'Idea 1', category: 'party', status: 'pending' },
        { id: 2, title: 'Idea 2', category: 'learn', status: 'approved' },
      ]
      svc.fetchIdeas.mockResolvedValue(mockIdeas)

      await store.loadIdeas()

      expect(store.ideas).toEqual(mockIdeas)
      expect(store.isLoading).toBe(false)
      expect(store.loadError).toBe('')
    })

    it('skips fetch if called within 60s cache window', async () => {
      svc.fetchIdeas.mockResolvedValue([{ id: 1, title: 'Cached' }])
      await store.loadIdeas()
      expect(svc.fetchIdeas).toHaveBeenCalledTimes(1)

      // Second call within 60s should skip
      await store.loadIdeas()
      expect(svc.fetchIdeas).toHaveBeenCalledTimes(1)
    })

    it('re-fetches on force=true', async () => {
      svc.fetchIdeas.mockResolvedValue([{ id: 1 }])
      await store.loadIdeas()
      await store.loadIdeas(true) // force
      expect(svc.fetchIdeas).toHaveBeenCalledTimes(2)
    })

    it('sets error on failure', async () => {
      svc.fetchIdeas.mockRejectedValue(new Error('Network error'))
      await store.loadIdeas()
      expect(store.loadError).toBe('Network error')
      expect(store.ideas).toEqual([])
      expect(store.isLoading).toBe(false)
    })
  })

  describe('submitIdea', () => {
    const sampleIdea = {
      category: 'learn',
      title: 'Test Idea',
      submitterName: 'Alice',
    }

    it('adds idea optimistically and replaces on success', async () => {
      svc.submitIdea.mockResolvedValue({
        id: 99,
        category: 'learn',
        title: 'Test Idea',
        status: 'pending',
        createdAt: '2026-05-18',
      })

      await store.submitIdea(sampleIdea)

      expect(store.ideas.length).toBe(1)
      expect(store.ideas[0].id).toBe(99)
    })

    it('removes temp idea on API failure', async () => {
      svc.submitIdea.mockRejectedValue(new Error('Insert failed'))

      await store.submitIdea(sampleIdea)

      expect(store.ideas).toEqual([])
    })

    it('blocks submit when rate limited', async () => {
      localStorage.setItem('ds_idea_last', String(Date.now()))
      await store.submitIdea(sampleIdea)
      expect(store.ideas).toEqual([])
    })
  })

  describe('selectCategory', () => {
    it('sets selectedCategory', () => {
      store.selectCategory('party')
      expect(store.selectedCategory).toBe('party')
    })

    it('toggles off if same category clicked', () => {
      store.selectCategory('party')
      store.selectCategory('party')
      expect(store.selectedCategory).toBeNull()
    })
  })

  describe('filteredIdeas (computed)', () => {
    beforeEach(() => {
      store.ideas = [
        { id: 1, title: 'Party', category: 'party', status: 'pending' },
        { id: 2, title: 'Workshop', category: 'learn', status: 'approved' },
        { id: 3, title: 'Sports Day', category: 'sport', status: 'pending' },
      ]
    })

    it('returns all ideas when no filter', () => {
      expect(store.filteredIdeas).toHaveLength(3)
    })

    it('filters by category', () => {
      store.selectedCategory = 'party'
      const filtered = store.filteredIdeas
      expect(filtered).toHaveLength(1)
      expect(filtered[0].title).toBe('Party')
    })
  })
})
