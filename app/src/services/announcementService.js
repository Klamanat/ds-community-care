// announcementService.js — Announcement via Supabase

import { supabase } from './supabase.js'

export async function fetchAnnouncement() {
  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['ann_enabled', 'ann_id', 'ann_title', 'ann_video', 'ann_desc'])
  if (error || !data?.length) return null

  const kv = Object.fromEntries(data.map(r => [r.key, r.value]))
  if (kv.ann_enabled !== 'true') return null

  return {
    id:    kv.ann_id    || '',
    title: kv.ann_title || '',
    video: kv.ann_video || '',
    desc:  kv.ann_desc  || '',
  }
}
