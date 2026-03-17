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
        <h2 class="al-page-title">💡 ไอเดีย</h2>
        <span class="al-badge al-badge-blue">{{ filtered.length }} รายการ</span>
      </div>

      <!-- Filter chips -->
      <div class="al-filters">
        <button
          v-for="f in FILTERS" :key="f.val"
          class="al-chip"
          :class="{ active: filter === f.val }"
          @click="filter = f.val"
        >{{ f.label }}</button>
      </div>

      <div class="al-card">
        <div v-if="loading" class="al-loading">⏳ กำลังโหลด...</div>
        <div v-else-if="!filtered.length" class="al-empty">📭 ไม่มีข้อมูล</div>

        <div v-else>
          <div class="al-item" v-for="r in filtered" :key="r.id">
            <div class="al-item-body">
              <div class="al-item-title">{{ r.title }}</div>
              <div class="al-item-sub">{{ r.category }} · {{ r.submitterName }}</div>
              <div class="al-item-meta">
                <span class="al-badge" :class="badgeClass(r.status)">{{ statusLabel(r.status) }}</span>
                <span>{{ formatDate(r.createdAt) }}</span>
              </div>
            </div>
            <div class="al-item-actions">
              <button class="al-btn al-btn-edit" @click="openDetail(r)">ดู</button>
              <button class="al-btn al-btn-delete" @click="confirmDelete(r)">ลบ</button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Detail Modal -->
    <div v-if="detailTarget" class="al-modal-overlay" @click.self="detailTarget=null">
      <div class="al-modal">
        <div class="al-modal-handle"></div>
        <div class="al-modal-title">💡 {{ detailTarget.title }}</div>
        <div style="font-size:11px;color:#9CA3AF;margin-bottom:12px;">
          {{ detailTarget.category }} · {{ detailTarget.submitterName }} · {{ formatDate(detailTarget.createdAt) }}
        </div>
        <div class="al-msg-preview">{{ detailTarget.detail || '(ไม่มีรายละเอียดเพิ่มเติม)' }}</div>
        <div class="al-form-row">
          <label class="al-form-label">เปลี่ยน Status</label>
          <select class="al-form-select" v-model="detailStatus">
            <option value="pending">⏳ Pending</option>
            <option value="approved">✅ Approved</option>
            <option value="rejected">❌ Rejected</option>
          </select>
        </div>
        <div class="al-modal-footer">
          <button class="al-btn al-btn-cancel" @click="detailTarget=null">ปิด</button>
          <button class="al-btn al-btn-save" :disabled="saving" @click="saveStatus">
            {{ saving ? 'กำลังบันทึก...' : '✅ บันทึก Status' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirm -->
    <div v-if="delTarget" class="al-modal-overlay" @click.self="delTarget=null">
      <div class="al-modal">
        <div class="al-modal-handle"></div>
        <div class="al-modal-title">🗑️ ยืนยันการลบ</div>
        <p style="font-size:13px;color:#374151;margin:0 0 16px;">
          ลบไอเดีย "<strong>{{ delTarget.title }}</strong>" ใช่หรือไม่?
        </p>
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

const rows    = ref([])
const loading = ref(true)
const filter  = ref('all')
const saving  = ref(false)

const detailTarget = ref(null)
const detailStatus = ref('pending')
const delTarget    = ref(null)
const deleting     = ref(false)

const FILTERS = [
  { val:'all',      label:'ทั้งหมด' },
  { val:'pending',  label:'⏳ Pending' },
  { val:'approved', label:'✅ Approved' },
  { val:'rejected', label:'❌ Rejected' },
]

const filtered = computed(() =>
  filter.value === 'all' ? rows.value : rows.value.filter(r => r.status === filter.value)
)

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

function badgeClass(s) {
  if (s === 'approved') return 'al-badge-approved'
  if (s === 'rejected') return 'al-badge-rejected'
  return 'al-badge-pending'
}
function statusLabel(s) {
  if (s === 'approved') return '✅ Approved'
  if (s === 'rejected') return '❌ Rejected'
  return '⏳ Pending'
}

onMounted(async () => {
  try {
    const data = await svc.getAdminIdeas()
    rows.value = data.length ? data : SEED
  } catch {
    rows.value = SEED
  } finally {
    loading.value = false
  }
})

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
