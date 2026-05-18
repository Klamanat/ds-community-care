import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

const mockOpenModal = vi.fn()
const mockCloseModal = vi.fn()
const mockGetEmpathyChannels = vi.fn()
const mockDeleteChannel = vi.fn()
const mockGetAll = vi.fn()
const mockGetEmployees = vi.fn()

vi.mock('../../../core/stores/ui.js', () => ({
  useUiStore: vi.fn(() => ({
    openModal: mockOpenModal,
    closeModal: mockCloseModal,
  })),
}))

vi.mock('../../../core/services/adminService.js', () => ({
  getEmpathyChannels: (...args) => mockGetEmpathyChannels(...args),
  deleteChannel: (...args) => mockDeleteChannel(...args),
  getAll: (...args) => mockGetAll(...args),
  getEmployees: (...args) => mockGetEmployees(...args),
}))

import AdminEmpathyView from '../../../views/admin/AdminEmpathyView.vue'

describe('AdminEmpathyView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAll.mockResolvedValue([])
    mockGetEmployees.mockResolvedValue([])
  })

  it('renders the page header with title', () => {
    const wrapper = shallowMount(AdminEmpathyView)
    expect(wrapper.findComponent({ name: 'AdminPageHeader' }).exists()).toBe(true)
  })

  it('shows loading skeletons initially', () => {
    const wrapper = shallowMount(AdminEmpathyView)
    expect(wrapper.findComponent({ name: 'SkeletonCard' }).exists()).toBe(true)
  })

  it('renders EmptyState when no channels after loading', async () => {
    mockGetAll.mockResolvedValue([])
    mockGetEmployees.mockResolvedValue([])
    const wrapper = shallowMount(AdminEmpathyView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent({ name: 'EmptyState' }).exists()).toBe(true)
  })

  it('loads and displays empathy channels', async () => {
    mockGetAll.mockImplementation((table) => {
      if (table === 'EmpathyComments') return Promise.resolve([
        { post_id: 'ch1', text: 'Great work!' },
        { post_id: 'ch1', text: 'Thanks!' },
        { post_id: 'ch2', text: 'Awesome!' },
      ])
      if (table === 'ChannelLikes') return Promise.resolve([
        { channel_id: 'ch1' },
      ])
      if (table === 'EmpathyPhotos') return Promise.resolve([])
      return Promise.resolve([])
    })
    mockGetEmployees.mockResolvedValue([
      { empCode: 'ch1', name: 'John Doe', role: 'Developer' },
      { empCode: 'ch2', name: 'Jane Smith', role: 'Designer' },
    ])

    const wrapper = shallowMount(AdminEmpathyView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('John Doe')
    expect(wrapper.text()).toContain('Jane Smith')
  })

  it('shows kudos count and likes count', async () => {
    mockGetAll.mockImplementation((table) => {
      if (table === 'EmpathyComments') return Promise.resolve([
        { post_id: 'ch1', text: 'A' },
        { post_id: 'ch1', text: 'B' },
        { post_id: 'ch1', text: 'C' },
      ])
      if (table === 'ChannelLikes') return Promise.resolve([
        { channel_id: 'ch1' },
        { channel_id: 'ch1' },
      ])
      if (table === 'EmpathyPhotos') return Promise.resolve([])
      return Promise.resolve([])
    })
    mockGetEmployees.mockResolvedValue([
      { empCode: 'ch1', name: 'John Doe', role: 'Developer' },
    ])

    const wrapper = shallowMount(AdminEmpathyView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('💬 3')
    expect(wrapper.text()).toContain('❤️ 2')
  })

  it('opens delete confirm modal when "ลบ" button is clicked', async () => {
    mockGetAll.mockImplementation((table) => {
      if (table === 'EmpathyComments') return Promise.resolve([
        { post_id: 'ch1', text: 'Test' },
      ])
      if (table === 'ChannelLikes') return Promise.resolve([])
      if (table === 'EmpathyPhotos') return Promise.resolve([])
      return Promise.resolve([])
    })
    mockGetEmployees.mockResolvedValue([
      { empCode: 'ch1', name: 'John Doe', role: 'Developer' },
    ])

    const wrapper = shallowMount(AdminEmpathyView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    const deleteBtns = wrapper.findAll('.al-btn-delete')
    await deleteBtns[0].trigger('click')

    expect(mockOpenModal).toHaveBeenCalledWith('admin-empathy-del')
  })

  it('handles fetch error gracefully', async () => {
    mockGetAll.mockRejectedValue(new Error('API Error'))
    mockGetEmployees.mockRejectedValue(new Error('API Error'))
    const wrapper = shallowMount(AdminEmpathyView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()
    // Should not throw; should show EmptyState
    expect(wrapper.findComponent({ name: 'EmptyState' }).exists()).toBe(true)
  })

  it('sorts channels by count descending', async () => {
    mockGetAll.mockImplementation((table) => {
      if (table === 'EmpathyComments') return Promise.resolve([
        { post_id: 'ch1', text: 'A' },
        { post_id: 'ch1', text: 'B' },
        { post_id: 'ch1', text: 'C' },
        { post_id: 'ch1', text: 'D' },
        { post_id: 'ch2', text: 'E' },
        { post_id: 'ch3', text: 'F' },
      ])
      if (table === 'ChannelLikes') return Promise.resolve([])
      if (table === 'EmpathyPhotos') return Promise.resolve([])
      return Promise.resolve([])
    })
    mockGetEmployees.mockResolvedValue([
      { empCode: 'ch1', name: 'Most Active', role: '' },
      { empCode: 'ch2', name: 'Medium', role: '' },
      { empCode: 'ch3', name: 'Least', role: '' },
    ])

    const wrapper = shallowMount(AdminEmpathyView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    const titles = wrapper.findAll('.al-item-title')
    expect(titles[0].text()).toBe('Most Active')
  })

  it('renders the delete warning message', async () => {
    mockGetAll.mockImplementation((table) => {
      if (table === 'EmpathyComments') return Promise.resolve([
        { post_id: 'ch1', text: 'A' },
      ])
      if (table === 'ChannelLikes') return Promise.resolve([])
      if (table === 'EmpathyPhotos') return Promise.resolve([])
      return Promise.resolve([])
    })
    mockGetEmployees.mockResolvedValue([
      { empCode: 'ch1', name: 'John', role: '' },
    ])

    const wrapper = shallowMount(AdminEmpathyView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    const deleteBtns = wrapper.findAll('.al-btn-delete')
    await deleteBtns[0].trigger('click')

    expect(mockOpenModal).toHaveBeenCalledWith('admin-empathy-del')
  })
})
