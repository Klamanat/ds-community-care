import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import SettingsView from '../../views/SettingsView.vue'
import { useUiStore } from '../../core/stores/ui.js'
import { useUserAuthStore } from '../../core/stores/userAuth.js'

vi.mock('../../core/stores/ui.js', () => ({ useUiStore: vi.fn() }))
vi.mock('../../core/stores/userAuth.js', () => ({ useUserAuthStore: vi.fn() }))
vi.mock('vue-router', () => ({ useRouter: vi.fn(() => ({ push: vi.fn() })) }))

describe('SettingsView', () => {
  let mockUi
  let mockUserAuth

  beforeEach(() => {
    mockUi = {
      currentUser: { name: 'John Doe', role: 'Developer', img: '', emoji: '😊' },
      openModal: vi.fn(),
      showToast: vi.fn(),
    }
    mockUserAuth = {
      logout: vi.fn(),
    }

    useUiStore.mockReturnValue(mockUi)
    useUserAuthStore.mockReturnValue(mockUserAuth)
  })

  function createWrapper() {
    return shallowMount(SettingsView)
  }

  it('renders the profile card with user name', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('John Doe')
  })

  it('renders the profile card with user role', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Developer')
  })

  it('renders the account section', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('บัญชีผู้ใช้')
  })

  it('renders the notifications section', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('การแจ้งเตือน')
  })

  it('renders the privacy section', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('ความเป็นส่วนตัว')
  })

  it('renders the general section', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('ทั่วไป')
  })

  it('renders notification toggles', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Push Notification')
    expect(wrapper.text()).toContain('แจ้งเตือนวันเกิด')
    expect(wrapper.text()).toContain('Community Empathy')
    expect(wrapper.text()).toContain('กิจกรรมใหม่')
  })

  it('renders the logout button', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('ออกจากระบบ')
    expect(wrapper.text()).toContain('Sign out จากอุปกรณ์นี้')
  })

  it('calls userAuth.logout when logout button is clicked', async () => {
    const wrapper = createWrapper()
    const logoutItem = wrapper.find('.text-red-500')
    await logoutItem.trigger('click')
    expect(mockUserAuth.logout).toHaveBeenCalledOnce()
  })

  it('renders the app version', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('v2.0')
  })

  it('renders edit profile option', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('แก้ไขโปรไฟล์')
  })

  it('renders security option', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('ความปลอดภัย')
  })

  it('renders language option', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('ภาษา')
  })

  it('renders theme option', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('ธีม')
  })

  it('renders about app option', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('เกี่ยวกับแอป')
  })
})
