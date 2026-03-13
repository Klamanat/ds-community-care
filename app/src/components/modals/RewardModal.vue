<template>
  <BaseModal modal-id="modal-reward">
    <div class="rw-wrap flex-1 flex flex-col overflow-hidden">

      <!-- ── Header gradient ── -->
      <div class="rw-header">
        <!-- Decorative orbs -->
        <div class="rw-orb rw-orb-1"></div>
        <div class="rw-orb rw-orb-2"></div>

        <div class="modal-handle" style="background:rgba(255,255,255,0.4);"></div>

        <div class="rw-hero">
          <div class="rw-icon">🏆</div>
          <div class="rw-title">DS Reward</div>
          <div class="rw-sub">สะสมคะแนนแลกของรางวัล 🎁</div>
        </div>

        <!-- Points + Level card -->
        <div class="rw-pts-card">
          <div class="rw-pts-left">
            <div class="rw-pts-num">
              <span v-if="reward.loading" class="rw-skeleton-num"></span>
              <span v-else>{{ reward.total.toLocaleString() }}</span>
            </div>
            <div class="rw-pts-label">คะแนนสะสม</div>
          </div>
          <div class="rw-pts-divider"></div>
          <div class="rw-pts-right">
            <div class="rw-level-badge">{{ reward.levelName }}</div>
            <div class="rw-pts-label">ระดับปัจจุบัน</div>
          </div>
        </div>

        <!-- Progress bar -->
        <div v-if="reward.nextName" class="rw-progress-wrap">
          <div class="rw-progress-bar">
            <div class="rw-progress-fill" :style="{ width: reward.progress + '%' }"></div>
          </div>
          <div class="rw-progress-label">
            <span>{{ reward.total }} pts</span>
            <span>{{ reward.nextName }} ({{ reward.nextPts }} pts)</span>
          </div>
        </div>
        <div v-else class="rw-legend-label">🎉 คุณถึงระดับสูงสุดแล้ว!</div>
      </div>

      <!-- ── Body ── -->
      <div class="modal-body-scroll rw-body">

        <!-- ── Daily check-in card ── -->
        <div class="rw-checkin-card" :class="{ done: reward.checkedInToday }">
          <div class="rw-ci-left">
            <div class="rw-ci-icon">{{ reward.checkedInToday ? '✅' : '📅' }}</div>
            <div class="rw-ci-info">
              <div class="rw-ci-title">Check-in รายวัน</div>
              <div class="rw-ci-date">{{ todayThai }}</div>
            </div>
          </div>
          <div class="rw-ci-right">
            <div v-if="reward.checkedInToday" class="rw-ci-done-badge">
              <span v-if="checkinDone">+{{ checkinPts }} pts รับแล้ว!</span>
              <span v-else>เช็คอินแล้ววันนี้</span>
            </div>
            <button
              v-else
              class="rw-ci-btn"
              :disabled="reward.checkinLoading"
              @click="handleCheckin"
            >
              <span v-if="reward.checkinLoading" class="rw-ci-spinner"></span>
              <span v-else>รับ +{{ checkinPts }} pts</span>
            </button>
          </div>
        </div>
        <div v-if="checkinError" class="rw-checkin-error">⚠️ {{ checkinError }}</div>

        <!-- ── History section ── -->
        <div v-if="reward.history.length > 0" class="rw-section">
          <div class="rw-section-title">ประวัติคะแนน</div>
          <div class="rw-history-list">
            <div
              v-for="h in reward.history"
              :key="h.id"
              class="rw-hist-row"
            >
              <div class="rw-hist-icon">{{ typeEmoji(h.type, h.subtype) }}</div>
              <div class="rw-hist-info">
                <div class="rw-hist-desc">{{ h.desc || typeLabel(h.type, h.subtype) }}</div>
                <div class="rw-hist-time">{{ formatTime(h.createdAt) }}</div>
              </div>
              <div class="rw-hist-pts">+{{ h.amount }}</div>
            </div>
          </div>
        </div>

        <!-- Loading skeleton for history -->
        <div v-else-if="reward.loading" class="rw-section">
          <div class="rw-section-title">ประวัติคะแนน</div>
          <div v-for="i in 3" :key="i" class="rw-hist-skeleton"></div>
        </div>

        <!-- ── How to earn section ── -->
        <div class="rw-section">
          <div class="rw-section-title">✨ วิธีสะสมคะแนน</div>
          <div class="rw-earn-list">
            <div
              v-for="item in displayRules"
              :key="item.type"
              class="rw-earn-row"
              :style="{ background: ruleStyle(item).bgColor, borderColor: ruleStyle(item).color + '40' }"
            >
              <div class="rw-earn-icon">{{ item.icon }}</div>
              <div class="rw-earn-info">
                <div class="rw-earn-name">{{ item.name }}</div>
                <div class="rw-earn-desc">{{ item.desc }}</div>
              </div>
              <div class="rw-earn-badge" :style="{ background: ruleStyle(item).color }">+{{ item.pts }} pts</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import BaseModal from '../shared/BaseModal.vue'
