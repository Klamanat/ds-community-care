<template>
  <BaseModal modal-id="modal-monthly-plan" sheet-class="modal-sheet--monthly-plan">

    <!-- Header -->
    <div class="mpl-header">
      <div class="mpl-handle"></div>
      <div class="mpl-header-text">
        <div class="mpl-header-icon">📋</div>
        <div>
          <div class="mpl-header-title">Monthly Plan</div>
          <div class="mpl-header-sub">ตารางเข้าออฟฟิศรายเดือน</div>
        </div>
      </div>
    </div>

    <!-- Month strip -->
    <div class="mpl-month-strip">
      <button
        v-for="m in MONTHS"
        :key="m.idx"
        class="mpl-month-btn"
        :class="{ active: selectedMonth === m.idx, 'has-plan': hasPlan(m.idx) }"
        @click="selectedMonth = m.idx"
      >
        {{ m.short }}
        <span v-if="hasPlan(m.idx)" class="mpl-dot"></span>
      </button>
    </div>

    <!-- Body — fills remaining height, no scroll -->
    <div class="mpl-body">

      <!-- Loading -->
      <div v-if="loading" class="mpl-state">
        <div class="bday-spinner"></div>
        <div class="mpl-state-text">กำลังโหลด...</div>
      </div>

      <!-- No plan -->
      <div v-else-if="!currentPlan" class="mpl-state">
        <div style="font-size:44px;margin-bottom:8px;">📭</div>
        <div class="mpl-state-text">ยังไม่มีแผนเดือน {{ monthName(selectedMonth) }}</div>
        <div style="font-size:12px;color:#9CA3AF;margin-top:4px;">ติดตามได้เร็วๆ นี้นะคะ</div>
      </div>

      <!-- Plan content -->
      <template v-else>

        <!-- Poster — fills all remaining height -->
        <div class="mpl-poster-area">
          <img
            v-if="currentPlan.posterUrl"
            :src="currentPlan.posterUrl"
            class="mpl-poster"
            @error="e => e.target.style.display='none'"
          />
          <div v-else class="mpl-poster-placeholder">🖼️</div>
        </div>

        <!-- Info strip at bottom -->
        <div v-if="currentPlan.title || currentPlan.description" class="mpl-info">
          <div class="mpl-month-badge">{{ monthName(selectedMonth) }} {{ thaiYear }}</div>
          <div v-if="currentPlan.title" class="mpl-title">{{ currentPlan.title }}</div>
          <div v-if="currentPlan.description" class="mpl-desc">{{ currentPlan.description }}</div>
        </div>

      </template>
    </div>

  </BaseModal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import BaseModal from '../shared/BaseModal.vue'
import { fetchAll } from '../../services/plansService.js'

const NOW       = new Date()
const CUR_MONTH = NOW.getMonth() + 1
const thaiYear  = NOW.getFullYear() + 543
const currentYear = NOW.getFullYear()

const MONTHS = [
  { idx: 1,  short: 'ม.ค.',  name: 'มกราคม'    },
  { idx: 2,  short: 'ก.พ.',  name: 'กุมภาพันธ์'  },
  { idx: 3,  short: 'มี.ค.', name: 'มีนาคม'    },
  { idx: 4,  short: 'เม.ย.', name: 'เมษายน'    },
  { idx: 5,  short: 'พ.ค.',  name: 'พฤษภาคม'   },
  { idx: 6,  short: 'มิ.ย.', name: 'มิถุนายน'   },
  { idx: 7,  short: 'ก.ค.',  name: 'กรกฎาคม'   },
  { idx: 8,  short: 'ส.ค.',  name: 'สิงหาคม'    },
  { idx: 9,  short: 'ก.ย.',  name: 'กันยายน'    },
  { idx: 10, short: 'ต.ค.',  name: 'ตุลาคม'    },
  { idx: 11, short: 'พ.ย.',  name: 'พฤศจิกายน'  },
  { idx: 12, short: 'ธ.ค.',  name: 'ธันวาคม'   },
]

function monthName(idx) { return MONTHS.find(m => m.idx === idx)?.name || '' }
function planKey(idx)    { return `${currentYear}-${String(idx).padStart(2, '0')}` }

const plans         = ref([])
const loading       = ref(true)
const selectedMonth = ref(CUR_MONTH)

const currentPlan = computed(() =>
  plans.value.find(p => p.yearMonth === planKey(selectedMonth.value)) || null
)
function hasPlan(idx) {
  return plans.value.some(p => p.yearMonth === planKey(idx))
}

onMounted(async () => {
  try { plans.value = await fetchAll() } catch { } finally { loading.value = false }
})
</script>

<style scoped>
/* ── Header ── */
.mpl-header {
  background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
  padding: 0 16px 12px;
  border-radius: 28px 28px 0 0;
  flex-shrink: 0;
}
.mpl-handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255,255,255,0.4);
  margin: 12px auto 10px;
}
.mpl-header-text {
  display: flex;
  align-items: center;
  gap: 10px;
}
.mpl-header-icon { font-size: 26px; }
.mpl-header-title {
  font-size: 16px;
  font-weight: 900;
  color: white;
  line-height: 1.2;
}
.mpl-header-sub {
  font-size: 11px;
  color: rgba(255,255,255,0.7);
}

/* ── Month strip ── */
.mpl-month-strip {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 10px 16px 6px;
  flex-shrink: 0;
  background: white;
}
.mpl-month-strip::-webkit-scrollbar { display: none; }

.mpl-month-btn {
  position: relative;
  flex-shrink: 0;
  padding: 5px 9px;
  border-radius: 20px;
  border: 1.5px solid #E5E7EB;
  background: #F9FAFB;
  font-size: 11px;
  font-weight: 700;
  color: #6B7280;
  cursor: pointer;
  font-family: 'Sarabun', sans-serif;
  transition: all 0.15s;
}
.mpl-month-btn.active {
  background: #4F46E5;
  border-color: #4F46E5;
  color: white;
}
.mpl-month-btn.has-plan:not(.active) {
  border-color: #A5B4FC;
  color: #4F46E5;
  background: #EEF2FF;
}
.mpl-dot {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #10B981;
}
.mpl-month-btn.active .mpl-dot { background: rgba(255,255,255,0.8); }

/* ── Body — flex:1 fills remaining height ── */
.mpl-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

/* ── State (loading / empty) ── */
.mpl-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
}
.mpl-state-text {
  font-size: 14px;
  font-weight: 700;
  color: #9CA3AF;
}

/* ── Poster area — fills all available height ── */
.mpl-poster-area {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px 0;
  background: #F9FAFB;
}
.mpl-poster {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 10px;
  display: block;
}
.mpl-poster-placeholder {
  font-size: 56px;
  color: #D1D5DB;
}

/* ── Info strip ── */
.mpl-info {
  flex-shrink: 0;
  padding: 10px 16px 16px;
  background: white;
}
.mpl-month-badge {
  display: inline-block;
  background: #EEF2FF;
  color: #4F46E5;
  font-size: 10px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 20px;
  margin-bottom: 4px;
}
.mpl-title {
  font-size: 14px;
  font-weight: 900;
  color: #111827;
  line-height: 1.3;
}
.mpl-desc {
  font-size: 12px;
  color: #6B7280;
  margin-top: 2px;
  line-height: 1.5;
  white-space: pre-wrap;
}
</style>
