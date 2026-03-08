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
        <h2 class="al-page-title">👥 พนักงาน & วันเกิด</h2>
        <button class="al-btn al-btn-primary" @click="openAdd">+ เพิ่ม</button>
      </div>

      <div class="al-card">
        <div class="al-card-header">
          <span class="al-card-title">รายชื่อพนักงาน</span>
          <span class="al-badge al-badge-blue">{{ empRows.length }} คน</span>
        </div>

        <div v-if="loading" class="al-loading">⏳ กำลังโหลด...</div>
        <div v-else-if="!empRows.length" class="al-empty">📭 ไม่มีข้อมูล</div>

        <div v-else>
          <div class="al-item" v-for="r in empRows" :key="r.id">
            <div class="al-item-avatar" :style="!r.imgUrl ? `background:${r.grad||'#EEF2FF'}` : ''">
              <img v-if="r.imgUrl" :src="r.imgUrl" />
              <span v-else style="font-size:20px;">👤</span>
            </div>
            <div class="al-item-body">
              <div class="al-item-title">{{ r.name }}</div>
              <div class="al-item-sub">{{ r.empCode || '—' }} · {{ r.role }}</div>
              <div class="al-item-meta">
                <span v-if="r.dept" style="color:#6B7280;">{{ r.dept }}</span>
                <span v-if="bdayOf(r.id)">🎂 {{ bdayOf(r.id) }}</span>
                <span class="al-badge" :class="isTrue(r.inTeam) ? 'al-badge-yes' : 'al-badge-no'">
                  {{ isTrue(r.inTeam) ? '✓ Team' : 'ไม่อยู่ใน Team' }}
                </span>
              </div>
            </div>
            <div class="al-item-actions">
              <button class="al-btn al-btn-edit" @click="openEdit(r)">แก้ไข</button>
              <button class="al-btn al-btn-delete" @click="confirmDelete(r)">ลบ</button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- ── Employee Edit/Add Modal ── -->
    <div v-if="modal.open" class="al-modal-overlay" @click.self="modal.open=false">
      <div class="al-modal amg-modal-scroll">
        <div class="al-modal-handle"></div>
        <div class="al-modal-title">{{ modal.mode === 'add' ? '+ เพิ่มพนักงาน' : '✏️ แก้ไขพนักงาน' }}</div>

        <!-- Image upload -->
        <div class="amg-img-upload-row">
          <div class="amg-img-preview" :style="!imgPreview ? `background:${form.grad||'#EEF2FF'}` : ''">
            <img v-if="imgPreview" :src="imgPreview" />
            <span v-else style="font-size:28px;">👤</span>
          </div>
          <div>
            <label class="amg-pick-btn" for="empImgInput">📷 เลือกรูปภาพ</label>
            <input id="empImgInput" type="file" accept="image/*" style="display:none" @change="pickImage" />
            <div style="font-size:11px;color:#9CA3AF;margin-top:5px;">อัปโหลดลง Google Drive อัตโนมัติ</div>
            <div v-if="imgUploading" class="amg-upload-status">⏳ กำลังอัปโหลด...</div>
            <div v-else-if="imgUploadDone" class="amg-upload-status amg-upload-ok">✅ อัปโหลดสำเร็จ</div>
          </div>
        </div>

        <!-- Employee fields -->
        <div class="amg-section-label">ข้อมูลพนักงาน</div>

        <div class="al-form-2col">
          <div class="al-form-row">
            <label class="al-form-label">รหัสพนักงาน</label>
            <input v-model="form.empCode" class="al-form-input" placeholder="DS001" />
          </div>
          <div class="al-form-row">
            <label class="al-form-label">ชื่อ *</label>
            <input v-model="form.name" class="al-form-input" placeholder="ชื่อพนักงาน" />
          </div>
        </div>

        <div class="al-form-2col">
          <div class="al-form-row">
            <label class="al-form-label">Role</label>
            <input v-model="form.role" class="al-form-input" placeholder="ตำแหน่ง" />
          </div>
          <div class="al-form-row">
            <label class="al-form-label">Dept</label>
            <input v-model="form.dept" class="al-form-input" placeholder="แผนก" />
          </div>
        </div>

        <div class="al-form-2col">
          <div class="al-form-row">
            <label class="al-form-label">inTeam</label>
            <select v-model="form.inTeam" class="al-form-select">
              <option value="true">✓ Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div class="al-form-row">
            <label class="al-form-label">inStarGang</label>
            <select v-model="form.inStarGang" class="al-form-select">
              <option value="true">✓ Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        </div>

        <div class="al-form-2col">
          <div class="al-form-row">
            <label class="al-form-label">StarGang Name</label>
            <input v-model="form.starGangName" class="al-form-input" placeholder="ชื่อกลุ่ม" />
          </div>
          <div class="al-form-row">
            <label class="al-form-label">StarGang Role</label>
            <input v-model="form.starGangRole" class="al-form-input" placeholder="บทบาท" />
          </div>
        </div>

        <!-- Birthday section -->
        <div class="amg-section-label">🎂 ข้อมูลวันเกิด</div>

        <div class="al-form-row">
          <label class="al-form-label">วันที่เกิด</label>
          <div style="display:flex;gap:8px;">
            <input v-model="bdayDay" type="number" min="1" max="31" class="al-form-input"
                   style="width:80px;text-align:center;" placeholder="วัน" />
            <select v-model="bdayForm.monthIdx" class="al-form-select">
              <option value="">— เดือน —</option>
              <option v-for="(m, i) in MONTHS" :key="i" :value="String(i)">{{ m }}</option>
            </select>
          </div>
          <div v-if="bdayDay && bdayForm.monthIdx !== ''" style="font-size:11px;color:#6B7280;margin-top:4px;">
            🎂 {{ bdayDay }} {{ MONTHS[Number(bdayForm.monthIdx)] }}
          </div>
        </div>
        <div class="al-form-row">
          <label class="al-form-label">Fallback Index</label>
          <input v-model="bdayForm.fallbackIdx" class="al-form-input" type="number" min="0" style="max-width:100px;" />
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
        <p style="font-size:13px;color:#374151;margin:0 0 8px;">
          ลบพนักงาน "<strong>{{ delTarget.name }}</strong>" ใช่หรือไม่?
        </p>
        <p style="font-size:12px;color:#DC2626;margin:0 0 16px;">⚠️ การกระทำนี้ไม่สามารถย้อนกลับได้</p>
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '../../stores/admin.js'
import * as svc from '../../services/adminService.js'

