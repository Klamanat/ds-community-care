// In dev: use /api so requests go through the Vite proxy (no CORS)
// In prod: use the full GAS URL directly (GAS sets CORS headers after redirect)
const GAS_URL = import.meta.env.DEV
  ? '/api'
  : import.meta.env.VITE_GAS_URL

function assertConfigured() {
  if (!import.meta.env.DEV && (!GAS_URL || GAS_URL.includes('YOUR_DEPLOYMENT_ID'))) {
    throw new Error('VITE_GAS_URL not configured')
  }
}

/**
 * POST to GAS Web App — used for large payloads like base64 images.
 * Body is sent without Content-Type to avoid CORS preflight.
 */
export async function gasPost(action, payload = {}) {
  assertConfigured()
  const res = await fetch(GAS_URL, {
    method: 'POST',
    redirect: 'follow',
    body: JSON.stringify({ action, ...payload }),
  })
  return parseGasResponse(res)
}

/**
 * GET from GAS Web App.
 * Thai text is handled by URLSearchParams which auto-encodes UTF-8.
 */
export async function gasGet(action, params = {}) {
  assertConfigured()
  const qs = new URLSearchParams({ action })
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) qs.set(k, String(v))
  })
  const res = await fetch(`${GAS_URL}?${qs}`, { redirect: 'follow' })
  return parseGasResponse(res)
}

async function parseGasResponse(res) {
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    // GAS returned HTML — usually means: not deployed, needs re-authorization,
    // or script has an error. Check GAS editor logs.
    const preview = text.slice(0, 120).replace(/\s+/g, ' ')
    throw new Error(`GAS returned HTML instead of JSON: "${preview}"`)
  }
  if (!data.ok) {
    const msg = data.error || 'GAS error'
    // Token invalid/expired → clear and redirect to admin login
    if (msg === 'Invalid token' || msg === 'Token expired' || msg === 'token required') {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_name')
      window.location.hash = '#/admin/login'
    }
    throw new Error(msg)
  }
  return data
}
