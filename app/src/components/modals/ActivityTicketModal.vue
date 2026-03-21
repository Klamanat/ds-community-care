<template>
  <BaseModal modal-id="ticket-modal" @close="onClose">
    <template #default>
      <div v-if="!activity" class="tm-empty">ไม่พบกิจกรรม</div>
      <div v-else class="tm-wrap">

        <!-- ── Hero ── -->
        <div class="tm-hero">
          <div class="tm-hero-emoji">{{ activity.emoji || '📅' }}</div>
          <div class="tm-hero-name">{{ activity.name }}</div>
          <div class="tm-hero-meta">
            <span>📅 {{ activity.date }}{{ activity.dateEnd ? ' – ' + activity.dateEnd : '' }}</span>
            <span v-if="activity.loc"> · 📍 {{ activity.loc }}</span>
          </div>
        </div>

        <div class="tm-scroll">

          <!-- Loading -->
          <div v-if="state === 'loading'" class="tm-loading">
            <div class="tm-spinner"></div>
            <span>กำลังโหลด...</span>
          </div>

          <!-- ── Book ── -->
          <div v-else-if="state === 'book'" class="tm-body">
            <div class="tm-chips">
              <div class="tm-chip">
                <span class="tm-chip-icon">💰</span>
                <div>
                  <div class="tm-chip-label">ราคา / ที่นั่ง</div>
                  <div class="tm-chip-val">{{ activity.ticketPrice ? activity.ticketPrice.toLocaleString() + ' บาท' : 'ฟรี 🎉' }}</div>
                </div>
              </div>
              <div class="tm-chip tm-chip-seat">
                <span class="tm-chip-icon">🪑</span>
                <div>
                  <div class="tm-chip-label">ที่นั่งเหลือ</div>
                  <div class="tm-chip-val">
                    <template v-if="activity.ticketCapacity">
                      <span :class="seatsLeft <= 5 ? 'tm-seat-low' : ''">{{ seatsLeft }}</span>
                      <span class="tm-chip-sub"> / {{ activity.ticketCapacity }}</span>
                    </template>
                    <template v-else>ไม่จำกัด</template>
                  </div>
                </div>
              </div>
            </div>

            <!-- Quantity stepper -->
            <div class="tm-qty-wrap">
              <div class="tm-qty-label">จำนวนที่นั่ง</div>
              <div class="tm-qty-row">
                <button class="tm-qty-btn" :disabled="qty <= 1" @click="qty--">−</button>
                <span class="tm-qty-val">{{ qty }}</span>
                <button class="tm-qty-btn" :disabled="activity.ticketCapacity && qty >= seatsLeft" @click="qty++">+</button>
              </div>
              <div v-if="activity.ticketPrice" class="tm-qty-total">
                รวม {{ (activity.ticketPrice * qty).toLocaleString() }} บาท
              </div>
            </div>

            <div v-if="activity.ticketNote" class="tm-note">
              <div class="tm-note-title">📋 วิธีชำระเงิน</div>
              <div class="tm-note-body">{{ activity.ticketNote }}</div>
            </div>

            <!-- Open-at notice -->
            <div v-if="activity.ticketOpenAt && !isBookingOpen" class="tm-open-notice">
              <div class="tm-open-icon">🔒</div>
              <div>
                <div class="tm-open-label">ยังไม่เปิดจอง</div>
                <div class="tm-open-date">เปิดจอง {{ openAtDisplay }}</div>
              </div>
            </div>
            <div v-else-if="activity.ticketOpenAt" class="tm-open-ok">
              ✅ เปิดจองแล้ว ตั้งแต่ {{ openAtDisplay }}
            </div>

            <div v-if="bookError" class="tm-error">⚠️ {{ bookError }}</div>

            <button class="tm-btn-book" :disabled="isFull || booking || !isBookingOpen" @click="doBook">
              <span v-if="booking" class="tm-btn-spinner"></span>
              {{ booking ? 'กำลังจอง...' : !isBookingOpen ? '🔒 ยังไม่เปิดจอง' : isFull ? '❌ ที่นั่งเต็มแล้ว' : `🎟 จอง ${qty} ที่นั่ง` }}
            </button>
          </div>

          <!-- ── Upload Slip ── -->
          <div v-else-if="state === 'upload_slip'" class="tm-slip-wrap">

            <div class="tm-slip-header">
              <div class="tm-slip-icon">💳</div>
              <div class="tm-slip-title">แนบสลิปการชำระเงิน</div>
              <div class="tm-slip-no">{{ ticket.ticketNo }}</div>
              <div class="tm-slip-sub">กรุณาโอนเงินและแนบสลิปเพื่อยืนยันการจอง</div>
            </div>

            <!-- Payment instructions -->
            <div v-if="activity.ticketNote" class="tm-note" style="margin-bottom:14px;">
              <div class="tm-note-title">📋 วิธีชำระเงิน</div>
              <div class="tm-note-body">{{ activity.ticketNote }}</div>
            </div>

            <!-- Slip preview -->
            <div class="tm-slip-upload-zone" @click="slipFileInput.click()">
              <img v-if="slipPreview" :src="slipPreview" class="tm-slip-preview" />
              <div v-else class="tm-slip-placeholder">
                <div style="font-size:32px;margin-bottom:6px;">📷</div>
                <div style="font-size:13px;font-weight:600;color:#374151;">แตะเพื่ออัปโหลดสลิป</div>
                <div style="font-size:11px;color:#9CA3AF;margin-top:4px;">รูปภาพจากกล้องหรือแกลเลอรี่</div>
              </div>
            </div>
            <input ref="slipFileInput" type="file" accept="image/*" style="display:none" @change="onSlipChange" />

            <div v-if="slipError" class="tm-error">⚠️ {{ slipError }}</div>

            <button class="tm-btn-book" :disabled="!slipPreview || slipUploading" @click="doUploadSlip">
              <span v-if="slipUploading" class="tm-btn-spinner"></span>
              {{ slipUploading ? 'กำลังอัปโหลด...' : '✅ ส่งสลิป' }}
            </button>

            <button class="tm-btn-cancel" style="margin-top:8px;" @click="doCancel" :disabled="cancelling">
              {{ cancelling ? '⏳ ยกเลิก...' : '🗑 ยกเลิกการจอง' }}
            </button>
          </div>

          <!-- ── Ticket / QR ── -->
          <div v-else-if="state === 'ticket'" class="tm-ticket-wrap">

            <div class="tkt" :class="ticket.status === 'cancelled' ? 'tkt-cancelled' : ''">

              <!-- Top band -->
              <div class="tkt-top">
                <div class="tkt-dots">
                  <span v-for="i in 12" :key="i" class="tkt-dot"></span>
                </div>
                <div class="tkt-emoji-ring">
                  <span class="tkt-big-emoji">{{ activity.emoji || '📅' }}</span>
                </div>
                <div v-if="activity.ticketTitle" class="tkt-ticket-type">{{ activity.ticketTitle }}</div>
                <div class="tkt-event-name">{{ activity.name }}</div>
                <div class="tkt-status-pill"
                  :class="ticket.status === 'checked_in' ? 'pill-green' : ticket.status === 'cancelled' ? 'pill-red' : 'pill-blue'">
                  {{ ticket.status === 'checked_in' ? '✅ เข้าร่วมแล้ว' : ticket.status === 'cancelled' ? '❌ ยกเลิก' : '🎟 พร้อมใช้งาน' }}
                </div>
                <svg class="tkt-wave" viewBox="0 0 360 20" preserveAspectRatio="none">
                  <path d="M0,20 Q30,0 60,10 Q90,20 120,10 Q150,0 180,10 Q210,20 240,10 Q270,0 300,10 Q330,20 360,10 L360,20 Z" fill="white"/>
                </svg>
              </div>

              <!-- Info -->
              <div class="tkt-body">
                <div class="tkt-row">
                  <div class="tkt-field">
                    <div class="tkt-field-label">ผู้ถือตั๋ว</div>
                    <div class="tkt-field-val">{{ ticket.employeeName }}</div>
                  </div>
                  <div class="tkt-field tkt-field-r">
                    <div class="tkt-field-label">{{ activity.ticketTitle || 'เลขที่ตั๋ว' }}</div>
                    <div class="tkt-field-val tkt-no">{{ ticket.ticketNo }}</div>
                  </div>
                </div>
                <div class="tkt-row" v-if="activity.date">
                  <div class="tkt-field">
                    <div class="tkt-field-label">วันที่</div>
                    <div class="tkt-field-val">{{ activity.date }}{{ activity.dateEnd ? ' – ' + activity.dateEnd : '' }}</div>
                  </div>
                  <div v-if="activity.loc" class="tkt-field tkt-field-r">
                    <div class="tkt-field-label">สถานที่</div>
                    <div class="tkt-field-val">{{ activity.loc }}</div>
                  </div>
                </div>
                <div v-if="ticket.quantity > 1" class="tkt-row">
                  <div class="tkt-field">
                    <div class="tkt-field-label">จำนวน</div>
                    <div class="tkt-field-val" style="color:#7C3AED;">× {{ ticket.quantity }} ที่นั่ง</div>
                  </div>
                  <div v-if="ticket.price" class="tkt-field tkt-field-r">
                    <div class="tkt-field-label">รวม</div>
                    <div class="tkt-field-val">{{ (ticket.price * ticket.quantity).toLocaleString() }} บาท</div>
                  </div>
                </div>
              </div>

              <!-- Perforation -->
              <div class="tkt-perf">
                <div class="tkt-perf-notch tkt-notch-l"></div>
                <div class="tkt-perf-dash"></div>
                <div class="tkt-perf-notch tkt-notch-r"></div>
              </div>

              <!-- QR -->
              <div class="tkt-qr-section">
                <div class="tkt-qr-box">
                  <span class="tkt-corner tkt-c-tl"></span>
                  <span class="tkt-corner tkt-c-tr"></span>
                  <span class="tkt-corner tkt-c-bl"></span>
                  <span class="tkt-corner tkt-c-br"></span>
                  <img
                    :src="'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + ticket.qrToken"
                    width="150" height="150" alt="QR" class="tkt-qr-img"
                  />
                </div>
                <div class="tkt-qr-label">แสดง QR Code เพื่อ check-in ที่งาน 🎉</div>
              </div>
            </div>

            <!-- Actions -->
            <div class="tm-ticket-actions">
              <button
                v-if="ticket.status === 'booked'"
                class="tm-btn-cancel"
                :disabled="cancelling"
                @click="doCancel"
              >{{ cancelling ? '⏳ กำลังยกเลิก...' : '🗑 ยกเลิกการจอง' }}</button>
              <button class="tm-btn-close" @click="onClose">ปิด</button>
            </div>
          </div>

        </div><!-- /tm-scroll -->
      </div>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import BaseModal from '../shared/BaseModal.vue'
