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
      <h2 class="al-page-title">📅 จัดการกิจกรรมรายเดือน</h2>

      <!-- Month filter -->
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">
        <button
          v-for="m in MONTHS" :key="m.idx"
          class="al-btn"
          :style="filterMonth === m.idx ? 'background:#6366F1;color:white;' : 'background:#F3F4F6;color:#374151;'"
          @click="filterMonth = m.idx"
        >{{ m.short }}</button>
        <button
          class="al-btn"
          :style="filterMonth === 0 ? 'background:#6366F1;color:white;' : 'background:#F3F4F6;color:#374151;'"
          @click="filterMonth = 0"
        >ทั้งหมด</button>
      </div>

      <div class="al-card">
        <div class="al-card-header">
          <span class="al-card-title">กิจกรรม ({{ filtered.length }})</span>
          <button class="al-btn al-btn-primary" @click="openAdd">+ เพิ่มกิจกรรม</button>
        </div>

        <div v-if="loading" class="al-loading">กำลังโหลด...</div>
        <div v-else-if="filtered.length === 0" class="al-empty">ไม่มีกิจกรรม</div>
        <div v-else class="al-table-wrap">
          <table class="al-table">
            <thead>
              <tr>
                <th>เดือน</th>
                <th>รูป</th>
                <th>กิจกรรม</th>
                <th>วันที่</th>
                <th>สถานที่</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in filtered" :key="r.id">
                <td style="white-space:nowrap;">
                  <span class="al-badge al-badge-pending">{{ monthName(r.monthIdx) }}</span>
                </td>
                <td>
                  <img v-if="r.imgUrl" :src="r.imgUrl" class="act-thumb" />
                  <span v-else style="font-size:18px;opacity:0.3;">🖼️</span>
                </td>
                <td style="font-weight:700;">{{ r.emoji }} {{ r.name }}</td>
                <td style="font-size:12px;white-space:nowrap;">{{ r.date }}</td>
                <td style="font-size:12px;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ r.loc }}</td>
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

    <!-- Add/Edit Modal -->
    <div v-if="modal.open" class="al-modal-overlay" @click.self="modal.open=false">
      <div class="al-modal" style="max-width:520px;">
        <div class="al-modal-title">{{ modal.mode === 'add' ? '+ เพิ่มกิจกรรม' : '✏️ แก้ไขกิจกรรม' }}</div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div class="al-form-row">
            <label class="al-form-label">เดือน *</label>
            <select v-model="form.monthIdx" class="al-form-select">
              <option v-for="m in MONTHS" :key="m.idx" :value="String(m.idx)">{{ m.idx }}. {{ m.name }}</option>
            </select>
          </div>
          <div class="al-form-row">
            <label class="al-form-label">Emoji</label>
            <input v-model="form.emoji" class="al-form-input" placeholder="🎉" maxlength="4" />
          </div>
        </div>

        <div class="al-form-row">
          <label class="al-form-label">ชื่อกิจกรรม *</label>
          <input v-model="form.name" class="al-form-input" placeholder="ชื่อกิจกรรม" />
        </div>
        <div class="al-form-row">
          <label class="al-form-label">วันที่</label>
          <input v-model="dateInput" type="date" class="al-form-input" />
          <div v-if="dateInput" style="font-size:11px;color:#6B7280;margin-top:4px;">{{ isoToThai(dateInput) }}</div>
        </div>
        <div class="al-form-row">
          <label class="al-form-label">สถานที่</label>
          <input v-model="form.loc" class="al-form-input" placeholder="ห้อง / Online" />
        </div>
        <div class="al-form-row">
          <label class="al-form-label">รายละเอียด</label>
          <textarea v-model="form.desc" class="al-form-textarea" placeholder="รายละเอียดกิจกรรม"></textarea>
        </div>
        <div class="al-form-row">
          <label class="al-form-label">ขั้นตอนกิจกรรม (แต่ละขั้นขึ้นบรรทัดใหม่)</label>
          <textarea v-model="form.steps" class="al-form-textarea" rows="5" placeholder="1. ลงทะเบียน&#10;2. รับเอกสาร&#10;3. เข้าร่วมกิจกรรม"></textarea>
        </div>
        <div class="al-form-row">
          <label class="al-form-label">Join URL (ถ้ามี)</label>
          <input v-model="form.joinUrl" class="al-form-input" placeholder="https://..." />
        </div>

        <!-- Image upload -->
        <div class="al-form-row">
          <label class="al-form-label">รูป Header (ถ้ามี)</label>
          <div class="act-upload-zone" :style="imgUploading?'opacity:.6;cursor:default;':''" @click="!imgUploading && imgFileInput.click()">
            <img v-if="imgPreview && !imgUploading" :src="imgPreview" class="act-upload-preview" />
            <div v-else-if="imgUploading" class="act-upload-placeholder">
              <span style="font-size:22px;">⏳</span>
              <span style="font-size:12px;color:#6B7280;margin-top:4px;">กำลังอัปโหลดไป Google Drive...</span>
            </div>
            <div v-else class="act-upload-placeholder">
              <span style="font-size:28px;">🖼️</span>
              <span style="font-size:12px;color:#9CA3AF;margin-top:4px;">คลิกเพื่ออัปโหลด → Google Drive</span>
            </div>
          </div>
          <button v-if="imgPreview && !imgUploading" class="al-btn" style="background:#FEE2E2;color:#DC2626;margin-top:6px;width:100%;" @click.stop="clearImg">🗑️ ลบรูป</button>
          <input ref="imgFileInput" type="file" accept="image/*" style="display:none" @change="onImgChange" />
        </div>

        <div v-if="modal.error" style="color:#DC2626;font-size:12px;margin-bottom:10px;">{{ modal.error }}</div>

        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px;">
          <button class="al-btn" style="background:#F3F4F6;color:#374151;" @click="modal.open=false">ยกเลิก</button>
          <button class="al-btn al-btn-save" :disabled="modal.saving || imgUploading" @click="saveModal">
            {{ modal.saving ? 'กำลังบันทึก...' : imgUploading ? 'รอรูปอัปโหลด...' : 'บันทึก' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirm -->
    <div v-if="delTarget" class="al-modal-overlay" @click.self="delTarget=null">
      <div class="al-modal" style="max-width:360px;">
        <div class="al-modal-title">🗑️ ยืนยันการลบ</div>
        <p style="font-size:13px;color:#374151;margin:0 0 16px;">
          ลบกิจกรรม "<strong>{{ delTarget.name }}</strong>" ใช่หรือไม่?
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
import { useActivitiesStore } from '../../stores/activities.js'
import * as svc from '../../services/activitiesService.js'
import { resizeToBase64 } from '../../composables/useImageCompress.js'

const admin  = useAdminStore()
const router = useRouter()
const acts   = useActivitiesStore()

const loading     = ref(true)
const filterMonth = ref(0)
const modal  = reactive({ open: false, mode: 'add', saving: false, error: '' })
const form   = reactive({ id:'', monthIdx:'1', name:'', emoji:'🎉', date:'', loc:'', desc:'', steps:'', joinUrl:'', imgUrl:'', imgId:'' })
const delTarget = ref(null)
const deleting  = ref(false)

// Date helpers
const THAI_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
const dateInput = ref('')

function isoToThai(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  if (isNaN(d)) return iso
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`
}

function thaiToIso(thai) {
  if (!thai) return ''
  const m = thai.match(/(\d+)\s*([\u0E00-\u0E7F.]+)\s*(\d{4})?/)
  if (!m) return ''
  const monthIdx = THAI_MONTHS.indexOf(m[2])
  if (monthIdx < 0) return ''
  const year = m[3] ? parseInt(m[3]) - 543 : new Date().getFullYear()
  return `${year}-${String(monthIdx + 1).padStart(2,'0')}-${String(parseInt(m[1])).padStart(2,'0')}`
}

// Image upload
const imgFileInput = ref(null)
const imgPreview   = ref('')
const imgUploading = ref(false)

async function onImgChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  imgUploading.value = true
  modal.error = ''
  try {
    // Resize for local preview + Drive upload
    const b64 = await resizeToBase64(file, 1200, 600, 0.88)
    imgPreview.value = b64               // แสดง preview ทันที

    // Upload to Drive → Profiles subfolder
    const res = await svc.uploadImage(b64, file.name, 'activities')
    form.imgId  = res.data.id            // เก็บ Drive file ID
    form.imgUrl = ''                     // Drive เป็น source of truth แล้ว
  } catch (err) {
    modal.error = 'อัปโหลดรูปล้มเหลว: ' + (err.message || 'ลองใหม่อีกครั้ง')
    imgPreview.value = ''
  } finally {
    imgUploading.value = false
    e.target.value = ''
  }
}

function clearImg() {
  form.imgUrl  = ''
  form.imgId   = ''
  imgPreview.value = ''
}

const MONTHS = [
  { idx:1,  name:'January',   short:'ม.ค.' },
  { idx:2,  name:'February',  short:'ก.พ.' },
  { idx:3,  name:'March',     short:'มี.ค.' },
  { idx:4,  name:'April',     short:'เม.ย.' },
  { idx:5,  name:'May',       short:'พ.ค.' },
  { idx:6,  name:'June',      short:'มิ.ย.' },
  { idx:7,  name:'July',      short:'ก.ค.' },
  { idx:8,  name:'August',    short:'ส.ค.' },
  { idx:9,  name:'September', short:'ก.ย.' },
  { idx:10, name:'October',   short:'ต.ค.' },
  { idx:11, name:'November',  short:'พ.ย.' },
  { idx:12, name:'December',  short:'ธ.ค.' },
]

function monthName(idx) {
  const m = MONTHS.find(m => String(m.idx) === String(idx))
  return m ? m.short : idx
}

const filtered = computed(() =>
  filterMonth.value === 0
    ? acts.all
    : acts.all.filter(a => String(a.monthIdx) === String(filterMonth.value))
)

onMounted(async () => {
  await acts.load(true)
  loading.value = false
})

function openAdd() {
  Object.assign(form, { id:'', monthIdx:'1', name:'', emoji:'🎉', date:'', loc:'', desc:'', steps:'', joinUrl:'', imgUrl:'', imgId:'' })
  dateInput.value = ''
  imgPreview.value = ''
  imgUploading.value = false
  modal.mode = 'add'; modal.error = ''; modal.open = true
}

function openEdit(r) {
  Object.assign(form, { ...r, monthIdx: String(r.monthIdx) })
  form.imgId = r.imgId || ''
  // ถ้ามี imgId → imgUrl คือ base64 ที่ GAS inline มา ใช้แค่ preview ไม่ส่งกลับ Sheets
  if (form.imgId) form.imgUrl = ''
  dateInput.value = thaiToIso(r.date)
  imgPreview.value = r.imgUrl || ''
  imgUploading.value = false
  modal.mode = 'edit'; modal.error = ''; modal.open = true
}

async function saveModal() {
  if (!form.name.trim()) { modal.error = 'กรุณากรอกชื่อกิจกรรม'; return }
  form.date = isoToThai(dateInput.value)
  modal.saving = true; modal.error = ''
  try {
    if (modal.mode === 'add') {
      const res = await svc.addActivity({ ...form })
      acts.localAdd({ ...form, id: res.data?.id || Date.now().toString() })
    } else {
      await svc.updateActivity(form.id, { ...form })
      acts.localUpdate(form.id, { ...form })
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
    await svc.deleteActivity(delTarget.value.id)
    acts.localDelete(delTarget.value.id)
    delTarget.value = null
  } catch { } finally {
    deleting.value = false
  }
}

function doLogout() { admin.logout(); router.push('/admin/login') }
</script>

<style scoped>
@import './admin.css';

.act-thumb {
  width: 48px;
  height: 28px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #E5E7EB;
}

.act-upload-zone {
  border: 2px dashed #D1D5DB;
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s;
}
.act-upload-zone:hover { border-color: #6366F1; }

.act-upload-preview {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  display: block;
}

.act-upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 24px;
}
</style>