import { useRewardStore }   from '../../stores/reward.js'
import { useUserAuthStore } from '../../stores/userAuth.js'

const reward   = useRewardStore()
const userAuth = useUserAuthStore()

const checkinDone = ref(false)  // true = just checked in this session (show confetti state)
const checkinError = ref('')

onMounted(() => {
  reward.load(userAuth.userName || '')
})

// Thai date for display
const todayThai = computed(() => {
  const d   = new Date()
  const days = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์']
  const mons = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
  return `วัน${days[d.getDay()]}ที่ ${d.getDate()} ${mons[d.getMonth()]} ${d.getFullYear() + 543}`
})

const checkinPts = computed(() => {
  const rule = (reward.rules.length ? reward.rules : FALLBACK_RULES)
    .find(r => r.type === 'daily_checkin' && !r.subtype)
  return rule?.pts ?? 5
})

async function handleCheckin() {
  checkinError.value = ''
  if (!userAuth.userName) { checkinError.value = 'กรุณาเข้าสู่ระบบก่อน'; return }
  const res = await reward.doCheckin(userAuth.userName)
  if (res.error) { checkinError.value = 'เกิดข้อผิดพลาด กรุณาลองใหม่'; return }
  if (!res.alreadyCheckedIn) checkinDone.value = true
}

// Fallback static rules if GAS not connected yet
const FALLBACK_RULES = [
  { type: 'join_activity',    subtype: '', icon: '🙌', name: 'เข้าร่วมกิจกรรม',       desc: 'เข้าร่วม event / กิจกรรมองค์กร',           pts: 50, color: '#6366F1' },
  { type: 'activity_checkin', subtype: '', icon: '📍', name: 'Check-in กิจกรรม',      desc: 'เช็คอินเข้างานเมื่อถึงสถานที่จัดงาน',       pts: 30, color: '#3B82F6' },
  { type: 'daily_checkin',    subtype: '', icon: '📅', name: 'Check-in รายวัน',        desc: 'เช็คอินประจำวัน (1 ครั้ง/วัน)',              pts: 5,  color: '#06C755' },
  { type: 'send_empathy',     subtype: '', icon: '💌', name: 'ส่ง Empathy ให้เพื่อน', desc: 'ส่งกำลังใจ / ข้อความให้เพื่อนร่วมงาน',    pts: 10, color: '#EC4899' },
  { type: 'birthday_wish',    subtype: '', icon: '🎂', name: 'อวยพรวันเกิดเพื่อน',    desc: 'ส่งคำอวยพรวันเกิดให้เพื่อนร่วมงาน',       pts: 5,  color: '#A855F7' },
]

const displayRules = computed(() => {
  const list = reward.rules.length ? reward.rules : FALLBACK_RULES
  return list.filter(r => String(r.active) !== 'false')
})

