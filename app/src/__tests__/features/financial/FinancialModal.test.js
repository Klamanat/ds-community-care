import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import FinancialModal from '../../../features/financial/FinancialModal.vue'

const { mockUiStore } = vi.hoisted(() => ({
  mockUiStore: {
    closeModal: vi.fn(),
    activeModal: 'modal-financial',
  },
}))

vi.mock('../../../core/stores/ui.js', () => ({
  useUiStore: vi.fn(() => mockUiStore),
}))

vi.mock('../../../shared/components/BaseModal.vue', () => ({
  default: {
    name: 'BaseModal',
    template: '<div><slot /></div>',
    props: ['modalId', 'sheetClass', 'padded'],
  },
}))

describe('FinancialModal', () => {
  beforeEach(() => {
    mockUiStore.closeModal = vi.fn()
    mockUiStore.activeModal = 'modal-financial'
  })

  function createWrapper() {
    return shallowMount(FinancialModal, {
      global: {
        stubs: {
          BaseModal: {
            name: 'BaseModal',
            template: '<div><slot /></div>',
            props: ['modalId', 'sheetClass', 'padded'],
          },
        },
      },
    })
  }

  it('renders the Financial Consultation header', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Financial Consultation')
    expect(wrapper.text()).toContain('ปรึกษาผู้เชี่ยวชาญด้านการเงิน')
  })

  it('shows topic selection', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('เลือกหัวข้อที่ต้องการปรึกษา')
    expect(wrapper.text()).toContain('การจัดการหนี้สิน')
    expect(wrapper.text()).toContain('การวางแผนและออมเงิน')
    expect(wrapper.text()).toContain('การวางแผนสินทรัพย์และการลงทุน')
    expect(wrapper.text()).toContain('ภาวะวิกฤตทางการเงิน')
  })

  it('shows textarea after selecting a topic', async () => {
    const wrapper = createWrapper()
    // Click the first topic
    const topics = wrapper.findAll('.fin-topic')
    await topics[0].trigger('click')
    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.text()).toContain('ส่งคำขอปรึกษา')
  })

  it('shows success state after sending request', async () => {
    const wrapper = createWrapper()
    // Select topic
    const topics = wrapper.findAll('.fin-topic')
    await topics[0].trigger('click')
    // Click send button
    const sendBtn = wrapper.findAll('button').find(b => b.text().includes('ส่งคำขอปรึกษา'))
    await sendBtn.trigger('click')
    expect(wrapper.text()).toContain('ส่งคำขอสำเร็จแล้วค่ะ')
    expect(wrapper.text()).toContain('ที่ปรึกษาจะติดต่อกลับภายใน 10 วันทำการ')
  })

  it('renders anonymous info badge', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Anonymous 100%')
    expect(wrapper.text()).toContain('5 เคส/ปี')
    expect(wrapper.text()).toContain('Follow up 3 ครั้ง')
  })
})
