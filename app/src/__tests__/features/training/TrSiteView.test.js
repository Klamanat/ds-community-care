import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import TrSiteView from '../../../features/training/training/TrSiteView.vue'

const { trainingStore, userAuthStore } = vi.hoisted(() => ({
  trainingStore: {
    siteVisits: [
      { id: 'sv1', title: 'Site Visit A', description: 'Visit factory A', instructor: 'HR Team', color: '#0EA5E9', voteCount: 5 },
      { id: 'sv2', title: 'Site Visit B', description: 'Visit office B', instructor: 'Ops Team', color: '#10B981', voteCount: 3 },
    ],
    mySiteVoteIds: ['sv1'],
    mySuggestion: null,
    isSiteVoted: vi.fn((id) => id === 'sv1'),
    voteSite: vi.fn(),
    cancelSiteVote: vi.fn(),
    loadMySuggestion: vi.fn(),
  },
  userAuthStore: {
    userName: 'TestUser',
    empCode: 'EMP001',
  },
}))

vi.mock('../../../features/training/training.store.js', () => ({
  useTrainingStore: vi.fn(() => trainingStore),
}))

vi.mock('../../../core/stores/userAuth.js', () => ({
  useUserAuthStore: vi.fn(() => userAuthStore),
}))

vi.mock('../../../features/training/trainingService.js', () => ({
  cancelSiteSuggestion: vi.fn(),
  submitSiteSuggestion: vi.fn(),
}))

describe('TrSiteView', () => {
  beforeEach(() => {
    trainingStore.siteVisits = [
      { id: 'sv1', title: 'Site Visit A', description: 'Visit factory A', instructor: 'HR Team', color: '#0EA5E9', voteCount: 5 },
      { id: 'sv2', title: 'Site Visit B', description: 'Visit office B', instructor: 'Ops Team', color: '#10B981', voteCount: 3 },
    ]
    trainingStore.mySiteVoteIds = ['sv1']
    trainingStore.mySuggestion = null
    trainingStore.isSiteVoted = vi.fn((id) => id === 'sv1')
    trainingStore.voteSite.mockClear()
    trainingStore.cancelSiteVote.mockClear()
    trainingStore.loadMySuggestion.mockClear()
    userAuthStore.userName = 'TestUser'
    userAuthStore.empCode = 'EMP001'
  })

  function createWrapper() {
    return shallowMount(TrSiteView)
  }

  it('renders site visits', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Site Visit A')
    expect(wrapper.text()).toContain('Site Visit B')
  })

  it('shows site descriptions', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Visit factory A')
    expect(wrapper.text()).toContain('Visit office B')
  })

  it('shows instructor names', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('HR Team')
    expect(wrapper.text()).toContain('Ops Team')
  })

  it('shows vote counts', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('5')
    expect(wrapper.text()).toContain('3')
  })

  it('shows vote buttons', () => {
    const wrapper = createWrapper()
    const buttons = wrapper.findAll('.tr-sv-btn')
    expect(buttons.length).toBeGreaterThanOrEqual(2)
  })

  it('marks already-voted sites', () => {
    const wrapper = createWrapper()
    const votedCards = wrapper.findAll('.tr-sv-card--voted')
    expect(votedCards.length).toBeGreaterThanOrEqual(1)
  })

  it('shows "อื่นๆ" (other) card for suggestions', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('อื่นๆ')
    expect(wrapper.text()).toContain('เสนอสถานที่')
  })

  it('shows empty state when no site visits', () => {
    trainingStore.siteVisits = []
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('ยังไม่มีข้อมูล')
  })

  it('shows the other suggestion textarea', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.tr-sv-other-input').exists()).toBe(true)
  })

  it('calls loadMySuggestion on mount with empCode', () => {
    createWrapper()
    expect(trainingStore.loadMySuggestion).toHaveBeenCalledTimes(1)
    expect(trainingStore.loadMySuggestion).toHaveBeenCalledWith('EMP001')
  })

  it('shows "โหวตแล้ว" text on already voted button', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('โหวตแล้ว')
  })

  it('shows "โหวต" text on non-voted button', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('โหวต')
  })

  it('shows bar with gradient style', () => {
    const wrapper = createWrapper()
    const bars = wrapper.findAll('.tr-sv-bar')
    expect(bars.length).toBeGreaterThanOrEqual(2)
  })
})
