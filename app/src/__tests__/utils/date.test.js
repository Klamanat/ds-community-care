// Unit tests for core/utils/date.js
import { describe, it, expect } from 'vitest'
import { formatThaiDatetime } from '../../core/utils/date.js'

describe('formatThaiDatetime', () => {
  it('returns empty string for falsy input', () => {
    expect(formatThaiDatetime(null)).toBe('')
    expect(formatThaiDatetime(undefined)).toBe('')
    expect(formatThaiDatetime('')).toBe('')
  })

  it('formats ISO date string correctly', () => {
    const result = formatThaiDatetime('2026-03-07T14:30:00')
    expect(result).toContain('30')     // hour
    expect(result).toContain('14')     // minute
    expect(result).toContain('2569')   // Buddhist year (2026 + 543)
    expect(result).toContain('มี.ค.')  // March in Thai
    expect(result).toContain('·')      // separator
  })

  it('formats Supabase timestamp (space-separated) correctly', () => {
    const result = formatThaiDatetime('2026-05-18 09:15:00')
    expect(result).toContain('09')
    expect(result).toContain('15')
    expect(result).toContain('2569')
    expect(result).toContain('พ.ค.')  // May in Thai
  })

  it('formats dd/MM/yyyy HH:mm (legacy) correctly', () => {
    const result = formatThaiDatetime('07/03/2026 14:30')
    expect(result).toContain('14')
    expect(result).toContain('30')
    expect(result).toContain('2569')
    expect(result).toContain('มี.ค.')
  })

  it('formats Date object correctly', () => {
    const date = new Date(2026, 0, 15, 10, 45) // Jan 15, 2026 10:45
    const result = formatThaiDatetime(date)
    expect(result).toContain('10')
    expect(result).toContain('45')
    expect(result).toContain('2569')
    expect(result).toContain('ม.ค.')  // January in Thai
  })

  it('returns the raw string for unparseable input', () => {
    const result = formatThaiDatetime('not-a-date')
    expect(result).toBe('not-a-date')
  })

  it('handles edge date (end of year)', () => {
    const result = formatThaiDatetime('31/12/2026 23:59')
    expect(result).toContain('31')
    expect(result).toContain('ธ.ค.')  // December in Thai
    expect(result).toContain('2569')
    expect(result).toContain('23:59')
  })

  it('pads single-digit hours and minutes', () => {
    const result = formatThaiDatetime('2026-01-01T01:05:00')
    expect(result).toContain('01')
    expect(result).toContain('05')
  })
})
