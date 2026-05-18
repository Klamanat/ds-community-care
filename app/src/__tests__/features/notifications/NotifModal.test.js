import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import NotifModal from '../../../features/notifications/NotifModal.vue'

const { notifStore, uiStore, userAuthStore, empathyStore } = vi.hoisted(() => ({
  notifStore: {
    items: [
      { id: 1, title: 'Birthday!', msg: 'Happy Bday', type: 'bday', time: '2026-05-18', color: '#FF69B4', target: 'bday' },
      { id: 2, title: 'New Activity', msg: 'Join us!', type: 'activity', time: '2026-05-17', color: '#FFD700', target: 'month_0' },
    ],
    unreadCount: 2,
    isRead: vi.fn(() => false),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
    loading: false,
    load: vi.fn(),
  },
  uiStore: {
    closeModal: vi.fn(),
    openModal: vi.fn(),
    openMonthModal: vi.fn(),
    _empPreselect: null,
  },
  userAuthStore: {
    userName: 'TestUser',
  },
  empathyStore: {
    praisedPeople: [],
  },
}))

vi.mock('../../../shared/components/BaseModal.vue', () => ({
  default: {
    name: 'BaseModal',
    template: '<div><slot /></div>',
    props: ['modalId', 'sheetClass', 'padded'],
  },
}))

vi.mock('../../../features/notifications/notif.store.js', () => ({
  useNotifStore: vi.fn(() => notifStore),
}))

vi.mock('../../../core/stores/ui.js', () => ({
  useUiStore: vi.fn(() => uiStore),
}))

vi.mock('../../../core/stores/userAuth.js', () => ({
  useUserAuthStore: vi.fn(() => userAuthStore),
}))

vi.mock('../../../features/empathy/empathy.store.js', () => ({
  useEmpathyStore: vi.fn(() => empathyStore),
}))

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}))

describe('NotifModal', () => {
  beforeEach(() => {
    notifStore.items = [
      { id: 1, title: 'Birthday!', msg: 'Happy Bday', type: 'bday', time: '2026-05-18', color: '#FF69B4', target: 'bday' },
      { id: 2, title: 'New Activity', msg: 'Join us!', type: 'activity', time: '2026-05-17', color: '#FFD700', target: 'month_0' },
    ]
    notifStore.unreadCount = 2
    notifStore.loading = false
    notifStore.isRead = vi.fn(() => false)
    notifStore.markRead.mockClear()
    notifStore.markAllRead.mockClear()
    notifStore.load.mockClear()
    uiStore.closeModal.mockClear()
    uiStore.openModal.mockClear()
    uiStore.openMonthModal.mockClear()
  })

  function createWrapper() {
    return shallowMount(NotifModal, {
      global: {
        stubs: {
          BaseModal: {
            name: 'BaseModal',
            template: '<div><slot /></div>',
            props: ['modalId', 'sheetClass', 'padded'],
          },
        },
      },
    })
  }

  it('renders header with title', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('การแจ้งเตือน')
  })

  it('renders notification items', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Birthday!')
    expect(wrapper.text()).toContain('New Activity')
  })

  it('shows unread badge count', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('2')
  })

  it('calls load on mount', () => {
    createWrapper()
    expect(notifStore.load).toHaveBeenCalledWith('TestUser', true)
  })

  it('shows empty state when no items', () => {
    notifStore.items = []
    notifStore.unreadCount = 0
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('ยังไม่มีการแจ้งเตือน')
  })

  it('shows "อ่านทั้งหมดแล้ว" button when unread exist', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('อ่านทั้งหมดแล้ว')
  })

  it('renders notification message text', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Happy Bday')
    expect(wrapper.text()).toContain('Join us!')
  })
})
