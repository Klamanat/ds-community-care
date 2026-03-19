import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import * as svc from '../services/birthdayService.js'
import { useUiStore } from './ui.js'
import { lsGet, lsSet, stripBase64 } from '../utils/cache.js'
import { fetchImages, getCached } from '../services/imageService.js'

const TTL = 60 * 60 * 1000 // 60 min — birthday data changes rarely

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
  const allEmployees = reactive({})
  const loadedMonths = ref(new Set())
  const isLoading    = ref(false)

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

  function getFallbackBg(idx)    { return FALLBACK_BG[idx % FALLBACK_BG.length] }
  function getFallbackEmoji(idx) { return FALLBACK_EMOJI[idx % FALLBACK_EMOJI.length] }
  function getSenderAvatar(idx)  { return SENDER_AVATARS[idx % SENDER_AVATARS.length] }

  async function loadMonth(monthIdx, force = false) {
    // In-session: already loaded → skip
    if (!force && loadedMonths.value.has(monthIdx)) return

    // Hydrate from localStorage immediately
    if (!allEmployees[monthIdx]) {
      const cached = lsGet('bday_m' + monthIdx)
      if (cached) { allEmployees[monthIdx] = cached; loadedMonths.value.add(monthIdx) }
    }

    isLoading.value = !allEmployees[monthIdx]
    try {
      const data = await svc.fetchMonth(monthIdx)
      // Apply cached Drive images immediately — no waiting for getImages call
      const enriched = (data || []).map(e => ({
        ...e, photo: e.photo || getCached(e.imgId) || '',
      }))
      allEmployees[monthIdx] = enriched
      loadedMonths.value.add(monthIdx)
      lsSet('bday_m' + monthIdx, stripBase64(enriched, 'imgUrl', 'photo'), TTL)
      // Lazy-fetch images in background (mutate in-place to preserve object references)
      const ids = [...new Set(enriched.map(e => e.imgId).filter(Boolean))]
      if (ids.length) fetchImages(ids).then(map => {
        if (!allEmployees[monthIdx]) return
        allEmployees[monthIdx].forEach(e => {
          if (e.imgId && map[e.imgId]) e.photo = map[e.imgId]
        })
      }).catch(() => {})
    } catch {
      if (!allEmployees[monthIdx]) allEmployees[monthIdx] = []
      loadedMonths.value.add(monthIdx)
    } finally {
      isLoading.value = false
    }
  }

  async function sendWish(key, msg, fromName, avIdx, fromImgId = '', photo = '') {
    const ui  = useUiStore()
    const emp = getEmployee(key)
    if (!emp) return
    const temp = { from: fromName, avIdx, fromImgId, photo: photo || getCached(fromImgId) || '', msg, time: 'เมื่อกี้' }
    emp.wishes.unshift(temp)
    try {
      await svc.addWish(key, msg, fromName, avIdx, fromImgId)
      ui.showToast('ส่งคำอวยพรสำเร็จ! 🎉')
    } catch {
      emp.wishes = emp.wishes.filter(w => w !== temp)
      ui.showToast('เกิดข้อผิดพลาด กรุณาลองใหม่')
    }
  }

  async function loadWishes(key) {
    try {
      const wishes = await svc.fetchWishes(key)
      // Also update in-store emp for grid wish count
      const emp = getEmployee(key)
      if (emp) emp.wishes = wishes
      return wishes
    } catch { return [] }
  }

  async function deleteWish(empKey, wishId) {
    const emp = getEmployee(empKey)
    if (!emp) return
    const prev = [...emp.wishes]
    emp.wishes = emp.wishes.filter(w => w.id !== wishId)
    try {
      await svc.deleteWish(wishId)
      useUiStore().showToast('ลบคำอวยพรแล้ว')
    } catch {
      emp.wishes = prev
      useUiStore().showToast('ลบไม่สำเร็จ กรุณาลองใหม่')
    }
  }

  async function updateWish(empKey, wishId, msg) {
    const emp = getEmployee(empKey)
    if (!emp) return
    const w = emp.wishes.find(x => x.id === wishId)
    if (!w) return
    const prevMsg = w.msg
    w.msg = msg
    try {
      await svc.updateWish(wishId, msg)
      useUiStore().showToast('แก้ไขคำอวยพรแล้ว ✓')
    } catch {
      w.msg = prevMsg
      useUiStore().showToast('แก้ไขไม่สำเร็จ กรุณาลองใหม่')
    }
  }

  async function uploadPhoto(key, dataUrl) {
    const emp = getEmployee(key)
    if (!emp) return
    emp.photo = dataUrl
    try { await svc.uploadPhoto(key, dataUrl) } catch {}
  }

  return { allEmployees, loadedMonths, isLoading, getEmployee, getFallbackBg, getFallbackEmoji, getSenderAvatar, loadMonth, loadWishes, sendWish, deleteWish, updateWish, uploadPhoto }
})