// Build a type|subtype → rule map for history lookup
const ruleMap = computed(() => {
  const map = {}
  displayRules.value.forEach(r => {
    map[r.type + '|' + (r.subtype || '')] = r
    // Also keep bare type key for fallback (last one wins = default rule)
    if (!r.subtype) map[r.type] = r
  })
  return map
})

function ruleStyle(rule) {
  const color = rule?.color || '#6366F1'
  return { color, bgColor: color + '18' }  // 18 = ~10% opacity hex
}

function typeEmoji(type, subtype) {
  return ruleMap.value[type + '|' + (subtype || '')]?.icon
    || ruleMap.value[type]?.icon
    || '⭐'
}
function typeLabel(type, subtype) {
  const rule = ruleMap.value[type + '|' + (subtype || '')] || ruleMap.value[type]
  if (!rule) return type
  return rule.name + (subtype ? ` (${subtype})` : '')
}
function formatTime(raw) {
  if (!raw) return ''
  const m = String(raw).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{2}):(\d{2})/)
  if (m) {
    const TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
    return `${+m[1]} ${TH[+m[2] - 1]} ${+m[3] + 543}`
  }
  const d = new Date(raw)
  if (isNaN(d)) return raw
  const TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
  return `${d.getDate()} ${TH[d.getMonth()]} ${d.getFullYear() + 543}`
}
</script>

