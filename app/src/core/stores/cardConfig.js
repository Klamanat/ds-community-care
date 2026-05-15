import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import { supabase } from '../services/supabase.js'

export const CARD_DEFS = [
  { key: 'bday',      icon: '🎂', label: 'Birthday Celebration',       desc: 'แบนเนอร์วันเกิดประจำเดือน' },
  { key: 'culture',   icon: '🤝', label: 'Team Culture',                desc: 'วัฒนธรรมองค์กร' },
  { key: 'training',  icon: '📚', label: 'Training',                    desc: 'การฝึกอบรม' },
  { key: 'reward',    icon: '🏆', label: 'DS Reward',                   desc: 'ระบบสะสมคะแนน' },
  { key: 'monthly',   icon: '📅', label: 'Monthly Plan',                 desc: 'ตารางเข้าออฟฟิศรายเดือน' },
  { key: 'market',    icon: '🛍️', label: 'ตลาดนัด',                     desc: 'ซื้อ-ขายของระหว่างพนักงาน' },
  { key: 'idea',      icon: '💡', label: 'เสนอไอเดีย',                  desc: 'ระบบส่งไอเดียพนักงาน' },
  { key: 'fortune',   icon: '🔮', label: 'สายมู',                       desc: 'ดูดวง, ฤกษ์มงคล, วันดีประจำสัปดาห์' },
  { key: 'empathy',   icon: '💌', label: 'Empathy Board',               desc: 'ส่งคำชื่นชม kudos' },
  { key: 'mental',    icon: '💚', label: 'Mental Health Consultation',  desc: 'ปรึกษาสุขภาพจิต' },
  { key: 'financial', icon: '💰', label: 'Financial Consultation',      desc: 'ปรึกษาการเงิน' },
]

export const CARD_BG_DEFS = [
  { key: 'culture',   icon: '🤝', label: 'Team Culture',   default: 'linear-gradient(135deg,#FF6B00,#FF3CAC,#A855F7,#3B82F6)' },
  { key: 'training',  icon: '📚', label: 'Training',        default: 'linear-gradient(135deg,#FFD6DC,#FF8FA3,#FF4D6D)' },
  { key: 'reward',    icon: '🏆', label: 'DS Reward',        default: 'linear-gradient(135deg,#06C755,#00A040)' },
  { key: 'monthly',   icon: '📅', label: 'Monthly Plan',     default: 'linear-gradient(135deg,#EEF2FF,#E0E7FF)' },
  { key: 'market',    icon: '🛍️', label: 'ตลาดนัด',          default: 'linear-gradient(135deg,#FDF2F8,#FCE7F3)' },
  { key: 'idea',      icon: '💡', label: 'เสนอไอเดีย',       default: 'linear-gradient(135deg,#EEF2FF,#E0E7FF)' },
  { key: 'fortune',   icon: '🔮', label: 'สายมู',            default: 'linear-gradient(135deg,#FDF2F8,#FCE7F3)' },
  { key: 'mental',    icon: '💚', label: 'Mental Health',    default: 'linear-gradient(135deg,#E8F8F0,#C8F0DC)' },
  { key: 'financial', icon: '💰', label: 'Financial',        default: 'linear-gradient(135deg,#FFFBEB,#FEF3C7)' },
]

const LS_KEY       = 'dsc_card_config'
const LS_BG_KEY    = 'dsc_card_bg'
const LS_BG_ID_KEY = 'dsc_card_bg_id'

export const useCardConfigStore = defineStore('cardConfig', () => {
  const config     = reactive(Object.fromEntries(CARD_DEFS.map(c => [c.key, true])))
  const bgDefaults = Object.fromEntries(CARD_BG_DEFS.map(c => [c.key, c.default]))
  const bgConfig   = reactive({ ...bgDefaults })
  const bgImgId    = reactive({})   // storage path per card key (for deletion)
  const loaded     = ref(false)
  const saving     = ref(false)

  // Restore caches immediately (avoids flash)
  try {
    const cached = JSON.parse(localStorage.getItem(LS_KEY) || 'null')
    if (cached) Object.assign(config, cached)
  } catch {}
  try {
    const cachedBg = JSON.parse(localStorage.getItem(LS_BG_KEY) || 'null')
    if (cachedBg) Object.assign(bgConfig, cachedBg)
  } catch {}
  try {
    const cachedId = JSON.parse(localStorage.getItem(LS_BG_ID_KEY) || 'null')
    if (cachedId) Object.assign(bgImgId, cachedId)
  } catch {}

  async function load() {
    try {
      const { data } = await supabase
        .from('settings')
        .select('key,value')
        .like('key', 'card_%')
      if (data?.length) {
        data.forEach(r => {
          if (r.key.startsWith('card_bg_id_')) {
            const k = r.key.replace('card_bg_id_', '')
            bgImgId[k] = r.value
          } else if (r.key.startsWith('card_bg_')) {
            const k = r.key.replace('card_bg_', '')
            if (k in bgConfig) bgConfig[k] = r.value
          } else {
            const k = r.key.replace('card_', '')
            if (k in config) config[k] = String(r.value).toUpperCase() !== 'FALSE'
          }
        })
        localStorage.setItem(LS_KEY,       JSON.stringify({ ...config }))
        localStorage.setItem(LS_BG_KEY,    JSON.stringify({ ...bgConfig }))
        localStorage.setItem(LS_BG_ID_KEY, JSON.stringify({ ...bgImgId }))
      }
    } catch { /* silent — defaults stay */ } finally {
      loaded.value = true
    }
  }

  async function saveAll() {
    saving.value = true
    try {
      const rows = CARD_DEFS.map(c => ({ key: `card_${c.key}`, value: config[c.key] ? 'TRUE' : 'FALSE' }))
      const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' })
      if (error) throw new Error(error.message)
      localStorage.setItem(LS_KEY, JSON.stringify({ ...config }))
    } finally {
      saving.value = false
    }
  }

  async function saveBg() {
    saving.value = true
    try {
      const bgRows = CARD_BG_DEFS.map(c => ({
        key:   `card_bg_${c.key}`,
        value: bgConfig[c.key] || c.default,
      }))
      const idRows = Object.entries(bgImgId)
        .filter(([, v]) => v)
        .map(([k, v]) => ({ key: `card_bg_id_${k}`, value: v }))
      const rows = [...bgRows, ...idRows]
      const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' })
      if (error) throw new Error(error.message)
      localStorage.setItem(LS_BG_KEY,    JSON.stringify({ ...bgConfig }))
      localStorage.setItem(LS_BG_ID_KEY, JSON.stringify({ ...bgImgId }))
    } finally {
      saving.value = false
    }
  }

  function isEnabled(key) { return config[key] !== false }

  // bgConfig stores raw URL (http...) or CSS gradient string
  // Return value ready to use as CSS `background` property
  function getBg(key) {
    const v = bgConfig[key] || bgDefaults[key] || ''
    if (v.startsWith('http')) return `url(${v}) center/cover no-repeat`
    return v
  }

  return { config, bgConfig, bgImgId, loaded, saving, load, saveAll, saveBg, isEnabled, getBg }
})
