// Test setup — runs before each test file
import { vi } from 'vitest'

// Mock localStorage for jsdom
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: (key) => { delete store[key] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (i) => Object.keys(store)[i] ?? null,
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

// Mock import.meta.env
globalThis.import = {
  meta: {
    env: {
      DEV: true,
      VITE_SUPABASE_URL: 'https://test-project.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
      VITE_STORAGE_CDN: '',
    },
  },
}

// Mock IntersectionObserver for components using useFadeIn
class MockIntersectionObserver {
  constructor(callback) { this.callback = callback }
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.IntersectionObserver = MockIntersectionObserver

// Note: vi.useFakeTimers is NOT used globally — it interferes with Vue async rendering.
// Individual tests that need timer control should call vi.useFakeTimers() locally
// and vi.useRealTimers() in afterEach.
