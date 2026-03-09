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

/**
 * Strip base64 data URLs from specified image fields before caching.
 * Base64 images (~100KB each) make localStorage huge → JSON.parse ช้ามากบน Safari.
 * Images are re-fetched from GAS ScriptCache (fast) after initial render.
 */
export function stripBase64(arr, ...fields) {
  if (!Array.isArray(arr)) return arr
  return arr.map(item => {
    const out = { ...item }
    fields.forEach(f => {
      if (typeof out[f] === 'string' && out[f].startsWith('data:')) out[f] = ''
    })
    return out
  })
}
