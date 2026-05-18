import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import AdminHomeCardsView from '../../../views/admin/AdminHomeCardsView.vue'

const { cardConfigStore } = vi.hoisted(() => ({
  cardConfigStore: {
    cardVisible: { bday: true, culture: true, training: true },
    cardColors: { bday: '#6366F1', culture: '#A855F7' },
    cardBgMap: {},
    config: { bday: true, culture: true, training: true },
    bgConfig: {},
    bgImgId: {},
    isEnabled: vi.fn(() => true),
    getBg: vi.fn(() => 'linear-gradient(135deg, #FF6B00, #A855F7)'),
    load: vi.fn(),
    saveAll: vi.fn(),
    saveBg: vi.fn(),
    saving: false,
  },
}))

vi.mock('../../../core/stores/cardConfig.js', () => ({
  useCardConfigStore: vi.fn(() => cardConfigStore),
  CARD_DEFS: [
    { key: 'bday', icon: '🎂', label: 'Birthday', desc: 'Show birthday cards' },
    { key: 'culture', icon: '🌟', label: 'Culture', desc: 'Show culture cards' },
    { key: 'training', icon: '📚', label: 'Training', desc: 'Show training cards' },
  ],
  CARD_BG_DEFS: [
    { key: 'bday', icon: '🎂', label: 'Birthday', default: 'linear-gradient(135deg, #FF6B00, #FF3CAC)' },
    { key: 'culture', icon: '🌟', label: 'Culture', default: 'linear-gradient(135deg, #A855F7, #7C3AED)' },
    { key: 'training', icon: '📚', label: 'Training', default: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' },
  ],
}))

vi.mock('../../../core/composables/useImageCompress.js', () => ({
  resizeToBase64: vi.fn(() => Promise.resolve('data:image/jpeg;base64,fake')),
}))

vi.mock('../../../core/services/edgeFunctions.js', () => ({
  uploadImage: vi.fn(() => Promise.resolve({ id: 'img123', url: 'https://example.com/img.jpg' })),
  deleteImage: vi.fn(() => Promise.resolve()),
}))

vi.mock('../../../views/admin/AdminPageHeader.vue', () => ({
  default: { name: 'AdminPageHeader', template: '<div class="mock-page-header"><slot /></div>' },
}))

vi.mock('../../../shared/components/SkeletonCard.vue', () => ({
  default: { name: 'SkeletonCard', template: '<div class="mock-skeleton" />' },
}))

describe('AdminHomeCardsView', () => {
  beforeEach(() => {
    cardConfigStore.config = { bday: true, culture: true, training: true }
    cardConfigStore.bgConfig = {}
    cardConfigStore.bgImgId = {}
    cardConfigStore.saving = false
    cardConfigStore.load.mockClear()
    cardConfigStore.saveAll.mockClear()
    cardConfigStore.saveBg.mockClear()
  })

  async function createWrapper() {
    const wrapper = shallowMount(AdminHomeCardsView)
    await wrapper.vm.$nextTick()
    return wrapper
  }

  it('renders save config button', async () => {
    const wrapper = await createWrapper()
    expect(wrapper.text()).toContain('บันทึกการตั้งค่า')
  })

  it('shows card toggle rows', async () => {
    const wrapper = await createWrapper()
    expect(wrapper.text()).toContain('Birthday')
    expect(wrapper.text()).toContain('Culture')
    expect(wrapper.text()).toContain('Training')
  })

  it('shows card backgrounds section', async () => {
    const wrapper = await createWrapper()
    expect(wrapper.text()).toContain('พื้นหลัง Card')
    expect(wrapper.text()).toContain('🎨')
  })

  it('shows save button', async () => {
    const wrapper = await createWrapper()
    const buttons = wrapper.findAll('button')
    const saveBtn = buttons.find(b => b.text().includes('บันทึกการตั้งค่า'))
    expect(saveBtn).toBeTruthy()
  })

  it('shows toggle on/off status', async () => {
    const wrapper = await createWrapper()
    expect(wrapper.text()).toContain('เปิด')
  })

  it('shows info box with explanation', async () => {
    const wrapper = await createWrapper()
    expect(wrapper.text()).toContain('เปิด')
    expect(wrapper.text()).toContain('ปิด')
  })
})
