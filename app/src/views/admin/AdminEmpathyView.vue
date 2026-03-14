<template>
  <div class="al-wrap">
    <header class="al-header">
      <div class="al-logo">🛡️ DS Admin</div>
      <div class="al-header-right">
        <span class="al-user-name">{{ admin.adminName }}</span>
        <button class="al-btn al-btn-cancel" @click="doLogout">ออกจากระบบ</button>
      </div>
    </header>

    <main class="al-main">
      <a class="al-back" @click="router.push('/admin')">← Dashboard</a>

      <div class="al-page-header">
        <h2 class="al-page-title">💌 Empathy Board</h2>
        <span class="al-badge al-badge-blue">{{ channels.length }} คน</span>
      </div>

      <div class="al-card">
        <div v-if="loading" class="al-loading">⏳ กำลังโหลด...</div>
        <div v-else-if="!channels.length" class="al-empty">📭 ไม่มีข้อมูล</div>

        <div v-else>
          <div class="al-item" v-for="ch in channels" :key="ch.id">
            <div style="width:44px;height:44px;flex-shrink:0;border-radius:50%;overflow:hidden;background:linear-gradient(135deg,#FDF2F8,#FBCFE8);display:flex;align-items:center;justify-content:center;font-size:20px;">
              <img v-if="ch.imgUrl" :src="ch.imgUrl" style="width:100%;height:100%;object-fit:cover;" />
              <span v-else>💌</span>
            </div>
            <div class="al-item-body">
              <div class="al-item-title">{{ ch.name }}</div>
              <div class="al-item-sub">{{ ch.role }}</div>
              <div class="al-item-meta">
                <span>💬 {{ ch.count }}</span>
                <span>❤️ {{ ch.likes }}</span>
              </div>
            </div>
            <button class="al-btn al-btn-delete" @click="confirmDelete(ch)">ลบ</button>
          </div>
        </div>
      </div>
    </main>

    <!-- Delete Confirm -->
    <div v-if="delTarget" class="al-modal-overlay" @click.self="delTarget=null">
      <div class="al-modal">
        <div class="al-modal-handle"></div>
        <div class="al-modal-title">🗑️ ยืนยันลบ</div>
        <p style="font-size:13px;color:#374151;margin:0 0 12px;">
          ลบ Empathy ทั้งหมดของ <strong>{{ delTarget.name }}</strong>?<br>
          <span style="font-size:12px;color:#6B7280;">({{ delTarget.count }} kudos)</span>
        </p>
        <div style="background:#FEF2F2;border-radius:8px;padding:10px 12px;font-size:12px;color:#DC2626;margin-bottom:4px;">
          ⚠️ จะลบ kudos, replies และ likes ทั้งหมดของคนนี้
        </div>
        <div class="al-modal-footer">
          <button class="al-btn al-btn-cancel" @click="delTarget=null">ยกเลิก</button>
          <button class="al-btn al-btn-delete" :disabled="deleting" @click="doDelete">
            {{ deleting ? 'กำลังลบ...' : '🗑️ ลบ' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '../../stores/admin.js'
import * as svc from '../../services/adminService.js'

const admin  = useAdminStore()
const router = useRouter()

const comments  = ref([])
const likesRaw  = ref([])
const empMap    = ref({})   // empCode/id → { name, role }
const photoMap  = ref({})   // empCode → imgUrl (from EmpathyPhotos)
const loading   = ref(true)
const deleting  = ref(false)
const delTarget = ref(null)

// Group comments by postId → one entry per person
const channels = computed(() => {
  const likesMap = {}
  for (const l of likesRaw.value) {
    const cid = String(l.channelId || '').trim()
    if (cid) likesMap[cid] = (likesMap[cid] || 0) + 1
  }

  const map = new Map()
  for (const c of comments.value) {
    const cid = String(c.postId || '').trim()
    if (!cid) continue
    if (!map.has(cid)) {
      const emp = empMap.value[cid] || {}
      map.set(cid, {
        id:     cid,
        name:   emp.name  || cid,
        role:   emp.role  || '',
        imgUrl: photoMap.value[cid] || '',
        count:  0,
        likes:  likesMap[cid] || 0,
      })
    }
    map.get(cid).count++
  }
  return [...map.values()].sort((a, b) => b.count - a.count)
})

onMounted(async () => {
  try {
    const [cmts, emps, lks, photos] = await Promise.all([
      svc.getAll('EmpathyComments'),
      svc.getEmployees(),
      svc.getAll('ChannelLikes'),
      svc.getAll('EmpathyPhotos'),
    ])
    const m = {}
    ;(emps || []).forEach(e => {
      if (e.empCode) m[String(e.empCode)] = e
      if (e.id)      m[String(e.id)]      = e
    })
    const pm = {}
    ;(photos || []).forEach(p => {
      if (p.empCode && p.imgUrl) pm[String(p.empCode)] = String(p.imgUrl)
    })
    empMap.value   = m
    photoMap.value = pm
    comments.value = cmts || []
    likesRaw.value = lks  || []
  } catch {
    comments.value = []
  } finally {
    loading.value = false
  }
})

function confirmDelete(ch) { delTarget.value = ch }

async function doDelete() {
  deleting.value = true
  try {
    await svc.deleteChannel(delTarget.value.id)
    comments.value = comments.value.filter(c => String(c.postId) !== delTarget.value.id)
    delTarget.value = null
  } catch {} finally {
    deleting.value = false
  }
}

function doLogout() { admin.logout(); router.push('/admin/login') }
</script>

<style scoped>
@import './admin.css';
</style>
