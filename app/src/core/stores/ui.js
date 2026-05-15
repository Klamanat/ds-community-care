import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const activeModal = ref(null)
  const selectedMonthIdx = ref(1)
  const notifBadge = ref(0)
  const currentUser = ref({ id: '', name: '', role: '', img: '', dept: '', emoji: '😊' })
  const ticketActivity = ref(null)
  const toast = ref({ msg: '', visible: false })
  const modalKeys = reactive({})
  let _toastTimer = null

  function openModal(id) {
    modalKeys[id] = (modalKeys[id] || 0) + 1
    activeModal.value = id
    document.body.classList.add('modal-open')
  }

  function openMonthModal(idx) {
    selectedMonthIdx.value = idx
    openModal('modal-month')
  }

  function closeModal() {
    activeModal.value = null
    document.body.classList.remove('modal-open')
  }

  function showToast(msg, duration = 2500) {
    toast.value = { msg, visible: true }
    clearTimeout(_toastTimer)
    _toastTimer = setTimeout(() => {
      toast.value = { msg: '', visible: false }
    }, duration)
  }

  function clearNotifBadge() {
    notifBadge.value = 0
  }

  return { activeModal, modalKeys, selectedMonthIdx, notifBadge, currentUser, ticketActivity, toast, openModal, openMonthModal, closeModal, showToast, clearNotifBadge }
})
