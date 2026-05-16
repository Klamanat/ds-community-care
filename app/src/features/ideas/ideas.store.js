import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as svc from './ideaService.js'
import { useUiStore } from '../../core/stores/ui.js'

const RATE_KEY      = 'ds_idea_last'
const RATE_LIMIT_MS = 60 * 1000  // 1 submit per minute per device

export const useIdeasStore = defineStore('ideas', () => {
  const ideas = ref([])
  const selectedCategory = ref(null)
  const isLoading = ref(false)
  const loadError = ref('')
  const lastFetched = ref(null)

  const categories = ['🎉 สังสรรค์','🏃 กีฬา','📚 เรียนรู้','🤝 CSR','🎨 ครีเอทีฟ','💬 อื่นๆ']

  async function loadIdeas(force = false) {
    if (!force && lastFetched.value && (Date.now() - lastFetched.value) < 60000) return
    isLoading.value = true
    loadError.value = ''
    try {
      const data = await svc.fetchIdeas()
      ideas.value = data || []
      lastFetched.value = Date.now()
    } catch (e) {
      loadError.value = e?.message || 'โหลดไอเดียไม่สำเร็จ'
      ideas.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function submitIdea(payload) {
    const ui = useUiStore()

    // Client-side rate limit — 1 submit per minute
    const lastSubmit = Number(localStorage.getItem(RATE_KEY) || 0)
    const elapsed    = Date.now() - lastSubmit
    if (elapsed < RATE_LIMIT_MS) {
      const secLeft = Math.ceil((RATE_LIMIT_MS - elapsed) / 1000)
      ui.showToast(`กรุณารอ ${secLeft} วินาทีก่อนส่งไอเดียใหม่`)
      return
    }

    const temp = { ...payload, id: 'tmp_' + Date.now(), status: 'pending', createdAt: new Date().toISOString().split('T')[0] }
    ideas.value.unshift(temp)
    try {
      const created = await svc.submitIdea(payload)
      const idx = ideas.value.findIndex(i => i.id === temp.id)
      if (idx !== -1) ideas.value[idx] = created
      localStorage.setItem(RATE_KEY, String(Date.now()))
      ui.showToast('ส่งไอเดียสำเร็จ! 💡')
    } catch {
      ideas.value = ideas.value.filter(i => i.id !== temp.id)
      ui.showToast('เกิดข้อผิดพลาด กรุณาลองใหม่')
    }
  }

  function selectCategory(cat) {
    selectedCategory.value = selectedCategory.value === cat ? null : cat
  }

  const filteredIdeas = () => {
    if (!selectedCategory.value) return ideas.value
    return ideas.value.filter(i => i.category === selectedCategory.value)
  }

  return { ideas, selectedCategory, isLoading, loadError, categories, loadIdeas, submitIdea, selectCategory, filteredIdeas }
})
