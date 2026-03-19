import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import * as svc from '../services/activitiesService.js'
import { fetchImages, getCached } from '../services/imageService.js'
import { lsGet, lsSet, stripBase64 } from '../utils/cache.js'

const TTL = 5 * 60 * 1000 // 5 min — admin อาจเปลี่ยน joinOpen บ่อย

export const useActivitiesStore = defineStore('activities', () => {
  const all       = ref([])
  const isLoading = ref(false)
  const loaded    = ref(false)

  const byMonth = computed(() => {
    const map = {}
    all.value.forEach(a => {
      const m = Number(a.monthIdx)
      if (!map[m]) map[m] = []
      map[m].push(a)
    })
    return map
  })

  function getMonth(monthIdx) {
    return byMonth.value[Number(monthIdx)] || []
  }

  async function load(force = false) {
    // In-session: already loaded → skip
    if (!force && loaded.value) return

    // Hydrate from localStorage immediately (user sees data at ~0ms)
    if (!all.value.length) {
      const cached = lsGet('activities')
      if (cached?.length) all.value = cached
    }

    // Only show spinner if nothing to display yet
    isLoading.value = !all.value.length
    try {
      const data = await svc.fetchAll()
      // Apply cached images immediately before lazy-fetch
      all.value  = data.map(a => {
        if (!a.imgId) return a
        if (a.imgUrl?.startsWith('http')) return a  // DB already has correct URL
        return { ...a, imgUrl: getCached(a.imgId) || a.imgUrl || '' }
      })
      loaded.value = true
      lsSet('activities', stripBase64(data, 'imgUrl'), TTL)
      // Lazy-fetch Drive images (only for Drive IDs, not Storage paths)
      const ids = [...new Set(data.map(a => String(a.imgId || '')).filter(id => id && !id.includes('/')))]
      if (ids.length) fetchImages(ids).then(map => {
        all.value = all.value.map(a => (a.imgId && map[a.imgId]) ? { ...a, imgUrl: map[a.imgId] } : a)
      }).catch(() => {})
    } catch {
      if (!loaded.value) loaded.value = !!all.value.length
    } finally {
      isLoading.value = false
    }
  }

  function localAdd(act)    { all.value.push(act) }
  function localDelete(id)  { all.value = all.value.filter(a => a.id !== id) }
  function localUpdate(id, fields) {
    const idx = all.value.findIndex(a => a.id === id)
    if (idx >= 0) Object.assign(all.value[idx], fields)
  }

  return { all, byMonth, isLoading, loaded, getMonth, load, localAdd, localUpdate, localDelete }
})
