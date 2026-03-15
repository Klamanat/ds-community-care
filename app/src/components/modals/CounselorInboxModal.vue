<template>
  <BaseModal modal-id="modal-counselor-inbox">
    <!-- Header -->
    <div class="ci-header">
      <div class="ci-orb ci-orb1"></div>
      <div class="ci-orb ci-orb2"></div>
      <div class="modal-handle" style="background:rgba(255,255,255,0.4);"></div>
      <div class="ci-header-body">
        <div class="ci-icon">💬</div>
        <div class="ci-title">กล่องข้อความที่ปรึกษา</div>
        <div class="ci-sub">ข้อความจากผู้ขอคำปรึกษา (ปกปิดตัวตน)</div>
      </div>
      <div v-if="mental.unreadCount" class="ci-unread-strip">
        {{ mental.unreadCount }} ข้อความใหม่
      </div>
    </div>

    <!-- Body -->
    <div class="modal-body-scroll" style="padding:16px;">

      <div v-if="mental.requestsLoading" class="ci-loading">⏳ กำลังโหลด...</div>

      <div v-else-if="mental.requestsError" class="ci-error">
        ⚠️ {{ mental.requestsError }}
        <button class="ci-retry" @click="reload">โหลดใหม่</button>
      </div>

      <div v-else-if="!unreadList.length" class="ci-empty">
        <div style="font-size:40px;margin-bottom:8px;">✅</div>
        <div>ไม่มีข้อความใหม่</div>
        <div style="font-size:11px;margin-top:4px;color:#D1D5DB;">อ่านครบทุกข้อความแล้ว</div>
      </div>

      <div v-else>
        <div class="ci-count">
          แสดง {{ visibleList.length }} จาก {{ unreadList.length }} ข้อความใหม่
        </div>

        <div
          v-for="r in visibleList"
          :key="r.id"
          class="ci-item ci-item-unread"
        >
          <!-- Message header -->
          <div class="ci-item-top">
            <span class="ci-new-badge">ใหม่</span>
            <span v-if="r.reply" class="ci-replied-badge">ตอบแล้ว</span>
            <span class="ci-time">{{ fmtTime(r.createdAt) }}</span>
          </div>

          <!-- User message -->
          <div class="ci-msg">{{ r.message }}</div>

          <!-- Existing reply -->
          <div v-if="r.reply" class="ci-my-reply">
            <div class="ci-reply-label">💬 คุณตอบไว้</div>
            <div class="ci-reply-text">{{ r.reply }}</div>
            <div class="ci-reply-time">{{ fmtTime(r.repliedAt) }}</div>
          </div>

          <!-- Reply input (toggle) -->
          <div v-if="replyingId === r.id" class="ci-reply-box">
            <textarea
              v-model="replyText"
              class="ci-reply-input"
              :placeholder="r.reply ? 'แก้ไขการตอบกลับ...' : 'พิมพ์คำตอบ...'"
              maxlength="500"
              rows="3"
            ></textarea>
            <div class="ci-reply-actions">
              <button class="ci-cancel-btn" @click="replyingId = null; replyText = ''">ยกเลิก</button>
              <button
                class="ci-send-reply-btn"
                :disabled="replying || !replyText.trim()"
                @click="sendReply(r.id)"
              >
                {{ replying ? '⏳' : '✅ ส่ง' }}
              </button>
            </div>
            <div v-if="replyError" class="ci-reply-error">⚠️ {{ replyError }}</div>
          </div>
          <button v-else class="ci-reply-btn" @click="startReply(r)">
            💬 {{ r.reply ? 'แก้ไขคำตอบ' : 'ตอบกลับ' }}
          </button>
        </div>

        <!-- Load more -->
        <button v-if="hasMore" class="ci-load-more" @click="loadMore">
          โหลดเพิ่ม ({{ unreadList.length - visibleCount }} รายการ)
        </button>
      </div>

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

const replyingId = ref(null)
const replyText  = ref('')
const replying   = ref(false)
const replyError = ref('')

// ── Pagination + filter ──────────────────────────────────────
const PAGE         = 5
const visibleCount = ref(PAGE)

const unreadList = computed(() =>
  mental.myRequests.filter(r => r.isRead !== 'true')
)
const visibleList = computed(() =>
  unreadList.value.slice(0, visibleCount.value)
)
const hasMore = computed(() =>
  visibleCount.value < unreadList.value.length
)
function loadMore() { visibleCount.value += PAGE }

function reload() {
  visibleCount.value = PAGE
  mental.loadMyRequests(userAuth.userId, true)
}

function startReply(r) {
  replyingId.value = r.id
  replyText.value  = r.reply || ''
  replyError.value = ''
}

async function sendReply(requestId) {
  if (!replyText.value.trim()) return
  replying.value   = true
  replyError.value = ''
  try {
    await mental.addReply(requestId, replyText.value.trim(), userAuth.userId)
    replyingId.value = null
    replyText.value  = ''
  } catch (e) {
    replyError.value = e.message || 'ส่งไม่สำเร็จ'
  } finally {
    replying.value = false
  }
}

