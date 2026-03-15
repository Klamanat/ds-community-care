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
          <span class="al-card-title">พนักงานทั้งหมด ({{ rows.length }})</span>
          <span style="font-size:12px;color:#6B7280;">มีวันเกิด {{ birthdayCount }} คน</span>
        </div>

        <div v-if="loading" class="al-loading">กำลังโหลด...</div>
        <div v-else-if="rows.length === 0" class="al-empty">ไม่มีข้อมูลพนักงาน</div>
        <div v-else class="al-table-wrap">
          <table class="al-table">
            <thead>
              <tr>
                <th>ชื่อ</th>
                <th>Role</th>
                <th>วันเกิด</th>
                <th>เดือน</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in rows" :key="r.id" :style="r.bdDate ? '' : 'opacity:0.55'">
                <td style="font-weight:700;">{{ r.name }}</td>
                <td>{{ r.role }}</td>
                <td>{{ r.bdDate || '—' }}</td>
                <td>{{ r.bdDate ? monthName(monthFromDate(r.bdDate, r.monthIdx)) : '—' }}</td>
                <td style="display:flex;gap:6px;">
                  <button class="al-btn al-btn-edit" @click="openEdit(r)">{{ r.bdDate ? 'แก้ไข' : 'ตั้งค่า' }}</button>
                  <button v-if="r.bdDate" class="al-btn al-btn-delete" @click="confirmDelete(r)">ลบ</button>
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
        <div class="al-modal-title">✏️ {{ form.bdDate ? 'แก้ไข' : 'ตั้งค่า' }}วันเกิด — {{ form.name }}</div>

        <div class="al-form-row">
          <label class="al-form-label">วันเกิด</label>
          <input v-model="dateInput" type="date" class="al-form-input" @change="onDateChange" />
          <div v-if="dateInput" style="font-size:11px;color:#6B7280;margin-top:4px;">{{ isoToThaiShort(dateInput) }}</div>
        </div>
        <div class="al-form-row">
          <label class="al-form-label">เดือน (ปรับอัตโนมัติเมื่อเลือกวันเกิด)</label>
          <select v-model="form.monthIdx" class="al-form-select">
            <option v-for="(m,i) in MONTHS" :key="i" :value="String(i)">{{ m }}</option>
          </select>
        </div>
        <div class="al-form-row">
          <label class="al-form-label">Fallback Index (avatar fallback)</label>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '../../stores/admin.js'
import * as svc from '../../services/adminService.js'

const admin  = useAdminStore()
const router = useRouter()

const MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
function monthName(idx) { return MONTHS[Number(idx)] ?? '—' }

/** Derive 0-based month from bdDate string ("14 ก.ค." → 6) or fall back to stored monthIdx */
function monthFromDate(bdDate, monthIdx) {
  if (bdDate) {
    for (let i = 0; i < MONTHS.length; i++) {
      if (String(bdDate).indexOf(MONTHS[i]) >= 0) return i
    }
  }
  const m = parseInt(monthIdx, 10)
  return isNaN(m) ? null : m
}

const rows    = ref([])
const loading = ref(true)

const birthdayCount = computed(() => rows.value.filter(r => r.bdDate).length)

const modal     = reactive({ open: false, saving: false, error: '' })
const form      = reactive({ id:'', name:'', bdDate:'', monthIdx:'0', fallbackIdx:'0' })
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
  const mi = MONTHS.indexOf(m[2])
  if (mi < 0) return ''
  const year = new Date().getFullYear()
  return `${year}-${String(mi + 1).padStart(2,'0')}-${String(parseInt(m[1])).padStart(2,'0')}`
}

function onDateChange() {
  if (!dateInput.value) return
  const d = new Date(dateInput.value + 'T00:00:00')
  form.monthIdx = String(d.getMonth())  // 0-based
}

const delTarget = ref(null)
const deleting  = ref(false)

onMounted(async () => {
  try {
    // Load all employees — admin can set birthday for any employee
    const data = await svc.getEmployees()
    rows.value = (data || []).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'th'))
  } catch {
    rows.value = []
  } finally {
    loading.value = false
  }
})

function openEdit(r) {
  form.id         = r.id || r.key || ''
  form.name       = r.name || ''
  form.bdDate     = r.bdDate || ''
  form.monthIdx   = String(monthFromDate(r.bdDate, r.monthIdx) ?? 0)
  form.fallbackIdx = String(r.fallbackIdx || '0')
  dateInput.value = thaiShortToIso(r.bdDate)
  modal.error = ''; modal.open = true
}

async function saveModal() {
  if (!dateInput.value && !form.bdDate) { modal.error = 'กรุณาเลือกวันเกิด'; return }
  const bdDate = isoToThaiShort(dateInput.value) || form.bdDate
  modal.saving = true; modal.error = ''
  try {
    await svc.updateRow('Employees', 'id', form.id, {
      monthIdx: form.monthIdx, bdDate, fallbackIdx: form.fallbackIdx
    })
    const idx = rows.value.findIndex(r => (r.id || r.key) === form.id)
    if (idx >= 0) {
      rows.value[idx] = { ...rows.value[idx], bdDate, monthIdx: form.monthIdx, fallbackIdx: form.fallbackIdx }
    }
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
    await svc.updateRow('Employees', 'id', delTarget.value.id || delTarget.value.key, {
      monthIdx: '', bdDate: '', fallbackIdx: ''
    })
    const idx = rows.value.findIndex(r => (r.id || r.key) === (delTarget.value.id || delTarget.value.key))
    if (idx >= 0) rows.value[idx] = { ...rows.value[idx], bdDate: '', monthIdx: '', fallbackIdx: '' }
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
