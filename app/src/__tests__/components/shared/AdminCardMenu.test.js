import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AdminCardMenu from '../../../shared/components/AdminCardMenu.vue'

const defaultActions = [
  { icon: '✏️', label: 'Edit', fn: vi.fn() },
  { icon: '📋', label: 'View Details', to: '/admin/details' },
  { icon: '🗑️', label: 'Delete', fn: vi.fn() },
]

describe('AdminCardMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the admin trigger button', () => {
    const wrapper = mount(AdminCardMenu, {
      props: { actions: defaultActions },
    })
    const btn = wrapper.find('.acm-btn')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toContain('Admin')
  })

  it('does not show dropdown on initial render', () => {
    const wrapper = mount(AdminCardMenu, {
      props: { actions: defaultActions },
    })
    expect(wrapper.find('.acm-dropdown').exists()).toBe(false)
  })

  function createWrapper(actions = defaultActions) {
    return mount(AdminCardMenu, {
      props: { actions },
      global: {
        stubs: {
          Teleport: true,
          Transition: false,
          'router-link': {
            name: 'RouterLink',
            props: ['to'],
            template: '<a class="rl-stub"><slot /></a>',
          },
        },
      },
    })
  }

  it('opens dropdown on admin button click', async () => {
    const wrapper = createWrapper()
    await wrapper.find('.acm-btn').trigger('click')
    expect(wrapper.find('.acm-dropdown').exists()).toBe(true)
  })

  it('renders admin actions header in dropdown', async () => {
    const wrapper = createWrapper()
    await wrapper.find('.acm-btn').trigger('click')
    expect(wrapper.find('.acm-header').text()).toContain('Admin Actions')
  })

  it('renders all action items in dropdown', async () => {
    const wrapper = createWrapper()
    await wrapper.find('.acm-btn').trigger('click')

    const items = wrapper.findAll('.acm-item')
    expect(items.length).toBe(3)
    expect(items[0].text()).toContain('Edit')
    expect(items[1].text()).toContain('View Details')
    expect(items[2].text()).toContain('Delete')
  })

  it('renders action icons', async () => {
    const wrapper = createWrapper()
    await wrapper.find('.acm-btn').trigger('click')

    const icons = wrapper.findAll('.acm-item-ico')
    expect(icons[0].text()).toBe('✏️')
    expect(icons[1].text()).toBe('📋')
    expect(icons[2].text()).toBe('🗑️')
  })

  it('calls action function on button item click', async () => {
    const fn = vi.fn()
    const actions = [
      { icon: '✏️', label: 'Edit', fn },
    ]
    const wrapper = createWrapper(actions)
    await wrapper.find('.acm-btn').trigger('click')

    const btn = wrapper.find('.acm-item')
    await btn.trigger('click')

    expect(fn).toHaveBeenCalledOnce()
  })

  it('renders router-link for items with "to" prop', async () => {
    const wrapper = createWrapper()
    await wrapper.find('.acm-btn').trigger('click')

    const links = wrapper.findAll('.rl-stub')
    expect(links.length).toBe(1)
    expect(links[0].text()).toContain('View Details')
  })

  it('passes "to" prop to router-link', async () => {
    const wrapper = createWrapper()
    await wrapper.find('.acm-btn').trigger('click')

    const rl = wrapper.findComponent({ name: 'RouterLink' })
    expect(rl.exists()).toBe(true)
    expect(rl.props('to')).toBe('/admin/details')
  })

  it('closes dropdown after clicking a menu item', async () => {
    const fn = vi.fn()
    const actions = [{ icon: '✏️', label: 'Edit', fn }]
    const wrapper = createWrapper(actions)
    await wrapper.find('.acm-btn').trigger('click')
    expect(wrapper.find('.acm-dropdown').exists()).toBe(true)

    await wrapper.find('.acm-item').trigger('click')
    // After click, dropdown should close
    expect(wrapper.find('.acm-dropdown').exists()).toBe(false)
  })

  it('closes dropdown on backdrop click', async () => {
    const wrapper = createWrapper()
    await wrapper.find('.acm-btn').trigger('click')
    expect(wrapper.find('.acm-dropdown').exists()).toBe(true)

    await wrapper.find('.acm-backdrop').trigger('click')
    expect(wrapper.find('.acm-dropdown').exists()).toBe(false)
  })

  it('toggles dropdown on repeated button clicks', async () => {
    const wrapper = createWrapper()
    const btn = wrapper.find('.acm-btn')

    // First click — open
    await btn.trigger('click')
    expect(wrapper.find('.acm-dropdown').exists()).toBe(true)

    // Second click — close
    await btn.trigger('click')
    expect(wrapper.find('.acm-dropdown').exists()).toBe(false)

    // Third click — open again
    await btn.trigger('click')
    expect(wrapper.find('.acm-dropdown').exists()).toBe(true)
  })

  it('renders empty actions list without errors', () => {
    const wrapper = createWrapper([])
    expect(wrapper.find('.acm-btn').exists()).toBe(true)
  })
})