function fmtTime(iso) {
  if (!iso) return ''
  try {
    const d    = new Date(iso)
    const diff = Date.now() - d
    if (diff < 60000)    return 'เมื่อกี้'
    if (diff < 3600000)  return Math.floor(diff / 60000) + ' นาทีที่แล้ว'
    if (diff < 86400000) return Math.floor(diff / 3600000) + ' ชั่วโมงที่แล้ว'
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

onMounted(() => {
  mental.loadMyRequests(userAuth.userId, true)
})
</script>

<style scoped>
.ci-header {
  background: linear-gradient(135deg, #A8E6CF 0%, #56C596 45%, #2EAF7D 100%);
  padding: 0 20px 18px;
  position: relative; overflow: hidden; flex-shrink: 0;
  border-radius: 28px 28px 0 0;
}
.ci-orb { position: absolute; border-radius: 50%; pointer-events: none; }
.ci-orb1 { width: 110px; height: 110px; top: -30px; right: -20px; background: rgba(255,255,255,0.1); }
.ci-orb2 { width: 70px;  height: 70px;  bottom: -20px; left: 10px; background: rgba(255,255,255,0.08); }

.ci-header-body { text-align: center; position: relative; z-index: 1; }
.ci-icon  { font-size: 48px; margin-bottom: 4px; }
.ci-title { font-size: 18px; font-weight: 800; color: white; }
.ci-sub   { font-size: 11px; color: rgba(255,255,255,0.85); margin-top: 3px; }

.ci-unread-strip {
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.18); border-radius: 30px; padding: 6px 18px;
  margin-top: 12px; backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,0.3);
  font-size: 12px; font-weight: 800; color: white;
  position: relative; z-index: 1;
}

.ci-loading { text-align: center; padding: 32px; color: #9CA3AF; font-size: 14px; }
.ci-empty   { text-align: center; padding: 32px; color: #9CA3AF; font-size: 13px; }

.ci-error {
  background: #FEF2F2; border-radius: 10px; padding: 12px 14px;
  font-size: 12px; color: #DC2626;
  display: flex; align-items: center; gap: 8px;
}
.ci-retry {
  background: none; border: 1px solid #DC2626; color: #DC2626;
  font-size: 11px; font-weight: 700; border-radius: 6px;
  padding: 2px 8px; cursor: pointer; margin-left: auto;
}

.ci-count { font-size: 11px; font-weight: 700; color: #9CA3AF; text-align: center; margin-bottom: 12px; }

.ci-item {
  background: white; border: 1.5px solid #E5E7EB; border-radius: 16px;
  padding: 14px; margin-bottom: 10px; overflow: hidden;
}
.ci-item-unread { background: #F0FDF4; border-color: #86EFAC; }

.ci-item-top {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 8px; cursor: pointer;
}
.ci-new-badge {
  font-size: 10px; font-weight: 800; color: #15803D;
  background: #DCFCE7; padding: 2px 8px; border-radius: 10px;
}
.ci-replied-badge {
  font-size: 10px; font-weight: 800; color: #1D4ED8;
  background: #DBEAFE; padding: 2px 8px; border-radius: 10px;
}
.ci-time { font-size: 10px; color: #9CA3AF; margin-left: auto; }

.ci-msg {
  font-size: 14px; color: #111827; line-height: 1.6;
  margin-bottom: 10px; cursor: pointer;
}

/* Existing reply display */
.ci-my-reply {
  background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 10px;
  padding: 10px; margin-bottom: 8px;
}
.ci-reply-label { font-size: 10px; font-weight: 800; color: #1D4ED8; margin-bottom: 4px; }
.ci-reply-text  { font-size: 13px; color: #1E3A8A; line-height: 1.5; }
.ci-reply-time  { font-size: 10px; color: #93C5FD; margin-top: 4px; }

/* Reply button */
.ci-reply-btn {
  width: 100%; padding: 8px;
  background: none; border: 1.5px dashed #D1D5DB; border-radius: 10px;
  font-size: 12px; font-weight: 700; color: #6B7280; cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.ci-reply-btn:hover { border-color: #2EAF7D; color: #2EAF7D; }

/* Reply input box */
.ci-reply-box { margin-top: 8px; }
.ci-reply-input {
  width: 100%; padding: 10px; box-sizing: border-box;
  border: 1.5px solid #2EAF7D; border-radius: 10px;
  font-size: 13px; color: #111827; line-height: 1.5;
  resize: none; outline: none; font-family: inherit;
}
.ci-reply-actions {
  display: flex; gap: 8px; margin-top: 8px; justify-content: flex-end;
}
.ci-cancel-btn {
  padding: 7px 14px; background: #F3F4F6; border: none; border-radius: 8px;
  font-size: 13px; font-weight: 700; color: #374151; cursor: pointer;
}
.ci-send-reply-btn {
  padding: 7px 18px;
  background: linear-gradient(135deg, #2EAF7D, #10B981);
  border: none; border-radius: 8px;
  font-size: 13px; font-weight: 800; color: white; cursor: pointer;
}
.ci-send-reply-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.ci-reply-error { font-size: 11px; color: #DC2626; margin-top: 6px; }

/* Load more */
.ci-load-more {
  width: 100%; padding: 11px;
  background: #F9FAFB; border: 1.5px dashed #D1D5DB; border-radius: 12px;
  font-size: 13px; font-weight: 700; color: #6B7280; cursor: pointer;
  margin-top: 4px; transition: border-color 0.15s, color 0.15s;
}
.ci-load-more:hover { border-color: #2EAF7D; color: #2EAF7D; }
</style>
