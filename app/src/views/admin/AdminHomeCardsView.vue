<template>
  <main class="al-main">

    <div class="al-page-header">
      <h1 class="al-page-title">🏠 จัดการ Cards หน้า Home</h1>
    </div>

    <div v-if="loading" class="al-loading">กำลังโหลดข้อมูล...</div>

    <template v-else>

      <!-- ── Section 1: เปิด/ปิด Card ─────────────────────────── -->
      <div class="al-info-box" style="margin-bottom:0;">
        ℹ️ <strong>เปิด</strong> = card แสดงและใช้งานได้ปกติ &nbsp;·&nbsp;
        <strong>ปิด</strong> = กดแล้วแสดง "เร็วๆ นี้" แทน
      </div>

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

      <div v-if="saveErr" class="al-error" style="text-align:center;">{{ saveErr }}</div>
      <div v-if="saveOk"  class="al-success">✓ บันทึกสำเร็จ — หน้า Home จะอัพเดตทันที</div>

      <button
        class="al-btn al-btn-save"
        style="width:100%;padding:13px;font-size:14px;"
        :disabled="cardConfig.saving"
        @click="doSave"
      >{{ cardConfig.saving ? 'กำลังบันทึก...' : '💾 บันทึกการตั้งค่า' }}</button>

      <!-- ── Section 2: พื้นหลัง Card ──────────────────────────── -->
      <div class="al-page-header" style="margin-top:8px;margin-bottom:0;">
        <h2 class="al-page-title" style="font-size:16px;">🎨 พื้นหลัง Card</h2>
      </div>

      <div class="al-card" style="padding:0;overflow:hidden;">
        <div
          v-for="(card, i) in CARD_BG_DEFS"
          :key="card.key"
          class="bg-row"
          :style="i > 0 ? 'border-top:1px solid #F3F4F6;' : ''"
        >
          <!-- Preview swatch -->
          <div class="bg-swatch" :style="{ background: bgStyle(card.key) }"></div>

          <div class="bg-body">
            <div class="bg-label">{{ card.icon }} {{ card.label }}</div>

            <!-- Preset chips -->
            <div class="bg-chips">
              <button
                v-for="p in PRESETS"
                :key="p.v"
                class="bg-chip"
                :class="{ active: localBg[card.key] === p.v }"
                :style="{ background: p.v }"
                :title="p.label"
                @click="localBg[card.key] = p.v"
              ></button>
            </div>

            <!-- Upload image -->
            <div class="bg-upload-row">
              <label class="al-btn al-btn-edit bg-upload-btn" style="cursor:pointer;">
                {{ uploading[card.key] ? '⏳ กำลังอัปโหลด...' : '📤 อัปโหลดรูป' }}
                <input
                  type="file"
                  accept="image/*"
                  style="display:none;"
                  :disabled="uploading[card.key]"
                  @change="e => onImgChange(card.key, e)"
                />
              </label>
              <span v-if="localBg[card.key]?.startsWith('http')" class="bg-img-tag">🖼️ รูปที่อัปโหลด</span>
            </div>

            <!-- Custom input -->
            <input
              v-model="localBg[card.key]"
              class="al-form-input bg-custom-input"
              placeholder="linear-gradient(135deg, #..., #...) หรือ URL รูป"
            />
          </div>

          <!-- Reset -->
          <button class="bg-reset-btn" @click="resetBg(card)" title="Reset">↺</button>
        </div>
      </div>

      <div v-if="saveBgErr" class="al-error" style="text-align:center;">{{ saveBgErr }}</div>
      <div v-if="saveBgOk"  class="al-success">✓ บันทึกพื้นหลังสำเร็จ</div>

      <button
        class="al-btn al-btn-save"
        style="width:100%;padding:13px;font-size:14px;"
        :disabled="cardConfig.saving"
        @click="doSaveBg"
      >{{ cardConfig.saving ? 'กำลังบันทึก...' : '🎨 บันทึกพื้นหลัง' }}</button>

    </template>
  </main>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useCardConfigStore, CARD_DEFS, CARD_BG_DEFS } from '../../stores/cardConfig.js'
import { resizeToBase64 } from '../../composables/useImageCompress.js'
import { uploadImage, deleteImage } from '../../services/edgeFunctions.js'

const cardConfig = useCardConfigStore()
const loading   = ref(true)
const saveOk    = ref(false)
const saveErr   = ref('')
const saveBgOk  = ref(false)
const saveBgErr = ref('')

const PRESETS = [
  { label: 'สีสัน',      v: 'linear-gradient(135deg,#FF6B00,#FF3CAC,#A855F7,#3B82F6)' },
  { label: 'ชมพู',       v: 'linear-gradient(135deg,#FFD6DC,#FF8FA3,#FF4D6D)' },
  { label: 'เขียว',      v: 'linear-gradient(135deg,#06C755,#00A040)' },
  { label: 'ฟ้า',        v: 'linear-gradient(135deg,#3B82F6,#1D4ED8)' },
  { label: 'ม่วง',       v: 'linear-gradient(135deg,#A855F7,#7C3AED)' },
  { label: 'ทอง',        v: 'linear-gradient(135deg,#F59E0B,#D97706)' },
  { label: 'กรมท่า',     v: 'linear-gradient(135deg,#6366F1,#4F46E5)' },
  { label: 'แดง',        v: 'linear-gradient(135deg,#EF4444,#B91C1C)' },
  { label: 'ฟ้าอ่อน',    v: 'linear-gradient(135deg,#EEF2FF,#E0E7FF)' },
  { label: 'ชมพูอ่อน',   v: 'linear-gradient(135deg,#FDF2F8,#FCE7F3)' },
  { label: 'เขียวอ่อน',  v: 'linear-gradient(135deg,#E8F8F0,#C8F0DC)' },
  { label: 'เหลืองอ่อน', v: 'linear-gradient(135deg,#FFFBEB,#FEF3C7)' },
]

