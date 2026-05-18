import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'

const mockAdminGetBlogPosts = vi.fn()
const mockAdminDeleteBlogPost = vi.fn()

vi.mock('../../../features/blog/blogService.js', () => ({
  adminGetBlogPosts: (...args) => mockAdminGetBlogPosts(...args),
  adminDeleteBlogPost: (...args) => mockAdminDeleteBlogPost(...args),
}))

vi.mock('../../../features/blog/blog.store.js', () => ({
  getCatInfo: vi.fn((cat) => {
    const map = {
      news: { icon: '📰', label: 'ข่าวสาร' },
      article: { icon: '📝', label: 'บทความ' },
      event: { icon: '🎉', label: 'กิจกรรม' },
    }
    return map[cat] || { icon: '📝', label: 'ทั่วไป' }
  }),
}))

vi.mock('../../../core/composables/useRipple.js', () => ({
  useRipple: vi.fn(() => ({ handleRippleClick: vi.fn() })),
}))

vi.mock('../../../core/composables/useFadeIn.js', () => ({
  useFadeIn: vi.fn(),
}))

import AdminBlogView from '../../../views/admin/AdminBlogView.vue'

describe('AdminBlogView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAdminGetBlogPosts.mockResolvedValue([])
  })

  it('renders the page header', () => {
    const wrapper = shallowMount(AdminBlogView)
    expect(wrapper.findComponent({ name: 'AdminPageHeader' }).exists()).toBe(true)
  })

  it('shows loading skeletons initially', () => {
    const wrapper = shallowMount(AdminBlogView)
    expect(wrapper.findComponent({ name: 'SkeletonCard' }).exists()).toBe(true)
  })

  it('shows EmptyState when no posts after load', async () => {
    const wrapper = shallowMount(AdminBlogView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent({ name: 'EmptyState' }).exists()).toBe(true)
  })

  it('renders blog posts after load', async () => {
    mockAdminGetBlogPosts.mockResolvedValue([
      { id: 'p1', title: 'ข่าวสาร DS', category: 'news', authorName: 'Admin', createdAt: '2026-05-15T00:00:00Z' },
      { id: 'p2', title: 'บทความน่าสนใจ', category: 'article', authorName: 'John', createdAt: '2026-05-10T00:00:00Z' },
    ])

    const wrapper = shallowMount(AdminBlogView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('ข่าวสาร DS')
    expect(wrapper.text()).toContain('บทความน่าสนใจ')
    expect(wrapper.text()).toContain('Admin')
    expect(wrapper.text()).toContain('John')
  })

  it('shows category badge info for posts', async () => {
    mockAdminGetBlogPosts.mockResolvedValue([
      { id: 'p1', title: 'ข่าว', category: 'news', authorName: 'Admin', createdAt: '2026-05-15T00:00:00Z' },
      { id: 'p2', title: 'กิจกรรม', category: 'event', authorName: 'Admin', createdAt: '2026-05-10T00:00:00Z' },
    ])

    const wrapper = shallowMount(AdminBlogView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('ข่าวสาร')
    expect(wrapper.text()).toContain('กิจกรรม')
  })

  it('calls adminGetBlogPosts on mount with force=false', () => {
    shallowMount(AdminBlogView)
    expect(mockAdminGetBlogPosts).toHaveBeenCalledWith(false)
  })

  it('shows post count badge', async () => {
    mockAdminGetBlogPosts.mockResolvedValue([
      { id: 'p1', title: 'โพสต์ 1', category: 'news', authorName: 'A', createdAt: '2026-05-15T00:00:00Z' },
      { id: 'p2', title: 'โพสต์ 2', category: 'article', authorName: 'B', createdAt: '2026-05-10T00:00:00Z' },
      { id: 'p3', title: 'โพสต์ 3', category: 'event', authorName: 'C', createdAt: '2026-05-05T00:00:00Z' },
    ])

    const wrapper = shallowMount(AdminBlogView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('3 โพสต์')
  })

  it('can trigger refresh via load(true)', async () => {
    mockAdminGetBlogPosts.mockResolvedValue([
      { id: 'p1', title: 'รีเฟรช', category: 'news', authorName: 'A', createdAt: '2026-05-15T00:00:00Z' },
    ])
    const wrapper = shallowMount(AdminBlogView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    mockAdminGetBlogPosts.mockClear()
    await wrapper.vm.load(true)
    expect(mockAdminGetBlogPosts).toHaveBeenCalledWith(true)
    expect(wrapper.text()).toContain('รีเฟรช')
  })

  it('shows the card header title', () => {
    const wrapper = shallowMount(AdminBlogView)
    expect(wrapper.text()).toContain('บล็อกทั้งหมด')
  })


})
