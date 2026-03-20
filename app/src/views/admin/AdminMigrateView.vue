<template>
  <div>
    <main class="al-main">
      <div class="al-page-header">
        <h2 class="al-page-title">🔄 Migrate Drive → Storage</h2>
        <button
          v-if="pending.length && !running"
          class="al-btn al-btn-primary"
          @click="startMigration"
        >▶ เริ่ม Migrate</button>
        <button v-else-if="running" class="al-btn al-btn-secondary" disabled>⏳ กำลังทำงาน...</button>
      </div>

      <!-- Summary cards -->
      <div class="mg-summary-row">
        <div class="mg-stat">
          <div class="mg-stat-num">{{ total }}</div>
          <div class="mg-stat-label">พนักงานทั้งหมด</div>
        </div>
        <div class="mg-stat mg-stat-warn">
          <div class="mg-stat-num">{{ pending.length }}</div>
          <div class="mg-stat-label">รอ Migrate</div>
        </div>
        <div class="mg-stat mg-stat-ok">
          <div class="mg-stat-num">{{ doneCount }}</div>
          <div class="mg-stat-label">เสร็จแล้ว</div>
        </div>
        <div class="mg-stat mg-stat-err" v-if="failCount">
          <div class="mg-stat-num">{{ failCount }}</div>
          <div class="mg-stat-label">ผิดพลาด</div>
        </div>
      </div>

      <!-- Info box -->
      <div class="al-info-box" style="margin-bottom:12px;">
        <div style="font-size:12px;font-weight:800;color:#3730A3;margin-bottom:6px;">📋 ข้อมูล</div>
        <ul style="font-size:12px;color:#4338CA;line-height:2;padding-left:16px;margin:0;">
          <li>ดึงรูปจาก Google Drive ผ่าน Edge Function → อัปโหลดไปยัง Supabase Storage</li>
          <li>หลัง migrate สำเร็จ: <code>img_id</code> และ <code>img_url</code> ของพนักงานจะอัปเดตเป็น Storage path</li>
          <li>ลด Edge Function invocations (get-images) ได้มากหลัง migrate เสร็จ</li>
          <li>ทำทีละคน เพื่อไม่ให้ hit rate limit</li>
        </ul>
      </div>

      <!-- ── Fix Cache section ── -->
      <div class="al-card" style="margin-bottom:14px;">
        <div class="al-card-header">
          <span class="al-card-title">🔧 Fix Cache-Control (รูปเก่า)</span>
        </div>
        <div style="padding:12px 14px;font-size:12px;color:#6B7280;line-height:1.8;">
          รูปที่อัปโหลดก่อนจะมี <code>cache-control: max-age=3600</code> (1 ชั่วโมง)<br>
          กด Run เพื่อให้ Edge Function ดาวน์โหลดและ re-upload ทุกรูปด้วย <code>max-age=31536000</code> (1 ปี)<br>
          <span style="color:#92400E;">ทำงานฝั่ง Server — ไม่กิน bandwidth</span>
        </div>
        <div style="padding:0 14px 14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <button
            class="al-btn al-btn-primary"
            :disabled="cacheFixing"
            @click="runFixCache"
            style="min-width:120px;"
          >
            <span v-if="cacheFixing">⏳ กำลังทำงาน...</span>
            <span v-else>▶ Run Fix Cache</span>
          </button>
          <!-- Result -->
          <span v-if="cacheResult" style="font-size:13px;font-weight:700;color:#15803D;">
            ✅ แก้ไข {{ cacheResult.fixed }} รูป
            <span v-if="cacheResult.failed" style="color:#DC2626;"> · ผิดพลาด {{ cacheResult.failed }} รูป</span>
          </span>
          <span v-if="cacheError" style="font-size:13px;color:#DC2626;">⚠️ {{ cacheError }}</span>
        </div>
        <!-- Error list -->
        <div v-if="cacheResult?.errors?.length" style="padding:0 14px 14px;">
          <div style="font-size:11px;font-weight:700;color:#DC2626;margin-bottom:4px;">รายการที่ผิดพลาด:</div>
          <div v-for="err in cacheResult.errors" :key="err" style="font-size:11px;color:#DC2626;font-family:monospace;padding:2px 0;">
            {{ err }}
          </div>
        </div>
      </div>

      <div v-if="loadError" style="padding:14px;color:#DC2626;font-size:13px;">⚠️ {{ loadError }}</div>
      <div v-else-if="loading" class="al-loading">⏳ กำลังโหลด...</div>

      <template v-else>
        <!-- All done -->
        <div v-if="!pending.length && !rows.length" class="al-empty" style="padding:48px;">
          ✅ ทุกรูปอยู่ใน Supabase Storage แล้ว ไม่มีอะไรต้อง migrate
        </div>

        <!-- Pending list -->
        <div v-if="pending.length" class="al-card" style="margin-bottom:12px;">
          <div class="al-card-header">
            <span class="al-card-title">รอ Migrate</span>
            <span class="al-badge al-badge-yellow">{{ pending.length }} คน</span>
          </div>
          <div v-for="r in pending" :key="r.id" class="al-item">
            <div class="mg-status-icon">{{ statusIcon(r.id) }}</div>
            <div class="al-item-body">
              <div class="al-item-title">{{ r.name }}</div>
              <div class="al-item-sub">{{ r.role }} · Drive ID: <code style="font-size:10px;">{{ r.imgId.slice(0,16) }}…</code></div>
              <div v-if="errors[r.id]" style="font-size:11px;color:#DC2626;margin-top:2px;">❌ {{ errors[r.id] }}</div>
            </div>
          </div>
        </div>

        <!-- Done list -->
        <div v-if="done.length" class="al-card">
          <div class="al-card-header">
            <span class="al-card-title">✅ Migrate แล้ว</span>
            <span class="al-badge al-badge-green">{{ done.length }} คน</span>
          </div>
          <div v-for="r in done" :key="r.id" class="al-item">
            <div class="mg-status-icon">✅</div>
            <div class="al-item-body">
              <div class="al-item-title">{{ r.name }}</div>
              <div class="al-item-sub" style="color:#059669;">Storage: {{ r.imgId }}</div>
            </div>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getEmployees, updateEmployee } from '../../services/adminService.js'
