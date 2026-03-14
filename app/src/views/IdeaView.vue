<template>
  <div class="tab-page idea-page">

    <!-- Header -->
    <div class="text-center fade-in mb-1">
      <div class="text-[48px] mb-2" style="filter:drop-shadow(0 0 16px rgba(99,102,241,0.4));">💡</div>
      <div class="text-[22px] font-black bg-[linear-gradient(90deg,#6366f1,#818cf8,#4f46e5)] bg-clip-text text-transparent tracking-widest">ไอเดียดีๆ</div>
      <div class="text-[11px] text-app-light mt-1">แชร์ไอเดียกิจกรรมให้ทีม HR รับรู้ ✨</div>
    </div>

    <!-- Submit form card -->
    <div class="idea-form-card fade-in">
      <div class="idea-form-title">✦ เสนอไอเดียใหม่</div>

      <!-- Category pills -->
      <div class="text-[11px] font-bold text-app-mid mb-2">หมวดหมู่</div>
      <div class="flex flex-wrap gap-1.5 mb-4">
        <button
          v-for="cat in ideas.categories"
          :key="cat"
          class="idea-cat-btn"
          :class="{ 'idea-cat-active': ideas.selectedCategory === cat }"
          @click="ideas.selectCategory(cat)"
        >{{ cat }}</button>
      </div>

      <!-- Title -->
      <input
        v-model="title"
        type="text"
        placeholder="ชื่อกิจกรรม / ไอเดีย *"
        maxlength="200"
        class="idea-input mb-2"
      />

      <!-- Detail -->
      <textarea
        v-model="detail"
        placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
        rows="3"
        maxlength="500"
        class="idea-input resize-none mb-3"
      ></textarea>

      <!-- Anonymous toggle + submit -->
      <div class="flex items-center justify-between gap-3">
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <div
            class="w-9 h-5 rounded-full relative transition-colors duration-200"
            :style="anonymous ? 'background:#6366f1' : 'background:#D1D5DB'"
            @click="anonymous = !anonymous"
          >
            <div
              class="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
              :style="anonymous ? 'transform:translateX(16px)' : 'transform:translateX(2px)'"
            ></div>
          </div>
          <span class="text-[11px] text-app-light">ไม่ระบุชื่อ</span>
        </label>
        <button
          class="idea-submit-btn"
          :class="{ 'opacity-40 cursor-not-allowed': !canSubmit }"
          :disabled="!canSubmit || submitting"
          @click="submit"
        >
          <span v-if="submitting">⏳</span>
          <span v-else>✨ ส่งไอเดีย</span>
        </button>
      </div>
    </div>

    <!-- Filter bar -->
    <div v-if="ideas.ideas.length > 0" class="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
      <button
        class="filter-pill"
        :class="{ 'filter-pill-active': filterCat === null }"
        @click="filterCat = null"
      >ทั้งหมด ({{ ideas.ideas.length }})</button>
      <button
        v-for="cat in usedCategories"
        :key="cat"
        class="filter-pill"
        :class="{ 'filter-pill-active': filterCat === cat }"
        @click="filterCat = filterCat === cat ? null : cat"
      >{{ cat }}</button>
    </div>

    <!-- Loading -->
    <div v-if="ideas.isLoading" class="flex flex-col gap-2.5">
      <SkeletonCard v-for="i in 3" :key="i" height="96px" />
    </div>

    <!-- Empty -->
    <div v-else-if="displayedIdeas.length === 0" class="text-center py-10">
      <div class="text-[36px] mb-2">💭</div>
      <div class="text-[13px] text-app-light">ยังไม่มีไอเดีย เป็นคนแรกเลย!</div>
    </div>

    <!-- Idea list -->
    <div v-else class="flex flex-col gap-2.5">
      <div
        v-for="idea in displayedIdeas"
        :key="idea.id"
        class="idea-list-card"
        :class="idea.id?.startsWith('tmp_') ? 'opacity-60' : ''"
      >
        <div class="flex items-start justify-between gap-2 mb-2">
          <span class="idea-cat-tag">{{ idea.category }}</span>
          <span class="idea-status-tag" :class="statusClass(idea.status)">{{ statusLabel(idea.status) }}</span>
        </div>
        <div class="text-[14px] font-bold text-app-dark mb-1">{{ idea.title }}</div>
        <div v-if="idea.detail" class="text-[12px] text-app-mid leading-relaxed mb-2">{{ idea.detail }}</div>
        <div class="flex items-center justify-between">
          <span class="text-[10px] text-app-light">{{ idea.submitterName || 'ไม่ระบุชื่อ' }}</span>
          <span class="text-[10px] text-app-light">{{ fmtDate(idea.createdAt) }}</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import SkeletonCard from '../components/shared/SkeletonCard.vue'
import { useIdeasStore } from '../stores/ideas.js'
import { useUiStore } from '../stores/ui.js'
import { useUserAuthStore } from '../stores/userAuth.js'
import { useFadeIn } from '../composables/useFadeIn.js'

