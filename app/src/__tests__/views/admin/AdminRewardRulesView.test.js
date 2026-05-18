import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'

const mockShowToast = vi.fn()
const mockOpenModal = vi.fn()
const mockCloseModal = vi.fn()
const mockLoadRules = vi.fn()
const mockRules = []

vi.mock('../../../core/stores/ui.js', () => ({
  useUiStore: vi.fn(() => ({
    showToast: mockShowToast,
    openModal: mockOpenModal,
    closeModal: mockCloseModal,
  })),
}))

vi.mock('../../../features/rewards/reward.store.js', () => ({
  useRewardStore: vi.fn(() => ({
    rules: mockRules,
    loadRules: mockLoadRules,
  })),
}))

vi.mock('../../../features/rewards/rewardService.js', () => ({
  adminAddRewardRule: vi.fn(),
  adminUpdateRewardRule: vi.fn(),
  adminDeleteRewardRule: vi.fn(),
}))

vi.mock('../../../core/composables/useRipple.js', () => ({
  useRipple: vi.fn(() => ({ handleRippleClick: vi.fn() })),
}))

vi.mock('../../../core/composables/useFadeIn.js', () => ({
  useFadeIn: vi.fn(),
}))

import AdminRewardRulesView from '../../../views/admin/AdminRewardRulesView.vue'

describe('AdminRewardRulesView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLoadRules.mockResolvedValue(undefined)
    mockRules.length = 0
  })

  it('renders the page header', () => {
    const wrapper = shallowMount(AdminRewardRulesView)
    expect(wrapper.findComponent({ name: 'AdminPageHeader' }).exists()).toBe(true)
  })

  it('shows the card header title กฎการสะสมคะแนน', () => {
    const wrapper = shallowMount(AdminRewardRulesView)
    expect(wrapper.text()).toContain('กฎการสะสมคะแนน')
  })

  it('shows loading skeletons initially', () => {
    const wrapper = shallowMount(AdminRewardRulesView)
    expect(wrapper.findComponent({ name: 'SkeletonCard' }).exists()).toBe(true)
  })

  it('shows EmptyState when no rules after load', async () => {
    const wrapper = shallowMount(AdminRewardRulesView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent({ name: 'EmptyState' }).exists()).toBe(true)
  })

  it('renders rules after load', async () => {
    const rules = [
      { id: 'r1', name: 'เข้าร่วมกิจกรรม', desc: 'เข้าร่วมกิจกรรมที่จัด', pts: '10', type: 'join_activity', subtype: '', icon: '🙌', color: '#6366F1', active: 'true' },
      { id: 'r2', name: 'Check-in รายวัน', desc: 'Check-in ทุกวัน', pts: '5', type: 'daily_checkin', subtype: '', icon: '📅', color: '#06C755', active: 'true' },
      { id: 'r3', name: 'ปิดใช้งานแล้ว', desc: 'กฎที่ปิด', pts: '1', type: 'send_empathy', subtype: '', icon: '💌', color: '#EC4899', active: 'false' },
    ]
    // Populate the shared array before mount
    mockRules.push(...rules)
    mockLoadRules.mockImplementation(async () => {
      // store loads into itself; we already pre-set mockRules
    })

    const wrapper = shallowMount(AdminRewardRulesView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('เข้าร่วมกิจกรรม')
    expect(wrapper.text()).toContain('Check-in รายวัน')
    expect(wrapper.text()).toContain('ปิดใช้งานแล้ว')
    // Badge shows count of rules
    expect(wrapper.text()).toContain('3 รายการ')
  })

  it('shows correct badge status for active/inactive rules', async () => {
    const rules = [
      { id: 'r1', name: 'เปิด', desc: '', pts: '10', type: 'join_activity', subtype: '', icon: '🙌', color: '#6366F1', active: 'true' },
      { id: 'r2', name: 'ปิด', desc: '', pts: '5', type: 'send_empathy', subtype: '', icon: '💌', color: '#EC4899', active: 'false' },
    ]
    mockRules.push(...rules)

    const wrapper = shallowMount(AdminRewardRulesView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('เปิด')
    expect(wrapper.text()).toContain('ปิด')
  })

  it('shows pts and type badges for each rule', async () => {
    const rules = [
      { id: 'r1', name: 'กิจกรรม', desc: '', pts: '10', type: 'join_activity', subtype: '', icon: '🙌', color: '#6366F1', active: 'true' },
    ]
    mockRules.push(...rules)

    const wrapper = shallowMount(AdminRewardRulesView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('+10 pts')
    expect(wrapper.text()).toContain('join_activity')
  })

  it('opens add modal when + เพิ่มกฎ is clicked', async () => {
    const wrapper = shallowMount(AdminRewardRulesView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    wrapper.vm.openAdd()
    expect(mockOpenModal).toHaveBeenCalledWith('admin-rules-form')
  })

  it('opens edit modal for a rule', async () => {
    const rules = [
      { id: 'r1', name: 'กิจกรรม', desc: '', pts: '10', type: 'join_activity', subtype: '', icon: '🙌', color: '#6366F1', active: 'true' },
    ]
    mockRules.push(...rules)

    const wrapper = shallowMount(AdminRewardRulesView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    wrapper.vm.openEdit(rules[0])
    expect(mockOpenModal).toHaveBeenCalledWith('admin-rules-form')
  })

  it('opens delete confirm modal', async () => {
    const rules = [
      { id: 'r1', name: 'กิจกรรม', desc: '', pts: '10', type: 'join_activity', subtype: '', icon: '🙌', color: '#6366F1', active: 'true' },
    ]
    mockRules.push(...rules)

    const wrapper = shallowMount(AdminRewardRulesView)
    await new Promise(r => setTimeout(r, 0))
    await wrapper.vm.$nextTick()

    wrapper.vm.confirmDelete(rules[0])
    expect(mockOpenModal).toHaveBeenCalledWith('admin-rules-del')
  })

  it('shows info box with notes', () => {
    const wrapper = shallowMount(AdminRewardRulesView)
    expect(wrapper.text()).toContain('type + subtype ต้องไม่ซ้ำกัน')
  })

  it('calls reward.loadRules on mount', () => {
    shallowMount(AdminRewardRulesView)
    expect(mockLoadRules).toHaveBeenCalledWith(true)
  })
})
