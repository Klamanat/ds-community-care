// Lightweight localStorage cache with TTL
// Key format: dsc_{key} → { v: data, exp: timestamp }
const PFX = 'dsc_'

export function lsGet(key) {
  try {
    const raw = localStorage.getItem(PFX + key)
    if (!raw) return null
    const { v, exp } = JSON.parse(raw)
    if (Date.now() > exp) { localStorage.removeItem(PFX + key); return null }
    return v
  } catch { return null }
}

export function lsSet(key, val, ttlMs) {
  try {
    localStorage.setItem(PFX + key, JSON.stringify({ v: val, exp: Date.now() + ttlMs }))
  } catch { /* storage quota exceeded — skip */ }
}

export function lsDel(key) {
  try { localStorage.removeItem(PFX + key) } catch {}
}
