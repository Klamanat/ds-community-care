import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'

const mockGetEmployees = vi.fn()
const mockOpenModal = vi.fn()
const mockCloseModal = vi.fn()

vi.mock('../../../core/services/adminService.js', () => ({
  getEmployees: (...args) => mockGetEmployees(...args),
  updateRow: vi.fn(),
  addEmployee: vi.fn(),
  uploadProfileImage: vi.fn(),
  deleteRow: vi.fn(),
}))

vi.mock('../../../core/services/imageService.js', () => ({
  fetchImages: vi.fn(() => Promise.resolve({})),
}))

vi.mock('../../../core/services/edgeFunctions.js', () => ({
  deleteImage: vi.fn(),
}))

vi.mock('../../../core/stores/ui.js', () => ({
  useUiStore: vi.fn(() => ({
    showToast: vi.fn(),
    openModal: mockOpenModal,
    closeModal: mockCloseModal,
  })),
}))

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ query: {} })),
}))

import AdminEmployeesView from '../../../views/admin/AdminEmployeesView.vue'

describe('AdminEmployeesView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetEmployees.mockResolvedValue([])
  })

  it('renders the page header component and search bar', () => {
    const wrapper = shallowMount(AdminEmployeesView)
    expect(wrapper.findComponent({ name: 'AdminPageHeader' }).exists()).toBe(true)
    // Search bar and filter chips render directly in template
    expect(wrapper.text()).toContain('👥 ทั้งหมด')
    expect(wrapper.text()).toContain('🎂 วันเกิดเดือนนี้')
  })

  it('shows loading skeletons initially', () => {
    const wrapper = shallowMount(AdminEmployeesView)
    expect(wrapper.findComponent({ name: 'SkeletonCard' }).exists()).toBe(true)
  })

  it('renders employees after load', async () => {
    mockGetEmployees.mockResolvedValue([
      { id: '1', name: 'Alice', empCode: 'DS001', role: 'Developer', dept: 'IT', inTeam: true },
      { id: '2', name: 'Bob', empCode: 'DS002', role: 'Designer', dept: 'UX', inTeam: false },
    ])

    const wrapper = shallowMount(AdminEmployeesView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('Bob')
    expect(wrapper.text()).toContain('2/2')
  })

  it('shows EmptyState when no employees after load', async () => {
    const wrapper = shallowMount(AdminEmployeesView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent({ name: 'EmptyState' }).exists()).toBe(true)
  })

  it('filters by search query', async () => {
    mockGetEmployees.mockResolvedValue([
      { id: '1', name: 'Alice', empCode: 'DS001', role: 'Developer', dept: 'IT', inTeam: true },
      { id: '2', name: 'Bob', empCode: 'DS002', role: 'Designer', dept: 'UX', inTeam: false },
    ])

    const wrapper = shallowMount(AdminEmployeesView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    // Set search to filter
    wrapper.vm.search = 'Alice'
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).not.toContain('Bob')
  })

  it('shows birth month filter chip', async () => {
    const wrapper = shallowMount(AdminEmployeesView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    const chips = wrapper.findAll('.al-chip')
    expect(chips.length).toBeGreaterThanOrEqual(2)
    expect(chips[0].text()).toContain('ทั้งหมด')
    expect(chips[1].text()).toContain('วันเกิดเดือนนี้')
  })
})
