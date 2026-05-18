import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'

const mockShowToast = vi.fn()
const mockOpenModal = vi.fn()
const mockCloseModal = vi.fn()
const mockAdminFetchRewards = vi.fn()

vi.mock('../../../core/stores/ui.js', () => ({
  useUiStore: vi.fn(() => ({
    showToast: mockShowToast,
    openModal: mockOpenModal,
    closeModal: mockCloseModal,
  })),
}))

vi.mock('../../../features/rewards/rewardService.js', () => ({
  adminFetchRewards: (...args) => mockAdminFetchRewards(...args),
  adminAddReward: vi.fn(),
  adminUpdateReward: vi.fn(),
  adminDeleteReward: vi.fn(),
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
  uploadImage: vi.fn(),
  deleteImage: vi.fn(),
}))

import AdminRewardsView from '../../../views/admin/AdminRewardsView.vue'

describe('AdminRewardsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAdminFetchRewards.mockResolvedValue([])
  })

  it('renders the page header with title', () => {
    const wrapper = shallowMount(AdminRewardsView)
    expect(wrapper.findComponent({ name: 'AdminPageHeader' }).exists()).toBe(true)
    expect(wrapper.text()).toContain('ของรางวัล')
  })

  it('shows loading skeletons initially', () => {
    const wrapper = shallowMount(AdminRewardsView)
    expect(wrapper.findComponent({ name: 'SkeletonCard' }).exists()).toBe(true)
  })

  it('shows EmptyState when no rewards after load', async () => {
    const wrapper = shallowMount(AdminRewardsView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent({ name: 'EmptyState' }).exists()).toBe(true)
  })

  it('renders rewards after load', async () => {
    mockAdminFetchRewards.mockResolvedValue([
      { id: 'rw1', name: 'กระเป๋า DS', description: 'กระเป๋าสุดเท่', ptsCost: 500, stock: 10, active: true, imageUrl: '', imageId: '' },
      { id: 'rw2', name: 'แก้วน้ำ', description: 'แก้วน้ำสแตนเลส', ptsCost: 200, stock: null, active: true, imageUrl: '', imageId: '' },
    ])

    const wrapper = shallowMount(AdminRewardsView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('กระเป๋า DS')
    expect(wrapper.text()).toContain('แก้วน้ำ')
    expect(wrapper.text()).toContain('500 pts')
    expect(wrapper.text()).toContain('200 pts')
    expect(wrapper.text()).toContain('คงเหลือ 10')
    expect(wrapper.text()).toContain('ไม่จำกัด')
  })

  it('shows active badge for rewards', async () => {
    mockAdminFetchRewards.mockResolvedValue([
      { id: 'rw1', name: 'เปิด', description: '', ptsCost: 100, stock: null, active: true, imageUrl: '', imageId: '' },
      { id: 'rw2', name: 'ปิด', description: '', ptsCost: 50, stock: null, active: false, imageUrl: '', imageId: '' },
    ])

    const wrapper = shallowMount(AdminRewardsView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('เปิด')
    expect(wrapper.text()).toContain('ปิด')
  })

  it('calls adminFetchRewards on mount', () => {
    shallowMount(AdminRewardsView)
    expect(mockAdminFetchRewards).toHaveBeenCalled()
  })

  it('opens add modal when + เพิ่มของรางวัล is clicked', () => {
    const wrapper = shallowMount(AdminRewardsView)
    wrapper.vm.openAdd()
    expect(mockOpenModal).toHaveBeenCalledWith('admin-rewards-form')
  })

  it('opens edit modal for a reward', () => {
    const wrapper = shallowMount(AdminRewardsView)
    const reward = { id: 'rw1', name: 'กระเป๋า', description: 'ดี', ptsCost: 500, stock: 10, active: true, imageUrl: '', imageId: '' }
    wrapper.vm.openEdit(reward)
    expect(mockOpenModal).toHaveBeenCalledWith('admin-rewards-form')
  })

  it('opens delete confirm modal', () => {
    const wrapper = shallowMount(AdminRewardsView)
    const reward = { id: 'rw1', name: 'กระเป๋า', description: 'ดี', ptsCost: 500, stock: 10, active: true, imageUrl: '', imageId: '' }
    wrapper.vm.confirmDelete(reward)
    expect(mockOpenModal).toHaveBeenCalledWith('admin-rewards-del')
  })

  it('shows the card header title', () => {
    const wrapper = shallowMount(AdminRewardsView)
    expect(wrapper.text()).toContain('รายการของรางวัล')
  })
})
