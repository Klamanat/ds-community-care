const MONTHS_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

/**
 * แปลง "dd/MM/yyyy HH:mm" (จาก GAS) → "7 มี.ค. 2569 · 14:30"
 * รองรับ ISO string และ Date object ด้วย
 */
export function formatThaiDatetime(value) {
  if (!value) return ''

  let date
  if (value instanceof Date) {
    date = value
  } else {
    const str = String(value).trim()
    // dd/MM/yyyy HH:mm  (GAS format)
    const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/)
    if (m) {
      date = new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5])
    } else {
      date = new Date(str)
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
