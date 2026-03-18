<template>
  <BaseModal modal-id="modal-emp">
    <div class="modal-handle flex-shrink-0"></div>

    <!-- Header -->
    <div class="flex-shrink-0 bg-[linear-gradient(135deg,#FDF2F8,#F5F0FF)] px-5 py-3.5 border-b border-pink/[0.12] flex items-center gap-2.5">
<div class="flex-1 text-center">
        <div class="text-[16px] font-black bg-[linear-gradient(135deg,#BE185D,#7C3AED)] bg-clip-text text-transparent">{{ headerTitle }}</div>
      </div>
    </div>

    <!-- ── GRID view ──────────────────────────────────────────────── -->
    <div v-if="view === 'grid'" class="flex-1 overflow-y-auto px-5 pt-4 pb-6 flex flex-col gap-2.5">
      <!-- Hidden file input for editing grid card photo -->
      <input ref="gridFileInput" type="file" accept="image/*" class="hidden" @change="onGridPhotoChange" />

      <input
        v-model="searchQ"
        placeholder="🔍 ค้นหาชื่อหรือตำแหน่ง..."
        class="w-full border-[1.5px] border-pink/20 rounded-xl px-3.5 py-[9px] text-[13px] text-[#6B21A8] bg-[#FFF5FB] outline-none"
      />
      <div class="text-[11px] font-extrabold text-[#C084C0] tracking-[1px] uppercase">👥 เลือกคนที่จะชื่นชม</div>
      <div class="grid grid-cols-3 gap-2.5">
        <div
          v-for="m in filteredTeam"
          :key="m.id || m.name"
          class="rounded-2xl overflow-hidden cursor-pointer border-[2.5px] border-pink/15 transition-all duration-200 bg-white"
          @click="selectPerson(m)"
        >
          <div :style="{ background: m.grad }" class="relative overflow-hidden">
            <img v-if="m.imgUrl" :src="m.imgUrl" class="w-full block object-cover object-top" @error="e => e.target.style.display='none'" />
            <div v-else class="w-full aspect-[3/4] min-h-[80px] flex items-center justify-center text-[28px] font-black text-white">{{ initials(m.name) }}</div>
            <!-- Edit photo overlay -->
            <button
              class="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-white/80 flex items-center justify-center text-[11px] shadow-sm border border-pink/20"
              @click.stop="editPersonPhoto(m)"
              title="เปลี่ยนรูป"
            >📷</button>
          </div>
          <div class="px-1.5 pt-1.5 pb-2 text-center">
            <div class="text-[11px] font-black text-[#7C2D8C] overflow-hidden text-ellipsis whitespace-nowrap">{{ m.name }}</div>
            <div class="text-[9px] text-[#C084C0] font-semibold mt-px overflow-hidden text-ellipsis whitespace-nowrap">{{ m.role }}</div>
          </div>
        </div>
        <div
          class="rounded-2xl cursor-pointer border-2 border-dashed border-pink/30 bg-[linear-gradient(135deg,#FFF5FB,#F5F0FF)] flex flex-col items-center justify-center min-h-[110px] gap-1"
          @click="view = 'add'"
        >
          <div class="w-9 h-9 rounded-full bg-[linear-gradient(135deg,#EC4899,#7C3AED)] flex items-center justify-center text-[20px] text-white">+</div>
          <div class="text-[10px] font-extrabold text-[#BE185D] text-center px-1.5">เพิ่มคนใหม่</div>
        </div>
      </div>
    </div>

    <!-- ── THREAD view ────────────────────────────────────────────── -->
    <template v-else-if="view === 'thread' && selectedMember">

      <!-- Scrollable: banner + like bar + comments -->
      <div class="flex-1 overflow-y-auto bg-[linear-gradient(160deg,#FFF9FD,#F8F5FF)]" ref="threadScrollEl">

        <!-- Person banner -->
        <div
          class="relative"
          :style="{ background: selectedMember.grad || 'linear-gradient(135deg,#FBCFE8,#EC4899)' }"
        >
          <img
            v-if="selectedMember.imgUrl"
            :src="selectedMember.imgUrl"
            class="w-full block"
            @error="e => e.target.style.display='none'"
          />
          <div
            v-else
            class="w-full h-[240px] flex items-center justify-center text-[64px]"
          >{{ initials(selectedMember.name) }}</div>
          <div class="absolute bottom-0 left-0 right-0" style="background:linear-gradient(transparent,rgba(30,0,40,0.78));padding:40px 16px 12px;">
            <div class="text-[15px] font-black text-white" style="text-shadow:0 1px 8px rgba(0,0,0,0.6);">{{ selectedMember.name }}</div>
            <div class="text-[11px] text-white/85 mt-0.5">{{ selectedMember.role }}</div>
          </div>
        </div>

        <!-- Person-level like bar -->
        <div class="flex border-b border-pink/10 bg-white/70">
          <button
            class="flex-1 py-2.5 text-[13px] font-bold flex items-center justify-center gap-1.5 transition-colors"
            :class="channelLiked ? 'text-[#EC4899]' : 'text-[#C084C0]'"
            @click="empathy.toggleChannelLike(activePostId)"
          >{{ channelLiked ? '❤️' : '🤍' }} {{ channelLikeCount || 0 }} ชื่นชม</button>
        </div>

        <!-- Comments -->
        <div v-if="loadingThread" class="py-10 text-center text-[#C084C0] text-[13px]">กำลังโหลด... ✨</div>

        <div v-else-if="!threadComments.length" class="py-10 text-center">
          <div class="text-[32px] mb-2">💌</div>
          <div class="text-[13px] font-bold text-[#C084C0]">เป็นคนแรกที่ชื่นชม {{ selectedMember.name }}</div>
          <div class="text-[11px] text-[#D4A0CC] mt-1">พิมพ์ข้อความด้านล่าง แล้วกด ส่ง</div>
        </div>

        <div v-else class="cm-list">
          <template v-for="cm in threadComments" :key="cm.id">

            <!-- Top-level kudos comment -->
            <div class="cm-item">
              <div class="cm-av bg-[linear-gradient(135deg,#FBCFE8,#EC4899)]">
                <img v-if="getCommentorImg(cm.name)" :src="getCommentorImg(cm.name)" class="w-full h-full object-cover rounded-full" @error="e => e.target.style.display='none'" />
                <span v-else>{{ cm.name?.[0] }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="cm-bubble">
                  <span v-if="cm.tag" class="inline-block bg-pink/10 text-[#BE185D] text-[10px] font-extrabold px-2 py-0.5 rounded-full mb-1">{{ cm.tag }}</span>
                  <div class="cm-name">{{ cm.name }}</div>
                  <div class="cm-text">{{ cm.text }}</div>
                  <div class="flex items-center gap-3 mt-1.5">
                    <span class="cm-time">{{ formatThaiDatetime(cm.time) }}</span>
                    <button
                      class="text-[11px] font-bold bg-transparent border-none cursor-pointer p-0 transition-colors"
                      :class="cm._liked ? 'text-[#EC4899]' : 'text-[#C084C0]'"
                      @click="empathy.toggleCommentLike(activePostId, cm.id)"
                    >{{ cm._liked ? '❤️' : '🤍' }} {{ cm.likeCount || '' }}</button>
                    <button
                      class="text-[11px] font-bold text-[#BE185D] bg-transparent border-none cursor-pointer p-0"
                      @click="toggleReply(cm.id)"
                    >💬 ตอบกลับ</button>
                  </div>
                </div>

                <!-- Inline reply box -->
                <div v-if="replyingTo === cm.id" class="mt-2 flex gap-2 items-end pl-1">
                  <textarea
                    v-model="replyText"
                    rows="2"
                    maxlength="500"
                    :placeholder="`ตอบกลับ ${cm.name}...`"
                    class="flex-1 border-[1.5px] border-pink/25 rounded-xl px-3 py-2 text-[12px] text-[#6B21A8] bg-[#FFF5FB] resize-none outline-none leading-relaxed"
                    :ref="el => { if (el) replyRefs[cm.id] = el }"
                  ></textarea>
                  <button
                    @click="submitReply(cm.id)"
                    class="bg-[linear-gradient(135deg,#EC4899,#7C3AED)] text-white border-none rounded-xl px-3 py-2 text-[12px] font-extrabold cursor-pointer flex-shrink-0"
                  >ส่ง</button>
                </div>

                <!-- Nested replies -->
                <div v-if="cm.replies.length" class="mt-2 ml-4 flex flex-col gap-1.5">
                  <div v-for="r in cm.replies" :key="r.id" class="cm-item">
                    <div class="cm-av !w-6 !h-6 !text-[10px] bg-[linear-gradient(135deg,#DDD6FE,#7C3AED)]">
                      <img v-if="getCommentorImg(r.name)" :src="getCommentorImg(r.name)" class="w-full h-full object-cover rounded-full" @error="e => e.target.style.display='none'" />
                      <span v-else>{{ r.name?.[0] }}</span>
                    </div>
                    <div class="cm-bubble !bg-[linear-gradient(135deg,#F5F3FF,#EDE9FE)] flex-1">
                      <div class="cm-name">{{ r.name }}</div>
                      <div class="cm-text">{{ r.text }}</div>
                      <div class="flex items-center gap-3 mt-1">
                        <span class="cm-time">{{ formatThaiDatetime(r.time) }}</span>
                        <button
                          class="text-[11px] font-bold bg-transparent border-none cursor-pointer p-0 transition-colors"
                          :class="r._liked ? 'text-[#EC4899]' : 'text-[#C084C0]'"
                          @click="empathy.toggleCommentLike(activePostId, r.id)"
                        >{{ r._liked ? '❤️' : '🤍' }} {{ r.likeCount || '' }}</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </template>
        </div>
      </div>

      <!-- Compose bar -->
      <div class="flex-shrink-0 border-t border-pink/10 bg-white px-4 pt-3 pb-6 flex flex-col gap-2">

        <!-- Tag chips (collapsed by default) -->
        <div v-if="showTags" class="flex gap-2 flex-wrap">
          <button
            v-for="tag in tags"
            :key="tag"
            class="wish-chip"
            :class="{ selected: selectedTag === tag }"
            @click="selectedTag = selectedTag === tag ? null : tag"
          >{{ tag }}</button>
        </div>

        <div class="flex gap-2 items-end">
          <!-- Tag toggle -->
          <button
            @click="showTags = !showTags"
            :title="selectedTag || 'เพิ่มแท็ก'"
            class="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center border-[1.5px] transition-colors duration-150 text-[16px]"
            :class="selectedTag ? 'bg-[linear-gradient(135deg,#EC4899,#7C3AED)] border-transparent text-white' : 'border-pink/25 bg-[#FFF5FB]'"
          >🏷️</button>

          <textarea
            v-model="composeText"
            ref="composeEl"
            rows="2"
            maxlength="500"
            placeholder="พิมพ์คำชื่นชม... 💕"
            class="flex-1 border-[1.5px] border-pink/25 rounded-xl px-3 py-2.5 text-[13px] text-[#6B21A8] bg-[#FFF5FB] resize-none outline-none leading-relaxed"
          ></textarea>

          <button
            @click="submitCompose"
            :disabled="!composeText.trim() || sending"
            class="bg-[linear-gradient(135deg,#EC4899,#7C3AED)] text-white border-none rounded-xl px-4 py-2.5 text-[13px] font-extrabold cursor-pointer flex-shrink-0 disabled:opacity-40"
          >{{ sending ? '...' : 'ส่ง 💝' }}</button>
        </div>

        <div class="flex items-center gap-1.5 bg-[linear-gradient(135deg,#FFFBEB,#FEF3C7)] border border-[#FCD34D] rounded-xl px-3 py-2">
          <span class="text-[14px]">🌟</span>
          <div class="text-[11px] font-bold text-[#92400E]">ส่ง Empathy = <strong>+10 DS pts</strong></div>
        </div>
      </div>

    </template>

    <!-- ── ADD PERSON view ────────────────────────────────────────── -->
    <template v-else-if="view === 'add'">
      <div class="flex-1 overflow-y-auto px-5 pt-5 pb-6 flex flex-col gap-3.5">

        <!-- Photo upload area -->
        <input ref="addFileInput" type="file" accept="image/*" class="hidden" @change="onAddPhotoChange" />
        <div class="flex flex-col items-center gap-2">
          <button
            @click="triggerAddPhoto"
            class="w-20 h-20 rounded-full border-[2.5px] border-dashed border-pink/35 overflow-hidden flex items-center justify-center bg-[linear-gradient(135deg,#FFF5FB,#F5F0FF)] transition-opacity"
            :class="addPhotoUploading ? 'opacity-50' : ''"
          >
            <img v-if="addPhotoUrl" :src="addPhotoUrl" class="w-full h-full object-cover" />
            <div v-else-if="addPhotoUploading" class="text-[22px] animate-spin">⏳</div>
            <div v-else class="flex flex-col items-center gap-0.5">
              <span class="text-[24px]">📷</span>
              <span class="text-[9px] font-bold text-[#BE185D]">เพิ่มรูป</span>
            </div>
          </button>
          <div class="text-[10px] text-[#C084C0] font-semibold">กดเพื่อเพิ่มรูปโปรไฟล์ (ไม่บังคับ)</div>
        </div>

        <input
          v-model="dirSearch"
          @input="filterDir"
          placeholder="พิมพ์รหัสพนักงาน (empCode) หรือชื่อ..."
          class="w-full border-[1.5px] border-pink/25 rounded-xl px-3.5 py-2.5 text-[13px] text-[#6B21A8] bg-[#FFF5FB] outline-none"
        />
        <div v-if="dirResults.length" class="border-[1.5px] border-pink/20 rounded-xl overflow-hidden bg-white">
          <div
            v-for="e in dirResults"
            :key="e.id"
            @click="pickFromDir(e)"
            class="flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer border-b border-pink/[0.08] last:border-0"
          >
            <div class="w-9 h-9 rounded-full bg-[linear-gradient(135deg,#FBCFE8,#EC4899)] flex items-center justify-center text-[13px] font-black text-white flex-shrink-0">{{ e.name?.[0] }}</div>
            <div class="flex-1 min-w-0">
              <div class="text-[12px] font-extrabold text-[#7C2D8C]">{{ e.name }}</div>
              <div class="text-[10px] text-[#C084C0] font-semibold">{{ e.empCode || e.id }} · {{ e.role }}</div>
            </div>
          </div>
        </div>
        <div class="flex gap-2 mt-auto">
          <button @click="view = 'grid'; addPhotoUrl = ''" class="flex-1 bg-pink/[0.08] border border-pink/25 rounded-xl py-[11px] text-[13px] font-bold text-[#BE185D] cursor-pointer">ยกเลิก</button>
          <button @click="addAndPraise" class="flex-[2] bg-[linear-gradient(135deg,#EC4899,#7C3AED)] text-white border-none rounded-xl py-[11px] text-[13px] font-black cursor-pointer">เพิ่มและชื่นชม ✨</button>
        </div>
      </div>
    </template>

  </BaseModal>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import BaseModal from '../shared/BaseModal.vue'
import { getCached } from '../../services/imageService.js'
import { useEmpathyStore }   from '../../stores/empathy.js'
import { useTeamStore }      from '../../stores/team.js'
import { useUiStore }        from '../../stores/ui.js'
import { useUserAuthStore }  from '../../stores/userAuth.js'
import { formatThaiDatetime } from '../../utils/date.js'
import { uploadEmpathyPhoto, setEmpathyPhoto } from '../../services/empathyService.js'

const empathy  = useEmpathyStore()
const team     = useTeamStore()
const ui       = useUiStore()
const userAuth = useUserAuthStore()

// ── View ──────────────────────────────────────────────────────────
const view           = ref('grid')
const searchQ        = ref('')
const selectedMember = ref(null)

// Thread
const loadingThread = ref(false)
const activePostId  = ref(null)
const composeText   = ref('')
const selectedTag   = ref(null)
const showTags      = ref(false)
const sending       = ref(false)
const replyingTo    = ref(null)
const replyText     = ref('')
const replyRefs     = ref({})
const threadScrollEl = ref(null)
const composeEl      = ref(null)

// Add-person
const dirSearch  = ref('')
const dirResults = ref([])
const pickedDir  = ref(null)

// Photo upload
const addPhotoUrl       = ref('')
const addPhotoUploading = ref(false)
const addFileInput      = ref(null)
const gridFileInput     = ref(null)
const editingPersonId   = ref(null)
const editingPersonUUID = ref(null)

const tags = ['เก่งมาก ⭐', 'ขอบคุณ 🙏', 'สู้ๆ 💪', 'ประทับใจ 💫', 'ช่วยเหลือ 🤝']

// ── Lifecycle ──────────────────────────────────────────────────────
onMounted(async () => {
  team.loadDirectory()
  const preselect = ui._empPreselect
  ui._empPreselect = null

  if (preselect?.name) {
    // Full person object (from EmpathyBoard) — select immediately, no wait
    empathy.loadPeople()
    await nextTick()
    selectPerson(preselect)
  } else if (preselect?.empCode) {
    // Only empCode (from notification) — need to load people first for imgUrl
    await empathy.loadPeople()
    const person = empathy.praisedPeople.find(
      p => (p.empCode || p.id) === preselect.empCode
    ) || preselect
    await nextTick()
    selectPerson(person)
  } else {
    empathy.loadPeople()
  }
})

// ── Channel (person) like ──────────────────────────────────────────
const channelLiked     = computed(() => empathy.channelLikes[activePostId.value]?.liked || false)
const channelLikeCount = computed(() => empathy.channelLikes[activePostId.value]?.count || 0)

// ── Derived ────────────────────────────────────────────────────────
const headerTitle = computed(() => {
  if (view.value === 'grid') return 'ส่งคำชื่นชม 💝'
  if (view.value === 'add')  return 'เพิ่มคนใหม่'
  return selectedMember.value?.name || 'คำชื่นชม'
})

// คนที่ถูกชื่นชมแล้ว — จาก praisedPeople (populated from posts + session)
const praiseList = computed(() =>
  empathy.praisedPeople.map((p, i) => ({ ...p, grad: team.getGrad(i) }))
)

const filteredTeam = computed(() => {
  const q = searchQ.value.trim().toLowerCase()
  if (!q) return praiseList.value
  return praiseList.value.filter(m =>
    m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q)
  )
})

