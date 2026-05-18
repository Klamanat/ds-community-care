import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ConsultCards from '../../../components/home/ConsultCards.vue'
import { useUiStore } from '../../../core/stores/ui.js'
import { useCardConfigStore } from '../../../core/stores/cardConfig.js'

vi.mock('../../../core/stores/ui.js', () => ({ useUiStore: vi.fn() }))
vi.mock('../../../core/stores/cardConfig.js', () => ({ useCardConfigStore: vi.fn() }))

describe('ConsultCards', () => {
  let mockUi
  let mockCardConfig

  beforeEach(() => {
    setActivePinia(createPinia())

    mockUi = {
      openModal: vi.fn(),
      showToast: vi.fn(),
    }
    mockCardConfig = {
      getBg: vi.fn((key) => key === 'mental'
        ? 'linear-gradient(135deg,#E8F8F0,#C8F0DC)'
        : 'linear-gradient(135deg,#FFFBEB,#FEF3C7)'),
      isEnabled: vi.fn(() => true),
    }

    useUiStore.mockReturnValue(mockUi)
    useCardConfigStore.mockReturnValue(mockCardConfig)
  })

  it('renders the mental health consultation card', () => {
    const wrapper = mount(ConsultCards)
    expect(wrapper.text()).toContain('Mental Health Consultation')
  })

  it('renders the financial consultation card', () => {
    const wrapper = mount(ConsultCards)
    expect(wrapper.text()).toContain('Financial Consultation')
  })

  it('renders both consult cards', () => {
    const wrapper = mount(ConsultCards)
    const cards = wrapper.findAll('.consult-card')
    expect(cards.length).toBe(2)
  })

  it('shows active subtitle when card is enabled', () => {
    mockCardConfig.isEnabled.mockReturnValue(true)
    const wrapper = mount(ConsultCards)
    expect(wrapper.find('.consult-card:first-child .ci-sub').text()).toContain('ดูแลสุขภาพใจ')
  })

  it('shows coming soon text when mental card is disabled', () => {
    mockCardConfig.isEnabled.mockReturnValue(false)
    const wrapper = mount(ConsultCards)
    const subs = wrapper.findAll('.ci-sub')
    expect(subs[0].text()).toContain('เร็วๆ นี้')
  })

  it('shows coming soon text when financial card is disabled', () => {
    mockCardConfig.isEnabled.mockReturnValue(false)
    const wrapper = mount(ConsultCards)
    const subs = wrapper.findAll('.ci-sub')
    expect(subs[1].text()).toContain('เร็วๆ นี้')
  })

  it('opens mental modal on mental card click when enabled', async () => {
    mockCardConfig.isEnabled.mockReturnValue(true)
    const wrapper = mount(ConsultCards)
    const cards = wrapper.findAll('.consult-card')
    await cards[0].trigger('click')
    expect(mockUi.openModal).toHaveBeenCalledWith('modal-mental')
    expect(mockUi.showToast).not.toHaveBeenCalled()
  })

  it('opens financial modal on financial card click when enabled', async () => {
    mockCardConfig.isEnabled.mockReturnValue(true)
    const wrapper = mount(ConsultCards)
    const cards = wrapper.findAll('.consult-card')
    await cards[1].trigger('click')
    expect(mockUi.openModal).toHaveBeenCalledWith('modal-financial')
    expect(mockUi.showToast).not.toHaveBeenCalled()
  })

  it('shows toast instead of opening modal when mental card is disabled', async () => {
    mockCardConfig.isEnabled.mockImplementation((key) => key !== 'mental')
    const wrapper = mount(ConsultCards)
    const cards = wrapper.findAll('.consult-card')
    await cards[0].trigger('click')
    expect(mockUi.showToast).toHaveBeenCalledWith('🔜 เร็วๆ นี้')
    expect(mockUi.openModal).not.toHaveBeenCalled()
  })

  it('shows toast when financial card is disabled', async () => {
    mockCardConfig.isEnabled.mockImplementation((key) => key !== 'financial')
    const wrapper = mount(ConsultCards)
    const cards = wrapper.findAll('.consult-card')
    await cards[1].trigger('click')
    expect(mockUi.showToast).toHaveBeenCalledWith('🔜 เร็วๆ นี้')
    expect(mockUi.openModal).not.toHaveBeenCalled()
  })

  it('applies background gradient from cardConfig.getBg', () => {
    const wrapper = mount(ConsultCards)
    const cards = wrapper.findAll('.consult-card')
    expect(mockCardConfig.getBg).toHaveBeenCalledWith('mental')
    expect(mockCardConfig.getBg).toHaveBeenCalledWith('financial')
  })

  it('renders mental icon image', () => {
    const wrapper = mount(ConsultCards)
    const img = wrapper.find('img[src="/images/icon-mental.png"]')
    expect(img.exists()).toBe(true)
  })
})