const admin  = useAdminStore()
const router = useRouter()

const MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
function isTrue(v) { return v === true || v === 'true' || v === 'TRUE' }

function parseBdayDate(dateStr) {
  if (!dateStr) return { day: '', monthIdx: '' }
  const m = dateStr.match(/(\d+)\s*([\u0E00-\u0E7F.]+)/)
  if (!m) return { day: '', monthIdx: '' }
  const idx = MONTHS.indexOf(m[2])
  return { day: m[1], monthIdx: idx >= 0 ? String(idx) : '' }
}

async function resizeToBase64(file, maxPx = 400, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      let w = img.width, h = img.height
      if (w > maxPx || h > maxPx) {
        if (w > h) { h = Math.round(h * maxPx / w); w = maxPx }
        else       { w = Math.round(w * maxPx / h); h = maxPx }
      }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('load failed')) }
    img.src = url
  })
}

const empRows   = ref([])
const bdayRows  = ref([])
const loading   = ref(true)
const modal     = reactive({ open: false, mode: 'add', saving: false, error: '' })

const form = reactive({
  id:'', empCode:'', name:'', role:'', dept:'', grad:'',
  inTeam:'true', inStarGang:'false', starGangName:'', starGangRole:'',
  imgUrl:'', imgId:'',
})

const bdayForm = reactive({ _key:'', monthIdx:'', fallbackIdx:'0', date:'' })
const bdayDay  = ref('')

