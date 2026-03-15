import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { gasGet } from '../services/api.js'

export const useMentalStore = defineStore('mental', () => {
  // ── Advisors ─────────────────────────────────────────────────────────────
  const advisors = ref([])
  const loaded   = ref(false)

  async function loadAdvisors(force = false) {
    if (!force && loaded.value) return
    try {
      const res      = await gasGet('getMentalAdvisors')
      advisors.value = res.data || []
      loaded.value   = true
    } catch {
      advisors.value = []
      loaded.value   = true
    }
  }

  function isCounselor(employeeId) {
    if (!employeeId) return false
    return advisors.value.some(a => a.employeeId && String(a.employeeId) === String(employeeId))
  }

  // ── Consultation Requests ─────────────────────────────────────────────────
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

  async function submitRequest(counselorEmployeeId, message) {
    await gasGet('submitConsultRequest', { counselorEmployeeId, message })
  }

  async function markRead(id) {
    try {
      await gasGet('markConsultRead', { id })
      const r = myRequests.value.find(r => r.id === id)
      if (r) r.isRead = 'true'
    } catch {}
  }

  const unreadCount = computed(() =>
    myRequests.value.filter(r => r.isRead !== 'true').length
  )

  return {
    advisors, loaded, loadAdvisors, isCounselor,
    myRequests, requestsLoaded, requestsLoading, requestsError,
    loadMyRequests, submitRequest, markRead, unreadCount,
  }
})
