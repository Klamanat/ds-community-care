import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SkeletonCard from '../../../shared/components/SkeletonCard.vue'

describe('SkeletonCard', () => {
  it('renders with default height and radius', () => {
    const wrapper = mount(SkeletonCard)
    const div = wrapper.find('.skeleton')
    expect(div.exists()).toBe(true)
    expect(div.attributes('style')).toContain('height: 120px')
    expect(div.attributes('style')).toContain('border-radius: 14px')
  })

  it('renders with custom height prop', () => {
    const wrapper = mount(SkeletonCard, {
      props: { height: '200px' },
    })
    const div = wrapper.find('.skeleton')
    expect(div.attributes('style')).toContain('height: 200px')
  })

  it('renders with custom radius prop', () => {
    const wrapper = mount(SkeletonCard, {
      props: { radius: '8px' },
    })
    const div = wrapper.find('.skeleton')
    expect(div.attributes('style')).toContain('border-radius: 8px')
  })

  it('renders with both custom height and radius props', () => {
    const wrapper = mount(SkeletonCard, {
      props: { height: '300px', radius: '20px' },
    })
    const div = wrapper.find('.skeleton')
    expect(div.attributes('style')).toContain('height: 300px')
    expect(div.attributes('style')).toContain('border-radius: 20px')
  })
})
