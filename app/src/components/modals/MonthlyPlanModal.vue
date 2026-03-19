<template>
  <BaseModal modal-id="modal-monthly-plan" sheet-class="modal-sheet--monthly-plan">

    <!-- Header -->
    <div class="mpl-header">
      <div class="modal-handle"></div>
      <div class="mpl-header-text">
        <div class="mpl-header-icon">📋</div>
        <div>
          <div class="mpl-header-title">Monthly Plan</div>
          <div class="mpl-header-sub">แผนกิจกรรมประจำเดือน</div>
        </div>
      </div>
    </div>

    <div class="modal-body-scroll">

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

      <!-- Loading -->
      <div v-if="loading" class="mpl-state">
        <div class="bday-spinner"></div>
        <div class="mpl-state-text">กำลังโหลด...</div>
      </div>

      <!-- No plan -->
      <div v-else-if="!currentPlan" class="mpl-state">
        <div style="font-size:40px;margin-bottom:8px;">📭</div>
        <div class="mpl-state-text">ยังไม่มีแผนเดือน {{ monthName(selectedMonth) }}</div>
        <div style="font-size:12px;color:#9CA3AF;margin-top:4px;">ติดตามได้เร็วๆ นี้นะคะ</div>
      </div>

      <!-- Plan content -->
      <template v-else>

        <!-- Poster image -->
        <div class="mpl-poster-wrap">
          <img
            v-if="currentPlan.posterUrl"
            :src="currentPlan.posterUrl"
            class="mpl-poster"
            @error="e => e.target.style.display='none'"
          />
          <div v-else class="mpl-poster-placeholder">🖼️</div>
        </div>

        <!-- Title + description -->
        <div class="mpl-info">
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

// ── Constants ──────────────────────────────────────────────────
const NOW = new Date()
const CUR_MONTH = NOW.getMonth() + 1   // 1–12
const thaiYear  = NOW.getFullYear() + 543

const MONTHS = [
  { idx: 1,  short: 'ม.ค.',   name: 'มกราคม'    },
  { idx: 2,  short: 'ก.พ.',   name: 'กุมภาพันธ์'  },
  { idx: 3,  short: 'มี.ค.',  name: 'มีนาคม'    },
  { idx: 4,  short: 'เม.ย.',  name: 'เมษายน'    },
  { idx: 5,  short: 'พ.ค.',   name: 'พฤษภาคม'   },
  { idx: 6,  short: 'มิ.ย.',  name: 'มิถุนายน'   },
  { idx: 7,  short: 'ก.ค.',   name: 'กรกฎาคม'   },
  { idx: 8,  short: 'ส.ค.',   name: 'สิงหาคม'    },
  { idx: 9,  short: 'ก.ย.',   name: 'กันยายน'    },
  { idx: 10, short: 'ต.ค.',   name: 'ตุลาคม'    },
  { idx: 11, short: 'พ.ย.',   name: 'พฤศจิกายน'  },
  { idx: 12, short: 'ธ.ค.',   name: 'ธันวาคม'   },
]

function monthName(idx) {
  return MONTHS.find(m => m.idx === idx)?.name || ''
}

// ── State ──────────────────────────────────────────────────────
const plans         = ref([])
const loading       = ref(true)
const selectedMonth = ref(CUR_MONTH)

// ── Derived ────────────────────────────────────────────────────
// year_month stored as "YYYY-MM" — match against current calendar year
const currentYear = NOW.getFullYear()

function planKey(monthIdx) {
  return `${currentYear}-${String(monthIdx).padStart(2, '0')}`
}

const currentPlan = computed(() =>
  plans.value.find(p => p.yearMonth === planKey(selectedMonth.value)) || null
)

function hasPlan(monthIdx) {
  return plans.value.some(p => p.yearMonth === planKey(monthIdx))
}

// ── Load ────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    plans.value = await fetchAll()
  } catch { /* show empty state */ } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* ── Header ── */
.mpl-header {
  background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
  padding: 0 16px 16px;
  border-radius: 28px 28px 0 0;
  flex-shrink: 0;
}
.modal-handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255,255,255,0.4);
  margin: 14px auto 12px;
}
.mpl-header-text {
  display: flex;
  align-items: center;
  gap: 10px;
}
.mpl-header-icon { font-size: 28px; }
.mpl-header-title {
  font-size: 17px;
  font-weight: 900;
  color: white;
  line-height: 1.2;
}
.mpl-header-sub {
  font-size: 12px;
  color: rgba(255,255,255,0.7);
}

/* ── Month strip ── */
.mpl-month-strip {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 12px 16px 4px;
}
.mpl-month-strip::-webkit-scrollbar { display: none; }

.mpl-month-btn {
  position: relative;
  flex-shrink: 0;
  padding: 6px 10px;
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

/* ── States ── */
.mpl-state {
  text-align: center;
  padding: 48px 24px;
}
.mpl-state-text {
  font-size: 14px;
  font-weight: 700;
  color: #9CA3AF;
}

/* ── Poster ── */
.mpl-poster-wrap {
  padding: 12px 16px 0;
}
.mpl-poster {
  width: 100%;
  border-radius: 14px;
  display: block;
  object-fit: contain;
  max-height: 70vw;
  background: #F3F4F6;
}
.mpl-poster-placeholder {
  width: 100%;
  height: 160px;
  border-radius: 14px;
  background: #F3F4F6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: #D1D5DB;
}

/* ── Info ── */
.mpl-info {
  padding: 14px 16px 24px;
}
.mpl-month-badge {
  display: inline-block;
  background: #EEF2FF;
  color: #4F46E5;
  font-size: 11px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 20px;
  margin-bottom: 8px;
}
.mpl-title {
  font-size: 16px;
  font-weight: 900;
  color: #111827;
  margin-bottom: 6px;
  line-height: 1.4;
}
.mpl-desc {
  font-size: 13px;
  color: #4B5563;
  line-height: 1.65;
  white-space: pre-wrap;
}
</style>
