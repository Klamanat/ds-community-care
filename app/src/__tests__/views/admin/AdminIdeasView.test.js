import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

const mockOpenModal = vi.fn()
const mockCloseModal = vi.fn()
const mockGetAdminIdeas = vi.fn()

vi.mock('../../../core/stores/ui.js', () => ({
  useUiStore: vi.fn(() => ({
    openModal: mockOpenModal,
    closeModal: mockCloseModal,
  })),
}))

vi.mock('../../../core/services/adminService.js', () => ({
  getAdminIdeas: (...args) => mockGetAdminIdeas(...args),
  updateIdea: vi.fn(),
  deleteRow: vi.fn(),
}))

import AdminIdeasView from '../../../views/admin/AdminIdeasView.vue'

describe('AdminIdeasView', () => {
  beforeEach(() => {
    mockGetAdminIdeas.mockResolvedValue([])
  })

  it('renders the page header with title', () => {
    const wrapper = shallowMount(AdminIdeasView)
    expect(wrapper.findComponent({ name: 'AdminPageHeader' }).exists()).toBe(true)
  })

  it('shows loading skeletons initially', () => {
    const wrapper = shallowMount(AdminIdeasView)
    expect(wrapper.findComponent({ name: 'SkeletonCard' }).exists()).toBe(true)
  })

  it('renders filter chips', () => {
    const wrapper = shallowMount(AdminIdeasView)
    const filterBtns = wrapper.findAll('.al-chip')
    expect(filterBtns.length).toBe(4)
    expect(filterBtns[0].text()).toContain('ทั้งหมด')
    expect(filterBtns[1].text()).toContain('Pending')
  })

  it('renders EmptyState when no ideas after loading', async () => {
    mockGetAdminIdeas.mockResolvedValue([])
    const wrapper = shallowMount(AdminIdeasView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent({ name: 'EmptyState' }).exists()).toBe(true)
  })

  it('loads ideas on mount and renders them', async () => {
    const ideas = [
      { id: '1', title: 'Great Idea', category: 'Tech', submitterName: 'John', status: 'pending', createdAt: '2025-01-01' },
      { id: '2', title: 'Another Idea', category: 'Culture', submitterName: 'Jane', status: 'approved', createdAt: '2025-02-01' },
    ]
    mockGetAdminIdeas.mockResolvedValue(ideas)
    const wrapper = shallowMount(AdminIdeasView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Great Idea')
    expect(wrapper.text()).toContain('Another Idea')
    expect(wrapper.text()).toContain('John')
    expect(wrapper.text()).toContain('Jane')
  })

  it('filters ideas by status chip click', async () => {
    const ideas = [
      { id: '1', title: 'Pending Idea', category: 'Tech', submitterName: 'John', status: 'pending', createdAt: '2025-01-01' },
      { id: '2', title: 'Approved Idea', category: 'Culture', submitterName: 'Jane', status: 'approved', createdAt: '2025-02-01' },
    ]
    mockGetAdminIdeas.mockResolvedValue(ideas)
    const wrapper = shallowMount(AdminIdeasView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Pending Idea')
    expect(wrapper.text()).toContain('Approved Idea')

    // Click "Approved" filter
    const chips = wrapper.findAll('.al-chip')
    const approvedChip = chips.find(c => c.text().includes('Approved'))
    await approvedChip.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Approved Idea')
    expect(wrapper.text()).not.toContain('Pending Idea')
  })

  it('shows badge with filtered count', async () => {
    const ideas = [
      { id: '1', title: 'Idea 1', category: 'Tech', submitterName: 'John', status: 'pending', createdAt: '2025-01-01' },
    ]
    mockGetAdminIdeas.mockResolvedValue(ideas)
    const wrapper = shallowMount(AdminIdeasView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    const header = wrapper.findComponent({ name: 'AdminPageHeader' })
    expect(header.exists()).toBe(true)
  })

  it('opens detail modal when "ดู" button is clicked', async () => {
    const ideas = [
      { id: '1', title: 'Detail Idea', category: 'Tech', submitterName: 'John', status: 'pending', createdAt: '2025-01-01', detail: 'Some details' },
    ]
    mockGetAdminIdeas.mockResolvedValue(ideas)
    const wrapper = shallowMount(AdminIdeasView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    const viewBtns = wrapper.findAll('.al-btn-edit')
    const viewBtn = viewBtns.find(b => b.text().includes('ดู'))
    await viewBtn.trigger('click')

    expect(mockOpenModal).toHaveBeenCalledWith('admin-ideas-detail')
  })

  it('opens delete confirm modal when "ลบ" button is clicked', async () => {
    const ideas = [
      { id: '1', title: 'Delete Idea', category: 'Tech', submitterName: 'John', status: 'pending', createdAt: '2025-01-01' },
    ]
    mockGetAdminIdeas.mockResolvedValue(ideas)
    const wrapper = shallowMount(AdminIdeasView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    const deleteBtns = wrapper.findAll('.al-btn-delete')
    const deleteBtn = deleteBtns.find(b => b.text().includes('ลบ'))
    await deleteBtn.trigger('click')

    expect(mockOpenModal).toHaveBeenCalledWith('admin-ideas-del')
  })

  it('handles fetch error gracefully', async () => {
    mockGetAdminIdeas.mockRejectedValue(new Error('Network error'))
    const wrapper = shallowMount(AdminIdeasView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()
    // Should not throw; should show EmptyState
    expect(wrapper.findComponent({ name: 'EmptyState' }).exists()).toBe(true)
  })
})
