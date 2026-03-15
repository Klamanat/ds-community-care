import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { gasGet } from '../services/api.js'
import { fetchImages } from '../services/imageService.js'

export const useMentalStore = defineStore('mental', () => {
  // ── Advisors ─────────────────────────────────────────────────────────────
  const advisors = ref([])
  const loaded   = ref(false)

  async function loadAdvisors(force = false) {
    if (!force && loaded.value) return
    try {
      const [advisorRes, empRes] = await Promise.allSettled([
        gasGet('getMentalAdvisors'),
        gasGet('getEmployees'),
      ])
      const list = advisorRes.status === 'fulfilled' ? (advisorRes.value.data || []) : []
      advisors.value = list
      loaded.value   = true

      // Build employee map for image lookup
      if (empRes.status === 'fulfilled') {
        const empMap = {}
        ;(empRes.value.data || []).forEach(e => { if (e.id) empMap[String(e.id)] = e })
        const enriched = list.map(a => {
          const emp = empMap[String(a.employeeId || '')]
          if (!emp) return a
          return { ...a, imgId: emp.imgId || a.imgId || '', imgUrl: emp.imgUrl || a.imgUrl || '' }
        })
        advisors.value = enriched

        const ids = [...new Set(enriched.map(a => a.imgId).filter(Boolean))]
        if (ids.length) fetchImages(ids).then(map => {
          advisors.value = advisors.value.map(a =>
            a.imgId && map[a.imgId] ? { ...a, imgUrl: map[a.imgId] } : a
          )
        }).catch(() => {})
      }
    } catch {
      advisors.value = []
      loaded.value   = true
    }
  }

  function isCounselor(employeeId) {
    if (!employeeId) return false
    return advisors.value.some(a => a.employeeId && String(a.employeeId) === String(employeeId))
  }

  // ── Counselor Inbox (received messages) ──────────────────────────────────
  const myRequests      = ref([])
  const requestsLoaded  = ref(false)
  const requestsLoading = ref(false)
  const requestsError   = ref('')

  async function loadMyRequests(counselorEmployeeId, force = false) {
    if (!counselorEmployeeId) return
    if (!force && requestsLoaded.value) return
    requestsLoading.value = true
    requestsError.value   = ''
    try {
      const res        = await gasGet('getConsultRequests', { counselorEmployeeId })
      myRequests.value = res.data || []
      requestsLoaded.value = true
    } catch (e) {
      requestsError.value  = e.message || 'โหลดไม่สำเร็จ'
      requestsLoaded.value = true
    } finally {
      requestsLoading.value = false
    }
  }

  async function markRead(id) {
    try {
      await gasGet('markConsultRead', { id })
      const r = myRequests.value.find(r => r.id === id)
      if (r) r.isRead = 'true'
    } catch {}
  }

  async function addReply(requestId, reply, counselorEmployeeId) {
    await gasGet('addConsultReply', { requestId, reply, counselorEmployeeId })
    const r = myRequests.value.find(r => r.id === requestId)
    if (r) { r.reply = reply; r.repliedAt = new Date().toISOString(); r.isRead = 'true' }
    // Also update sender's view if loaded
    const sr = senderRequests.value.find(r => r.id === requestId)
    if (sr) { sr.reply = reply; sr.repliedAt = new Date().toISOString() }
  }

  const unreadCount = computed(() =>
    myRequests.value.filter(r => r.isRead !== 'true').length
  )

  // ── Sender History (sent messages + replies) ──────────────────────────────
  const senderRequests = ref([])
  const senderLoaded   = ref(false)
  const senderLoading  = ref(false)
  const senderError    = ref('')

  async function loadSenderRequests(senderEmployeeId, force = false) {
    if (!senderEmployeeId) return
    if (!force && senderLoaded.value) return
    senderLoading.value = true
    senderError.value   = ''
    try {
      const res            = await gasGet('getMyConsultRequests', { senderEmployeeId })
      senderRequests.value = res.data || []
      senderLoaded.value   = true
    } catch (e) {
      senderError.value    = e.message || 'โหลดไม่สำเร็จ'
      senderRequests.value = []
      senderLoaded.value   = true
    } finally {
      senderLoading.value = false
    }
  }

  async function submitRequest(counselorEmployeeId, message, senderEmployeeId) {
    await gasGet('submitConsultRequest', { counselorEmployeeId, message, senderEmployeeId })
    senderLoaded.value = false  // invalidate cache so history reloads
  }

  return {
    advisors, loaded, loadAdvisors, isCounselor,
    myRequests, requestsLoaded, requestsLoading, requestsError,
    loadMyRequests, markRead, addReply, unreadCount,
    senderRequests, senderLoaded, senderLoading, senderError,
    loadSenderRequests, submitRequest,
  }
})
