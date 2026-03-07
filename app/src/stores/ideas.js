import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as svc from '../services/ideaService.js'
import { useUiStore } from './ui.js'

export const useIdeasStore = defineStore('ideas', () => {
  const ideas = ref([])
  const selectedCategory = ref(null)
  const isLoading = ref(false)
  const lastFetched = ref(null)

  const categories = ['🎉 สังสรรค์','🏃 กีฬา','📚 เรียนรู้','🤝 CSR','🎨 ครีเอทีฟ','💬 อื่นๆ']

  async function loadIdeas(force = false) {
    if (!force && lastFetched.value && (Date.now() - lastFetched.value) < 60000) return
    isLoading.value = true
    try {
      const data = await svc.fetchIdeas()
      ideas.value = data || []
      lastFetched.value = Date.now()
    } catch {
      ideas.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function submitIdea(payload) {
    const ui = useUiStore()
    const temp = { ...payload, id: 'tmp_' + Date.now(), status: 'pending', createdAt: new Date().toISOString().split('T')[0] }
    ideas.value.unshift(temp)
    try {
      const created = await svc.submitIdea(payload)
      const idx = ideas.value.findIndex(i => i.id === temp.id)
      if (idx !== -1) ideas.value[idx] = created
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

  return { ideas, selectedCategory, isLoading, categories, loadIdeas, submitIdea, selectCategory, filteredIdeas }
})
