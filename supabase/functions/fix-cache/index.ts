// fix-cache — re-uploads all existing Storage images with cacheControl: 1 year
// POST {} → { ok, data: { fixed, failed, errors[] } }
// Runs server-side inside Supabase infra — does NOT consume egress bandwidth.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BUCKET        = 'images'
const CACHE_CONTROL = '31536000'
const FOLDERS       = ['profiles', 'activities', 'announcements', 'idp', 'plans', 'mental', 'empathy']

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const errors: string[] = []
    let fixed = 0

    for (const folder of FOLDERS) {
      const { data: files, error: listErr } = await supabase.storage
        .from(BUCKET)
        .list(folder, { limit: 1000 })

      if (listErr) { errors.push(`list ${folder}: ${listErr.message}`); continue }
      if (!files?.length) continue

      for (const file of files) {
        if (!file.name || file.name.endsWith('/')) continue   // skip sub-folders
        const path = `${folder}/${file.name}`

        // Download
        const { data: blob, error: dlErr } = await supabase.storage
          .from(BUCKET).download(path)
        if (dlErr || !blob) { errors.push(`dl ${path}: ${dlErr?.message ?? 'no data'}`); continue }

        // Re-upload same path with new cacheControl
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, blob, {
            cacheControl: CACHE_CONTROL,
            upsert: true,
            contentType: file.metadata?.mimetype ?? 'image/jpeg',
          })
        if (upErr) { errors.push(`up ${path}: ${upErr.message}`); continue }

        fixed++
      }
    }

    return jsonOk({ fixed, failed: errors.length, errors })
  } catch (err) {
    console.error('fix-cache error:', err)
    return jsonError(String(err), 500)
  }
})

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