// Extract [TAG] prefix embedded in text
function parseComment(cm) {
  const m = cm.text?.match(/^\[(.+?)\]\s*([\s\S]*)$/)
  return m ? { ...cm, tag: m[1], text: m[2] } : { ...cm, tag: '' }
}

// Build nested tree: top-level with .replies[]
const threadComments = computed(() => {
  if (!activePostId.value) return []
  const flat = empathy.postComments[activePostId.value] || []
  const top  = flat.filter(c => !c.parentId).map(parseComment)
  return top.map(cm => ({
    ...cm,
    replies: flat.filter(r => r.parentId === cm.id)
  }))
})

// ── Helpers ────────────────────────────────────────────────────────
function initials(name) {
  return (name || '').trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?'
}

function getCommentorImg(name) {
  const n = (name || '').trim().toLowerCase()
  const emp = team.empDirectory.find(e => (e.name || '').trim().toLowerCase() === n)
  if (!emp) return ''
  return emp.imgUrl || getCached(emp.imgId) || ''
}

function scrollBottom() {
  nextTick(() => {
    if (threadScrollEl.value)
      threadScrollEl.value.scrollTop = threadScrollEl.value.scrollHeight
  })
}

// ── Navigation ─────────────────────────────────────────────────────
function goBack() {
  view.value = 'grid'
  selectedMember.value = null
  activePostId.value   = null
  composeText.value    = ''
  selectedTag.value    = null
  showTags.value       = false
  replyingTo.value     = null
  replyText.value      = ''
  sending.value        = false
}

