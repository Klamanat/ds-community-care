<template>
  <div class="idea-page">
    <div style="margin-bottom:16px;">
      <div style="font-size:20px;font-weight:800;color:var(--dark);margin-bottom:4px;">💡 เสนอแนะ & ไอเดียกิจกรรม</div>
      <div style="font-size:12px;color:var(--light);">แชร์ไอเดียดีๆ ให้ทีม HR รับรู้</div>
    </div>

    <!-- Submit form -->
    <div style="background:white;border-radius:20px;padding:16px;box-shadow:var(--sh-sm);margin-bottom:16px;">
      <div style="font-size:12px;font-weight:700;color:var(--dark);margin-bottom:10px;">หมวดหมู่</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;">
        <button
          v-for="cat in ideas.categories"
          :key="cat"
          class="idea-cat-btn"
          :class="{ selected: ideas.selectedCategory === cat }"
          @click="ideas.selectCategory(cat)"
        >{{ cat }}</button>
      </div>
      <input
        v-model="title"
        type="text"
        placeholder="ชื่อกิจกรรม / ไอเดีย"
        maxlength="200"
        style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:12px;font-family:'Sarabun',sans-serif;font-size:13px;margin-bottom:8px;outline:none;box-sizing:border-box;"
      />
      <textarea
        v-model="detail"
        placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
        rows="3"
        maxlength="500"
        style="width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:12px;font-family:'Sarabun',sans-serif;font-size:13px;resize:none;outline:none;margin-bottom:10px;box-sizing:border-box;"
      ></textarea>
      <button
        class="modal-close-btn"
        style="margin-top:0;"
        :disabled="!title.trim()"
        @click="submit"
      >✨ ส่งไอเดีย</button>
    </div>

    <!-- Idea list -->
    <div v-if="ideas.isLoading">
      <SkeletonCard v-for="i in 3" :key="i" height="80px" radius="16px" style="margin-bottom:10px;" />
    </div>
    <div v-else style="display:flex;flex-direction:column;gap:10px;">
      <div
        v-for="idea in ideas.filteredIdeas()"
        :key="idea.id"
        class="idea-card"
      >
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:11px;font-weight:700;color:var(--indigo);background:#EEF2FF;padding:3px 10px;border-radius:20px;">{{ idea.category }}</span>
          <span style="font-size:10px;color:var(--light);">{{ idea.createdAt }}</span>
        </div>
        <div style="font-size:13px;font-weight:700;color:var(--dark);margin-bottom:4px;">{{ idea.title }}</div>
        <div v-if="idea.detail" style="font-size:12px;color:var(--mid);line-height:1.5;">{{ idea.detail }}</div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;">
          <span style="font-size:11px;color:var(--light);">โดย {{ idea.submitterName }}</span>
          <span :style="statusStyle(idea.status)" style="font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;">{{ statusLabel(idea.status) }}</span>
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
function statusStyle(s) {
  if (s === 'approved') return 'background:#D1FAE5;color:#065F46;'
  if (s === 'rejected') return 'background:#FEE2E2;color:#991B1B;'
  return 'background:#EEF2FF;color:var(--indigo);'
}
</script>
