<template>
  <div class="scan-page">
    <div class="al-page-header" style="margin-bottom:16px;">
      <h2 class="al-page-title">📷 สแกนตั๋ว</h2>
      <router-link to="/admin/activities" class="al-btn" style="font-size:12px;padding:7px 12px;">← กลับ</router-link>
    </div>

    <!-- Camera -->
    <div class="scan-viewport-wrap">
      <video ref="videoEl" class="scan-video" autoplay playsinline muted></video>
      <canvas ref="canvasEl" style="display:none;"></canvas>
      <div class="scan-frame"></div>
      <div class="scan-status-overlay">{{ scanStatus }}</div>
    </div>

    <!-- Result card -->
    <div v-if="result" class="scan-result" :class="resultClass">
      <div class="scan-result-icon">{{ resultIcon }}</div>
      <div class="scan-result-name">{{ result.employeeName }}</div>
      <div class="scan-result-ticket">{{ result.ticketNo }}</div>
      <div class="scan-result-activity">{{ result.activityEmoji }} {{ result.activityName }}</div>
      <div class="scan-result-date" v-if="result.activityDate">📅 {{ result.activityDate }} · 📍 {{ result.activityLoc }}</div>

      <div class="scan-result-status">
        {{ result.status === 'checked_in' ? '✅ เข้าร่วมแล้ว' : result.status === 'cancelled' ? '❌ ตั๋วถูกยกเลิก' : '⏳ รอ check-in' }}
      </div>

      <button
        v-if="result.status === 'booked'"
        class="scan-checkin-btn"
        :disabled="checkingIn"
        @click="doCheckIn"
      >
        {{ checkingIn ? '⏳ กำลัง Check-in...' : '✅ Check-in' }}
      </button>

      <button class="scan-rescan-btn" @click="clearResult">📷 สแกนใหม่</button>
    </div>

    <!-- Error -->
    <div v-if="camError" class="scan-cam-error">
      ❌ {{ camError }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import jsQR from 'jsqr'
import * as svc from '../../services/activitiesService.js'

const videoEl   = ref(null)
const canvasEl  = ref(null)
const stream    = ref(null)
const rafId     = ref(null)
const camError  = ref('')
const scanStatus = ref('กำลังสแกน...')
const paused    = ref(false)

const result    = ref(null)
const checkingIn = ref(false)

const resultClass = computed(() => {
  if (!result.value) return ''
  if (result.value.status === 'checked_in') return 'result-already'
  if (result.value.status === 'cancelled')  return 'result-cancelled'
  return 'result-ok'
})
const resultIcon = computed(() => {
  if (!result.value) return ''
  if (result.value.status === 'checked_in') return '⚠️'
  if (result.value.status === 'cancelled')  return '❌'
  return '✅'
})

function tick() {
  if (paused.value) { rafId.value = requestAnimationFrame(tick); return }
  const video  = videoEl.value
  const canvas = canvasEl.value
  if (!video || !canvas || video.readyState < 2) {
    rafId.value = requestAnimationFrame(tick)
    return
  }
  canvas.width  = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')
  ctx.drawImage(video, 0, 0)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' })
  if (code?.data) {
    onQRFound(code.data)
  }
  rafId.value = requestAnimationFrame(tick)
}

async function onQRFound(token) {
  paused.value = true
  scanStatus.value = '🔍 ตรวจสอบ...'
  const data = await svc.verifyTicket(token)
  if (!data) {
    scanStatus.value = '❌ ไม่พบตั๋ว — สแกนใหม่'
    setTimeout(() => {
      scanStatus.value = 'กำลังสแกน...'
      paused.value = false
    }, 2000)
    return
  }
  result.value = data
  scanStatus.value = 'พบตั๋ว'
}

async function doCheckIn() {
  checkingIn.value = true
  try {
    await svc.checkInTicket(result.value.qrToken)
    result.value = { ...result.value, status: 'checked_in' }
  } catch (e) {
    alert('Check-in ล้มเหลว: ' + e.message)
  } finally {
    checkingIn.value = false
  }
}

function clearResult() {
  result.value = null
  scanStatus.value = 'กำลังสแกน...'
  paused.value = false
}

onMounted(async () => {
  try {
    stream.value = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    videoEl.value.srcObject = stream.value
    rafId.value = requestAnimationFrame(tick)
  } catch (e) {
    camError.value = 'ไม่สามารถเปิดกล้องได้: ' + (e.message || e.name)
  }
})

onUnmounted(() => {
  cancelAnimationFrame(rafId.value)
  stream.value?.getTracks().forEach(t => t.stop())
})
</script>

<style scoped>
@import './admin.css';

.scan-page {
  padding: 16px;
  background: #F0F1FF;
  min-height: 100dvh;
  font-family: 'Sarabun', sans-serif;
}
.scan-viewport-wrap {
  position: relative;
  width: 100%;
  max-width: 340px;
  margin: 0 auto 20px;
  aspect-ratio: 1;
  border-radius: 18px;
  overflow: hidden;
  background: #000;
}
.scan-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.scan-frame {
  position: absolute;
  inset: 20%;
  border: 3px solid #6366F1;
  border-radius: 12px;
  box-shadow: 0 0 0 9999px rgba(0,0,0,0.4);
}
.scan-status-overlay {
  position: absolute;
  bottom: 12px;
  left: 0; right: 0;
  text-align: center;
  color: white;
  font-size: 13px;
  font-weight: 600;
  text-shadow: 0 1px 4px rgba(0,0,0,0.8);
}

.scan-result {
  background: white;
  border-radius: 16px;
  padding: 20px 16px;
  text-align: center;
  margin-bottom: 16px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}
.result-ok     { border: 2.5px solid #10B981; }
.result-already{ border: 2.5px solid #F59E0B; }
.result-cancelled{ border: 2.5px solid #EF4444; }

.scan-result-icon    { font-size: 40px; margin-bottom: 6px; }
.scan-result-name    { font-size: 18px; font-weight: 800; color: #1E1B4B; }
.scan-result-ticket  { font-size: 13px; font-weight: 700; color: #6366F1; letter-spacing: 1px; margin: 4px 0; }
.scan-result-activity{ font-size: 14px; color: #374151; font-weight: 600; }
.scan-result-date    { font-size: 12px; color: #9CA3AF; margin-top: 3px; }
.scan-result-status  { font-size: 13px; font-weight: 700; margin-top: 10px; }

.scan-checkin-btn {
  display: block;
  width: 100%;
  margin-top: 14px;
  padding: 13px;
  background: linear-gradient(135deg, #10B981, #059669);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  font-family: 'Sarabun', sans-serif;
}
.scan-checkin-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.scan-rescan-btn {
  display: block;
  width: 100%;
  margin-top: 8px;
  padding: 10px;
  background: #F3F4F6;
  color: #374151;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Sarabun', sans-serif;
}
.scan-cam-error {
  background: #FEF2F2;
  color: #DC2626;
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 13px;
  text-align: center;
}
</style>
