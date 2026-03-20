// upload-image — Supabase Edge Function
// POST { base64, folderType, fileName } → { id, url }
//
// Uploads to Supabase Storage bucket "images/<folderType>/<timestamp>_<fileName>"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    // Supabase client with service role (auto-injected secrets)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const storagePath = `${folderType}/${Date.now()}_${fileName}`

    const { error } = await supabase.storage
      .from('images')
      .upload(storagePath, bytes, {
        contentType: mimeType,
        upsert: true,
        cacheControl: '31536000',   // 1 year — enables browser + CDN caching
      })

    if (error) throw new Error('Storage upload failed: ' + error.message)

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(storagePath)

    return jsonOk({ id: storagePath, url: publicUrl })
  } catch (err) {
    console.error('upload-image error:', err)
    return jsonError(String(err), 500)
  }
})

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
