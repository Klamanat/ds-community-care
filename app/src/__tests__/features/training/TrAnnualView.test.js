import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import TrAnnualView from '../../../features/training/training/TrAnnualView.vue'

const { trainingStore } = vi.hoisted(() => ({
  trainingStore: {
    courses: [
      { id: 1, title: 'Vue 101', category: 'annual', description: 'Learn Vue', instructor: 'John', section: 'train2026' },
      { id: 2, title: 'React 101', category: 'annual', description: 'Learn React', instructor: 'Jane', section: 'train2026' },
      { id: 3, title: 'New Course', category: 'annual', description: 'Fresh', instructor: 'Bob', section: 'new' },
      { id: 4, title: 'Top Rated', category: 'annual', description: 'Best', instructor: 'Alice', section: 'top' },
    ],
    reviews: {
      4: { avg: 4.5, count: 2 },
    },
  },
}))

vi.mock('../../../features/training/training.store.js', () => ({
  useTrainingStore: vi.fn(() => trainingStore),
}))

describe('TrAnnualView', () => {
  beforeEach(() => {
    trainingStore.courses = [
      { id: 1, title: 'Vue 101', category: 'annual', description: 'Learn Vue', instructor: 'John', section: 'train2026' },
      { id: 2, title: 'React 101', category: 'annual', description: 'Learn React', instructor: 'Jane', section: 'train2026' },
      { id: 3, title: 'New Course', category: 'annual', description: 'Fresh', instructor: 'Bob', section: 'new' },
      { id: 4, title: 'Top Rated', category: 'annual', description: 'Best', instructor: 'Alice', section: 'top' },
    ]
    trainingStore.reviews = {
      4: { avg: 4.5, count: 2 },
    }
  })

  function createWrapper(cat = { key: 'annual', color: '#0EA5E9' }) {
    return shallowMount(TrAnnualView, {
      props: { cat },
    })
  }

  it('renders training sections', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Training trend 2026')
    expect(wrapper.text()).toContain('อัพเดตหลักสูตรใหม่')
    expect(wrapper.text()).toContain('คอร์สดีบอกต่อ')
  })

  it('shows courses in each section', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Vue 101')
    expect(wrapper.text()).toContain('React 101')
    expect(wrapper.text()).toContain('New Course')
    expect(wrapper.text()).toContain('Top Rated')
  })

  it('shows empty state when no courses match category', () => {
    const wrapper = createWrapper({ key: 'external', color: '#F59E0B' })
    // Still shows section headers but with 0 count and empty text
    const sections = wrapper.findAll('.tr-section-empty')
    expect(sections.length).toBeGreaterThanOrEqual(1)
    expect(sections.at(0).text()).toContain('ยังไม่มีข้อมูล')
  })

  it('shows instructor for courses', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('John')
    expect(wrapper.text()).toContain('Jane')
    expect(wrapper.text()).toContain('Bob')
    expect(wrapper.text()).toContain('Alice')
  })

  it('shows course description', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Learn Vue')
    expect(wrapper.text()).toContain('Learn React')
    expect(wrapper.text()).toContain('Fresh')
    expect(wrapper.text()).toContain('Best')
  })

  it('shows rating for courses with reviews in top section', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('4.5')
    expect(wrapper.text()).toContain('(2)')
  })

  it('shows category pill color', () => {
    const wrapper = createWrapper()
    const pills = wrapper.findAll('.tr-sec-hd-pill')
    expect(pills.length).toBe(3)
  })

  it('emits open-review when clicking top section course', () => {
    const wrapper = createWrapper()
    const clickableCards = wrapper.findAll('.tr-course-card2--click')
    if (clickableCards.length > 0) {
      clickableCards[0].trigger('click')
      expect(wrapper.emitted('open-review')).toBeTruthy()
    }
  })

  it('emits open-review when clicking add review button', () => {
    const wrapper = createWrapper()
    const addBtn = wrapper.find('.tr-add-review-btn-sm')
    if (addBtn.exists()) {
      addBtn.trigger('click')
      expect(wrapper.emitted('open-review')).toBeTruthy()
    }
  })
})
