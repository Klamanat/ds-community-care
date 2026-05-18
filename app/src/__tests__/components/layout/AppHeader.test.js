import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import AppHeader from '../../../core/layout/AppHeader.vue'
import { useUiStore } from '../../../core/stores/ui.js'
import { useUserAuthStore } from '../../../core/stores/userAuth.js'
import { useMentalStore } from '../../../features/mental/mental.store.js'

vi.mock('../../../core/stores/ui.js', () => ({ useUiStore: vi.fn() }))
vi.mock('../../../core/stores/userAuth.js', () => ({ useUserAuthStore: vi.fn() }))
vi.mock('../../../features/mental/mental.store.js', () => ({ useMentalStore: vi.fn() }))

describe('AppHeader', () => {
  let mockUi
  let mockUserAuth
  let mockMental

  beforeEach(() => {
    setActivePinia(createPinia())

    mockUi = {
      notifBadge: 0,
      openModal: vi.fn(),
      currentUser: { name: 'John Doe', role: 'Developer', img: '', emoji: '😊' },
    }
    mockUserAuth = { userId: '42' }
    mockMental = { unreadCount: 0, isCounselor: vi.fn(() => false) }

    useUiStore.mockReturnValue(mockUi)
    useUserAuthStore.mockReturnValue(mockUserAuth)
    useMentalStore.mockReturnValue(mockMental)
  })

  it('renders the DS Community Care logo', () => {
    const wrapper = mount(AppHeader)
    expect(wrapper.find('.hdr-logo').exists()).toBe(true)
    expect(wrapper.text()).toContain('DS Community')
    expect(wrapper.text()).toContain('Care')
  })

  it('renders the favicon image inside the logo', () => {
    const wrapper = mount(AppHeader)
    const img = wrapper.find('.hdr-logo-favicon')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/favicon.svg')
  })

  it('shows notification badge when notifBadge > 0', () => {
    mockUi.notifBadge = 5
    const wrapper = mount(AppHeader)
    const badge = wrapper.find('.hbadge')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('5')
  })

  it('shows raw count on notification badge even when exceeds 99', () => {
    mockUi.notifBadge = 150
    const wrapper = mount(AppHeader)
    const badge = wrapper.find('.hbadge')
    expect(badge.text()).toBe('150')
  })

  it('does not show notification badge when notifBadge is 0', () => {
    const wrapper = mount(AppHeader)
    expect(wrapper.find('.hbadge').exists()).toBe(false)
  })

  it('shows counselor inbox button when user is a counselor', () => {
    mockMental.isCounselor.mockReturnValue(true)
    mockMental.unreadCount = 2
    const wrapper = mount(AppHeader)
    const btn = wrapper.find('.hdr-btn').find('.hbadge')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toBe('2')
  })

  it('does not show counselor inbox button when user is not a counselor', () => {
    const wrapper = mount(AppHeader)
    // The first .hdr-btn is the counselor inbox; it should not exist for non-counselors
    const allBtns = wrapper.findAll('.hdr-btn')
    // When not a counselor, only the notification bell .hdr-btn is rendered
    expect(allBtns.length).toBe(1)
  })

  it('opens notification modal on bell click', async () => {
    const wrapper = mount(AppHeader)
    const bellBtn = wrapper.findAll('.hdr-btn').at(-1) // last is notification bell
    await bellBtn.trigger('click')
    expect(mockUi.openModal).toHaveBeenCalledWith('modal-notif')
  })

  it('renders user info from currentUser', () => {
    const wrapper = mount(AppHeader)
    expect(wrapper.find('.hdr-user-name').text()).toBe('John Doe')
    expect(wrapper.find('.hdr-user-role').text()).toBe('Developer')
  })

  it('shows emoji fallback when user has no image', () => {
    const wrapper = mount(AppHeader)
    // No img element, emoji span should exist
    expect(wrapper.find('.hdr-avatar img').exists()).toBe(false)
    expect(wrapper.find('.hdr-avatar span').text()).toBe('😊')
  })

  it('shows user image when currentUser.img is provided', () => {
    mockUi.currentUser = { name: 'Jane', role: 'Designer', img: '/images/avatar.jpg', emoji: '😊' }
    const wrapper = mount(AppHeader)
    const img = wrapper.find('.hdr-avatar img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/images/avatar.jpg')
  })

  it('opens profile modal on user click', async () => {
    const wrapper = mount(AppHeader)
    await wrapper.find('.hdr-user').trigger('click')
    expect(mockUi.openModal).toHaveBeenCalledWith('modal-profile')
  })

  it('calls isCounselor with the correct userId', () => {
    mount(AppHeader)
    expect(mockMental.isCounselor).toHaveBeenCalledWith('42')
  })
})
