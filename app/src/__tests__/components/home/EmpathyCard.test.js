import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import EmpathyCard from '../../../components/home/EmpathyCard.vue'

describe('EmpathyCard', () => {
  const basePost = {
    id: 1,
    recName: 'Jane Doe',
    recRole: 'Developer',
    recImg: '',
    tag: 'เก่งมาก ⭐',
    likeCount: 5,
    comments: [{ id: 1, text: 'Great!' }],
  }

  it('renders recipient name', () => {
    const wrapper = mount(EmpathyCard, {
      props: { post: basePost },
    })
    expect(wrapper.text()).toContain('Jane Doe')
  })

  it('renders recipient role', () => {
    const wrapper = mount(EmpathyCard, {
      props: { post: basePost },
    })
    expect(wrapper.text()).toContain('Developer')
  })

  it('shows like count', () => {
    const wrapper = mount(EmpathyCard, {
      props: { post: basePost },
    })
    expect(wrapper.text()).toContain('5')
    expect(wrapper.html()).toContain('❤️')
  })

  it('shows comment count', () => {
    const wrapper = mount(EmpathyCard, {
      props: { post: basePost },
    })
    expect(wrapper.text()).toContain('1')
    expect(wrapper.html()).toContain('💬')
  })

  it('renders image when recImg is provided', () => {
    const postWithImg = { ...basePost, recImg: '/images/photo.jpg' }
    const wrapper = mount(EmpathyCard, {
      props: { post: postWithImg },
    })
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/images/photo.jpg')
  })

  it('shows fallback when recImg is empty', () => {
    const wrapper = mount(EmpathyCard, {
      props: { post: basePost },
    })
    // No img element, initials fallback should be present instead
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('JD')
  })

  it('shows initials when no recImg', () => {
    const wrapper = mount(EmpathyCard, {
      props: { post: basePost },
    })
    expect(wrapper.text()).toContain('JD')
  })

  it('shows ? for initials when recName is empty', () => {
    const wrapper = mount(EmpathyCard, {
      props: { post: { ...basePost, recName: '' } },
    })
    expect(wrapper.text()).toContain('?')
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(EmpathyCard, {
      props: { post: basePost },
    })
    await wrapper.find('.cursor-pointer').trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')[0]).toEqual([basePost])
  })

  it('shows likeCount as 0 when not provided', () => {
    const wrapper = mount(EmpathyCard, {
      props: { post: { ...basePost, likeCount: undefined } },
    })
    expect(wrapper.text()).toContain('0')
  })
})
