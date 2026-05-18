// Unit tests for core/services/userAuthService.js
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../core/services/supabase.js', () => {
  const chain = () => chain
  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.maybeSingle = vi.fn(() => chain)
  chain.rpc = vi.fn(() => chain)
  chain.from = vi.fn(() => chain)
  chain.auth = {
    getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
    signInAnonymously: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    signInWithPassword: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    signUp: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
  }
  return { supabase: chain }
})

// Mock supabase.auth
const mockSession = { data: { session: null } }
const mockSignIn = { data: { session: null }, error: null }
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn(() => ({ auth: { getSession: vi.fn(() => mockSession), signInAnonymously: vi.fn(() => mockSignIn), signInWithPassword: vi.fn(() => mockSignIn), signUp: vi.fn(() => mockSignIn) } })) }))

import { supabase } from '../../../core/services/supabase.js'
import { checkEmployee, setPasscode, login, fetchMyEmployee } from '../../../core/services/userAuthService.js'

describe('userAuthService', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('checkEmployee', () => {
    it('returns not_found when employee missing', async () => {
      supabase.from().select().eq().maybeSingle.mockResolvedValue({ data: null })
      const result = await checkEmployee('EMP01')
      expect(result.status).toBe('not_found')
      expect(result.exists).toBe(false)
    })

    it('returns no_passcode when passcode is null', async () => {
      supabase.from().select().eq().maybeSingle.mockResolvedValue({ data: { id: 1, passcode: null } })
      const result = await checkEmployee('EMP01')
      expect(result.status).toBe('no_passcode')
    })

    it('returns needs_setup when passcode is empty', async () => {
      supabase.from().select().eq().maybeSingle.mockResolvedValue({ data: { id: 1, passcode: '' } })
      const result = await checkEmployee('EMP01')
      expect(result.status).toBe('needs_setup')
    })

    it('returns has_passcode when passcode is set', async () => {
      supabase.from().select().eq().maybeSingle.mockResolvedValue({ data: { id: 1, passcode: 'hashed' } })
      const result = await checkEmployee('EMP01')
      expect(result.status).toBe('has_passcode')
    })
  })

  describe('setPasscode', () => {
    it('sets passcode successfully and returns true', async () => {
      supabase.rpc.mockResolvedValue({ data: true, error: null })
      supabase.auth.signUp.mockResolvedValue({ data: { session: null }, error: null })

      const result = await setPasscode('EMP01', '1234')
      expect(result).toBe(true)
      expect(supabase.rpc).toHaveBeenCalledWith('set_user_passcode', {
        p_emp_code: 'EMP01',
        p_passcode: '1234',
      })
    })

    it('throws when RPC returns error', async () => {
      supabase.rpc.mockResolvedValue({ data: null, error: new Error('RPC failed') })

      await expect(setPasscode('EMP01', '1234')).rejects.toThrow('RPC failed')
    })

    it('throws when RPC returns falsy data', async () => {
      supabase.rpc.mockResolvedValue({ data: false, error: null })

      await expect(setPasscode('EMP01', '1234')).rejects.toThrow('ไม่สามารถตั้งรหัสผ่านได้ กรุณาลองใหม่')
    })

    it('allows signUp failure (non-fatal) and still returns true', async () => {
      supabase.rpc.mockResolvedValue({ data: true, error: null })
      supabase.auth.signUp.mockResolvedValue({ data: null, error: new Error('Already registered') })
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const result = await setPasscode('EMP01', '1234')

      expect(result).toBe(true)
      expect(consoleWarn).toHaveBeenCalledWith(
        '[auth] signUp failed during setPasscode:',
        'Already registered',
      )
      consoleWarn.mockRestore()
    })

    it('links auth user when signUp returns a session', async () => {
      supabase.rpc.mockResolvedValue({ data: true, error: null })
      supabase.auth.signUp.mockResolvedValue({
        data: { session: { user: { id: 'auth-123' } } },
        error: null,
      })
      // link_auth_user RPC
      supabase.rpc.mockResolvedValue({ data: true, error: null })

      const result = await setPasscode('EMP01', '1234')

      expect(result).toBe(true)
      // Second rpc call should be link_auth_user
      expect(supabase.rpc).toHaveBeenCalledWith('link_auth_user', { p_emp_code: 'EMP01' })
    })
  })

  describe('login', () => {
    function makeEmp(overrides = {}) {
      return {
        id: 1,
        emp_code: 'EMP01',
        name: 'Alice',
        role: 'employee',
        dept: 'IT',
        img_url: 'https://img.test',
        img_id: null,
        star_gang_slogan: 'Go!',
        in_team: true,
        auth_user_id: null,
        passcode: null,
        ...overrides,
      }
    }

    it('throws generic error for missing employee', async () => {
      supabase.from().select().eq().maybeSingle.mockResolvedValue({ data: null })
      await expect(login('EMP01', 'pass')).rejects.toThrow('รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง')
    })

    it('throws generic error on select error', async () => {
      supabase.from().select().eq().maybeSingle.mockResolvedValue({ error: new Error('DB error'), data: null })

      await expect(login('EMP01', 'pass')).rejects.toThrow('DB error')
    })

    it('logs in employee without passcode via anonymous session', async () => {
      supabase.from().select().eq().maybeSingle.mockResolvedValue({ data: makeEmp() })
      supabase.auth.getSession.mockResolvedValue({ data: { session: null } })
      const result = await login('EMP01')
      expect(result.name).toBe('Alice')
      expect(supabase.auth.signInAnonymously).toHaveBeenCalled()
    })

    it('does not signInAnonymously when session already exists (no-passcode login)', async () => {
      supabase.from().select().eq().maybeSingle.mockResolvedValue({ data: makeEmp() })
      supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'anon' } } } })

      const result = await login('EMP01')
      expect(result.name).toBe('Alice')
      expect(supabase.auth.signInAnonymously).not.toHaveBeenCalled()
    })

    it('returns mapped employee data for no-passcode login', async () => {
      supabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: makeEmp({ img_url: 'drive:img_abc123' }),
      })
      const result = await login('EMP01')
      expect(result.empCode).toBe('EMP01')
      expect(result.name).toBe('Alice')
      expect(result.dept).toBe('IT')
      expect(result.role).toBe('employee')
      expect(result.slogan).toBe('Go!')
      // drive: URLs map to imgId, imgUrl is empty
      expect(result.imgId).toBe('img_abc123')
      expect(result.imgUrl).toBe('')
    })

    // ── Path A: auth_user_id set → signInWithPassword ──

    it('Path A: signs in with password when auth_user_id exists', async () => {
      supabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: makeEmp({ passcode: 'hashed', auth_user_id: 'auth-123' }),
      })
      supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: { id: 'auth-123' } }, error: null })

      const result = await login('EMP01', '1234')

      expect(result.name).toBe('Alice')
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'emp01@ds-community.internal',
        password: '1234',
      })
    })

    it('Path A: throws generic error when signInWithPassword fails', async () => {
      supabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: makeEmp({ passcode: 'hashed', auth_user_id: 'auth-123' }),
      })
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: new Error('Invalid credentials'),
      })

      await expect(login('EMP01', '1234')).rejects.toThrow('รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง')
    })

    // ── Path B: legacy (no auth_user_id) → verify_user_passcode RPC ──

    it('Path B: legacy login verifies via RPC and returns employee data', async () => {
      supabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: makeEmp({ passcode: 'hashed', auth_user_id: null }),
      })
      supabase.rpc.mockResolvedValue({ data: true, error: null })
      supabase.auth.getSession.mockResolvedValue({ data: { session: null } })

      const result = await login('EMP01', '1234')

      expect(result.name).toBe('Alice')
      expect(supabase.rpc).toHaveBeenCalledWith('verify_user_passcode', {
        p_emp_code: 'EMP01',
        p_passcode: '1234',
      })
      // Should attempt to create auth user in background
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'emp01@ds-community.internal',
        password: '1234',
      })
      // Should fallback to anonymous session
      expect(supabase.auth.signInAnonymously).toHaveBeenCalled()
    })

    it('Path B: throws RPC error when verify_user_passcode fails', async () => {
      supabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: makeEmp({ passcode: 'hashed', auth_user_id: null }),
      })
      supabase.rpc.mockResolvedValue({ data: null, error: new Error('RPC error') })

      await expect(login('EMP01', '1234')).rejects.toThrow('RPC error')
    })

    it('Path B: throws generic error when RPC returns falsy valid', async () => {
      supabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: makeEmp({ passcode: 'hashed', auth_user_id: null }),
      })
      supabase.rpc.mockResolvedValue({ data: false, error: null })

      await expect(login('EMP01', '1234')).rejects.toThrow('รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง')
    })

    it('Path B: uses existing session when already authenticated (no anonymous fallback)', async () => {
      supabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: makeEmp({ passcode: 'hashed', auth_user_id: null }),
      })
      supabase.rpc.mockResolvedValue({ data: true, error: null })
      supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'anon' } } } })

      const result = await login('EMP01', '1234')

      expect(result.name).toBe('Alice')
      // Should NOT call signInAnonymously because session already exists
      expect(supabase.auth.signInAnonymously).not.toHaveBeenCalled()
    })

    it('Path B: signUp with session triggers link_auth_user in background', async () => {
      supabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: makeEmp({ passcode: 'hashed', auth_user_id: null }),
      })
      supabase.rpc.mockResolvedValue({ data: true, error: null })
      // signUp returns a session → triggers link_auth_user
      supabase.auth.signUp.mockResolvedValue({
        data: { session: { user: { id: 'auth-123' } } },
        error: null,
      })
      supabase.auth.getSession.mockResolvedValue({ data: { session: null } })

      await login('EMP01', '1234')

      // The .then() callback should fire and call link_auth_user
      // Use vi.waitFor to let microtasks flush
      await vi.waitFor(() => {
        expect(supabase.rpc).toHaveBeenCalledWith('link_auth_user', { p_emp_code: 'EMP01' })
      })
    })

    // ── Edge cases in login return mapping ──

    it('handles emp fields with null img_url and null optional fields', async () => {
      supabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: makeEmp({
          passcode: null,
          img_url: null,
          img_id: null,
          name: null,
          role: null,
          dept: null,
          star_gang_slogan: null,
        }),
      })
      supabase.auth.getSession.mockResolvedValue({ data: { session: null } })

      const result = await login('EMP01', '')

      // Falsy img_url → rawUrl = '' → imgId = '' → imgUrl = ''
      expect(result.imgUrl).toBe('')
      expect(result.imgId).toBe('')
      // Falsy fields → fallback to ''
      expect(result.name).toBe('')
      expect(result.role).toBe('')
      expect(result.dept).toBe('')
      expect(result.slogan).toBe('')
    })

    it('handles regular http img_url (non-drive)', async () => {
      supabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: makeEmp({
          passcode: null,
          img_url: 'https://cdn.example.com/photo.jpg',
          img_id: 'manual-id-456',
        }),
      })
      supabase.auth.getSession.mockResolvedValue({ data: { session: null } })

      const result = await login('EMP01', '')

      // Regular URL → imgUrl = the url, imgId = from img_id
      expect(result.imgUrl).toBe('https://cdn.example.com/photo.jpg')
      expect(result.imgId).toBe('manual-id-456')
    })
  })

  describe('fetchMyEmployee', () => {
    it('returns null when no session', async () => {
      supabase.auth.getSession.mockResolvedValue({ data: { session: null } })

      const result = await fetchMyEmployee()
      expect(result).toBeNull()
    })

    it('returns null when RPC returns error', async () => {
      supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: '1' } } } })
      supabase.rpc.mockResolvedValue({ data: null, error: new Error('RPC error') })

      const result = await fetchMyEmployee()
      expect(result).toBeNull()
    })

    it('returns null when RPC returns empty array', async () => {
      supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: '1' } } } })
      supabase.rpc.mockResolvedValue({ data: [], error: null })

      const result = await fetchMyEmployee()
      expect(result).toBeNull()
    })

    it('returns employee data from RPC', async () => {
      supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: '1' } } } })
      const empData = { id: 1, emp_code: 'EMP01', name: 'Alice', role: 'employee' }
      supabase.rpc.mockResolvedValue({ data: [empData], error: null })

      const result = await fetchMyEmployee()
      expect(result).toEqual(empData)
    })
  })
})
