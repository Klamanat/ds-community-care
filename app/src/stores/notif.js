import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../services/supabase.js'

const LS_READ = 'notif_read'
const LS_DATA = 'notif_cache'
const TTL     = 5 * 60 * 1000   // 5 min

function loadReadIds() {
  try { return new Set(JSON.parse(localStorage.getItem(LS_READ) || '[]')) } catch { return new Set() }
}

export const useNotifStore = defineStore('notif', () => {
  const items     = ref([])
  const readIds   = ref(loadReadIds())
  const loading   = ref(false)
  let   _lastFetch = 0
  let   _lastEmp   = ''

  const unreadCount = computed(() =>
    items.value.filter(n => !readIds.value.has(n.id)).length
  )

  function isRead(id) { return readIds.value.has(id) }

  function markRead(id) {
    if (readIds.value.has(id)) return
    readIds.value.add(id)
    _persist()
  }

  function markAllRead() {
    items.value.forEach(n => readIds.value.add(n.id))
    _persist()
  }

  function _persist() {
    localStorage.setItem(LS_READ, JSON.stringify([...readIds.value]))
  }

  function _hydrate(emp) {
    try {
      const c = JSON.parse(localStorage.getItem(LS_DATA) || 'null')
      if (c && c.exp > Date.now() && c.emp === emp) {
        items.value = c.items
        _lastFetch  = Date.now()
        _lastEmp    = emp
        return true
      }
    } catch {}
    return false
  }

  async function load(employeeName = '', force = false) {
    const fresh = !force && Date.now() - _lastFetch < TTL && _lastEmp === employeeName
    if (fresh) return

    _lastEmp = employeeName
    _hydrate(employeeName)
    loading.value = true

    try {
      const monthIdx = new Date().getMonth() + 1
      const { data, error } = await supabase.rpc('get_notifications', {
        p_emp_name:   employeeName,
        p_month_idx:  monthIdx,
      })
      if (error) throw new Error(error.message)

      if (Array.isArray(data)) {
        items.value = data
        _lastFetch  = Date.now()
        localStorage.setItem(LS_DATA, JSON.stringify({
          exp:   Date.now() + TTL,
          emp:   employeeName,
          items: data,
        }))
      }
    } catch {}
    finally { loading.value = false }
  }

  return { items, readIds, loading, unreadCount, isRead, load, markRead, markAllRead }
})
