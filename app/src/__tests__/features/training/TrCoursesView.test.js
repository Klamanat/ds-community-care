import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import TrCoursesView from '../../../features/training/training/TrCoursesView.vue'

const { trainingStore } = vi.hoisted(() => ({
  trainingStore: {
    courses: [
      { id: 1, title: 'Vue 101', category: 'annual', description: 'Learn Vue', instructor: 'John' },
      { id: 2, title: 'React 101', category: 'annual', description: 'Learn React', instructor: 'Jane' },
      { id: 3, title: 'Leadership 101', category: 'leadership', description: 'Be a leader', instructor: 'Bob' },
    ],
    reviews: {},
  },
}))

vi.mock('../../../features/training/training.store.js', () => ({
  useTrainingStore: vi.fn(() => trainingStore),
}))

describe('TrCoursesView', () => {
  beforeEach(() => {
    trainingStore.courses = [
      { id: 1, title: 'Vue 101', category: 'annual', description: 'Learn Vue', instructor: 'John' },
      { id: 2, title: 'React 101', category: 'annual', description: 'Learn React', instructor: 'Jane' },
      { id: 3, title: 'Leadership 101', category: 'leadership', description: 'Be a leader', instructor: 'Bob' },
    ]
    trainingStore.reviews = {}
  })

  function createWrapper(cat = null) {
    return shallowMount(TrCoursesView, {
      props: { cat },
    })
  }

  it('shows empty state when no cat prop', () => {
    const wrapper = createWrapper(null)
    expect(wrapper.text()).toContain('ยังไม่มีข้อมูล')
  })

  it('shows empty state when no courses match category', () => {
    const wrapper = createWrapper({ key: 'external', name: 'External' })
    expect(wrapper.text()).toContain('ยังไม่มีข้อมูล')
  })

  it('shows courses when matching cat prop', () => {
    const wrapper = createWrapper({ key: 'annual', name: 'Annual' })
    expect(wrapper.text()).toContain('Vue 101')
    expect(wrapper.text()).toContain('React 101')
    expect(wrapper.text()).not.toContain('Leadership 101')
  })

  it('shows instructor', () => {
    const wrapper = createWrapper({ key: 'annual', name: 'Annual' })
    expect(wrapper.text()).toContain('John')
    expect(wrapper.text()).toContain('Jane')
  })

  it('shows course description', () => {
    const wrapper = createWrapper({ key: 'annual', name: 'Annual' })
    expect(wrapper.text()).toContain('Learn Vue')
    expect(wrapper.text()).toContain('Learn React')
  })

  it('filters by category key', () => {
    const wrapper = createWrapper({ key: 'leadership', name: 'Leadership' })
    expect(wrapper.text()).toContain('Leadership 101')
    expect(wrapper.text()).not.toContain('Vue 101')
  })
})
