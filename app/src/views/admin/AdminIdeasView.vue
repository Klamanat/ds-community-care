<template>
  <div>
    <AdminPageHeader title="💡 ไอเดีย" sub="Ideas · สร้างสรรค์จากทีม">
      <span class="al-badge al-badge-blue">{{ filtered.length }} รายการ</span>
    </AdminPageHeader>

    <main class="al-main">
      <!-- Filter chips -->
      <div class="al-filters">
        <button
          v-for="f in FILTERS" :key="f.val"
          class="al-chip"
          :class="{ active: filter === f.val }"
          @click="filter = f.val"
        >{{ f.label }}</button>
      </div>

      <div class="al-body">
        <div class="al-card">
          <div v-if="loading" class="al-loading-skeletons">
            <SkeletonCard height="68px" />
            <SkeletonCard height="68px" />
            <SkeletonCard height="68px" />
          </div>
          <EmptyState v-else-if="!filtered.length" title="ไม่มีข้อมูล" sub="ยังไม่มีรายการ" />

          <div v-else>
            <div class="al-item fade-in" v-for="r in filtered" :key="r.id" @click="handleRippleClick">
              <div class="al-item-body">
                <div class="al-item-title">{{ r.title }}</div>
                <div class="al-item-sub">{{ r.category }} · {{ r.submitterName }}</div>
                <div class="al-item-meta">
                  <span class="al-badge" :class="badgeClass(r.status)">{{ statusLabel(r.status) }}</span>
                  <span>{{ formatDate(r.createdAt) }}</span>
                </div>
              </div>
              <div class="al-item-actions" @click.stop>
                <button class="al-btn al-btn-edit" @click="openDetail(r)">ดู</button>
                <button class="al-btn al-btn-delete" @click="confirmDelete(r)">ลบ</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Detail Modal -->
    <BaseModal padded modal-id="admin-ideas-detail" sheet-class="modal-sheet-lg">
      <div class="al-modal-title">💡 {{ detailTarget?.title }}</div>
      <div class="text-xs text-app-light mb-3">
        {{ detailTarget?.category }} · {{ detailTarget?.submitterName }} · {{ formatDate(detailTarget?.createdAt) }}
      </div>
      <div class="al-msg-preview">{{ detailTarget?.detail || '(ไม่มีรายละเอียดเพิ่มเติม)' }}</div>
      <div class="al-form-row">
        <label class="al-form-label">เปลี่ยน Status</label>
        <select class="al-form-select" v-model="detailStatus">
          <option value="pending">⏳ Pending</option>
          <option value="approved">✅ Approved</option>
          <option value="rejected">❌ Rejected</option>
        </select>
      </div>
      <div class="al-modal-footer">
        <button class="al-btn al-btn-cancel" @click="ui.closeModal()">ปิด</button>
        <button class="al-btn al-btn-save" :disabled="saving" @click="saveStatus">
          {{ saving ? 'กำลังบันทึก...' : '✅ บันทึก Status' }}
        </button>
      </div>
    </BaseModal>

    <!-- Delete Confirm -->
    <BaseModal padded modal-id="admin-ideas-del">
      <div class="al-modal-title">🗑️ ยืนยันการลบ</div>
      <p class="text-sm text-app-mid mb-4">
        ลบไอเดีย "<strong>{{ delTarget?.title }}</strong>" ใช่หรือไม่?
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
import { ref, computed, onMounted } from 'vue'
import * as svc from '../../core/services/adminService.js'
import { useUiStore } from '../../core/stores/ui.js'
import AdminPageHeader from './AdminPageHeader.vue'
import BaseModal from '../../shared/components/BaseModal.vue'
import SkeletonCard from '../../shared/components/SkeletonCard.vue'
import EmptyState from '../../shared/components/EmptyState.vue'
import { useRipple } from '../../core/composables/useRipple.js'
import { useFadeIn } from '../../core/composables/useFadeIn.js'

const ui = useUiStore()
const { handleRippleClick } = useRipple()
useFadeIn('.fade-in')

const rows    = ref([])
const loading = ref(true)
const filter  = ref('all')
const saving  = ref(false)

const detailTarget = ref(null)
const detailStatus = ref('pending')
const delTarget    = ref(null)
const deleting     = ref(false)

const FILTERS = [
  { val:'all',      label:'ทั้งหมด' },
  { val:'pending',  label:'⏳ Pending' },
  { val:'approved', label:'✅ Approved' },
  { val:'rejected', label:'❌ Rejected' },
]

const filtered = computed(() =>
  filter.value === 'all' ? rows.value : rows.value.filter(r => r.status === filter.value)
)

function formatDate(s) {
  if (!s) return '-'
  const d = new Date(s)
  if (isNaN(d)) return s
  return `${d.getDate()} ${['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'][d.getMonth()]} ${d.getFullYear()+543}`
}

function badgeClass(s) {
  if (s === 'approved') return 'al-badge-approved'
  if (s === 'rejected') return 'al-badge-rejected'
  return 'al-badge-pending'
}
function statusLabel(s) {
  if (s === 'approved') return '✅ Approved'
  if (s === 'rejected') return '❌ Rejected'
  return '⏳ Pending'
}

onMounted(async () => {
  try {
    rows.value = await svc.getAdminIdeas()
  } catch {
    rows.value = []
  } finally {
    loading.value = false
  }
})

function openDetail(r) {
  detailTarget.value = r
  detailStatus.value = r.status
  ui.openModal('admin-ideas-detail')
}

async function saveStatus() {
  saving.value = true
  try {
    await svc.updateIdea(detailTarget.value.id, detailStatus.value)
    detailTarget.value.status = detailStatus.value
    ui.closeModal()
    detailTarget.value = null
  } catch { } finally {
    saving.value = false
  }
}

function confirmDelete(r) {
  delTarget.value = r
  ui.openModal('admin-ideas-del')
}

async function doDelete() {
  deleting.value = true
  try {
    await svc.deleteRow('Ideas', 'id', delTarget.value.id)
    rows.value = rows.value.filter(r => r.id !== delTarget.value.id)
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