import { getImages, uploadImage, fixCacheControl } from '../../services/edgeFunctions.js'

const loading   = ref(true)
const loadError = ref('')
const running   = ref(false)
const rows      = ref([])   // all employees
const statuses  = ref({})   // id → 'pending' | 'running' | 'done' | 'error'
const errors    = ref({})

const isDriveId = id => !!id && !id.includes('/') && !id.startsWith('http')

onMounted(async () => {
  try {
    const all = await getEmployees()
    rows.value = all
  } catch (e) {
    loadError.value = e.message || 'โหลดไม่สำเร็จ'
  } finally {
    loading.value = false
  }
})

const total    = computed(() => rows.value.length)
const pending  = computed(() => rows.value.filter(r => isDriveId(r.imgId) && statuses.value[r.id] !== 'done'))
const done     = computed(() => rows.value.filter(r => statuses.value[r.id] === 'done'))
const doneCount = computed(() => done.value.length)
const failCount = computed(() => Object.values(statuses.value).filter(s => s === 'error').length)

function statusIcon(id) {
  const s = statuses.value[id]
  if (s === 'running') return '⏳'
  if (s === 'done')    return '✅'
  if (s === 'error')   return '❌'
  return '🔵'
}

async function migrateOne(emp) {
  statuses.value[emp.id] = 'running'
  try {
    // 1. Fetch from Drive
    const map = await getImages([emp.imgId])
    const base64 = map[emp.imgId]
    if (!base64) throw new Error('Drive image ไม่ได้รับข้อมูล')

    // 2. Upload to Storage
    const result = await uploadImage(base64, 'profile.jpg', 'profiles')

    // 3. Update DB
    await updateEmployee(emp.id, { img_id: result.id, img_url: result.url })

    // 4. Update local row
    const idx = rows.value.findIndex(r => r.id === emp.id)
    if (idx >= 0) rows.value[idx] = { ...rows.value[idx], imgId: result.id, imgUrl: result.url }

    statuses.value[emp.id] = 'done'
  } catch (e) {
    errors.value[emp.id] = e.message || 'ผิดพลาด'
    statuses.value[emp.id] = 'error'
  }
}

// ── Fix Cache ──────────────────────────────────────────────────────────
const cacheFixing  = ref(false)
const cacheResult  = ref(null)   // { fixed, failed, errors[] } | null
const cacheError   = ref('')

async function runFixCache() {
  if (cacheFixing.value) return
  cacheFixing.value = true
  cacheResult.value = null
  cacheError.value  = ''
  try {
    cacheResult.value = await fixCacheControl()
  } catch (e) {
    cacheError.value = e.message || 'เกิดข้อผิดพลาด'
  } finally {
    cacheFixing.value = false
  }
}

async function startMigration() {
  if (running.value) return
  running.value = true
  const targets = pending.value.slice()
  for (const emp of targets) {
    await migrateOne(emp)
    // Small delay between requests to avoid rate-limiting
    await new Promise(r => setTimeout(r, 300))
  }
  running.value = false
}
</script>

<style scoped>
@import './admin.css';

.mg-summary-row {
  display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px;
}
.mg-stat {
  flex: 1; min-width: 80px;
  background: white; border: 1.5px solid #E5E7EB; border-radius: 14px;
  padding: 12px; text-align: center;
}
.mg-stat-num   { font-size: 28px; font-weight: 900; color: #111827; line-height: 1; }
.mg-stat-label { font-size: 11px; color: #6B7280; margin-top: 4px; }
.mg-stat-ok    { border-color: #86EFAC; background: #F0FDF4; }
.mg-stat-ok .mg-stat-num { color: #15803D; }
.mg-stat-warn  { border-color: #FCD34D; background: #FFFBEB; }
.mg-stat-warn .mg-stat-num { color: #B45309; }
.mg-stat-err   { border-color: #FCA5A5; background: #FEF2F2; }
.mg-stat-err .mg-stat-num { color: #DC2626; }

.mg-status-icon {
  width: 32px; height: 32px; display: flex; align-items: center;
  justify-content: center; font-size: 18px; flex-shrink: 0;
}
</style>
