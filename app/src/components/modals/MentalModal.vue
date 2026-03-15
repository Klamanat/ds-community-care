<template>
  <BaseModal modal-id="modal-mental">
    <!-- Header -->
    <div class="mh-header">
      <div class="mh-orb mh-orb1"></div>
      <div class="mh-orb mh-orb2"></div>
      <div class="modal-handle" style="background:rgba(255,255,255,0.4);"></div>
      <div class="mh-header-body">
        <div class="mh-icon">🧠</div>
        <div class="mh-title">Mental Health Consultation</div>
        <div class="mh-sub">ดูแลสุขภาพใจ พร้อม 24/7 💙</div>
      </div>
      <div class="mh-private-badge">
        <span>🔒</span>
        <span>ปลอดภัย · ปกปิดตัวตน 100%</span>
      </div>
    </div>

    <!-- Body -->
    <div class="modal-body-scroll" style="padding:16px;">

      <div v-if="!mental.loaded" class="mh-loading">⏳ กำลังโหลด...</div>

      <div v-else-if="!mental.advisors.length && view === 'list'" class="mh-empty">
        <div style="font-size:40px;margin-bottom:8px;">🌿</div>
        <div>ยังไม่มีที่ปรึกษาในระบบ</div>
      </div>

      <template v-else>

        <!-- ── List view ── -->
        <template v-if="view === 'list'">
          <div class="mh-section-label">🌿 เลือกที่ปรึกษาที่ต้องการติดต่อ</div>

          <div class="mh-list">
            <button v-for="c in mental.advisors" :key="c.id" class="mh-card" @click="selectAdvisor(c)">
              <div class="mh-av" :style="{ background: avatarGrad(c.name) }">
                {{ (c.name || '?').charAt(0) }}
              </div>
              <div class="mh-card-info">
                <div class="mh-card-name">{{ c.name }}</div>
                <div v-if="c.role" class="mh-card-role">{{ c.role }}</div>
              </div>
              <div class="mh-card-arr">›</div>
            </button>
          </div>

          <div class="mh-notice">
            🔐 ระบบจะไม่เปิดเผยชื่อหรือข้อมูลใดๆ<br>การพูดคุยเป็นความลับ 100%
          </div>

          <!-- History link -->
          <button class="mh-history-btn" @click="openHistory">
            📨 ดูข้อความที่ส่ง
            <span v-if="hasUnreplied" class="mh-history-dot"></span>
          </button>
        </template>

        <!-- ── Request form view ── -->
        <template v-else-if="view === 'form'">
          <button class="mh-back" @click="view = 'list'">← กลับ</button>

          <div class="mh-form-advisor">
            <div class="mh-av mh-av-lg" :style="{ background: avatarGrad(selected.name) }">
              {{ (selected.name || '?').charAt(0) }}
            </div>
            <div>
              <div class="mh-card-name">{{ selected.name }}</div>
              <div v-if="selected.role" class="mh-card-role">{{ selected.role }}</div>
            </div>
          </div>

          <div class="mh-anon-badge">🙈 ข้อความจะถูกส่งแบบไม่ระบุตัวตน</div>

          <textarea
            v-model="message"
            class="mh-textarea"
            placeholder="พิมพ์ข้อความที่ต้องการปรึกษา..."
            maxlength="500"
            rows="5"
          ></textarea>
          <div class="mh-char-count">{{ message.length }}/500</div>

          <div v-if="sendError" class="mh-send-error">⚠️ {{ sendError }}</div>

          <button class="mh-send-btn" :disabled="sending || !message.trim()" @click="sendRequest">
            {{ sending ? '⏳ กำลังส่ง...' : '📨 ส่งข้อความ' }}
          </button>
        </template>

        <!-- ── Sent view ── -->
        <template v-else-if="view === 'sent'">
          <div class="mh-sent">
            <div class="mh-sent-icon">✅</div>
            <div class="mh-sent-title">ส่งข้อความสำเร็จ</div>
            <div class="mh-sent-sub">
              {{ selected.name }} จะได้รับข้อความของคุณ<br>ขอบคุณที่ไว้วางใจ 💙
            </div>
            <button class="mh-send-btn" style="margin-top:16px;" @click="openHistory">
              📨 ดูข้อความที่ส่ง
            </button>
            <button class="mh-back" style="margin-top:10px;display:block;text-align:center;width:100%;" @click="reset">
              ส่งข้อความอื่น
            </button>
          </div>
        </template>

        <!-- ── History view ── -->
        <template v-else-if="view === 'history'">
          <button class="mh-back" @click="view = 'list'">← กลับ</button>
          <div class="mh-section-label" style="margin-bottom:12px;">📨 ข้อความที่ส่ง</div>

          <div v-if="mental.senderLoading" class="mh-loading">⏳ กำลังโหลด...</div>
          <div v-else-if="mental.senderError" class="mh-send-error" style="margin-bottom:12px;">
            ⚠️ {{ mental.senderError }}
            <button class="mh-back" style="margin-top:8px;display:block;" @click="openHistory">🔄 ลองใหม่</button>
          </div>
          <div v-else-if="!mental.senderRequests.length" class="mh-empty">
            <div style="font-size:32px;margin-bottom:8px;">📭</div>
            <div>ยังไม่มีข้อความที่ส่ง</div>
          </div>

          <div v-else class="mh-history-list">
            <div v-for="r in mental.senderRequests" :key="r.id" class="mh-hist-card">
              <!-- Sent to -->
              <div class="mh-hist-to">
                <div class="mh-av mh-av-sm" :style="{ background: avatarGrad(r.counselorName) }">
                  {{ (r.counselorName || '?').charAt(0) }}
                </div>
                <span class="mh-hist-name">{{ r.counselorName }}</span>
                <span class="mh-hist-time">{{ fmtTime(r.createdAt) }}</span>
              </div>
              <!-- User's message -->
              <div class="mh-hist-msg">{{ r.message }}</div>
              <!-- Counselor reply -->
              <div v-if="r.reply" class="mh-hist-reply">
                <div class="mh-hist-reply-label">💬 ตอบกลับ</div>
                <div class="mh-hist-reply-text">{{ r.reply }}</div>
                <div class="mh-hist-reply-time">{{ fmtTime(r.repliedAt) }}</div>
              </div>
              <div v-else class="mh-hist-pending">⏳ รอการตอบกลับ...</div>
            </div>
          </div>
        </template>

      </template>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import BaseModal from '../shared/BaseModal.vue'
