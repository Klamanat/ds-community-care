<template>
  <div>
    <AdminPageHeader title="💚 Mental Health" sub="ที่ปรึกษาสุขภาพจิต">
      <button v-if="tab === 'advisors'" class="al-btn al-btn-primary" @click="openAdd">+ เพิ่ม</button>
      <button v-else-if="tab === 'requests'" class="al-btn al-btn-secondary" @click="loadRequests(true)">🔄 โหลดใหม่</button>
    </AdminPageHeader>
    <main class="al-main">

      <!-- Tabs -->
      <div class="al-body">
      <div class="al-tab-bar">
        <button class="al-tab-btn" :class="{ active: tab === 'advisors' }" @click="tab = 'advisors'">
          👥 ที่ปรึกษา
          <span class="al-tab-btn-count">{{ advisors.length }}</span>
        </button>
        <button class="al-tab-btn" :class="{ active: tab === 'requests' }" @click="switchToRequests">
          📥 ข้อความ
          <span v-if="requests.length" class="al-tab-btn-count" style="background:#DCFCE7;color:#15803D;">{{ requests.length }}</span>
        </button>
      </div>
      <!-- ── Tab: Advisors ── -->
      <div v-if="tab === 'advisors'">
        <div class="al-card">
          <div class="al-card-header">
            <span class="al-card-title">Mental Health Advisors</span>
            <span class="al-badge al-badge-blue">{{ advisors.length }} คน</span>
          </div>

          <div v-if="loading" class="al-loading-skeletons">
            <SkeletonCard height="68px" />
            <SkeletonCard height="68px" />
          </div>
          <EmptyState v-else-if="!advisors.length" title="ยังไม่มีที่ปรึกษา" sub="กด + เพิ่ม เพื่อเริ่มต้น" />

          <div v-else>
            <div class="al-item fade-in" v-for="a in advisors" :key="a.id" @click="handleRippleClick">
              <div class="al-item-avatar" :style="{ background: grad(a.name) }">
                <span class="text-xl text-white font-extrabold">{{ (a.name||'?').charAt(0) }}</span>
              </div>
              <div class="al-item-body">
                <div class="al-item-title">{{ a.name }}</div>
                <div class="al-item-sub">{{ a.role || '—' }}</div>
                <div class="al-item-meta">
                  <span v-if="a.employeeId" class="text-gray-500">🪪 ID: {{ a.employeeId }}</span>
                  <span v-else class="text-coral text-[11px]">⚠️ ยังไม่ได้เลือกพนักงาน</span>
                </div>
              </div>
              <div class="al-item-actions">
                <button class="al-btn al-btn-edit"   @click="openEdit(a)">แก้ไข</button>
                <button class="al-btn al-btn-delete" @click="confirmDel(a)">ลบ</button>
              </div>
            </div>
          </div>
        </div>

        <div class="al-info-box mt-3">
          <div class="text-xs font-extrabold text-indigo mb-1.5">📋 วิธีใช้งาน</div>
          <ul class="text-xs text-indigo/80 leading-loose pl-4 m-0">
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

          <div v-if="reqLoading" class="al-loading-skeletons">
            <SkeletonCard height="68px" />
            <SkeletonCard height="68px" />
          </div>
          <div v-else-if="reqError" class="p-4 text-red-600 text-sm">⚠️ {{ reqError }}</div>
          <EmptyState v-else-if="!requests.length" title="ยังไม่มีข้อความ" sub="" />

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
      </div>
    </main>

    <!-- ── Add / Edit Modal ── -->
    <BaseModal padded modal-id="admin-mental-form" sheet-class="modal-sheet-lg">
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
        <div class="al-form-row relative">
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
          <input v-model.number="form.order" type="number" min="0" class="al-form-input max-w-[100px]" />
        </div>

        <!-- Card BG -->
        <div class="al-form-row">
          <label class="al-form-label">🃏 พื้นหลัง Card</label>

          <!-- Preview -->
          <div class="mav-card-preview" :style="cardPreviewStyle">
            <div v-if="form.cardBgEmoji" class="mav-card-emoji-scatter" aria-hidden="true">
              <span v-for="(p, i) in emojiPositions(form.name || 'preview')" :key="i" class="mav-emoji-dot"
                :style="{ left: p.left+'%', top: p.top+'%', transform: `rotate(${p.rotate}deg) scale(${p.scale})` }">{{ form.cardBgEmoji }}</span>
            </div>
            <div class="mav-card-preview-inner">
              <div class="mav-card-av">{{ (form.name || 'ก').charAt(0) }}</div>
              <div class="flex-1 min-w-0">
                <div class="mav-card-pv-name" :class="{ 'mav-card-pv-light': !!form.cardBgType }">{{ form.name || 'ชื่อที่ปรึกษา' }}</div>
                <div class="mav-card-pv-role" :class="{ 'mav-card-pv-light': !!form.cardBgType }">{{ form.role || 'บทบาท' }}</div>
              </div>
            </div>
          </div>

          <!-- BG type tabs (color/image only — emoji is independent below) -->
          <div class="mav-bg-tabs">
            <button type="button" class="mav-bg-tab" :class="{ active: !form.cardBgType }" @click="clearCardBg">✕ ค่าเริ่มต้น</button>
            <button type="button" class="mav-bg-tab" :class="{ active: form.cardBgType === 'color' }" @click="form.cardBgType = 'color'">🎨 สี</button>
            <button type="button" class="mav-bg-tab" :class="{ active: form.cardBgType === 'image' }" @click="form.cardBgType = 'image'">📷 รูป</button>
          </div>

          <!-- Color swatches -->
          <div v-if="form.cardBgType === 'color'" class="mav-swatch-grid">
            <button
              v-for="c in CARD_COLORS" :key="c.key" type="button"
              class="mav-swatch" :style="{ background: c.css }"
              :class="{ selected: form.cardBgValue === c.key }"
              @click="pickColor(c.key)"
              :title="c.label"
            ></button>
          </div>

          <!-- Image upload -->
          <div v-else-if="form.cardBgType === 'image'" class="mt-2 flex gap-2 items-center flex-wrap">
            <label class="al-btn al-btn-secondary cursor-pointer text-xs" :for="'cardBg_'+modal.mode">
              {{ cardBgUploading ? '⏳ อัปโหลด...' : '📷 เลือกรูป' }}
            </label>
            <input :id="'cardBg_'+modal.mode" type="file" accept="image/*" class="hidden" :disabled="cardBgUploading" @change="onCardBgChange" />
            <span v-if="form.cardBgValue && form.cardBgType === 'image'" class="text-[11px] text-mint">✅ มีรูปแล้ว</span>
          </div>
        </div>

        <!-- Emoji overlay (independent from bg color/image) -->
        <div class="al-form-row">
          <label class="al-form-label">🍋 Emoji บนการ์ด <span class="font-normal text-app-light">(เลือกพร้อมกับสีได้)</span></label>
          <div class="mav-emoji-grid">
            <button
              type="button" class="mav-emoji-btn mav-emoji-clear"
              :class="{ selected: !form.cardBgEmoji }"
              @click="clearEmoji"
              title="ไม่มี Emoji"
            >✕</button>
            <button
              v-for="e in BG_EMOJIS" :key="e" type="button"
              class="mav-emoji-btn" :class="{ selected: form.cardBgEmoji === e }"
              @click="pickEmoji(e)"
            >{{ e }}</button>
          </div>
        </div>

        <div v-if="modal.error" class="al-error">⚠️ {{ modal.error }}</div>

        <div class="al-modal-footer">
          <button class="al-btn al-btn-cancel" @click="ui.closeModal()">ยกเลิก</button>
          <button class="al-btn al-btn-save" :disabled="modal.saving" @click="doSave">
            {{ modal.saving ? 'กำลังบันทึก...' : '✅ บันทึก' }}
          </button>
        </div>
    </BaseModal>

    <!-- ── Delete Confirm ── -->
    <BaseModal padded modal-id="admin-mental-del">
      <div class="al-modal-title">🗑️ ยืนยันการลบ</div>
      <p class="text-sm text-gray-700 mb-4">
        ลบ "<strong>{{ delTarget?.name }}</strong>" ออกจากรายชื่อที่ปรึกษา?
      </p>
      <div class="al-modal-footer">
        <button class="al-btn al-btn-cancel" @click="ui.closeModal()">ยกเลิก</button>
        <button class="al-btn al-btn-delete" :disabled="deleting" @click="doDelete">
          {{ deleting ? 'กำลังลบ...' : '🗑️ ลบ' }}
        </button>
      </div>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import {
  getEmployees,
  getMentalAdvisors, addMentalAdvisor, updateMentalAdvisor, deleteMentalAdvisor,
  getConsultRequests,
} from '../../core/services/adminService.js'
import { uploadImage, deleteImage } from '../../core/services/edgeFunctions.js'
import { CARD_COLORS, CARD_COLOR_MAP, emojiPositions } from '../../core/constants/mentalCardColors.js'
import AdminPageHeader from './AdminPageHeader.vue'
import SkeletonCard from '../../shared/components/SkeletonCard.vue'
import EmptyState from '../../shared/components/EmptyState.vue'
import { useRipple } from '../../core/composables/useRipple.js'
import { useFadeIn } from '../../core/composables/useFadeIn.js'
import { useUiStore } from '../../core/stores/ui.js'
import BaseModal from '../../shared/components/BaseModal.vue'