<style scoped>
/* ── Wrapper ── */
.rw-wrap { background: #F0F2F5; }

/* ── Header ── */
.rw-header {
  background: linear-gradient(135deg, #06C755 0%, #00A040 100%);
  padding: 0 20px 20px;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  border-radius: 28px 28px 0 0;
}

/* Decorative orbs */
.rw-orb { position: absolute; border-radius: 50%; pointer-events: none; }
.rw-orb-1 { top: -30px; right: -20px; width: 120px; height: 120px; background: radial-gradient(circle, rgba(255,255,255,0.18), transparent 70%); }
.rw-orb-2 { bottom: -20px; left: -10px; width: 90px; height: 90px; background: radial-gradient(circle, rgba(255,255,255,0.1), transparent 70%); }

/* Hero */
.rw-hero { text-align: center; position: relative; z-index: 1; margin-top: 10px; }
.rw-icon { width: 56px; height: 56px; margin: 0 auto 10px; background: rgba(255,255,255,0.2); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 30px; border: 2px solid rgba(255,255,255,0.35); }
.rw-title { font-size: 22px; font-weight: 800; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.15); }
.rw-sub { font-size: 11px; color: rgba(255,255,255,0.85); margin-top: 3px; }

/* Points card */
.rw-pts-card {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  background: rgba(0,0,0,0.15);
  border-radius: 16px;
  padding: 12px 16px;
  margin-top: 14px;
  gap: 16px;
}
.rw-pts-left, .rw-pts-right { flex: 1; text-align: center; }
.rw-pts-divider { width: 1px; height: 36px; background: rgba(255,255,255,0.3); flex-shrink: 0; }
.rw-pts-num { font-size: 26px; font-weight: 900; color: #FFE566; line-height: 1; }
.rw-skeleton-num { display: inline-block; width: 60px; height: 26px; background: rgba(255,255,255,0.2); border-radius: 6px; animation: shimmer 1.4s infinite; }
.rw-pts-label { font-size: 10px; color: rgba(255,255,255,0.75); font-weight: 700; margin-top: 3px; }
.rw-level-badge { font-size: 16px; font-weight: 800; color: white; }

/* Progress */
.rw-progress-wrap { position: relative; z-index: 1; margin-top: 12px; }
.rw-progress-bar { height: 8px; background: rgba(255,255,255,0.25); border-radius: 8px; overflow: hidden; }
.rw-progress-fill { height: 100%; background: #FFE566; border-radius: 8px; transition: width 0.6s ease; }
.rw-progress-label { display: flex; justify-content: space-between; font-size: 10px; color: rgba(255,255,255,0.8); font-weight: 700; margin-top: 4px; }
.rw-legend-label { text-align: center; font-size: 13px; font-weight: 800; color: #FFE566; margin-top: 12px; position: relative; z-index: 1; }

/* ── Body ── */
.rw-body { padding: 12px 12px 24px; }

/* Section */
.rw-section { margin-bottom: 16px; }
.rw-section-title { font-size: 13px; font-weight: 800; color: #6B7280; letter-spacing: 0.5px; margin-bottom: 8px; padding: 0 4px; }

/* History rows */
.rw-history-list { background: white; border-radius: 16px; overflow: hidden; }
.rw-hist-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid #F0F2F5; }
.rw-hist-row:last-child { border-bottom: none; }
.rw-hist-icon { font-size: 22px; width: 32px; text-align: center; flex-shrink: 0; }
.rw-hist-info { flex: 1; min-width: 0; }
.rw-hist-desc { font-size: 13px; font-weight: 600; color: #050505; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rw-hist-time { font-size: 11px; color: #65676B; margin-top: 1px; }
.rw-hist-pts { font-size: 15px; font-weight: 800; color: #06C755; flex-shrink: 0; }

/* Skeleton */
.rw-hist-skeleton { height: 52px; background: linear-gradient(90deg, #F0F2F5 25%, #E4E6EB 50%, #F0F2F5 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 12px; margin-bottom: 4px; }

/* Earn rows */
.rw-earn-list { display: flex; flex-direction: column; gap: 10px; }
.rw-earn-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 18px;
  background: white;
  border: 2px solid #06C75530;
  transition: border-color 0.2s;
}
.rw-earn-icon { font-size: 28px; flex-shrink: 0; width: 36px; text-align: center; }
.rw-earn-info { flex: 1; min-width: 0; }
.rw-earn-name { font-size: 14px; font-weight: 700; color: #111827; line-height: 1.3; }
.rw-earn-desc { font-size: 12px; color: #4B5563; margin-top: 4px; line-height: 1.5; }
.rw-earn-badge {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 15px;
  font-weight: 900;
  color: white;
  flex-shrink: 0;
  white-space: nowrap;
  box-shadow: 0 3px 10px rgba(0,0,0,0.18);
  letter-spacing: 0.3px;
}

/* ── Daily check-in card ── */
.rw-checkin-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  border: 2px solid #06C75530;
  border-radius: 18px;
  padding: 14px 16px;
  margin-bottom: 16px;
  gap: 10px;
  transition: border-color 0.2s;
}
.rw-checkin-card.done {
  background: #F0FDF4;
  border-color: #BBF7D0;
}
.rw-ci-left { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.rw-ci-icon { font-size: 28px; flex-shrink: 0; }
.rw-ci-info { min-width: 0; }
.rw-ci-title { font-size: 14px; font-weight: 800; color: #050505; }
.rw-ci-date  { font-size: 11px; color: #6B7280; margin-top: 2px; }
.rw-ci-right { flex-shrink: 0; }
.rw-ci-btn {
  background: linear-gradient(135deg, #06C755, #00A040);
  color: white;
  font-size: 13px;
  font-weight: 800;
  border: none;
  border-radius: 22px;
  padding: 9px 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: opacity 0.15s, transform 0.1s;
  box-shadow: 0 2px 8px rgba(6,199,85,0.35);
}
.rw-ci-btn:active { transform: scale(0.96); opacity: 0.85; }
.rw-ci-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.rw-ci-done-badge {
  font-size: 12px;
  font-weight: 800;
  color: #16A34A;
  background: #DCFCE7;
  border-radius: 20px;
  padding: 7px 14px;
}
.rw-ci-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Check-in error */
.rw-checkin-error { font-size: 12px; font-weight: 700; color: #DC2626; background: #FEF2F2; border-radius: 10px; padding: 8px 12px; margin-bottom: 12px; }

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
