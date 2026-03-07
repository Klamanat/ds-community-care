<template>
  <BaseModal modal-id="modal-emp">
    <div class="modal-handle flex-shrink-0"></div>

    <!-- Header -->
    <div class="flex-shrink-0 bg-[linear-gradient(135deg,#FDF2F8,#F5F0FF)] px-5 py-3.5 border-b border-pink/[0.12] flex items-center gap-2.5">
      <div
        v-if="view !== 'grid'"
        @click="goBack"
        class="flex w-[30px] h-[30px] rounded-full bg-pink/10 cursor-pointer items-center justify-center text-[14px] flex-shrink-0"
      >←</div>
      <div class="flex-1 text-center">
        <div class="text-[16px] font-black bg-[linear-gradient(135deg,#BE185D,#7C3AED)] bg-clip-text text-transparent">{{ headerTitle }}</div>
      </div>
    </div>

    <!-- Grid view -->
    <div v-if="view === 'grid'" class="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2.5">
      <input
        v-model="searchQ"
        placeholder="🔍 ค้นหาชื่อหรือตำแหน่ง..."
        class="w-full border-[1.5px] border-pink/20 rounded-xl px-3.5 py-[9px] text-[13px] text-[#6B21A8] bg-[#FFF5FB] outline-none"
      />
      <div class="text-[11px] font-extrabold text-[#C084C0] tracking-[1px] uppercase">👥 เลือกคนที่จะชื่นชม</div>
      <div class="grid grid-cols-3 gap-2.5">
        <div
          v-for="(m, i) in filteredTeam"
          :key="m.id || m.name"
          class="rounded-2xl overflow-hidden cursor-pointer border-[2.5px] border-pink/15 transition-all duration-200 bg-white relative"
          @click="selectPerson(m)"
        >
          <div :style="{ background: m.grad }" class="overflow-hidden relative">
            <img v-if="m.imgUrl" :src="m.imgUrl" class="w-full block object-cover object-top" @error="e => e.target.style.display='none'" />
            <div v-else class="w-full aspect-[3/4] min-h-[80px] flex items-center justify-center text-[28px] font-black text-white">{{ initials(m.name) }}</div>
          </div>
          <div class="px-1.5 pt-1.5 pb-2 text-center">
            <div class="text-[11px] font-black text-[#7C2D8C] overflow-hidden text-ellipsis whitespace-nowrap">{{ m.name }}</div>
            <div class="text-[9px] text-[#C084C0] font-semibold mt-px overflow-hidden text-ellipsis whitespace-nowrap">{{ m.role }}</div>
          </div>
        </div>
        <!-- Add person card -->
        <div
          class="rounded-2xl overflow-hidden cursor-pointer border-2 border-dashed border-pink/30 bg-[linear-gradient(135deg,#FFF5FB,#F5F0FF)] flex flex-col items-center justify-center min-h-[110px] gap-1"
          @click="view = 'add'"
        >
          <div class="w-9 h-9 rounded-full bg-[linear-gradient(135deg,#EC4899,#7C3AED)] flex items-center justify-center text-[20px] text-white">+</div>
          <div class="text-[10px] font-extrabold text-[#BE185D] text-center px-1.5">เพิ่มคนใหม่</div>
        </div>
      </div>
    </div>

    <!-- Comment view (existing kudos) -->
    <template v-else-if="view === 'comment' && selectedMember">
      <div class="flex-1 overflow-y-auto flex flex-col">
        <div class="emp-card-spotlight flex-shrink-0 h-auto">
          <img v-if="selectedMember.imgUrl" :src="selectedMember.imgUrl" class="w-full block object-cover object-top" />
          <div v-else :style="{ background: selectedMember.grad }" class="w-full h-[180px] flex items-center justify-center text-[64px]">{{ initials(selectedMember.name) }}</div>
          <div class="emp-spotlight-name">
            <div class="text-[14px] font-black text-white" style="text-shadow:0 1px 8px rgba(0,0,0,0.5);">{{ selectedMember.name }}</div>
            <div class="text-[10px] text-white/88 font-semibold mt-0.5">{{ selectedMember.role }}</div>
          </div>
        </div>
        <div class="px-4 py-3 flex flex-col gap-2 bg-[linear-gradient(160deg,#FFF9FD,#F8F5FF)] flex-1">
          <div class="text-[11px] font-extrabold text-[#C084C0] tracking-[1px] mb-1">💌 คำชื่นชม</div>
          <div v-if="existingPost" class="bg-[linear-gradient(135deg,#FFF0FB,#F5F0FF)] border border-pink/15 rounded-[14px] px-3.5 py-2.5 text-[12px] text-[#6B21A8] leading-relaxed">{{ existingPost.msg }}</div>
          <div v-for="c in existingPost?.comments" :key="c.id" class="bg-white border border-pink/[0.12] rounded-xl px-3 py-2">
            <div class="flex items-center gap-1.5 mb-1">
              <div class="w-[22px] h-[22px] rounded-full bg-[linear-gradient(135deg,#FBCFE8,#EC4899)] flex items-center justify-center text-[10px] text-white font-extrabold flex-shrink-0">{{ c.name?.[0] }}</div>
              <span class="text-[11px] font-extrabold text-[#BE185D]">{{ c.name }}</span>
              <span class="text-[10px] text-[#C084C0] ml-auto">{{ c.time }}</span>
            </div>
            <div class="text-[12px] text-[#4C1D95] leading-relaxed">{{ c.text }}</div>
          </div>
          <div v-if="!existingPost?.comments?.length && !existingPost" class="text-center text-[#C084C0] text-[12px] py-4">ยังไม่มีความคิดเห็น 💭</div>
        </div>
      </div>
      <!-- Comment input -->
      <div class="flex-shrink-0 border-t border-pink/10 bg-white px-4 py-2.5 flex flex-col gap-2">
        <div class="flex gap-2 items-end">
          <textarea
            v-model="commentText"
            placeholder="เพิ่มความคิดเห็น... 💬"
            rows="2"
            class="flex-1 border-[1.5px] border-pink/25 rounded-xl px-3 py-2.5 text-[13px] text-[#6B21A8] bg-[#FFF5FB] resize-none outline-none leading-relaxed"
          ></textarea>
          <button
            @click="submitComment"
            class="bg-[linear-gradient(135deg,#EC4899,#7C3AED)] text-white border-none rounded-xl px-4 py-2.5 text-[13px] font-extrabold cursor-pointer flex-shrink-0"
          >ส่ง 💝</button>
        </div>
        <button
          @click="view = 'grid'"
          class="bg-pink/[0.08] border border-pink/25 rounded-xl py-2 text-[12px] font-bold text-[#BE185D] cursor-pointer w-full"
        >👥 เลือกคนอื่น</button>
      </div>
    </template>

    <!-- New kudos view -->
    <template v-else-if="view === 'new' && selectedMember">
      <div class="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        <div class="emp-card-spotlight rounded-2xl h-auto flex-shrink-0 overflow-hidden">
          <img v-if="selectedMember.imgUrl" :src="selectedMember.imgUrl" class="w-full block object-cover object-top" />
          <div v-else :style="{ background: selectedMember.grad }" class="w-full h-[160px] flex items-center justify-center text-[48px]">{{ initials(selectedMember.name) }}</div>
          <div class="emp-spotlight-name">
            <div class="text-[14px] font-black text-white">{{ selectedMember.name }}</div>
          </div>
        </div>

        <div>
          <div class="text-[11px] font-extrabold text-[#C084C0] tracking-[1px] mb-2">🏷️ แท็ก</div>
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="tag in tags"
              :key="tag"
              class="wish-chip"
              :class="{ selected: selectedTag === tag }"
              @click="selectedTag = tag"
            >{{ tag }}</button>
          </div>
        </div>

        <div>
          <div class="text-[11px] font-extrabold text-[#C084C0] tracking-[1px] mb-2">✍️ ข้อความชื่นชม</div>
          <textarea
            v-model="kudosMsg"
            placeholder="พิมพ์ข้อความชื่นชมจากใจ... 💕"
            rows="3"
            maxlength="500"
            class="w-full border-[1.5px] border-pink/20 rounded-[14px] px-3.5 py-3 text-[13px] text-[#6B21A8] bg-[#FFF5FB] resize-none outline-none leading-relaxed"
          ></textarea>
        </div>

        <div class="flex items-center gap-2 bg-[linear-gradient(135deg,#FFFBEB,#FEF3C7)] border border-[#FCD34D] rounded-xl px-3.5 py-2.5">
          <span class="text-[16px]">🌟</span>
          <div class="text-[11px] font-bold text-[#92400E]">ส่ง Empathy 1 ครั้ง = <strong>+10 LINE pts</strong></div>
        </div>
      </div>

      <div class="flex-shrink-0 border-t border-pink/10 bg-white px-4 py-3 flex flex-col gap-2">
        <button @click="submitKudos" class="modal-close-btn" style="background:linear-gradient(135deg,#EC4899,#7C3AED);">ส่งคำชื่นชม 💝</button>
        <button
          @click="view = 'grid'"
          class="bg-pink/[0.08] border border-pink/25 rounded-xl py-2 text-[12px] font-bold text-[#BE185D] cursor-pointer w-full"
        >👥 เลือกคนอื่น</button>
      </div>
    </template>

    <!-- Add person view -->
    <template v-else-if="view === 'add'">
      <div class="flex-1 overflow-y-auto p-5 flex flex-col gap-3.5">
        <input
          v-model="dirSearch"
          @input="filterDir"
          placeholder="พิมพ์รหัสหรือชื่อพนักงาน..."
          class="w-full border-[1.5px] border-pink/25 rounded-xl px-3.5 py-2.5 text-[13px] text-[#6B21A8] bg-[#FFF5FB] outline-none"
        />
        <div v-if="dirResults.length" class="border-[1.5px] border-pink/20 rounded-xl overflow-hidden bg-white shadow-[0_8px_24px_rgba(236,72,153,0.12)]">
          <div
            v-for="e in dirResults"
            :key="e.id"
            @click="pickFromDir(e)"
            class="flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer border-b border-pink/[0.08] last:border-0 hover:bg-[#FFF0FB] transition-colors duration-150"
          >
            <div class="w-9 h-9 rounded-full bg-[linear-gradient(135deg,#FBCFE8,#EC4899)] flex items-center justify-center text-[13px] font-black text-white flex-shrink-0">{{ e.name?.[0] }}</div>
            <div class="flex-1 min-w-0">
              <div class="text-[12px] font-extrabold text-[#7C2D8C]">{{ e.name }}</div>
              <div class="text-[10px] text-[#C084C0] font-semibold">{{ e.id }} · {{ e.role }}</div>
            </div>
          </div>
        </div>
        <div class="flex gap-2 mt-auto">
          <button
            @click="view = 'grid'"
            class="flex-1 bg-pink/[0.08] border border-pink/25 rounded-xl py-[11px] text-[13px] font-bold text-[#BE185D] cursor-pointer"
          >ยกเลิก</button>
          <button
            @click="addAndPraise"
            class="flex-[2] bg-[linear-gradient(135deg,#EC4899,#7C3AED)] text-white border-none rounded-xl py-[11px] text-[13px] font-black cursor-pointer"
          >เพิ่มและชื่นชม ✨</button>
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import BaseModal from '../shared/BaseModal.vue'
import { useEmpathyStore } from '../../stores/empathy.js'
import { useTeamStore } from '../../stores/team.js'
import { useUiStore } from '../../stores/ui.js'

