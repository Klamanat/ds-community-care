import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// ── Mock functions ──────────────────────────────────────────────────

const mockLogin = vi.fn()
const mockCheckEmployee = vi.fn()
const mockSetPasscode = vi.fn()
const mockFetchMyEmployee = vi.fn()
const mockFetchImages = vi.fn()
const mockGetCached = vi.fn()
const mockFetchAllEmployees = vi.fn()
const mockSignOut = vi.fn()

vi.mock('../../../core/services/userAuthService.js', () => ({
  login: mockLogin,
  checkEmployee: mockCheckEmployee,
  setPasscode: mockSetPasscode,
  fetchMyEmployee: mockFetchMyEmployee,
}))
vi.mock('../../../core/services/imageService.js', () => ({
  fetchImages: mockFetchImages,
  getCached: mockGetCached,
}))
vi.mock('../../../features/team/teamService.js', () => ({
  fetchAllEmployees: mockFetchAllEmployees,
}))
vi.mock('../../../core/services/supabase.js', () => ({
  supabase: { auth: { signOut: mockSignOut } },
}))

// ── Helper ──────────────────────────────────────────────────────────

async function importStore() {
  vi.resetModules()
  return import('../../../core/stores/userAuth.js')
}

// ── Tests ───────────────────────────────────────────────────────────