import { useMentalStore }   from '../../stores/mental.js'
import { useUserAuthStore } from '../../stores/userAuth.js'

const mental   = useMentalStore()
const userAuth = useUserAuthStore()

const view      = ref('list')
const selected  = ref(null)
const message   = ref('')
const sending   = ref(false)
const sendError = ref('')

const hasUnreplied = computed(() =>
  mental.senderRequests.some(r => !r.reply)
)

const GRADS = [
  'linear-gradient(135deg,#FDE68A,#F59E0B)',
  'linear-gradient(135deg,#FBCFE8,#EC4899)',
  'linear-gradient(135deg,#A7F3D0,#10B981)',
  'linear-gradient(135deg,#C7D2FE,#6366F1)',
  'linear-gradient(135deg,#BAE6FD,#0EA5E9)',
  'linear-gradient(135deg,#FED7AA,#F97316)',
]
function avatarGrad(name) {
  const n = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return GRADS[n % GRADS.length]
}

function fmtTime(iso) {
  if (!iso) return ''
  try {
    const d    = new Date(iso)
    const diff = Date.now() - d
    if (diff < 60000)    return 'เมื่อกี้'
    if (diff < 3600000)  return Math.floor(diff / 60000) + ' นาทีที่แล้ว'
    if (diff < 86400000) return Math.floor(diff / 3600000) + ' ชั่วโมงที่แล้ว'
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
  } catch { return '' }
}

function selectAdvisor(c) {
  selected.value  = c
  message.value   = ''
  sendError.value = ''
  view.value      = 'form'
}