const imgPreview    = ref('')
const imgPending    = ref('')
const imgUploading  = ref(false)
const imgUploadDone = ref(false)

const delTarget = ref(null)
const deleting  = ref(false)

const EMP_SEED = [
  { id:'1', empCode:'DS001', name:'นก', role:'Marketing Manager', dept:'Marketing', imgUrl:'', grad:'', inTeam:'true', inStarGang:'true', starGangName:'', starGangRole:'' },
  { id:'2', empCode:'DS002', name:'น้ำส้ม', role:'Graphic Designer', dept:'Creative', imgUrl:'', grad:'', inTeam:'true', inStarGang:'false', starGangName:'', starGangRole:'' },
  { id:'3', empCode:'DS003', name:'วุฒิ', role:'Developer', dept:'Tech', imgUrl:'', grad:'', inTeam:'true', inStarGang:'false', starGangName:'', starGangRole:'' },
]
const BDAY_SEED = [
  { key:'bday_1', employeeId:'1', name:'นก', role:'Marketing Manager', date:'14 ก.พ.', monthIdx:'1', fallbackIdx:'0', imgUrl:'' },
  { key:'bday_2', employeeId:'2', name:'น้ำส้ม', role:'Graphic Designer', date:'3 เม.ย.', monthIdx:'3', fallbackIdx:'1', imgUrl:'' },
]

onMounted(async () => {
  const [empRes, bdayRes] = await Promise.allSettled([
    svc.getEmployees(),
    svc.getBirthdays(),
  ])
  empRows.value  = empRes.status  === 'fulfilled' && empRes.value.length  ? empRes.value  : EMP_SEED
  bdayRows.value = bdayRes.status === 'fulfilled' && bdayRes.value.length ? bdayRes.value : BDAY_SEED
  loading.value  = false
})

function bdayOf(empId) {
  const b = bdayRows.value.find(b => String(b.employeeId) === String(empId))
  return b ? b.date : ''
}

function openAdd() {
  Object.assign(form, { id:'', empCode:'', name:'', role:'', dept:'', grad:'', inTeam:'true', inStarGang:'false', starGangName:'', starGangRole:'', imgUrl:'', imgId:'' })
  Object.assign(bdayForm, { _key:'', monthIdx:'', fallbackIdx:'0', date:'' })
  bdayDay.value = ''; imgPreview.value = ''; imgPending.value = ''
  imgUploadDone.value = false
  modal.mode = 'add'; modal.error = ''; modal.open = true
}

function openEdit(r) {
  Object.assign(form, {
    ...r,
    empCode: r.empCode || '',
    inTeam: String(r.inTeam),
    inStarGang: String(r.inStarGang),
    imgUrl: r.imgUrl || '',
    imgId:  r.imgId  || '',
  })
  imgPreview.value = r.imgUrl || ''
  imgPending.value = ''
  imgUploadDone.value = false

  const bday = bdayRows.value.find(b => String(b.employeeId) === String(r.id))
  if (bday) {
    const { day, monthIdx } = parseBdayDate(bday.date)
    Object.assign(bdayForm, { _key: bday.key, monthIdx, fallbackIdx: String(bday.fallbackIdx), date: bday.date })
    bdayDay.value = day
  } else {
    Object.assign(bdayForm, { _key:'', monthIdx:'', fallbackIdx:'0', date:'' })
    bdayDay.value = ''
  }

  modal.mode = 'edit'; modal.error = ''; modal.open = true
}

async function pickImage(e) {
  const file = e.target.files?.[0]
  if (!file) return
  e.target.value = ''
  try {
    const b64 = await resizeToBase64(file, 400, 0.75)
    imgPreview.value = b64
    imgPending.value = b64
    imgUploadDone.value = false
  } catch {
    modal.error = 'ไม่สามารถโหลดรูปได้'
  }
}

