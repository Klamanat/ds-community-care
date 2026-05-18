import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import HomeView from '../../views/HomeView.vue'

// Mock IntersectionObserver used by useFadeIn
vi.stubGlobal('IntersectionObserver', vi.fn(() => ({ observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() })))

vi.mock('vue-router', () => ({ useRouter: vi.fn(() => ({ push: vi.fn() })) }))
vi.mock('../../core/stores/ui.js', () => ({
  useUiStore: vi.fn(() => ({
    openModal: vi.fn(),
    showToast: vi.fn(),
    openMonthModal: vi.fn(),
  })),
}))
vi.mock('../../core/stores/userAuth.js', () => ({
  useUserAuthStore: vi.fn(() => ({
    userName: 'Alice',
    userImgUrl: '',
    userId: '42',
  })),
}))
vi.mock('../../core/stores/cardConfig.js', () => ({
  useCardConfigStore: vi.fn(() => ({
    isEnabled: vi.fn(() => true),
    getBg: vi.fn(() => 'linear-gradient(135deg, #667EEA, #764BA2)'),
  })),
}))
vi.mock('../../features/birthday/birthday.store.js', () => ({
  useBirthdayStore: vi.fn(() => ({
    allEmployees: { 4: [{ key: 'emp1', name: 'Bob', role: 'Dev', date: '15 May', wishes: [], photo: '', fallbackIdx: 0 }] },
    getFallbackBg: vi.fn(() => 'linear-gradient(135deg, #667EEA, #764BA2)'),
    getFallbackEmoji: vi.fn(() => '😊'),
    loadMonth: vi.fn(),
  })),
}))

describe('HomeView', () => {
  function createWrapper() {
    return shallowMount(HomeView)
  }

  it('renders the greeting section', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Alice')
  })

  it('renders the birthday section', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Birthday Celebration')
  })

  it('renders the consult service section', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Consult Service')
  })

  it('renders the Other tools section', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Other')
    expect(wrapper.text()).toContain('Monthly Plan')
    expect(wrapper.text()).toContain('เสนอไอเดีย')
  })

  it('renders the Empathy Board section', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Empathy Board')
  })

  it('renders the Activities section', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Activities')
  })

  it('renders child components', () => {
    const wrapper = createWrapper()
    expect(wrapper.findComponent({ name: 'ConsultCards' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'MonthsGrid' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'EmpathyBoard' }).exists()).toBe(true)
  })
})
