import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as svc from '../services/trainingService.js'
import { useUiStore } from './ui.js'

export const useTrainingStore = defineStore('training', () => {
  const courses        = ref([])
  const myTrainingIds  = ref([])
  const isLoading      = ref(false)
  const lastFetched    = ref(null)

  const categories = [
    { key: 'annual',      icon: '📅', name: 'Annual Training',           tag: 'ประจำปี',          color: '#0EA5E9', bgColor: '#E0F2FE' },
    { key: 'idp',         icon: '🎯', name: 'IDP',                       tag: 'แผนพัฒนาตนเอง',   color: '#A855F7', bgColor: '#F5F3FF' },
    { key: 'blog',        icon: '✍️',  name: 'Internal Blog',             tag: 'บทความภายใน',     color: '#EC4899', bgColor: '#FDF2F8' },
    { key: 'external',    icon: '🌐', name: 'External Training',          tag: 'อบรมภายนอก',      color: '#F59E0B', bgColor: '#FFFBEB' },
    { key: 'compulsory',  icon: '📋', name: 'Compulsory Program',         tag: 'หลักสูตรบังคับ',  color: '#EF4444', bgColor: '#FFF1F2' },
    { key: 'superskills', icon: '⭐', name: 'SuperSkills 2026',           tag: 'คอร์สแนะนำ',      color: '#10B981', bgColor: '#ECFDF5', wide: true },
    { key: 'site',        icon: '🏭', name: 'Site Visit',                 tag: 'เยี่ยมชมสถานที่', color: '#06B6D4', bgColor: '#ECFEFF' },
    { key: 'leadership',  icon: '👑', name: 'Talent & Leadership',        tag: 'ผู้นำรุ่นใหม่',   color: '#8B5CF6', bgColor: '#F5F3FF' },
  ]

  async function loadCourses(force = false) {
    if (!force && lastFetched.value && Date.now() - lastFetched.value < 60000) return
    isLoading.value = true
    try {
      courses.value     = await svc.fetchTrainings()
      lastFetched.value = Date.now()
    } catch {
      courses.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function loadMyTrainings(employeeId) {
    if (!employeeId) return
    try {
      myTrainingIds.value = await svc.fetchMyTrainings(employeeId)
    } catch {
      myTrainingIds.value = []
    }
  }

  async function register(trainingId, employeeId, employeeName) {
    const ui = useUiStore()
    try {
      await svc.registerTraining(trainingId, employeeId, employeeName)
      if (!myTrainingIds.value.includes(trainingId)) myTrainingIds.value.push(trainingId)
      const c = courses.value.find(c => c.id === trainingId)
      if (c) c.joinCount = (c.joinCount || 0) + 1
      ui.showToast('ลงทะเบียนสำเร็จ! 🎓')
    } catch (e) {
      const msg = e?.message || ''
      if (msg.includes('already_registered')) ui.showToast('ลงทะเบียนไปแล้ว')
      else if (msg.includes('full'))          ui.showToast('เต็มแล้ว ขออภัย')
      else                                    ui.showToast('เกิดข้อผิดพลาด กรุณาลองใหม่')
    }
  }

  async function cancel(trainingId, employeeId) {
    const ui = useUiStore()
    try {
      await svc.cancelRegistration(trainingId, employeeId)
      myTrainingIds.value = myTrainingIds.value.filter(id => id !== trainingId)
      const c = courses.value.find(c => c.id === trainingId)
      if (c && c.joinCount > 0) c.joinCount--
      ui.showToast('ยกเลิกการลงทะเบียนแล้ว')
    } catch {
      ui.showToast('เกิดข้อผิดพลาด')
    }
  }

  function coursesByCategory(catKey) {
    return courses.value.filter(c => c.category === catKey)
  }

  function isRegistered(trainingId) {
    return myTrainingIds.value.includes(String(trainingId))
  }

  function getCategoryInfo(catKey) {
    return categories.find(c => c.key === catKey) || { icon: '📚', name: catKey, color: '#6366f1', bgColor: '#EEF2FF' }
  }

  return {
    courses, myTrainingIds, isLoading, categories,
    loadCourses, loadMyTrainings, register, cancel,
    coursesByCategory, isRegistered, getCategoryInfo,
  }
})