import { useUiStore } from '../../stores/ui.js'
import * as svc from '../../services/activitiesService.js'
import { resizeToBase64 } from '../../composables/useImageCompress.js'

const ui = useUiStore()

const activity    = computed(() => ui.ticketActivity)
const state       = ref('loading')
const ticket      = ref(null)
const bookedCount = ref(0)
const booking     = ref(false)
const cancelling  = ref(false)
const bookError   = ref('')
const qty         = ref(1)

// Booking open-date gate
const now = ref(Date.now())
const _timer = setInterval(() => { now.value = Date.now() }, 30_000)
onUnmounted(() => clearInterval(_timer))

const isBookingOpen = computed(() => {
  const oat = activity.value?.ticketOpenAt
  if (!oat) return true
  return new Date(oat).getTime() <= now.value
})
const openAtDisplay = computed(() => {
  const oat = activity.value?.ticketOpenAt
  if (!oat) return ''
  const d = new Date(oat)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getDate()}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())} น.`
})

// slip upload
const slipFileInput = ref(null)
const slipPreview   = ref('')
const slipUploading = ref(false)
const slipError     = ref('')

const seatsLeft = computed(() => {
  if (!activity.value?.ticketCapacity) return null
  return Math.max(0, activity.value.ticketCapacity - bookedCount.value)
})
const isFull = computed(() => {
  if (!activity.value?.ticketCapacity) return false
  return (seatsLeft.value ?? Infinity) <= 0
})

function resolveState(t) {
  if (!t) return 'book'
  if (t.status === 'pending_slip') return 'upload_slip'
  return 'ticket'
}

watch(() => ui.activeModal, async (id) => {
  if (id !== 'ticket-modal' || !activity.value) return
  state.value = 'loading'
  bookError.value = ''
  slipPreview.value = ''
  slipError.value = ''
  ticket.value = null
  qty.value = 1

  if (activity.value._preloadedTicket) {
    ticket.value = activity.value._preloadedTicket
    state.value  = resolveState(ticket.value)
    return
  }

  try {
    const [existing, count] = await Promise.all([
      svc.getMyTicketForActivity(activity.value.id, ui.currentUser.id),
      svc.getActivityBookedCount(activity.value.id),
    ])
    bookedCount.value = count
    ticket.value = existing
    state.value  = resolveState(existing)
  } catch {
    state.value = 'book'
  }
})

async function doBook() {
  booking.value = true; bookError.value = ''
  try {
    const t = await svc.bookTicket(activity.value.id, ui.currentUser.id, ui.currentUser.name, activity.value.ticketPrice, qty.value)
    ticket.value = t; bookedCount.value += qty.value
    state.value  = resolveState(t)
  } catch (e) {
    bookError.value = e.message || 'เกิดข้อผิดพลาด'
  } finally { booking.value = false }
}

async function onSlipChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  slipError.value = ''
  const b64 = await resizeToBase64(file, 1200, 1600, 0.85)
  slipPreview.value = b64
  e.target.value = ''
}

async function doUploadSlip() {
  if (!slipPreview.value || !ticket.value) return
  slipUploading.value = true; slipError.value = ''
  try {
    const t = await svc.uploadTicketSlip(ticket.value.id, slipPreview.value, 'slip.jpg')
    ticket.value = t
    state.value  = 'ticket'
  } catch (e) {
    slipError.value = e.message || 'อัปโหลดล้มเหลว'
  } finally { slipUploading.value = false }
}

async function doCancel() {
  if (!confirm('ยืนยันการยกเลิกการจอง?')) return
  cancelling.value = true
  try {
    await svc.cancelTicket(ticket.value.id)
    ticket.value = { ...ticket.value, status: 'cancelled' }
    state.value  = 'ticket'
  } catch (e) { alert('ยกเลิกไม่สำเร็จ: ' + e.message) }
  finally { cancelling.value = false }
}

function onClose() { ui.closeModal() }
</script>

<style scoped>
.tm-empty { padding:32px; text-align:center; color:#9CA3AF; font-size:14px; }
.tm-wrap { font-family:'Sarabun',sans-serif; display:flex; flex-direction:column; flex:1; min-height:0; }

/* Hero */
.tm-hero { background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%); padding:28px 20px 22px; text-align:center; flex-shrink:0; }
.tm-hero-emoji { font-size:48px; margin-bottom:8px; filter:drop-shadow(0 2px 8px rgba(0,0,0,0.2)); }
.tm-hero-name { font-size:17px; font-weight:800; color:white; margin-bottom:6px; line-height:1.3; }
.tm-hero-meta { font-size:12px; color:rgba(255,255,255,0.75); }

/* Scroll */
.tm-scroll { flex:1; overflow-y:auto; padding:16px 20px 24px; -webkit-overflow-scrolling:touch; }

/* Loading */
.tm-loading { display:flex; flex-direction:column; align-items:center; gap:10px; padding:40px; color:#9CA3AF; font-size:13px; }
.tm-spinner { width:28px; height:28px; border:3px solid #E5E7EB; border-top-color:#6366F1; border-radius:50%; animation:spin 0.7s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }

/* Book body */
.tm-body { padding:0; }
.tm-chips { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px; }
.tm-chip { display:flex; align-items:center; gap:10px; background:#F5F3FF; border:1.5px solid #DDD6FE; border-radius:14px; padding:12px 14px; }
.tm-chip-seat { background:#F0FDF4; border-color:#BBF7D0; }
.tm-chip-icon { font-size:22px; }
.tm-chip-label { font-size:10px; color:#9CA3AF; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px; }
.tm-chip-val { font-size:15px; font-weight:800; color:#1E1B4B; }
.tm-chip-sub { font-size:12px; color:#9CA3AF; font-weight:400; }
.tm-seat-low { color:#EF4444; }

/* Quantity stepper */
.tm-qty-wrap {
  background: #F5F3FF;
  border: 1.5px solid #DDD6FE;
  border-radius: 16px;
  padding: 14px 16px;
  margin-bottom: 14px;
  text-align: center;
}
.tm-qty-label { font-size: 11px; font-weight: 700; color: #7C3AED; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
.tm-qty-row { display: flex; align-items: center; justify-content: center; gap: 0; }
.tm-qty-btn {
  width: 40px; height: 40px;
  background: white;
  border: 1.5px solid #DDD6FE;
  border-radius: 50%;
  font-size: 20px;
  font-weight: 700;
  color: #6366F1;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.1s;
  line-height: 1;
}
.tm-qty-btn:disabled { color: #D1D5DB; border-color: #F3F4F6; cursor: not-allowed; }
.tm-qty-btn:not(:disabled):active { background: #EEF2FF; }
.tm-qty-val { font-size: 28px; font-weight: 900; color: #1E1B4B; min-width: 60px; text-align: center; }
.tm-qty-total { font-size: 13px; font-weight: 700; color: #6366F1; margin-top: 8px; }

.tm-note { background:#FFFBEB; border:1.5px solid #FDE68A; border-radius:14px; padding:12px 14px; margin-bottom:14px; }
.tm-note-title { font-size:12px; font-weight:700; color:#92400E; margin-bottom:5px; }
.tm-note-body { font-size:13px; color:#78350F; white-space:pre-line; line-height:1.6; }

.tm-error { background:#FEF2F2; border:1.5px solid #FECACA; border-radius:12px; padding:10px 14px; font-size:13px; color:#DC2626; margin-bottom:12px; }
.tm-open-notice {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #FFF7ED;
  border: 1.5px solid #FED7AA;
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 12px;
}
.tm-open-icon { font-size: 22px; }
.tm-open-label { font-size: 13px; font-weight: 700; color: #C2410C; }
.tm-open-date  { font-size: 12px; color: #9A3412; margin-top: 2px; }
.tm-open-ok {
  font-size: 12px;
  color: #059669;
  background: #ECFDF5;
  border-radius: 10px;
  padding: 7px 12px;
  margin-bottom: 10px;
  font-weight: 600;
}

.tm-btn-book {
  width:100%; padding:15px;
  background:linear-gradient(135deg,#6366F1 0%,#7C3AED 100%);
  color:white; border:none; border-radius:16px; font-size:16px; font-weight:800;
  cursor:pointer; font-family:'Sarabun',sans-serif;
  box-shadow:0 4px 16px rgba(99,102,241,0.4);
  display:flex; align-items:center; justify-content:center; gap:6px;
  transition:transform 0.1s, box-shadow 0.1s;
}
.tm-btn-book:active:not(:disabled) { transform:scale(0.97); }
.tm-btn-book:disabled { opacity:0.55; cursor:not-allowed; box-shadow:none; }
.tm-btn-spinner { width:14px; height:14px; border:2px solid rgba(255,255,255,0.4); border-top-color:white; border-radius:50%; animation:spin 0.7s linear infinite; }

/* ── Slip upload state ── */
.tm-slip-wrap { padding:0; }
.tm-slip-header { text-align:center; margin-bottom:16px; }
.tm-slip-icon { font-size:40px; margin-bottom:6px; }
.tm-slip-title { font-size:17px; font-weight:800; color:#1E1B4B; margin-bottom:4px; }
.tm-slip-no { font-size:13px; font-weight:700; color:#6366F1; letter-spacing:1px; margin-bottom:6px; }
.tm-slip-sub { font-size:12px; color:#6B7280; }

.tm-slip-upload-zone {
  border:2.5px dashed #C7D2FE;
  border-radius:16px;
  background:#F5F3FF;
  min-height:160px;
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; margin-bottom:14px; overflow:hidden;
  transition:border-color 0.15s, background 0.15s;
}
.tm-slip-upload-zone:hover { border-color:#6366F1; background:#EEF2FF; }
.tm-slip-preview { width:100%; max-height:260px; object-fit:contain; display:block; }
.tm-slip-placeholder { text-align:center; padding:20px; }

/* ── Ticket card ── */
.tm-ticket-wrap { padding:0; }

.tkt { background:white; border-radius:20px; overflow:hidden; box-shadow:0 12px 40px rgba(99,102,241,0.18), 0 2px 10px rgba(0,0,0,0.08); margin-bottom:4px; }
.tkt-cancelled { opacity:0.65; filter:grayscale(0.4); }

.tkt-top { background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 60%,#A855F7 100%); padding:20px 20px 0; text-align:center; position:relative; overflow:visible; }
.tkt-dots { position:absolute; inset:0; pointer-events:none; overflow:hidden; }
.tkt-dot { position:absolute; width:6px; height:6px; border-radius:50%; background:rgba(255,255,255,0.15); }
.tkt-dot:nth-child(1)  { top:8%;  left:6%;  width:8px;height:8px; }
.tkt-dot:nth-child(2)  { top:18%; left:18%; }
.tkt-dot:nth-child(3)  { top:5%;  left:35%; width:4px;height:4px; }
.tkt-dot:nth-child(4)  { top:30%; left:50%; width:10px;height:10px;opacity:.08; }
.tkt-dot:nth-child(5)  { top:12%; left:70%; width:5px;height:5px; }
.tkt-dot:nth-child(6)  { top:40%; left:82%; width:8px;height:8px; }
.tkt-dot:nth-child(7)  { top:55%; left:92%; width:4px;height:4px; }
.tkt-dot:nth-child(8)  { top:60%; left:5%;  width:6px;height:6px; }
.tkt-dot:nth-child(9)  { top:75%; left:25%; width:4px;height:4px; }
.tkt-dot:nth-child(10) { top:80%; left:60%; width:7px;height:7px;opacity:.1; }
.tkt-dot:nth-child(11) { top:70%; left:75%; width:5px;height:5px; }
.tkt-dot:nth-child(12) { top:20%; left:90%; width:4px;height:4px; }

.tkt-emoji-ring { width:72px; height:72px; background:rgba(255,255,255,0.18); border:2.5px solid rgba(255,255,255,0.35); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 10px; backdrop-filter:blur(4px); }
.tkt-big-emoji { font-size:36px; }
.tkt-ticket-type { font-size:10px; font-weight:700; color:rgba(255,255,255,0.7); text-transform:uppercase; letter-spacing:1.5px; margin-bottom:4px; }
.tkt-event-name { font-size:16px; font-weight:800; color:white; margin-bottom:10px; line-height:1.3; text-shadow:0 1px 6px rgba(0,0,0,0.2); }

.tkt-status-pill { display:inline-block; font-size:11px; font-weight:700; padding:4px 14px; border-radius:20px; margin-bottom:14px; }
.pill-blue  { background:rgba(255,255,255,0.22); color:white; border:1px solid rgba(255,255,255,0.4); }
.pill-green { background:#D1FAE5; color:#065F46; }
.pill-red   { background:#FEE2E2; color:#991B1B; }

.tkt-wave { display:block; width:100%; height:20px; margin-bottom:-1px; }

.tkt-body { padding:14px 18px 6px; display:flex; flex-direction:column; gap:10px; }
.tkt-row { display:flex; gap:8px; }
.tkt-field { flex:1; }
.tkt-field-r { text-align:right; }
.tkt-field-label { font-size:9px; font-weight:700; color:#9CA3AF; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:3px; }
.tkt-field-val { font-size:13px; font-weight:700; color:#1E1B4B; line-height:1.3; }
.tkt-no { font-size:15px; color:#6366F1; letter-spacing:1.5px; }

.tkt-perf { display:flex; align-items:center; margin:10px 0 0; position:relative; }
.tkt-perf-notch { width:18px; height:18px; background:#F5F6FF; border-radius:50%; flex-shrink:0; border:1.5px solid #E0E7FF; }
.tkt-notch-l { margin-left:-9px; }
.tkt-notch-r { margin-right:-9px; }
.tkt-perf-dash { flex:1; border-top:2px dashed #DDD6FE; margin:0 4px; }

.tkt-qr-section { padding:16px 18px 20px; text-align:center; }
.tkt-qr-box { position:relative; display:inline-block; padding:10px; background:#FAFAFA; border-radius:14px; border:1.5px solid #E5E7EB; }
.tkt-corner { position:absolute; width:14px; height:14px; border-color:#6366F1; border-style:solid; }
.tkt-c-tl { top:4px; left:4px;  border-width:2.5px 0 0 2.5px; border-radius:3px 0 0 0; }
.tkt-c-tr { top:4px; right:4px; border-width:2.5px 2.5px 0 0; border-radius:0 3px 0 0; }
.tkt-c-bl { bottom:4px; left:4px;  border-width:0 0 2.5px 2.5px; border-radius:0 0 0 3px; }
.tkt-c-br { bottom:4px; right:4px; border-width:0 2.5px 2.5px 0; border-radius:0 0 3px 0; }
.tkt-qr-img { display:block; border-radius:8px; }
.tkt-qr-label { font-size:11px; color:#9CA3AF; margin-top:10px; line-height:1.5; }

/* Actions */
.tm-ticket-actions { display:flex; flex-direction:column; gap:8px; margin-top:14px; }
.tm-btn-close { width:100%; padding:13px; background:linear-gradient(135deg,#6366F1,#7C3AED); color:white; border:none; border-radius:14px; font-size:15px; font-weight:700; cursor:pointer; font-family:'Sarabun',sans-serif; box-shadow:0 4px 12px rgba(99,102,241,0.3); }
.tm-btn-cancel { width:100%; padding:11px; background:white; color:#9CA3AF; border:1.5px solid #E5E7EB; border-radius:14px; font-size:13px; font-weight:600; cursor:pointer; font-family:'Sarabun',sans-serif; }
.tm-btn-cancel:disabled { opacity:0.5; cursor:not-allowed; }
</style>
