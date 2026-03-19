<template>
  <div>
    <main class="al-main">

      <div class="al-page-header">
        <h2 class="al-page-title">📅 กิจกรรม</h2>
        <button class="al-btn al-btn-primary" @click="openAdd">+ เพิ่มกิจกรรม</button>
      </div>

      <!-- Month filter chips -->
      <div class="al-filters">
        <button
          class="al-chip"
          :class="{ active: filterMonth === 0 }"
          @click="filterMonth = 0"
        >ทั้งหมด</button>
        <button
          v-for="m in MONTHS" :key="m.idx"
          class="al-chip"
          :class="{ active: filterMonth === m.idx }"
          @click="filterMonth = m.idx"
        >{{ m.short }}</button>
      </div>

      <div class="al-card">
        <div class="al-card-header">
          <span class="al-card-title">กิจกรรม</span>
          <span class="al-badge al-badge-blue">{{ filtered.length }} รายการ</span>
        </div>

        <div v-if="loading" class="al-loading">⏳ กำลังโหลด...</div>
        <div v-else-if="!filtered.length" class="al-empty">📭 ไม่มีกิจกรรม</div>

        <div v-else>
          <div class="al-item" v-for="r in filtered" :key="r.id">
            <img v-if="r.imgUrl" :src="r.imgUrl" class="al-item-thumb" />
            <div v-else class="al-item-avatar">{{ r.emoji || '📅' }}</div>
            <div class="al-item-body">
              <div class="al-item-title">{{ r.name }}</div>
              <div class="al-item-sub">
                {{ r.date }}{{ r.dateEnd ? ' – ' + r.dateEnd : '' }}
                {{ r.loc ? '· ' + r.loc : '' }}
              </div>
              <div class="al-item-meta">
                <span class="al-badge al-badge-month">{{ monthName(r.monthIdx) }}</span>
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

    <!-- Add/Edit Modal -->
    <div v-if="modal.open" class="al-modal-overlay" @click.self="modal.open=false">
      <div class="al-modal">
        <div class="al-modal-handle"></div>
        <div class="al-modal-title">{{ modal.mode === 'add' ? '+ เพิ่มกิจกรรม' : '✏️ แก้ไขกิจกรรม' }}</div>

        <div class="al-form-2col">
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
          <label class="al-form-label">วันสิ้นสุด (ถ้าเป็นช่วงหลายวัน)</label>
          <input v-model="dateEndInput" type="date" class="al-form-input" />
          <div v-if="dateEndInput" style="font-size:11px;color:#6B7280;margin-top:4px;">{{ isoToThai(dateEndInput) }}</div>
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
          <textarea v-model="form.steps" class="al-form-textarea" rows="4" placeholder="1. ลงทะเบียน&#10;2. รับเอกสาร&#10;3. เข้าร่วมกิจกรรม"></textarea>
        </div>
        <div class="al-form-row">
          <label class="al-form-label">Activity URL (ถ้ามี)</label>
          <input v-model="form.joinUrl" class="al-form-input" placeholder="https://..." />
        </div>
        <div class="al-form-row">
          <label class="al-form-label">ปุ่ม Control</label>
          <div class="join-label-options">
            <label v-for="opt in JOIN_LABEL_OPTIONS" :key="opt.value" class="join-label-opt">
              <input type="radio" v-model="form.joinLabel" :value="opt.value" />
              <div>
                <div>{{ opt.label }}</div>
                <div style="font-size:10px;color:#9CA3AF;margin-top:1px;">{{ opt.desc }}</div>
              </div>
            </label>
          </div>
        </div>

        <div class="al-form-2col">
          <div class="al-form-row">
            <label class="al-form-label">วันที่เริ่มกิจกรรม</label>
            <div style="display:flex;gap:6px;">
              <input v-model="joinOpenDate" type="date" class="al-form-input" style="flex:1;" />
              <input :value="joinOpenTime" type="text" class="al-form-input" style="width:80px;text-align:center;" placeholder="09:00" maxlength="5" @input="fmtTime($event,'joinOpenTime')" />
            </div>
            <div style="font-size:10px;color:#9CA3AF;margin-top:3px;">เว้นว่าง = เปิดทันที</div>
          </div>
          <div class="al-form-row">
            <label class="al-form-label">วันสิ้นสุดกิจกรรม</label>
            <div style="display:flex;gap:6px;">
              <input v-model="joinCloseDate" type="date" class="al-form-input" style="flex:1;" />
              <input :value="joinCloseTime" type="text" class="al-form-input" style="width:80px;text-align:center;" placeholder="17:00" maxlength="5" @input="fmtTime($event,'joinCloseTime')" />
            </div>
            <div style="font-size:10px;color:#9CA3AF;margin-top:3px;">เว้นว่าง = ไม่มีกำหนด</div>
          </div>
        </div>

        <div class="al-form-row">
          <label class="al-form-label">Feedback URL (ถ้ามี)</label>
          <input v-model="form.feedbackUrl" class="al-form-input" placeholder="https://forms.google.com/..." />
        </div>

        <!-- Image upload -->
        <div class="al-form-row">
          <label class="al-form-label">รูป Header (ถ้ามี)</label>
          <div class="act-upload-zone" :style="imgUploading?'opacity:.6;cursor:default;':''" @click="!imgUploading && imgFileInput.click()">
            <img v-if="imgPreview && !imgUploading" :src="imgPreview" class="act-upload-preview" />
            <div v-else-if="imgUploading" class="act-upload-placeholder">
              <span style="font-size:22px;">⏳</span>
              <span style="font-size:12px;color:#6B7280;margin-top:4px;">กำลังอัปโหลด...</span>
            </div>
            <div v-else class="act-upload-placeholder">
              <span style="font-size:28px;">🖼️</span>
              <span style="font-size:12px;color:#9CA3AF;margin-top:4px;">คลิกเพื่ออัปโหลด → Google Drive</span>
            </div>
          </div>
          <button v-if="imgPreview && !imgUploading" class="al-btn al-btn-delete" style="margin-top:6px;width:100%;" @click.stop="clearImg">🗑️ ลบรูป</button>
          <input ref="imgFileInput" type="file" accept="image/*" style="display:none" @change="onImgChange" />
        </div>

        <div v-if="modal.error" class="al-error">⚠️ {{ modal.error }}</div>

        <div class="al-modal-footer">
          <button class="al-btn al-btn-cancel" @click="modal.open=false">ยกเลิก</button>
          <button class="al-btn al-btn-save" :disabled="modal.saving || imgUploading" @click="saveModal">
            {{ modal.saving ? 'กำลังบันทึก...' : imgUploading ? 'รอรูป...' : '✅ บันทึก' }}
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
          ลบกิจกรรม "<strong>{{ delTarget.name }}</strong>" ใช่หรือไม่?
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
import { useActivitiesStore } from '../../stores/activities.js'
import * as svc from '../../services/activitiesService.js'
import { resizeToBase64 } from '../../composables/useImageCompress.js'