const empathy = useEmpathyStore()
const team = useTeamStore()
const ui = useUiStore()

onMounted(() => {
  team.loadTeam()
  team.loadDirectory()
})

// Reload when modal opens (in case data changed)
watch(() => ui.activeModal, (id) => {
  if (id === 'modal-emp') {
    team.loadTeam()
    team.loadDirectory()
  }
})

const view = ref('grid')  // 'grid' | 'comment' | 'new' | 'add'
const searchQ = ref('')
const selectedMember = ref(null)
const commentText = ref('')
const kudosMsg = ref('')
const selectedTag = ref(null)
const dirSearch = ref('')
const dirResults = ref([])
const pickedDir = ref(null)

const tags = ['เก่งมาก ⭐', 'ขอบคุณ 🙏', 'สู้ๆ 💪', 'ประทับใจ 💫', 'ช่วยเหลือ 🤝']

const headerTitle = computed(() => {
  if (view.value === 'grid') return 'ส่งคำชื่นชม 💝'
  if (view.value === 'add') return 'เพิ่มคนใหม่'
  return selectedMember.value?.name || 'ส่งคำชื่นชม'
})

const filteredTeam = computed(() => {
  const q = searchQ.value.trim().toLowerCase()
  if (!q) return team.empTeam
  return team.empTeam.filter(m => m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q))
})

