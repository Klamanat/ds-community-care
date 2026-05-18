// Shared utility: creates a Supabase mock chain where ALL methods return the chain
// by default. Tests set mockResolvedValue ONLY on the terminal method.
import { vi } from 'vitest'

// Chain of methods: every method returns the chain itself (not thenable)
export const chainMethods = [
  'from', 'select', 'insert', 'update', 'delete', 'upsert',
  'eq', 'neq', 'in', 'not', 'or', 'order', 'limit',
  'single', 'maybeSingle', 'rpc',
]

export function createChain(overrides = {}) {
  const chain = {}
  for (const m of chainMethods) {
    chain[m] = overrides[m] || vi.fn(() => chain)
  }
  return chain
}