const ideas      = useIdeasStore()
const ui         = useUiStore()
const userAuth   = useUserAuthStore()
useFadeIn()

const title      = ref('')
const detail     = ref('')
const anonymous  = ref(false)
const submitting = ref(false)
const filterCat  = ref(null)

onMounted(() => ideas.loadIdeas())

const canSubmit = computed(() => title.value.trim() && ideas.selectedCategory)

const usedCategories = computed(() => {
  const cats = new Set(ideas.ideas.map(i => i.category))
  return ideas.categories.filter(c => cats.has(c))
})

const displayedIdeas = computed(() => {
  if (!filterCat.value) return ideas.ideas
  return ideas.ideas.filter(i => i.category === filterCat.value)
})

async function submit() {
  if (!canSubmit.value || submitting.value) return
  if (!ideas.selectedCategory) { ui.showToast('กรุณาเลือกหมวดหมู่'); return }
  submitting.value = true
  try {
    await ideas.submitIdea({
      category: ideas.selectedCategory,
      title: title.value.trim(),
      detail: detail.value.trim(),
      submitterName: anonymous.value ? 'ไม่ระบุชื่อ' : (userAuth.userName || 'ไม่ระบุ')
    })
    title.value = ''
    detail.value = ''
    anonymous.value = false
    ideas.selectedCategory = null
  } finally {
    submitting.value = false
  }
}

function statusLabel(s) {
  return s === 'approved' ? '✅ อนุมัติ' : s === 'rejected' ? '❌ ปฏิเสธ' : '⏳ รอพิจารณา'
}
function statusClass(s) {
  if (s === 'approved') return 'status-approved'
  if (s === 'rejected') return 'status-rejected'
  return 'status-pending'
}
function fmtDate(d) {
  if (!d) return ''
  const dt = new Date(d)
  if (isNaN(dt)) return d
  return dt.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
}
</script>

<style scoped>
/* Form card */
.idea-form-card {
  background: #fff;
  border: 1px solid #E2DCFB;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 2px 16px rgba(99,102,241,0.09);
}
.idea-form-title {
  font-size: 13px; font-weight: 800; letter-spacing: 2px;
  color: #6366f1;
  margin-bottom: 14px;
}

/* Inputs */
.idea-input {
  width: 100%; padding: 10px 14px;
  border: 1.5px solid #E2DCFB;
  border-radius: 14px;
  font-size: 13px; color: #1A1235;
  background: #F2F0FB;
  outline: none;
  transition: border-color 0.2s;
  display: block;
}
.idea-input::placeholder { color: #9B8FBB; }
.idea-input:focus { border-color: #6366f1; background: #fff; }

/* Category buttons */
.idea-cat-btn {
  padding: 5px 12px; border-radius: 20px; border: 1.5px solid #E2DCFB; cursor: pointer;
  font-size: 11px; font-weight: 700;
  background: #F2F0FB;
  color: #52497A;
  transition: all 0.15s;
}
.idea-cat-btn:active { transform: scale(0.95); }
.idea-cat-active {
  background: #EEF2FF !important;
  color: #4338CA !important;
  border-color: #6366f1 !important;
}

/* Submit button */
.idea-submit-btn {
  padding: 10px 22px; border: none; border-radius: 14px; cursor: pointer;
  font-size: 13px; font-weight: 800;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #fff;
  transition: opacity 0.2s, transform 0.15s;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(99,102,241,0.3);
}
.idea-submit-btn:not(:disabled):active { transform: scale(0.97); }

/* Filter pills */
.filter-pill {
  padding: 4px 12px; border-radius: 16px; border: 1.5px solid #E2DCFB; cursor: pointer;
  font-size: 11px; font-weight: 700; white-space: nowrap;
  background: #fff;
  color: #9B8FBB;
  transition: all 0.15s;
  flex-shrink: 0;
}
.filter-pill-active {
  background: #EEF2FF !important;
  color: #4338CA !important;
  border-color: #6366f1 !important;
}

/* Idea list card */
.idea-list-card {
  background: #fff;
  border: 1px solid #E2DCFB;
  border-radius: 16px;
  padding: 14px 16px;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 6px rgba(99,102,241,0.06);
}
.idea-list-card:hover { border-color: #6366f1; box-shadow: 0 4px 14px rgba(99,102,241,0.12); }

/* Category tag */
.idea-cat-tag {
  font-size: 10px; font-weight: 700;
  background: #EEF2FF;
  color: #4338CA;
  padding: 2px 10px; border-radius: 12px;
  border: 1px solid rgba(99,102,241,0.2);
}

/* Status tags */
.idea-status-tag {
  font-size: 10px; font-weight: 700;
  padding: 2px 10px; border-radius: 12px;
}
.status-pending  { background: #EEF2FF; color: #4338CA; }
.status-approved { background: #D1FAE5; color: #065F46; }
.status-rejected { background: #FEE2E2; color: #991B1B; }

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
