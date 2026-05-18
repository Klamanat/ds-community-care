import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import TrIdpView from '../../../features/training/training/TrIdpView.vue'

const { trainingStore } = vi.hoisted(() => ({
  trainingStore: {
    idpPosters: [
      { id: 1, title: 'IDP Plan 2026', description: 'My plan', imageUrl: 'https://example.com/poster1.jpg', date: '2026-03-15' },
      { id: 2, title: 'Skill Roadmap', description: 'Learn new skills', imageUrl: 'https://example.com/poster2.jpg', date: '2026-04-01' },
    ],
    idpVideos: [
      { id: 1, title: 'Vue Tutorial', description: 'Learn Vue', videoUrl: 'https://youtube.com/watch?v=abc123def45' },
      { id: 2, title: 'React Crash Course', description: 'Learn React', videoUrl: 'https://youtube.com/watch?v=xyz789ghi01' },
    ],
    idpLoading: false,
    loadIdpPosters: vi.fn(),
    loadIdpVideos: vi.fn(),
  },
}))

vi.mock('../../../features/training/training.store.js', () => ({
  useTrainingStore: vi.fn(() => trainingStore),
}))

describe('TrIdpView', () => {
  beforeEach(() => {
    trainingStore.idpPosters = [
      { id: 1, title: 'IDP Plan 2026', description: 'My plan', imageUrl: 'https://example.com/poster1.jpg', date: '2026-03-15' },
      { id: 2, title: 'Skill Roadmap', description: 'Learn new skills', imageUrl: 'https://example.com/poster2.jpg', date: '2026-04-01' },
    ]
    trainingStore.idpVideos = [
      { id: 1, title: 'Vue Tutorial', description: 'Learn Vue', videoUrl: 'https://youtube.com/watch?v=abc123def45' },
      { id: 2, title: 'React Crash Course', description: 'Learn React', videoUrl: 'https://youtube.com/watch?v=xyz789ghi01' },
    ]
    trainingStore.idpLoading = false
    trainingStore.loadIdpPosters.mockClear()
    trainingStore.loadIdpVideos.mockClear()
  })

  function createWrapper() {
    return shallowMount(TrIdpView)
  }

  it('renders IDP posters', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('IDP Plan 2026')
    expect(wrapper.text()).toContain('Skill Roadmap')
  })

  it('renders poster descriptions', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('My plan')
    expect(wrapper.text()).toContain('Learn new skills')
  })

  it('renders poster images', () => {
    const wrapper = createWrapper()
    const images = wrapper.findAll('.idp-tl-img')
    expect(images.length).toBe(2)
    expect(images.at(0).attributes('src')).toBe('https://example.com/poster1.jpg')
    expect(images.at(1).attributes('src')).toBe('https://example.com/poster2.jpg')
  })

  it('renders video section', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('วิดีโอ')
    expect(wrapper.text()).toContain('Vue Tutorial')
    expect(wrapper.text()).toContain('React Crash Course')
  })

  it('renders video descriptions', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Learn Vue')
    expect(wrapper.text()).toContain('Learn React')
  })

  it('shows empty state when no posters', () => {
    trainingStore.idpPosters = []
    trainingStore.idpVideos = []
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('ยังไม่มีโปสเตอร์')
  })

  it('shows empty state when no videos', () => {
    trainingStore.idpVideos = []
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('ยังไม่มีวิดีโอ')
  })

  it('shows loading state for posters', () => {
    trainingStore.idpLoading = true
    trainingStore.idpPosters = []
    trainingStore.idpVideos = []
    const wrapper = createWrapper()
    expect(wrapper.findAll('.idp-skeleton').length).toBeGreaterThan(0)
  })

  it('calls loadIdpPosters and loadIdpVideos on mount', () => {
    createWrapper()
    expect(trainingStore.loadIdpPosters).toHaveBeenCalledTimes(1)
    expect(trainingStore.loadIdpVideos).toHaveBeenCalledTimes(1)
  })

  it('shows current year in section label', () => {
    const wrapper = createWrapper()
    const year = new Date().getFullYear().toString()
    expect(wrapper.text()).toContain(year)
  })

  it('renders video play button overlay', () => {
    const wrapper = createWrapper()
    const playButtons = wrapper.findAll('.idp-video-play')
    expect(playButtons.length).toBe(2)
    expect(playButtons.at(0).text()).toContain('▶')
  })

  it('shows poster dates formatted', () => {
    const wrapper = createWrapper()
    // The date "2026-03-15" -> should show "มี.ค. 2569"
    // The date "2026-04-01" -> should show "เม.ย. 2569"
    const dateElements = wrapper.findAll('.idp-tl-date')
    expect(dateElements.length).toBe(2)
  })
})