// ── Select person ──────────────────────────────────────────────────
async function selectPerson(m) {
  selectedMember.value = m
  searchQ.value        = ''
  view.value           = 'thread'

  // Use empCode as channelId — fallback to id or name for backward compat
  const channelId = String(m.empCode || m.id || m.name).trim()
  activePostId.value = channelId

  // Show spinner only when no cached data available
  const hasCache = !!(empathy.postComments[channelId]?.length)
  loadingThread.value = !hasCache

  empathy.loadChannelLike(channelId)  // fire-and-forget, non-blocking

  await empathy.loadComments(channelId)
  loadingThread.value = false
  scrollBottom()
  nextTick(() => composeEl.value?.focus())
}

// ── Reply ──────────────────────────────────────────────────────────
function toggleReply(cmId) {
  if (replyingTo.value === cmId) {
    replyingTo.value = null
    replyText.value  = ''
  } else {
    replyingTo.value = cmId
    replyText.value  = ''
    nextTick(() => replyRefs.value[cmId]?.focus())
  }
}

async function submitReply(parentId) {
  const text = replyText.value.trim()
  if (!text || !activePostId.value) return
  replyingTo.value = null
  replyText.value  = ''
  await empathy.addComment(activePostId.value, text, userAuth.userName || 'ทีม', parentId)
  scrollBottom()
}

