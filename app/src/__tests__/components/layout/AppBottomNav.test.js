import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import AppBottomNav from '../../../core/layout/AppBottomNav.vue'
import { useUiStore } from '../../../core/stores/ui.js'

// Mock vue-router for NavItem child (shallow rendered)
vi.mock('vue-router', () => ({
  RouterLink: {
    name: 'RouterLink',
    props: ['to', 'custom'],
    template: '<a class="rl-stub"><slot :navigate="mockNavigate" /></a>',
    methods: { mockNavigate() {} },
  },
  useRoute: vi.fn(() => ({ path: '/' })),
}))

describe('AppBottomNav', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function createWrapper() {
    return shallowMount(AppBottomNav, {
      global: {
        stubs: { NavItem: true },
      },
    })
  }

  it('renders navigation items', () => {
    const wrapper = createWrapper()
    const navItems = wrapper.findAllComponents({ name: 'NavItem' })
    expect(navItems.length).toBeGreaterThanOrEqual(2)
  })

  it('renders notification bell button', () => {
    const wrapper = createWrapper()
    const bellBtn = wrapper.find('.notif-bell-btn')
    expect(bellBtn.exists()).toBe(true)
  })

  it('shows notification badge when notifBadge > 0', () => {
    const uiStore = useUiStore()
    uiStore.notifBadge = 5

    const wrapper = shallowMount(AppBottomNav, {
      global: { stubs: { NavItem: true } },
    })
    const badge = wrapper.find('.notif-bell-badge')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('5')
  })

  it('shows 99+ when notifBadge exceeds 99', () => {
    const uiStore = useUiStore()
    uiStore.notifBadge = 150

    const wrapper = shallowMount(AppBottomNav, {
      global: { stubs: { NavItem: true } },
    })
    const badge = wrapper.find('.notif-bell-badge')
    expect(badge.text()).toBe('99+')
  })

  it('does not show notification badge when notifBadge is 0', () => {
    const wrapper = shallowMount(AppBottomNav, {
      global: { stubs: { NavItem: true } },
    })
    expect(wrapper.find('.notif-bell-badge').exists()).toBe(false)
  })

  it('opens notification modal on bell click', async () => {
    const uiStore = useUiStore()
    vi.spyOn(uiStore, 'openModal')

    const wrapper = shallowMount(AppBottomNav, {
      global: { stubs: { NavItem: true } },
    })
    await wrapper.find('.notif-bell-btn').trigger('click')
    expect(uiStore.openModal).toHaveBeenCalledWith('modal-notif')
  })
})
