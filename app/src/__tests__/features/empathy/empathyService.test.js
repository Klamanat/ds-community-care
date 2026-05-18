// Unit tests for features/empathy/empathyService.js
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../core/services/supabase.js', () => {
  const chain = () => chain
  chain.select = vi.fn(() => chain)
  chain.insert = vi.fn(() => chain)
  chain.update = vi.fn(() => chain)
  chain.delete = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.order = vi.fn(() => chain)
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
  fetchPeople, fetchComments, addComment, updateComment, deleteComment,
  toggleLike, toggleCommentLike, toggleChannelLike, fetchChannelLike, fetchChannelLikeCounts,
  uploadEmpathyPhoto, setEmpathyPhoto,
  fetchPosts, createPost, ensurePost,
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

  describe('fetchComments', () => {
    it('fetches comments with like counts', async () => {
      // Chain: .from('empathy_comments').select('*').eq('post_id', postId).order('created_at')
      // Terminal: .order()
      supabase.order.mockResolvedValue({ data: [{ id: 10, post_id: 'p1', author_name: 'Alice', text: 'Great!', created_at: '2026-01-01' }], error: null })
      // Chain: .from('comment_likes').select('comment_id, user_key').in('comment_id', ids)
      // Terminal: .in()
      supabase.in.mockResolvedValue({ data: [{ comment_id: 10, user_key: 'u1' }], error: null })

      const result = await fetchComments('p1', 'u1')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Alice')
      expect(result[0].likeCount).toBe(1)
      expect(result[0]._liked).toBe(true)
    })

    it('returns empty array on null rows', async () => {
      supabase.order.mockResolvedValue({ data: null, error: null })
      expect(await fetchComments('p1')).toEqual([])
    })
  })

  describe('addComment', () => {
    it('inserts and returns mapped comment', async () => {
      // Chain: .from('empathy_comments').insert({...}).select().single()
      // Terminal: .single()
      supabase.single.mockResolvedValue({ data: { id: 5, post_id: 'p1', parent_id: null, author_name: 'Alice', text: 'Hi', created_at: '2026-01-01' }, error: null })
      const result = await addComment('p1', 'Hi', 'Alice')
      expect(result.name).toBe('Alice')
      expect(result.postId).toBe('p1')
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
    it('createPost returns null', async () => {
      expect(await createPost()).toBeNull()
    })
    it('ensurePost returns null', async () => {
      expect(await ensurePost()).toBeNull()
    })
  })
})