// ── Compose (top-level kudos) ──────────────────────────────────────
async function submitCompose() {
  const text = composeText.value.trim()
  if (!text || !activePostId.value || sending.value) return
  const tag     = selectedTag.value || ''
  const fullText = tag ? `[${tag}] ${text}` : text
  composeText.value = ''
  selectedTag.value = null
  showTags.value    = false
  sending.value     = true
  try {
    await empathy.addComment(activePostId.value, fullText, userAuth.userName || 'ทีม', '')
    empathy.recordPraise(selectedMember.value, activePostId.value)
    ui.showToast('ส่งคำชื่นชมสำเร็จ! 💝')
    ui.closeModal()
    scrollBottom()
  } finally {
    sending.value = false
  }
}

// ── Photo upload helpers ────────────────────────────────────────────
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function onAddPhotoChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  addPhotoUploading.value = true
  try {
    const base64 = await readFileAsBase64(file)
    const result = await uploadEmpathyPhoto(base64, file.name)
    addPhotoUrl.value = result.url
  } catch {
    ui.showToast('อัปโหลดรูปไม่สำเร็จ')
  } finally {
    addPhotoUploading.value = false
    if (addFileInput.value) addFileInput.value.value = ''
  }
}

function triggerAddPhoto() {
  addFileInput.value?.click()
}

