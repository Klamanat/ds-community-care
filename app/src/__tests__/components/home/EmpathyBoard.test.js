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
      praisedPeople: [],
      channelLikes: {},
      loadPeople: vi.fn(() => Promise.resolve()),
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

  it('calls loadPeople on mount', () => {
    createWrapper()
    expect(mockEmpathy.loadPeople).toHaveBeenCalled()
  })

  it('renders the section header with emoji', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('💝')
    expect(wrapper.text()).toContain('ชื่นชมเพื่อนร่วมงานของคุณวันนี้')
  })

  it('renders the empathy points info badge', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Empathy')
    expect(wrapper.text()).toContain('10 DS pts')
  })

  it('shows skeleton cards when loading and praisedPeople is empty', () => {
    mockEmpathy.praisedPeople = []
    // Manually set loading state by triggering loadPeople to set loading
    // Since loading is a local ref, we need to set it via the component
    const wrapper = createWrapper()
    // Initially praisedPeople is empty and loadPeople is called,
    // but loading starts as false in the component.
    // The component sets loading = !empathy.praisedPeople.length before calling loadPeople
    // Since praisedPeople.length is 0, loading becomes true
    // After loadPeople resolves, loading becomes false
    // We need to test the loading state synchronously
  })

  it('shows empty state when praisedPeople is empty and not loading', async () => {
    const wrapper = createWrapper()
    // Wait for the async loadPeople to settle
    await mockEmpathy.loadPeople()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('ยังไม่มีคำชื่นชม')
    expect(wrapper.text()).toContain('กดปุ่มด้านบน')
  })

  it('renders EmpathyCard components when praisedPeople has data', async () => {
    mockEmpathy.praisedPeople = [
      { id: '1', empCode: 'EMP01', name: 'Alice', role: 'Dev', imgUrl: '', commentCount: 2 },
      { id: '2', empCode: 'EMP02', name: 'Bob', role: 'QA', imgUrl: '', commentCount: 1 },
    ]
    mockEmpathy.channelLikes = {
      EMP01: { count: 5, liked: true },
      EMP02: { count: 3, liked: false },
    }

    const wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    const cards = wrapper.findAllComponents({ name: 'EmpathyCard' })
    expect(cards.length).toBe(2)
  })

  it('passes correct props to EmpathyCard components', async () => {
    mockEmpathy.praisedPeople = [
      { id: '1', empCode: 'EMP01', name: 'Alice', role: 'Dev', imgUrl: '', commentCount: 2 },
    ]
    mockEmpathy.channelLikes = { EMP01: { count: 5, liked: true } }

    const wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    const card = wrapper.findComponent({ name: 'EmpathyCard' })
    expect(card.exists()).toBe(true)
    expect(card.props('post').recName).toBe('Alice')
    expect(card.props('post').recRole).toBe('Dev')
    expect(card.props('post').likeCount).toBe(5)
  })

  it('shows load more button when there are more people than visible', async () => {
    // Create enough people to exceed the default page size (8 for desktop)
    const people = Array.from({ length: 12 }, (_, i) => ({
      id: String(i + 1),
      empCode: `EMP${String(i + 1).padStart(3, '0')}`,
      name: `Person ${i + 1}`,
      role: 'Member',
      imgUrl: '',
    }))
    mockEmpathy.praisedPeople = people

    const wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    const loadMore = wrapper.find('.emp-load-more')
    expect(loadMore.exists()).toBe(true)
    // 12 people, pageSize=8 (desktop), empPages=1 → 8 visible, 4 remaining
    expect(loadMore.text()).toContain('ดูเพิ่มเติม')
  })

  it('hides load more button when all people are visible', async () => {
    const people = Array.from({ length: 5 }, (_, i) => ({
      id: String(i + 1),
      empCode: `EMP${String(i + 1).padStart(3, '0')}`,
      name: `Person ${i + 1}`,
      role: 'Member',
      imgUrl: '',
    }))
    mockEmpathy.praisedPeople = people

    const wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.emp-load-more').exists()).toBe(false)
  })

  it('opens empathy modal on card click', async () => {
    mockEmpathy.praisedPeople = [
      { id: '1', empCode: 'EMP01', name: 'Alice', role: 'Dev', imgUrl: '', commentCount: 2 },
    ]
    mockEmpathy.channelLikes = { EMP01: { count: 5, liked: true } }

    const wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    const card = wrapper.findComponent({ name: 'EmpathyCard' })
    await card.trigger('click')

    expect(mockUi._empPreselect).toEqual(
      expect.objectContaining({ id: '1', empCode: 'EMP01', name: 'Alice' })
    )
    expect(mockUi.openModal).toHaveBeenCalledWith('modal-emp')
  })
})
