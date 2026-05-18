import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import BlogPostModal from '../../../features/blog/BlogPostModal.vue'

const { blogStore, mockGetCatInfo } = vi.hoisted(() => ({
  blogStore: {
    selectedPost: null,
  },
  mockGetCatInfo: vi.fn(() => ({ label: 'อื่นๆ', color: '#6B7280' })),
}))

vi.mock('../../../features/blog/blog.store.js', () => ({
  useBlogStore: vi.fn(() => blogStore),
  getCatInfo: (...args) => mockGetCatInfo(...args),
}))

vi.mock('../../../shared/components/BaseModal.vue', () => ({
  default: {
    name: 'BaseModal',
    template: '<div><slot /></div>',
    props: ['modalId', 'sheetClass', 'padded'],
  },
}))

describe('BlogPostModal', () => {
  beforeEach(() => {
    blogStore.selectedPost = null
    mockGetCatInfo.mockClear()
    mockGetCatInfo.mockReturnValue({ label: 'อื่นๆ', color: '#6B7280' })
  })

  function createWrapper() {
    return shallowMount(BlogPostModal, {
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

  it('shows empty when no selectedPost', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('ไม่พบบทความ')
    // Also shows the blog fallback header
    expect(wrapper.text()).toContain('บล็อก')
  })

  it('shows post content when selectedPost is set', () => {
    blogStore.selectedPost = {
      id: 1,
      title: 'Test Post Title',
      body: 'This is the post body content',
      category: 'tech',
      authorName: 'Alice',
      createdAt: '2026-05-01T00:00:00Z',
    }
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Test Post Title')
    expect(wrapper.text()).toContain('This is the post body content')
    expect(wrapper.text()).toContain('Alice')
  })

  it('shows category badge', () => {
    mockGetCatInfo.mockReturnValue({ label: 'เทคนิค', color: '#8B5CF6' })
    blogStore.selectedPost = {
      id: 1,
      title: 'Tech Post',
      body: 'Content',
      category: 'tech',
      authorName: 'Bob',
      createdAt: '2026-05-01T00:00:00Z',
    }
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('เทคนิค')
    expect(mockGetCatInfo).toHaveBeenCalledWith('tech')
  })

  it('shows post without author as ไม่ระบุชื่อ', () => {
    blogStore.selectedPost = {
      id: 2,
      title: 'Anonymous Post',
      body: 'Content',
      category: 'other',
      createdAt: '2026-05-01T00:00:00Z',
    }
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('ไม่ระบุชื่อ')
  })
})
