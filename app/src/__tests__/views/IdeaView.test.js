import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import IdeaView from '../../views/IdeaView.vue'

// Mock IntersectionObserver used by useFadeIn
vi.stubGlobal('IntersectionObserver', vi.fn(() => ({ observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() })))

const ideaStore = {
  ideas: [{ id: '1', title: 'Test Idea', category: 'party', status: 'pending', submitterName: 'Alice', createdAt: '2026-05-18', detail: 'Details' }],
  categories: ['party', 'learn'],
  selectedCategory: null,
  isLoading: false,
  loadError: '',
  loadIdeas: vi.fn(),
  submitIdea: vi.fn(),
  selectCategory: vi.fn(),
  filteredIdeas: [{ id: '1', title: 'Test Idea', category: 'party', status: 'pending', submitterName: 'Alice', createdAt: '2026-05-18', detail: 'Details' }],
}

vi.mock('../../core/stores/ui.js', () => ({ useUiStore: vi.fn(() => ({ showToast: vi.fn() })) }))
vi.mock('../../core/stores/userAuth.js', () => ({ useUserAuthStore: vi.fn(() => ({ userId: '42', userName: 'Alice' })) }))
vi.mock('../../features/ideas/ideas.store.js', () => ({
  useIdeasStore: vi.fn(() => ideaStore),
}))

describe('IdeaView', () => {
  beforeEach(() => {
    ideaStore.ideas = [{ id: '1', title: 'Test Idea', category: 'party', status: 'pending', submitterName: 'Alice', createdAt: '2026-05-18', detail: 'Details' }]
    ideaStore.categories = ['party', 'learn']
    ideaStore.selectedCategory = null
    ideaStore.isLoading = false
    ideaStore.loadError = ''
  })

  function createWrapper() {
    return shallowMount(IdeaView)
  }

  it('renders header and submit form', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('ไอเดียดีๆ')
    expect(wrapper.text()).toContain('แชร์ไอเดียกิจกรรมให้ทีม HR รับรู้')
    expect(wrapper.text()).toContain('เสนอไอเดียใหม่')
    expect(wrapper.find('.idea-form-card').exists()).toBe(true)
  })

  it('shows idea cards from store', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Test Idea')
    expect(wrapper.text()).toContain('party')
    expect(wrapper.text()).toContain('Alice')
  })

  it('shows loading skeletons when isLoading', () => {
    ideaStore.isLoading = true
    ideaStore.ideas = []
    const wrapper = shallowMount(IdeaView)
    const skeletons = wrapper.findAllComponents({ name: 'SkeletonCard' })
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows empty state when no ideas', () => {
    ideaStore.isLoading = false
    ideaStore.ideas = []
    const wrapper = shallowMount(IdeaView)
    expect(wrapper.text()).toContain('ยังไม่มีไอเดีย')
  })
})
