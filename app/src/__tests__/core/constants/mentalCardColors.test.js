// Unit tests for core/constants/mentalCardColors.js
import { describe, it, expect } from 'vitest'
import { CARD_COLORS, CARD_COLOR_MAP, emojiPositions } from '../../../core/constants/mentalCardColors.js'

describe('CARD_COLORS', () => {
  it('is an array with items', () => {
    expect(Array.isArray(CARD_COLORS)).toBe(true)
    expect(CARD_COLORS.length).toBeGreaterThan(0)
  })

  it('each item has color and name', () => {
    CARD_COLORS.forEach(c => {
      expect(c).toHaveProperty('key')
      expect(c).toHaveProperty('label')
      expect(c).toHaveProperty('css')
      expect(c).toHaveProperty('border')
      expect(c).toHaveProperty('ctaBg')
      expect(c).toHaveProperty('ctaText')
    })
  })
})

describe('CARD_COLOR_MAP', () => {
  it('maps keys to color objects', () => {
    expect(CARD_COLOR_MAP.gold).toBeDefined()
    expect(CARD_COLOR_MAP.gold.label).toBe('ทอง')
    expect(CARD_COLOR_MAP.pink).toBeDefined()
    expect(CARD_COLOR_MAP.pink.label).toBe('ชมพู')
  })

  it('has entry for every color in CARD_COLORS', () => {
    CARD_COLORS.forEach(c => {
      expect(CARD_COLOR_MAP[c.key]).toBe(c)
    })
  })
})

describe('emojiPositions', () => {
  it('returns an array of position objects with correct length', () => {
    const positions = emojiPositions('test-seed', 12)
    expect(Array.isArray(positions)).toBe(true)
    expect(positions).toHaveLength(12)
  })

  it('each position has left, top, rotate, scale', () => {
    const positions = emojiPositions('test')
    positions.forEach(p => {
      expect(p).toHaveProperty('left')
      expect(p).toHaveProperty('top')
      expect(p).toHaveProperty('rotate')
      expect(p).toHaveProperty('scale')
      expect(typeof p.left).toBe('number')
      expect(typeof p.top).toBe('number')
      expect(typeof p.rotate).toBe('number')
      expect(typeof p.scale).toBe('number')
    })
  })

  it('returns stable result for same seed', () => {
    const a = emojiPositions('stable-seed')
    const b = emojiPositions('stable-seed')
    expect(a).toEqual(b)
  })

  it('returns different result for different seeds', () => {
    const a = emojiPositions('seed-a')
    const b = emojiPositions('seed-b')
    expect(a).not.toEqual(b)
  })

  it('handles empty seed string', () => {
    const positions = emojiPositions('')
    expect(positions).toHaveLength(12)
  })

  it('handles default count of 12', () => {
    const positions = emojiPositions('default')
    expect(positions).toHaveLength(12)
  })

  it('accepts custom count parameter', () => {
    const positions = emojiPositions('custom', 5)
    expect(positions).toHaveLength(5)
  })

  it('positions are within valid ranges', () => {
    const positions = emojiPositions('range-check', 50)
    positions.forEach(p => {
      expect(p.left).toBeGreaterThanOrEqual(0)
      expect(p.left).toBeLessThanOrEqual(100)
      expect(p.top).toBeGreaterThanOrEqual(0)
      expect(p.top).toBeLessThanOrEqual(100)
      expect(p.rotate).toBeGreaterThanOrEqual(-30)
      expect(p.rotate).toBeLessThanOrEqual(30)
      expect(p.scale).toBeGreaterThanOrEqual(0.75)
      expect(p.scale).toBeLessThanOrEqual(1.35)
    })
  })
})
