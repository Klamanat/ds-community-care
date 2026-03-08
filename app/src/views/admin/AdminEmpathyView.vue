<template>
  <div class="al-wrap">
    <header class="al-header">
      <div class="al-logo">🛡️ DS Admin</div>
      <div class="al-header-right">
        <span class="al-user-name">{{ admin.adminName }}</span>
        <button class="al-logout-btn" @click="doLogout">ออกจากระบบ</button>
      </div>
    </header>

    <main class="al-main">
      <a class="al-back" @click="router.push('/admin')">← Dashboard</a>

      <div class="al-page-header">
        <h2 class="al-page-title">💌 Empathy Posts</h2>
        <span class="al-badge al-badge-blue">{{ rows.length }} โพสต์</span>
      </div>

      <div class="al-card">
        <div v-if="loading" class="al-loading">⏳ กำลังโหลด...</div>
        <div v-else-if="!rows.length" class="al-empty">📭 ไม่มีโพสต์</div>

        <div v-else>
          <div class="al-item" v-for="r in rows" :key="r.id">
            <div class="al-item-avatar" style="background:linear-gradient(135deg,#FDF2F8,#FBCFE8);font-size:18px;">💌</div>
            <div class="al-item-body">
              <div class="al-item-title">{{ r.sndName }} → {{ r.recName }}</div>
              <div class="al-item-sub">{{ r.msg }}</div>
              <div class="al-item-meta">
                <span v-if="r.tag" class="al-badge al-badge-pending">{{ r.tag }}</span>
                <span>❤️ {{ r.likeCount || 0 }}</span>
                <span>{{ formatDate(r.createdAt) }}</span>
              </div>
            </div>
            <button class="al-btn al-btn-delete" @click="confirmDelete(r)">ลบ</button>
          </div>
        </div>
      </div>
    </main>

    <!-- Delete Confirm -->
    <div v-if="delTarget" class="al-modal-overlay" @click.self="delTarget=null">
      <div class="al-modal">
        <div class="al-modal-handle"></div>
        <div class="al-modal-title">🗑️ ยืนยันการลบโพสต์</div>
        <p style="font-size:13px;color:#374151;margin:0 0 6px;">
          ลบโพสต์จาก <strong>{{ delTarget.sndName }}</strong> ถึง <strong>{{ delTarget.recName }}</strong>?
        </p>
        <div class="al-msg-preview">{{ delTarget.msg }}</div>
        <div style="background:#FEF2F2;border-radius:8px;padding:10px 12px;font-size:12px;color:#DC2626;margin-bottom:4px;">
          ⚠️ จะลบ comments และ likes ของโพสต์นี้ด้วย (cascade delete)
        </div>
        <div class="al-modal-footer">
          <button class="al-btn al-btn-cancel" @click="delTarget=null">ยกเลิก</button>
          <button class="al-btn al-btn-delete" :disabled="deleting" @click="doDelete">
            {{ deleting ? 'กำลังลบ...' : '🗑️ ลบโพสต์' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '../../stores/admin.js'
import * as svc from '../../services/adminService.js'

const admin  = useAdminStore()
const router = useRouter()

const rows    = ref([])
const loading = ref(true)
const delTarget = ref(null)
const deleting  = ref(false)

const SEED = [
  { id:'ep1', sndName:'น้ำส้ม', recName:'นก', msg:'ขอบคุณที่ช่วยงานตลอดนะคะ 💕', tag:'ขอบคุณ', likeCount:5, createdAt:'2026-01-15T09:00:00Z' },
  { id:'ep2', sndName:'วุฒิ', recName:'น้ำส้ม', msg:'งานดีไซน์สวยมากเลยครับ ประทับใจมาก', tag:'ชื่นชม', likeCount:3, createdAt:'2026-01-20T14:30:00Z' },
]

function formatDate(s) {
  if (!s) return '-'
  const d = new Date(s)
  if (isNaN(d)) return s
  return `${d.getDate()} ${['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'][d.getMonth()]} ${d.getFullYear()+543}`
}

onMounted(async () => {
  try {
    const data = await svc.getAll('EmpathyPosts')
    rows.value = data.length ? data : SEED
  } catch {
    rows.value = SEED
  } finally {
    loading.value = false
  }
})

function confirmDelete(r) { delTarget.value = r }
async function doDelete() {
  deleting.value = true
  try {
    await svc.deletePost(delTarget.value.id)
    rows.value = rows.value.filter(r => r.id !== delTarget.value.id)
    delTarget.value = null
  } catch { } finally {
    deleting.value = false
  }
}

function doLogout() { admin.logout(); router.push('/admin/login') }
</script>

<style scoped>
@import './admin.css';
</style>
