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
      <h2 class="al-page-title">🎂 จัดการวันเกิด</h2>

      <div class="al-card">
        <div class="al-card-header">
          <span class="al-card-title">รายการวันเกิด ({{ rows.length }})</span>
        </div>

        <div v-if="loading" class="al-loading">กำลังโหลด...</div>
        <div v-else-if="rows.length === 0" class="al-empty">ไม่มีข้อมูล</div>
        <div v-else class="al-table-wrap">
          <table class="al-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>ชื่อ</th>
                <th>Role</th>
                <th>วันเกิด</th>
                <th>เดือน</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in rows" :key="r.key">
                <td style="color:#9CA3AF;font-size:11px;">{{ r.key }}</td>
                <td style="font-weight:700;">{{ r.name }}</td>
                <td>{{ r.role }}</td>
                <td>{{ r.date }}</td>
                <td>{{ monthName(r.monthIdx) }}</td>
                <td style="display:flex;gap:6px;">
                  <button class="al-btn al-btn-edit" @click="openEdit(r)">แก้ไข</button>
                  <button class="al-btn al-btn-delete" @click="confirmDelete(r)">ลบ</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <!-- Edit Modal -->
    <div v-if="modal.open" class="al-modal-overlay" @click.self="modal.open=false">
      <div class="al-modal">
        <div class="al-modal-title">✏️ แก้ไขวันเกิด</div>

        <div class="al-form-row">
          <label class="al-form-label">ชื่อ *</label>
          <input v-model="form.name" class="al-form-input" placeholder="ชื่อพนักงาน" />
        </div>
        <div class="al-form-row">
          <label class="al-form-label">Role</label>
          <input v-model="form.role" class="al-form-input" placeholder="ตำแหน่ง" />
        </div>
        <div class="al-form-row">
          <label class="al-form-label">วันเกิด</label>
          <input v-model="dateInput" type="date" class="al-form-input" @change="onDateChange" />
          <div v-if="dateInput" style="font-size:11px;color:#6B7280;margin-top:4px;">{{ isoToThaiShort(dateInput) }}</div>
        </div>
        <div class="al-form-row">
          <label class="al-form-label">เดือน</label>
          <select v-model="form.monthIdx" class="al-form-select">
            <option v-for="(m,i) in MONTHS" :key="i" :value="String(i)">{{ m }}</option>
          </select>
        </div>
        <div class="al-form-row">
          <label class="al-form-label">Fallback Index</label>
          <input v-model="form.fallbackIdx" class="al-form-input" type="number" min="0" />
        </div>

        <div v-if="modal.error" style="color:#DC2626;font-size:12px;margin-bottom:10px;">{{ modal.error }}</div>

        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px;">
          <button class="al-btn" style="background:#F3F4F6;color:#374151;" @click="modal.open=false">ยกเลิก</button>
          <button class="al-btn al-btn-save" :disabled="modal.saving" @click="saveModal">
            {{ modal.saving ? 'กำลังบันทึก...' : 'บันทึก' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirm -->
    <div v-if="delTarget" class="al-modal-overlay" @click.self="delTarget=null">
      <div class="al-modal" style="max-width:360px;">
        <div class="al-modal-title">🗑️ ยืนยันการลบ</div>
        <p style="font-size:13px;color:#374151;margin:0 0 16px;">
          ลบข้อมูลวันเกิดของ "<strong>{{ delTarget.name }}</strong>" ใช่หรือไม่?
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '../../stores/admin.js'
import * as svc from '../../services/adminService.js'

const admin  = useAdminStore()
const router = useRouter()

const MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
function monthName(idx) { return MONTHS[Number(idx)] || idx }

const rows    = ref([])
const loading = ref(true)

const modal     = reactive({ open: false, saving: false, error: '' })
const form      = reactive({ key:'', name:'', role:'', date:'', monthIdx:'0', fallbackIdx:'0' })
const dateInput = ref('')

function isoToThaiShort(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  if (isNaN(d)) return iso
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

function thaiShortToIso(thai) {
  if (!thai) return ''
  const m = thai.match(/(\d+)\s*([\u0E00-\u0E7F.]+)/)
  if (!m) return ''
  const monthIdx = MONTHS.indexOf(m[2])
  if (monthIdx < 0) return ''
  const year = new Date().getFullYear()
  return `${year}-${String(monthIdx + 1).padStart(2,'0')}-${String(parseInt(m[1])).padStart(2,'0')}`
}

function onDateChange() {
  if (!dateInput.value) return
  const d = new Date(dateInput.value + 'T00:00:00')
  form.monthIdx = String(d.getMonth())  // 0-based
}

const delTarget = ref(null)
const deleting  = ref(false)

const SEED = [
  { key:'bday_1', name:'นก', role:'Marketing Manager', date:'14 ก.พ.', monthIdx:'1', fallbackIdx:'0' },
  { key:'bday_2', name:'น้ำส้ม', role:'Graphic Designer', date:'3 เม.ย.', monthIdx:'3', fallbackIdx:'1' },
]

onMounted(async () => {
  try {
    const data = await svc.getAll('Birthdays')
    rows.value = data.length ? data : SEED
  } catch {
    rows.value = SEED
  } finally {
    loading.value = false
  }
})

function openEdit(r) {
  Object.assign(form, { ...r, monthIdx: String(r.monthIdx), fallbackIdx: String(r.fallbackIdx) })
  dateInput.value = thaiShortToIso(r.date)
  modal.error = ''; modal.open = true
}

async function saveModal() {
  if (!form.name.trim()) { modal.error = 'กรุณากรอกชื่อ'; return }
  form.date = isoToThaiShort(dateInput.value) || form.date
  modal.saving = true; modal.error = ''
  try {
    await svc.updateRow('Birthdays', 'key', form.key, {
      name: form.name, role: form.role, date: form.date,
      monthIdx: form.monthIdx, fallbackIdx: form.fallbackIdx
    })
    const idx = rows.value.findIndex(r => r.key === form.key)
    if (idx >= 0) Object.assign(rows.value[idx], form)
    modal.open = false
  } catch (e) {
    modal.error = e.message || 'เกิดข้อผิดพลาด'
  } finally {
    modal.saving = false
  }
}

function confirmDelete(r) { delTarget.value = r }
async function doDelete() {
  deleting.value = true
  try {
    await svc.deleteRow('Birthdays', 'key', delTarget.value.key)
    rows.value = rows.value.filter(r => r.key !== delTarget.value.key)
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
