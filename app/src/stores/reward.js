import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchMyPoints, fetchRewardRules, postDailyCheckin } from '../services/rewardService.js'

const CHECKIN_KEY = 'ds_checkin_date'
function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

const LEVELS = [
  { level: 0, name: '🌱 Newcomer', min: 0,    next: 100  },
  { level: 1, name: '⭐ Member',   min: 100,  next: 300  },
  { level: 2, name: '🔥 Active',   min: 300,  next: 600  },
  { level: 3, name: '💎 Champion', min: 600,  next: 1000 },
  { level: 4, name: '👑 Legend',   min: 1000, next: null },
]

export const useRewardStore = defineStore('reward', () => {
  const total     = ref(0)
  const level     = ref(0)
  const levelName = ref('🌱 Newcomer')
  const nextPts   = ref(100)
  const nextName  = ref('⭐ Member')
  const history   = ref([])
  const rules            = ref([])
  const loading          = ref(false)
  const loaded           = ref(false)
  const checkedInToday   = ref(localStorage.getItem(CHECKIN_KEY) === todayStr())
  const checkinLoading   = ref(false)

  const progress = computed(() => {
    const lv = LEVELS[level.value]
    if (!lv || lv.next === null) return 100
    const range = lv.next - lv.min
    const done  = total.value - lv.min
    return Math.min(100, Math.round((done / range) * 100))
  })

  async function load(employeeName, force = false) {
    if (loaded.value && !force) return
    if (!employeeName) return
    loading.value = true
    try {
      const [pts, ruleData] = await Promise.all([
        fetchMyPoints(employeeName),
        rules.value.length ? Promise.resolve(null) : fetchRewardRules().catch(() => null),
      ])
      total.value     = pts.total     || 0
      level.value     = pts.level     || 0
      levelName.value = pts.levelName || '🌱 Newcomer'
      nextPts.value   = pts.nextPts   ?? 100
      nextName.value  = pts.nextName  || null
      history.value   = pts.history   || []
      if (ruleData) rules.value = ruleData
      loaded.value    = true
    } catch {
      // silently fail — keep 0 pts (GAS may not be connected yet)
    } finally {
      loading.value = false
    }
  }

  async function loadRules(force = false) {
    if (rules.value.length && !force) return
    try {
      rules.value = await fetchRewardRules()
    } catch {}
  }

  async function doCheckin(employeeName) {
    if (checkedInToday.value || checkinLoading.value || !employeeName) return { alreadyCheckedIn: true }
    checkinLoading.value = true
    try {
      const res = await postDailyCheckin(employeeName)
      if (!res.alreadyCheckedIn) {
        checkedInToday.value = true
        localStorage.setItem(CHECKIN_KEY, todayStr())
        // Reload points to reflect new total
        await load(employeeName, true)
      }
      return res
    } catch {
      return { alreadyCheckedIn: false, error: true }
    } finally {
      checkinLoading.value = false
    }
  }

  return { total, level, levelName, nextPts, nextName, history, rules, loading, loaded, progress, checkedInToday, checkinLoading, load, loadRules, doCheckin }
})
