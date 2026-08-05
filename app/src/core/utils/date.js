const MONTHS_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

/**
 * แปลงวันที่จาก Supabase (ISO/dd/MM/yyyy HH:mm) → "7 มี.ค. 2569 · 14:30"
 * รองรับ ISO string และ Date object ด้วย
 */
export function formatThaiDatetime(value) {
  if (!value) return ''

  let date
  if (value instanceof Date) {
    date = value
  } else {
    const str = String(value).trim()
    // dd/MM/yyyy HH:mm  (legacy format)
    const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/)
    if (m) {
      date = new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5])
    } else {
      // Normalize Supabase "2026-03-20 10:30:00+07" → "2026-03-20T10:30:00+07"
      date = new Date(str.replace(' ', 'T'))
    }
  }

  if (isNaN(date)) return String(value)

  const day   = date.getDate()
  const month = MONTHS_TH[date.getMonth()]
  const year  = date.getFullYear() + 543
  const hh    = String(date.getHours()).padStart(2, '0')
  const mm    = String(date.getMinutes()).padStart(2, '0')

  return `${day} ${month} ${year} · ${hh}:${mm}`
}

/**
 * แปลงวันที่ → relative time แบบ Facebook เช่น "5 นาทีที่แล้ว", "3 ชม.ที่แล้ว"
 * เกิน 7 วัน → fallback เป็น formatThaiDatetime
 */
export function formatRelativeTime(value) {
  if (!value) return ''
  if (value === 'เมื่อกี้') return 'เมื่อกี้'

  const date = value instanceof Date ? value : new Date(String(value).trim().replace(' ', 'T'))
  if (isNaN(date)) return String(value)

  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diffSec < 60) return 'เมื่อกี้'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} นาทีที่แล้ว`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} ชม.ที่แล้ว`
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} วันที่แล้ว`
  return formatThaiDatetime(date)
}