function editPersonPhoto(person) {
  editingPersonId.value   = String(person.empCode || person.id || person.name).trim()
  editingPersonUUID.value = String(person.id || person.empCode || person.name).trim()
  gridFileInput.value?.click()
}

async function onGridPhotoChange(e) {
  const file = e.target.files?.[0]
  if (!file || !editingPersonId.value) return
  const empCode = editingPersonId.value
  try {
    const base64 = await readFileAsBase64(file)
    const result = await uploadEmpathyPhoto(base64, file.name)
    // Update local display immediately
    empathy.updatePersonImg(empCode, result.url)
    // Save to EmpathyPhotos — use UUID as employee_id (matches RPC join on e.id)
    setEmpathyPhoto(editingPersonUUID.value || empCode, result.url).catch(() => {})
    ui.showToast('อัปเดตรูปสำเร็จ ✨')
  } catch {
    ui.showToast('อัปโหลดรูปไม่สำเร็จ')
  } finally {
    editingPersonId.value   = null
    editingPersonUUID.value = null
    if (gridFileInput.value) gridFileInput.value.value = ''
  }
}

// ── Add person ─────────────────────────────────────────────────────
function filterDir() {
  const q = dirSearch.value.trim().toLowerCase()
  if (!q) { dirResults.value = []; return }
  dirResults.value = team.empDirectory.filter(e =>
    (e.empCode || '').toLowerCase().includes(q) || e.name.toLowerCase().includes(q)
  ).slice(0, 8)
}

function pickFromDir(e) {
  pickedDir.value  = e
  dirSearch.value  = `${e.empCode || e.id} — ${e.name}`
  dirResults.value = []
}

async function addAndPraise() {
  if (!pickedDir.value) { ui.showToast('กรุณาค้นหาพนักงาน'); return }
  const m = { ...pickedDir.value }
  if (addPhotoUrl.value) m.imgUrl = addPhotoUrl.value
  team.addToTeam({ ...m, grad: team.getGrad(team.empTeam.length) })
  const empCode = String(m.empCode || m.id || m.name).trim()
  if (addPhotoUrl.value) {
    empathy.updatePersonImg(empCode, addPhotoUrl.value)
    // Save to EmpathyPhotos — use UUID (m.id) as employee_id (matches RPC join on e.id)
    setEmpathyPhoto(String(m.id || empCode), addPhotoUrl.value).catch(() => {})
  }
  dirSearch.value  = ''
  pickedDir.value  = null
  addPhotoUrl.value = ''
  await selectPerson({ ...m, grad: team.getGrad(team.empTeam.length - 1) })
}
</script>
