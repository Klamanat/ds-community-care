import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'

const mockShowToast = vi.fn()
const mockOpenModal = vi.fn()
const mockCloseModal = vi.fn()
const mockFetchAll = vi.fn()

vi.mock('../../../features/plans/plansService.js', () => ({
  fetchAll: (...args) => mockFetchAll(...args),
  addPlan: vi.fn(),
  updatePlan: vi.fn(),
  deletePlan: vi.fn(),
  uploadImage: vi.fn(),
}))

vi.mock('../../../core/stores/ui.js', () => ({
  useUiStore: vi.fn(() => ({
    showToast: mockShowToast,
    openModal: mockOpenModal,
    closeModal: mockCloseModal,
  })),
}))

vi.mock('../../../core/composables/useRipple.js', () => ({
  useRipple: vi.fn(() => ({ handleRippleClick: vi.fn() })),
}))

vi.mock('../../../core/composables/useFadeIn.js', () => ({
  useFadeIn: vi.fn(),
}))

vi.mock('../../../core/composables/useImageCompress.js', () => ({
  resizeToBase64: vi.fn(),
}))

vi.mock('../../../core/services/edgeFunctions.js', () => ({
  deleteImage: vi.fn(),
}))

import AdminPlansView from '../../../views/admin/AdminPlansView.vue'

describe('AdminPlansView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchAll.mockResolvedValue([])
  })

  it('renders the page header', () => {
    const wrapper = shallowMount(AdminPlansView)
    expect(wrapper.findComponent({ name: 'AdminPageHeader' }).exists()).toBe(true)
  })

  it('shows loading skeletons initially', () => {
    const wrapper = shallowMount(AdminPlansView)
    expect(wrapper.findComponent({ name: 'SkeletonCard' }).exists()).toBe(true)
  })

  it('shows EmptyState when no plans after load', async () => {
    const wrapper = shallowMount(AdminPlansView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent({ name: 'EmptyState' }).exists()).toBe(true)
  })

  it('renders plans after load', async () => {
    mockFetchAll.mockResolvedValue([
      { id: 'pl1', title: 'แผนเดือนพฤษภาคม', description: 'กิจกรรมต่างๆ', yearMonth: '2026-05', posterUrl: '', posterId: '' },
      { id: 'pl2', title: 'แผนเดือนมิถุนายน', description: 'กิจกรรมสนุกๆ', yearMonth: '2026-06', posterUrl: '', posterId: '' },
    ])

    const wrapper = shallowMount(AdminPlansView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('แผนเดือนพฤษภาคม')
    expect(wrapper.text()).toContain('แผนเดือนมิถุนายน')
    expect(wrapper.text()).toContain('2 รายการ')
  })

  it('shows year-month badge for plans', async () => {
    mockFetchAll.mockResolvedValue([
      { id: 'pl1', title: 'แผน พ.ค.', description: '', yearMonth: '2026-05', posterUrl: '', posterId: '' },
    ])

    const wrapper = shallowMount(AdminPlansView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('พฤษภาคม')
    expect(wrapper.text()).toContain('2569')
  })

  it('calls fetchAll on mount', () => {
    shallowMount(AdminPlansView)
    expect(mockFetchAll).toHaveBeenCalled()
  })

  it('shows toast on fetch error', async () => {
    mockFetchAll.mockRejectedValue(new Error('Network error'))

    const wrapper = shallowMount(AdminPlansView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(mockShowToast).toHaveBeenCalledWith('โหลดข้อมูลไม่สำเร็จ')
  })

  it('opens add modal when + เพิ่มแผน is clicked', () => {
    const wrapper = shallowMount(AdminPlansView)
    wrapper.vm.openAdd()
    expect(mockOpenModal).toHaveBeenCalledWith('admin-plans-form')
  })

  it('opens edit modal for a plan', () => {
    const wrapper = shallowMount(AdminPlansView)
    const plan = { id: 'pl1', title: 'แผน', description: 'รายละเอียด', yearMonth: '2026-05', posterUrl: '', posterId: '' }
    wrapper.vm.openEdit(plan)
    expect(mockOpenModal).toHaveBeenCalledWith('admin-plans-form')
  })

  it('opens delete confirm modal', () => {
    const wrapper = shallowMount(AdminPlansView)
    const plan = { id: 'pl1', title: 'แผน', description: 'รายละเอียด', yearMonth: '2026-05', posterUrl: '', posterId: '' }
    wrapper.vm.confirmDelete(plan)
    expect(mockOpenModal).toHaveBeenCalledWith('admin-plans-del')
  })

  it('shows description for plans', async () => {
    mockFetchAll.mockResolvedValue([
      { id: 'pl1', title: 'แผน มี.ค.', description: 'กิจกรรมสุดพิเศษ', yearMonth: '2026-03', posterUrl: '', posterId: '' },
    ])

    const wrapper = shallowMount(AdminPlansView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('กิจกรรมสุดพิเศษ')
  })

  it('handles plan with no title', async () => {
    mockFetchAll.mockResolvedValue([
      { id: 'pl1', title: '', description: 'ไม่มีชื่อ', yearMonth: '2026-05', posterUrl: '', posterId: '' },
    ])

    const wrapper = shallowMount(AdminPlansView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('(ไม่มีชื่อ)')
  })
})
