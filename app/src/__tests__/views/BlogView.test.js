import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import BlogView from '../../views/BlogView.vue'

// Mock IntersectionObserver used by useFadeIn
vi.stubGlobal('IntersectionObserver', vi.fn(() => ({ observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() })))

const blogStore = {
  posts: [],
  categories: [],
  isLoading: false,
  loadPosts: vi.fn(),
  submitPost: vi.fn(),
  openPost: vi.fn(),
}

vi.mock('../../core/stores/ui.js', () => ({ useUiStore: vi.fn(() => ({ openModal: vi.fn() })) }))
vi.mock('../../core/stores/userAuth.js', () => ({ useUserAuthStore: vi.fn(() => ({ userName: 'Alice', empCode: 'EMP001' })) }))
vi.mock('../../features/blog/blog.store.js', () => ({
  useBlogStore: vi.fn(() => blogStore),
  BLOG_CATEGORIES: [
    { key: 'news', label: 'ข่าวสาร', color: '#667EEA', bg: '#EEF2FF' },
    { key: 'culture', label: 'วัฒนธรรม', color: '#764BA2', bg: '#F5F3FF' },
  ],
  getCatInfo: vi.fn((key) => {
    const map = { news: { key: 'news', label: 'ข่าวสาร', color: '#667EEA', bg: '#EEF2FF' }, culture: { key: 'culture', label: 'วัฒนธรรม', color: '#764BA2', bg: '#F5F3FF' } }
    return map[key] || map.news
  }),
}))

describe('BlogView', () => {
  beforeEach(() => {
    blogStore.posts = []
    blogStore.categories = []
    blogStore.isLoading = false
  })

  function createWrapper() {
    return shallowMount(BlogView)
  }

  it('renders the blog header', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('บล็อกภายใน')
    expect(wrapper.text()).toContain('0 โพสต์')
  })

  it('shows write button', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('เขียน')
  })

  it('shows empty state when no posts', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('ยังไม่มีโพสต์')
    expect(wrapper.text()).toContain('เป็นคนแรกที่แชร์เรื่องราว')
  })

  it('shows loading skeletons when isLoading', () => {
    blogStore.isLoading = true
    blogStore.posts = []
    const wrapper = shallowMount(BlogView)
    const skeletons = wrapper.findAll('.blog-skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows posts when available', () => {
    blogStore.isLoading = false
    blogStore.posts = [{ id: 1, title: 'Test Post', body: 'Test body', category: 'news', authorName: 'Alice', createdAt: '2026-05-18' }]
    blogStore.categories = ['news', 'culture']
    const wrapper = shallowMount(BlogView)
    expect(wrapper.text()).toContain('Test Post')
    expect(wrapper.text()).toContain('Test body')
    expect(wrapper.text()).toContain('Alice')
  })
})
