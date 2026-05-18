import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EmptyState from '../../../shared/components/EmptyState.vue'

describe('EmptyState', () => {
  it('renders with default icon', () => {
    const wrapper = mount(EmptyState, {
      props: { title: 'No data' },
    })
    expect(wrapper.text()).toContain('📭')
  })

  it('renders with custom icon', () => {
    const wrapper = mount(EmptyState, {
      props: { icon: '🎉', title: 'No data' },
    })
    expect(wrapper.text()).toContain('🎉')
  })

  it('renders title', () => {
    const wrapper = mount(EmptyState, {
      props: { title: 'Nothing here' },
    })
    expect(wrapper.text()).toContain('Nothing here')
  })

  it('renders subtitle when provided', () => {
    const wrapper = mount(EmptyState, {
      props: { title: 'No data', sub: 'Check back later' },
    })
    expect(wrapper.text()).toContain('Check back later')
  })

  it('does not render subtitle when not provided', () => {
    const wrapper = mount(EmptyState, {
      props: { title: 'No data' },
    })
    expect(wrapper.find('.text-app-light').exists()).toBe(false)
  })
})
