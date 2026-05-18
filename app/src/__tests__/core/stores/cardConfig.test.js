// Unit tests for core/stores/cardConfig.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('../../../core/services/supabase.js', () => {
  const chain = () => chain
  chain.select = vi.fn(() => chain)
  chain.in = vi.fn(() => chain)
  chain.rpc = vi.fn(() => chain)
  chain.like = vi.fn(() => chain)
  chain.upsert = vi.fn(() => chain)
  chain.from = vi.fn(() => chain)
  return { supabase: chain }
})

import { useCardConfigStore, CARD_DEFS, CARD_BG_DEFS } from '../../../core/stores/cardConfig.js'
import { supabase } from '../../../core/services/supabase.js'

describe('cardConfig store', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
    localStorage.clear()
    store = useCardConfigStore()
  })

  describe('initial state', () => {
    it('has default card visibility with all cards enabled', () => {
      expect(store.config).toBeDefined()
      CARD_DEFS.forEach(c => {
        expect(store.config[c.key]).toBe(true)
      })
    })

    it('has default background config from CARD_BG_DEFS', () => {
      expect(store.bgConfig).toBeDefined()
      expect(store.bgConfig.culture).toBeDefined()
      expect(store.bgConfig.culture).toContain('gradient')
    })

    it('has CARD_DEFS exported', () => {
      expect(CARD_DEFS).toBeDefined()
      expect(CARD_DEFS.length).toBeGreaterThan(0)
    })

    it('has CARD_BG_DEFS exported', () => {
      expect(CARD_BG_DEFS).toBeDefined()
    })

    it('has loaded false initially', () => {
      expect(store.loaded).toBe(false)
    })

    it('has saving false initially', () => {
      expect(store.saving).toBe(false)
    })

    it('initializes bgImgId as empty reactive object', () => {
      expect(store.bgImgId).toBeDefined()
      expect(Object.keys(store.bgImgId)).toHaveLength(0)
    })
  })

  describe('localStorage cache on init', () => {
    it('restores card visibility from localStorage', () => {
      localStorage.setItem('dsc_card_config', JSON.stringify({ bday: false, culture: true }))
      setActivePinia(createPinia())
      const s = useCardConfigStore()
      expect(s.config.bday).toBe(false)
      expect(s.config.culture).toBe(true)
    })

    it('restores bg config from localStorage', () => {
      localStorage.setItem('dsc_card_bg', JSON.stringify({ culture: '#ff0000' }))
      setActivePinia(createPinia())
      const s = useCardConfigStore()
      expect(s.bgConfig.culture).toBe('#ff0000')
    })

    it('restores bgImgId from localStorage', () => {
      localStorage.setItem('dsc_card_bg_id', JSON.stringify({ training: 'training/my-img.jpg' }))
      setActivePinia(createPinia())
      const s = useCardConfigStore()
      expect(s.bgImgId.training).toBe('training/my-img.jpg')
    })

    it('silently ignores invalid localStorage JSON', () => {
      localStorage.setItem('dsc_card_config', 'not-json')
      setActivePinia(createPinia())
      expect(() => useCardConfigStore()).not.toThrow()
    })
  })

  describe('isEnabled', () => {
    it('returns true when config[key] is true', () => {
      store.config.bday = true
      expect(store.isEnabled('bday')).toBe(true)
    })

    it('returns false when config[key] is false', () => {
      store.config.bday = false
      expect(store.isEnabled('bday')).toBe(false)
    })

    it('returns true when key is not in config (undefined !== false)', () => {
      expect(store.isEnabled('nonexistent_key')).toBe(true)
    })
  })

  describe('getBg', () => {
    it('returns gradient string for known card with gradient bg', () => {
      const result = store.getBg('culture')
      expect(result).toContain('gradient')
    })

    it('returns url() format when bgConfig has http URL', () => {
      store.bgConfig.culture = 'https://example.com/img.jpg'
      const result = store.getBg('culture')
      expect(result).toBe('url(https://example.com/img.jpg) center/cover no-repeat')
    })

    it('returns empty string for unknown card', () => {
      expect(store.getBg('nonexistent')).toBe('')
    })
  })

  describe('load', () => {
    it('fetches settings from Supabase and updates config state', async () => {
      supabase.like.mockResolvedValue({
        data: [
          { key: 'card_bday', value: 'TRUE' },
          { key: 'card_culture', value: 'FALSE' },
          { key: 'card_training', value: 'TRUE' },
        ],
        error: null,
      })

      await store.load()

      expect(store.config.bday).toBe(true)
      expect(store.config.culture).toBe(false)
      expect(store.config.training).toBe(true)
      expect(store.loaded).toBe(true)
      expect(supabase.from).toHaveBeenCalledWith('settings')
      expect(supabase.select).toHaveBeenCalledWith('key,value')
      expect(supabase.like).toHaveBeenCalledWith('key', 'card_%')
    })

    it('updates bgConfig from card_bg_ keys', async () => {
      supabase.like.mockResolvedValue({
        data: [
          { key: 'card_bg_culture', value: 'linear-gradient(135deg,#000,#fff)' },
        ],
        error: null,
      })

      await store.load()
      expect(store.bgConfig.culture).toBe('linear-gradient(135deg,#000,#fff)')
    })

    it('updates bgImgId from card_bg_id_ keys', async () => {
      supabase.like.mockResolvedValue({
        data: [
          { key: 'card_bg_id_training', value: 'training/abc123.jpg' },
        ],
        error: null,
      })

      await store.load()
      expect(store.bgImgId.training).toBe('training/abc123.jpg')
    })

    it('persists loaded data to localStorage', async () => {
      supabase.like.mockResolvedValue({
        data: [{ key: 'card_bday', value: 'FALSE' }],
        error: null,
      })

      await store.load()
      const saved = JSON.parse(localStorage.getItem('dsc_card_config'))
      expect(saved.bday).toBe(false)
      // All other keys remain at their defaults
      CARD_DEFS.filter(c => c.key !== 'bday').forEach(c => {
        expect(saved[c.key]).toBe(true)
      })
      expect(localStorage.getItem('dsc_card_ttl')).toBeTruthy()
    })

    it('handles null data gracefully', async () => {
      supabase.like.mockResolvedValue({ data: null, error: null })

      await store.load()
      expect(store.loaded).toBe(true)
      CARD_DEFS.forEach(c => {
        expect(store.config[c.key]).toBe(true)
      })
    })

    it('skips server call when cache is valid and not forced', async () => {
      store.loaded = true
      localStorage.setItem('dsc_card_ttl', String(Date.now()))
      supabase.like.mockResolvedValue({ data: [{ key: 'card_bday', value: 'FALSE' }], error: null })

      await store.load()

      // Server should NOT be called
      expect(supabase.from).not.toHaveBeenCalled()
      // Defaults should stay
      expect(store.config.bday).toBe(true)
    })

    it('calls server when force=true despite valid cache', async () => {
      store.loaded = true
      localStorage.setItem('dsc_card_ttl', String(Date.now()))
      supabase.like.mockResolvedValue({ data: [{ key: 'card_bday', value: 'FALSE' }], error: null })

      await store.load(true)

      expect(supabase.from).toHaveBeenCalledWith('settings')
      expect(store.config.bday).toBe(false)
    })

    it('calls server when loaded is false even if TTL exists', async () => {
      localStorage.setItem('dsc_card_ttl', String(Date.now()))
      supabase.like.mockResolvedValue({ data: null, error: null })

      await store.load()
      expect(supabase.from).toHaveBeenCalled()
    })

    it('does not throw on Supabase error — silently uses defaults', async () => {
      supabase.like.mockRejectedValue(new Error('network error'))

      await expect(store.load()).resolves.toBeUndefined()
      expect(store.loaded).toBe(true)
      // Defaults remain
      expect(store.config.bday).toBe(true)
    })
  })

  describe('saveAll', () => {
    it('calls upsert on Supabase with all card rows', async () => {
      supabase.upsert.mockResolvedValue({ error: null })

      await store.saveAll()

      expect(supabase.from).toHaveBeenCalledWith('settings')
      expect(supabase.upsert).toHaveBeenCalledTimes(1)
      const rows = supabase.upsert.mock.calls[0][0]
      expect(rows).toHaveLength(CARD_DEFS.length)
      expect(rows[0]).toEqual({ key: 'card_bday', value: 'TRUE' })
      expect(supabase.upsert.mock.calls[0][1]).toEqual({ onConflict: 'key' })
    })

    it('persists config to localStorage after save', async () => {
      supabase.upsert.mockResolvedValue({ error: null })
      store.config.bday = false

      await store.saveAll()

      const saved = JSON.parse(localStorage.getItem('dsc_card_config'))
      expect(saved.bday).toBe(false)
      expect(localStorage.getItem('dsc_card_ttl')).toBeTruthy()
    })

    it('restores config from localStorage on error', async () => {
      localStorage.setItem('dsc_card_config', JSON.stringify({ bday: true, culture: true }))
      // Re-create store to pick up cached values
      const s = useCardConfigStore()
      s.config.bday = false // modify locally
      supabase.upsert.mockResolvedValue({ error: { message: 'save failed' } })

      await expect(s.saveAll()).rejects.toThrow('save failed')
      // Should be restored to localStorage values
      expect(s.config.bday).toBe(true)
    })

    it('sets saving flag during save', async () => {
      let resolveUpsert
      supabase.upsert.mockReturnValue(new Promise(r => { resolveUpsert = r }))

      const promise = store.saveAll()
      expect(store.saving).toBe(true)
      resolveUpsert({ error: null })
      await promise
      expect(store.saving).toBe(false)
    })

    it('throws on Supabase error and unsets saving flag', async () => {
      supabase.upsert.mockResolvedValue({ error: { message: 'db error' } })

      await expect(store.saveAll()).rejects.toThrow('db error')
      expect(store.saving).toBe(false)
    })
  })

  describe('saveBg', () => {
    it('calls upsert with bg rows and id rows', async () => {
      store.bgConfig.culture = 'linear-gradient(135deg,#000,#fff)'
      store.bgImgId.training = 'training/img.jpg'
      supabase.upsert.mockResolvedValue({ error: null })

      await store.saveBg()

      expect(supabase.from).toHaveBeenCalledWith('settings')
      expect(supabase.upsert).toHaveBeenCalledTimes(1)
      const rows = supabase.upsert.mock.calls[0][0]
      // Should have all bg rows plus only the id rows with truthy values
      expect(rows.length).toBe(CARD_BG_DEFS.length + 1)
      expect(rows.some(r => r.key === 'card_bg_culture')).toBe(true)
      expect(rows.some(r => r.key === 'card_bg_id_training')).toBe(true)
    })

    it('persists bgConfig and bgImgId to localStorage', async () => {
      supabase.upsert.mockResolvedValue({ error: null })
      store.bgConfig.culture = 'custom-bg'

      await store.saveBg()

      const savedBg = JSON.parse(localStorage.getItem('dsc_card_bg'))
      expect(savedBg.culture).toBe('custom-bg')
      expect(localStorage.getItem('dsc_card_ttl')).toBeTruthy()
    })

    it('sets saving flag during save', async () => {
      let resolveUpsert
      supabase.upsert.mockReturnValue(new Promise(r => { resolveUpsert = r }))

      const promise = store.saveBg()
      expect(store.saving).toBe(true)
      resolveUpsert({ error: null })
      await promise
      expect(store.saving).toBe(false)
    })

    it('throws on Supabase error', async () => {
      supabase.upsert.mockResolvedValue({ error: { message: 'bg save error' } })

      await expect(store.saveBg()).rejects.toThrow('bg save error')
    })
  })
})
