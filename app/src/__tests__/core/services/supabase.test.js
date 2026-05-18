// Unit tests for supabase client singleton
import { describe, it, expect } from 'vitest'

describe('supabase client', () => {
  it('creates a client with DEV URL', async () => {
    // Dynamic import so env is already set
    const { supabase } = await import('../../../core/services/supabase.js')
    expect(supabase).toBeDefined()
    expect(supabase.from).toBeTypeOf('function')
    expect(supabase.rpc).toBeTypeOf('function')
    expect(supabase.auth).toBeDefined()
    expect(supabase.storage).toBeDefined()
  })
})