async function sendRequest() {
  if (!message.value.trim()) return
  sending.value   = true
  sendError.value = ''
  try {
    await mental.submitRequest(
      selected.value.employeeId,
      message.value.trim(),
      userAuth.userId,
    )
    view.value = 'sent'
  } catch (e) {
    sendError.value = e.message || 'เกิดข้อผิดพลาด'
  } finally {
    sending.value = false
  }
}

function openHistory() {
  mental.loadSenderRequests(userAuth.userId, true)
  view.value = 'history'
}

function reset() {
  view.value     = 'list'
  selected.value = null
  message.value  = ''
}

onMounted(() => mental.loadAdvisors())
</script>

<style scoped>
.mh-header {
  background: linear-gradient(135deg,#A8E6CF 0%,#56C596 45%,#2EAF7D 100%);
  padding: 0 20px 18px;
  position: relative; overflow: hidden; flex-shrink: 0;
  border-radius: 28px 28px 0 0;
}
.mh-orb { position: absolute; border-radius: 50%; pointer-events: none; }
.mh-orb1 { width:110px;height:110px;top:-30px;right:-20px;background:rgba(255,255,255,0.1); }
.mh-orb2 { width:70px; height:70px; bottom:-20px;left:10px; background:rgba(255,255,255,0.08); }

.mh-header-body { text-align:center; position:relative; z-index:1; }
.mh-icon  { font-size:52px; margin-bottom:4px; }
.mh-title { font-size:20px; font-weight:800; color:white; text-shadow:0 2px 4px rgba(0,0,0,0.15); }
.mh-sub   { font-size:11px; color:rgba(255,255,255,0.85); margin-top:3px; }

.mh-private-badge {
  display:flex; align-items:center; justify-content:center; gap:6px;
  background:rgba(255,255,255,0.18); border-radius:30px; padding:7px 18px;
  margin-top:12px; backdrop-filter:blur(4px);
  border:1px solid rgba(255,255,255,0.3);
  font-size:11px; font-weight:700; color:white;
  position:relative; z-index:1;
}

.mh-section-label {
  font-size:12px; font-weight:800; color:#6B7280;
  text-align:center; letter-spacing:0.5px; margin-bottom:12px;
}

.mh-list { display:flex; flex-direction:column; gap:10px; margin-bottom:16px; }

.mh-card {
  display:flex; align-items:center; gap:12px;
  padding:12px 14px; width:100%; text-align:left;
  background:white; border:1.5px solid #E5E7EB; border-radius:16px;
  cursor:pointer; transition:border-color 0.15s, box-shadow 0.15s, transform 0.1s;
  box-shadow:0 1px 4px rgba(0,0,0,0.05);
}
.mh-card:hover  { border-color:#2EAF7D; box-shadow:0 4px 14px rgba(46,175,125,0.15); }
.mh-card:active { transform:scale(0.98); }

.mh-av {
  width:52px; height:52px; border-radius:50%; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  font-size:22px; font-weight:800; color:white;
}
.mh-av-lg { width:60px; height:60px; font-size:26px; }
.mh-av-sm { width:32px; height:32px; font-size:14px; flex-shrink:0; }

.mh-card-info { flex:1; min-width:0; }
.mh-card-name { font-size:14px; font-weight:800; color:#111827; }
.mh-card-role { font-size:11px; color:#6B7280; margin-top:1px; }
.mh-card-arr { font-size:22px; color:#D1D5DB; flex-shrink:0; }
.mh-card:hover .mh-card-arr { color:#2EAF7D; }

.mh-notice {
  background:linear-gradient(135deg,#F0FDF4,#DCFCE7);
  border:1.5px solid #86EFAC; border-radius:14px; padding:12px;
  text-align:center; font-size:11px; color:#15803D; font-weight:700; line-height:1.6;
  margin-bottom:12px;
}

.mh-history-btn {
  display:flex; align-items:center; justify-content:center; gap:8px;
  width:100%; padding:10px; background:none;
  border:1.5px dashed #D1D5DB; border-radius:12px;
  font-size:13px; font-weight:700; color:#6B7280; cursor:pointer;
  transition:border-color 0.15s, color 0.15s;
}
.mh-history-btn:hover { border-color:#2EAF7D; color:#2EAF7D; }
.mh-history-dot {
  width:8px; height:8px; border-radius:50%; background:#F59E0B;
}

/* ── Form view ── */
.mh-back {
  background:none; border:none; color:#6B7280;
  font-size:13px; font-weight:700; cursor:pointer;
  padding:0; margin-bottom:14px;
}
.mh-back:hover { color:#111827; }

.mh-form-advisor {
  display:flex; align-items:center; gap:12px;
  padding:12px; background:#F9FAFB;
  border:1.5px solid #E5E7EB; border-radius:14px;
  margin-bottom:12px;
}

.mh-anon-badge {
  display:flex; align-items:center; justify-content:center;
  background:#FFF7ED; border:1px solid #FED7AA; border-radius:10px;
  padding:7px 12px; font-size:11px; font-weight:700; color:#92400E;
  margin-bottom:12px;
}

.mh-textarea {
  width:100%; padding:12px; box-sizing:border-box;
  border:1.5px solid #E5E7EB; border-radius:12px;
  font-size:14px; color:#111827; line-height:1.6;
  resize:none; outline:none; font-family:inherit;
}
.mh-textarea:focus { border-color:#2EAF7D; }

.mh-char-count { text-align:right; font-size:11px; color:#9CA3AF; margin-top:4px; margin-bottom:12px; }

.mh-send-error {
  background:#FEF2F2; border:1px solid #FECACA; border-radius:8px;
  padding:8px 12px; font-size:12px; color:#DC2626; margin-bottom:10px;
}

.mh-send-btn {
  width:100%; padding:13px;
  background:linear-gradient(135deg,#2EAF7D,#10B981);
  color:white; font-size:15px; font-weight:800;
  border:none; border-radius:14px; cursor:pointer;
  transition:opacity 0.15s, transform 0.1s;
}
.mh-send-btn:active { transform:scale(0.98); }
.mh-send-btn:disabled { opacity:0.5; cursor:not-allowed; }

/* ── Sent view ── */
.mh-sent { text-align:center; padding:24px 16px; }
.mh-sent-icon  { font-size:56px; margin-bottom:8px; }
.mh-sent-title { font-size:20px; font-weight:900; color:#111827; margin-bottom:8px; }
.mh-sent-sub   { font-size:13px; color:#6B7280; line-height:1.7; }

/* ── History view ── */
.mh-history-list { display:flex; flex-direction:column; gap:12px; }

.mh-hist-card {
  background:white; border:1.5px solid #E5E7EB; border-radius:16px;
  padding:14px; overflow:hidden;
}

.mh-hist-to {
  display:flex; align-items:center; gap:8px; margin-bottom:10px;
}
.mh-hist-name { font-size:13px; font-weight:800; color:#111827; flex:1; }
.mh-hist-time { font-size:10px; color:#9CA3AF; }

.mh-hist-msg {
  font-size:13px; color:#374151; line-height:1.6;
  background:#F9FAFB; border-radius:10px; padding:10px;
  margin-bottom:8px;
}

.mh-hist-reply {
  background:linear-gradient(135deg,#F0FDF4,#DCFCE7);
  border:1.5px solid #86EFAC; border-radius:10px; padding:10px;
}
.mh-hist-reply-label { font-size:10px; font-weight:800; color:#15803D; margin-bottom:4px; }
.mh-hist-reply-text  { font-size:13px; color:#111827; line-height:1.6; }
.mh-hist-reply-time  { font-size:10px; color:#6B7280; margin-top:4px; }

.mh-hist-pending { font-size:11px; color:#9CA3AF; font-style:italic; }

.mh-loading { text-align:center; padding:32px; color:#9CA3AF; font-size:14px; }
.mh-empty   { text-align:center; padding:32px; color:#9CA3AF; font-size:13px; }
</style>
