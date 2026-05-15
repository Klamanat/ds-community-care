<template>
  <div>
    <AdminPageHeader title="🎂 วันเกิด" sub="Birthday Management" />

    <main class="al-main">
      <div class="al-body">
      <div class="al-card">
        <div class="al-card-header">
          <span class="al-card-title">พนักงานทั้งหมด ({{ rows.length }})</span>
          <span class="text-xs text-app-light font-semibold">มีวันเกิด {{ birthdayCount }} คน</span>
        </div>

        <div v-if="loading" class="al-loading-skeletons">
          <SkeletonCard height="68px" />
          <SkeletonCard height="68px" />
          <SkeletonCard height="68px" />
        </div>
        <EmptyState v-else-if="rows.length === 0" title="ไม่มีข้อมูลพนักงาน" />
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
              <tr v-for="r in rows" :key="r.id" :class="{ 'opacity-50': !r.bdDate }">
                <td class="font-bold">{{ r.name }}</td>
                <td>{{ r.role }}</td>
                <td>{{ r.bdDate || '—' }}</td>
                <td>{{ r.bdDate ? monthName(monthFromDate(r.bdDate, r.monthIdx)) : '—' }}</td>
                <td class="flex gap-1.5">
                  <button class="al-btn al-btn-edit" @click="openEdit(r)">{{ r.bdDate ? 'แก้ไข' : 'ตั้งค่า' }}</button>
                  <button v-if="r.bdDate" class="al-btn al-btn-delete" @click="confirmDelete(r)">ลบ</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </main>

    <!-- Edit Modal -->
    <BaseModal padded modal-id="admin-bday-edit" sheet-class="modal-sheet-lg">
      <div class="al-modal-title">✏️ {{ form.bdDate ? 'แก้ไข' : 'ตั้งค่า' }}วันเกิด — {{ form.name }}</div>

      <div class="al-form-row">
        <label class="al-form-label">วันเกิด</label>
        <input v-model="dateInput" type="date" class="al-form-input" @change="onDateChange" />
        <div v-if="dateInput" class="text-xs text-app-light mt-1">{{ isoToThaiShort(dateInput) }}</div>
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

      <div v-if="modal.error" class="al-error">{{ modal.error }}</div>

      <div class="al-modal-footer">
        <button class="al-btn al-btn-cancel" @click="ui.closeModal()">ยกเลิก</button>
        <button class="al-btn al-btn-save" :disabled="modal.saving" @click="saveModal">
          {{ modal.saving ? 'กำลังบันทึก...' : 'บันทึก' }}
        </button>
      </div>
    </BaseModal>

    <!-- Delete Confirm -->
    <BaseModal padded modal-id="admin-bday-del">
      <div class="al-modal-title">🗑️ ยืนยันการลบ</div>
      <p class="text-sm text-app-mid mb-4">
        ลบข้อมูลวันเกิดของ "<strong>{{ delTarget?.name }}</strong>" ใช่หรือไม่?
      </p>
      <div class="al-modal-footer">
        <button class="al-btn al-btn-cancel" @click="ui.closeModal()">ยกเลิก</button>
        <button class="al-btn al-btn-delete" :disabled="deleting" @click="doDelete">
          {{ deleting ? 'กำลังลบ...' : 'ลบ' }}
        </button>
      </div>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import * as svc from '../../core/services/adminService.js'
import { useUiStore } from '../../core/stores/ui.js'
import AdminPageHeader from './AdminPageHeader.vue'
import BaseModal from '../../shared/components/BaseModal.vue'
import SkeletonCard from '../../shared/components/SkeletonCard.vue'
import EmptyState from '../../shared/components/EmptyState.vue'

const ui = useUiStore()

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

const modal     = reactive({ saving: false, error: '' })
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
  modal.error = ''
  ui.openModal('admin-bday-edit')
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
    ui.closeModal()
  } catch (e) {
    modal.error = e.message || 'เกิดข้อผิดพลาด'
  } finally {
    modal.saving = false
  }
}

function confirmDelete(r) {
  delTarget.value = r
  ui.openModal('admin-bday-del')
}

async function doDelete() {
  deleting.value = true
  try {
    await svc.updateRow('Employees', 'id', delTarget.value.id || delTarget.value.key, {
      monthIdx: '', bdDate: '', fallbackIdx: ''
    })
    const idx = rows.value.findIndex(r => (r.id || r.key) === (delTarget.value.id || delTarget.value.key))
    if (idx >= 0) rows.value[idx] = { ...rows.value[idx], bdDate: '', monthIdx: '', fallbackIdx: '' }
    ui.closeModal()
    delTarget.value = null
  } catch { } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
@import './admin.css';
</style>
