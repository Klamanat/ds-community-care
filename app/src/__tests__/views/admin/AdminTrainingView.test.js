import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'

const mockOpenModal = vi.fn()
const mockCloseModal = vi.fn()
const mockAdminFetchTrainings = vi.fn()

vi.mock('../../../core/stores/ui.js', () => ({
  useUiStore: vi.fn(() => ({
    openModal: mockOpenModal,
    closeModal: mockCloseModal,
  })),
}))

vi.mock('../../../features/training/trainingService.js', () => ({
  adminFetchTrainings: (...args) => mockAdminFetchTrainings(...args),
  adminFetchSiteVisits: vi.fn(() => Promise.resolve([])),
  adminFetchSiteSuggestions: vi.fn(() => Promise.resolve([])),
  adminAddTraining: vi.fn(),
  adminUpdateTraining: vi.fn(),
  adminDeleteTraining: vi.fn(),
  adminAddSiteVisit: vi.fn(),
  adminUpdateSiteVisit: vi.fn(),
  adminDeleteSiteVisit: vi.fn(),
}))

import AdminTrainingView from '../../../views/admin/AdminTrainingView.vue'

describe('AdminTrainingView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAdminFetchTrainings.mockResolvedValue([])
  })

  it('renders the page header component', () => {
    const wrapper = shallowMount(AdminTrainingView)
    expect(wrapper.findComponent({ name: 'AdminPageHeader' }).exists()).toBe(true)
  })

  it('renders tab bar with all tabs', () => {
    const wrapper = shallowMount(AdminTrainingView)
    const tabs = wrapper.findAll('.al-tab-btn')
    expect(tabs.length).toBeGreaterThanOrEqual(7)
    expect(tabs[0].text()).toContain('Annual')
    expect(tabs[1].text()).toContain('IDP')
  })

  it('shows loading state for course tab', () => {
    mockAdminFetchTrainings.mockReturnValue(new Promise(() => {})) // never resolves
    const wrapper = shallowMount(AdminTrainingView)
    expect(wrapper.findComponent({ name: 'AdminCourseTab' }).exists()).toBe(true)
  })

  it('renders EmptyState when no site visits on site tab', async () => {
    const wrapper = shallowMount(AdminTrainingView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    // Switch to site tab
    wrapper.vm.switchTab('site')
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.findComponent({ name: 'AdminSiteTab' }).exists()).toBe(true)
  })

  it('switches tabs and loads corresponding data', async () => {
    const wrapper = shallowMount(AdminTrainingView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    // Initial tab is 'annual'
    expect(wrapper.vm.activeTab).toBe('annual')

    // Switch to external
    mockAdminFetchTrainings.mockResolvedValue([
      { id: '1', title: 'External Course', category: 'external' },
    ])
    wrapper.vm.switchTab('external')
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.activeTab).toBe('external')
    expect(mockAdminFetchTrainings).toHaveBeenCalledWith('external')
  })

  it('opens add modal when + button clicked', async () => {
    const wrapper = shallowMount(AdminTrainingView, {
      global: {
        stubs: {
          AdminPageHeader: { template: '<div><slot /></div>' },
        },
      },
    })
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    // Open add form
    wrapper.vm.openAdd()
    expect(mockOpenModal).toHaveBeenCalledWith('admin-training-form')
  })
})
