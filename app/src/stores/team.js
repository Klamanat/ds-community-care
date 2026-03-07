import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as svc from '../services/teamService.js'
import { useUiStore } from './ui.js'

const GRADS = [
  'linear-gradient(135deg,#FBCFE8,#EC4899)',
  'linear-gradient(135deg,#DDD6FE,#7C3AED)',
  'linear-gradient(135deg,#BAE6FD,#38BDF8)',
  'linear-gradient(135deg,#A7F3D0,#34D399)',
  'linear-gradient(135deg,#FDE68A,#F59E0B)',
]
const SG_FALLBACKS = ['#FDE68A','#FECACA','#C7D2FE','#BBF7D0','#FED7E2','#DDD6FE']

export const useTeamStore = defineStore('team', () => {
  const empTeam      = ref([])
  const empDirectory = ref([])
  const sgMembers = ref([])
  const joinCount = ref(0)
  const isLoading = ref(false)
  const lastFetched = ref(null)

  function getSgFallback(idx) { return SG_FALLBACKS[idx % SG_FALLBACKS.length] }
  function getGrad(idx) { return GRADS[idx % GRADS.length] }

  async function loadTeam(force = false) {
    if (!force && lastFetched.value && (Date.now() - lastFetched.value) < 60000) return
    isLoading.value = true
    try {
      const data = await svc.fetchTeam()
      empTeam.value = data || []
      lastFetched.value = Date.now()
    } catch { } finally {
      isLoading.value = false
    }
  }

  async function loadStarGang() {
    try {
      const data = await svc.fetchStarGang()
      sgMembers.value = data || []
      joinCount.value = sgMembers.value.length
    } catch { }
  }

  async function loadDirectory() {
    try {
      const data = await svc.fetchDirectory()
      empDirectory.value = data || []
    } catch { }
  }

  async function addToTeam(member) {
    const ui = useUiStore()
    const exists = empTeam.value.some(m => m.id === member.id || m.name === member.name)
    if (exists) {
      ui.showToast('มีรายชื่อนี้ในทีมแล้ว')
      return
    }
    const newMember = { ...member, grad: getGrad(empTeam.value.length) }
    empTeam.value.push(newMember)
    try {
      await svc.addTeamMember(newMember)
      ui.showToast('เพิ่มสมาชิกสำเร็จ! ✨')
    } catch {
      empTeam.value = empTeam.value.filter(m => m.id !== newMember.id)
      ui.showToast('เกิดข้อผิดพลาด กรุณาลองใหม่')
    }
  }

  async function joinStarGang(member) {
    const ui = useUiStore()
    const temp = { ...member, id: 'sg_' + Date.now() }
    sgMembers.value.push(temp)
    joinCount.value++
    try {
      await svc.joinStarGang(member)
    } catch {
      sgMembers.value = sgMembers.value.filter(m => m.id !== temp.id)
      joinCount.value--
      ui.showToast('เกิดข้อผิดพลาด')
    }
  }

  return { empTeam, empDirectory, sgMembers, joinCount, isLoading, getSgFallback, getGrad, loadTeam, loadStarGang, loadDirectory, addToTeam, joinStarGang }
})
