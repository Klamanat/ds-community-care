import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import TrReviewView from '../../../features/training/training/TrReviewView.vue'

const { trainingStore, userAuthStore } = vi.hoisted(() => ({
  trainingStore: {
    courses: [
      { id: 1, title: 'Vue 101', category: 'annual' },
      { id: 2, title: 'React 101', category: 'annual' },
      { id: 3, title: 'Leadership 101', category: 'leadership' },
    ],
    reviews: {
      1: { avg: 4.5, count: 2, myStars: 4, myComment: 'Great!' },
    },
    allReviews: [
      { id: 1, trainingId: 1, employeeId: 'EMP001', employeeName: 'John', stars: 5, comment: 'Excellent!' },
      { id: 2, trainingId: 1, employeeId: 'EMP002', employeeName: 'Jane', stars: 4, comment: 'Good course' },
    ],
    submitReview: vi.fn(),
    getCategoryInfo: (key) => {
      const cats = {
        annual: { icon: '📅', name: 'Annual Training', color: '#0EA5E9', bgColor: '#E0F2FE' },
        leadership: { icon: '👑', name: 'Talent & Leadership', color: '#8B5CF6', bgColor: '#F5F3FF' },
      }
      return cats[key] || { icon: '📚', name: key, color: '#6366f1', bgColor: '#EEF2FF' }
    },
    reviewsForCourse: (trainingId) => {
      if (trainingId === 1) {
        return [
          { id: 1, trainingId: 1, employeeId: 'EMP001', employeeName: 'John', stars: 5, comment: 'Excellent!' },
          { id: 2, trainingId: 1, employeeId: 'EMP002', employeeName: 'Jane', stars: 4, comment: 'Good course' },
        ]
      }
      return []
    },
  },
  userAuthStore: {
    userName: 'TestUser',
    empCode: 'EMP003',
  },
}))

vi.mock('../../../features/training/training.store.js', () => ({
  useTrainingStore: vi.fn(() => trainingStore),
}))

vi.mock('../../../core/stores/userAuth.js', () => ({
  useUserAuthStore: vi.fn(() => userAuthStore),
}))

describe('TrReviewView', () => {
  beforeEach(() => {
    trainingStore.courses = [
      { id: 1, title: 'Vue 101', category: 'annual' },
      { id: 2, title: 'React 101', category: 'annual' },
      { id: 3, title: 'Leadership 101', category: 'leadership' },
    ]
    trainingStore.reviews = {
      1: { avg: 4.5, count: 2, myStars: 4, myComment: 'Great!' },
    }
    trainingStore.allReviews = [
      { id: 1, trainingId: 1, employeeId: 'EMP001', employeeName: 'John', stars: 5, comment: 'Excellent!' },
      { id: 2, trainingId: 1, employeeId: 'EMP002', employeeName: 'Jane', stars: 4, comment: 'Good course' },
    ]
    trainingStore.submitReview.mockClear()
  })

  function createWrapper() {
    return shallowMount(TrReviewView)
  }

  it('renders course search input', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.tr-search-input').exists()).toBe(true)
    expect(wrapper.find('.tr-search-input').attributes('placeholder')).toContain('ค้นหาหลักสูตร')
  })

  async function typeSearch(wrapper, text) {
    const input = wrapper.find('.tr-search-input')
    await input.setValue(text)
    await wrapper.vm.$nextTick()
  }

  it('shows courses in search list after typing', async () => {
    const wrapper = createWrapper()
    await typeSearch(wrapper, 'Vue')
    expect(wrapper.text()).toContain('Vue 101')
    await typeSearch(wrapper, 'React')
    expect(wrapper.text()).toContain('React 101')
    await typeSearch(wrapper, 'Leader')
    expect(wrapper.text()).toContain('Leadership 101')
  })

  it('shows star ratings for courses with reviews', async () => {
    const wrapper = createWrapper()
    await typeSearch(wrapper, 'Vue')
    const myStars = wrapper.findAll('.tr-cpi-my')
    expect(myStars.length).toBeGreaterThan(0)
    expect(myStars.at(0).text()).toContain('★')
  })

  it('shows selected course chip after selecting a course', async () => {
    const wrapper = createWrapper()
    await typeSearch(wrapper, 'Vue')
    const courseItems = wrapper.findAll('.tr-course-pick-item')
    expect(courseItems.length).toBeGreaterThan(0)
    courseItems.at(0).trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.tr-selected-chip').exists()).toBe(true)
    expect(wrapper.text()).toContain('Vue 101')
  })

  it('shows star picker after selecting a course', async () => {
    const wrapper = createWrapper()
    await typeSearch(wrapper, 'Vue')
    const courseItems = wrapper.findAll('.tr-course-pick-item')
    courseItems.at(0).trigger('click')
    await wrapper.vm.$nextTick()
    const starPicker = wrapper.findAll('.tr-star-pick')
    expect(starPicker.length).toBe(5)
  })

  it('shows review list after selecting a course with reviews', async () => {
    const wrapper = createWrapper()
    await typeSearch(wrapper, 'Vue')
    const courseItems = wrapper.findAll('.tr-course-pick-item')
    courseItems.at(0).trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('John')
    expect(wrapper.text()).toContain('Jane')
    expect(wrapper.text()).toContain('Excellent!')
    expect(wrapper.text()).toContain('Good course')
  })

  it('shows empty state when no courses match search', async () => {
    const wrapper = createWrapper()
    await typeSearch(wrapper, 'nonexistent')
    expect(wrapper.text()).toContain('ไม่พบหลักสูตร')
  })

  it('shows submit button', async () => {
    const wrapper = createWrapper()
    await typeSearch(wrapper, 'Vue')
    const courseItems = wrapper.findAll('.tr-course-pick-item')
    courseItems.at(0).trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('บันทึกคะแนน')
  })

  it('shows review textarea', async () => {
    const wrapper = createWrapper()
    await typeSearch(wrapper, 'Vue')
    const courseItems = wrapper.findAll('.tr-course-pick-item')
    courseItems.at(0).trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.tr-review-input').exists()).toBe(true)
    expect(wrapper.find('.tr-review-input').attributes('placeholder')).toContain('เล่าประสบการณ์')
  })

  it('emits select-course when selecting a course', async () => {
    const wrapper = createWrapper()
    await typeSearch(wrapper, 'Vue')
    const courseItems = wrapper.findAll('.tr-course-pick-item')
    courseItems.at(0).trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('select-course')).toBeTruthy()
    expect(wrapper.emitted('select-course')[0][0]).toEqual(trainingStore.courses[0])
  })

  it('emits select-course null when clearing course', async () => {
    const wrapper = createWrapper()
    await typeSearch(wrapper, 'Vue')
    const courseItems = wrapper.findAll('.tr-course-pick-item')
    courseItems.at(0).trigger('click')
    await wrapper.vm.$nextTick()
    const chip = wrapper.find('.tr-selected-chip')
    chip.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('select-course')[1][0]).toBeNull()
  })
})
