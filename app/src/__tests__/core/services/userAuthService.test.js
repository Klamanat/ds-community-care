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
import { checkEmployee, login } from '../../../core/services/userAuthService.js'

describe('userAuthService', () => {
  beforeEach(() => { vi.restoreAllMocks() })

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

  describe('login', () => {
    it('throws generic error for missing employee', async () => {
      supabase.from().select().eq().maybeSingle.mockResolvedValue({ data: null })
      await expect(login('EMP01', 'pass')).rejects.toThrow('รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง')
    })

    it('logs in employee without passcode via anonymous session', async () => {
      supabase.from().select().eq().maybeSingle.mockResolvedValue({ data: { id: 1, emp_code: 'EMP01', name: 'Alice', role: 'employee', passcode: null } })
      supabase.auth.getSession.mockResolvedValue({ data: { session: null } })
      const result = await login('EMP01')
      expect(result.name).toBe('Alice')
    })

    it('returns mapped employee data for no-passcode login', async () => {
      supabase.from().select().eq().maybeSingle.mockResolvedValue({
        data: { id: 1, emp_code: 'EMP01', name: 'Alice', role: 'employee', dept: 'IT', img_url: 'https://img.test', star_gang_slogan: 'Go!', passcode: '' },
      })
      const result = await login('EMP01')
      expect(result.empCode).toBe('EMP01')
      expect(result.name).toBe('Alice')
    })
  })
})
