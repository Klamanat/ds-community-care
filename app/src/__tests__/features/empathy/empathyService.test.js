// Unit tests for features/empathy/empathyService.js
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../core/services/supabase.js', () => {
  const chain = () => chain
  chain.select = vi.fn(() => chain)
  chain.insert = vi.fn(() => chain)
  chain.update = vi.fn(() => chain)
  chain.delete = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.not = vi.fn(() => chain)
  chain.order = vi.fn(() => chain)
  chain.limit = vi.fn(() => chain)
  chain.lt = vi.fn(() => chain)
  chain.in = vi.fn(() => chain)
  chain.single = vi.fn(() => chain)
  chain.maybeSingle = vi.fn(() => chain)
  chain.rpc = vi.fn(() => chain)
  chain.from = vi.fn(() => chain)
  chain.upsert = vi.fn(() => chain)
  return { supabase: chain }
})

vi.mock('../../../core/services/edgeFunctions.js', () => ({
  uploadImage: vi.fn(() => Promise.resolve({ id: 'img123', url: 'https://drive.test/img123' })),
}))

import { supabase } from '../../../core/services/supabase.js'
import {
  fetchPeople, fetchPostCards, fetchComments, fetchPostComments, fetchFeed, fetchPostById,
  addComment, createPost, updateComment, deleteComment, updatePost, deletePost,
  toggleLike, toggleCommentLike, toggleChannelLike, fetchChannelLike, fetchChannelLikeCounts,
  uploadEmpathyPhoto, setEmpathyPhoto,
  fetchPosts,
} from '../../../features/empathy/empathyService.js'

function mockRpc(result) {
  supabase.rpc.mockResolvedValue(result)
}

