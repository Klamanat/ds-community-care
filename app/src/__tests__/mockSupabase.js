// Shared Supabase mock factory for all tests
// Every method returns the chain by default. Terminal methods (single, maybeSingle, order, in, rpc)
// are where mockResolvedValue should be set.
import { vi } from 'vitest'

export function createMockSupabase() {
  // The chain object — every property returns itself
  const chain = {
    from: vi.fn(() => chain),
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    upsert: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    not: vi.fn(() => chain),
    or: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    single: vi.fn(() => chain),
    maybeSingle: vi.fn(() => chain),
    rpc: vi.fn(() => chain),
    // Allow setting resolved values on terminal methods
    then: undefined, // not thenable
  }
  return chain
}
