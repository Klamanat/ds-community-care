import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

const mockOpenModal = vi.fn()
const mockCloseModal = vi.fn()

const mockLoad = vi.fn()
const mockLocalAdd = vi.fn()
const mockLocalUpdate = vi.fn()
const mockLocalDelete = vi.fn()

vi.mock('../../../features/activities/activities.store.js', () => ({
  useActivitiesStore: vi.fn(() => ({
    all: [],
    load: mockLoad,
    localAdd: mockLocalAdd,
    localUpdate: mockLocalUpdate,
    localDelete: mockLocalDelete,
  })),
}))

vi.mock('../../../features/activities/activitiesService.js', () => ({
  addActivity: vi.fn(),
  updateActivity: vi.fn(),
  deleteActivity: vi.fn(),
  uploadImage: vi.fn(),
  getActivityBookedCount: vi.fn(),
  getActivityTickets: vi.fn(),
  checkInTicket: vi.fn(),
}))

vi.mock('../../../core/composables/useImageCompress.js', () => ({
  resizeToBase64: vi.fn(),
}))

vi.mock('../../../core/services/edgeFunctions.js', () => ({
  deleteImage: vi.fn(),
}))

vi.mock('../../../core/stores/ui.js', () => ({
  useUiStore: vi.fn(() => ({
    openModal: mockOpenModal,
    closeModal: mockCloseModal,
  })),
}))

import AdminActivitiesView from '../../../views/admin/AdminActivitiesView.vue'

describe('AdminActivitiesView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLoad.mockResolvedValue()
  })

  it('renders the page header with title', () => {
    const wrapper = shallowMount(AdminActivitiesView)
    expect(wrapper.findComponent({ name: 'AdminPageHeader' }).exists()).toBe(true)
    expect(wrapper.text()).toContain('กิจกรรม')
  })

  it('shows loading skeletons initially', () => {
    const wrapper = shallowMount(AdminActivitiesView)
    expect(wrapper.findComponent({ name: 'SkeletonCard' }).exists()).toBe(true)
  })

  it('renders month filter chips', async () => {
    mockLoad.mockResolvedValue()
    const wrapper = shallowMount(AdminActivitiesView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    const chips = wrapper.findAll('.al-chip')
    expect(chips.length).toBeGreaterThan(0)
    // First chip should be "ทั้งหมด"
    expect(chips[0].text()).toContain('ทั้งหมด')
  })

  it('renders EmptyState when no activities', async () => {
    mockLoad.mockResolvedValue()
    const wrapper = shallowMount(AdminActivitiesView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent({ name: 'EmptyState' }).exists()).toBe(true)
  })

  it('renders activities from store', async () => {
    // Mock the store with activities
    const storeModule = await import('../../../features/activities/activities.store.js')
    storeModule.useActivitiesStore.mockReturnValue({
      all: [
        { id: '1', name: 'Team Outing', monthIdx: '3', date: '15 มี.ค. 2569', loc: 'Beach', emoji: '🏖️' },
        { id: '2', name: 'Workshop', monthIdx: '4', date: '10 เม.ย. 2569', loc: 'Office', emoji: '📚' },
      ],
      load: mockLoad,
      localAdd: mockLocalAdd,
      localUpdate: mockLocalUpdate,
      localDelete: mockLocalDelete,
    })

    const wrapper = shallowMount(AdminActivitiesView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Team Outing')
    expect(wrapper.text()).toContain('Workshop')
  })

  it('opens add modal when "+ เพิ่มกิจกรรม" is clicked', async () => {
    const wrapper = shallowMount(AdminActivitiesView, {
      global: {
        stubs: {
          AdminPageHeader: { template: '<div><slot /></div>' },
          'router-link': true,
        },
      },
    })
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('+ เพิ่มกิจกรรม')

    // Find the button by text content
    const btns = wrapper.findAll('button')
    const addBtn = btns.find(b => b.text().includes('+ เพิ่มกิจกรรม'))
    expect(addBtn).toBeTruthy()
    await addBtn.trigger('click')

    expect(mockOpenModal).toHaveBeenCalledWith('admin-activities-form')
  })

  it('opens edit modal when "แก้ไข" button is clicked', async () => {
    const storeModule = await import('../../../features/activities/activities.store.js')
    storeModule.useActivitiesStore.mockReturnValue({
      all: [
        { id: '1', name: 'Team Outing', monthIdx: '3', date: '15 มี.ค. 2569', loc: 'Beach', emoji: '🏖️' },
      ],
      load: mockLoad,
      localAdd: mockLocalAdd,
      localUpdate: mockLocalUpdate,
      localDelete: mockLocalDelete,
    })

    const wrapper = shallowMount(AdminActivitiesView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    const editBtns = wrapper.findAll('.al-btn-edit')
    const editBtn = editBtns.find(b => b.text().includes('แก้ไข'))
    expect(editBtn).toBeTruthy()
    await editBtn.trigger('click')

    expect(mockOpenModal).toHaveBeenCalledWith('admin-activities-form')
  })

  it('opens delete confirm modal when "ลบ" is clicked', async () => {
    const storeModule = await import('../../../features/activities/activities.store.js')
    storeModule.useActivitiesStore.mockReturnValue({
      all: [
        { id: '1', name: 'Team Outing', monthIdx: '3', date: '15 มี.ค. 2569', loc: 'Beach' },
      ],
      load: mockLoad,
      localAdd: mockLocalAdd,
      localUpdate: mockLocalUpdate,
      localDelete: mockLocalDelete,
    })

    const wrapper = shallowMount(AdminActivitiesView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    const deleteBtns = wrapper.findAll('.al-btn-delete')
    const deleteBtn = deleteBtns.find(b => b.text().includes('ลบ'))
    expect(deleteBtn).toBeTruthy()
    await deleteBtn.trigger('click')

    expect(mockOpenModal).toHaveBeenCalledWith('admin-activities-del')
  })

  it('has a QR scan link in the header', () => {
    const wrapper = shallowMount(AdminActivitiesView)
    const header = wrapper.findComponent({ name: 'AdminPageHeader' })
    expect(header.exists()).toBe(true)
  })

  it('loads activities on mount', () => {
    shallowMount(AdminActivitiesView)
    expect(mockLoad).toHaveBeenCalledWith(true)
  })

  it('filters activities by month', async () => {
    const storeModule = await import('../../../features/activities/activities.store.js')
    storeModule.useActivitiesStore.mockReturnValue({
      all: [
        { id: '1', name: 'March Event', monthIdx: '3', date: '15 มี.ค. 2569' },
        { id: '2', name: 'April Event', monthIdx: '4', date: '10 เม.ย. 2569' },
      ],
      load: mockLoad,
      localAdd: mockLocalAdd,
      localUpdate: mockLocalUpdate,
      localDelete: mockLocalDelete,
    })

    const wrapper = shallowMount(AdminActivitiesView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    // Click filter for March (index 3)
    const chips = wrapper.findAll('.al-chip')
    const marchChip = chips.find(c => c.text().includes('มี.ค'))
    await marchChip.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('March Event')
    expect(wrapper.text()).not.toContain('April Event')
  })
})
