// Unit tests for core/utils/cache.js
import { describe, it, expect, beforeEach } from 'vitest'
import { lsGet, lsSet, lsDel, stripBase64 } from '../../core/utils/cache.js'

describe('lsSet / lsGet / lsDel', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('stores and retrieves a value', () => {
    lsSet('test_key', { hello: 'world' }, 60_000)
    expect(lsGet('test_key')).toEqual({ hello: 'world' })
  })

  it('returns null for missing key', () => {
    expect(lsGet('nonexistent')).toBeNull()
  })

  it('deletes a key', () => {
    lsSet('temp', 'value', 60_000)
    lsDel('temp')
    expect(lsGet('temp')).toBeNull()
  })

  it('returns null for expired TTL', () => {
    lsSet('expires_soon', 'data', -1) // already expired
    expect(lsGet('expires_soon')).toBeNull()
  })

  it('stores scalar values', () => {
    lsSet('num', 42, 60_000)
    expect(lsGet('num')).toBe(42)
  })

  it('stores arrays', () => {
    const arr = [1, 'two', { three: 3 }]
    lsSet('arr', arr, 60_000)
    expect(lsGet('arr')).toEqual(arr)
  })

  it('uses dsc_ prefix internally', () => {
    lsSet('key', 'val', 60_000)
    // Should NOT be directly accessible without prefix
    expect(localStorage.getItem('key')).toBeNull()
    // Should be stored with prefix
    expect(localStorage.getItem('dsc_key')).not.toBeNull()
  })

  it('handles concurrent writes to different keys', () => {
    lsSet('a', 1, 60_000)
    lsSet('b', 2, 60_000)
    lsSet('c', 3, 60_000)
    expect(lsGet('a')).toBe(1)
    expect(lsGet('b')).toBe(2)
    expect(lsGet('c')).toBe(3)
  })
})

describe('stripBase64', () => {
  it('strips data URLs from specified fields', () => {
    const items = [
      { id: 1, img: 'data:image/png;base64,abc123', url: 'https://example.com/img.png' },
      { id: 2, img: 'data:image/jpeg;base64,xyz789', url: '/local.jpg' },
    ]
    const result = stripBase64(items, 'img')
    expect(result[0].img).toBe('')
    expect(result[0].url).toBe('https://example.com/img.png') // other fields preserved
    expect(result[1].img).toBe('')
  })

  it('strips multiple fields', () => {
    const items = [
      { id: 1, photo: 'data:image/png;base64,a', avatar: 'data:image/png;base64,b' },
    ]
    const result = stripBase64(items, 'photo', 'avatar')
    expect(result[0].photo).toBe('')
    expect(result[0].avatar).toBe('')
  })

  it('preserves non-base64 values', () => {
    const items = [
      { id: 1, img: 'https://example.com/photo.jpg' },
    ]
    const result = stripBase64(items, 'img')
    expect(result[0].img).toBe('https://example.com/photo.jpg')
  })

  it('preserves empty strings and nulls', () => {
    const items = [
      { id: 1, img: '', avatar: null },
    ]
    const result = stripBase64(items, 'img', 'avatar')
    expect(result[0].img).toBe('')
    expect(result[0].avatar).toBeNull()
  })

  it('returns the input as-is if not an array', () => {
    expect(stripBase64(null, 'img')).toBeNull()
    expect(stripBase64(undefined, 'img')).toBeUndefined()
    expect(stripBase64({ id: 1 }, 'img')).toEqual({ id: 1 })
  })

  it('does not mutate the original array items', () => {
    const items = [{ id: 1, img: 'data:image/png;base64,test' }]
    const result = stripBase64(items, 'img')
    expect(result[0].img).toBe('')
    expect(items[0].img).toBe('data:image/png;base64,test') // original unchanged
  })
})
