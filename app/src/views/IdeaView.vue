<template>
  <div class="tab-page idea-page">
    <div class="mb-4">
      <div class="text-[20px] font-extrabold text-app-dark mb-1">💡 เสนอแนะ & ไอเดียกิจกรรม</div>
      <div class="text-[12px] text-app-light">แชร์ไอเดียดีๆ ให้ทีม HR รับรู้</div>
    </div>

    <!-- Submit form -->
    <div class="bg-white rounded-[20px] p-4 shadow-app-sm">
      <div class="text-[12px] font-bold text-app-dark mb-2">หมวดหมู่</div>
      <div class="flex flex-wrap gap-1.5 mb-4">
        <button
          v-for="cat in ideas.categories"
          :key="cat"
          class="idea-cat-btn"
          :class="{ active: ideas.selectedCategory === cat }"
          @click="ideas.selectCategory(cat)"
        >{{ cat }}</button>
      </div>
      <input
        v-model="title"
        type="text"
        placeholder="ชื่อกิจกรรม / ไอเดีย"
        maxlength="200"
        class="w-full px-4 py-2.5 border-[1.5px] border-app-border rounded-xl text-[13px]
               text-app-dark bg-app-bg outline-none mb-2"
      />
      <textarea
        v-model="detail"
        placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
        rows="3"
        maxlength="500"
        class="w-full px-4 py-2.5 border-[1.5px] border-app-border rounded-xl text-[13px]
               text-app-dark bg-app-bg outline-none resize-none mb-3"
      ></textarea>
      <button
        class="modal-close-btn disabled:opacity-50"
        :disabled="!title.trim()"
        @click="submit"
      >✨ ส่งไอเดีย</button>
    </div>

    <!-- Idea list -->
    <div v-if="ideas.isLoading" class="flex flex-col gap-2.5">
      <SkeletonCard v-for="i in 3" :key="i" height="80px" />
    </div>
    <div v-else class="flex flex-col gap-2.5">
      <div v-for="idea in ideas.filteredIdeas()" :key="idea.id" class="idea-card">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-[11px] font-bold text-indigo bg-[#EEF2FF] px-2.5 py-0.5 rounded-full">
            {{ idea.category }}
          </span>
          <span class="text-[10px] text-app-light">{{ idea.createdAt }}</span>
        </div>
        <div class="text-[13px] font-bold text-app-dark mb-1">{{ idea.title }}</div>
        <div v-if="idea.detail" class="text-[12px] text-app-mid leading-relaxed">{{ idea.detail }}</div>
        <div class="flex items-center justify-between mt-2">
          <span class="text-[11px] text-app-light">โดย {{ idea.submitterName }}</span>
          <span
            class="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
            :class="statusClass(idea.status)"
          >{{ statusLabel(idea.status) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import SkeletonCard from '../components/shared/SkeletonCard.vue'
import { useIdeasStore } from '../stores/ideas.js'
import { useUiStore } from '../stores/ui.js'

const ideas = useIdeasStore()
const ui = useUiStore()
const title = ref('')
const detail = ref('')

onMounted(() => ideas.loadIdeas())

function submit() {
  if (!title.value.trim()) return
  if (!ideas.selectedCategory) { ui.showToast('กรุณาเลือกหมวดหมู่'); return }
  ideas.submitIdea({
    category: ideas.selectedCategory,
    title: title.value.trim(),
    detail: detail.value.trim(),
    submitterName: ui.currentUser.name
  })
  title.value = ''
  detail.value = ''
  ideas.selectedCategory = null
}

function statusLabel(s) {
  return s === 'approved' ? '✅ อนุมัติ' : s === 'rejected' ? '❌ ปฏิเสธ' : '⏳ รอพิจารณา'
}
function statusClass(s) {
  if (s === 'approved') return 'bg-[#D1FAE5] text-[#065F46]'
  if (s === 'rejected') return 'bg-[#FEE2E2] text-[#991B1B]'
  return 'bg-[#EEF2FF] text-indigo'
}
</script>