const acts   = useActivitiesStore()

const loading     = ref(true)
const filterMonth = ref(0)
const modal  = reactive({ open: false, mode: 'add', saving: false, error: '' })
const form   = reactive({ id:'', monthIdx:'1', name:'', emoji:'🎉', date:'', dateEnd:'', loc:'', desc:'', steps:'', joinUrl:'', joinLabel:'stamp', joinOpenAt:'', joinCloseAt:'', feedbackUrl:'', imgUrl:'', imgId:'' })

const JOIN_LABEL_OPTIONS = [
  { value: '',        label: '— ไม่แสดงปุ่ม',          desc: 'ซ่อนปุ่มทั้งหมด' },
  { value: 'stamp',   label: '🎯 Check-In Bimonthly',   desc: 'Stamp เข้าร่วม + ตีไข่ลุ้นรางวัล' },
  { value: 'checkin', label: '✅ เข้าร่วมกิจกรรม', desc: 'Stamp เข้าร่วมเท่านั้น ไม่มีรางวัล' },
]
const delTarget = ref(null)
const deleting  = ref(false)

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

const imgFileInput  = ref(null)
const imgPreview    = ref('')
const imgUploading  = ref(false)
const dateEndInput  = ref('')

// joinOpenAt / joinCloseAt — แยก date+time เพื่อให้ browser แสดง 24HR
const joinOpenDate  = ref('')
const joinOpenTime  = ref('')
const joinCloseDate = ref('')
const joinCloseTime = ref('')

