import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import AdminBirthdaysView from '../../../views/admin/AdminBirthdaysView.vue'

const employees = [
  { id: 'emp1', name: 'Alice', role: 'Developer', bdDate: '14 ก.ค.', monthIdx: '6', fallbackIdx: '0' },
  { id: 'emp2', name: 'Bob', role: 'Designer', bdDate: '5 ม.ค.', monthIdx: '0', fallbackIdx: '1' },
  { id: 'emp3', name: 'Charlie', role: 'Manager', bdDate: '', monthIdx: '', fallbackIdx: '' },
]

const { uiStore, adminService } = vi.hoisted(() => ({
  uiStore: {
    closeModal: vi.fn(),
    openModal: vi.fn(),
  },
  adminService: {
    getEmployees: vi.fn(() => Promise.resolve(employees)),
    updateRow: vi.fn(() => Promise.resolve()),
  },
}))

vi.mock('../../../core/services/adminService.js', () => ({
  getEmployees: vi.fn(() => adminService.getEmployees()),
  updateRow: vi.fn(() => adminService.updateRow()),
}))

vi.mock('../../../core/stores/ui.js', () => ({
  useUiStore: vi.fn(() => uiStore),
}))

vi.mock('../../../views/admin/AdminPageHeader.vue', () => ({
  default: { name: 'AdminPageHeader', template: '<div class="mock-page-header"><slot /></div>' },
}))

vi.mock('../../../shared/components/BaseModal.vue', () => ({
  default: { name: 'BaseModal', template: '<div class="mock-modal"><slot /></div>' },
}))

vi.mock('../../../shared/components/SkeletonCard.vue', () => ({
  default: { name: 'SkeletonCard', template: '<div class="mock-skeleton" />' },
}))

vi.mock('../../../shared/components/EmptyState.vue', () => ({
  default: { name: 'EmptyState', template: '<div class="mock-empty"><slot /></div>' },
}))

describe('AdminBirthdaysView', () => {
  beforeEach(() => {
    adminService.getEmployees.mockClear()
    adminService.getEmployees.mockResolvedValue(employees)
    adminService.updateRow.mockClear()
    adminService.updateRow.mockResolvedValue()
    uiStore.closeModal.mockClear()
    uiStore.openModal.mockClear()
  })

  async function createWrapper() {
    const wrapper = shallowMount(AdminBirthdaysView)
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    return wrapper
  }

  it('renders page header with birthday title', async () => {
    const wrapper = await createWrapper()
    expect(wrapper.text()).toContain('วันเกิด')
  })

  it('shows employee list after loading', async () => {
    const wrapper = await createWrapper()
    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('Bob')
    expect(wrapper.text()).toContain('Charlie')
  })

  it('shows birthday month for employees with bdDate', async () => {
    const wrapper = await createWrapper()
    expect(wrapper.text()).toContain('ก.ค.')
    expect(wrapper.text()).toContain('ม.ค.')
  })

  it('shows birthday count', async () => {
    const wrapper = await createWrapper()
    expect(wrapper.text()).toContain('2')
  })

  it('shows role for each employee', async () => {
    const wrapper = await createWrapper()
    expect(wrapper.text()).toContain('Developer')
    expect(wrapper.text()).toContain('Designer')
    expect(wrapper.text()).toContain('Manager')
  })

  it('shows action buttons for editing birthdays', async () => {
    const wrapper = await createWrapper()
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThanOrEqual(3)
  })
})
