const GAS_URL = import.meta.env.VITE_GAS_URL

/**
 * Base GAS GET function.
 * Thai text is handled by URLSearchParams which auto-encodes UTF-8.
 * redirect:'follow' is required because GAS redirects to the execution URL.
 */
export async function gasGet(action, params = {}) {
  if (!GAS_URL || GAS_URL.includes('YOUR_DEPLOYMENT_ID')) {
    throw new Error('VITE_GAS_URL not configured')
  }
  const url = new URL(GAS_URL)
  url.searchParams.set('action', action)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
  })
  const res = await fetch(url.toString(), { redirect: 'follow' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || 'GAS error')
  return data
}
