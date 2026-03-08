import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import * as svc from '../services/birthdayService.js'
import { useUiStore } from './ui.js'

const FALLBACK_BG = [
  'linear-gradient(135deg,#C7D2FE,#818CF8)',
  'linear-gradient(135deg,#FBCFE8,#F472B6)',
  'linear-gradient(135deg,#BBF7D0,#4ADE80)',
  'linear-gradient(135deg,#FDE68A,#F59E0B)',
  'linear-gradient(135deg,#FCA5A5,#EF4444)',
  'linear-gradient(135deg,#6EE7B7,#059669)',
]
const FALLBACK_EMOJI = ['😄','🌟','🦊','🦋','🐯','🌸']

export const useBirthdayStore = defineStore('birthday', () => {
  // allEmployees is reactive object keyed by month index
  const allEmployees = reactive({})
  const loadedMonths = ref(new Set())
  const isLoading = ref(false)

  const SENDER_AVATARS = [
    {av:'😊',bg:'linear-gradient(135deg,#C7D2FE,#818CF8)',name:'Anya R.'},
    {av:'🦁',bg:'linear-gradient(135deg,#BBF7D0,#4ADE80)',name:'Pam W.'},
    {av:'🐬',bg:'linear-gradient(135deg,#FDE68A,#F59E0B)',name:'Tom K.'},
    {av:'🌸',bg:'linear-gradient(135deg,#FBCFE8,#F472B6)',name:'Nok S.'},
  ]

  function getEmployee(key) {
    for (const arr of Object.values(allEmployees)) {
      const e = arr.find(x => x.key === key)
      if (e) return e
    }
    return null
  }

  function getFallbackBg(idx) { return FALLBACK_BG[idx % FALLBACK_BG.length] }
  function getFallbackEmoji(idx) { return FALLBACK_EMOJI[idx % FALLBACK_EMOJI.length] }
  function getSenderAvatar(idx) { return SENDER_AVATARS[idx % SENDER_AVATARS.length] }

  async function loadMonth(monthIdx, force = false) {
    if (!force && loadedMonths.value.has(monthIdx)) return
    isLoading.value = true
    try {
      const data = await svc.fetchMonth(monthIdx)
      allEmployees[monthIdx] = data || []
      loadedMonths.value.add(monthIdx)
    } catch {
      allEmployees[monthIdx] = []
      loadedMonths.value.add(monthIdx)
    } finally {
      isLoading.value = false
    }
  }

  async function sendWish(key, msg, fromName, avIdx) {
    const ui = useUiStore()
    const emp = getEmployee(key)
    if (!emp) return
    const temp = { from: fromName, avIdx, msg, time: 'เมื่อกี้' }
    emp.wishes.unshift(temp)
    try {
      await svc.addWish(key, msg, fromName, avIdx)
      ui.showToast('ส่งคำอวยพรสำเร็จ! 🎉')
    } catch {
      emp.wishes = emp.wishes.filter(w => w !== temp)
      ui.showToast('เกิดข้อผิดพลาด กรุณาลองใหม่')
    }
  }

  async function loadWishes(key) {
    const emp = getEmployee(key)
    if (!emp) return
    try {
      emp.wishes = await svc.fetchWishes(key)
    } catch { /* keep empty */ }
  }

  async function uploadPhoto(key, dataUrl) {
    const emp = getEmployee(key)
    if (!emp) return
    // Optimistic: show immediately
    emp.photo = dataUrl
    try {
      await svc.uploadPhoto(key, dataUrl)
    } catch {
      // Keep local preview even if GAS fails — photo is stored in memory this session
    }
  }

  return { allEmployees, loadedMonths, isLoading, getEmployee, getFallbackBg, getFallbackEmoji, getSenderAvatar, loadMonth, loadWishes, sendWish, uploadPhoto }
})
