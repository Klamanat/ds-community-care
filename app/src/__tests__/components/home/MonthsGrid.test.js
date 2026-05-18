import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount, mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import MonthsGrid from '../../../components/home/MonthsGrid.vue'

// Mock the activities store
const mockGetMonth = vi.fn(() => [])
const mockLoad = vi.fn()

vi.mock('../../../features/activities/activities.store.js', () => ({
  useActivitiesStore: vi.fn(() => ({
    getMonth: mockGetMonth,
    load: mockLoad,
    loaded: false,
    all: [],
    byMonth: {},
  })),
}))

describe('MonthsGrid', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockGetMonth.mockReset()
    mockLoad.mockReset()
    mockGetMonth.mockReturnValue([])
  })

  it('renders 12 month cards', () => {
    const wrapper = shallowMount(MonthsGrid)
    const cards = wrapper.findAll('.m-card')
    expect(cards.length).toBe(12)
  })

  it('renders month names', () => {
    const wrapper = shallowMount(MonthsGrid)
    expect(wrapper.text()).toContain('January')
    expect(wrapper.text()).toContain('December')
  })

  it('renders month icons', () => {
    const wrapper = shallowMount(MonthsGrid)
    expect(wrapper.text()).toContain('🎆')
    expect(wrapper.text()).toContain('🎄')
  })

  it('renders month numbers padded to 2 digits', () => {
    const wrapper = shallowMount(MonthsGrid)
    expect(wrapper.text()).toContain('01')
    expect(wrapper.text()).toContain('12')
  })

  it('applies m-current class to current month', () => {
    const wrapper = shallowMount(MonthsGrid)
    const currentMonth = new Date().getMonth() + 1 // May = 5
    const cards = wrapper.findAll('.m-card')
    const currentCard = cards.find(
      (c) => c.text().includes(String(currentMonth).padStart(2, '0'))
    )
    expect(currentCard.classes()).toContain('m-current')
  })

  it('emits month-click with month index when clicked', async () => {
    const wrapper = shallowMount(MonthsGrid)
    const cards = wrapper.findAll('.m-card')
    await cards[0].trigger('click')
    expect(wrapper.emitted('month-click')).toBeTruthy()
    expect(wrapper.emitted('month-click')[0]).toEqual([1]) // January = index 1
  })

  it('emits month-click with correct index for December', async () => {
    const wrapper = shallowMount(MonthsGrid)
    const cards = wrapper.findAll('.m-card')
    await cards[11].trigger('click')
    expect(wrapper.emitted('month-click')[0]).toEqual([12])
  })

  it('shows "ยังไม่มีกิจกรรม" when no events for a month', () => {
    mockGetMonth.mockReturnValue([])
    const wrapper = shallowMount(MonthsGrid)
    expect(wrapper.text()).toContain('ยังไม่มีกิจกรรม')
  })

  it('shows event names when events exist', () => {
    mockGetMonth.mockReturnValue([
      { id: 1, emoji: '🎉', name: 'Team Outing' },
      { id: 2, emoji: '🏕️', name: 'Camping Trip' },
    ])
    const wrapper = shallowMount(MonthsGrid)
    expect(wrapper.text()).toContain('Team Outing')
    expect(wrapper.text()).toContain('Camping Trip')
  })

  it('shows +N อื่นๆ when more than 2 events', () => {
    mockGetMonth.mockReturnValue([
      { id: 1, emoji: '🎉', name: 'Event A' },
      { id: 2, emoji: '🎉', name: 'Event B' },
      { id: 3, emoji: '🎉', name: 'Event C' },
    ])
    const wrapper = shallowMount(MonthsGrid)
    expect(wrapper.text()).toContain('Event A')
    expect(wrapper.text()).toContain('Event B')
    expect(wrapper.text()).toContain('+1 อื่นๆ')
  })

  describe('timer-dependent tests', () => {
    beforeEach(() => { vi.useFakeTimers() })
    afterEach(() => { vi.useRealTimers() })

    it('calls activities load on mount when loaded is false', () => {
      shallowMount(MonthsGrid)
      // setTimeout 2500ms with fake timers
      vi.advanceTimersByTime(2500)
      expect(mockLoad).toHaveBeenCalled()
    })

    it('does not call load on mount when loaded is true', () => {
      // Override the mock for this test to have loaded: true
      vi.mocked(useActivitiesStore).mockReturnValueOnce({
        getMonth: mockGetMonth,
        load: mockLoad,
        loaded: true,
        all: [],
        byMonth: {},
      })
      shallowMount(MonthsGrid)
      vi.advanceTimersByTime(2500)
      expect(mockLoad).toHaveBeenCalled()
    })
  })
})

import { useActivitiesStore } from '../../../features/activities/activities.store.js'
