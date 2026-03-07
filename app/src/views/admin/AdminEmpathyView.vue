<template>
  <div class="al-wrap">
    <header class="al-header">
      <div class="al-logo">🛡️ DS Admin</div>
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:13px;color:#6B7280;">สวัสดี, <strong>{{ admin.adminName }}</strong></span>
        <button class="al-logout-btn" @click="doLogout">ออกจากระบบ</button>
      </div>
    </header>

    <main class="al-main">
      <a class="al-back" @click="router.push('/admin')">← กลับ Dashboard</a>
      <h2 class="al-page-title">💌 จัดการ Empathy Posts</h2>

      <div class="al-card">
        <div class="al-card-header">
          <span class="al-card-title">โพสต์ทั้งหมด ({{ rows.length }})</span>
        </div>

        <div v-if="loading" class="al-loading">กำลังโหลด...</div>
        <div v-else-if="rows.length === 0" class="al-empty">ไม่มีโพสต์</div>
        <div v-else class="al-table-wrap">
          <table class="al-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>จาก</th>
                <th>ถึง</th>
                <th>ข้อความ</th>
                <th>แท็ก</th>
                <th>❤️</th>
                <th>วันที่</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in rows" :key="r.id">
                <td style="color:#9CA3AF;font-size:11px;">{{ r.id }}</td>
                <td style="font-weight:700;white-space:nowrap;">{{ r.sndName }}</td>
                <td style="white-space:nowrap;">{{ r.recName }}</td>
                <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="r.msg">{{ r.msg }}</td>
                <td>
                  <span class="al-badge al-badge-pending" style="font-size:10px;">{{ r.tag }}</span>
                </td>
                <td style="text-align:center;">{{ r.likeCount || 0 }}</td>
                <td style="white-space:nowrap;font-size:11px;">{{ formatDate(r.createdAt) }}</td>
                <td>
                  <button class="al-btn al-btn-delete" @click="confirmDelete(r)">ลบ</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <!-- Delete Confirm -->
    <div v-if="delTarget" class="al-modal-overlay" @click.self="delTarget=null">
      <div class="al-modal" style="max-width:400px;">
        <div class="al-modal-title">🗑️ ยืนยันการลบโพสต์</div>
        <p style="font-size:13px;color:#374151;margin:0 0 8px;">
          ลบโพสต์จาก "<strong>{{ delTarget.sndName }}</strong>" ถึง "<strong>{{ delTarget.recName }}</strong>"?
        </p>
        <p style="font-size:12px;color:#9CA3AF;margin:0 0 16px;">{{ delTarget.msg }}</p>
        <div style="background:#FEF2F2;border-radius:8px;padding:10px 12px;margin-bottom:16px;font-size:12px;color:#DC2626;">
          ⚠️ จะลบ comments และ likes ของโพสต์นี้ด้วย (cascade delete)
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button class="al-btn" style="background:#F3F4F6;color:#374151;" @click="delTarget=null">ยกเลิก</button>
          <button class="al-btn al-btn-delete" :disabled="deleting" @click="doDelete">
            {{ deleting ? 'กำลังลบ...' : 'ลบโพสต์' }}
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
