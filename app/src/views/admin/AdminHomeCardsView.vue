<template>
  <main class="al-main">

    <div class="al-page-header">
      <h1 class="al-page-title">🏠 จัดการ Cards หน้า Home</h1>
    </div>

    <div v-if="loading" class="al-loading">กำลังโหลดข้อมูล...</div>

    <template v-else>

      <div class="al-info-box" style="margin-bottom:0;">
        ℹ️ <strong>เปิด</strong> = card แสดงและใช้งานได้ปกติ &nbsp;·&nbsp;
        <strong>ปิด</strong> = กดแล้วแสดง "เร็วๆ นี้" แทน
      </div>

      <!-- Card list -->
      <div class="al-card" style="padding:0;overflow:hidden;">
        <div
          v-for="(card, i) in CARD_DEFS"
          :key="card.key"
          class="hc-row"
          :style="i > 0 ? 'border-top:1px solid #F3F4F6;' : ''"
        >
          <div class="hc-icon">{{ card.icon }}</div>
          <div class="hc-info">
            <div class="hc-label">{{ card.label }}</div>
            <div class="hc-desc">{{ card.desc }}</div>
          </div>
          <div class="hc-right">
            <span class="hc-status" :class="local[card.key] ? 'on' : 'off'">
              {{ local[card.key] ? 'เปิด' : 'ปิด' }}
            </span>
            <label class="hc-toggle">
              <input type="checkbox" v-model="local[card.key]" />
              <span class="hc-track"><span class="hc-thumb"></span></span>
            </label>
          </div>
        </div>
      </div>

      <!-- Save -->
      <div v-if="saveErr" class="al-error" style="text-align:center;">{{ saveErr }}</div>
      <div v-if="saveOk" class="al-success">✓ บันทึกสำเร็จ — หน้า Home จะอัพเดตทันที</div>

      <button
        class="al-btn al-btn-save"
        style="width:100%;padding:13px;font-size:14px;"
        :disabled="cardConfig.saving"
        @click="doSave"
      >
        {{ cardConfig.saving ? 'กำลังบันทึก...' : '💾 บันทึกการตั้งค่า' }}
      </button>

    </template>
  </main>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useCardConfigStore, CARD_DEFS } from '../../stores/cardConfig.js'

const cardConfig = useCardConfigStore()
const loading  = ref(true)
const saveOk   = ref(false)
const saveErr  = ref('')

// Local copy for editing (so cancel is possible)
const local = reactive(Object.fromEntries(CARD_DEFS.map(c => [c.key, true])))

onMounted(async () => {
  await cardConfig.load()
  CARD_DEFS.forEach(c => { local[c.key] = cardConfig.config[c.key] })
  loading.value = false
})

async function doSave() {
  saveErr.value = ''
  saveOk.value  = false
  try {
    // Write local → store config, then persist
    CARD_DEFS.forEach(c => { cardConfig.config[c.key] = local[c.key] })
    await cardConfig.saveAll()
    saveOk.value = true
    setTimeout(() => { saveOk.value = false }, 4000)
  } catch (e) {
    saveErr.value = e.message || 'บันทึกล้มเหลว'
  }
}
</script>

<style scoped>
@import './admin.css';

.hc-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  transition: background 0.12s;
}
.hc-row:hover { background: #FAFAFA; }

.hc-icon { font-size: 24px; width: 32px; text-align: center; flex-shrink: 0; }

.hc-info { flex: 1; min-width: 0; }
.hc-label { font-size: 14px; font-weight: 800; color: #111827; }
.hc-desc  { font-size: 11px; color: #9CA3AF; margin-top: 2px; }

.hc-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

.hc-status {
  font-size: 11px;
  font-weight: 800;
  padding: 3px 9px;
  border-radius: 20px;
}
.hc-status.on  { background: #D1FAE5; color: #059669; }
.hc-status.off { background: #F3F4F6; color: #9CA3AF; }

/* Toggle — same style as announcement */
.hc-toggle { display: inline-flex; cursor: pointer; }
.hc-toggle input { display: none; }
.hc-track {
  width: 42px;
  height: 24px;
  border-radius: 12px;
  background: #D1D5DB;
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
}
.hc-toggle input:checked + .hc-track { background: #10B981; }
.hc-thumb {
  position: absolute;
  top: 3px; left: 3px;
  width: 18px; height: 18px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 1px 4px rgba(0,0,0,0.25);
  transition: transform 0.2s;
}
.hc-toggle input:checked + .hc-track .hc-thumb { transform: translateX(18px); }

.al-success {
  background: #F0FDF4;
  border: 1.5px solid #A7F3D0;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 700;
  color: #059669;
  text-align: center;
}
</style>