const existingPost = computed(() => {
  if (!selectedMember.value) return null
  return empathy.posts.find(p => p.recName === selectedMember.value.name) || null
})

function initials(name) {
  return (name || '').trim().split(/\s+/).slice(0,2).map(w => w[0]?.toUpperCase()).join('') || '?'
}

function selectPerson(m) {
  selectedMember.value = m
  searchQ.value = ''
  const post = empathy.posts.find(p => p.recName === m.name)
  view.value = post ? 'comment' : 'new'
}

function goBack() {
  view.value = 'grid'
  selectedMember.value = null
  kudosMsg.value = ''
  selectedTag.value = null
  commentText.value = ''
}

function submitComment() {
  if (!commentText.value.trim() || !existingPost.value) return
  empathy.addComment(existingPost.value.id, commentText.value.trim(), ui.currentUser.name)
  commentText.value = ''
}

function submitKudos() {
  if (!kudosMsg.value.trim() || !selectedMember.value) { ui.showToast('กรุณาพิมพ์ข้อความ'); return }
  if (!selectedTag.value) { ui.showToast('กรุณาเลือกแท็ก'); return }
  empathy.addPost({
    recName: selectedMember.value.name,
    recRole: selectedMember.value.role,
    recImgUrl: selectedMember.value.imgUrl || '',
    sndName: ui.currentUser.name,
    msg: kudosMsg.value.trim(),
    tag: selectedTag.value,
    time: 'เมื่อกี้',
    react: '❤️ 0',
    recImg: selectedMember.value.img || '',
    likeCount: 0
  })
  ui.closeModal()
  goBack()
}

function filterDir() {
  const q = dirSearch.value.trim().toLowerCase()
  if (!q) { dirResults.value = []; return }
  dirResults.value = team.empDirectory.filter(e =>
    e.id.toLowerCase().includes(q) || e.name.toLowerCase().includes(q)
  ).slice(0, 8)
}

function pickFromDir(e) {
  pickedDir.value = e
  dirSearch.value = `${e.id} — ${e.name}`
  dirResults.value = []
}

function addAndPraise() {
  if (!pickedDir.value) { ui.showToast('กรุณาค้นหาพนักงาน'); return }
  const m = pickedDir.value
  team.addToTeam({ ...m, grad: team.getGrad(team.empTeam.length) })
  selectedMember.value = { ...m, grad: team.getGrad(team.empTeam.length - 1) }
  view.value = 'new'
  dirSearch.value = ''
  pickedDir.value = null
}
</script>
