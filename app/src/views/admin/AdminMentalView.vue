<template>
  <div>
    <main class="al-main">

      <div class="al-page-header">
        <h2 class="al-page-title">💚 ที่ปรึกษาสุขภาพจิต</h2>
        <button v-if="tab === 'advisors'" class="al-btn al-btn-primary" @click="openAdd">+ เพิ่ม</button>
        <button v-else class="al-btn al-btn-secondary" @click="loadRequests(true)">🔄 โหลดใหม่</button>
      </div>

      <!-- Tabs -->
      <div class="mav-tabs">
        <button class="mav-tab" :class="{ active: tab === 'advisors' }" @click="tab = 'advisors'">
          👥 ที่ปรึกษา
          <span class="mav-tab-badge">{{ advisors.length }}</span>
        </button>
        <button class="mav-tab" :class="{ active: tab === 'requests' }" @click="switchToRequests">
          📥 ข้อความ
          <span v-if="requests.length" class="mav-tab-badge mav-tab-badge-green">{{ requests.length }}</span>
        </button>
      </div>

      <!-- ── Tab: Advisors ── -->
      <div v-if="tab === 'advisors'">
        <div class="al-card">
          <div class="al-card-header">
            <span class="al-card-title">Mental Health Advisors</span>
            <span class="al-badge al-badge-blue">{{ advisors.length }} คน</span>
          </div>

          <div v-if="loading" class="al-loading">⏳ กำลังโหลด...</div>
          <div v-else-if="!advisors.length" class="al-empty">📭 ยังไม่มีที่ปรึกษา — กด "+ เพิ่ม" เพื่อเริ่มต้น</div>

          <div v-else>
            <div class="al-item" v-for="a in advisors" :key="a.id">
              <div class="al-item-avatar" :style="{ background: grad(a.name) }">
                <span style="font-size:20px;color:white;font-weight:800;">{{ (a.name||'?').charAt(0) }}</span>
              </div>
              <div class="al-item-body">
                <div class="al-item-title">{{ a.name }}</div>
                <div class="al-item-sub">{{ a.role || '—' }}</div>
                <div class="al-item-meta">
                  <span v-if="a.employeeId" style="color:#6B7280;">🪪 ID: {{ a.employeeId }}</span>
                  <span v-else style="color:#EF4444;font-size:11px;">⚠️ ยังไม่ได้เลือกพนักงาน</span>
                </div>
              </div>
              <div class="al-item-actions">
                <button class="al-btn al-btn-edit"   @click="openEdit(a)">แก้ไข</button>
                <button class="al-btn al-btn-delete" @click="confirmDel(a)">ลบ</button>
              </div>
            </div>
          </div>
        </div>

        <div class="al-info-box" style="margin-top:12px;">
          <div style="font-size:12px;font-weight:800;color:#3730A3;margin-bottom:6px;">📋 วิธีใช้งาน</div>
          <ul style="font-size:12px;color:#4338CA;line-height:2;padding-left:16px;margin:0;">
            <li>เพิ่มที่ปรึกษาและค้นหาพนักงานที่จะรับหน้าที่นี้</li>
            <li>พนักงานที่ถูกเลือกจะเห็นกล่องข้อความใน Profile</li>
            <li>ลำดับ (Order) ใช้ควบคุมการเรียงแสดงใน Modal</li>
          </ul>
        </div>
      </div>

      <!-- ── Tab: Requests ── -->
      <div v-else-if="tab === 'requests'">
        <div class="al-card">
          <div class="al-card-header">
            <span class="al-card-title">ข้อความทั้งหมด</span>
            <span class="al-badge al-badge-blue">{{ requests.length }} ข้อความ</span>
          </div>

          <div v-if="reqLoading" class="al-loading">⏳ กำลังโหลด...</div>
          <div v-else-if="reqError" style="padding:16px;color:#DC2626;font-size:13px;">⚠️ {{ reqError }}</div>
          <div v-else-if="!requests.length" class="al-empty">📭 ยังไม่มีข้อความ</div>

          <div v-else>
            <div v-for="r in requests" :key="r.id" class="mav-req-item" :class="{ 'mav-req-unread': r.isRead !== 'true' }">
              <div class="mav-req-to">
                <span class="mav-req-label">ถึง:</span>
                <span class="mav-req-name">{{ r.counselorName }}</span>
                <span class="mav-req-id">(ID: {{ r.counselorEmployeeId || '—' }})</span>
                <span v-if="r.isRead !== 'true'" class="mav-req-new">ใหม่</span>
              </div>
              <div class="mav-req-msg">{{ r.message }}</div>
              <div class="mav-req-time">{{ fmtTime(r.createdAt) }}</div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- ── Add / Edit Modal ── -->
    <div v-if="modal.open" class="al-modal-overlay" @click.self="modal.open=false">
      <div class="al-modal">
        <div class="al-modal-handle"></div>
        <div class="al-modal-title">{{ modal.mode === 'add' ? '+ เพิ่มที่ปรึกษา' : '✏️ แก้ไขที่ปรึกษา' }}</div>

        <div class="al-form-row">
          <label class="al-form-label">ชื่อ *</label>
          <input v-model="form.name" class="al-form-input" placeholder="เช่น พี่มะนาว" maxlength="80" />
        </div>

        <div class="al-form-row">
          <label class="al-form-label">บทบาท / ตำแหน่ง</label>
          <input v-model="form.role" class="al-form-input" placeholder="เช่น ที่ปรึกษาด้านสุขภาพจิต" maxlength="100" />
        </div>

        <!-- Employee autocomplete -->
        <div class="al-form-row" style="position:relative;">
          <label class="al-form-label">พนักงานที่รับคำปรึกษา (ระบบจะแสดงกล่องข้อความให้พนักงานนี้)</label>
          <input
            v-model="empSearch"
            class="al-form-input"
            placeholder="พิมพ์ชื่อเพื่อค้นหา..."
            autocomplete="off"
            @focus="showDrop=true"
            @blur="onBlur"
          />
          <div v-if="showDrop && empSuggestions.length" class="mav-drop">
            <button
              v-for="e in empSuggestions"
              :key="e.id"
              class="mav-drop-item"
              @mousedown.prevent="pickEmployee(e)"
            >
              <span class="mav-drop-name">{{ e.name }}</span>
              <span class="mav-drop-role">{{ e.role }} · ID: {{ e.id }}</span>
            </button>
          </div>
          <div v-if="form.employeeId" class="mav-picked">
            ✅ ID: {{ form.employeeId }}
            <button class="mav-clear" @click="clearEmployee">✕</button>
          </div>
        </div>

        <div class="al-form-row">
          <label class="al-form-label">ลำดับการแสดง (Order)</label>
          <input v-model.number="form.order" type="number" min="0" class="al-form-input" style="max-width:100px;" />
        </div>

        <div v-if="modal.error" class="al-error">⚠️ {{ modal.error }}</div>

        <div class="al-modal-footer">
          <button class="al-btn al-btn-cancel" @click="modal.open=false">ยกเลิก</button>
          <button class="al-btn al-btn-save" :disabled="modal.saving" @click="doSave">
            {{ modal.saving ? 'กำลังบันทึก...' : '✅ บันทึก' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── Delete Confirm ── -->
    <div v-if="delTarget" class="al-modal-overlay" @click.self="delTarget=null">
      <div class="al-modal">
        <div class="al-modal-handle"></div>
        <div class="al-modal-title">🗑️ ยืนยันการลบ</div>
        <p style="font-size:13px;color:#374151;margin:0 0 16px;">
          ลบ "<strong>{{ delTarget.name }}</strong>" ออกจากรายชื่อที่ปรึกษา?
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
import { ref, reactive, computed, onMounted } from 'vue'
import {
  getEmployees,
  getMentalAdvisors, addMentalAdvisor, updateMentalAdvisor, deleteMentalAdvisor,
  getConsultRequests,
} from '../../services/adminService.js'

const tab = ref('advisors')

// ── Advisors ─────────────────────────────────────────────────────────────
const advisors  = ref([])
const employees = ref([])
const loading   = ref(true)
const modal     = reactive({ open: false, mode: 'add', saving: false, error: '' })
const form      = reactive({ id: '', name: '', role: '', employeeId: '', order: 0 })
const delTarget = ref(null)
const deleting  = ref(false)
const empSearch = ref('')
const showDrop  = ref(false)

const empSuggestions = computed(() => {
  const q = empSearch.value.trim().toLowerCase()
  if (!q) return []
  return employees.value
    .filter(e => (e.name || '').toLowerCase().includes(q))
    .slice(0, 8)
})

const GRADS = [
  'linear-gradient(135deg,#FDE68A,#F59E0B)',
  'linear-gradient(135deg,#FBCFE8,#EC4899)',
  'linear-gradient(135deg,#A7F3D0,#10B981)',
  'linear-gradient(135deg,#C7D2FE,#6366F1)',
  'linear-gradient(135deg,#BAE6FD,#0EA5E9)',
  'linear-gradient(135deg,#FED7AA,#F97316)',
]
function grad(name) {
  const n = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return GRADS[n % GRADS.length]
}

onMounted(async () => {
  const [ar, er] = await Promise.allSettled([
    getMentalAdvisors(),
    getEmployees(),
  ])
  advisors.value  = ar.status === 'fulfilled' ? (ar.value || []) : []
  employees.value = er.status === 'fulfilled' ? (er.value || []) : []
  loading.value   = false
})

function openAdd() {
  Object.assign(form, { id: '', name: '', role: '', employeeId: '', order: advisors.value.length })
  empSearch.value = ''; showDrop.value = false
  modal.mode = 'add'; modal.error = ''; modal.open = true
}

function openEdit(a) {
  Object.assign(form, { ...a })
  empSearch.value = ''; showDrop.value = false
  modal.mode = 'edit'; modal.error = ''; modal.open = true
}

function pickEmployee(e) {
  form.employeeId = e.id
  if (!form.name) form.name = e.name
  if (!form.role) form.role = e.role
  empSearch.value = e.name
  showDrop.value  = false
}

function clearEmployee() {
  form.employeeId = ''
  empSearch.value = ''
}

function onBlur() {
  setTimeout(() => { showDrop.value = false }, 150)
}

async function doSave() {
  if (!form.name.trim()) { modal.error = 'กรุณากรอกชื่อ'; return }
  modal.saving = true; modal.error = ''
  try {
    const payload = { name: form.name.trim(), role: form.role.trim(), employeeId: form.employeeId.trim(), order: form.order }
    if (modal.mode === 'add') {
      const created = await addMentalAdvisor(payload)
      advisors.value.push(created)
    } else {
      const updated = await updateMentalAdvisor(form.id, payload)
      const idx = advisors.value.findIndex(a => a.id === form.id)
      if (idx >= 0) advisors.value[idx] = updated
    }
    advisors.value.sort((a, b) => (a.order || 0) - (b.order || 0))
    modal.open = false
  } catch (e) {
    modal.error = e.message || 'เกิดข้อผิดพลาด'
  } finally {
    modal.saving = false
  }
}

function confirmDel(a) { delTarget.value = a }
async function doDelete() {
  deleting.value = true
  try {
    await deleteMentalAdvisor(delTarget.value.id)
    advisors.value = advisors.value.filter(a => a.id !== delTarget.value.id)
    delTarget.value = null
  } catch {} finally { deleting.value = false }
}

// ── Consultation Requests ──────────────────────────────────────────────────
const requests   = ref([])
const reqLoading = ref(false)
const reqError   = ref('')
const reqLoaded  = ref(false)

function switchToRequests() {
  tab.value = 'requests'
  if (!reqLoaded.value) loadRequests()
}

async function loadRequests(force = false) {
  if (!force && reqLoaded.value) return
  reqLoading.value = true; reqError.value = ''
  try {
    requests.value  = await getConsultRequests()
    reqLoaded.value = true
  } catch (e) {
    reqError.value = e.message || 'โหลดไม่สำเร็จ'
  } finally {
    reqLoading.value = false
  }
}

function fmtTime(iso) {
  if (!iso) return ''
  try {
    const d    = new Date(iso)
    const diff = Date.now() - d
    if (diff < 60000)    return 'เมื่อกี้'
    if (diff < 3600000)  return Math.floor(diff / 60000) + ' นาทีที่แล้ว'
    if (diff < 86400000) return Math.floor(diff / 3600000) + ' ชั่วโมงที่แล้ว'
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}

</script>

<style scoped>
@import './admin.css';

/* ── Tabs ── */
.mav-tabs {
  display: flex; gap: 4px;
  background: #F3F4F6; border-radius: 12px; padding: 4px;
  margin-bottom: 12px;
}
.mav-tab {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px 12px; border: none; border-radius: 9px;
  font-size: 13px; font-weight: 700; color: #6B7280;
  background: none; cursor: pointer; transition: all 0.15s;
}
.mav-tab.active { background: white; color: #111827; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
.mav-tab-badge {
  font-size: 10px; font-weight: 800; min-width: 18px; height: 18px;
  display: inline-flex; align-items: center; justify-content: center;
  background: #E5E7EB; color: #374151; border-radius: 9px; padding: 0 5px;
}
.mav-tab-badge-green { background: #DCFCE7; color: #15803D; }

/* ── Request items ── */
.mav-req-item {
  padding: 12px 14px; border-bottom: 1px solid #F3F4F6;
}
.mav-req-item:last-child { border-bottom: none; }
.mav-req-unread { background: #F0FDF4; }

.mav-req-to {
  display: flex; align-items: center; gap: 6px; margin-bottom: 6px;
}
.mav-req-label { font-size: 10px; color: #9CA3AF; font-weight: 700; }
.mav-req-name  { font-size: 13px; font-weight: 800; color: #111827; }
.mav-req-id    { font-size: 10px; color: #9CA3AF; font-family: monospace; }
.mav-req-new   {
  font-size: 10px; font-weight: 800; color: #15803D;
  background: #DCFCE7; padding: 1px 6px; border-radius: 10px;
  margin-left: auto;
}
.mav-req-msg  { font-size: 13px; color: #374151; line-height: 1.5; margin-bottom: 4px; }
.mav-req-time { font-size: 10px; color: #9CA3AF; }

/* ── Employee autocomplete ── */
.mav-drop {
  position: absolute; left: 0; right: 0; top: 100%;
  background: white; border: 1.5px solid #E5E7EB;
  border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  z-index: 50; overflow: hidden; margin-top: 2px;
}
.mav-drop-item {
  display: flex; align-items: center; gap: 8px;
  width: 100%; padding: 9px 14px;
  background: none; border: none; border-bottom: 1px solid #F3F4F6;
  text-align: left; cursor: pointer; transition: background 0.1s;
}
.mav-drop-item:last-child { border-bottom: none; }
.mav-drop-item:hover { background: #F0FDF4; }
.mav-drop-name { font-size: 13px; font-weight: 700; color: #111827; }
.mav-drop-role { font-size: 11px; color: #9CA3AF; margin-left: auto; }

.mav-picked {
  display: flex; align-items: center; gap: 6px;
  margin-top: 6px; font-size: 11px; color: #15803D; font-weight: 600;
}
.mav-clear {
  background: none; border: none; color: #9CA3AF;
  font-size: 13px; cursor: pointer; padding: 0; line-height: 1;
}
.mav-clear:hover { color: #EF4444; }
</style>
