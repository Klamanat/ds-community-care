import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { gasGet } from '../services/api.js'

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
    _pushToServer([id])
  }

  function markAllRead() {
    const newIds = items.value.filter(n => !readIds.value.has(n.id)).map(n => n.id)
    items.value.forEach(n => readIds.value.add(n.id))
    _persist()
    if (newIds.length) _pushToServer(newIds)
  }

  function _persist() {
    localStorage.setItem(LS_READ, JSON.stringify([...readIds.value]))
  }

  // Fire-and-forget — does not block UI
  function _pushToServer(ids) {
    if (!ids.length || !_lastEmp) return
    gasGet('markNotifsRead', { employeeName: _lastEmp, ids: JSON.stringify(ids) }).catch(() => {})
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
      // Fetch notifications + server readIds in parallel
      const monthIdx = new Date().getMonth() + 1
      const [notifRes, readsRes] = await Promise.all([
        gasGet('getNotifications', { employeeName, monthIdx }),
        employeeName
          ? gasGet('getNotifReads', { employeeName }).catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] }),
      ])

      if (Array.isArray(notifRes.data)) {
        items.value = notifRes.data
        _lastFetch  = Date.now()
        localStorage.setItem(LS_DATA, JSON.stringify({
          exp: Date.now() + TTL,
          emp: employeeName,
          items: notifRes.data,
        }))
      }

      // Merge server readIds into local set
      const serverIds = Array.isArray(readsRes.data) ? readsRes.data : []
      if (serverIds.length) {
        serverIds.forEach(id => readIds.value.add(id))
        _persist()
      }
    } catch {}
    finally { loading.value = false }
  }

  return { items, readIds, loading, unreadCount, isRead, load, markRead, markAllRead }
})
