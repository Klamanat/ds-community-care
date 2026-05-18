import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import CultureModal from '../../../features/culture/CultureModal.vue'

const { mockUiStore } = vi.hoisted(() => ({
  mockUiStore: {
    closeModal: vi.fn(),
    activeModal: 'modal-culture',
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

describe('CultureModal', () => {
  beforeEach(() => {
    mockUiStore.closeModal = vi.fn()
    mockUiStore.activeModal = 'modal-culture'
  })

  function createWrapper() {
    return shallowMount(CultureModal, {
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

  it('renders FIRE header', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('FIRE')
    expect(wrapper.text()).toContain('ปลุกพลังสร้างสรรค์')
    expect(wrapper.text()).toContain('Digital Solutions Team Culture')
  })

  it('renders all four FIRE cards', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Flexible')
    expect(wrapper.text()).toContain('Impact')
    expect(wrapper.text()).toContain('Responsibility')
    expect(wrapper.text()).toContain('Excellence')
  })

  it('renders FIRE card descriptions', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('พลั้วไหว ไร้ขีดจำกัด')
    expect(wrapper.text()).toContain('ปล่อยของ เล็งที่เป้าหมาย')
    expect(wrapper.text()).toContain('เป็นบอสด้วยกัน รับผิดชอบเต็มร้อย')
    expect(wrapper.text()).toContain('ตำนานเหนือชั้น ทะลุมาตรฐาน')
  })

  it('renders core values', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('ทำงานเป็นทีม')
    expect(wrapper.text()).toContain('คิดสร้างสรรค์')
    expect(wrapper.text()).toContain('พัฒนาต่อเนื่อง')
    expect(wrapper.text()).toContain('ใส่ใจกัน')
  })

  it('renders innovation badge', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Innovation Driven')
    expect(wrapper.text()).toContain('DS Team')
  })
})
