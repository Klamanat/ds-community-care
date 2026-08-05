// Unit tests for features/empathy/empathy.store.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('../../../features/empathy/empathyService.js', () => ({
  fetchPeople: vi.fn(),
  fetchComments: vi.fn(),
  fetchFeed: vi.fn(),
  addComment: vi.fn(),
  updateComment: vi.fn(),
  deleteComment: vi.fn(),
  toggleLike: vi.fn(),
  toggleCommentLike: vi.fn(),
  toggleChannelLike: vi.fn(),
  fetchChannelLike: vi.fn(),
  fetchChannelLikeCounts: vi.fn(),
  fetchPosts: vi.fn(() => []),
  createPost: vi.fn(() => null),
  ensurePost: vi.fn(() => null),
}))
vi.mock('../../../core/services/imageService.js', () => ({
  fetchImages: vi.fn(() => Promise.resolve({})),
  getCached: vi.fn(() => ''),
}))
vi.mock('../../../core/stores/ui.js', () => ({
  useUiStore: vi.fn(() => ({ showToast: vi.fn() })),
}))
vi.mock('../../../core/stores/userAuth.js', () => ({
  useUserAuthStore: vi.fn(() => ({ userId: '42', userName: 'Alice' })),
}))
vi.mock('../../../core/utils/cache.js', () => ({
  lsGet: vi.fn(() => null),
  lsSet: vi.fn(),
  lsDel: vi.fn(),
  stripBase64: vi.fn(arr => arr),
}))

import { useEmpathyStore } from '../../../features/empathy/empathy.store.js'
import * as svc from '../../../features/empathy/empathyService.js'

