// Unit tests for features/gifts/giftService.js
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../core/services/supabase.js', () => {
  const chain = () => chain
  chain.select = vi.fn(() => chain)
  chain.insert = vi.fn(() => chain)
  chain.update = vi.fn(() => chain)
  chain.delete = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.order = vi.fn(() => chain)
  chain.single = vi.fn(() => chain)
  chain.maybeSingle = vi.fn(() => chain)
  chain.or = vi.fn(() => chain)
  chain.rpc = vi.fn(() => chain)
  chain.from = vi.fn(() => chain)
  return { supabase: chain }
})

import { supabase } from '../../../core/services/supabase.js'
import {
  fetchGifts, fetchAvailableGifts, fetchGiftClaims,
  adminAddGift, adminUpdateGift, adminDeleteGift,
  checkSurpriseBoxClaim, claimSurpriseBox,
} from '../../../features/gifts/giftService.js'

describe('giftService', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  describe('fetchGifts', () => {
    it('fetches all gifts ordered by created_at desc', async () => {
      supabase.from().select().order.mockResolvedValue({ data: [{ id: 1, name: 'Teddy', category: 'toy', price: 50 }], error: null })
      const result = await fetchGifts()
      expect(result).toHaveLength(1)
      expect(result[0].price).toBe(50)
    })
  })

  describe('fetchAvailableGifts', () => {
    it('filters by available status and quantity', async () => {
      supabase.from().select().eq().or.mockResolvedValue({ data: [], error: null })
      const result = await fetchAvailableGifts()
      expect(result).toEqual([])
    })
  })

  describe('admin CRUD', () => {
    it('adds gift', async () => {
      supabase.from().insert().select().single.mockResolvedValue({ data: { id: 1, name: 'Gift' }, error: null })
      const result = await adminAddGift({ name: 'Gift' })
      expect(result.name).toBe('Gift')
    })

    it('updates gift', async () => {
      supabase.from().update().eq().select().single.mockResolvedValue({ data: { id: 1, name: 'Updated' }, error: null })
      const result = await adminUpdateGift(1, { name: 'Updated' })
      expect(result.name).toBe('Updated')
    })

    it('deletes gift', async () => {
      supabase.from().delete().eq.mockResolvedValue({ error: null })
      await adminDeleteGift(1)
    })
  })

  describe('surprise box - quantity weighted random (via claimSurpriseBox fallback)', () => {
    it('selects a gift from available gifts using weights', async () => {
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Could not find the function claim_surprise_box' },
      })
      supabase.from().select().eq().eq().maybeSingle.mockResolvedValueOnce({ data: null })
      supabase.from().select().eq().or.mockResolvedValueOnce({
        data: [
          { id: 'g1', name: 'Teddy', quantity: 5 },
          { id: 'g2', name: 'Bear', quantity: 10 },
        ],
        error: null,
      })
      supabase.from().insert.mockResolvedValueOnce({ error: null })

      // total weight = 15, r = 7.5/15 → after g1(5): 2.5 → after g2(10): -7.5 → returns g2
      vi.spyOn(Math, 'random').mockReturnValueOnce(7.5 / 15)

      const result = await claimSurpriseBox('e1', 'Alice')
      expect(result.gift).toBeDefined()
      expect(result.gift.name).toBe('Bear')
    })

    it('handles unlimited quantity gifts (quantity is null)', async () => {
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Could not find the function claim_surprise_box' },
      })
      supabase.from().select().eq().eq().maybeSingle.mockResolvedValueOnce({ data: null })
      supabase.from().select().eq().or.mockResolvedValueOnce({
        data: [
          { id: 'g1', name: 'Unlimited Teddy', quantity: null },
          { id: 'g2', name: 'Limited Bear', quantity: 5 },
        ],
        error: null,
      })
      supabase.from().insert.mockResolvedValueOnce({ error: null })

      // maxQty = 5, unlimitedW = max(5,10) = 10, weights = [10, 5], total = 15
      // r = 0 → subtract 10 → -10 <= 0 → returns g1 (unlimited)
      vi.spyOn(Math, 'random').mockReturnValueOnce(0)

      const result = await claimSurpriseBox('e2', 'Bob')
      expect(result.gift).toBeDefined()
      expect(result.gift.name).toBe('Unlimited Teddy')
      expect(result.gift.quantity).toBeNull()
    })

    it('selects last gift as fallback when Math.random near total', async () => {
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Could not find the function claim_surprise_box' },
      })
      supabase.from().select().eq().eq().maybeSingle.mockResolvedValueOnce({ data: null })
      supabase.from().select().eq().or.mockResolvedValueOnce({
        data: [
          { id: 'g1', name: 'Gift A', quantity: 2 },
          { id: 'g2', name: 'Gift B', quantity: 3 },
        ],
        error: null,
      })
      supabase.from().insert.mockResolvedValueOnce({ error: null })

      // total = 5, r ≈ 4.999 → subtract 2: 2.999 → subtract 3: -0.001 → returns g2
      vi.spyOn(Math, 'random').mockReturnValueOnce(0.9999)

      const result = await claimSurpriseBox('e3', 'Charlie')
      expect(result.gift.name).toBe('Gift B')
    })
  })

  describe('checkSurpriseBoxClaim', () => {
    it('returns null when no claim exists', async () => {
      supabase.from().select().eq().eq().maybeSingle.mockResolvedValue({ data: null })
      const result = await checkSurpriseBoxClaim('e1')
      expect(result).toBeNull()
    })

    it('returns claim when exists', async () => {
      supabase.from().select().eq().eq().maybeSingle.mockResolvedValue({ data: { id: 1, gift_name: 'Teddy' } })
      const result = await checkSurpriseBoxClaim('e1')
      expect(result.gift_name).toBe('Teddy')
    })
  })

  describe('claimSurpriseBox', () => {
    it('returns RPC data when RPC succeeds', async () => {
      supabase.rpc.mockResolvedValueOnce({ data: { gift: { id: 'g1', name: 'Teddy' } }, error: null })
      const result = await claimSurpriseBox('e1', 'Alice')
      expect(result.gift.name).toBe('Teddy')
    })

    it('handles 23505 unique violation from RPC as already claimed', async () => {
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { code: '23505', message: 'duplicate key value violates unique constraint' },
      })
      const result = await claimSurpriseBox('e1', 'Alice')
      expect(result.alreadyClaimed).toBe(true)
    })

    it('re-throws RPC error that is not 23505 or function-not-found', async () => {
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST301', message: 'permission denied for function' },
      })
      await expect(claimSurpriseBox('e1', 'Alice')).rejects.toThrow('permission denied for function')
    })

    it('fallback returns alreadyClaimed when claim already exists', async () => {
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Could not find the function claim_surprise_box' },
      })
      supabase.from().select().eq().eq().maybeSingle.mockResolvedValueOnce({
        data: { id: 1, gift_name: 'Teddy' },
      })

      const result = await claimSurpriseBox('e1', 'Alice')
      expect(result.alreadyClaimed).toBe(true)
      expect(result.giftName).toBe('Teddy')
    })

    it('fallback returns noGifts when no available gifts', async () => {
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Could not find the function claim_surprise_box' },
      })
      supabase.from().select().eq().eq().maybeSingle.mockResolvedValueOnce({ data: null })
      supabase.from().select().eq().or.mockResolvedValueOnce({ data: [], error: null })

      const result = await claimSurpriseBox('e1', 'Alice')
      expect(result.noGifts).toBe(true)
    })

    it('fallback handles 23505 on insert as already claimed', async () => {
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Could not find the function claim_surprise_box' },
      })
      supabase.from().select().eq().eq().maybeSingle.mockResolvedValueOnce({ data: null })
      supabase.from().select().eq().or.mockResolvedValueOnce({
        data: [{ id: 'g1', name: 'Teddy', quantity: 5 }],
        error: null,
      })
      supabase.from().insert.mockResolvedValueOnce({
        error: { code: '23505', message: 'duplicate key' },
      })

      vi.spyOn(Math, 'random').mockReturnValueOnce(0.1)

      const result = await claimSurpriseBox('e1', 'Alice')
      expect(result.alreadyClaimed).toBe(true)
      expect(result.giftName).toBe('Teddy')
    })

    it('fallback re-throws insert error that is not 23505', async () => {
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Could not find the function claim_surprise_box' },
      })
      supabase.from().select().eq().eq().maybeSingle.mockResolvedValueOnce({ data: null })
      supabase.from().select().eq().or.mockResolvedValueOnce({
        data: [{ id: 'g1', name: 'Teddy', quantity: 5 }],
        error: null,
      })
      supabase.from().insert.mockResolvedValueOnce({
        error: { code: 'PGRST301', message: 'insert permission denied' },
      })

      vi.spyOn(Math, 'random').mockReturnValueOnce(0.1)

      await expect(claimSurpriseBox('e1', 'Alice')).rejects.toThrow('insert permission denied')
    })

    it('does not decrement stock when quantity is null (unlimited)', async () => {
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Could not find the function claim_surprise_box' },
      })
      supabase.from().select().eq().eq().maybeSingle.mockResolvedValueOnce({ data: null })
      supabase.from().select().eq().or.mockResolvedValueOnce({
        data: [{ id: 'g1', name: 'Unlimited Teddy', quantity: null }],
        error: null,
      })
      supabase.from().insert.mockResolvedValueOnce({ error: null })

      vi.spyOn(Math, 'random').mockReturnValueOnce(0.1)

      await claimSurpriseBox('e1', 'Alice')
      // update should not be called when quantity is null
      expect(supabase.from().update).not.toHaveBeenCalled()
    })

    it('decrements stock when quantity > 0', async () => {
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Could not find the function claim_surprise_box' },
      })
      supabase.from().select().eq().eq().maybeSingle.mockResolvedValueOnce({ data: null })
      supabase.from().select().eq().or.mockResolvedValueOnce({
        data: [{ id: 'g1', name: 'Teddy', quantity: 5 }],
        error: null,
      })
      supabase.from().insert.mockResolvedValueOnce({ error: null })

      vi.spyOn(Math, 'random').mockReturnValueOnce(0.1)

      const result = await claimSurpriseBox('e1', 'Alice')
      expect(result.gift.name).toBe('Teddy')
      expect(supabase.from().update).toHaveBeenCalled()
    })

    it('fallback fetches available gifts and selects one via weighted random', async () => {
      supabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Could not find the function claim_surprise_box' },
      })
      supabase.from().select().eq().eq().maybeSingle.mockResolvedValueOnce({ data: null })
      // fetchAvailableGifts returns multiple gifts
      supabase.from().select().eq().or.mockResolvedValueOnce({
        data: [
          { id: 'g1', name: 'Common Gift', quantity: 100 },
          { id: 'g2', name: 'Rare Gift', quantity: 1 },
        ],
        error: null,
      })
      supabase.from().insert.mockResolvedValueOnce({ error: null })
      supabase.from().update.mockReturnThis()

      vi.spyOn(Math, 'random').mockReturnValueOnce(0.99)

      const result = await claimSurpriseBox('e1', 'Alice')
      expect(result.gift).toBeDefined()
      expect(result.gift.name).toBe('Common Gift')
      expect(supabase.from().update).toHaveBeenCalled()
    })
  })

  describe('fetchGiftClaims', () => {
    it('returns claims data', async () => {
      supabase.from().select().order.mockResolvedValue({ data: [{ id: 1, employee_name: 'Alice', gift_name: 'Bear' }], error: null })
      const result = await fetchGiftClaims()
      expect(result).toHaveLength(1)
      expect(result[0].employee_name).toBe('Alice')
    })
  })
})
