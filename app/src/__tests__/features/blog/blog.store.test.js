// Unit tests for features/blog/blog.store.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const fakePosts = [
  { id: 1, title: 'First Post', body: 'Content', category: 'tech', authorName: 'Alice', authorId: 'e1', createdAt: '2026-01-01T00:00:00Z' },
  { id: 2, title: 'Second Post', body: 'More', category: 'news', authorName: 'Bob', authorId: 'e2', createdAt: '2026-01-02T00:00:00Z' },
]

// Share mock instances across the store and tests via vi.hoisted
const { mockShowToast } = vi.hoisted(() => ({
  mockShowToast: vi.fn(),
}))

vi.mock('../../../features/blog/blogService.js', () => ({
  fetchBlogPosts: vi.fn(),
  submitBlogPost: vi.fn(),
  adminDeleteBlogPost: vi.fn(),
  adminUpdateBlogPost: vi.fn(),
}))

vi.mock('../../../core/stores/ui.js', () => ({
  useUiStore: vi.fn(() => ({ showToast: mockShowToast })),
}))

vi.mock('../../../core/stores/userAuth.js', () => ({
  useUserAuthStore: vi.fn(() => ({ userId: '42', userName: 'Alice' })),
}))

import { useBlogStore, BLOG_CATEGORIES, getCatInfo } from '../../../features/blog/blog.store.js'
import * as svc from '../../../features/blog/blogService.js'

describe('useBlogStore', () => {
  let store

  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    store = useBlogStore()
  })

  /* ── Exports ── */

  describe('BLOG_CATEGORIES', () => {
    it('defines 5 expected categories', () => {
      expect(BLOG_CATEGORIES).toHaveLength(5)
      const keys = BLOG_CATEGORIES.map((c) => c.key)
      expect(keys).toEqual(['news', 'tech', 'exp', 'event', 'other'])
    })

    it('each category has key, label, color, bg', () => {
      for (const cat of BLOG_CATEGORIES) {
        expect(cat).toHaveProperty('key')
        expect(cat).toHaveProperty('label')
        expect(cat).toHaveProperty('color')
        expect(cat).toHaveProperty('bg')
      }
    })
  })

  describe('getCatInfo', () => {
    it('returns matching category by key', () => {
      expect(getCatInfo('tech').label).toContain('เทคนิค')
    })

    it('falls back to "other" for unknown key', () => {
      expect(getCatInfo('unknown').key).toBe('other')
    })
  })

  /* ── Initial state ── */

  describe('initial state', () => {
    it('posts is an empty array', () => {
      expect(store.posts).toEqual([])
    })

    it('isLoading is false', () => {
      expect(store.isLoading).toBe(false)
    })

    it('selectedPost is null', () => {
      expect(store.selectedPost).toBeNull()
    })
  })

  /* ── loadPosts ── */

  describe('loadPosts', () => {
    it('fetches posts from service and stores them', async () => {
      svc.fetchBlogPosts.mockResolvedValue(fakePosts)
      await store.loadPosts(true)

      expect(svc.fetchBlogPosts).toHaveBeenCalledOnce()
      expect(store.posts).toEqual(fakePosts)
      expect(store.isLoading).toBe(false)
    })

    it('respects cache TTL (60 s) and does not call service again within that window', async () => {
      svc.fetchBlogPosts.mockResolvedValue(fakePosts)
      await store.loadPosts(true)
      expect(svc.fetchBlogPosts).toHaveBeenCalledTimes(1)

      svc.fetchBlogPosts.mockResolvedValue([...fakePosts, { id: 3, title: 'Third' }])
      await store.loadPosts() // force = false
      expect(svc.fetchBlogPosts).toHaveBeenCalledTimes(1) // still 1 — cached
      expect(store.posts).toHaveLength(2) // still old data
    })

    it('re-fetches when force is true regardless of TTL', async () => {
      svc.fetchBlogPosts.mockResolvedValue(fakePosts)
      await store.loadPosts(true)
      const newData = [...fakePosts, { id: 3, title: 'Third Post' }]
      svc.fetchBlogPosts.mockResolvedValue(newData)

      await store.loadPosts(true) // force = true
      expect(svc.fetchBlogPosts).toHaveBeenCalledTimes(2)
      expect(store.posts).toHaveLength(3)
    })

    it('sets posts to empty array on fetch error', async () => {
      store.posts = [...fakePosts]
      svc.fetchBlogPosts.mockRejectedValue(new Error('Network error'))
      await store.loadPosts(true)

      expect(store.posts).toEqual([])
      expect(store.isLoading).toBe(false)
    })

    it('toggles isLoading during fetch', async () => {
      svc.fetchBlogPosts.mockResolvedValue(fakePosts)
      const promise = store.loadPosts(true)
      expect(store.isLoading).toBe(true)
      await promise
      expect(store.isLoading).toBe(false)
    })
  })

  /* ── submitPost ── */

  describe('submitPost', () => {
    const payload = { title: 'My Post', body: 'Hello', category: 'tech', authorName: 'Alice', authorId: '42' }
    const createdPost = { id: 10, title: 'My Post', body: 'Hello', category: 'tech', authorName: 'Alice', authorId: '42', createdAt: '2026-05-18T00:00:00Z' }

    it('adds a temporary post optimistically then replaces it on success', async () => {
      svc.submitBlogPost.mockResolvedValue(createdPost)
      await store.submitPost(payload)

      // Temporary item added immediately
      expect(store.posts).toHaveLength(1)
      // After promise resolves, temp is replaced with real data
      expect(store.posts[0].id).toBe(10)
      expect(store.posts[0].title).toBe('My Post')
    })

    it('removes temporary post on error', async () => {
      svc.submitBlogPost.mockRejectedValue(new Error('Insert failed'))
      await store.submitPost(payload)

      expect(store.posts).toHaveLength(0)
    })

    it('calls showToast on success with success message', async () => {
      svc.submitBlogPost.mockResolvedValue(createdPost)
      await store.submitPost(payload)
      expect(mockShowToast).toHaveBeenCalledWith(expect.stringContaining('สำเร็จ'))
    })

    it('calls showToast on error with error message', async () => {
      svc.submitBlogPost.mockRejectedValue(new Error('Fail'))
      await store.submitPost(payload)
      expect(mockShowToast).toHaveBeenCalledWith(expect.stringContaining('ผิดพลาด'))
    })

    it('temporary post has a tmp_ id and createdAt', async () => {
      // Capture state mid-flight by not resolving immediately
      svc.submitBlogPost.mockImplementation(() => new Promise((r) => setTimeout(() => r(createdPost), 50)))
      const promise = store.submitPost(payload)

      expect(store.posts).toHaveLength(1)
      expect(store.posts[0].id).toMatch(/^tmp_/)
      expect(store.posts[0].createdAt).toBeTypeOf('string')

      await promise
    })
  })

  /* ── openPost / closePost ── */

  describe('openPost / closePost', () => {
    it('openPost sets selectedPost', () => {
      const post = { id: 1, title: 'Test' }
      store.openPost(post)
      expect(store.selectedPost).toStrictEqual(post)
    })

    it('closePost clears selectedPost', () => {
      store.openPost({ id: 1 })
      store.closePost()
      expect(store.selectedPost).toBeNull()
    })
  })
})
