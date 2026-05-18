import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import ActivityTicketsView from '../../views/ActivityTicketsView.vue'

// Mock IntersectionObserver used by useFadeIn
vi.stubGlobal('IntersectionObserver', vi.fn(() => ({ observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() })))

const mockGetMyTickets = vi.hoisted(() => vi.fn())

vi.mock('../../core/stores/ui.js', () => ({ useUiStore: vi.fn(() => ({ currentUser: { id: '42' }, openModal: vi.fn(), ticketActivity: null })) }))
vi.mock('../../features/activities/activitiesService.js', () => ({ getMyTickets: mockGetMyTickets }))

describe('ActivityTicketsView', () => {
  beforeEach(() => {
    mockGetMyTickets.mockReset()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function createWrapper() {
    return shallowMount(ActivityTicketsView)
  }

  it('renders the tickets header', () => {
    mockGetMyTickets.mockImplementation(() => Promise.resolve([]))
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('ตั๋วของฉัน')
  })

  it('renders tab filters', () => {
    mockGetMyTickets.mockImplementation(() => Promise.resolve([]))
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('ทั้งหมด')
    expect(wrapper.text()).toContain('ใช้งานได้')
    expect(wrapper.text()).toContain('ผ่านไปแล้ว')
  })

  it('shows empty state when no tickets', async () => {
    mockGetMyTickets.mockImplementation(() => Promise.resolve([]))
    const wrapper = createWrapper()
    await vi.runAllTimersAsync()
    // Default tab is 'all' which shows this message
    expect(wrapper.text()).toContain('ยังไม่มีตั๋วที่จอง')
  })

  it('renders ticket cards when tickets exist', async () => {
    mockGetMyTickets.mockImplementation(() => Promise.resolve([
      { id: 1, activityName: 'Test Activity', activityEmoji: '📅', status: 'booked', activityDate: '2026-06-01', activityLoc: 'Office', ticketNo: 'T001', quantity: 1 },
    ]))
    const wrapper = shallowMount(ActivityTicketsView)
    await vi.runAllTimersAsync()
    expect(wrapper.text()).toContain('Test Activity')
    expect(wrapper.text()).toContain('T001')
  })

  it('shows loading state initially', () => {
    // Don't resolve the promise to keep loading true
    mockGetMyTickets.mockImplementation(() => new Promise(() => {}))
    const wrapper = createWrapper()
    const skeletons = wrapper.findAll('.tv-skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})
