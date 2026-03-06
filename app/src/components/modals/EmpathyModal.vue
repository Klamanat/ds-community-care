<template>
  <BaseModal modal-id="modal-emp">
    <div class="modal-handle" style="flex-shrink:0;"></div>

    <!-- Header -->
    <div style="flex-shrink:0;background:linear-gradient(135deg,#FDF2F8,#F5F0FF);padding:14px 20px 12px;border-bottom:1.5px solid rgba(236,72,153,0.12);display:flex;align-items:center;gap:10px;">
      <div v-if="view !== 'grid'" @click="goBack" style="display:flex;width:30px;height:30px;border-radius:50%;background:rgba(236,72,153,0.1);cursor:pointer;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">←</div>
      <div style="flex:1;text-align:center;">
        <div style="font-size:16px;font-weight:900;background:linear-gradient(135deg,#BE185D,#7C3AED);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">{{ headerTitle }}</div>
      </div>
    </div>

    <!-- Grid view -->
    <div v-if="view === 'grid'" style="flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:10px;">
      <input v-model="searchQ" placeholder="🔍 ค้นหาชื่อหรือตำแหน่ง..." style="width:100%;border:1.5px solid rgba(236,72,153,0.2);border-radius:12px;padding:9px 14px;font-family:'Sarabun',sans-serif;font-size:13px;color:#6B21A8;background:#FFF5FB;outline:none;box-sizing:border-box;" />
      <div style="font-size:11px;font-weight:800;color:#C084C0;letter-spacing:1px;text-transform:uppercase;">👥 เลือกคนที่จะชื่นชม</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
        <div
          v-for="(m, i) in filteredTeam"
          :key="m.id || m.name"
          style="border-radius:16px;overflow:hidden;cursor:pointer;border:2.5px solid rgba(236,72,153,0.15);transition:all 0.2s;background:#fff;position:relative;"
          @click="selectPerson(m)"
        >
          <div :style="{ background: m.grad, overflow:'hidden', position:'relative' }">
            <img v-if="m.img" :src="m.img" style="width:100%;height:auto;display:block;object-fit:cover;object-position:top center;" @error="e => e.target.style.display='none'" />
            <div v-else style="width:100%;aspect-ratio:3/4;min-height:80px;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900;color:white;">{{ initials(m.name) }}</div>
          </div>
          <div style="padding:6px 6px 8px;text-align:center;">
            <div style="font-size:11px;font-weight:900;color:#7C2D8C;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ m.name }}</div>
            <div style="font-size:9px;color:#C084C0;font-weight:600;margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ m.role }}</div>
          </div>
        </div>
        <!-- Add person card -->
        <div
          style="border-radius:16px;overflow:hidden;cursor:pointer;border:2px dashed rgba(236,72,153,0.3);background:linear-gradient(135deg,#FFF5FB,#F5F0FF);display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:110px;gap:4px;"
          @click="view = 'add'"
        >
          <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#EC4899,#7C3AED);display:flex;align-items:center;justify-content:center;font-size:20px;color:white;">+</div>
          <div style="font-size:10px;font-weight:800;color:#BE185D;text-align:center;padding:0 6px;">เพิ่มคนใหม่</div>
        </div>
      </div>
    </div>

    <!-- Comment view (existing kudos) -->
    <template v-else-if="view === 'comment' && selectedMember">
      <div style="flex:1;overflow-y:auto;display:flex;flex-direction:column;">
        <div class="emp-card-spotlight" style="flex-shrink:0;height:auto;">
          <img v-if="selectedMember.img" :src="selectedMember.img" style="width:100%;display:block;object-fit:cover;object-position:top center;" />
          <div v-else :style="{ width:'100%',height:'180px',background:selectedMember.grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'64px' }">{{ initials(selectedMember.name) }}</div>
          <div class="emp-spotlight-name">
            <div style="font-size:14px;font-weight:900;color:white;text-shadow:0 1px 8px rgba(0,0,0,0.5);">{{ selectedMember.name }}</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.88);font-weight:600;margin-top:2px;">{{ selectedMember.role }}</div>
          </div>
        </div>
        <div style="padding:12px 16px;display:flex;flex-direction:column;gap:8px;background:linear-gradient(160deg,#FFF9FD,#F8F5FF);flex:1;">
          <div style="font-size:11px;font-weight:800;color:#C084C0;letter-spacing:1px;margin-bottom:4px;">💌 คำชื่นชม</div>
          <div v-if="existingPost" style="background:linear-gradient(135deg,#FFF0FB,#F5F0FF);border:1px solid rgba(236,72,153,0.15);border-radius:14px;padding:10px 14px;font-size:12px;color:#6B21A8;line-height:1.6;">{{ existingPost.msg }}</div>
          <div v-for="c in existingPost?.comments" :key="c.id" style="background:white;border:1px solid rgba(236,72,153,0.12);border-radius:12px;padding:8px 12px;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
              <div style="width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,#FBCFE8,#EC4899);display:flex;align-items:center;justify-content:center;font-size:10px;color:white;font-weight:800;flex-shrink:0;">{{ c.name?.[0] }}</div>
              <span style="font-size:11px;font-weight:800;color:#BE185D;">{{ c.name }}</span>
              <span style="font-size:10px;color:#C084C0;margin-left:auto;">{{ c.time }}</span>
            </div>
            <div style="font-size:12px;color:#4C1D95;line-height:1.6;">{{ c.text }}</div>
          </div>
          <div v-if="!existingPost?.comments?.length && !existingPost" style="text-align:center;color:#C084C0;font-size:12px;padding:16px;">ยังไม่มีความคิดเห็น 💭</div>
        </div>
      </div>
      <!-- Comment input -->
      <div style="flex-shrink:0;border-top:1px solid rgba(236,72,153,0.1);background:white;padding:10px 16px;display:flex;flex-direction:column;gap:8px;">
        <div style="display:flex;gap:8px;align-items:flex-end;">
          <textarea v-model="commentText" placeholder="เพิ่มความคิดเห็น... 💬" rows="2" style="flex:1;border:1.5px solid rgba(236,72,153,0.25);border-radius:12px;padding:10px 12px;font-family:'Sarabun',sans-serif;font-size:13px;color:#6B21A8;background:#FFF5FB;resize:none;outline:none;box-sizing:border-box;line-height:1.6;"></textarea>
          <button @click="submitComment" style="background:linear-gradient(135deg,#EC4899,#7C3AED);color:#fff;border:none;border-radius:12px;padding:10px 16px;font-size:13px;font-weight:800;cursor:pointer;flex-shrink:0;">ส่ง 💝</button>
        </div>
        <button @click="view = 'grid'" style="background:rgba(236,72,153,0.08);border:1px solid rgba(236,72,153,0.25);border-radius:12px;padding:8px;font-size:12px;font-weight:700;color:#BE185D;cursor:pointer;width:100%;">👥 เลือกคนอื่น</button>
      </div>
    </template>

    <!-- New kudos view -->
    <template v-else-if="view === 'new' && selectedMember">
      <div style="flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:12px;">
        <div class="emp-card-spotlight" style="border-radius:16px;height:auto;flex-shrink:0;overflow:hidden;">
          <img v-if="selectedMember.img" :src="selectedMember.img" style="width:100%;display:block;object-fit:cover;object-position:top center;" />
          <div v-else :style="{ width:'100%',height:'160px',background:selectedMember.grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'48px' }">{{ initials(selectedMember.name) }}</div>
          <div class="emp-spotlight-name">
            <div style="font-size:14px;font-weight:900;color:white;">{{ selectedMember.name }}</div>
          </div>
        </div>

        <div>
          <div style="font-size:11px;font-weight:800;color:#C084C0;letter-spacing:1px;margin-bottom:8px;">🏷️ แท็ก</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button v-for="tag in tags" :key="tag" class="wish-chip" :class="{ active: selectedTag === tag }" @click="selectedTag = tag">{{ tag }}</button>
          </div>
        </div>

        <div>
          <div style="font-size:11px;font-weight:800;color:#C084C0;letter-spacing:1px;margin-bottom:8px;">✍️ ข้อความชื่นชม</div>
          <textarea v-model="kudosMsg" placeholder="พิมพ์ข้อความชื่นชมจากใจ... 💕" rows="3" maxlength="500" style="width:100%;border:1.5px solid rgba(236,72,153,0.2);border-radius:14px;padding:12px 14px;font-family:'Sarabun',sans-serif;font-size:13px;color:#6B21A8;background:#FFF5FB;resize:none;outline:none;box-sizing:border-box;line-height:1.6;"></textarea>
        </div>

        <div style="display:flex;align-items:center;gap:8px;background:linear-gradient(135deg,#FFFBEB,#FEF3C7);border:1px solid #FCD34D;border-radius:12px;padding:10px 14px;">
          <span style="font-size:16px;">🌟</span>
          <div style="font-size:11px;font-weight:700;color:#92400E;">ส่ง Empathy 1 ครั้ง = <strong>+10 LINE pts</strong></div>
        </div>
      </div>

      <div style="flex-shrink:0;border-top:1px solid rgba(236,72,153,0.1);background:white;padding:12px 16px;display:flex;flex-direction:column;gap:8px;">
        <button @click="submitKudos" class="modal-close-btn" style="background:linear-gradient(135deg,#EC4899,#7C3AED);margin:0;">ส่งคำชื่นชม 💝</button>
        <button @click="view = 'grid'" style="background:rgba(236,72,153,0.08);border:1px solid rgba(236,72,153,0.25);border-radius:12px;padding:8px;font-size:12px;font-weight:700;color:#BE185D;cursor:pointer;width:100%;">👥 เลือกคนอื่น</button>
      </div>
    </template>

    <!-- Add person view -->
    <template v-else-if="view === 'add'">
      <div style="flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:14px;">
        <input v-model="dirSearch" @input="filterDir" placeholder="พิมพ์รหัสหรือชื่อพนักงาน..." style="width:100%;border:1.5px solid rgba(236,72,153,0.25);border-radius:12px;padding:10px 14px;font-family:'Sarabun',sans-serif;font-size:13px;color:#6B21A8;background:#FFF5FB;outline:none;box-sizing:border-box;" />
        <div v-if="dirResults.length" style="border:1.5px solid rgba(236,72,153,0.2);border-radius:12px;overflow:hidden;background:white;box-shadow:0 8px 24px rgba(236,72,153,0.12);">
          <div v-for="e in dirResults" :key="e.id" @click="pickFromDir(e)" style="display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;border-bottom:1px solid rgba(236,72,153,0.08);" @mouseover="$event.target.closest('div').style.background='#FFF0FB'" @mouseout="$event.target.closest('div').style.background=''">
            <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#FBCFE8,#EC4899);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;color:white;flex-shrink:0;">{{ e.name?.[0] }}</div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:12px;font-weight:800;color:#7C2D8C;">{{ e.name }}</div>
              <div style="font-size:10px;color:#C084C0;font-weight:600;">{{ e.id }} · {{ e.role }}</div>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:auto;">
          <button @click="view = 'grid'" style="flex:1;background:rgba(236,72,153,0.08);border:1px solid rgba(236,72,153,0.25);border-radius:12px;padding:11px;font-size:13px;font-weight:700;color:#BE185D;cursor:pointer;">ยกเลิก</button>
          <button @click="addAndPraise" style="flex:2;background:linear-gradient(135deg,#EC4899,#7C3AED);color:#fff;border:none;border-radius:12px;padding:11px;font-size:13px;font-weight:900;cursor:pointer;">เพิ่มและชื่นชม ✨</button>
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed } from 'vue'
import BaseModal from '../shared/BaseModal.vue'
import { useEmpathyStore } from '../../stores/empathy.js'
import { useTeamStore } from '../../stores/team.js'
import { useUiStore } from '../../stores/ui.js'

const empathy = useEmpathyStore()
const team = useTeamStore()
const ui = useUiStore()

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
    recImgUrl: selectedMember.value.img || '',
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
