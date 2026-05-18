import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import AdminLoginView from '../../../views/admin/AdminLoginView.vue'
import { useAdminStore } from '../../../core/stores/admin.js'

vi.mock('../../../core/stores/admin.js', () => ({ useAdminStore: vi.fn() }))
vi.mock('vue-router', () => ({ useRouter: vi.fn(() => ({ push: vi.fn() })) }))

describe('AdminLoginView', () => {
  let mockAdmin

  beforeEach(() => {
    mockAdmin = {
      error: '',
      isLoading: false,
      login: vi.fn(),
    }

    useAdminStore.mockReturnValue(mockAdmin)
  })

  function createWrapper() {
    return shallowMount(AdminLoginView)
  }

  it('renders the admin login page', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('DS Community')
    expect(wrapper.text()).toContain('Care · Admin Panel')
  })

  it('renders the username input', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Username')
    const input = wrapper.find('input[autocomplete="username"]')
    expect(input.exists()).toBe(true)
    expect(input.attributes('placeholder')).toBe('admin')
  })

  it('renders the password input', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Password')
    const input = wrapper.find('input[autocomplete="current-password"]')
    expect(input.exists()).toBe(true)
    expect(input.attributes('placeholder')).toBe('••••••')
  })

  it('renders the login button', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('เข้าสู่ระบบ')
  })

  it('shows loading text when admin.isLoading is true', async () => {
    mockAdmin.isLoading = true
    const wrapper = createWrapper()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('กำลังเข้าสู่ระบบ...')
  })

  it('shows error message when admin.error is set', async () => {
    mockAdmin.error = 'Invalid credentials'
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Invalid credentials')
  })

  it('renders the admin panel description', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('ระบบจัดการข้อมูล DS Community Care')
  })

  it('renders the version text', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Admin Panel v1.0')
  })

  it('has a submit button disabled when admin.isLoading is true', async () => {
    mockAdmin.isLoading = true
    const wrapper = createWrapper()
    await wrapper.vm.$nextTick()
    const btn = wrapper.find('button[type="submit"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })
})
