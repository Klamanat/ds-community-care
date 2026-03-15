<template>
  <!-- Site Visit cards -->
  <div class="al-card">
    <div v-if="loading" class="al-loading">⏳ กำลังโหลด...</div>
    <div v-else-if="!rows.length" class="al-empty">📭 ยังไม่มีสถานที่</div>
    <div v-else>
      <div class="al-item" v-for="s in rows" :key="s.id">
        <div class="atr-dot" :style="{ background: s.color || '#0EA5E9' }"></div>
        <div class="al-item-body">
          <div class="al-item-title">{{ s.title }}</div>
          <div v-if="s.instructor" class="al-item-sub">👤 {{ s.instructor }}</div>
          <div class="al-item-meta">
            <span class="al-badge al-badge-blue">🗳️ {{ s.voteCount || 0 }} โหวต</span>
          </div>
        </div>
        <div class="al-item-actions">
          <button class="al-btn al-btn-edit"   @click="openVoters(s)">👥 ผู้โหวต</button>
          <button class="al-btn al-btn-edit"   @click="$emit('edit', s)">แก้ไข</button>
          <button class="al-btn al-btn-delete" @click="$emit('delete', s)">ลบ</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Suggestions -->
  <div class="atr-sug-hd">
    <span>💡 ข้อเสนอแนะจากพนักงาน</span>
    <span class="al-badge al-badge-pending">{{ suggestions.length }}</span>
  </div>
  <div v-if="sugLoading" class="al-loading" style="padding:12px 0;">⏳</div>
  <div v-else-if="!suggestions.length" class="atr-sug-empty">ยังไม่มีข้อเสนอแนะ</div>
  <div v-else class="al-card">
    <div v-for="s in suggestions" :key="s.id" class="atr-sug-row">
      <div class="atr-sug-av">{{ (s.employeeName || '?').charAt(0) }}</div>
      <div style="flex:1;min-width:0;">
        <div class="atr-sug-top">
          <span class="atr-sug-name">{{ s.employeeName }}</span>
          <span class="atr-sug-date">{{ fmtDate(s.createdAt) }}</span>
        </div>
        <div class="atr-sug-text">{{ s.suggestion }}</div>
      </div>
    </div>
  </div>

  <!-- Voters Modal -->
  <div v-if="votersOpen" class="al-modal-overlay" @click.self="votersOpen = false">
    <div class="al-modal" style="max-height:80vh;overflow-y:auto;">
      <div class="al-modal-handle"></div>
      <div class="al-modal-title">👥 ผู้โหวต — {{ votersSite?.title }}</div>
      <div v-if="votersLoading" class="al-loading">⏳ กำลังโหลด...</div>
      <div v-else-if="!voters.length" class="al-empty">ยังไม่มีผู้โหวต</div>
      <div v-else>
        <div style="font-size:12px;color:#6B7280;margin-bottom:10px;">{{ voters.length }} คน</div>
        <div v-for="(v, i) in voters" :key="v.id" class="atr-voter-row">
          <span class="atr-voter-num">{{ i + 1 }}</span>
          <span class="atr-voter-name">{{ v.employeeName || v.employeeId }}</span>
          <span class="atr-voter-date">{{ fmtDate(v.votedAt) }}</span>
        </div>
      </div>
      <div class="al-modal-footer">
        <button class="al-btn al-btn-cancel" @click="votersOpen = false">ปิด</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import * as svc from '../../../services/trainingService.js'

defineProps({
  rows:       { type: Array,   default: () => [] },
  loading:    { type: Boolean, default: false },
  suggestions:{ type: Array,   default: () => [] },
  sugLoading: { type: Boolean, default: false },
})
defineEmits(['edit', 'delete'])

// ── Voters ────────────────────────────────────────────────────────────────────
const votersOpen    = ref(false)
const votersSite    = ref(null)
const voters        = ref([])
const votersLoading = ref(false)

async function openVoters(site) {
  votersSite.value    = site
  votersOpen.value    = true
  votersLoading.value = true
  voters.value        = []
  try {
    const all = await svc.adminFetchSiteVotes()
    voters.value = all.filter(v => v.siteId === site.id)
  } catch {
    voters.value = []
  } finally {
    votersLoading.value = false
  }
}

function fmtDate(d) {
  if (!d) return ''
  const dt = new Date(d)
  return isNaN(dt) ? d : dt.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
}
</script>

<style scoped>
@import '../admin.css';

.atr-dot {
  width: 10px; height: 10px;
  border-radius: 50%; flex-shrink: 0; margin-right: 2px;
}

/* Suggestions */
.atr-sug-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px;
  background: linear-gradient(135deg, #FFFBEB, #FEF3C7);
  border: 1.5px solid #FCD34D; border-radius: 14px;
  font-size: 13px; font-weight: 800; color: #92400E;
}
.atr-sug-empty {
  text-align: center; padding: 20px;
  font-size: 13px; color: #9CA3AF;
  background: #FFFBEB; border-radius: 12px;
  border: 1.5px dashed #FCD34D;
}
.atr-sug-row {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 12px 16px; border-bottom: 1px solid #F7F7FF;
}
.atr-sug-row:last-child { border-bottom: none; }
.atr-sug-av {
  width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, #FCD34D, #F59E0B);
  color: #fff; font-size: 13px; font-weight: 900;
  display: flex; align-items: center; justify-content: center;
}
.atr-sug-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px; }
.atr-sug-name { font-size: 13px; font-weight: 700; color: #111827; }
.atr-sug-date { font-size: 11px; color: #9CA3AF; }
.atr-sug-text { font-size: 13px; color: #374151; line-height: 1.5; }

/* Voters */
.atr-voter-row {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 4px; border-bottom: 1px solid #F3F4F6; font-size: 13px;
}
.atr-voter-row:last-child { border-bottom: none; }
.atr-voter-num  { width: 22px; font-size: 11px; color: #9CA3AF; font-weight: 700; flex-shrink: 0; }
.atr-voter-name { flex: 1; font-weight: 600; color: #111827; }
.atr-voter-date { font-size: 11px; color: #9CA3AF; flex-shrink: 0; }
</style>