async function doSave() {
  if (!form.name.trim()) { modal.error = 'กรุณากรอกชื่อ'; return }
  modal.saving = true; modal.error = ''

  if (bdayDay.value && bdayForm.monthIdx !== '') {
    bdayForm.date = `${bdayDay.value} ${MONTHS[Number(bdayForm.monthIdx)]}`
  }

  try {
    let empId = form.id

    if (modal.mode === 'add') {
      const res = await svc.addEmployee({
        empCode: form.empCode,
        name: form.name, role: form.role, dept: form.dept, grad: form.grad,
        inTeam: form.inTeam, inStarGang: form.inStarGang,
        starGangName: form.starGangName, starGangRole: form.starGangRole,
      })
      empId = res?.id || String(Date.now())

      let imgUrl = '', imgId = ''
      if (imgPending.value) {
        ;({ imgUrl, imgId } = await _uploadImage(empId))
      }
      empRows.value.push({ ...form, id: empId, imgUrl, imgId })

      if (bdayForm.date) {
        const bRes = await svc.addBirthday({
          employeeId: empId, name: form.name, role: form.role,
          date: bdayForm.date, monthIdx: bdayForm.monthIdx, fallbackIdx: bdayForm.fallbackIdx,
        })
        bdayRows.value.push({ key: bRes?.key || 'bday_' + Date.now(), employeeId: empId, name: form.name, role: form.role, ...bdayForm })
      }
    } else {
      await svc.updateRow('Employees', 'id', empId, {
        empCode: form.empCode,
        name: form.name, role: form.role, dept: form.dept, grad: form.grad,
        inTeam: form.inTeam, inStarGang: form.inStarGang,
        starGangName: form.starGangName, starGangRole: form.starGangRole,
      })

      let imgUrl = form.imgUrl, imgId = form.imgId
      if (imgPending.value) {
        ;({ imgUrl, imgId } = await _uploadImage(empId))
      }

      const idx = empRows.value.findIndex(r => r.id === empId)
      if (idx >= 0) Object.assign(empRows.value[idx], form, { imgUrl, imgId })

      if (bdayForm._key) {
        await svc.updateRow('Birthdays', 'key', bdayForm._key, {
          name: form.name, role: form.role,
          date: bdayForm.date, monthIdx: bdayForm.monthIdx, fallbackIdx: bdayForm.fallbackIdx,
        })
        const bi = bdayRows.value.findIndex(b => b.key === bdayForm._key)
        if (bi >= 0) Object.assign(bdayRows.value[bi], { name: form.name, role: form.role, ...bdayForm })
      } else if (bdayForm.date) {
        const bRes = await svc.addBirthday({
          employeeId: empId, name: form.name, role: form.role,
          date: bdayForm.date, monthIdx: bdayForm.monthIdx, fallbackIdx: bdayForm.fallbackIdx,
        })
        bdayRows.value.push({ key: bRes?.key || 'bday_' + Date.now(), employeeId: empId, name: form.name, role: form.role, ...bdayForm })
      }
    }

    modal.open = false
  } catch (e) {
    modal.error = e.message || 'เกิดข้อผิดพลาด'
  } finally {
    modal.saving = false
  }
}

async function _uploadImage(empId) {
  imgUploading.value = true
  const localB64 = imgPending.value
  try {
    const res = await svc.uploadProfileImage(empId, imgPending.value, form.name + '_profile.jpg')
    imgUploadDone.value = true
    imgPending.value = ''
    return { imgUrl: localB64, imgId: res?.id || '' }
  } finally {
    imgUploading.value = false
  }
}

function confirmDelete(r) { delTarget.value = r }
async function doDelete() {
  deleting.value = true
  try {
    await svc.deleteRow('Employees', 'id', delTarget.value.id)
    empRows.value = empRows.value.filter(r => r.id !== delTarget.value.id)
    delTarget.value = null
  } catch { } finally { deleting.value = false }
}

function doLogout() { admin.logout(); router.push('/admin/login') }
</script>

<style scoped>
@import './admin.css';
</style>
