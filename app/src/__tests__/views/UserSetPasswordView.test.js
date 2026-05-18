import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import UserSetPasswordView from '../../views/UserSetPasswordView.vue'
import { useUserAuthStore } from '../../core/stores/userAuth.js'

vi.mock('../../core/stores/userAuth.js', () => ({ useUserAuthStore: vi.fn() }))
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  useRoute: vi.fn(() => ({ query: { employeeId: 'EMP01' } })),
}))

describe('UserSetPasswordView', () => {
  let mockAuth

  beforeEach(() => {
    mockAuth = {
      error: '',
      isLoading: false,
      setPassword: vi.fn(),
    }

    useUserAuthStore.mockReturnValue(mockAuth)
  })

  function createWrapper() {
    return shallowMount(UserSetPasswordView)
  }

  it('renders the set password page', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('ตั้งรหัสผ่านครั้งแรก')
    expect(wrapper.text()).toContain('กรุณาตั้งรหัสผ่านส่วนตัวของคุณ')
  })

  it('pre-fills employee ID from route query', () => {
    const wrapper = createWrapper()
    const input = wrapper.find('input[type="text"]')
    expect(input.element.value).toBe('EMP01')
  })

  it('renders the new password field', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('รหัสผ่านใหม่')
    expect(wrapper.find('input[autocomplete="new-password"]').exists()).toBe(true)
  })

  it('renders the confirm password field', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('ยืนยันรหัสผ่าน')
  })

  it('renders the submit button', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('ตั้งรหัสผ่าน')
  })

  it('shows submit button disabled when fields are empty', () => {
    const wrapper = createWrapper()
    const btn = wrapper.find('button[type="submit"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('shows the back to login link', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('กลับหน้า Login')
  })

  it('shows success screen when done is set to true', async () => {
    const wrapper = createWrapper()
    await wrapper.setData({ done: true })
    expect(wrapper.text()).toContain('ตั้งรหัสผ่านสำเร็จ!')
    expect(wrapper.text()).toContain('กรุณา login ด้วยรหัสผ่านใหม่')
  })

  it('shows error message when auth.error is set', async () => {
    mockAuth.error = 'รหัสผ่านไม่ถูกต้อง'
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('รหัสผ่านไม่ถูกต้อง')
  })

  it('renders the employee ID label', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('รหัสพนักงาน')
  })
})
