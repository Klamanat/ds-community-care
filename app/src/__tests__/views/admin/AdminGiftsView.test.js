import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'

const mockShowToast = vi.fn()
const mockOpenModal = vi.fn()
const mockCloseModal = vi.fn()
const mockFetchGifts = vi.fn()
const mockFetchGiftClaims = vi.fn()

vi.mock('../../../features/gifts/giftService.js', () => ({
  fetchGifts: (...args) => mockFetchGifts(...args),
  fetchGiftClaims: (...args) => mockFetchGiftClaims(...args),
  adminAddGift: vi.fn(),
  adminUpdateGift: vi.fn(),
  adminDeleteGift: vi.fn(),
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
  uploadImage: vi.fn(),
  deleteImage: vi.fn(),
}))

import AdminGiftsView from '../../../views/admin/AdminGiftsView.vue'

describe('AdminGiftsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchGifts.mockResolvedValue([])
    mockFetchGiftClaims.mockResolvedValue([])
  })

  it('renders the page header with title', () => {
    const wrapper = shallowMount(AdminGiftsView)
    expect(wrapper.findComponent({ name: 'AdminPageHeader' }).exists()).toBe(true)
    expect(wrapper.text()).toContain('ของขวัญ')
  })

  it('shows gifts tab by default', () => {
    const wrapper = shallowMount(AdminGiftsView)
    expect(wrapper.vm.tab).toBe('gifts')
  })

  it('shows loading skeletons initially', () => {
    const wrapper = shallowMount(AdminGiftsView)
    expect(wrapper.findComponent({ name: 'SkeletonCard' }).exists()).toBe(true)
  })

  it('shows EmptyState when no gifts after load', async () => {
    const wrapper = shallowMount(AdminGiftsView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent({ name: 'EmptyState' }).exists()).toBe(true)
  })

  it('renders gifts after load', async () => {
    mockFetchGifts.mockResolvedValue([
      { id: 'g1', name: 'กระเป๋าผ้า DS', description: 'กระเป๋าผ้าสวย', icon: '🎁', category: 'เครื่องใช้', price: 200, quantity: 10, status: 'available', imgUrl: '', imgId: '' },
      { id: 'g2', name: 'แก้วน้ำ', description: 'แก้วน้ำโลโก้ DS', icon: '🎀', category: 'อุปกรณ์สำนักงาน', price: 150, quantity: null, status: 'unavailable', imgUrl: '', imgId: '' },
    ])

    const wrapper = shallowMount(AdminGiftsView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('กระเป๋าผ้า DS')
    expect(wrapper.text()).toContain('แก้วน้ำ')
    expect(wrapper.text()).toContain('฿200')
    expect(wrapper.text()).toContain('฿150')
    expect(wrapper.text()).toContain('คงเหลือ 10')
    expect(wrapper.text()).toContain('ไม่จำกัด')
    expect(wrapper.text()).toContain('พร้อมแจก')
  })

  it('calls fetchGifts on mount', () => {
    shallowMount(AdminGiftsView)
    expect(mockFetchGifts).toHaveBeenCalled()
  })

  it('opens add modal when + เพิ่มของขวัญ is clicked', () => {
    const wrapper = shallowMount(AdminGiftsView)
    wrapper.vm.openAdd()
    expect(mockOpenModal).toHaveBeenCalledWith('admin-gifts-form')
  })

  it('opens edit modal for a gift', () => {
    const wrapper = shallowMount(AdminGiftsView)
    const gift = { id: 'g1', name: 'กระเป๋า', description: 'ดี', icon: '🎁', category: 'เครื่องใช้', price: 200, quantity: 10, status: 'available', imgUrl: '', imgId: '' }
    wrapper.vm.openEdit(gift)
    expect(mockOpenModal).toHaveBeenCalledWith('admin-gifts-form')
  })

  it('opens delete confirm modal', () => {
    const wrapper = shallowMount(AdminGiftsView)
    const gift = { id: 'g1', name: 'กระเป๋า', description: 'ดี', icon: '🎁', category: 'เครื่องใช้', price: 200, quantity: 10, status: 'available', imgUrl: '', imgId: '' }
    wrapper.vm.confirmDelete(gift)
    expect(mockOpenModal).toHaveBeenCalledWith('admin-gifts-del')
  })

  describe('claims tab', () => {
    it('switches to claims tab and loads claims', async () => {
      mockFetchGiftClaims.mockResolvedValue([
        { id: 'c1', employee_name: 'สมชาย', employee_id: 'EMP001', gift_name: 'กระเป๋าผ้า DS', claimed_year: 2026, claimed_at: '2026-05-15T00:00:00Z' },
        { id: 'c2', employee_name: 'สมหญิง', employee_id: 'EMP002', gift_name: 'แก้วน้ำ', claimed_year: 2026, claimed_at: '2026-05-10T00:00:00Z' },
      ])

      const wrapper = shallowMount(AdminGiftsView)
      await new Promise(r => setTimeout(r, 0))
      await wrapper.vm.$nextTick()

      await wrapper.vm.switchClaims()
      await new Promise(r => setTimeout(r, 0))
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.tab).toBe('claims')
      expect(wrapper.text()).toContain('สมชาย')
      expect(wrapper.text()).toContain('สมหญิง')
      expect(wrapper.text()).toContain('กระเป๋าผ้า DS')
    })

    it('shows claims count badge in tab button', async () => {
      mockFetchGiftClaims.mockResolvedValue([
        { id: 'c1', employee_name: 'สมชาย', gift_name: 'กระเป๋า', claimed_year: 2026, claimed_at: '2026-05-15T00:00:00Z' },
      ])

      const wrapper = shallowMount(AdminGiftsView)
      await new Promise(r => setTimeout(r, 0))
      await wrapper.vm.$nextTick()

      await wrapper.vm.switchClaims()
      await new Promise(r => setTimeout(r, 0))
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('1 รายการ')
    })

    it('shows EmptyState when no claims', async () => {
      const wrapper = shallowMount(AdminGiftsView)
      await new Promise(r => setTimeout(r, 0))
      await wrapper.vm.$nextTick()

      await wrapper.vm.switchClaims()
      await new Promise(r => setTimeout(r, 0))
      await wrapper.vm.$nextTick()

      expect(wrapper.findComponent({ name: 'EmptyState' }).exists()).toBe(true)
    })

    it('shows claims loading skeletons when switching', async () => {
      // Don't resolve immediately to show loading state
      mockFetchGiftClaims.mockImplementation(() => new Promise(r => setTimeout(r, 100)))

      const wrapper = shallowMount(AdminGiftsView)
      await new Promise(r => setTimeout(r, 0))
      await wrapper.vm.$nextTick()

      wrapper.vm.switchClaims()
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.claimsLoading).toBe(true)
    })

    it('does not refetch claims if already loaded', async () => {
      mockFetchGiftClaims.mockResolvedValue([
        { id: 'c1', employee_name: 'สมชาย', gift_name: 'กระเป๋า', claimed_year: 2026, claimed_at: '2026-05-15T00:00:00Z' },
      ])

      const wrapper = shallowMount(AdminGiftsView)
      await new Promise(r => setTimeout(r, 0))
      await wrapper.vm.$nextTick()

      // First switch
      await wrapper.vm.switchClaims()
      await new Promise(r => setTimeout(r, 0))
      await wrapper.vm.$nextTick()
      expect(mockFetchGiftClaims).toHaveBeenCalledTimes(1)

      // Second switch – should not call again
      mockFetchGiftClaims.mockClear()
      wrapper.vm.switchClaims()
      await wrapper.vm.$nextTick()
      expect(mockFetchGiftClaims).not.toHaveBeenCalled()
    })
  })

  it('shows gifts tab button with active state', () => {
    const wrapper = shallowMount(AdminGiftsView)
    const tabButtons = wrapper.findAll('.gtab-btn')
    expect(tabButtons.length).toBe(2)
    expect(tabButtons[0].text()).toContain('รายการของขวัญ')
    expect(tabButtons[1].text()).toContain('รายการที่ได้รับ')
  })
})
