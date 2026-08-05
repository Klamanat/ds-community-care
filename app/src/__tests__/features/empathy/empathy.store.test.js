// Unit tests for features/empathy/empathy.store.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('../../../features/empathy/empathyService.js', () => ({
  fetchPeople: vi.fn(),
  fetchPostCards: vi.fn(),
  fetchComments: vi.fn(),
  fetchPostComments: vi.fn(),
  fetchFeed: vi.fn(),
  fetchPostById: vi.fn(),
  addComment: vi.fn(),
  createPost: vi.fn(),
  updateComment: vi.fn(),
  deleteComment: vi.fn(),
  updatePost: vi.fn(),
  deletePost: vi.fn(),
  toggleLike: vi.fn(),
  toggleCommentLike: vi.fn(),
  toggleChannelLike: vi.fn(),
  fetchChannelLike: vi.fn(),
  fetchChannelLikeCounts: vi.fn(),
  fetchPosts: vi.fn(() => []),
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

  describe('loadPostCards', () => {
    it('fetches and stores one card per post', async () => {
      svc.fetchPostCards.mockResolvedValue([
        { id: 'post1', channelId: 'E1', empCode: 'E1', recName: 'Alice', recRole: 'Dev', imgUrl: '', imgId: '', authorName: 'Bob', text: 'Hi', time: '2026-01-01', likeCount: 0, _liked: false, commentCount: 0 },
      ])
      await store.loadPostCards()
      expect(store.postCards).toHaveLength(1)
      expect(store.postCards[0].recName).toBe('Alice')
    })

    it('does not refetch within the cache TTL unless forced', async () => {
      svc.fetchPostCards.mockResolvedValue([{ id: 'post1', channelId: 'E1' }])
      await store.loadPostCards()
      svc.fetchPostCards.mockClear()
      await store.loadPostCards()
      expect(svc.fetchPostCards).not.toHaveBeenCalled()
      await store.loadPostCards(true)
      expect(svc.fetchPostCards).toHaveBeenCalled()
    })
  })

  describe('createPost', () => {
    it('adds the new post to feedPosts and postsById', async () => {
      svc.createPost.mockResolvedValue({ id: 'post1', postId: 'E1', name: 'Alice', text: 'Great job!', time: '2026-01-01' })
      const result = await store.createPost('E1', 'Alice', 'Great job!')
      expect(result.id).toBe('post1')
      expect(store.feedPosts.find(p => p.id === 'post1')).toBeTruthy()
      expect(store.postsById['post1']).toBeTruthy()
    })

    it('does NOT touch praisedPeople.commentCount (avoids double-counting with recordPraise)', async () => {
      store.praisedPeople = [{ id: 'E1', empCode: 'E1', name: 'Alice', commentCount: 1 }]
      svc.createPost.mockResolvedValue({ id: 'post1', postId: 'E1', name: 'Alice', text: 'Hi', time: '2026-01-01' })
      await store.createPost('E1', 'Alice', 'Hi')
      expect(store.praisedPeople[0].commentCount).toBe(1)
    })

    it('rolls back the optimistic feed entry on failure', async () => {
      svc.createPost.mockRejectedValue(new Error('fail'))
      const before = store.feedPosts.length
      const result = await store.createPost('E1', 'Alice', 'Hi')
      expect(result).toBeNull()
      expect(store.feedPosts.length).toBe(before)
    })

    it('appends directly into an already-loaded channel wall (postComments) for instant reflection', async () => {
      store.postComments['E1'] = [{ id: 'old1', postId: 'E1', parentId: '', name: 'Bob', text: 'เก่า' }]
      svc.createPost.mockResolvedValue({ id: 'post1', postId: 'E1', name: 'Alice', text: 'ใหม่', time: '2026-01-02' })
      await store.createPost('E1', 'Alice', 'ใหม่')
      expect(store.postComments['E1']).toHaveLength(2)
      const added = store.postComments['E1'].find(c => c.id === 'post1')
      expect(added.isPost).toBe(true)
      expect(added.parentId).toBe('')
      expect(added.name).toBe('Alice')
    })

    it('prepends a matching card to postCards using the recipient info passed in', async () => {
      svc.createPost.mockResolvedValue({ id: 'post1', postId: 'E1', name: 'Alice', text: 'Great!', time: '2026-01-02' })
      const recipient = { empCode: 'E1', name: 'Somchai', role: 'Dev', imgUrl: 'x.jpg', imgId: 'img1' }
      await store.createPost('E1', 'Alice', 'Great!', recipient)
      const card = store.postCards.find(p => p.id === 'post1')
      expect(card).toBeTruthy()
      expect(card.recName).toBe('Somchai')
      expect(card.authorName).toBe('Alice')
      expect(card.text).toBe('Great!')
    })

    it('falls back to channelId as recName when no recipient is passed', async () => {
      svc.createPost.mockResolvedValue({ id: 'post1', postId: 'E1', name: 'Alice', text: 'Hi', time: '2026-01-01' })
      await store.createPost('E1', 'Alice', 'Hi')
      const card = store.postCards.find(p => p.id === 'post1')
      expect(card.recName).toBe('E1')
    })

    it('does not touch postComments for a channel wall that was never loaded', async () => {
      svc.createPost.mockResolvedValue({ id: 'post1', postId: 'E2', name: 'Alice', text: 'Hi', time: '2026-01-01' })
      await store.createPost('E2', 'Alice', 'Hi')
      expect(store.postComments['E2']).toBeUndefined()
    })
  })

  describe('editPost / deletePost', () => {
    it('editPost updates text optimistically and via service', async () => {
      store.feedPosts = [{ id: 'post1', text: 'Old' }]
      svc.updatePost.mockResolvedValue()
      await store.editPost('post1', 'New')
      expect(store.feedPosts[0].text).toBe('New')
      expect(svc.updatePost).toHaveBeenCalledWith('post1', 'New')
    })

    it('editPost reverts on failure', async () => {
      store.feedPosts = [{ id: 'post1', text: 'Old' }]
      svc.updatePost.mockRejectedValue(new Error('fail'))
      await store.editPost('post1', 'New')
      expect(store.feedPosts[0].text).toBe('Old')
    })

    it('deletePost removes from feedPosts and calls service', async () => {
      store.feedPosts = [{ id: 'post1', text: 'Hi' }]
      svc.deletePost.mockResolvedValue()
      await store.deletePost('post1')
      expect(store.feedPosts).toHaveLength(0)
      expect(svc.deletePost).toHaveBeenCalledWith('post1')
    })

    it('deletePost reverts on failure', async () => {
      store.feedPosts = [{ id: 'post1', text: 'Hi' }]
      svc.deletePost.mockRejectedValue(new Error('fail'))
      await store.deletePost('post1')
      expect(store.feedPosts).toHaveLength(1)
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
