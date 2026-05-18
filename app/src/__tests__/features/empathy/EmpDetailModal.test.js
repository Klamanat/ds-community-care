import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import EmpDetailModal from '../../../features/empathy/EmpDetailModal.vue'

const { empathyStore, uiStore, teamStore } = vi.hoisted(() => ({
  empathyStore: {
    posts: [
      {
        id: 1,
        recName: 'Alice Wonder',
        recRole: 'Developer',
        recImg: '',
        sndName: 'Bob',
        msg: 'Great work!',
        tag: 'เก่งมาก ⭐',
        react: '⭐',
        comments: [
          { id: 'c1', name: 'Charlie', text: 'Agreed!', time: '2026-05-18T10:00:00Z', _liked: false, likeCount: 0 },
        ],
        likeCount: 3,
        _liked: false,
      },
    ],
    toggleLike: vi.fn(),
    togglePostCommentLike: vi.fn(),
    addComment: vi.fn(),
  },
  uiStore: {
    _empDetailIdx: 0,
    currentUser: { name: 'TestUser' },
  },
  teamStore: {
    empDirectory: [
      { name: 'Alice Wonder', imgUrl: '' },
      { name: 'Charlie', imgUrl: '' },
    ],
    loadDirectory: vi.fn(),
  },
}))

vi.mock('../../../shared/components/BaseModal.vue', () => ({
  default: {
    name: 'BaseModal',
    template: '<div><slot /></div>',
    props: ['modalId', 'sheetClass', 'padded'],
  },
}))

vi.mock('../../../features/empathy/empathy.store.js', () => ({
  useEmpathyStore: vi.fn(() => empathyStore),
}))

vi.mock('../../../core/stores/ui.js', () => ({
  useUiStore: vi.fn(() => uiStore),
}))

vi.mock('../../../features/team/team.store.js', () => ({
  useTeamStore: vi.fn(() => teamStore),
}))

vi.mock('../../../core/utils/date.js', () => ({
  formatThaiDatetime: vi.fn(() => '18 พ.ค. 2569 10:00'),
}))

describe('EmpDetailModal', () => {
  beforeEach(() => {
    empathyStore.posts = [
      {
        id: 1,
        recName: 'Alice Wonder',
        recRole: 'Developer',
        recImg: '',
        sndName: 'Bob',
        msg: 'Great work!',
        tag: 'เก่งมาก ⭐',
        react: '⭐',
        comments: [
          { id: 'c1', name: 'Charlie', text: 'Agreed!', time: '2026-05-18T10:00:00Z', _liked: false, likeCount: 0 },
        ],
        likeCount: 3,
        _liked: false,
      },
    ]
    uiStore._empDetailIdx = 0
    empathyStore.toggleLike.mockClear()
    empathyStore.togglePostCommentLike.mockClear()
    empathyStore.addComment.mockClear()
    teamStore.loadDirectory.mockClear()
  })

  function createWrapper() {
    return shallowMount(EmpDetailModal, {
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

  it('renders receiver name', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Alice Wonder')
  })

  it('renders receiver role', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Developer')
  })

  it('renders sender message', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Great work!')
  })

  it('renders comments', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Agreed!')
    expect(wrapper.text()).toContain('Charlie')
  })

  it('shows comment input bar', () => {
    const wrapper = createWrapper()
    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)
    expect(input.attributes('placeholder')).toContain('เพิ่มความคิดเห็น')
  })
})
