<template>
  <div>
    <main class="al-main">

      <div class="al-page-header">
        <h2 class="al-page-title">📅 กิจกรรม</h2>
        <div style="display:flex;gap:8px;">
          <router-link to="/admin/activities/scan" class="al-btn" style="font-size:12px;padding:7px 12px;">📷 สแกน QR</router-link>
          <button class="al-btn al-btn-primary" @click="openAdd">+ เพิ่มกิจกรรม</button>
        </div>
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
          <div v-for="r in filtered" :key="r.id">
            <div class="al-item">
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
                  <button v-if="r.ticketEnabled" class="al-ticket-count-btn" @click.stop="toggleRegistrants(r.id)">
                    🎟 {{ bookedCounts[r.id] ?? '…' }}{{ r.ticketCapacity ? '/' + r.ticketCapacity : '' }} ที่นั่ง {{ expandedId === r.id ? '▲' : '▼' }}
                  </button>
                </div>
              </div>
              <div class="al-item-actions">
                <button class="al-btn al-btn-edit" @click="openEdit(r)">แก้ไข</button>
                <button class="al-btn al-btn-delete" @click="confirmDelete(r)">ลบ</button>
              </div>
            </div>

          <!-- Registrant list (expandable) -->
          <div v-if="r.ticketEnabled && expandedId === r.id" class="al-registrant-section">
            <div v-if="!ticketRegs[r.id]" style="font-size:12px;color:#9CA3AF;padding:8px 0;">⏳ กำลังโหลด...</div>
            <div v-else-if="!ticketRegs[r.id].length" style="font-size:12px;color:#9CA3AF;padding:8px 0;">ยังไม่มีผู้จอง</div>
            <table v-else class="al-ticket-table">
              <thead>
                <tr><th>ชื่อ</th><th>ตั๋วเลขที่</th><th>จำนวน</th><th>สถานะ</th><th>สลิป</th><th></th></tr>
              </thead>
              <tbody>
                <tr v-for="t in ticketRegs[r.id]" :key="t.id">
                  <td>{{ t.employeeName }}</td>
                  <td>{{ t.ticketNo }}</td>
                  <td style="text-align:center;font-weight:700;color:#7C3AED;">{{ t.quantity || 1 }}</td>
                  <td>
                    <span :style="{ color: t.status === 'checked_in' ? '#10B981' : t.status === 'cancelled' ? '#EF4444' : t.status === 'pending_slip' ? '#F59E0B' : '#6B7280' }">
                      {{ t.status === 'checked_in' ? '✅ เข้าแล้ว' : t.status === 'cancelled' ? '❌ ยกเลิก' : t.status === 'pending_slip' ? '⏳ รอสลิป' : '🎟 รอ check-in' }}
                    </span>
                  </td>
                  <td>
                    <a v-if="t.slipUrl" :href="t.slipUrl" target="_blank" style="font-size:11px;color:#6366F1;font-weight:600;">ดูสลิป 🧾</a>
                    <span v-else style="font-size:11px;color:#D1D5DB;">—</span>
                  </td>
                  <td>
                    <button v-if="t.status === 'booked'" class="al-btn al-btn-edit" style="font-size:11px;padding:3px 8px;" @click="doCheckIn(t.qrToken, r.id)">✓ Check-in</button>
                  </td>
                </tr>
              </tbody>
            </table>
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

        <!-- Ticket section -->
        <div class="al-form-row" style="border-top:1px solid #E5E7EB;padding-top:12px;margin-top:4px;">
          <label class="al-form-label" style="font-weight:600;">🎟 ระบบตั๋ว</label>
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
            <input type="checkbox" v-model="form.ticketEnabled" style="width:16px;height:16px;" />
            เปิดใช้ระบบจองตั๋ว
          </label>
        </div>
        <div v-if="form.ticketEnabled">
          <div class="al-form-row">
            <label class="al-form-label">ชื่อตั๋ว</label>
            <input v-model="form.ticketTitle" class="al-form-input" placeholder="เช่น บัตรเข้างาน / VIP / ทั่วไป" />
          </div>
          <div class="al-form-2col">
            <div class="al-form-row">
              <label class="al-form-label">ราคา (บาท)</label>
              <input v-model.number="form.ticketPrice" type="number" min="0" class="al-form-input" placeholder="0 = ฟรี" />
            </div>
            <div class="al-form-row">
              <label class="al-form-label">จำนวนที่นั่ง</label>
              <input v-model.number="form.ticketCapacity" type="number" min="1" class="al-form-input" placeholder="ว่าง = ไม่จำกัด" />
            </div>
          </div>
          <div class="al-form-row">
            <label class="al-form-label">เปิดจองตั้งแต่</label>
            <input v-model="form.ticketOpenAt" type="datetime-local" class="al-form-input" />
            <div style="font-size:11px;color:#9CA3AF;margin-top:3px;">ว่าง = เปิดจองทันที</div>
          </div>
          <div class="al-form-row">
            <label class="al-form-label">วิธีชำระเงิน / หมายเหตุ</label>
            <textarea v-model="form.ticketNote" class="al-form-textarea" rows="2" placeholder="เช่น โอนมาที่บัญชีธนาคาร xxx ก่อนวันงาน"></textarea>
          </div>
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
import { deleteImage } from '../../services/edgeFunctions.js'

