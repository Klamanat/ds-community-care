// google-auth.ts — shared Google Service Account JWT helper for Deno Edge Functions
// Generates a short-lived access token using the service account key JSON

interface ServiceAccountKey {
  client_email: string
  private_key:  string
  token_uri?:   string
}

/**
 * Exchange a service account key for an OAuth2 access token.
 * @param key    Parsed service account JSON
 * @param scopes Array of OAuth2 scope URLs
 * @returns      Short-lived access token string
 */
export async function createGoogleAuth(key: ServiceAccountKey, scopes: string[]): Promise<string> {
  const now   = Math.floor(Date.now() / 1000)
  const claim = {
    iss:   key.client_email,
    scope: scopes.join(' '),
    aud:   key.token_uri || 'https://oauth2.googleapis.com/token',
    exp:   now + 3600,
    iat:   now,
  }

  const jwt = await signJwt(claim, key.private_key)

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:  jwt,
    }),
  })

  const data = await res.json()
  if (!data.access_token) throw new Error('Failed to get access token: ' + JSON.stringify(data))
  return data.access_token
}

// ── JWT signing (RS256) ───────────────────────────────────────

async function signJwt(payload: object, pemKey: string): Promise<string> {
  const header  = { alg: 'RS256', typ: 'JWT' }
  const enc     = new TextEncoder()

  const b64Header  = base64url(enc.encode(JSON.stringify(header)))
  const b64Payload = base64url(enc.encode(JSON.stringify(payload)))
  const signingInput = `${b64Header}.${b64Payload}`

  const privateKey = await importPrivateKey(pemKey)
  const signature  = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    privateKey,
    enc.encode(signingInput)
  )

  return `${signingInput}.${base64url(new Uint8Array(signature))}`
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemBody = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '')

  const derBuffer = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0))

  return crypto.subtle.importKey(
    'pkcs8',
    derBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
}

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}
