import { gasGet } from './api.js'

/**
 * Fetch active announcement from GAS.
 * Returns null if no active announcement or GAS not configured.
 *
 * GAS reads from a "Settings" sheet with key-value rows:
 *   ann_enabled  | TRUE
 *   ann_id       | ann_2026_03_13
 *   ann_title    | หัวข้อประกาศ
 *   ann_video    | https://youtu.be/xxxxx
 *   ann_desc     | รายละเอียด...
 */
export async function fetchAnnouncement() {
  const r = await gasGet('getAnnouncement')
  return r.data || null
}
