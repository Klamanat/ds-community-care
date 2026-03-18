import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import { supabase } from '../services/supabase.js'

export const CARD_DEFS = [
  { key: 'bday',      icon: '🎂', label: 'Birthday Celebration',       desc: 'แบนเนอร์วันเกิดประจำเดือน' },
  { key: 'culture',   icon: '🤝', label: 'Team Culture',                desc: 'วัฒนธรรมองค์กร' },
  { key: 'training',  icon: '📚', label: 'Training',                    desc: 'การฝึกอบรม' },
  { key: 'reward',    icon: '🏆', label: 'DS Reward',                   desc: 'ระบบสะสมคะแนน' },
  { key: 'monthly',   icon: '📅', label: 'Monthly Plan',                 desc: 'แผนกิจกรรมรายเดือน' },
  { key: 'market',    icon: '🛍️', label: 'ตลาดนัด',                     desc: 'ซื้อ-ขายของระหว่างพนักงาน' },
  { key: 'idea',      icon: '💡', label: 'เสนอไอเดีย',                  desc: 'ระบบส่งไอเดียพนักงาน' },
  { key: 'fortune',   icon: '🔮', label: 'สายมู',                       desc: 'ดูดวง, ฤกษ์มงคล, วันดีประจำสัปดาห์' },
  { key: 'empathy',   icon: '💌', label: 'Empathy Board',               desc: 'ส่งคำชื่นชม kudos' },
  { key: 'mental',    icon: '💚', label: 'Mental Health Consultation',  desc: 'ปรึกษาสุขภาพจิต' },
  { key: 'financial', icon: '💰', label: 'Financial Consultation',      desc: 'ปรึกษาการเงิน' },
]

const LS_KEY = 'dsc_card_config'

export const useCardConfigStore = defineStore('cardConfig', () => {
  // Default: all enabled
  const config = reactive(Object.fromEntries(CARD_DEFS.map(c => [c.key, true])))
  const loaded = ref(false)
  const saving = ref(false)

  // Restore from localStorage cache immediately (avoids flash)
  try {
    const cached = JSON.parse(localStorage.getItem(LS_KEY) || 'null')
    if (cached) Object.assign(config, cached)
  } catch {}

  async function load() {
    try {
      const { data } = await supabase
        .from('settings')
        .select('key,value')
        .like('key', 'card_%')
      if (data?.length) {
        data.forEach(r => {
          const k = r.key.replace('card_', '')
          if (k in config) config[k] = String(r.value).toUpperCase() !== 'FALSE'
        })
        localStorage.setItem(LS_KEY, JSON.stringify({ ...config }))
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

  function isEnabled(key) { return config[key] !== false }

  return { config, loaded, saving, load, saveAll, isEnabled }
})
