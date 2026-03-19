// delete-image — Supabase Edge Function
// POST { paths: string[] } → { ok: true }
//
// Deletes files from Supabase Storage bucket "images"

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
    const { paths } = await req.json()
    if (!Array.isArray(paths) || paths.length === 0) return jsonError('paths[] required', 400)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { error } = await supabase.storage.from('images').remove(paths)
    if (error) throw new Error('Storage delete failed: ' + error.message)

    return jsonOk({ deleted: paths.length })
  } catch (err) {
    console.error('delete-image error:', err)
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
