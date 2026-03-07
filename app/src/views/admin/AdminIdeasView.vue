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
      <h2 class="al-page-title">💡 จัดการไอเดีย</h2>

      <!-- Filter -->
      <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
        <button
          v-for="f in FILTERS" :key="f.val"
          class="al-btn"
          :style="filter === f.val ? 'background:#6366F1;color:white;' : 'background:#F3F4F6;color:#374151;'"
          @click="filter = f.val"
        >{{ f.label }}</button>
      </div>

      <div class="al-card">
        <div class="al-card-header">
          <span class="al-card-title">{{ filterLabel }} ({{ filtered.length }})</span>
        </div>

        <div v-if="loading" class="al-loading">กำลังโหลด...</div>
        <div v-else-if="filtered.length === 0" class="al-empty">ไม่มีข้อมูล</div>
        <div v-else class="al-table-wrap">
          <table class="al-table">
            <thead>
              <tr>
                <th>หัวข้อ</th>
                <th>หมวด</th>
                <th>ผู้ส่ง</th>
                <th>Status</th>
                <th>วันที่</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in filtered" :key="r.id">
                <td style="font-weight:700;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="r.title">{{ r.title }}</td>
                <td style="white-space:nowrap;">{{ r.category }}</td>
                <td style="white-space:nowrap;">{{ r.submitterName }}</td>
                <td>
                  <select
                    class="al-form-select"
                    style="padding:4px 8px;font-size:11px;width:auto;"
                    :value="r.status"
                    @change="changeStatus(r, $event.target.value)"
                  >
                    <option value="pending">⏳ Pending</option>
                    <option value="approved">✅ Approved</option>
                    <option value="rejected">❌ Rejected</option>
                  </select>
                </td>
                <td style="white-space:nowrap;font-size:11px;">{{ formatDate(r.createdAt) }}</td>
                <td style="display:flex;gap:6px;">
                  <button class="al-btn al-btn-edit" @click="openDetail(r)">ดู</button>
                  <button class="al-btn al-btn-delete" @click="confirmDelete(r)">ลบ</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <!-- Detail Modal -->
    <div v-if="detailTarget" class="al-modal-overlay" @click.self="detailTarget=null">
      <div class="al-modal">
        <div class="al-modal-title">💡 {{ detailTarget.title }}</div>
        <div style="font-size:11px;color:#9CA3AF;margin-bottom:12px;">
          {{ detailTarget.category }} · {{ detailTarget.submitterName }} · {{ formatDate(detailTarget.createdAt) }}
        </div>
        <div style="font-size:13px;color:#374151;line-height:1.7;background:#F9FAFB;border-radius:10px;padding:12px;margin-bottom:16px;">
          {{ detailTarget.detail || '(ไม่มีรายละเอียดเพิ่มเติม)' }}
        </div>
        <div style="margin-bottom:12px;">
          <label class="al-form-label">เปลี่ยน Status</label>
          <select class="al-form-select" v-model="detailStatus" style="max-width:200px;">
            <option value="pending">⏳ Pending</option>
            <option value="approved">✅ Approved</option>
            <option value="rejected">❌ Rejected</option>
          </select>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button class="al-btn" style="background:#F3F4F6;color:#374151;" @click="detailTarget=null">ปิด</button>
          <button class="al-btn al-btn-save" :disabled="saving" @click="saveStatus">
            {{ saving ? 'กำลังบันทึก...' : 'บันทึก Status' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirm -->
    <div v-if="delTarget" class="al-modal-overlay" @click.self="delTarget=null">
      <div class="al-modal" style="max-width:360px;">
        <div class="al-modal-title">🗑️ ยืนยันการลบ</div>
        <p style="font-size:13px;color:#374151;margin:0 0 16px;">
          ลบไอเดีย "<strong>{{ delTarget.title }}</strong>" ใช่หรือไม่?
        </p>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button class="al-btn" style="background:#F3F4F6;color:#374151;" @click="delTarget=null">ยกเลิก</button>
          <button class="al-btn al-btn-delete" :disabled="deleting" @click="doDelete">
            {{ deleting ? 'กำลังลบ...' : 'ลบ' }}
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

const rows    = ref([])
const loading = ref(true)
const filter  = ref('all')
const saving  = ref(false)

const detailTarget = ref(null)
const detailStatus = ref('pending')
const delTarget    = ref(null)
const deleting     = ref(false)

const FILTERS = [
  { val:'all', label:'ทั้งหมด' },
  { val:'pending', label:'⏳ Pending' },
  { val:'approved', label:'✅ Approved' },
  { val:'rejected', label:'❌ Rejected' },
]

const filtered = computed(() =>
  filter.value === 'all' ? rows.value : rows.value.filter(r => r.status === filter.value)
)
const filterLabel = computed(() => FILTERS.find(f => f.val === filter.value)?.label || 'ทั้งหมด')

const SEED = [
  { id:'idea1', title:'ระบบ OKR รายบุคคล', category:'HR', submitterName:'นก', status:'pending', createdAt:'2026-01-10T08:00:00Z', detail:'อยากให้มีระบบติดตาม OKR แบบ real-time เพื่อให้พนักงานเห็นความก้าวหน้าของตัวเองได้ชัดเจนขึ้น' },
  { id:'idea2', title:'ห้องพักสายตาในออฟฟิศ', category:'สวัสดิการ', submitterName:'วุฒิ', status:'approved', createdAt:'2026-01-12T10:00:00Z', detail:'ขอพื้นที่เล็กๆ สำหรับพักสายตา/นั่งเงียบๆ ระหว่างวัน' },
]

function formatDate(s) {
  if (!s) return '-'
  const d = new Date(s)
  if (isNaN(d)) return s
  return `${d.getDate()} ${['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'][d.getMonth()]} ${d.getFullYear()+543}`
}

onMounted(async () => {
  try {
    const data = await svc.getAll('Ideas')
    rows.value = data.length ? data : SEED
  } catch {
    rows.value = SEED
  } finally {
    loading.value = false
  }
})

async function changeStatus(r, val) {
  const old = r.status
  r.status = val
  try {
    await svc.updateIdea(r.id, val)
  } catch {
    r.status = old
  }
}

function openDetail(r) {
  detailTarget.value = r
  detailStatus.value = r.status
}

async function saveStatus() {
  saving.value = true
  try {
    await svc.updateIdea(detailTarget.value.id, detailStatus.value)
    detailTarget.value.status = detailStatus.value
    detailTarget.value = null
  } catch { } finally {
    saving.value = false
  }
}

function confirmDelete(r) { delTarget.value = r }
async function doDelete() {
  deleting.value = true
  try {
    await svc.deleteRow('Ideas', 'id', delTarget.value.id)
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
