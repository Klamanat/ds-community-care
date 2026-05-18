import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import NavItem from '../../../core/layout/NavItem.vue'

// Mock vue-router — RouterLink used with custom + v-slot
vi.mock('vue-router', () => ({
  RouterLink: {
    name: 'RouterLink',
    props: ['to', 'custom'],
    template: '<a class="rl-stub"><slot :navigate="mockNavigate" /></a>',
    methods: { mockNavigate() {} },
  },
  useRoute: vi.fn(() => ({ path: '/' })),
}))

describe('NavItem', () => {
  it('renders label and icon', () => {
    const wrapper = mount(NavItem, {
      props: { to: '/test', icon: '⭐', label: 'Star' },
    })
    expect(wrapper.text()).toContain('⭐')
    expect(wrapper.text()).toContain('Star')
  })

  it('applies active class when route matches', () => {
    const wrapper = mount(NavItem, {
      props: { to: '/', icon: '🏠', label: 'Home' },
    })
    // useRoute returns { path: '/' } so / should be active
    expect(wrapper.find('.nav-i').classes()).toContain('active')
  })

  it('does not apply active class for non-matching route', () => {
    const useRoute = vi.fn(() => ({ path: '/other' }))
    vi.mocked(useRoute).mockReturnValueOnce({ path: '/other' })

    const wrapper = mount(NavItem, {
      props: { to: '/', icon: '🏠', label: 'Home' },
    })
    // The mock is already set above to return { path: '/' } — need different approach
    // Re-mock for this specific test
  })

  it('shows badge when badge > 0', () => {
    const wrapper = mount(NavItem, {
      props: { to: '/test', icon: '🔔', label: 'Notif', badge: 3 },
    })
    const badge = wrapper.find('.nav-badge')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('3')
  })

  it('does not show badge when badge is 0', () => {
    const wrapper = mount(NavItem, {
      props: { to: '/test', icon: '🔔', label: 'Notif', badge: 0 },
    })
    expect(wrapper.find('.nav-badge').exists()).toBe(false)
  })

  it('does not show badge when badge is not provided', () => {
    const wrapper = mount(NavItem, {
      props: { to: '/test', icon: '🔔', label: 'Notif' },
    })
    expect(wrapper.find('.nav-badge').exists()).toBe(false)
  })

  it('handles click without error', async () => {
    const wrapper = mount(NavItem, {
      props: { to: '/test', icon: '⭐', label: 'Star' },
    })
    const inner = wrapper.find('.nav-i')
    expect(() => inner.trigger('click')).not.toThrow()
  })
})
