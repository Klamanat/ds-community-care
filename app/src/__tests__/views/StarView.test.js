import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import StarView from '../../views/StarView.vue'

// Mock IntersectionObserver used by useFadeIn
vi.stubGlobal('IntersectionObserver', vi.fn(() => ({ observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() })))

const teamStore = {
  sgMembers: [{ id: 1, name: 'Alice', role: 'star', imgUrl: '', starGangRole: 'Leader' }],
  isLoading: false,
  joinCount: 5,
  getGrad: vi.fn(() => 'linear-gradient(135deg, #FFD700, #FFA500)'),
  loadStarGang: vi.fn(),
  joinStarGang: vi.fn(),
}

vi.mock('../../core/stores/ui.js', () => ({ useUiStore: vi.fn(() => ({ showToast: vi.fn() })) }))
vi.mock('../../core/stores/userAuth.js', () => ({ useUserAuthStore: vi.fn(() => ({ userName: 'Alice', userId: '42', userRole: 'developer' })) }))
vi.mock('../../features/team/team.store.js', () => ({
  useTeamStore: vi.fn(() => teamStore),
}))

describe('StarView', () => {
  beforeEach(() => {
    teamStore.sgMembers = [{ id: 1, name: 'Alice', role: 'star', imgUrl: '', starGangRole: 'Leader' }]
    teamStore.isLoading = false
    teamStore.joinCount = 5
  })

  function createWrapper() {
    return shallowMount(StarView)
  }

  it('renders Star Gang header', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Star Gang')
    expect(wrapper.text()).toContain('พนักงานดาวเด่นประจำเดือน')
  })

  it('shows member cards', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('Leader')
  })

  it('shows loading state', () => {
    teamStore.isLoading = true
    teamStore.sgMembers = []
    const wrapper = shallowMount(StarView)
    expect(wrapper.text()).toContain('กำลังโหลด')
  })

  it('shows empty state when no members', () => {
    teamStore.isLoading = false
    teamStore.sgMembers = []
    const wrapper = shallowMount(StarView)
    expect(wrapper.text()).toContain('ยังไม่มีสมาชิก Star Gang')
  })
})
