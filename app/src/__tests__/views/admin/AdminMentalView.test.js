import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'

const mockOpenModal = vi.fn()
const mockCloseModal = vi.fn()
const mockGetMentalAdvisors = vi.fn()
const mockGetEmployees = vi.fn()
const mockGetConsultRequests = vi.fn()

vi.mock('../../../core/services/adminService.js', () => ({
  getMentalAdvisors: (...args) => mockGetMentalAdvisors(...args),
  getEmployees: (...args) => mockGetEmployees(...args),
  getConsultRequests: (...args) => mockGetConsultRequests(...args),
  addMentalAdvisor: vi.fn(),
  updateMentalAdvisor: vi.fn(),
  deleteMentalAdvisor: vi.fn(),
}))

vi.mock('../../../core/services/edgeFunctions.js', () => ({
  uploadImage: vi.fn(),
  deleteImage: vi.fn(),
}))

vi.mock('../../../core/constants/mentalCardColors.js', () => ({
  CARD_COLORS: [
    { key: 'mint', css: '#A7F3D0', label: 'Mint', border: '#6EE7B7' },
    { key: 'coral', css: '#FECACA', label: 'Coral', border: '#FCA5A5' },
  ],
  CARD_COLOR_MAP: {
    mint: { css: '#A7F3D0', border: '#6EE7B7' },
    coral: { css: '#FECACA', border: '#FCA5A5' },
  },
  emojiPositions: vi.fn(() => []),
}))

vi.mock('../../../core/composables/useRipple.js', () => ({
  useRipple: vi.fn(() => ({ handleRippleClick: vi.fn() })),
}))

vi.mock('../../../core/composables/useFadeIn.js', () => ({
  useFadeIn: vi.fn(),
}))

vi.mock('../../../core/stores/ui.js', () => ({
  useUiStore: vi.fn(() => ({
    openModal: mockOpenModal,
    closeModal: mockCloseModal,
  })),
}))

import AdminMentalView from '../../../views/admin/AdminMentalView.vue'

describe('AdminMentalView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetMentalAdvisors.mockResolvedValue([])
    mockGetEmployees.mockResolvedValue([])
    mockGetConsultRequests.mockResolvedValue([])
  })

  it('renders the page header with title', () => {
    const wrapper = shallowMount(AdminMentalView)
    expect(wrapper.findComponent({ name: 'AdminPageHeader' }).exists()).toBe(true)
    expect(wrapper.text()).toContain('Mental Health')
  })

  it('shows advisor tab by default', () => {
    const wrapper = shallowMount(AdminMentalView)
    const tabs = wrapper.findAll('.al-tab-btn')
    expect(tabs.length).toBeGreaterThanOrEqual(2)
    expect(tabs[0].text()).toContain('ที่ปรึกษา')
    expect(tabs[1].text()).toContain('ข้อความ')
  })

  it('shows loading skeletons initially', () => {
    const wrapper = shallowMount(AdminMentalView)
    expect(wrapper.findComponent({ name: 'SkeletonCard' }).exists()).toBe(true)
  })

  it('renders advisors after load', async () => {
    mockGetMentalAdvisors.mockResolvedValue([
      { id: 'a1', name: 'มะนาว', role: 'ที่ปรึกษา', employeeId: 'e1', order: 0 },
      { id: 'a2', name: 'สมศรี', role: 'นักจิตวิทยา', employeeId: 'e2', order: 1 },
    ])
    mockGetEmployees.mockResolvedValue([])

    const wrapper = shallowMount(AdminMentalView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('มะนาว')
    expect(wrapper.text()).toContain('สมศรี')
  })

  it('shows EmptyState when no advisors after load', async () => {
    const wrapper = shallowMount(AdminMentalView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent({ name: 'EmptyState' }).exists()).toBe(true)
  })

  it('shows add button on advisors tab', async () => {
    const wrapper = shallowMount(AdminMentalView, {
      global: {
        stubs: {
          AdminPageHeader: { template: '<div><slot /></div>' },
        },
      },
    })
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('+ เพิ่ม')
  })

  it('opens add modal when + เพิ่ม is clicked', async () => {
    const wrapper = shallowMount(AdminMentalView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    wrapper.vm.openAdd()
    expect(mockOpenModal).toHaveBeenCalledWith('admin-mental-form')
  })

  it('switches to requests tab and loads requests', async () => {
    mockGetConsultRequests.mockResolvedValue([
      { id: 'r1', counselorName: 'มะนาว', message: 'ขอคำปรึกษา', createdAt: new Date().toISOString(), isRead: 'false' },
    ])

    const wrapper = shallowMount(AdminMentalView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    wrapper.vm.switchToRequests()
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.tab).toBe('requests')
    expect(wrapper.text()).toContain('ขอคำปรึกษา')
  })

  it('shows info box with usage instructions', () => {
    const wrapper = shallowMount(AdminMentalView)
    expect(wrapper.text()).toContain('วิธีใช้งาน')
    expect(wrapper.text()).toContain('เพิ่มที่ปรึกษา')
  })
})
