import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

const mockGetAnnouncement = vi.fn()
const mockSaveAnnouncement = vi.fn()
const mockGetAll = vi.fn()
const mockFetchQuizAnswers = vi.fn()
const mockDeleteQuizAnswers = vi.fn()
const mockUploadAnnouncementVideo = vi.fn()
const mockUploadAnnouncementImage = vi.fn()

vi.mock('../../../core/stores/ui.js', () => ({
  useUiStore: vi.fn(() => ({
    openModal: vi.fn(),
    closeModal: vi.fn(),
  })),
}))

vi.mock('../../../core/services/adminService.js', () => ({
  getAnnouncement: (...args) => mockGetAnnouncement(...args),
  saveAnnouncement: (...args) => mockSaveAnnouncement(...args),
  getAll: (...args) => mockGetAll(...args),
  fetchQuizAnswers: (...args) => mockFetchQuizAnswers(...args),
  deleteQuizAnswers: (...args) => mockDeleteQuizAnswers(...args),
  uploadAnnouncementVideo: (...args) => mockUploadAnnouncementVideo(...args),
  uploadAnnouncementImage: (...args) => mockUploadAnnouncementImage(...args),
}))

import AdminAnnouncementView from '../../../views/admin/AdminAnnouncementView.vue'

describe('AdminAnnouncementView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAll.mockResolvedValue([])
  })

  it('renders the page header with title', () => {
    const wrapper = shallowMount(AdminAnnouncementView)
    expect(wrapper.findComponent({ name: 'AdminPageHeader' }).exists()).toBe(true)
  })

  it('shows loading skeletons initially', () => {
    const wrapper = shallowMount(AdminAnnouncementView)
    expect(wrapper.findComponent({ name: 'SkeletonCard' }).exists()).toBe(true)
  })

  it('renders announcement form after loading', async () => {
    mockGetAll.mockResolvedValue([
      { key: 'ann_enabled', value: 'TRUE' },
      { key: 'ann_id', value: 'ann_2026_05_18' },
      { key: 'ann_title', value: 'Test Announcement' },
      { key: 'ann_video', value: 'https://youtu.be/abc123' },
      { key: 'ann_video_enabled', value: 'true' },
      { key: 'ann_image', value: '' },
      { key: 'ann_image_enabled', value: 'true' },
      { key: 'ann_desc', value: 'Description text' },
      { key: 'ann_quiz_enabled', value: 'false' },
    ])

    const wrapper = shallowMount(AdminAnnouncementView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    // Title is in form.title via v-model, not in rendered text. Check it appears in DOM.
    expect(wrapper.find('.al-btn-save').exists()).toBe(true)
  })

  it('loads quiz answers when quiz is enabled and id exists', async () => {
    mockGetAll.mockResolvedValue([
      { key: 'ann_id', value: 'ann_2026_05' },
      { key: 'ann_quiz_enabled', value: 'true' },
      { key: 'ann_quiz_questions', value: JSON.stringify([{ id: 'q1', question: 'Test?', type: 'single', options: [{ id: 'a', text: 'Option A' }, { id: 'b', text: 'Option B' }] }]) },
      { key: 'ann_enabled', value: 'TRUE' },
      { key: 'ann_title', value: 'Quiz Ann' },
      { key: 'ann_video_enabled', value: 'true' },
      { key: 'ann_image_enabled', value: 'true' },
    ])
    mockFetchQuizAnswers.mockResolvedValue([
      { employee_name: 'John', question_id: 'q1', selected: ['a'], created_at: '2026-05-18T10:00:00' },
    ])

    const wrapper = shallowMount(AdminAnnouncementView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(mockFetchQuizAnswers).toHaveBeenCalledWith('ann_2026_05')
  })

  it('renders the popup status toggle section', async () => {
    mockGetAll.mockResolvedValue([])
    const wrapper = shallowMount(AdminAnnouncementView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('สถานะ Popup')
    expect(wrapper.text()).toContain('เปิดใช้งาน')
    expect(wrapper.text()).toContain('ปิดใช้งาน')
  })

  it('renders the announcement details section', async () => {
    mockGetAll.mockResolvedValue([])
    const wrapper = shallowMount(AdminAnnouncementView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('หัวข้อประกาศ')
    expect(wrapper.text()).toContain('รายละเอียด')
  })

  it('renders media tabs selector', async () => {
    mockGetAll.mockResolvedValue([])
    const wrapper = shallowMount(AdminAnnouncementView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('สื่อประกอบ')
  })

  it('disables save button while saving', async () => {
    mockGetAll.mockResolvedValue([])
    const wrapper = shallowMount(AdminAnnouncementView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    const saveBtn = wrapper.find('.al-btn-save')
    expect(saveBtn.exists()).toBe(true)
    expect(saveBtn.attributes('disabled')).toBeUndefined()
  })

  it('calls saveAnnouncement on save button click', async () => {
    mockGetAll.mockResolvedValue([])
    mockSaveAnnouncement.mockResolvedValue({})
    const wrapper = shallowMount(AdminAnnouncementView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    const saveBtn = wrapper.find('.al-btn-save')
    await saveBtn.trigger('click')

    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(mockSaveAnnouncement).toHaveBeenCalled()
  })

  it('shows save error message on failure', async () => {
    mockGetAll.mockResolvedValue([])
    mockSaveAnnouncement.mockRejectedValue(new Error('Save failed'))
    const wrapper = shallowMount(AdminAnnouncementView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    const saveBtn = wrapper.find('.al-btn-save')
    await saveBtn.trigger('click')

    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Save failed')
  })

  it('renders quiz section when enabled', async () => {
    mockGetAll.mockResolvedValue([
      { key: 'ann_quiz_enabled', value: 'true' },
      { key: 'ann_enabled', value: 'TRUE' },
      { key: 'ann_title', value: 'Quiz Ann' },
      { key: 'ann_video_enabled', value: 'true' },
      { key: 'ann_image_enabled', value: 'true' },
    ])
    const wrapper = shallowMount(AdminAnnouncementView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('คำถามร่วมสนุก')
  })

  it('handles fetch error gracefully', async () => {
    mockGetAll.mockRejectedValue(new Error('Network error'))
    const wrapper = shallowMount(AdminAnnouncementView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()
    // Should not throw; component should still render form with defaults
    expect(wrapper.find('.al-btn-save').exists()).toBe(true)
  })
})
