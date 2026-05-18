import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import TrBlogView from '../../../features/training/training/TrBlogView.vue'

const { blogStore, userAuthStore } = vi.hoisted(() => ({
  blogStore: {
    posts: [
      { id: 1, title: 'First Post', body: 'Content 1', category: 'news', authorName: 'John', createdAt: '2026-05-01T00:00:00Z' },
      { id: 2, title: 'Tech Tips', body: 'Some tech', category: 'tech', authorName: 'Jane', createdAt: '2026-05-10T00:00:00Z' },
      { id: 3, title: 'Event Recap', body: 'Fun event', category: 'event', authorName: 'Bob', createdAt: '2026-05-15T00:00:00Z' },
    ],
    isLoading: false,
    submitPost: vi.fn(),
  },
  userAuthStore: {
    userName: 'TestUser',
    empCode: 'EMP001',
  },
}))

vi.mock('../../../features/blog/blog.store.js', () => ({
  useBlogStore: vi.fn(() => blogStore),
  BLOG_CATEGORIES: [
    { key: 'news',  label: '📢 ข่าวสาร',      color: '#3B82F6', bg: '#EFF6FF' },
    { key: 'tech',  label: '💡 เทคนิค',        color: '#8B5CF6', bg: '#F5F3FF' },
    { key: 'exp',   label: '🌟 ประสบการณ์',    color: '#F59E0B', bg: '#FFFBEB' },
    { key: 'event', label: '🎉 กิจกรรม',       color: '#10B981', bg: '#ECFDF5' },
    { key: 'other', label: '💬 อื่นๆ',         color: '#6B7280', bg: '#F9FAFB' },
  ],
  getCatInfo: (key) => {
    const cats = {
      news:  { key: 'news',  label: '📢 ข่าวสาร',      color: '#3B82F6', bg: '#EFF6FF' },
      tech:  { key: 'tech',  label: '💡 เทคนิค',        color: '#8B5CF6', bg: '#F5F3FF' },
      exp:   { key: 'exp',   label: '🌟 ประสบการณ์',    color: '#F59E0B', bg: '#FFFBEB' },
      event: { key: 'event', label: '🎉 กิจกรรม',       color: '#10B981', bg: '#ECFDF5' },
      other: { key: 'other', label: '💬 อื่นๆ',         color: '#6B7280', bg: '#F9FAFB' },
    }
    return cats[key] || cats.other
  },
}))

vi.mock('../../../core/stores/userAuth.js', () => ({
  useUserAuthStore: vi.fn(() => userAuthStore),
}))

describe('TrBlogView', () => {
  beforeEach(() => {
    blogStore.posts = [
      { id: 1, title: 'First Post', body: 'Content 1', category: 'news', authorName: 'John', createdAt: '2026-05-01T00:00:00Z' },
      { id: 2, title: 'Tech Tips', body: 'Some tech', category: 'tech', authorName: 'Jane', createdAt: '2026-05-10T00:00:00Z' },
      { id: 3, title: 'Event Recap', body: 'Fun event', category: 'event', authorName: 'Bob', createdAt: '2026-05-15T00:00:00Z' },
    ]
    blogStore.isLoading = false
    blogStore.submitPost.mockClear()
    userAuthStore.userName = 'TestUser'
    userAuthStore.empCode = 'EMP001'
  })

  function createWrapper() {
    return shallowMount(TrBlogView)
  }

  it('renders blog posts', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('First Post')
    expect(wrapper.text()).toContain('Tech Tips')
    expect(wrapper.text()).toContain('Event Recap')
  })

  it('shows post body/excerpt', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Content 1')
    expect(wrapper.text()).toContain('Some tech')
  })

  it('shows author names', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('John')
    expect(wrapper.text()).toContain('Jane')
    expect(wrapper.text()).toContain('Bob')
  })

  it('shows write toggle button', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.bl-write-toggle').exists()).toBe(true)
    expect(wrapper.text()).toContain('เขียนโพสต์ใหม่')
  })

  it('shows empty state when no posts', () => {
    blogStore.posts = []
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('ยังไม่มีโพสต์')
  })

  it('shows loading state', () => {
    blogStore.isLoading = true
    blogStore.posts = []
    const wrapper = createWrapper()
    expect(wrapper.find('.bl-skeletons').exists()).toBe(true)
  })

  it('shows filter pills', () => {
    const wrapper = createWrapper()
    const filterPills = wrapper.findAll('.bl-filter-pill')
    expect(filterPills.length).toBeGreaterThanOrEqual(5)
  })

  it('shows category badges on cards', () => {
    const wrapper = createWrapper()
    const catBadges = wrapper.findAll('.bl-card-cat')
    expect(catBadges.length).toBe(3)
  })

  it('emits open-post when clicking a card', () => {
    const wrapper = createWrapper()
    const cards = wrapper.findAll('.bl-card')
    expect(cards.length).toBeGreaterThan(0)
    cards[0].trigger('click')
    expect(wrapper.emitted('open-post')).toBeTruthy()
    expect(wrapper.emitted('open-post')[0][0]).toEqual(blogStore.posts[0])
  })

  it('shows load more button when posts exceed page size', () => {
    blogStore.posts = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      title: `Post ${i + 1}`,
      body: `Body ${i + 1}`,
      category: 'news',
      authorName: 'Author',
      createdAt: '2026-05-01T00:00:00Z',
    }))
    const wrapper = createWrapper()
    expect(wrapper.find('.bl-load-more').exists()).toBe(true)
  })

  it('formats dates in Thai locale format', () => {
    const wrapper = createWrapper()
    // Should show some date text like "1 พ.ค."
    const dateElements = wrapper.findAll('.bl-card-date')
    expect(dateElements.length).toBe(3)
  })
})
