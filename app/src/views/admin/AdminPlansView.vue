<template>
  <div>
    <main class="al-main">

      <!-- Header -->
      <div class="al-page-header">
        <h2 class="al-page-title">📋 Monthly Plans</h2>
        <button class="al-btn al-btn-primary" @click="openAdd">+ เพิ่มแผน</button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="al-loading">⏳ กำลังโหลด...</div>

      <!-- Empty -->
      <div v-else-if="!plans.length" class="al-empty">
        📭 ยังไม่มี Monthly Plan<br>
        <span style="font-size:12px;">กดปุ่ม "+ เพิ่มแผน" เพื่อเพิ่มแผนประจำเดือน</span>
      </div>

      <!-- Plan list -->
      <div v-else class="al-card">
        <div class="al-card-header">
          <span class="al-card-title">แผนรายเดือน</span>
          <span class="al-badge al-badge-blue">{{ plans.length }} รายการ</span>
        </div>
        <div
          v-for="p in plans"
          :key="p.id"
          class="al-item"
        >
          <!-- Poster thumbnail -->
          <div class="plan-thumb-wrap">
            <img
              v-if="p.posterUrl"
              :src="p.posterUrl"
              class="plan-thumb"
              @error="e => e.target.style.display='none'"
            />
            <div v-else class="plan-thumb-placeholder">🖼️</div>
          </div>

          <!-- Info -->
          <div class="al-item-body">
            <div class="al-item-title">{{ p.title || '(ไม่มีชื่อ)' }}</div>
            <div class="al-item-sub" style="margin-top:2px;">
              <span class="al-badge al-badge-month">{{ formatYearMonth(p.yearMonth) }}</span>
            </div>
            <div v-if="p.description" class="plan-desc">{{ p.description }}</div>
          </div>

          <!-- Actions -->
          <div class="al-item-actions">
            <button class="al-btn al-btn-edit" @click="openEdit(p)">✏️ แก้ไข</button>
            <button class="al-btn al-btn-delete" @click="confirmDelete(p)">🗑 ลบ</button>
          </div>
        </div>
      </div>

    </main>

    <!-- Add/Edit Modal -->
    <div v-if="modal.open" class="al-modal-overlay" @click.self="modal.open = false">
      <div class="al-modal">
        <div class="al-modal-header">
          <div class="al-modal-title">{{ modal.mode === 'add' ? '+ เพิ่มแผนใหม่' : '✏️ แก้ไขแผน' }}</div>
          <button class="al-modal-close" @click="modal.open = false">✕</button>
        </div>

        <div class="al-modal-body">

          <!-- Error -->
          <div v-if="modal.error" class="al-error" style="margin-bottom:12px;">{{ modal.error }}</div>

          <!-- Month/Year -->
          <div class="al-form-row">
            <label class="al-form-label">เดือน / ปี</label>
            <div style="display:flex;gap:8px;">
              <select v-model="form.month" class="al-form-select" style="flex:1;">
                <option v-for="m in MONTHS" :key="m.idx" :value="m.idx">{{ m.label }}</option>
              </select>
              <select v-model="form.year" class="al-form-select" style="width:90px;">
                <option v-for="y in YEARS" :key="y" :value="y">{{ y }}</option>
              </select>
            </div>
          </div>

          <!-- Title -->
          <div class="al-form-row">
            <label class="al-form-label">ชื่อ / หัวข้อแผน</label>
            <input
              v-model="form.title"
              class="al-form-input"
              placeholder="เช่น แผนกิจกรรมมีนาคม 2026"
              maxlength="200"
            />
          </div>

          <!-- Description -->
          <div class="al-form-row">
            <label class="al-form-label">คำอธิบาย</label>
            <textarea
              v-model="form.description"
              class="al-form-textarea"
              rows="3"
              placeholder="รายละเอียดแผนประจำเดือน..."
              maxlength="1000"
            ></textarea>
          </div>

          <!-- Poster upload -->
          <div class="al-form-row">
            <label class="al-form-label">รูป Poster</label>
            <div class="plan-upload-area">
              <img
                v-if="imgPreview"
                :src="imgPreview"
                class="plan-preview-img"
                @error="e => e.target.style.display='none'"
              />
              <div v-else class="plan-upload-placeholder">
                <span style="font-size:28px;">🖼️</span>
                <span style="font-size:12px;color:#9CA3AF;margin-top:4px;">ยังไม่มีรูป</span>
              </div>
              <label class="al-btn al-btn-edit" style="cursor:pointer;margin-top:8px;">
                {{ imgUploading ? '⏳ กำลังอัปโหลด...' : '📤 เลือกรูป' }}
                <input
                  type="file"
                  accept="image/*"
                  style="display:none;"
                  :disabled="imgUploading"
                  @change="onImgChange"
                />
              </label>
              <div v-if="form.posterUrl && !imgUploading" style="font-size:10px;color:#6B7280;margin-top:4px;word-break:break-all;">
                {{ form.posterUrl.slice(0, 60) }}...
              </div>
            </div>
          </div>

        </div>

        <div class="al-modal-footer">
          <button class="al-btn al-btn-cancel" @click="modal.open = false">ยกเลิก</button>
          <button
            class="al-btn al-btn-save"
            :disabled="saving || imgUploading"
            @click="save"
          >{{ saving ? 'กำลังบันทึก...' : 'บันทึก' }}</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirm Modal -->
    <div v-if="delTarget" class="al-modal-overlay" @click.self="delTarget = null">
      <div class="al-modal" style="max-width:360px;">
        <div class="al-modal-header">
          <div class="al-modal-title">🗑 ยืนยันการลบ</div>
        </div>
        <div class="al-modal-body">
          <p style="font-size:13px;color:#4B5563;">
            ลบแผน <strong>{{ delTarget.title || formatYearMonth(delTarget.yearMonth) }}</strong> ?<br>
            <span style="font-size:12px;color:#9CA3AF;">การดำเนินการนี้ไม่สามารถยกเลิกได้</span>
          </p>
        </div>
        <div class="al-modal-footer">
          <button class="al-btn al-btn-cancel" @click="delTarget = null">ยกเลิก</button>
          <button class="al-btn al-btn-delete" :disabled="deleting" @click="doDelete">
            {{ deleting ? 'กำลังลบ...' : 'ยืนยันลบ' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import * as svc from '../../services/plansService.js'
import { resizeToBase64 } from '../../composables/useImageCompress.js'
import { useUiStore } from '../../stores/ui.js'

const ui = useUiStore()

// ── Constants ─────────────────────────────────────────────────
const NOW = new Date()
const CUR_YEAR  = NOW.getFullYear()
const CUR_MONTH = NOW.getMonth() + 1  // 1-12

const YEARS = [CUR_YEAR - 1, CUR_YEAR, CUR_YEAR + 1]

const MONTHS = [
  { idx: '01', label: 'มกราคม'   },
  { idx: '02', label: 'กุมภาพันธ์' },
  { idx: '03', label: 'มีนาคม'   },
  { idx: '04', label: 'เมษายน'   },
  { idx: '05', label: 'พฤษภาคม'  },
  { idx: '06', label: 'มิถุนายน'  },
  { idx: '07', label: 'กรกฎาคม'  },
  { idx: '08', label: 'สิงหาคม'   },
  { idx: '09', label: 'กันยายน'   },
  { idx: '10', label: 'ตุลาคม'   },
  { idx: '11', label: 'พฤศจิกายน' },
  { idx: '12', label: 'ธันวาคม'  },
]

const MONTH_NAMES = Object.fromEntries(MONTHS.map(m => [m.idx, m.label]))

function formatYearMonth(ym) {
  if (!ym) return ''
  const [y, m] = ym.split('-')
  return `${MONTH_NAMES[m] || m} ${Number(y) + 543}`
}

// ── State ─────────────────────────────────────────────────────
const plans   = ref([])
const loading = ref(true)
const saving  = ref(false)
const deleting = ref(false)
const delTarget = ref(null)

const modal = reactive({ open: false, mode: 'add', error: '' })
const form  = reactive({ id: '', month: String(CUR_MONTH).padStart(2,'0'), year: CUR_YEAR, title: '', description: '', posterUrl: '', posterId: '' })

const imgPreview  = ref('')
const imgUploading = ref(false)

// ── Load ──────────────────────────────────────────────────────
async function loadPlans() {
  loading.value = true
  try {
    plans.value = await svc.fetchAll()
  } catch (e) {
    ui.showToast('โหลดข้อมูลไม่สำเร็จ')
  } finally {
    loading.value = false
  }
}

onMounted(loadPlans)

// ── Modal helpers ─────────────────────────────────────────────
function resetForm() {
  form.id = ''
  form.month = String(CUR_MONTH).padStart(2,'0')
  form.year  = CUR_YEAR
  form.title = ''
  form.description = ''
  form.posterUrl = ''
  form.posterId  = ''
  imgPreview.value = ''
  modal.error = ''
}

function openAdd() {
  resetForm()
  modal.mode = 'add'
  modal.open = true
}

function openEdit(p) {
  const [y, m] = (p.yearMonth || '').split('-')
  form.id          = p.id
  form.year        = Number(y) || CUR_YEAR
  form.month       = m || String(CUR_MONTH).padStart(2,'0')
  form.title       = p.title
  form.description = p.description
  form.posterUrl   = p.posterUrl
  form.posterId    = p.posterId
  imgPreview.value = p.posterUrl
  modal.error = ''
  modal.mode = 'edit'
  modal.open = true
}

// ── Image upload ──────────────────────────────────────────────
async function onImgChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  imgUploading.value = true
  modal.error = ''
  try {
    const b64 = await resizeToBase64(file, 1200, 800, 0.88)
    imgPreview.value = b64
    const res = await svc.uploadImage(b64, file.name)
    form.posterId  = res.id
    form.posterUrl = res.url || ''
    imgPreview.value = res.url || b64
  } catch (err) {
    modal.error = 'อัปโหลดรูปล้มเหลว: ' + (err.message || 'ลองใหม่')
    imgPreview.value = ''
  } finally {
    imgUploading.value = false
    e.target.value = ''
  }
}

// ── Save (add/edit) ───────────────────────────────────────────
async function save() {
  if (!form.title.trim()) { modal.error = 'กรุณากรอกชื่อแผน'; return }
  modal.error = ''
  saving.value = true

  const yearMonth = `${form.year}-${form.month}`
  const fields = {
    yearMonth,
    title:       form.title.trim(),
    description: form.description.trim(),
    posterUrl:   form.posterUrl,
    posterId:    form.posterId,
  }

  try {
    if (modal.mode === 'add') {
      const created = await svc.addPlan(fields)
      plans.value.unshift(created)
      ui.showToast('เพิ่มแผนสำเร็จ ✓')
    } else {
      const updated = await svc.updatePlan(form.id, fields)
      const idx = plans.value.findIndex(p => p.id === form.id)
      if (idx >= 0) plans.value[idx] = updated
      ui.showToast('แก้ไขแผนสำเร็จ ✓')
    }
    modal.open = false
  } catch (err) {
    modal.error = err.message || 'บันทึกไม่สำเร็จ'
  } finally {
    saving.value = false
  }
}

// ── Delete ────────────────────────────────────────────────────
function confirmDelete(p) {
  delTarget.value = p
}

async function doDelete() {
  if (!delTarget.value) return
  deleting.value = true
  try {
    await svc.deletePlan(delTarget.value.id)
    plans.value = plans.value.filter(p => p.id !== delTarget.value.id)
    ui.showToast('ลบแผนแล้ว')
    delTarget.value = null
  } catch (err) {
    ui.showToast('ลบไม่สำเร็จ: ' + (err.message || 'ลองใหม่'))
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
@import './admin.css';

.plan-thumb-wrap {
  width: 80px;
  height: 56px;
  border-radius: 8px;
  overflow: hidden;
  background: #F3F4F6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.plan-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.plan-thumb-placeholder {
  font-size: 22px;
  color: #D1D5DB;
}
.plan-desc {
  font-size: 11px;
  color: #6B7280;
  margin-top: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.plan-upload-area {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}
.plan-preview-img {
  width: 100%;
  max-height: 200px;
  object-fit: contain;
  border-radius: 10px;
  border: 1px solid #E5E7EB;
  background: #F9FAFB;
}
.plan-upload-placeholder {
  width: 100%;
  height: 120px;
  border: 2px dashed #E5E7EB;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #F9FAFB;
}
</style>
