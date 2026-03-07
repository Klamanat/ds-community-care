import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import * as svc from '../services/activitiesService.js'

export const useActivitiesStore = defineStore('activities', () => {
  const all       = ref([])   // flat list, loaded once
  const isLoading = ref(false)
  const loaded    = ref(false)

  // Group by monthIdx (1-12)
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
    if (!force && loaded.value) return
    isLoading.value = true
    try {
      all.value = await svc.fetchAll()
      loaded.value = true
    } catch {
      all.value = []
    } finally {
      isLoading.value = false
    }
  }

  // Local optimistic mutations (admin use)
  function localAdd(act) { all.value.push(act) }

  function localUpdate(id, fields) {
    const idx = all.value.findIndex(a => a.id === id)
    if (idx >= 0) Object.assign(all.value[idx], fields)
  }

  function localDelete(id) {
    all.value = all.value.filter(a => a.id !== id)
  }

  return { all, byMonth, isLoading, loaded, getMonth, load, localAdd, localUpdate, localDelete }
})