// Local copies for editing
const local        = reactive(Object.fromEntries(CARD_DEFS.map(c => [c.key, true])))
const localBg      = reactive(Object.fromEntries(CARD_BG_DEFS.map(c => [c.key, c.default])))
const localBgImgId = reactive({})   // storage path per key (for deletion)
const uploading    = reactive({})   // upload loading state per key

// Return CSS background value for preview/apply (handles both URL and gradient)
function bgStyle(key) {
  const v = localBg[key] || ''
  if (v.startsWith('http')) return `url(${v}) center/cover no-repeat`
  return v
}

onMounted(async () => {
  await cardConfig.load()
  CARD_DEFS.forEach(c => { local[c.key] = cardConfig.config[c.key] })
  CARD_BG_DEFS.forEach(c => {
    // bgConfig stores raw URL or gradient — getBg() wraps URL, so read raw value
    localBg[c.key]      = cardConfig.bgConfig[c.key] || c.default
    localBgImgId[c.key] = cardConfig.bgImgId[c.key] || ''
  })
  loading.value = false
})

// ── Image upload ────────────────────────────────────────────
async function onImgChange(key, e) {
  const file = e.target.files?.[0]
  if (!file) return
  const oldImgId = localBgImgId[key]
  uploading[key] = true
  saveBgErr.value = ''
  try {
    const b64 = await resizeToBase64(file, 1600, 900, 0.88)
    const res  = await uploadImage(b64, file.name, 'announcements')
    // Delete old image if existed
    if (oldImgId && oldImgId !== res.id) deleteImage([oldImgId]).catch(console.warn)
    localBg[key]      = res.url        // raw URL stored in bgConfig
    localBgImgId[key] = res.id
  } catch (err) {
    saveBgErr.value = 'อัปโหลดรูปล้มเหลว: ' + (err.message || 'ลองใหม่')
  } finally {
    uploading[key] = false
    e.target.value = ''
  }
}

// ── Reset to default (delete uploaded image if any) ─────────
function resetBg(card) {
  const imgId = localBgImgId[card.key]
  if (imgId) {
    deleteImage([imgId]).catch(console.warn)
    localBgImgId[card.key] = ''
  }
  localBg[card.key] = card.default
}

// ── Save enabled/disabled ───────────────────────────────────
async function doSave() {
  saveErr.value = ''
  saveOk.value  = false
  try {
    CARD_DEFS.forEach(c => { cardConfig.config[c.key] = local[c.key] })
    await cardConfig.saveAll()
    saveOk.value = true
    setTimeout(() => { saveOk.value = false }, 4000)
  } catch (e) {
    saveErr.value = e.message || 'บันทึกล้มเหลว'
  }
}

// ── Save backgrounds ────────────────────────────────────────
async function doSaveBg() {
  saveBgErr.value = ''
  saveBgOk.value  = false
  try {
    CARD_BG_DEFS.forEach(c => {
      cardConfig.bgConfig[c.key] = localBg[c.key]
      cardConfig.bgImgId[c.key]  = localBgImgId[c.key] || ''
    })
    await cardConfig.saveBg()
    saveBgOk.value = true
    setTimeout(() => { saveBgOk.value = false }, 4000)
  } catch (e) {
    saveBgErr.value = e.message || 'บันทึกล้มเหลว'
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

/* ── BG editor ─────────────────────────────── */
.bg-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
}

.bg-swatch {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0,0,0,0.12);
  border: 1.5px solid rgba(0,0,0,0.06);
}

.bg-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.bg-label { font-size: 13px; font-weight: 800; color: #111827; }

.bg-chips { display: flex; flex-wrap: wrap; gap: 6px; }

.bg-chip {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.15s, border-color 0.15s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
}
.bg-chip:hover   { transform: scale(1.15); }
.bg-chip.active  { border-color: #111827; transform: scale(1.1); }

.bg-upload-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.bg-upload-btn {
  font-size: 12px !important;
  padding: 5px 12px !important;
}
.bg-img-tag {
  font-size: 11px;
  color: #059669;
  font-weight: 700;
  background: #D1FAE5;
  padding: 3px 8px;
  border-radius: 20px;
}
.bg-custom-input {
  font-size: 11px !important;
  font-family: monospace !important;
  padding: 6px 10px !important;
  color: #6B7280;
}

.bg-reset-btn {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #F3F4F6;
  border: none;
  font-size: 18px;
  color: #6B7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s;
  margin-top: 8px;
}
.bg-reset-btn:hover { background: #E5E7EB; color: #374151; }
</style>
