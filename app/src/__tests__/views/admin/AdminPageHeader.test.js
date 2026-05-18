import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import AdminPageHeader from '../../../views/admin/AdminPageHeader.vue'

describe('AdminPageHeader', () => {
  it('renders the title prop', () => {
    const wrapper = shallowMount(AdminPageHeader, {
      props: { title: 'Employee Management' },
    })
    expect(wrapper.text()).toContain('Employee Management')
  })

  it('renders the subtitle prop when provided', () => {
    const wrapper = shallowMount(AdminPageHeader, {
      props: { title: 'Employees', sub: 'Manage all employees' },
    })
    expect(wrapper.text()).toContain('Manage all employees')
  })

  it('does not render subtitle when not provided', () => {
    const wrapper = shallowMount(AdminPageHeader, {
      props: { title: 'Employees' },
    })
    expect(wrapper.find('.al-page-banner-sub').exists()).toBe(false)
  })

  it('renders slot content', () => {
    const wrapper = shallowMount(AdminPageHeader, {
      props: { title: 'Dashboard' },
      slots: {
        default: '<button class="add-btn">Add New</button>',
      },
    })
    expect(wrapper.find('.add-btn').exists()).toBe(true)
    expect(wrapper.text()).toContain('Add New')
  })

  it('renders the title in an h1 element', () => {
    const wrapper = shallowMount(AdminPageHeader, {
      props: { title: 'Reports' },
    })
    const h1 = wrapper.find('h1')
    expect(h1.exists()).toBe(true)
    expect(h1.text()).toBe('Reports')
  })

  it('renders the actions container for slots', () => {
    const wrapper = shallowMount(AdminPageHeader, {
      props: { title: 'Settings' },
    })
    expect(wrapper.find('.al-page-banner-actions').exists()).toBe(true)
  })
})
