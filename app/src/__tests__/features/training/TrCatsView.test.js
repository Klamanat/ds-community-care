import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import TrCatsView from '../../../features/training/training/TrCatsView.vue'

// Mutable store state via vi.hoisted
const { trainingStore, blogStore } = vi.hoisted(() => ({
  trainingStore: {
    isLoading: false,
    categories: [
      { key: 'annual', name: 'Annual', icon: '📚', color: '#3B82F6', bgColor: '#EFF6FF', tag: 'required' },
      { key: 'site', name: 'Site Visit', icon: '🚌', color: '#10B981', bgColor: '#ECFDF5', tag: 'fun' },
    ],
    courses: [
      { id: 1, title: 'Vue 101', category: 'annual' },
      { id: 2, title: 'React 101', category: 'annual' },
    ],
    siteVisits: [{ id: 'sv1', title: 'Office Visit' }],
    idpVideos: [],
    loadIdpVideos: vi.fn(),
  },
  blogStore: {
    posts: [{ id: 1, title: 'Blog Post' }],
  },
}))

vi.mock('../../../features/training/training.store.js', () => ({
  useTrainingStore: vi.fn(() => trainingStore),
}))

vi.mock('../../../features/blog/blog.store.js', () => ({
  useBlogStore: vi.fn(() => blogStore),
}))

describe('TrCatsView', () => {
  beforeEach(() => {
    trainingStore.isLoading = false
    trainingStore.categories = [
      { key: 'annual', name: 'Annual', icon: '📚', color: '#3B82F6', bgColor: '#EFF6FF', tag: 'required' },
      { key: 'site', name: 'Site Visit', icon: '🚌', color: '#10B981', bgColor: '#ECFDF5', tag: 'fun' },
    ]
    trainingStore.courses = [
      { id: 1, title: 'Vue 101', category: 'annual' },
      { id: 2, title: 'React 101', category: 'annual' },
    ]
    trainingStore.siteVisits = [{ id: 'sv1', title: 'Office Visit' }]
    trainingStore.idpVideos = []
    blogStore.posts = [{ id: 1, title: 'Blog Post' }]
    trainingStore.loadIdpVideos.mockClear()
  })

  function createWrapper() {
    return shallowMount(TrCatsView)
  }

  it('renders loading state', () => {
    trainingStore.isLoading = true
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('กำลังโหลด')
  })

  it('renders category cards', () => {
    const wrapper = createWrapper()
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBe(2)
    expect(wrapper.text()).toContain('Annual')
    expect(wrapper.text()).toContain('Site Visit')
  })

  it('shows count for each category', () => {
    const wrapper = createWrapper()
    // annual has 2 courses -> "2 หลักสูตร"
    expect(wrapper.text()).toContain('2')
    expect(wrapper.text()).toContain('หลักสูตร')
    // site has 1 site visit -> "1 สถานที่"
    expect(wrapper.text()).toContain('1')
    expect(wrapper.text()).toContain('สถานที่')
  })

  it('emits open-category on click', () => {
    const wrapper = createWrapper()
    const buttons = wrapper.findAll('button')
    buttons[0].trigger('click')
    expect(wrapper.emitted('open-category')).toBeTruthy()
    expect(wrapper.emitted('open-category')[0][0]).toEqual(trainingStore.categories[0])
  })

  it('calls loadIdpVideos on mount', () => {
    createWrapper()
    expect(trainingStore.loadIdpVideos).toHaveBeenCalledTimes(1)
  })
})
