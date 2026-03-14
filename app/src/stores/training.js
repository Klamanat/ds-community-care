import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import * as svc from '../services/trainingService.js'
import { useUiStore } from './ui.js'

export const useTrainingStore = defineStore('training', () => {
  const courses        = ref([])
  const myTrainingIds  = ref([])
  const isLoading      = ref(false)
  const lastFetched    = ref(null)
  const mySuggestion   = ref(null)   // null | { suggestion: string }

  // reviews: { [trainingId]: { avg, count, myStars, myComment } }
  const reviews        = reactive({})
  // allReviews: raw list for showing individual reviews inside detail
  const allReviews     = ref([])

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

  const SEED_COURSES = [
    { id: 's1',  category: 'idp',        title: 'การสื่อสารอย่างมีประสิทธิภาพ',      description: 'เทคนิคการสื่อสารในองค์กร',           instructor: 'อ.วิภาดา สุขใจ',  section: 'train2026' },
    { id: 's2',  category: 'superskills', title: 'Excel Advanced & Power BI',          description: 'วิเคราะห์ข้อมูลด้วย Power BI',         instructor: 'อ.ณัฐพล มีสุข',   section: 'train2026' },
    { id: 's3',  category: 'leadership',  title: 'Talent Leadership Program',          description: 'พัฒนาทักษะผู้นำรุ่นใหม่',             instructor: 'อ.ศิริพร แก้วใส', section: 'train2026' },
    { id: 's4',  category: 'external',    title: 'Design Thinking Workshop',           description: 'กระบวนการคิดเชิงออกแบบ',              instructor: 'อ.ปิยะ รัตนชัย',  section: 'train2026' },
    { id: 's5',  category: 'compulsory',  title: 'ความปลอดภัยในการทำงาน',             description: 'กฎระเบียบและแนวปฏิบัติความปลอดภัย', instructor: 'อ.สมชาย ดีงาม',   section: 'train2026' },
    { id: 's6',  category: 'superskills', title: 'AI & Prompt Engineering',            description: 'ใช้ AI ช่วยงานอย่างมีประสิทธิภาพ',     instructor: 'อ.กานต์ ใจดี',    section: 'new' },
    { id: 's7',  category: 'idp',         title: 'Presentation & Public Speaking',     description: 'นำเสนองานอย่างมั่นใจ',                instructor: 'อ.นภา พรมมา',     section: 'new' },
    { id: 's8',  category: 'external',    title: 'Project Management Professional',    description: 'บริหารโครงการแบบ PMP',                 instructor: 'อ.ธนา วิชัย',     section: 'new' },
    { id: 's9',  category: 'site',        title: 'Site Visit — โรงงานอมตะซิตี้',      description: 'เยี่ยมชมกระบวนการผลิต',               instructor: 'ทีม HR',          section: 'new' },
    { id: 's10', category: 'blog',        title: 'เขียน Internal Blog อย่างไรให้ปัง', description: 'เทคนิคการเขียนบทความภายใน',           instructor: 'อ.พิมพ์ใจ สดใส', section: 'new' },
  ]

  async function loadCourses(force = false) {
    if (!force && lastFetched.value && Date.now() - lastFetched.value < 60000) return
    isLoading.value = true
    try {
      const data = await svc.fetchTrainings()
      courses.value     = data.length ? data : SEED_COURSES
      lastFetched.value = Date.now()
    } catch {
      courses.value = SEED_COURSES
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

  async function loadMySuggestion(employeeId) {
    if (!employeeId) return
    try {
      mySuggestion.value = await svc.fetchMySiteSuggestion(employeeId)
    } catch {
      mySuggestion.value = null
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

  async function loadReviews(employeeId) {
    try {
      const data = await svc.fetchReviews()
      allReviews.value = data
      // Group by trainingId
      const map = {}
      data.forEach(r => {
        if (!map[r.trainingId]) map[r.trainingId] = { total: 0, count: 0, myStars: 0, myComment: '' }
        map[r.trainingId].total += r.stars
        map[r.trainingId].count++
        if (employeeId && String(r.employeeId) === String(employeeId)) {
          map[r.trainingId].myStars   = r.stars
          map[r.trainingId].myComment = r.comment
        }
      })
      Object.keys(map).forEach(tid => {
        const m = map[tid]
        reviews[tid] = {
          avg:       m.count ? Math.round((m.total / m.count) * 10) / 10 : 0,
          count:     m.count,
          myStars:   m.myStars,
          myComment: m.myComment,
        }
      })
    } catch {}
  }

  async function submitReview(trainingId, employeeId, employeeName, stars, comment) {
    const ui = useUiStore()
    try {
      await svc.submitReview(trainingId, employeeId, employeeName, stars, comment)
      // Update local state optimistically
      const cur = reviews[trainingId]
      if (cur) {
        const wasRated = cur.myStars > 0
        const newTotal = cur.avg * cur.count - (wasRated ? cur.myStars : 0) + stars
        const newCount = wasRated ? cur.count : cur.count + 1
        reviews[trainingId] = {
          avg:       Math.round((newTotal / newCount) * 10) / 10,
          count:     newCount,
          myStars:   stars,
          myComment: comment,
        }
      } else {
        reviews[trainingId] = { avg: stars, count: 1, myStars: stars, myComment: comment }
      }
      ui.showToast('ให้คะแนนสำเร็จ ⭐')
    } catch {
      ui.showToast('เกิดข้อผิดพลาด กรุณาลองใหม่')
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

  function reviewsForCourse(trainingId) {
    return allReviews.value.filter(r => String(r.trainingId) === String(trainingId))
  }

  return {
    courses, myTrainingIds, isLoading, categories, reviews, allReviews, mySuggestion,
    loadCourses, loadMyTrainings, loadMySuggestion, loadReviews, submitReview, register, cancel,
    coursesByCategory, isRegistered, getCategoryInfo, reviewsForCourse,
  }
})
