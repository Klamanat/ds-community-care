import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import CultureView from '../../views/CultureView.vue'

describe('CultureView', () => {
  function createWrapper() {
    return shallowMount(CultureView)
  }

  it('renders the FIRE hero section', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('FIRE')
    expect(wrapper.text()).toContain('ปลุกพลังสร้างสรรค์')
    expect(wrapper.text()).toContain('Digital Solutions Team Culture')
  })

  it('renders all 4 FIRE cards', () => {
    const wrapper = createWrapper()
    const cards = wrapper.findAll('.fire-card')
    expect(cards).toHaveLength(4)
  })

  it('renders the Flexible (F) card', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Flexible')
    expect(wrapper.text()).toContain('พลั้วไหว ไร้ขีดจำกัด')
  })

  it('renders the Impact (I) card', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Impact')
    expect(wrapper.text()).toContain('ปล่อยของ เล็งที่เป้าหมาย')
  })

  it('renders the Responsibility (R) card', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Responsibility')
    expect(wrapper.text()).toContain('เป็นบอสด้วยกัน รับผิดชอบเต็มร้อย')
  })

  it('renders the Excellence (E) card', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Excellence')
    expect(wrapper.text()).toContain('ตำนานเหนือชั้น ทะลุมาตรฐาน')
  })

  it('renders the innovation badge', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Innovation Driven')
  })

  it('renders core values section', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Our Core Values')
  })

  it('renders all 4 core values', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('ทำงานเป็นทีม')
    expect(wrapper.text()).toContain('คิดสร้างสรรค์')
    expect(wrapper.text()).toContain('พัฒนาต่อเนื่อง')
    expect(wrapper.text()).toContain('ใส่ใจกัน')
  })

  it('renders core value English labels', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Team First')
    expect(wrapper.text()).toContain('Creative Thinking')
    expect(wrapper.text()).toContain('Continuous Growth')
    expect(wrapper.text()).toContain('Care & Support')
  })
})
