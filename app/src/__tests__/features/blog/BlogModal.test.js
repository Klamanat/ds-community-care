import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import BlogModal from '../../../features/blog/BlogModal.vue'

const { blogStore, userAuthStore } = vi.hoisted(() => ({
  blogStore: {
    posts: [
      { id: 1, title: 'Vue Tips', body: 'Great framework', category: 'tech', authorName: 'John', createdAt: '2026-05-18' },
      { id: 2, title: 'Team Party', body: 'Let\'s celebrate!', category: 'event', authorName: 'Jane', createdAt: '2026-05-17' },
    ],
    isLoading: false,
    selectedPost: null,
    loadPosts: vi.fn(),
    openPost: vi.fn(),
    closePost: vi.fn(),
    submitPost: vi.fn(),
  },
  userAuthStore: {
    userName: 'TestUser',
    empCode: 'EMP001',
  },
}))

vi.mock('../../../shared/components/BaseModal.vue', () => ({
  default: {
    name: 'BaseModal',
    template: '<div><slot /></div>',
    props: ['modalId', 'sheetClass', 'padded'],
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
  getCatInfo: vi.fn((key) => {
    const map = {
      news:  { key: 'news',  label: '📢 ข่าวสาร',      color: '#3B82F6', bg: '#EFF6FF' },
      tech:  { key: 'tech',  label: '💡 เทคนิค',        color: '#8B5CF6', bg: '#F5F3FF' },
      exp:   { key: 'exp',   label: '🌟 ประสบการณ์',    color: '#F59E0B', bg: '#FFFBEB' },
      event: { key: 'event', label: '🎉 กิจกรรม',       color: '#10B981', bg: '#ECFDF5' },
      other: { key: 'other', label: '💬 อื่นๆ',         color: '#6B7280', bg: '#F9FAFB' },
    }
    return map[key] || map.other
  }),
}))

vi.mock('../../../core/stores/userAuth.js', () => ({
  useUserAuthStore: vi.fn(() => userAuthStore),
}))

describe('BlogModal', () => {
  beforeEach(() => {
    blogStore.posts = [
      { id: 1, title: 'Vue Tips', body: 'Great framework', category: 'tech', authorName: 'John', createdAt: '2026-05-18' },
      { id: 2, title: 'Team Party', body: 'Let\'s celebrate!', category: 'event', authorName: 'Jane', createdAt: '2026-05-17' },
    ]
    blogStore.isLoading = false
    blogStore.selectedPost = null
    blogStore.loadPosts.mockClear()
    blogStore.openPost.mockClear()
    blogStore.closePost.mockClear()
    blogStore.submitPost.mockClear()
  })

  function createWrapper() {
    return shallowMount(BlogModal, {
      global: {
        stubs: {
          BaseModal: {
            name: 'BaseModal',
            template: '<div><slot /></div>',
            props: ['modalId', 'sheetClass', 'padded'],
          },
        },
      },
    })
  }

  it('renders header with "บล็อกภายใน" title', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('บล็อกภายใน')
  })

  it('renders blog posts list', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Vue Tips')
    expect(wrapper.text()).toContain('Team Party')
  })

  it('shows post author names', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('John')
    expect(wrapper.text()).toContain('Jane')
  })

  it('shows category filter pills', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('ทั้งหมด')
    expect(wrapper.text()).toContain('📢 ข่าวสาร')
    expect(wrapper.text()).toContain('💡 เทคนิค')
  })

  it('shows write post button', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('เขียนโพสต์ใหม่')
  })

  it('calls loadPosts on mount', () => {
    createWrapper()
    expect(blogStore.loadPosts).toHaveBeenCalledTimes(1)
  })
})
