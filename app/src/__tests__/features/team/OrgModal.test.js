import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import OrgModal from '../../../features/team/OrgModal.vue'

const { mockTeamStore, mockUiStore, mockUserAuthStore } = vi.hoisted(() => ({
  mockTeamStore: {
    sgMembers: [{ id: 1, name: 'Alice', imgUrl: '', starGangRole: 'Leader' }],
    getSgFallback: vi.fn(() => '#6366F1'),
    loadStarGang: vi.fn(),
    joinStarGang: vi.fn(),
  },
  mockUiStore: {
    closeModal: vi.fn(),
    showToast: vi.fn(),
    activeModal: 'modal-org',
  },
  mockUserAuthStore: {
    userName: 'Alice',
    userId: '42',
    userRole: 'developer',
  },
}))

vi.mock('../../../features/team/team.store.js', () => ({
  useTeamStore: vi.fn(() => mockTeamStore),
}))

vi.mock('../../../core/stores/ui.js', () => ({
  useUiStore: vi.fn(() => mockUiStore),
}))

vi.mock('../../../core/stores/userAuth.js', () => ({
  useUserAuthStore: vi.fn(() => mockUserAuthStore),
}))

vi.mock('../../../shared/components/BaseModal.vue', () => ({
  default: {
    name: 'BaseModal',
    template: '<div><slot /></div>',
    props: ['modalId', 'sheetClass', 'padded'],
  },
}))

describe('OrgModal', () => {
  beforeEach(() => {
    mockTeamStore.sgMembers = [{ id: 1, name: 'Alice', imgUrl: '', starGangRole: 'Leader' }]
    mockTeamStore.getSgFallback = vi.fn(() => '#6366F1')
    mockTeamStore.loadStarGang = vi.fn()
    mockTeamStore.joinStarGang = vi.fn()
    mockUiStore.closeModal = vi.fn()
    mockUiStore.showToast = vi.fn()
    mockUiStore.activeModal = 'modal-org'
    mockUserAuthStore.userName = 'Alice'
    mockUserAuthStore.userId = '42'
    mockUserAuthStore.userRole = 'developer'
  })

  function createWrapper() {
    return shallowMount(OrgModal, {
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

  it('renders Star Gang header', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('STAR GANG')
    expect(wrapper.text()).toContain('Star gang ไม่ได้สร้างได้ในวันเดียว')
  })

  it('shows member cards', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('Leader')
  })

  it('shows fallback emoji when no imgUrl', () => {
    mockTeamStore.sgMembers = [
      { id: 1, name: 'Bob', imgUrl: '' },
      { id: 2, name: 'Charlie', imgUrl: '' },
    ]
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Bob')
    expect(wrapper.text()).toContain('Charlie')
    expect(mockTeamStore.getSgFallback).toHaveBeenCalled()
  })

  it('calls loadStarGang on mount', () => {
    createWrapper()
    expect(mockTeamStore.loadStarGang).toHaveBeenCalledTimes(1)
  })
})
