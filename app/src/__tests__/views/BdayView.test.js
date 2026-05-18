import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import BdayView from '../../views/BdayView.vue'

vi.mock('../../core/stores/ui.js', () => ({ useUiStore: vi.fn(() => ({ currentUser: { name: 'Alice' }, openModal: vi.fn() })) }))
vi.mock('../../features/birthday/birthday.store.js', () => ({
  useBirthdayStore: vi.fn(() => ({
    allEmployees: {
      4: [{ key: 'emp1', name: 'Test Employee', role: 'Developer', date: '15 May', wishes: [], photo: '', fallbackIdx: 0 }],
    },
    isLoading: false,
    getFallbackBg: vi.fn(() => 'linear-gradient(135deg, #667EEA, #764BA2)'),
    getFallbackEmoji: vi.fn(() => '😊'),
    getSenderAvatar: vi.fn(() => ({ bg: '#667EEA', av: '😊' })),
    sendWish: vi.fn(),
    loadMonth: vi.fn(),
  })),
}))

describe('BdayView', () => {
  function createWrapper() {
    return shallowMount(BdayView)
  }

  it('renders the Birthday header', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Birthday Celebration')
    expect(wrapper.text()).toContain('Digital Solutions Team')
  })

  it('renders tab buttons', () => {
    const wrapper = createWrapper()
    const buttons = wrapper.findAll('button')
    const buttonTexts = buttons.map(b => b.text())
    expect(buttonTexts.some(t => t.includes('Birthday Board'))).toBe(true)
    expect(buttonTexts.some(t => t.includes('Surprise Box'))).toBe(true)
  })

  it('renders month selector', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('ม.ค.')
    expect(wrapper.text()).toContain('ธ.ค.')
  })

  it('renders Surprise Box tab content', async () => {
    const wrapper = createWrapper()
    // Click the Surprise Box tab
    const buttons = wrapper.findAll('button')
    const surpriseBtn = buttons.find(b => b.text().includes('Surprise Box'))
    if (surpriseBtn) {
      await surpriseBtn.trigger('click')
    }
    expect(wrapper.text()).toContain('Surprise Box')
    expect(wrapper.text()).toContain('Birthday Cake')
    expect(wrapper.text()).toContain('Gift Voucher')
    expect(wrapper.text()).toContain('Day Off')
  })
})
