// get-images — Supabase Edge Function
// Replaces GAS getImages action
// GET ?imgIds=id1,id2,id3 → { id1: "data:image/jpeg;base64,...", id2: ... }
//
// Env secrets required:
//   GOOGLE_SERVICE_ACCOUNT_KEY — JSON string of service account credentials

import { createGoogleAuth } from '../_shared/google-auth.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    })
  }

  try {
    const url = new URL(req.url)
    const imgIds = (url.searchParams.get('imgIds') || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    if (!imgIds.length) return jsonOk({})

    const accessToken = await getAccessToken()

    // Batch fetch all images concurrently (max 20 per request to avoid OOM)
    const chunks = chunkArray(imgIds, 20)
    const result: Record<string, string> = {}

    for (const chunk of chunks) {
      const fetched = await Promise.allSettled(
        chunk.map(id => fetchImage(accessToken, id))
      )
      fetched.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value) {
          result[chunk[i]] = r.value
        }
      })
    }

    return jsonOk(result)
  } catch (err) {
    console.error('get-images error:', err)
    return jsonError(String(err), 500)
  }
})

// ── Drive fetch ───────────────────────────────────────────────

async function getAccessToken(): Promise<string> {
  const keyJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY')
  if (!keyJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not set')
  return createGoogleAuth(JSON.parse(keyJson), ['https://www.googleapis.com/auth/drive.readonly'])
}

async function fetchImage(token: string, fileId: string): Promise<string> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error(`Drive fetch failed for ${fileId}: ${res.status}`)

  const contentType = res.headers.get('content-type') || 'image/jpeg'
  const buffer = await res.arrayBuffer()
  const b64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
  return `data:${contentType};base64,${b64}`
}

// ── Utils ─────────────────────────────────────────────────────
function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size))
  return result
}

function jsonOk(data: unknown) {
  return new Response(JSON.stringify({ ok: true, data }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}
function jsonError(msg: string, status = 400) {
  return new Response(JSON.stringify({ ok: false, error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}