// auto-format HH:MM as user types
function fmtTime(e, field) {
  const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 4)
  let v = digits
  if (digits.length >= 3) v = digits.slice(0, 2) + ':' + digits.slice(2)
  e.target.value = v
  if (field === 'joinOpenTime')  joinOpenTime.value  = v
  if (field === 'joinCloseTime') joinCloseTime.value = v
}

function splitDateTime(dt) {
  if (!dt) return { d: '', t: '' }
  const [d, t = ''] = dt.split('T')
  return { d, t: t.slice(0, 5) }
}
function joinDateTime(d, t) {
  if (!d) return ''
  return t ? `${d}T${t}` : `${d}T00:00`
}

async function onImgChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  imgUploading.value = true
  modal.error = ''
  try {
    const b64 = await resizeToBase64(file, 1200, 600, 0.88)
    imgPreview.value = b64
    const res = await svc.uploadImage(b64, file.name, 'activities')
    form.imgId  = res.id
    form.imgUrl = res.url || ''
    imgPreview.value = res.url || b64
  } catch (err) {
    modal.error = 'อัปโหลดรูปล้มเหลว: ' + (err.message || 'ลองใหม่')
    imgPreview.value = ''
  } finally {
    imgUploading.value = false
    e.target.value = ''
  }
}

function clearImg() {
  form.imgUrl = ''; form.imgId = ''; imgPreview.value = ''
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
  return MONTHS.find(m => String(m.idx) === String(idx))?.short || idx
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
  Object.assign(form, { id:'', monthIdx:'1', name:'', emoji:'🎉', date:'', dateEnd:'', loc:'', desc:'', steps:'', joinUrl:'', joinLabel:'stamp', joinOpenAt:'', joinCloseAt:'', feedbackUrl:'', imgUrl:'', imgId:'' })
  dateInput.value = ''; dateEndInput.value = ''; imgPreview.value = ''; imgUploading.value = false
  joinOpenDate.value = ''; joinOpenTime.value = ''; joinCloseDate.value = ''; joinCloseTime.value = ''
  modal.mode = 'add'; modal.error = ''; modal.open = true
}

function openEdit(r) {
  Object.assign(form, { ...r, monthIdx: String(r.monthIdx) })
  form.imgId = r.imgId || ''
  if (form.imgId) form.imgUrl = ''
  dateInput.value    = thaiToIso(r.date)
  dateEndInput.value = thaiToIso(r.dateEnd || '')
  imgPreview.value   = r.imgUrl || ''
  imgUploading.value = false
  const oa = splitDateTime(r.joinOpenAt  || '')
  const ca = splitDateTime(r.joinCloseAt || '')
  joinOpenDate.value = oa.d; joinOpenTime.value = oa.t
  joinCloseDate.value = ca.d; joinCloseTime.value = ca.t
  modal.mode = 'edit'; modal.error = ''; modal.open = true
}

async function saveModal() {
  if (!form.name.trim()) { modal.error = 'กรุณากรอกชื่อกิจกรรม'; return }
  form.date       = isoToThai(dateInput.value)
  form.dateEnd    = isoToThai(dateEndInput.value)
  form.joinOpenAt  = joinDateTime(joinOpenDate.value, joinOpenTime.value)
  form.joinCloseAt = joinDateTime(joinCloseDate.value, joinCloseTime.value)
  modal.saving = true; modal.error = ''
  try {
    if (modal.mode === 'add') {
      const res = await svc.addActivity({ ...form })
      acts.localAdd({ ...form, id: res.data?.id || Date.now().toString(), imgUrl: imgPreview.value })
    } else {
      await svc.updateActivity(form.id, { ...form })
      // Preserve existing Drive image if no new preview (don't overwrite with empty)
      let localImgUrl = imgPreview.value
      if (!localImgUrl && form.imgId) {
        localImgUrl = acts.all.find(a => a.id === form.id)?.imgUrl || ''
      } else if (!localImgUrl) {
        localImgUrl = form.imgUrl
      }
      acts.localUpdate(form.id, { ...form, imgUrl: localImgUrl })
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

</script>

<style scoped>
@import './admin.css';
</style>