const acts   = useActivitiesStore()

const loading     = ref(true)
const filterMonth = ref(0)
const modal  = reactive({ open: false, mode: 'add', saving: false, error: '' })
const form   = reactive({ id:'', monthIdx:'1', name:'', emoji:'🎉', date:'', dateEnd:'', loc:'', desc:'', steps:'', joinUrl:'', joinLabel:'stamp', joinOpenAt:'', joinCloseAt:'', feedbackUrl:'', imgUrl:'', imgId:'', ticketEnabled:false, ticketTitle:'', ticketPrice:0, ticketCapacity:null, ticketNote:'', ticketOpenAt:'' })

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

function toDatetimeLocal(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function onImgChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const oldImgId = form.imgId
  imgUploading.value = true
  modal.error = ''
  try {
    const b64 = await resizeToBase64(file, 1200, 600, 0.88)
    imgPreview.value = b64
    const res = await svc.uploadImage(b64, file.name, 'activities')
    form.imgId  = res.id
    form.imgUrl = res.url || ''
    imgPreview.value = res.url || b64
    if (oldImgId && oldImgId !== res.id) deleteImage([oldImgId]).catch(console.warn)
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
  acts.all.filter(a => a.ticketEnabled).forEach(async a => {
    bookedCounts.value[a.id] = await svc.getActivityBookedCount(a.id)
  })
})

function openAdd() {
  Object.assign(form, { id:'', monthIdx:'1', name:'', emoji:'🎉', date:'', dateEnd:'', loc:'', desc:'', steps:'', joinUrl:'', joinLabel:'stamp', joinOpenAt:'', joinCloseAt:'', feedbackUrl:'', imgUrl:'', imgId:'', ticketEnabled:false, ticketTitle:'', ticketPrice:0, ticketCapacity:null, ticketNote:'', ticketOpenAt:'' })
  dateInput.value = ''; dateEndInput.value = ''; imgPreview.value = ''; imgUploading.value = false
  joinOpenDate.value = ''; joinOpenTime.value = ''; joinCloseDate.value = ''; joinCloseTime.value = ''
  modal.mode = 'add'; modal.error = ''; modal.open = true
}

function openEdit(r) {
  Object.assign(form, { ...r, monthIdx: String(r.monthIdx), ticketEnabled: !!r.ticketEnabled, ticketTitle: r.ticketTitle || '', ticketPrice: r.ticketPrice || 0, ticketCapacity: r.ticketCapacity ?? null, ticketNote: r.ticketNote || '', ticketOpenAt: toDatetimeLocal(r.ticketOpenAt) })
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


// ── Ticket registrant section ────────────────────────────────────
const bookedCounts = ref({})
const expandedId   = ref(null)
const ticketRegs   = ref({})

async function toggleRegistrants(actId) {
  if (expandedId.value === actId) { expandedId.value = null; return }
  expandedId.value = actId
  if (!ticketRegs.value[actId]) {
    ticketRegs.value[actId] = null // show loading
    ticketRegs.value[actId] = await svc.getActivityTickets(actId)
  }
}

async function doCheckIn(qrToken, actId) {
  try {
    await svc.checkInTicket(qrToken)
    // refresh list
    ticketRegs.value[actId] = await svc.getActivityTickets(actId)
    bookedCounts.value[actId] = await svc.getActivityBookedCount(actId)
  } catch (e) {
    alert('Check-in ล้มเหลว: ' + e.message)
  }
}

function confirmDelete(r) { delTarget.value = r }
async function doDelete() {
  deleting.value = true
  const target = delTarget.value
  try {
    if (target.imgId) deleteImage([target.imgId]).catch(console.warn)
    await svc.deleteActivity(target.id)
    acts.localDelete(target.id)
    delTarget.value = null
  } catch { } finally {
    deleting.value = false
  }
}

</script>

<style scoped>
@import './admin.css';
</style>
