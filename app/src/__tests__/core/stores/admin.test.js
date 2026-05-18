import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// ── Mocks ─────────────────────────────────────────────────────────────

vi.mock('../../../core/services/supabase.js', () => {
  const mockGetSession = vi.fn(() => Promise.resolve({ data: { session: null } }))
  const mockOnAuthStateChange = vi.fn(() => ({ unsubscribe: vi.fn() }))
  const mockSignOut = vi.fn()

  const authChain = {
    getSession: mockGetSession,
    onAuthStateChange: mockOnAuthStateChange,
    signOut: mockSignOut,
  }
  const chain = () => chain
  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.maybeSingle = vi.fn(() => chain)
  chain.from = vi.fn(() => chain)
  chain.auth = authChain

  return {
    supabase: chain,
    __mockGetSession: mockGetSession,
    __mockOnAuthStateChange: mockOnAuthStateChange,
    __mockSignOut: mockSignOut,
  }
})

const mockLogin = vi.fn()
vi.mock('../../../core/services/adminService.js', () => ({
  login: mockLogin,
}))

// ── Helper ─────────────────────────────────────────────────────────────

async function importStore() {
  vi.resetModules()
  return import('../../../core/stores/admin.js')
}

describe('admin store', () => {
  let useAdminStore

  beforeEach(async () => {
    localStorage.clear()
    setActivePinia(createPinia())
    useAdminStore = (await importStore()).useAdminStore
    vi.clearAllMocks()
  })

  // ── Initial state ───────────────────────────────────────────────────

  describe('initial state', () => {
    it('has empty adminName and error, isLoading false when localStorage is empty', () => {
      const store = useAdminStore()
      expect(store.adminName).toBe('')
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe('')
      expect(store.isAuthenticated).toBe(false)
    })

    it('reads adminName from localStorage when present', async () => {
      localStorage.setItem('admin_name', 'AdminUser')
      // Re-import so the store picks up the value
      useAdminStore = (await importStore()).useAdminStore
      const store = useAdminStore()
      expect(store.adminName).toBe('AdminUser')
      expect(store.isAuthenticated).toBe(true)
    })
  })

  // ── login ───────────────────────────────────────────────────────────

  describe('login', () => {
    it('calls service and saves name to localStorage on success', async () => {
      mockLogin.mockResolvedValue({ name: 'Big Boss' })
      const store = useAdminStore()
      const result = await store.login('boss', 'secret')

      expect(mockLogin).toHaveBeenCalledWith('boss', 'secret')
      expect(result).toBe(true)
      expect(store.adminName).toBe('Big Boss')
      expect(store.isLoading).toBe(false)
      expect(localStorage.getItem('admin_name')).toBe('Big Boss')
    })

    it('sets isLoading during the request', async () => {
      let resolveLogin
      mockLogin.mockReturnValue(new Promise((r) => { resolveLogin = r }))
      const store = useAdminStore()
      const promise = store.login('boss', 'pass')

      expect(store.isLoading).toBe(true)

      resolveLogin({ name: 'Boss' })
      await promise
      expect(store.isLoading).toBe(false)
    })

    it('sets error and returns false when login fails', async () => {
      mockLogin.mockRejectedValue(new Error('Wrong password'))
      const store = useAdminStore()
      const result = await store.login('boss', 'wrong')

      expect(result).toBe(false)
      expect(store.error).toBe('Wrong password')
      expect(store.isLoading).toBe(false)
      expect(store.adminName).toBe('')
    })
  })

  // ── logout ──────────────────────────────────────────────────────────

  describe('logout', () => {
    it('calls supabase.auth.signOut and clears everything', async () => {
      localStorage.setItem('admin_name', 'Big Boss')
      const { supabase } = await import('../../../core/services/supabase.js')

      const store = useAdminStore()
      store.adminName = 'Big Boss'
      await store.logout()

      expect(supabase.auth.signOut).toHaveBeenCalledTimes(1)
      expect(store.adminName).toBe('')
      expect(store.error).toBe('')
      expect(localStorage.getItem('admin_name')).toBeNull()
    })
  })

  // ── isAuthenticated ─────────────────────────────────────────────────

  describe('isAuthenticated', () => {
    it('returns true when adminName is set', () => {
      const store = useAdminStore()
      store.adminName = 'Admin'
      expect(store.isAuthenticated).toBe(true)
    })

    it('returns false when adminName is empty', () => {
      const store = useAdminStore()
      store.adminName = ''
      expect(store.isAuthenticated).toBe(false)
    })
  })

  // ── Session restore ─────────────────────────────────────────────────

  describe('session restore', () => {
    it('restores adminName from session if user metadata role is admin', async () => {
      const { supabase, __mockGetSession } = await import(
        '../../../core/services/supabase.js'
      )
      __mockGetSession.mockResolvedValue({
        data: {
          session: {
            user: {
              user_metadata: { role: 'admin', name: 'SessionAdmin' },
            },
          },
        },
      })

      useAdminStore = (await importStore()).useAdminStore
      const store = useAdminStore()

      // Wait for the async getSession to resolve
      await vi.waitFor(() => {
        expect(store.adminName).toBe('SessionAdmin')
      })
    })

    it('clears adminName if session user is not admin', async () => {
      localStorage.setItem('admin_name', 'OldAdmin')
      const { supabase, __mockGetSession } = await import(
        '../../../core/services/supabase.js'
      )
      __mockGetSession.mockResolvedValue({
        data: {
          session: {
            user: {
              user_metadata: { role: 'user', name: 'NormalUser' },
            },
          },
        },
      })

      useAdminStore = (await importStore()).useAdminStore
      const store = useAdminStore()

      await vi.waitFor(() => {
        expect(store.adminName).toBe('')
      })
      expect(localStorage.getItem('admin_name')).toBeNull()
    })
  })

  // ── Auth state change ───────────────────────────────────────────────

  describe('onAuthStateChange', () => {
    it('clears adminName when session becomes null', async () => {
      const { supabase, __mockOnAuthStateChange } = await import(
        '../../../core/services/supabase.js'
      )

      useAdminStore = (await importStore()).useAdminStore
      const store = useAdminStore()
      store.adminName = 'Admin'
      localStorage.setItem('admin_name', 'Admin')

      // Get the callback registered by the store
      const callback = __mockOnAuthStateChange.mock.calls[0][0]

      // Simulate sign-out event
      callback('SIGNED_OUT', null)

      expect(store.adminName).toBe('')
      expect(localStorage.getItem('admin_name')).toBeNull()
    })
  })
})
