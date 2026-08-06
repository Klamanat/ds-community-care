import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import EmpathyBoard from '../../../components/home/EmpathyBoard.vue'
import { useEmpathyStore } from '../../../features/empathy/empathy.store.js'
import { useUiStore } from '../../../core/stores/ui.js'

vi.mock('../../../features/empathy/empathy.store.js', () => ({ useEmpathyStore: vi.fn() }))
vi.mock('../../../core/stores/ui.js', () => ({ useUiStore: vi.fn() }))

describe('EmpathyBoard', () => {
  let mockEmpathy
  let mockUi

  beforeEach(() => {
    setActivePinia(createPinia())

    mockUi = {
      openModal: vi.fn(),
      _empPreselect: null,
    }
    mockEmpathy = {
      postCards: [],
      loadPostCards: vi.fn(() => Promise.resolve()),
    }

    useEmpathyStore.mockReturnValue(mockEmpathy)
    useUiStore.mockReturnValue(mockUi)

    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  function createWrapper() {
    return shallowMount(EmpathyBoard, {
      global: {
        stubs: {
          SkeletonCard: true,
          EmpathyCard: true,
        },
      },
    })
  }

  it('calls loadPostCards on mount', () => {
    createWrapper()
    expect(mockEmpathy.loadPostCards).toHaveBeenCalled()
  })

  it('renders the section header', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('ชื่นชมเพื่อนร่วมงานของคุณวันนี้')
  })

  it('renders the empathy points info badge', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Empathy')
    expect(wrapper.text()).toContain('10 DS pts')
  })

  it('shows empty state when postCards is empty and not loading', async () => {
    const wrapper = createWrapper()
    await mockEmpathy.loadPostCards()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('ยังไม่มีคำชื่นชม')
    expect(wrapper.text()).toContain('กดปุ่มด้านบน')
  })

  it('renders EmpathyCard components when postCards has data', async () => {
    mockEmpathy.postCards = [
      { id: 'post1', channelId: 'EMP01', recName: 'Alice', recRole: 'Dev', imgUrl: '', commentCount: 2, likeCount: 5, _liked: true },
      { id: 'post2', channelId: 'EMP02', recName: 'Bob', recRole: 'QA', imgUrl: '', commentCount: 1, likeCount: 3, _liked: false },
    ]

    const wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    const cards = wrapper.findAllComponents({ name: 'EmpathyCard' })
    expect(cards.length).toBe(2)
  })

  it('renders duplicate cards when the same person was praised via multiple posts', async () => {
    mockEmpathy.postCards = [
      { id: 'post1', channelId: 'EMP01', recName: 'Alice', recRole: 'Dev', imgUrl: '', commentCount: 0, likeCount: 0 },
      { id: 'post2', channelId: 'EMP01', recName: 'Alice', recRole: 'Dev', imgUrl: '', commentCount: 0, likeCount: 0 },
    ]

    const wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    const cards = wrapper.findAllComponents({ name: 'EmpathyCard' })
    expect(cards.length).toBe(2)
  })

  it('passes correct props to EmpathyCard components', async () => {
    mockEmpathy.postCards = [
      { id: 'post1', channelId: 'EMP01', recName: 'Alice', recRole: 'Dev', imgUrl: '', commentCount: 2, likeCount: 5, _liked: true },
    ]

    const wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    const card = wrapper.findComponent({ name: 'EmpathyCard' })
    expect(card.exists()).toBe(true)
    expect(card.props('post').recName).toBe('Alice')
    expect(card.props('post').recRole).toBe('Dev')
    expect(card.props('post').likeCount).toBe(5)
  })

  it('shows load more button when there are more posts than visible', async () => {
    // Create enough posts to exceed the default page size (8 for desktop)
    const cards = Array.from({ length: 12 }, (_, i) => ({
      id: `post${i + 1}`,
      channelId: `EMP${String(i + 1).padStart(3, '0')}`,
      recName: `Person ${i + 1}`,
      recRole: 'Member',
      imgUrl: '',
    }))
    mockEmpathy.postCards = cards

    const wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    const loadMore = wrapper.find('.emp-load-more')
    expect(loadMore.exists()).toBe(true)
    // 12 posts, pageSize=8 (desktop), empPages=1 → 8 visible, 4 remaining
    expect(loadMore.text()).toContain('ดูเพิ่มเติม')
  })

  it('hides load more button when all posts are visible', async () => {
    const cards = Array.from({ length: 5 }, (_, i) => ({
      id: `post${i + 1}`,
      channelId: `EMP${String(i + 1).padStart(3, '0')}`,
      recName: `Person ${i + 1}`,
      recRole: 'Member',
      imgUrl: '',
    }))
    mockEmpathy.postCards = cards

    const wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.emp-load-more').exists()).toBe(false)
  })

  it('opens the specific post detail on card click', async () => {
    mockEmpathy.postCards = [
      { id: 'post1', channelId: 'EMP01', recName: 'Alice', recRole: 'Dev', imgUrl: '', commentCount: 2, likeCount: 5 },
    ]

    const wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    const card = wrapper.findComponent({ name: 'EmpathyCard' })
    await card.trigger('click')

    expect(mockUi._empPreselect).toEqual({ postId: 'EMP01', realPostId: 'post1' })
    expect(mockUi.openModal).toHaveBeenCalledWith('modal-emp')
  })
})
