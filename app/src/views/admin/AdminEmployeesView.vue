<template>
  <div>
    <main class="al-main">

      <!-- Toolbar (sticky) -->
      <div class="emp-toolbar emp-toolbar--sticky">
        <input v-model="search" class="emp-search" placeholder="🔍 ค้นหา ชื่อ / รหัส / ตำแหน่ง / แผนก..." />
        <div class="emp-toolbar-right">
          <span class="al-badge al-badge-blue">{{ filteredRows.length }}/{{ empRows.length }}</span>
          <button class="al-btn al-btn-primary" @click="openAdd">+ เพิ่ม</button>
        </div>
      </div>

      <!-- States -->
      <div v-if="loading" class="al-loading">⏳ กำลังโหลด...</div>
      <div v-else-if="!empRows.length" class="al-empty">📭 ไม่มีข้อมูล</div>
      <div v-else-if="!filteredRows.length" class="al-empty">🔍 ไม่พบ "{{ search }}"</div>

      <!-- Employee list — inline editing, multiple rows can expand simultaneously -->
      <div v-else class="emp-list">
        <div
          v-for="r in filteredRows"
          :key="r.id"
          class="emp-card"
          :class="{ 'emp-card--editing': !!editForms[r.id] }"
        >

          <!-- ══ COLLAPSED ROW ══ -->
          <div v-if="!editForms[r.id]" class="emp-row" @click="startEdit(r)">
            <div class="emp-avatar" :style="!r.imgUrl ? `background:${r.grad||'#EEF2FF'}` : ''">
              <img v-if="r.imgUrl" :src="r.imgUrl" />
              <span v-else style="font-size:18px;">👤</span>
            </div>
            <div class="emp-info">
              <div class="emp-name-line">
                <span class="emp-name">{{ r.name }}</span>
                <span v-if="r.empCode" class="emp-code">{{ r.empCode }}</span>
              </div>
              <div class="emp-sub">{{ r.role }}<span v-if="r.dept" style="color:#9CA3AF;"> · {{ r.dept }}</span></div>
              <div class="emp-meta">
                <span class="al-badge" :class="isTrue(r.inTeam) ? 'al-badge-yes' : 'al-badge-no'">
                  {{ isTrue(r.inTeam) ? '✓ Team' : 'No team' }}
                </span>
                <span v-if="r.bdDate" class="emp-bday">🎂 {{ r.bdDate }}</span>
              </div>
            </div>
            <div class="emp-row-act" @click.stop>
              <button class="emp-icon-btn emp-icon-edit" @click="startEdit(r)" title="แก้ไข">✏️</button>
              <button class="emp-icon-btn emp-icon-del"  @click="confirmDelete(r)" title="ลบ">🗑️</button>
            </div>
          </div>

          <!-- ══ INLINE EDIT FORM ══ -->
          <div v-else class="emp-edit">
            <div class="emp-edit-strip"></div>

            <!-- ── Section A: Photo + Name + Code ── -->
            <div class="emp-edit-top">
              <div class="emp-photo-col">
                <div class="emp-edit-avatar">
                  <img v-if="editForms[r.id].imgPreview" :src="editForms[r.id].imgPreview" />
                  <span v-else style="font-size:22px;">👤</span>
                </div>
                <label class="emp-photo-btn" :for="'img_'+r.id">📷</label>
                <input :id="'img_'+r.id" type="file" accept="image/*" style="display:none" @change="e => pickEditImage(e, r.id)" />
                <span v-if="editUploading[r.id]"  style="font-size:10px;color:#9CA3AF;margin-top:2px;">⏳</span>
                <span v-if="editUploadDone[r.id]" style="font-size:10px;color:#059669;margin-top:2px;">✅</span>
              </div>
              <div class="emp-namecode-col">
                <div class="emp-field-label">ชื่อ *</div>
                <input v-model="editForms[r.id].name" class="al-form-input emp-input-name" placeholder="ชื่อพนักงาน" />
                <div class="emp-field-label" style="margin-top:6px;">รหัสพนักงาน</div>
                <input v-model="editForms[r.id].empCode" class="al-form-input" placeholder="DS001" />
              </div>
            </div>

            <!-- ── Section B: Role + Dept ── -->
            <div class="emp-edit-2col">
              <div>
                <div class="emp-field-label">ตำแหน่ง</div>
                <input v-model="editForms[r.id].role" class="al-form-input" placeholder="Role" />
              </div>
              <div>
                <div class="emp-field-label">แผนก</div>
                <input v-model="editForms[r.id].dept" class="al-form-input" placeholder="Dept" />
              </div>
            </div>

            <!-- ── Section C: inTeam toggle + Birthday ── -->
            <div class="emp-edit-2col" style="align-items:flex-start;">
              <div>
                <div class="emp-field-label">อยู่ใน Team</div>
                <div
                  class="emp-toggle"
                  :class="{ on: editForms[r.id].inTeam === 'true' }"
                  @click="editForms[r.id].inTeam = editForms[r.id].inTeam === 'true' ? 'false' : 'true'"
                >
                  <div class="emp-toggle-knob"></div>
                  <span class="emp-toggle-label">{{ editForms[r.id].inTeam === 'true' ? 'อยู่ใน Team' : 'ไม่อยู่' }}</span>
                </div>
              </div>
              <div>
                <div class="emp-field-label">🎂 วันเกิด</div>
                <div style="display:flex;gap:6px;">
                  <input
                    v-model="editForms[r.id].bdayDay"
                    type="number" min="1" max="31"
                    class="al-form-input emp-bday-day"
                    placeholder="วัน"
                  />
                  <select v-model="editForms[r.id].monthIdx" class="al-form-select">
                    <option value="">— เดือน —</option>
                    <option v-for="(m, i) in MONTHS" :key="i" :value="String(i)">{{ m }}</option>
                  </select>
                </div>
                <div v-if="editForms[r.id].bdayDay && editForms[r.id].monthIdx !== ''" class="emp-bday-preview">
                  🎂 {{ editForms[r.id].bdayDay }} {{ MONTHS[Number(editForms[r.id].monthIdx)] }}
                </div>
              </div>
            </div>

            <!-- ── Section D: StarGang (collapsible) ── -->
            <details class="emp-stargng">
              <summary>⭐ StarGang & Slogan</summary>
              <div style="margin-top:10px;">
                <div class="emp-edit-2col">
                  <div>
                    <div class="emp-field-label">StarGang Name</div>
                    <input v-model="editForms[r.id].starGangName" class="al-form-input" placeholder="ชื่อกลุ่ม" />
                  </div>
                  <div>
                    <div class="emp-field-label">StarGang Role</div>
                    <input v-model="editForms[r.id].starGangRole" class="al-form-input" placeholder="บทบาท" />
                  </div>
                </div>
                <div style="margin-top:8px;display:flex;align-items:center;gap:10px;">
                  <div class="emp-field-label" style="margin:0;white-space:nowrap;">อยู่ใน StarGang</div>
                  <div
                    class="emp-toggle emp-toggle-sm"
                    :class="{ on: editForms[r.id].inStarGang === 'true' }"
                    @click="editForms[r.id].inStarGang = editForms[r.id].inStarGang === 'true' ? 'false' : 'true'"
                  >
                    <div class="emp-toggle-knob"></div>
                  </div>
                </div>
                <div style="margin-top:8px;">
                  <div class="emp-field-label">Slogan</div>
                  <input v-model="editForms[r.id].starGangSlogan" class="al-form-input" placeholder="สโลแกน..." maxlength="100" />
                </div>
              </div>
            </details>

            <!-- Error -->
            <div v-if="editErrors[r.id]" class="al-error">⚠️ {{ editErrors[r.id] }}</div>

            <!-- Footer actions -->
            <div class="emp-edit-footer">
              <button class="al-btn al-btn-cancel" @click="cancelEdit(r.id)">ยกเลิก</button>
              <button class="al-btn al-btn-save" :disabled="editSaving[r.id]" @click="saveInlineEdit(r)">
                {{ editSaving[r.id] ? 'กำลังบันทึก...' : '✅ บันทึก' }}
              </button>
            </div>
          </div>

        </div>
      </div>
    </main>

    <!-- ══ Add New Modal ══ -->
    <div v-if="addModal.open" class="al-modal-overlay" @click.self="addModal.open=false">
      <div class="al-modal amg-modal-scroll">
        <div class="al-modal-handle"></div>
        <div class="al-modal-title">+ เพิ่มพนักงานใหม่</div>

        <div class="amg-img-upload-row">
          <div class="amg-img-preview">
            <img v-if="addImgPreview" :src="addImgPreview" />
            <span v-else style="font-size:28px;">👤</span>
          </div>
          <div>
            <label class="amg-pick-btn" for="addEmpImg">📷 เลือกรูปภาพ</label>
            <input id="addEmpImg" type="file" accept="image/*" style="display:none" @change="pickAddImage" />
            <div v-if="addImgUploading" class="amg-upload-status">⏳ กำลังอัปโหลด...</div>
          </div>
        </div>

        <div class="al-form-2col">
          <div class="al-form-row">
            <label class="al-form-label">ชื่อ *</label>
            <input v-model="addForm.name" class="al-form-input" placeholder="ชื่อพนักงาน" />
          </div>
          <div class="al-form-row">
            <label class="al-form-label">รหัสพนักงาน</label>
            <input v-model="addForm.empCode" class="al-form-input" placeholder="DS001" />
          </div>
        </div>
        <div class="al-form-2col">
          <div class="al-form-row">
            <label class="al-form-label">Role</label>
            <input v-model="addForm.role" class="al-form-input" placeholder="ตำแหน่ง" />
          </div>
          <div class="al-form-row">
            <label class="al-form-label">Dept</label>
            <input v-model="addForm.dept" class="al-form-input" placeholder="แผนก" />
          </div>
        </div>
        <div class="al-form-row">
          <label class="al-form-label">อยู่ใน Team</label>
          <select v-model="addForm.inTeam" class="al-form-select">
            <option value="true">✓ Yes</option>
            <option value="false">No</option>
          </select>
        </div>

        <div class="amg-section-label">🎂 วันเกิด (optional)</div>
        <div style="display:flex;gap:8px;">
          <input v-model="addBdayDay" type="number" min="1" max="31" class="al-form-input" style="width:80px;text-align:center;" placeholder="วัน" />
          <select v-model="addForm.monthIdx" class="al-form-select">
            <option value="">— เดือน —</option>
            <option v-for="(m, i) in MONTHS" :key="i" :value="String(i)">{{ m }}</option>
          </select>
        </div>

        <div v-if="addModal.error" class="al-error" style="margin-top:12px;">⚠️ {{ addModal.error }}</div>

        <div class="al-modal-footer">
          <button class="al-btn al-btn-cancel" @click="addModal.open=false">ยกเลิก</button>
          <button class="al-btn al-btn-save" :disabled="addModal.saving" @click="doAddSave">
            {{ addModal.saving ? 'กำลังบันทึก...' : '✅ เพิ่มพนักงาน' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ══ Delete Confirm ══ -->
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
import { ref, reactive, computed, onMounted } from 'vue'
import * as svc from '../../services/adminService.js'
import { fetchImages } from '../../services/imageService.js'

const MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
function isTrue(v) { return v === true || v === 'true' || v === 'TRUE' }

function parseBdayDate(s) {
  if (!s) return { day: '', monthIdx: '' }
  const m = s.match(/(\d+)\s*([\u0E00-\u0E7F.]+)/)
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

// ── Data ───────────────────────────────────────────────────────────────────────
const empRows = ref([])
const loading = ref(true)
const search  = ref('')

const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return empRows.value
  return empRows.value.filter(r =>
    (r.name    || '').toLowerCase().includes(q) ||
    (r.empCode || '').toLowerCase().includes(q) ||
    (r.role    || '').toLowerCase().includes(q) ||
    (r.dept    || '').toLowerCase().includes(q)
  )
})

onMounted(async () => {
  try {
    empRows.value = (await svc.getEmployees()) || []
  } catch {
    empRows.value = []
  } finally {
    loading.value = false
  }
  // Fetch Drive images in background
  const ids = empRows.value.map(e => e.imgId).filter(Boolean)
  if (ids.length) {
    fetchImages(ids).then(map => {
      empRows.value = empRows.value.map(e =>
        e.imgId && map[e.imgId] ? { ...e, imgUrl: map[e.imgId] } : e
      )
    }).catch(() => {})
  }
})

// ── Inline edit state (multiple rows can be open simultaneously) ───────────────
const editForms     = reactive({})  // { [id]: formFields }
const editSaving    = reactive({})  // { [id]: boolean }
const editErrors    = reactive({})  // { [id]: string }
const editUploading = reactive({})
const editUploadDone = reactive({})

function startEdit(r) {
  if (editForms[r.id]) { cancelEdit(r.id); return } // toggle off if already open
  const p = parseBdayDate(r.bdDate || '')
  editForms[r.id] = {
    name:           r.name           || '',
    empCode:        r.empCode        || '',
    role:           r.role           || '',
    dept:           r.dept           || '',
    grad:           r.grad           || '',
    inTeam:         String(r.inTeam),
    inStarGang:     String(r.inStarGang),
    starGangName:   r.starGangName   || '',
    starGangRole:   r.starGangRole   || '',
    starGangSlogan: r.starGangSlogan || '',
    imgUrl:         r.imgUrl         || '',
    imgId:          r.imgId          || '',
    bdayDay:        p.day,
    monthIdx:       p.monthIdx,
    imgPending:     '',
    imgPreview:     r.imgUrl         || '',
  }
  editSaving[r.id]     = false
  editErrors[r.id]     = ''
  editUploading[r.id]  = false
  editUploadDone[r.id] = false
}

function cancelEdit(id) {
  delete editForms[id]
  delete editSaving[id]
  delete editErrors[id]
  delete editUploading[id]
  delete editUploadDone[id]
}

async function pickEditImage(e, id) {
  const file = e.target.files?.[0]
  if (!file || !editForms[id]) return
  e.target.value = ''
  try {
    const b64 = await resizeToBase64(file, 400, 0.75)
    editForms[id].imgPreview = b64
    editForms[id].imgPending = b64
    editUploadDone[id] = false
  } catch {
    editErrors[id] = 'ไม่สามารถโหลดรูปได้'
  }
}

async function saveInlineEdit(r) {
  const f = editForms[r.id]
  if (!f) return
  if (!f.name.trim()) { editErrors[r.id] = 'กรุณากรอกชื่อ'; return }
  editSaving[r.id] = true
  editErrors[r.id] = ''

  const bdDate = (f.bdayDay && f.monthIdx !== '')
    ? `${f.bdayDay} ${MONTHS[Number(f.monthIdx)]}`
    : ''

  try {
    await svc.updateRow('Employees', 'id', r.id, {
      empCode:        f.empCode,
      name:           f.name,
      role:           f.role,
      dept:           f.dept,
      grad:           f.grad,
      inTeam:         f.inTeam,
      inStarGang:     f.inStarGang,
      starGangName:   f.starGangName,
      starGangRole:   f.starGangRole,
      starGangSlogan: f.starGangSlogan,
      ...(bdDate ? { bdDate, monthIdx: f.monthIdx } : {}),
    })

    let imgUrl = f.imgUrl, imgId = f.imgId
    if (f.imgPending) {
      editUploading[r.id] = true
      try {
        const res = await svc.uploadProfileImage(r.id, f.imgPending, f.name + '_profile.jpg')
        imgUrl = f.imgPreview
        imgId  = res?.id || ''
        editUploadDone[r.id] = true
      } finally {
        editUploading[r.id] = false
      }
    }

    const idx = empRows.value.findIndex(e => e.id === r.id)
    if (idx >= 0) {
      empRows.value[idx] = { ...empRows.value[idx], ...f, imgUrl, imgId, bdDate }
    }
    cancelEdit(r.id)
  } catch (e) {
    editErrors[r.id] = e.message || 'เกิดข้อผิดพลาด'
  } finally {
    editSaving[r.id] = false
  }
}

// ── Add Modal ──────────────────────────────────────────────────────────────────
const addModal = reactive({ open: false, saving: false, error: '' })
const addForm  = reactive({
  name: '', empCode: '', role: '', dept: '', grad: '',
  inTeam: 'true', inStarGang: 'false',
  starGangName: '', starGangRole: '', starGangSlogan: '', monthIdx: '',
})
const addBdayDay     = ref('')
const addImgPreview  = ref('')
const addImgPending  = ref('')
const addImgUploading = ref(false)

function openAdd() {
  Object.assign(addForm, {
    name: '', empCode: '', role: '', dept: '', grad: '',
    inTeam: 'true', inStarGang: 'false',
    starGangName: '', starGangRole: '', starGangSlogan: '', monthIdx: '',
  })
  addBdayDay.value = ''; addImgPreview.value = ''; addImgPending.value = ''
  addModal.error = ''; addModal.open = true
}

async function pickAddImage(e) {
  const file = e.target.files?.[0]
  if (!file) return; e.target.value = ''
  try {
    const b64 = await resizeToBase64(file, 400, 0.75)
    addImgPreview.value = b64; addImgPending.value = b64
  } catch { addModal.error = 'ไม่สามารถโหลดรูปได้' }
}

async function doAddSave() {
  if (!addForm.name.trim()) { addModal.error = 'กรุณากรอกชื่อ'; return }
  addModal.saving = true; addModal.error = ''
  try {
    const res = await svc.addEmployee({
      empCode: addForm.empCode, name: addForm.name, role: addForm.role,
      dept: addForm.dept, grad: addForm.grad,
      inTeam: addForm.inTeam, inStarGang: addForm.inStarGang,
      starGangName: addForm.starGangName, starGangRole: addForm.starGangRole,
      starGangSlogan: addForm.starGangSlogan,
    })
    const empId = res?.id || String(Date.now())

    let imgUrl = '', imgId = ''
    if (addImgPending.value) {
      addImgUploading.value = true
      try {
        const uRes = await svc.uploadProfileImage(empId, addImgPending.value, addForm.name + '_profile.jpg')
        imgUrl = addImgPreview.value; imgId = uRes?.id || ''
      } finally { addImgUploading.value = false }
    }

    const bdDate = (addBdayDay.value && addForm.monthIdx !== '')
      ? `${addBdayDay.value} ${MONTHS[Number(addForm.monthIdx)]}`
      : ''
    if (bdDate) {
      await svc.updateRow('Employees', 'id', empId, { bdDate, monthIdx: addForm.monthIdx })
    }

    empRows.value.unshift({ id: empId, ...addForm, imgUrl, imgId, bdDate, fallbackIdx: 0 })
    addModal.open = false
  } catch (e) {
    addModal.error = e.message || 'เกิดข้อผิดพลาด'
  } finally {
    addModal.saving = false
  }
}

// ── Delete ─────────────────────────────────────────────────────────────────────
const delTarget = ref(null)
const deleting  = ref(false)

function confirmDelete(r) { delTarget.value = r }
async function doDelete() {
  deleting.value = true
  try {
    await svc.deleteRow('Employees', 'id', delTarget.value.id)
    cancelEdit(delTarget.value.id)
    empRows.value = empRows.value.filter(r => r.id !== delTarget.value.id)
    delTarget.value = null
  } catch { } finally { deleting.value = false }
}

</script>

<style scoped>
@import './admin.css';

/* ── Toolbar ── */
.emp-toolbar {
  display: flex;
  gap: 10px;
  align-items: center;
}
.emp-toolbar--sticky {
  position: sticky;
  top: 56px; /* mobile: below topbar */
  z-index: 100;
  background: #F0F1FF;
  padding: 8px 0;
  margin: -8px 0;
}
@media (min-width: 768px) {
  .emp-toolbar--sticky { top: 0; }
}
.emp-search {
  flex: 1;
  padding: 10px 14px;
  border: 1.5px solid #E5E7EB;
  border-radius: 12px;
  font-size: 13px;
  font-family: 'Sarabun', sans-serif;
  outline: none;
  background: white;
  transition: border-color 0.15s;
}
.emp-search:focus { border-color: #6366F1; }
.emp-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* ── List ── */
.emp-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

/* ── Card ── */
.emp-card {
  background: white;
  border-radius: 14px;
  border: 1.5px solid #E5E7EB;
  overflow: hidden;
  transition: box-shadow 0.15s, border-color 0.15s;
}
.emp-card--editing {
  border-color: #6366F1;
  box-shadow: 0 4px 20px rgba(99,102,241,0.13);
}

/* ── Collapsed row ── */
.emp-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  cursor: pointer;
  transition: background 0.12s;
}
.emp-row:hover { background: #FAFAFF; }

.emp-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #EEF2FF;
  border: 1.5px solid #E0E7FF;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}
.emp-avatar img { width: 100%; height: 100%; object-fit: cover; }

.emp-info { flex: 1; min-width: 0; }
.emp-name-line { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
.emp-name { font-size: 13px; font-weight: 800; color: #111827; }
.emp-code {
  font-size: 11px; font-weight: 700;
  background: #EEF2FF; color: #4F46E5;
  padding: 1px 7px; border-radius: 8px;
}
.emp-sub {
  font-size: 12px; color: #6B7280;
  margin-top: 2px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.emp-meta { display: flex; gap: 5px; align-items: center; margin-top: 5px; flex-wrap: wrap; }
.emp-bday { font-size: 11px; color: #9CA3AF; }

.emp-row-act { display: flex; gap: 5px; flex-shrink: 0; }
.emp-icon-btn {
  width: 32px; height: 32px;
  border: none; border-radius: 8px;
  cursor: pointer; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.12s;
}
.emp-icon-edit { background: #EEF2FF; }
.emp-icon-edit:hover { background: #E0E7FF; }
.emp-icon-del  { background: #FEF2F2; }
.emp-icon-del:hover  { background: #FEE2E2; }

/* ── Inline edit form ── */
.emp-edit {
  padding: 14px 14px 12px;
  background: #FAFAFF;
  position: relative;
}
.emp-edit-strip {
  position: absolute;
  top: 0; left: 0;
  width: 4px; height: 100%;
  background: linear-gradient(180deg, #6366F1, #A855F7);
  border-radius: 0 0 0 0;
}

.emp-edit-top {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 10px;
  padding-left: 8px;
}
.emp-photo-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.emp-edit-avatar {
  width: 56px; height: 56px;
  border-radius: 50%;
  background: #EEF2FF;
  border: 2px solid #C7D2FE;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.emp-edit-avatar img { width: 100%; height: 100%; object-fit: cover; }
.emp-photo-btn {
  font-size: 11px; font-weight: 700;
  background: #EEF2FF; color: #4F46E5;
  border-radius: 6px; padding: 3px 8px;
  cursor: pointer; font-family: 'Sarabun', sans-serif;
}
.emp-photo-btn:hover { background: #E0E7FF; }

.emp-namecode-col { flex: 1; }
.emp-input-name { font-weight: 700; }

.emp-field-label {
  font-size: 10px; font-weight: 800;
  color: #9CA3AF; text-transform: uppercase;
  letter-spacing: 0.5px; margin-bottom: 4px;
}

.emp-edit-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 9px;
  padding-left: 8px;
}

/* Toggle switch */
.emp-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  padding: 7px 10px 7px 4px;
  background: #F3F4F6;
  border-radius: 20px;
  cursor: pointer;
  transition: background 0.18s;
  user-select: none;
  border: 1.5px solid transparent;
}
.emp-toggle.on {
  background: #EEF2FF;
  border-color: #C7D2FE;
}
.emp-toggle-knob {
  width: 22px; height: 22px;
  border-radius: 50%;
  background: #D1D5DB;
  transition: background 0.18s, transform 0.18s;
  flex-shrink: 0;
}
.emp-toggle.on .emp-toggle-knob { background: #6366F1; }
.emp-toggle-label { font-size: 12px; font-weight: 700; color: #374151; }
.emp-toggle.on .emp-toggle-label { color: #4338CA; }

.emp-toggle-sm { padding: 4px 10px 4px 4px; }
.emp-toggle-sm .emp-toggle-knob { width: 18px; height: 18px; }

.emp-bday-day { width: 66px; text-align: center; flex-shrink: 0; }
.emp-bday-preview { font-size: 11px; color: #6366F1; margin-top: 4px; font-weight: 700; }

/* StarGang collapsible */
.emp-stargng {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  padding: 9px 10px;
  margin-bottom: 9px;
  margin-left: 8px;
  font-family: 'Sarabun', sans-serif;
}
.emp-stargng > summary {
  font-size: 12px; font-weight: 700; color: #6B7280;
  cursor: pointer; list-style: none; user-select: none;
}
.emp-stargng > summary::-webkit-details-marker { display: none; }
.emp-stargng > summary::before { content: '▸ '; color: #9CA3AF; }
.emp-stargng[open] > summary::before { content: '▾ '; }

/* Edit footer */
.emp-edit-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 10px;
  padding-top: 10px;
  padding-left: 8px;
  border-top: 1px solid #E5E7EB;
}
</style>