describe('empathy.store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useEmpathyStore()
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('initial state', () => {
    it('has empty arrays', () => {
      expect(store.posts).toEqual([])
      expect(store.praisedPeople).toEqual([])
      expect(store.postComments).toEqual({})
      expect(store.channelLikes).toEqual({})
      expect(store.feedPosts).toEqual([])
      expect(store.feedHasMore).toBe(true)
      expect(store.isLoading).toBe(false)
    })
  })

  describe('loadFeed', () => {
    it('fetches and stores feed posts, resetting on reset=true', async () => {
      svc.fetchFeed.mockResolvedValue([
        { id: 'c1', postId: 'E1', name: 'Alice', text: 'Hi', time: '2026-01-01', likeCount: 0, _liked: false, commentCount: 0 },
      ])
      await store.loadFeed(true)
      expect(store.feedPosts).toHaveLength(1)
      expect(store.feedPosts[0].name).toBe('Alice')
      expect(svc.fetchFeed).toHaveBeenCalledWith(15, null, '42')
    })

    it('appends on reset=false using last item time as cursor', async () => {
      store.feedPosts = [{ id: 'c1', name: 'Alice', time: '2026-01-02' }]
      svc.fetchFeed.mockResolvedValue([{ id: 'c2', name: 'Bob', time: '2026-01-01', likeCount: 0, commentCount: 0 }])
      await store.loadFeed(false)
      expect(store.feedPosts).toHaveLength(2)
      expect(svc.fetchFeed).toHaveBeenCalledWith(15, '2026-01-02', '42')
    })

    it('sets feedHasMore to false when fewer than a full page returns', async () => {
      svc.fetchFeed.mockResolvedValue([{ id: 'c1', name: 'Alice', time: '2026-01-01' }])
      await store.loadFeed(true)
      expect(store.feedHasMore).toBe(false)
    })

    it('handles fetch error by clearing feedHasMore', async () => {
      svc.fetchFeed.mockRejectedValue(new Error('fail'))
      await store.loadFeed(true)
      expect(store.feedHasMore).toBe(false)
    })
  })

  describe('toggleFeedLike (optimistic)', () => {
    it('toggles like state on a feed post', async () => {
      svc.toggleCommentLike.mockResolvedValue({ commentId: 'c1', liked: true, likeCount: 1 })
      store.feedPosts = [{ id: 'c1', name: 'Alice', likeCount: 0, _liked: false }]
      await store.toggleFeedLike('c1')
      expect(store.feedPosts[0]._liked).toBe(true)
      expect(store.feedPosts[0].likeCount).toBe(1)
    })
  })

  describe('loadPeople', () => {
    it('fetches and stores people', async () => {
      svc.fetchPeople.mockResolvedValue([
        { id: '1', empCode: 'E1', name: 'Alice', role: 'employee', imgUrl: '', imgId: '', commentCount: 3 },
      ])
      svc.fetchChannelLikeCounts.mockResolvedValue({ E1: { count: 2, liked: true } })

      await store.loadPeople()
      expect(store.praisedPeople).toHaveLength(1)
      expect(store.praisedPeople[0].name).toBe('Alice')
    })

    it('deduplicates by empCode', async () => {
      svc.fetchPeople.mockResolvedValue([
        { id: '1', empCode: 'E1', name: 'Alice', role: '', imgUrl: '', imgId: '', commentCount: 1 },
        { id: '2', empCode: 'E1', name: 'Alice', role: '', imgUrl: '', imgId: '', commentCount: 2 },
      ])
      await store.loadPeople()
      expect(store.praisedPeople).toHaveLength(1)
    })

    it('handles fetch error silently', async () => {
      svc.fetchPeople.mockRejectedValue(new Error('fail'))
      await store.loadPeople()
      expect(store.praisedPeople).toEqual([])
    })
  })

  describe('loadComments', () => {
    it('loads comments from service', async () => {
      svc.fetchComments.mockResolvedValue([
        { id: 'c1', name: 'Bob', text: 'Hello', time: '2026-01-01', likeCount: 0, _liked: false },
      ])
      await store.loadComments('ch1')
      expect(store.postComments['ch1']).toHaveLength(1)
      expect(store.postComments['ch1'][0].name).toBe('Bob')
    })

    it('keeps existing comments if already loaded', async () => {
      store.postComments['ch1'] = [{ id: 'c1', name: 'Bob', text: 'Hi' }]
      await store.loadComments('ch1')
      expect(svc.fetchComments).not.toHaveBeenCalled()
    })
  })

  describe('addComment (optimistic)', () => {
    it('adds temp comment, replaces on success', async () => {
      svc.addComment.mockResolvedValue({ id: 'real1', postId: 'ch1', name: 'Alice', text: 'Hi', time: '2026-01-01' })
      await store.addComment('ch1', 'Hi', 'Alice')
      expect(store.postComments['ch1']).toHaveLength(1)
      expect(store.postComments['ch1'][0].id).toBe('real1')
    })

    it('removes temp comment on error', async () => {
      svc.addComment.mockRejectedValue(new Error('fail'))
      await store.addComment('ch1', 'Hi', 'Alice')
      expect(store.postComments['ch1']).toEqual([])
    })
  })

  describe('removeComment (optimistic)', () => {
    it('removes comment optimistically', async () => {
      svc.deleteComment.mockResolvedValue()
      store.postComments['ch1'] = [{ id: 'c1', name: 'A', text: 'T' }]
      await store.removeComment('ch1', 'c1')
      expect(store.postComments['ch1']).toEqual([])
    })
  })

  describe('toggleCommentLike (optimistic)', () => {
    it('toggles like state', async () => {
      svc.toggleCommentLike.mockResolvedValue({ commentId: 'c1', liked: true, likeCount: 1 })
      store.postComments['ch1'] = [{ id: 'c1', name: 'A', text: 'T', likeCount: 0, _liked: false }]
      await store.toggleCommentLike('ch1', 'c1')
      expect(store.postComments['ch1'][0]._liked).toBe(true)
    })
  })

  describe('toggleChannelLike (optimistic)', () => {
    it('toggles channel like state', async () => {
      svc.toggleChannelLike.mockResolvedValue({ channelId: 'ch1', liked: true, likeCount: 1 })
      await store.toggleChannelLike('ch1')
      expect(store.channelLikes['ch1'].liked).toBe(true)
    })
  })

  describe('loadPosts (legacy)', () => {
    it('calls fetchPosts which returns []', async () => {
      await store.loadPosts()
      expect(svc.fetchPosts).toHaveBeenCalled()
    })
  })

  describe('recordPraise', () => {
    it('adds person to praisedPeople', () => {
      store.recordPraise({ empCode: 'E1', name: 'Alice', role: 'employee' }, 'E1')
      expect(store.praisedPeople).toHaveLength(1)
      expect(store.praisedPeople[0].name).toBe('Alice')
    })

    it('increments commentCount for existing person', () => {
      store.praisedPeople = [{ id: 'E1', empCode: 'E1', name: 'Alice', commentCount: 1 }]
      store.recordPraise({ empCode: 'E1', name: 'Alice' }, 'E1')
      expect(store.praisedPeople[0].commentCount).toBe(2)
    })
  })
})