describe('userAuth store', () => {
  async function createStore() {
    const mod = await importStore()
    return mod.useUserAuthStore()
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockFetchImages.mockResolvedValue({})
    mockGetCached.mockReturnValue('')
    mockFetchAllEmployees.mockResolvedValue([])
  })

  // ── 1. Initial state ─────────────────────────────────────────────

  it('should have initial state with empty localStorage', async () => {
    localStorage.clear()
    const store = await createStore()

    expect(store.userId).toBe('')
    expect(store.userEmpCode).toBe('')
    expect(store.userName).toBe('')
    expect(store.userRole).toBe('')
    expect(store.userImgId).toBe('')
    expect(store.userImgUrl).toBe('')
    expect(store.userDept).toBe('')
    expect(store.userSlogan).toBe('')
    expect(store.userBdDate).toBe('')
    expect(store.isLoading).toBe(false)
    expect(store.error).toBe('')
    expect(store.isAuthenticated).toBe(false)
  })

  it('should read values from localStorage on init', async () => {
    localStorage.clear()
    localStorage.setItem('user_id', '42')
    localStorage.setItem('user_empcode', 'EMP001')
    localStorage.setItem('user_name', 'Test User')
    localStorage.setItem('user_role', 'dev')
    localStorage.setItem('user_imgid', 'img1')
    localStorage.setItem('user_img', 'https://example.com/avatar.jpg')
    localStorage.setItem('user_dept', 'DS')
    localStorage.setItem('user_slogan', 'Go team')
    localStorage.setItem('user_bddate', '1990-01-01')

    const store = await createStore()

    expect(store.userId).toBe('42')
    expect(store.userEmpCode).toBe('EMP001')
    expect(store.userName).toBe('Test User')
    expect(store.userRole).toBe('dev')
    expect(store.userImgId).toBe('img1')
    expect(store.userImgUrl).toBe('https://example.com/avatar.jpg')
    expect(store.userDept).toBe('DS')
    expect(store.userSlogan).toBe('Go team')
    expect(store.userBdDate).toBe('1990-01-01')
    expect(store.isAuthenticated).toBe(true)
  })

  // ── 2. checkEmployee delegates to service ─────────────────────────

  it('checkEmployee should delegate to service', async () => {
    const store = await createStore()
    mockCheckEmployee.mockResolvedValue({ exists: true })
    const result = await store.checkEmployee('EMP001')
    expect(mockCheckEmployee).toHaveBeenCalledWith('EMP001')
    expect(result).toEqual({ exists: true })
  })

  // ── 3. setPasscode success / failure ──────────────────────────────

  it('setPasscode should succeed', async () => {
    const store = await createStore()
    mockSetPasscode.mockResolvedValue(true)
    const result = await store.setPasscode('EMP001', '1234')
    expect(mockSetPasscode).toHaveBeenCalledWith('EMP001', '1234')
    expect(result).toBe(true)
    expect(store.isLoading).toBe(false)
    expect(store.error).toBe('')
  })

  it('setPasscode should handle failure', async () => {
    const store = await createStore()
    mockSetPasscode.mockRejectedValue(new Error('Invalid code'))
    const result = await store.setPasscode('EMP001', 'wrong')
    expect(result).toBe(false)
    expect(store.error).toBe('Invalid code')
    expect(store.isLoading).toBe(false)
  })

  // ── 4. loginWithEmployee success (persists to localStorage) ───────

  it('loginWithEmployee should persist all fields to localStorage', async () => {
    const store = await createStore()
    mockLogin.mockResolvedValue({
      id: 42,
      emp_code: 'EMP001',
      name: 'Test User',
      role: 'dev',
      dept: 'DS',
      star_gang_slogan: 'Go team',
      bd_date: '1990-01-01',
      img_id: 'img1',
      img_url: 'https://example.com/avatar.jpg',
    })

    const result = await store.loginWithEmployee(42, '1234')

    expect(result).toBe(true)
    expect(store.userId).toBe('42')
    expect(store.userEmpCode).toBe('EMP001')
    expect(store.userName).toBe('Test User')
    expect(store.userRole).toBe('dev')
    expect(store.userDept).toBe('DS')
    expect(store.userSlogan).toBe('Go team')
    expect(store.userBdDate).toBe('1990-01-01')
    expect(store.userImgId).toBe('img1')
    expect(store.userImgUrl).toBe('https://example.com/avatar.jpg')

    // Verify localStorage persistence
    expect(localStorage.getItem('user_id')).toBe('42')
    expect(localStorage.getItem('user_empcode')).toBe('EMP001')
    expect(localStorage.getItem('user_name')).toBe('Test User')
    expect(localStorage.getItem('user_role')).toBe('dev')
    expect(localStorage.getItem('user_dept')).toBe('DS')
    expect(localStorage.getItem('user_slogan')).toBe('Go team')
    expect(localStorage.getItem('user_bddate')).toBe('1990-01-01')
    expect(localStorage.getItem('user_imgid')).toBe('img1')
    expect(localStorage.getItem('user_img')).toBe('https://example.com/avatar.jpg')
  })

  it('loginWithEmployee should persist with camelCase keys', async () => {
    const store = await createStore()
    mockLogin.mockResolvedValue({
      id: 7,
      empCode: 'EMP007',
      name: 'Camel User',
      role: 'designer',
      dept: 'UX',
      starGangSlogan: 'Design matters',
      bdDate: '1992-03-15',
      imgId: 'img7',
      imgUrl: 'https://example.com/camel.jpg',
    })

    const result = await store.loginWithEmployee(7)

    expect(result).toBe(true)
    expect(store.userId).toBe('7')
    expect(store.userEmpCode).toBe('EMP007')
    expect(store.userName).toBe('Camel User')
    expect(store.userRole).toBe('designer')
    expect(store.userDept).toBe('UX')
    expect(store.userSlogan).toBe('Design matters')
    expect(store.userBdDate).toBe('1992-03-15')
    expect(store.userImgId).toBe('img7')
    expect(store.userImgUrl).toBe('https://example.com/camel.jpg')
  })

  // ── 5. loginWithEmployee failure ──────────────────────────────────

  it('loginWithEmployee should set error on failure', async () => {
    const store = await createStore()
    mockLogin.mockRejectedValue(new Error('Invalid credentials'))
    const result = await store.loginWithEmployee(42, 'wrong')
    expect(result).toBe(false)
    expect(store.error).toBe('Invalid credentials')
    expect(store.isLoading).toBe(false)
  })

  // ── 6. loginWithEmployee makes isAuthenticated true ───────────────

  it('loginWithEmployee should make isAuthenticated true', async () => {
    localStorage.clear()
    const store = await createStore()
    mockLogin.mockResolvedValue({ id: 1, emp_code: 'EMP001', name: 'User' })
    expect(store.isAuthenticated).toBe(false)
    const result = await store.loginWithEmployee(1)
    expect(result).toBe(true)
    expect(store.isAuthenticated).toBe(true)
  })

  // ── 7. logout calls signOut and clears localStorage ────────────────

  it('logout should call signOut and clear all state', async () => {
    const store = await createStore()
    // Set up logged-in state
    mockLogin.mockResolvedValue({
      id: 1,
      emp_code: 'EMP001',
      name: 'User',
      role: 'dev',
      dept: 'DS',
    })
    await store.loginWithEmployee(1)
    expect(store.isAuthenticated).toBe(true)
    expect(localStorage.getItem('user_id')).toBe('1')

    // Logout
    await store.logout()

    expect(mockSignOut).toHaveBeenCalledTimes(1)
    expect(store.userId).toBe('')
    expect(store.userEmpCode).toBe('')
    expect(store.userName).toBe('')
    expect(store.userRole).toBe('')
    expect(store.userImgId).toBe('')
    expect(store.userImgUrl).toBe('')
    expect(store.userDept).toBe('')
    expect(store.userSlogan).toBe('')
    expect(store.userBdDate).toBe('')
    expect(store.isAuthenticated).toBe(false)

    // All keys removed from localStorage
    expect(localStorage.getItem('user_id')).toBeNull()
    expect(localStorage.getItem('user_empcode')).toBeNull()
    expect(localStorage.getItem('user_name')).toBeNull()
    expect(localStorage.getItem('user_role')).toBeNull()
    expect(localStorage.getItem('user_imgid')).toBeNull()
    expect(localStorage.getItem('user_img')).toBeNull()
    expect(localStorage.getItem('user_dept')).toBeNull()
    expect(localStorage.getItem('user_slogan')).toBeNull()
    // Extra keys cleared by logout (note: user_bddate is not in the removal list)
    expect(localStorage.getItem('dsc_ann_seen')).toBeNull()
    expect(localStorage.getItem('ds_checkin_date')).toBeNull()
  })

  // ── 8. refreshFromServer ─────────────────────────────────────────

  it('refreshFromServer should update store from server', async () => {
    const store = await createStore()
    mockFetchMyEmployee.mockResolvedValue({
      id: 42,
      name: 'Refreshed Name',
      role: 'senior',
      dept: 'DS',
      star_gang_slogan: 'New slogan',
      bd_date: '1990-06-15',
      emp_code: 'EMP001',
    })

    await store.refreshFromServer()

    expect(store.userId).toBe('42')
    expect(store.userName).toBe('Refreshed Name')
    expect(store.userRole).toBe('senior')
    expect(store.userDept).toBe('DS')
    expect(store.userSlogan).toBe('New slogan')
    expect(store.userBdDate).toBe('1990-06-15')
    expect(store.userEmpCode).toBe('EMP001')

    // Verify localStorage updated
    expect(localStorage.getItem('user_role')).toBe('senior')
    expect(localStorage.getItem('user_name')).toBe('Refreshed Name')
    expect(localStorage.getItem('user_dept')).toBe('DS')
    expect(localStorage.getItem('user_slogan')).toBe('New slogan')
  })

  it('refreshFromServer should handle null employee silently', async () => {
    const store = await createStore()
    mockFetchMyEmployee.mockResolvedValue(null)
    await expect(store.refreshFromServer()).resolves.toBeUndefined()
  })

  it('refreshFromServer should handle errors silently', async () => {
    const store = await createStore()
    mockFetchMyEmployee.mockRejectedValue(new Error('Network error'))
    await expect(store.refreshFromServer()).resolves.toBeUndefined()
  })

  // ── 9. Background profile sync triggers after 5s ──────────────────

  it('should trigger background profile sync after 5s', async () => {
    vi.useFakeTimers()
    localStorage.clear()
    localStorage.setItem('user_id', '42')
    localStorage.setItem('user_name', 'Old Name')
    localStorage.setItem('user_role', '')
    localStorage.setItem('user_dept', '')
    localStorage.setItem('user_slogan', '')
    localStorage.setItem('user_imgid', '')

    mockFetchAllEmployees.mockResolvedValue([
      { id: 42, name: 'New Name', role: 'dev', dept: 'DS', star_gang_slogan: '', img_id: '' },
    ])

    const store = await createStore()

    // Before timer fires, name should still be old
    expect(store.userName).toBe('Old Name')

    await vi.advanceTimersByTimeAsync(5000)

    // After timer, name should be updated
    expect(store.userName).toBe('New Name')
    expect(store.userRole).toBe('dev')
    expect(store.userDept).toBe('DS')

    vi.useRealTimers()
  })

  // ── 10. Background sync image fetch when data unchanged but image pending ──

  it('should fetch image when data unchanged but image pending', async () => {
    vi.useFakeTimers()
    localStorage.clear()
    localStorage.setItem('user_id', '42')
    localStorage.setItem('user_name', 'Same Name')
    localStorage.setItem('user_imgid', 'img99')
    // user_img is deliberately absent so userImgUrl starts empty

    mockFetchAllEmployees.mockResolvedValue([
      {
        id: 42,
        name: 'Same Name',
        role: '',
        dept: '',
        star_gang_slogan: '',
        img_id: 'img99',
      },
    ])
    mockGetCached.mockReturnValue('')
    mockFetchImages.mockResolvedValue({ img99: 'https://example.com/img99.jpg' })

    const store = await createStore()

    // Before timer fires, image URL is empty
    expect(store.userImgUrl).toBe('')
    expect(store.userImgId).toBe('img99')

    await vi.advanceTimersByTimeAsync(5000)

    // getCached was consulted
    expect(mockGetCached).toHaveBeenCalledWith('img99')
    // fetchImages was called with the pending imgId
    expect(mockFetchImages).toHaveBeenCalledWith(['img99'])
    // Image URL should be populated from the fetch
    expect(store.userImgUrl).toBe('https://example.com/img99.jpg')
    expect(localStorage.getItem('user_img')).toBe('https://example.com/img99.jpg')

    vi.useRealTimers()
  })

  // ── 11. login with imgId triggers lazy image fetch (lines 98-104) ──

  it('should lazy-fetch image on login when imgId present but no imgUrl', async () => {
    const store = await createStore()
    mockLogin.mockResolvedValue({
      id: 1,
      emp_code: 'EMP001',
      name: 'User',
      img_id: 'img42',
      // no img_url / imgUrl — triggers fetchImages in _persist
    })

    await store.loginWithEmployee(1)

    expect(mockFetchImages).toHaveBeenCalledWith(['img42'])
  })
})