describe('empathyService', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('fetchPeople', () => {
    it('maps RPC results to camelCase', async () => {
      mockRpc({ data: [{ id: 1, emp_code: 'EMP01', name: 'Alice', role: 'employee', img_url: '', comment_count: 3 }], error: null })
      const result = await fetchPeople()
      expect(result[0]).toMatchObject({ id: 1, empCode: 'EMP01', name: 'Alice', role: 'employee', commentCount: 3 })
    })

    it('handles drive: img_url prefix', async () => {
      mockRpc({ data: [{ id: 1, emp_code: 'E1', name: 'Bob', role: '', img_url: 'drive:abc123', comment_count: 0 }], error: null })
      const result = await fetchPeople()
      expect(result[0].imgId).toBe('abc123')
      expect(result[0].imgUrl).toBe('')
    })

    it('returns empty array on null data', async () => {
      mockRpc({ data: null, error: null })
      expect(await fetchPeople()).toEqual([])
    })

    it('throws on RPC error', async () => {
      mockRpc({ data: null, error: { message: 'RPC error' } })
      await expect(fetchPeople()).rejects.toThrow('RPC error')
    })
  })

  describe('fetchPostCards', () => {
    it('maps one row per post with recipient info and like/comment counts', async () => {
      mockRpc({
        data: [{ id: 'post1', channel_id: 'E1', emp_code: 'E1', rec_name: 'Alice', rec_role: 'Dev', img_url: '', img_id: '', author_name: 'Bob', text: 'Great job!', created_at: '2026-01-01' }],
        error: null,
      })
      supabase.in
        .mockResolvedValueOnce({ data: [{ empathy_post_id: 'post1' }, { empathy_post_id: 'post1' }] })
        .mockResolvedValueOnce({ data: [{ comment_id: 'post1', user_key: 'u1' }] })

      const result = await fetchPostCards('u1')
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 'post1', channelId: 'E1', empCode: 'E1', recName: 'Alice', recRole: 'Dev',
        authorName: 'Bob', text: 'Great job!', commentCount: 2, likeCount: 1, _liked: true,
      })
    })

    it('handles drive: img_url prefix', async () => {
      mockRpc({ data: [{ id: 'post1', channel_id: 'E1', emp_code: 'E1', rec_name: 'Bob', rec_role: '', img_url: 'drive:abc123', img_id: '', author_name: null, text: null, created_at: '2026-01-01' }], error: null })
      supabase.in.mockResolvedValue({ data: [] })
      const result = await fetchPostCards()
      expect(result[0].imgId).toBe('abc123')
      expect(result[0].imgUrl).toBe('')
    })

    it('returns empty array on null data', async () => {
      mockRpc({ data: null, error: null })
      expect(await fetchPostCards()).toEqual([])
    })

    it('throws on RPC error', async () => {
      mockRpc({ data: null, error: { message: 'RPC error' } })
      await expect(fetchPostCards()).rejects.toThrow('RPC error')
    })
  })

  describe('fetchComments', () => {
    it('merges old empathy_comments with new empathy_posts and their replies', async () => {
      // Terminal for the empathy_comments (old wall) query is .order()
      supabase.order.mockResolvedValue({
        data: [{ id: 'c1', post_id: 'p1', parent_id: null, empathy_post_id: 'aggpost', author_name: 'Alice', text: 'เก่ามาก', created_at: '2026-01-01' }],
        error: null,
      })
      // Terminal for the empathy_posts (new kudos) query is .not()
      supabase.not.mockResolvedValue({
        data: [{ id: 'post1', channel_id: 'p1', author_name: 'Bob', text: 'ใหม่มาก', created_at: '2026-01-02' }],
        error: null,
      })
      // .in() is called twice: replies to the new post, then likes
      supabase.in
        .mockResolvedValueOnce({ data: [{ id: 'r1', post_id: 'p1', parent_id: null, empathy_post_id: 'post1', author_name: 'Carl', text: 'reply to new', created_at: '2026-01-03' }] })
        .mockResolvedValueOnce({ data: [{ comment_id: 'post1', user_key: 'u1' }] })

      const result = await fetchComments('p1', 'u1')
      expect(result).toHaveLength(3)

      const oldComment = result.find(r => r.id === 'c1')
      expect(oldComment.name).toBe('Alice')
      expect(oldComment.isPost).toBeUndefined()

      const newPost = result.find(r => r.id === 'post1')
      expect(newPost.name).toBe('Bob')
      expect(newPost.isPost).toBe(true)
      expect(newPost.parentId).toBe('')
      expect(newPost.likeCount).toBe(1)
      expect(newPost._liked).toBe(true)

      const newReply = result.find(r => r.id === 'r1')
      expect(newReply.parentId).toBe('post1') // nests under the pseudo post entry
    })

    it('returns just the old wall when there are no new posts for this channel', async () => {
      supabase.order.mockResolvedValue({
        data: [{ id: 'c1', post_id: 'p1', parent_id: null, author_name: 'Alice', text: 'Hi', created_at: '2026-01-01' }],
        error: null,
      })
      supabase.not.mockResolvedValue({ data: [], error: null })
      supabase.in.mockResolvedValue({ data: [] })

      const result = await fetchComments('p1', 'u1')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('c1')
    })

    it('returns empty array when both sources are empty', async () => {
      supabase.order.mockResolvedValue({ data: null, error: null })
      supabase.not.mockResolvedValue({ data: null, error: null })
      expect(await fetchComments('p1')).toEqual([])
    })
  })

  describe('fetchFeed', () => {
    it('fetches posts (which own their own content) with comment and like counts', async () => {
      // Terminal for fetchFeed's main query (empathy_posts) is .order()
      supabase.order.mockResolvedValue({
        data: [{ id: 'post1', channel_id: 'p1', author_name: 'Alice', text: 'Great!', created_at: '2026-01-02' }],
        error: null,
      })
      // .in() is called twice: comments under these posts, then likes on the posts
      supabase.in
        .mockResolvedValueOnce({
          data: [
            { empathy_post_id: 'post1' },
            { empathy_post_id: 'post1' },
          ],
        })
        .mockResolvedValueOnce({ data: [{ comment_id: 'post1', user_key: 'u1' }] })

      const result = await fetchFeed(15, null, 'u1')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('post1')
      expect(result[0].name).toBe('Alice')
      expect(result[0].postId).toBe('p1')
      expect(result[0].commentCount).toBe(2)
      expect(result[0].likeCount).toBe(1)
      expect(result[0]._liked).toBe(true)
    })

    it('handles old aggregated posts with no author_name/text', async () => {
      supabase.order.mockResolvedValue({
        data: [{ id: 'post1', channel_id: 'p1', author_name: null, text: null, created_at: '2026-01-02' }],
        error: null,
      })
      supabase.in
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] })

      const result = await fetchFeed(15, null, 'u1')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBeNull()
      expect(result[0].commentCount).toBe(0)
    })

    it('uses .lt() cursor when before is provided', async () => {
      supabase.order.mockResolvedValue({ data: [], error: null })
      const result = await fetchFeed(15, '2026-01-01', '')
      expect(supabase.lt).toHaveBeenCalledWith('created_at', '2026-01-01')
      expect(result).toEqual([])
    })

    it('returns empty array on null rows', async () => {
      supabase.order.mockResolvedValue({ data: null, error: null })
      expect(await fetchFeed()).toEqual([])
    })

    it('throws on error', async () => {
      supabase.order.mockResolvedValue({ data: null, error: { message: 'boom' } })
      await expect(fetchFeed()).rejects.toThrow('boom')
    })
  })

  describe('addComment', () => {
    it('inserts a reply linked to a post and returns mapped comment', async () => {
      // Chain: .from('empathy_comments').insert({...}).select().single()
      // Terminal: .single()
      supabase.single.mockResolvedValue({
        data: { id: 5, post_id: 'p1', parent_id: null, empathy_post_id: 'post1', author_name: 'Alice', text: 'Hi', created_at: '2026-01-01' },
        error: null,
      })
      const result = await addComment('p1', 'post1', 'Hi', 'Alice')
      expect(result.name).toBe('Alice')
      expect(result.postId).toBe('p1')
      expect(result.empathyPostId).toBe('post1')
    })
  })

  describe('fetchPostComments', () => {
    it('fetches comments attached to a real post with like counts', async () => {
      supabase.order.mockResolvedValue({
        data: [{ id: 'c1', parent_id: null, empathy_post_id: 'post1', author_name: 'Alice', text: 'Hi', created_at: '2026-01-01' }],
        error: null,
      })
      supabase.in.mockResolvedValue({ data: [{ comment_id: 'c1', user_key: 'u1' }] })
      const result = await fetchPostComments('post1', 'u1')
      expect(result).toHaveLength(1)
      expect(result[0].empathyPostId).toBe('post1')
      expect(result[0].likeCount).toBe(1)
      expect(result[0]._liked).toBe(true)
    })
  })

  describe('createPost', () => {
    it('inserts a post and returns mapped result', async () => {
      supabase.single.mockResolvedValue({
        data: { id: 'post1', channel_id: 'p1', author_name: 'Alice', text: 'Great job!', created_at: '2026-01-01' },
        error: null,
      })
      const result = await createPost('p1', 'Alice', 'Great job!')
      expect(result.id).toBe('post1')
      expect(result.postId).toBe('p1')
      expect(result.name).toBe('Alice')
      expect(result.text).toBe('Great job!')
    })
  })

  describe('fetchPostById', () => {
    it('fetches a single post with like and comment counts', async () => {
      // .eq() plays two roles here: 1st call is non-terminal (chains into
      // .single()), 2nd/3rd calls are terminal (comment count, then likes)
      supabase.eq
        .mockImplementationOnce(() => supabase)
        .mockResolvedValueOnce({ count: 3 })
        .mockResolvedValueOnce({ data: [{ user_key: 'u1' }] })
      supabase.single.mockResolvedValue({
        data: { id: 'post1', channel_id: 'p1', author_name: 'Alice', text: 'Hi', created_at: '2026-01-01' },
        error: null,
      })
      const result = await fetchPostById('post1', 'u1')
      expect(result.id).toBe('post1')
      expect(result.name).toBe('Alice')
      expect(result.commentCount).toBe(3)
      expect(result.likeCount).toBe(1)
      expect(result._liked).toBe(true)
    })
  })

  describe('updatePost', () => {
    it('updates a post text by id', async () => {
      supabase.eq.mockResolvedValue({ error: null })
      await updatePost('post1', 'New text')
      expect(supabase.from).toHaveBeenCalledWith('empathy_posts')
    })
  })

  describe('deletePost', () => {
    it('deletes a post by id', async () => {
      supabase.eq.mockResolvedValue({ error: null })
      await deletePost('post1')
      expect(supabase.from).toHaveBeenCalledWith('empathy_posts')
    })
  })

  describe('updateComment', () => {
    it('updates text by id', async () => {
      // Chain: .from('empathy_comments').update({text}).eq('id', id)
      // Terminal: .eq()
      supabase.eq.mockResolvedValue({ error: null })
      await updateComment(1, 'New text')
      expect(supabase.from).toHaveBeenCalledWith('empathy_comments')
    })
  })

  describe('deleteComment', () => {
    it('deletes by id', async () => {
      // Chain: .from('empathy_comments').delete().eq('id', id)
      // Terminal: .eq()
      supabase.eq.mockResolvedValue({ error: null })
      await deleteComment(1)
      expect(supabase.from).toHaveBeenCalledWith('empathy_comments')
    })
  })

  describe('toggleLike', () => {
    it('calls RPC and returns result', async () => {
      mockRpc({ data: [{ liked: true, like_count: 5 }], error: null })
      const result = await toggleLike('p1', 'u1')
      expect(result.liked).toBe(true)
      expect(result.likeCount).toBe(5)
    })
  })

  describe('toggleCommentLike', () => {
    it('calls RPC and returns result', async () => {
      mockRpc({ data: [{ liked: true, like_count: 3 }], error: null })
      const result = await toggleCommentLike('c1', 'u1')
      expect(result.liked).toBe(true)
    })
  })

  describe('toggleChannelLike', () => {
    it('calls RPC and returns result', async () => {
      mockRpc({ data: [{ liked: false, like_count: 0 }], error: null })
      const result = await toggleChannelLike('ch1', 'u1')
      expect(result.liked).toBe(false)
    })
  })

  describe('fetchChannelLike', () => {
    it('returns like state from channel_likes', async () => {
      // Chain: .from('channel_likes').select('user_key').eq('channel_id', channelId)
      // Terminal: .eq()
      supabase.eq.mockResolvedValue({ data: [{ user_key: 'u1' }, { user_key: 'u2' }], error: null })
      const result = await fetchChannelLike('ch1', 'u1')
      expect(result.liked).toBe(true)
      expect(result.likeCount).toBe(2)
    })
  })

  describe('fetchChannelLikeCounts', () => {
    it('returns map of counts', async () => {
      // Chain: .from('channel_likes').select('channel_id, user_key').in('channel_id', channelIds)
      // Terminal: .in()
      supabase.in.mockResolvedValue({ data: [{ channel_id: 'ch1', user_key: 'u1' }], error: null })
      const result = await fetchChannelLikeCounts(['ch1', 'ch2'], 'u1')
      expect(result.ch1.count).toBe(1)
      expect(result.ch1.liked).toBe(true)
      expect(result.ch2).toBeUndefined()
    })
  })

  describe('uploadEmpathyPhoto', () => {
    it('calls uploadImage with empathy folder', async () => {
      const { uploadImage } = await import('../../../core/services/edgeFunctions.js')
      await uploadEmpathyPhoto('base64data', 'photo.jpg')
      expect(uploadImage).toHaveBeenCalledWith('base64data', 'photo.jpg', 'empathy')
    })
  })

  describe('setEmpathyPhoto', () => {
    it('upserts into empathy_photos', async () => {
      // Chain: .from('empathy_photos').upsert({...}, {...})
      // Terminal: .upsert()
      supabase.upsert.mockResolvedValue({ error: null })
      await setEmpathyPhoto('42', 'https://img.test')
      expect(supabase.from).toHaveBeenCalledWith('empathy_photos')
    })
  })

  describe('legacy stubs', () => {
    it('fetchPosts returns empty array', async () => {
      const result = await fetchPosts('u1')
      expect(result).toEqual([])
    })
  })
})
