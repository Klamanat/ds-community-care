import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import AppSidebar from '../../../core/layout/AppSidebar.vue'
import { useCardConfigStore } from '../../../core/stores/cardConfig.js'

// Mock vue-router for NavItem child
vi.mock('vue-router', () => ({
  RouterLink: {
    name: 'RouterLink',
    props: ['to', 'custom'],
    template: '<a class="rl-stub"><slot :navigate="mockNavigate" /></a>',
    methods: { mockNavigate() {} },
  },
  useRoute: vi.fn(() => ({ path: '/' })),
}))

vi.mock('../../../core/stores/cardConfig.js', () => ({
  useCardConfigStore: vi.fn(),
}))

describe('AppSidebar', () => {
  let mockCardConfig

  beforeEach(() => {
    setActivePinia(createPinia())

    mockCardConfig = {
      isEnabled: vi.fn((key) => true),
    }

    useCardConfigStore.mockReturnValue(mockCardConfig)
  })

  function createWrapper() {
    return shallowMount(AppSidebar, {
      global: {
        stubs: { NavItem: true },
      },
    })
  }

  it('renders the main navigation section label', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('เมนูหลัก')
  })

  it('renders the account section label', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('บัญชี')
  })

  it('renders NavItem components', () => {
    const wrapper = createWrapper()
    const navItems = wrapper.findAllComponents({ name: 'NavItem' })
    expect(navItems.length).toBeGreaterThanOrEqual(2)
  })

  it('renders home link', () => {
    const wrapper = createWrapper()
    const navItems = wrapper.findAllComponents({ name: 'NavItem' })
    const homeItem = navItems.find(n => n.props('to') === '/')
    expect(homeItem).toBeTruthy()
  })

  it('renders star link', () => {
    const wrapper = createWrapper()
    const navItems = wrapper.findAllComponents({ name: 'NavItem' })
    const starItem = navItems.find(n => n.props('to') === '/star')
    expect(starItem).toBeTruthy()
  })

  it('renders idea link when cardConfig.isEnabled("idea") returns true', () => {
    mockCardConfig.isEnabled.mockReturnValue(true)
    const wrapper = createWrapper()
    const navItems = wrapper.findAllComponents({ name: 'NavItem' })
    const ideaItem = navItems.find(n => n.props('to') === '/idea')
    expect(ideaItem).toBeTruthy()
  })

  it('does not render idea link when cardConfig.isEnabled("idea") returns false', () => {
    mockCardConfig.isEnabled.mockReturnValue(false)
    const wrapper = createWrapper()
    const navItems = wrapper.findAllComponents({ name: 'NavItem' })
    const ideaItem = navItems.find(n => n.props('to') === '/idea')
    expect(ideaItem).toBeUndefined()
  })

  it('renders settings link', () => {
    const wrapper = createWrapper()
    const navItems = wrapper.findAllComponents({ name: 'NavItem' })
    const settingsItem = navItems.find(n => n.props('to') === '/settings')
    expect(settingsItem).toBeTruthy()
  })

  it('calls cardConfig.isEnabled for idea key', () => {
    createWrapper()
    expect(mockCardConfig.isEnabled).toHaveBeenCalledWith('idea')
  })

  it('renders sidebar dividers', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.sidebar-divider').exists()).toBe(true)
  })

  it('has the sidebar nav element', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('nav.sidebar').exists()).toBe(true)
  })
})
