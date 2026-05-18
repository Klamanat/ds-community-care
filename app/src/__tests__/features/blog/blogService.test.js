// Unit tests for features/blog/blogService.js
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../core/services/supabase.js', () => {
  const chain = () => chain
  chain.select = vi.fn(() => chain)
  chain.insert = vi.fn(() => chain)
  chain.update = vi.fn(() => chain)
  chain.delete = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.order = vi.fn(() => chain)
  chain.single = vi.fn(() => chain)
  chain.from = vi.fn(() => chain)
  return { supabase: chain }
})

import { supabase } from '../../../core/services/supabase.js'
import { fetchBlogPosts, submitBlogPost, adminGetBlogPosts, adminDeleteBlogPost, adminUpdateBlogPost } from '../../../features/blog/blogService.js'

describe('blogService', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  describe('fetchBlogPosts', () => {
    it('fetches all posts ordered by created_at desc', async () => {
      supabase.from().select().order.mockResolvedValue({ data: [{ id: 1, title: 'Post 1', body: 'Content', author_name: 'Alice', category: 'tech' }], error: null })
      const result = await fetchBlogPosts()
      expect(result).toHaveLength(1)
      expect(result[0].authorName).toBe('Alice')
    })

    it('filters by category when provided', async () => {
      // Chain: .select('*').order(...).eq('category', category)
      // Reset .order to return chain (previous test may have set mockResolvedValue)
      supabase.order.mockReset()
      supabase.order.mockImplementation(() => supabase)  // return chain
      supabase.from().select().order().eq.mockResolvedValue({ data: [], error: null })
      await fetchBlogPosts('tech')
      expect(supabase.eq).toHaveBeenCalledWith('category', 'tech')
    })
  })

  describe('submitBlogPost', () => {
    it('inserts and returns data', async () => {
      supabase.from().insert().select().single.mockResolvedValue({ data: { id: 1, title: 'New Post' }, error: null })
      const result = await submitBlogPost({ title: 'New Post', body: 'Content', category: 'tech', authorName: 'Alice', authorId: 'e1' })
      expect(result).toBeDefined()
    })
  })

  describe('adminGetBlogPosts', () => {
    it('returns all blog posts', async () => {
      supabase.order.mockResolvedValue({ data: [{ id: 1, title: 'Admin Post', category: 'news' }], error: null })
      const result = await adminGetBlogPosts()
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Admin Post')
    })
  })

  describe('adminDeleteBlogPost', () => {
    it('deletes by id', async () => {
      supabase.from().delete().eq.mockResolvedValue({ error: null })
      await adminDeleteBlogPost(1)
    })
  })

  describe('adminUpdateBlogPost', () => {
    it('updates title, body, category', async () => {
      supabase.from().update().eq().select().single.mockResolvedValue({ data: { id: 1, title: 'Updated' }, error: null })
      const result = await adminUpdateBlogPost(1, { title: 'Updated', body: 'New', category: 'news' })
      expect(result).toBeDefined()
    })
  })
})
