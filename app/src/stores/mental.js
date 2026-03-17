import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  fetchAdvisors,
  fetchCounselorRequests, fetchSenderRequests,
  submitConsultRequest, markConsultRead, addConsultReply,
} from '../services/mentalService.js'
import { fetchImages } from '../services/imageService.js'
import { fetchAllEmployees } from '../services/teamService.js'

export const useMentalStore = defineStore('mental', () => {
  // ── Advisors ─────────────────────────────────────────────────────────────
  const advisors = ref([])
  const loaded   = ref(false)

  async function loadAdvisors(force = false) {
    if (!force && loaded.value) return
    try {
      const [list, emps] = await Promise.all([
        fetchAdvisors(),
        fetchAllEmployees(),
      ])
      loaded.value = true

      // Enrich with employee images
      if (emps.length) {
        const empMap = {}
        emps.forEach(e => { if (e.id) empMap[String(e.id)] = e })
        const enriched = list.map(a => {
          const emp = empMap[String(a.employeeId || '')]
          if (!emp) return a
          return { ...a, imgId: emp.imgId || a.imgId || '', imgUrl: emp.imgUrl || a.imgUrl || '' }
        })
        advisors.value = enriched

        const ids = [...new Set(enriched.map(a => a.imgId).filter(Boolean))]
        if (ids.length) fetchImages(ids).then(map => {
          advisors.value = advisors.value.map(a => {
            if (!a.imgId || !map[a.imgId]) return a
            if (a.imgUrl) return a
            return { ...a, imgUrl: map[a.imgId] }
          })
        }).catch(() => {})
      } else {
        advisors.value = list
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
      myRequests.value     = await fetchCounselorRequests(counselorEmployeeId)
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
      await markConsultRead(id)
      const r = myRequests.value.find(r => r.id === id)
      if (r) r.isRead = true
    } catch {}
  }

  async function addReply(requestId, reply, counselorEmployeeId) {
    await addConsultReply(requestId, reply, counselorEmployeeId)
    const r = myRequests.value.find(r => r.id === requestId)
    if (r) { r.reply = reply; r.repliedAt = new Date().toISOString(); r.isRead = true }
    const sr = senderRequests.value.find(r => r.id === requestId)
    if (sr) { sr.reply = reply; sr.repliedAt = new Date().toISOString() }
  }

  const unreadCount = computed(() =>
    myRequests.value.filter(r => !r.isRead).length
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
      senderRequests.value = await fetchSenderRequests(senderEmployeeId)
      senderLoaded.value   = true
    } catch (e) {
      senderError.value    = e.message || 'โหลดไม่สำเร็จ'
      senderRequests.value = []
      senderLoaded.value   = true
    } finally {
      senderLoading.value = false
    }
  }

  async function doSubmitRequest(counselorEmployeeId, message, senderEmployeeId, senderName) {
    await submitConsultRequest(counselorEmployeeId, message, senderEmployeeId, senderName)
    senderLoaded.value = false  // invalidate cache so history reloads
  }

  return {
    advisors, loaded, loadAdvisors, isCounselor,
    myRequests, requestsLoaded, requestsLoading, requestsError,
    loadMyRequests, markRead, addReply, unreadCount,
    senderRequests, senderLoaded, senderLoading, senderError,
    loadSenderRequests,
    submitRequest: doSubmitRequest,
  }
})