const tab = ref('advisors')
const ui = useUiStore()
const { handleRippleClick } = useRipple()
useFadeIn('.fade-in')

// ── Advisors ─────────────────────────────────────────────────────────────
const advisors  = ref([])
const employees = ref([])
const loading   = ref(true)
const modal     = reactive({ mode: 'add', saving: false, error: '' })
const form            = reactive({ id: '', name: '', role: '', employeeId: '', order: 0, cardBgType: '', cardBgValue: '', cardBgId: '', cardBgEmoji: '' })
const cardBgUploading = ref(false)

const cardPreviewStyle = computed(() => {
  if (!form.cardBgType) return {}
  if (form.cardBgType === 'color' && form.cardBgValue) {
    const color = CARD_COLOR_MAP[form.cardBgValue]
    return color ? { background: color.css, borderColor: color.border } : {}
  }
  if (form.cardBgType === 'image' && form.cardBgValue) return { backgroundImage: `url('${form.cardBgValue}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
  return {}
})

const BG_EMOJIS = ['🍋','🍓','🍊','🍇','🍑','🍍','🥭','🍎','🌸','⭐','🌿','💙','🌈','🦋','🌻','🎵']
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
  Object.assign(form, { id: '', name: '', role: '', employeeId: '', order: advisors.value.length, cardBgType: '', cardBgValue: '', cardBgId: '', cardBgEmoji: '' })
  empSearch.value = ''; showDrop.value = false
  modal.mode = 'add'; modal.error = ''; ui.openModal('admin-mental-form')
}

function openEdit(a) {
  Object.assign(form, { ...a, cardBgType: a.cardBgType || '', cardBgValue: a.cardBgValue || '', cardBgId: a.cardBgId || '', cardBgEmoji: a.cardBgEmoji || '' })
  empSearch.value = ''; showDrop.value = false
  modal.mode = 'edit'; modal.error = ''; ui.openModal('admin-mental-form')
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
    const payload = { name: form.name.trim(), role: form.role.trim(), employeeId: form.employeeId.trim(), order: form.order, cardBgType: form.cardBgType || null, cardBgValue: form.cardBgValue || null, cardBgId: form.cardBgId || null, cardBgEmoji: form.cardBgEmoji || null }
    if (modal.mode === 'add') {
      const created = await addMentalAdvisor(payload)
      advisors.value.push(created)
    } else {
      const updated = await updateMentalAdvisor(form.id, payload)
      const idx = advisors.value.findIndex(a => a.id === form.id)
      if (idx >= 0) advisors.value[idx] = updated
    }
    advisors.value.sort((a, b) => (a.order || 0) - (b.order || 0))
    ui.closeModal()
  } catch (e) {
    modal.error = e.message || 'เกิดข้อผิดพลาด'
  } finally {
    modal.saving = false
  }
}

function resizeBg(file) {
  return new Promise((resolve, reject) => {
    const img = new Image(), url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 1200
      let w = img.width, h = img.height
      if (w > MAX) { h = Math.round(h * MAX / w); w = MAX }
      const c = document.createElement('canvas')
      c.width = w; c.height = h
      c.getContext('2d').drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('load failed')) }
    img.src = url
  })
}

function pickColor(key) {
  form.cardBgType  = 'color'
  form.cardBgValue = key
  form.cardBgId    = ''
}

function pickEmoji(emoji) {
  form.cardBgEmoji = emoji
}

function clearEmoji() {
  form.cardBgEmoji = ''
}

async function clearCardBg() {
  const oldId = form.cardBgId
  form.cardBgType  = ''
  form.cardBgValue = ''
  form.cardBgId    = ''
  if (oldId) deleteImage([oldId]).catch(console.warn)
}

async function onCardBgChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  e.target.value = ''
  modal.error = ''
  cardBgUploading.value = true
  try {
    const b64  = await resizeBg(file)
    const oldId = form.cardBgId
    const res  = await uploadImage(b64, 'mental_card_bg.jpg', 'mental')
    if (oldId && oldId !== res.id) deleteImage([oldId]).catch(console.warn)
    form.cardBgType  = 'image'
    form.cardBgValue = res.url || b64
    form.cardBgId    = res.id  || ''
  } catch (err) {
    modal.error = err.message || 'อัปโหลดรูปไม่สำเร็จ'
  } finally {
    cardBgUploading.value = false
  }
}

function confirmDel(a) { delTarget.value = a; ui.openModal('admin-mental-del') }
async function doDelete() {
  deleting.value = true
  const target = delTarget.value
  try {
    if (target.cardBgId && target.cardBgType === 'image') deleteImage([target.cardBgId]).catch(console.warn)
    await deleteMentalAdvisor(target.id)
    advisors.value = advisors.value.filter(a => a.id !== target.id)
    delTarget.value = null
    ui.closeModal()
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

/* ── Card preview ── */
.mav-card-preview {
  background: linear-gradient(135deg, #FBBF24 0%, #FCD34D 40%, #FDE68A 100%);
  border: 2px solid #F59E0B; border-radius: 16px;
  padding: 14px; display: flex; align-items: center; gap: 12px;
  position: relative; overflow: hidden;
  margin-bottom: 10px;
  box-shadow: 0 4px 14px rgba(245,158,11,0.3);
  min-height: 72px;
}
.mav-card-emoji-scatter {
  position: absolute; inset: 0;
  pointer-events: none; z-index: 0; overflow: hidden;
  opacity: 0.38;
}
.mav-emoji-dot {
  position: absolute; font-size: 22px; line-height: 1;
  display: block; user-select: none;
}
.mav-card-preview-inner {
  position: relative; z-index: 1; display: flex; align-items: center; gap: 12px; width: 100%;
}
.mav-card-av {
  width: 48px; height: 48px; border-radius: 50%; background: #F59E0B;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 900; color: white;
  border: 2px solid white; flex-shrink: 0;
}
.mav-card-pv-name { font-size: 13px; font-weight: 900; color: #78350F; }
.mav-card-pv-role { font-size: 11px; color: #92400E; margin-top: 2px; }
.mav-card-pv-light { color: white !important; text-shadow: 0 1px 4px rgba(0,0,0,0.4); }

/* Type tabs */
.mav-bg-tabs { display: flex; gap: 4px; margin-bottom: 10px; flex-wrap: wrap; }
.mav-bg-tab {
  padding: 5px 11px; border-radius: 8px; border: 1.5px solid #E5E7EB;
  font-size: 12px; font-weight: 700; color: #6B7280;
  background: white; cursor: pointer; transition: all 0.12s;
}
.mav-bg-tab.active { background: #EEF2FF; color: #4F46E5; border-color: #C7D2FE; }

/* Color swatches */
.mav-swatch-grid { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; }
.mav-swatch {
  width: 36px; height: 36px; border-radius: 50%;
  border: 2.5px solid transparent; cursor: pointer;
  transition: transform 0.12s, border-color 0.12s;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}
.mav-swatch:hover { transform: scale(1.15); }
.mav-swatch.selected { border-color: #1F2937; transform: scale(1.15); }

/* Emoji grid */
.mav-emoji-grid { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 4px; }
.mav-emoji-btn {
  width: 38px; height: 38px; border-radius: 10px; border: 2px solid #E5E7EB;
  font-size: 20px; display: flex; align-items: center; justify-content: center;
  cursor: pointer; background: white; transition: all 0.12s;
}
.mav-emoji-btn:hover { background: #F3F4F6; transform: scale(1.1); }
.mav-emoji-btn.selected { border-color: #6366F1; background: #EEF2FF; }
.mav-emoji-clear { font-size: 13px; color: #9CA3AF; }
.mav-emoji-clear.selected { border-color: #9CA3AF; background: #F3F4F6; color: #6B7280; }

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
