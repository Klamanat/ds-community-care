import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import BdayBanner from '../../../components/home/BdayBanner.vue'

// Shared mock so both component and test see the same instance
const mockUi = {
  openModal: vi.fn(),
  closeModal: vi.fn(),
  activeModal: null,
  modalKeys: {},
}

vi.mock('../../../core/stores/ui.js', () => ({
  useUiStore: () => mockUi,
}))

describe('BdayBanner', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockUi.openModal.mockClear()
  })

  it('renders birthday celebration title', () => {
    const wrapper = shallowMount(BdayBanner)
    expect(wrapper.text()).toContain('🎂')
    expect(wrapper.text()).toContain('Birthday Celebration')
  })

  it('renders the monthly celebration subtitle', () => {
    const wrapper = shallowMount(BdayBanner)
    expect(wrapper.text()).toContain('ฉลองวันเกิดพนักงานรายเดือน')
  })

  it('renders name when provided', () => {
    const wrapper = shallowMount(BdayBanner, {
      props: { name: 'John Doe' },
    })
    expect(wrapper.text()).toContain('John Doe')
  })

  it('renders sub when provided', () => {
    const wrapper = shallowMount(BdayBanner, {
      props: { sub: 'Special celebration this month!' },
    })
    expect(wrapper.text()).toContain('Special celebration this month!')
  })

  it('renders default sub when not provided', () => {
    const wrapper = shallowMount(BdayBanner)
    expect(wrapper.text()).toContain('เดือนนี้มีใครเกิดบ้าง')
  })

  it('renders photos when provided', () => {
    const photos = [
      { src: '/images/person1.jpg' },
      { src: '/images/person2.jpg' },
    ]
    const wrapper = shallowMount(BdayBanner, {
      props: { photos, placeholders: [] }, // empty placeholders to isolate photos
    })
    const imgs = wrapper.findAll('.bbc-photo')
    expect(imgs.length).toBe(2)
    expect(imgs[0].attributes('src')).toBe('/images/person1.jpg')
    expect(imgs[1].attributes('src')).toBe('/images/person2.jpg')
  })

  it('renders placeholders when provided', () => {
    const placeholders = [
      { bg: 'red', emoji: '😊' },
      { bg: 'blue', emoji: '🌟' },
    ]
    const wrapper = shallowMount(BdayBanner, {
      props: { placeholders },
    })
    expect(wrapper.text()).toContain('😊')
    expect(wrapper.text()).toContain('🌟')
  })

  it('renders default three placeholders when none provided', () => {
    const wrapper = shallowMount(BdayBanner)
    const placeholders = wrapper.findAll('.bbc-photo')
    expect(placeholders.length).toBe(3)
  })

  it('opens birthday modal on click', async () => {
    const wrapper = shallowMount(BdayBanner)
    await wrapper.find('.ripple-host').trigger('click')

    expect(mockUi.openModal).toHaveBeenCalledWith('modal-bday')
  })
})
