import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import UserLoginView from '../../views/UserLoginView.vue'
import { useUserAuthStore } from '../../core/stores/userAuth.js'

vi.mock('../../core/stores/userAuth.js', () => ({ useUserAuthStore: vi.fn() }))
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), currentRoute: { value: { query: {} } } })),
  useRoute: vi.fn(() => ({})),
}))

describe('UserLoginView', () => {
  let mockAuth

  beforeEach(() => {
    mockAuth = {
      error: '',
      isLoading: false,
      checkEmployee: vi.fn(),
      loginWithEmployee: vi.fn(),
      setPasscode: vi.fn(),
    }

    useUserAuthStore.mockReturnValue(mockAuth)
  })

  function createWrapper() {
    return shallowMount(UserLoginView)
  }

  it('renders the login form with employee code input', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.ul-card').exists()).toBe(true)
    expect(wrapper.text()).toContain('รหัสพนักงาน')
  })

  it('shows the employee code input field', () => {
    const wrapper = createWrapper()
    const input = wrapper.find('input[type="text"]')
    expect(input.exists()).toBe(true)
    expect(input.attributes('placeholder')).toContain('11XXXXXX')
  })

  it('shows the next button on step 1', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('ถัดไป')
  })

  it('shows the submit button disabled when employee id is empty', () => {
    const wrapper = createWrapper()
    const btn = wrapper.find('button[type="submit"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('shows passcode form after stepping to login step', async () => {
    const wrapper = createWrapper()
    // Simulate step change to 'login'
    await wrapper.setData({ step: 'login', employeeId: 'EMP01' })
    expect(wrapper.text()).toContain('รหัสผ่าน')
    expect(wrapper.find('input[autocomplete="current-password"]').exists()).toBe(true)
  })

  it('shows setup form when stepping to setup step', async () => {
    const wrapper = createWrapper()
    await wrapper.setData({ step: 'setup', employeeId: 'EMP01' })
    expect(wrapper.text()).toContain('ตั้งรหัสผ่านใหม่')
    expect(wrapper.text()).toContain('ยืนยันรหัสผ่าน')
  })

  it('shows employee badge after step 1', async () => {
    const wrapper = createWrapper()
    await wrapper.setData({ step: 'login', employeeId: 'EMP01' })
    expect(wrapper.text()).toContain('EMP01')
  })

  it('shows error message when auth.error is set', async () => {
    mockAuth.error = 'รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง'
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง')
  })

  it('renders the DS Community Care logo text', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('DS Community Care')
  })

  it('renders the app version text', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('v1.0')
  })
})
