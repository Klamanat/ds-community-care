// upload-image — Supabase Edge Function
// Replaces GAS uploadImage action
// POST { base64, folderType, fileName } → { id, url }
//
// Env secrets required:
//   GOOGLE_SERVICE_ACCOUNT_KEY  — JSON string of service account credentials
//   DRIVE_FOLDER_ID             — Root Google Drive folder ID

import { createGoogleAuth } from '../_shared/google-auth.ts'

const FOLDER_MAP: Record<string, string> = {
  activities:    'Activities',
  profiles:      'Profiles',
  empathy:       'Empathy',
  announcements: 'Announcements',
  idp:           'IDP Posters',
}

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
    const { base64, folderType = 'empathy', fileName = 'upload.jpg' } = await req.json()
    if (!base64) return jsonError('base64 required', 400)

    // Decode base64 to bytes
    const b64Data = base64.includes(',') ? base64.split(',')[1] : base64
    const mimeMatch = base64.match(/^data:([^;]+);/)
    const mimeType = mimeMatch?.[1] || 'image/jpeg'
    const bytes = Uint8Array.from(atob(b64Data), c => c.charCodeAt(0))

    // Get Google Drive access token via service account
    const accessToken = await getAccessToken()

    // Find or create subfolder
    const rootFolderId = Deno.env.get('DRIVE_FOLDER_ID') || ''
    const subFolderName = FOLDER_MAP[folderType] || folderType
    const folderId = await ensureFolder(accessToken, rootFolderId, subFolderName)

    // Upload file to Drive
    const fileId = await uploadToDrive(accessToken, bytes, mimeType, fileName, folderId)

    // Make file publicly readable
    await setPublic(accessToken, fileId)

    const url = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`

    return jsonOk({ id: fileId, url })
  } catch (err) {
    console.error('upload-image error:', err)
    return jsonError(String(err), 500)
  }
})

// ── Google Auth ───────────────────────────────────────────────

async function getAccessToken(): Promise<string> {
  const keyJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY')
  if (!keyJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not set')
  return createGoogleAuth(JSON.parse(keyJson), ['https://www.googleapis.com/auth/drive'])
}

// ── Drive helpers ─────────────────────────────────────────────

async function ensureFolder(token: string, parentId: string, name: string): Promise<string> {
  // Search for existing folder
  const q = encodeURIComponent(
    `mimeType='application/vnd.google-apps.folder' and name='${name}' and '${parentId}' in parents and trashed=false`
  )
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = await res.json()
  if (data.files?.length) return data.files[0].id

  // Create folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] }),
  })
  const created = await createRes.json()
  return created.id
}

async function uploadToDrive(
  token: string,
  bytes: Uint8Array,
  mimeType: string,
  fileName: string,
  folderId: string
): Promise<string> {
  const boundary = 'boundary_ds_upload'
  const metadata = JSON.stringify({ name: fileName, parents: [folderId] })

  const body = [
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
    `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
  ]

  // Build multipart body as Uint8Array
  const enc = new TextEncoder()
  const part1 = enc.encode(body[0])
  const part2 = enc.encode(body[1])
  const end   = enc.encode(`\r\n--${boundary}--`)
  const combined = new Uint8Array(part1.length + part2.length + bytes.length + end.length)
  combined.set(part1, 0)
  combined.set(part2, part1.length)
  combined.set(bytes, part1.length + part2.length)
  combined.set(end,   part1.length + part2.length + bytes.length)

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: combined,
    }
  )
  const result = await res.json()
  if (!result.id) throw new Error('Drive upload failed: ' + JSON.stringify(result))
  return result.id
}

async function setPublic(token: string, fileId: string): Promise<void> {
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  })
}

// ── Response helpers ──────────────────────────────────────────
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
