import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const activeModal = ref(null)
  const selectedMonthIdx = ref(1)
  const notifBadge = ref(3)
  const currentUser = ref({ id: '', name: '', role: '', img: '', dept: '', emoji: '😊' })
  const toast = ref({ msg: '', visible: false })
  let _toastTimer = null

  function openModal(id) {
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

  return { activeModal, selectedMonthIdx, notifBadge, currentUser, toast, openModal, openMonthModal, closeModal, showToast, clearNotifBadge }
})
