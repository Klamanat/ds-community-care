<template>
  <BaseModal modal-id="modal-month" sheet-class="modal-sheet--full">

    <!-- Detail overlay — info -->
    <Transition name="detail-slide">
      <div v-if="detailEv" class="month-detail-overlay" @click.self="detailEv = null">
        <div class="month-detail-panel">
          <button class="month-detail-close" @click="detailEv = null">✕</button>
          <div class="month-detail-body">
            <div class="month-detail-title">{{ detailEv.emoji }} {{ detailEv.name }}</div>
            <div class="month-info-list">
              <div v-if="detailEv.date" class="month-info-row">
                <span class="month-info-icon">📅</span>
                <span>{{ detailEv.date }}{{ detailEv.dateEnd ? ' – ' + detailEv.dateEnd : '' }}</span>
              </div>
              <div v-if="detailEv.loc" class="month-info-row">
                <span class="month-info-icon">📍</span>
                <span>{{ detailEv.loc }}</span>
              </div>
              <div v-if="detailEv.desc" class="month-info-row">
                <span class="month-info-icon">📝</span>
                <span style="white-space:pre-line;">{{ detailEv.desc }}</span>
              </div>
              <div v-if="detailEv.steps" class="month-info-row">
                <span class="month-info-icon">📋</span>
                <span style="white-space:pre-line;">{{ detailEv.steps }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Hero header -->
    <div class="month-hero" :style="{ background: meta.grad }">
      <div class="month-hero-inner">
        <div class="month-icon-wrap">
          <span class="month-icon-txt">{{ meta.icon }}</span>
        </div>
        <div class="month-hero-title">{{ meta.title }}</div>
        <div class="month-pills">
          <span v-for="ev in events" :key="ev.id" class="month-pill">
            {{ ev.emoji }} {{ ev.name }}
          </span>
          <span v-if="!events.length" class="month-pill">ยังไม่มีกิจกรรม</span>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="month-events-list">


      <!-- Loading -->
      <div v-if="acts.isLoading" class="month-empty">
        <div class="month-empty-icon">⏳</div>
        <div class="month-empty-title">กำลังโหลด...</div>
      </div>

      <!-- Empty -->
      <div v-else-if="!events.length" class="month-empty">
        <div class="month-empty-icon">📭</div>
        <div class="month-empty-title">ยังไม่มีกิจกรรมเดือนนี้</div>
        <div class="month-empty-sub">ติดตามกิจกรรมใหม่ๆ ได้เร็วๆ นี้ค่ะ ✨</div>
      </div>

      <!-- Event cards -->
      <div v-else class="month-events-grid">
        <div v-for="ev in events" :key="ev.id" class="month-ev-card">
          <img v-if="ev.imgUrl" :src="ev.imgUrl" class="month-ev-img" />
          <div v-else class="month-ev-banner" :style="{ background: 'linear-gradient(145deg,#E0E7FF,#6366F1)' }">
            <div class="month-ev-emoji">{{ ev.emoji || '🎉' }}</div>
            <div class="month-ev-name-hero">{{ ev.name }}</div>
          </div>
          <div class="month-ev-body">
            <div class="month-ev-title">{{ ev.name }}</div>
            <div class="month-ev-meta">
              <span v-if="ev.date">📅 {{ ev.date }}{{ ev.dateEnd ? ' – ' + ev.dateEnd : '' }}</span>
              <span v-if="ev.loc">📍 {{ ev.loc }}</span>
            </div>
            <div v-if="ev.desc" class="month-ev-desc">{{ ev.desc }}</div>

            <div class="month-ev-actions">
              <!-- Steps detail -->
              <button v-if="ev.desc || ev.steps" class="month-ev-detail" @click="detailEv = ev">รายละเอียด 📋</button>

              <!-- External link -->
              <button v-if="ev.joinUrl" class="month-ev-extlink" @click="openLink(ev.joinUrl)">
                🔗 เปิด Link
              </button>

              <!-- ยังไม่ถึงเวลาเปิดรับ -->
              <span v-if="!isJoined(ev.id) && ev.joinLabel && joinStatus(ev) === 'not_yet'" class="month-ev-join-closed">⏳ {{ ev.joinOpenAt ? 'เริ่ม ' + formatOpenAt(ev) : 'ยังไม่ถึงวันที่เริ่มกิจกรรม' }}</span>

              <!-- ปิดรับสมัคร (admin กำหนด / เลยเวลา) -->
              <span v-else-if="!isJoined(ev.id) && ev.joinLabel && joinStatus(ev) === 'closed'" class="month-ev-join-closed">🔒 สิ้นสุดกิจกรรมแล้ว</span>

              <!-- เลยเดือนแล้ว -->
              <span v-else-if="isPastMonth && !isJoined(ev.id) && ev.joinLabel" class="month-ev-join-closed">🔒 สิ้นสุดกิจกรรม</span>

              <!-- รอโหลด stamp ก่อน — ป้องกัน flash ปุ่ม check-in -->
              <span v-else-if="!stampsLoaded && ev.joinLabel"></span>

              <!-- Not joined -->
              <button
                v-else-if="!isJoined(ev.id) && ev.joinLabel"
                class="month-ev-join"
                :disabled="stamping[ev.id]"
                @click="stampJoin(ev)"
              >
                {{ stamping[ev.id] ? '...' : joinBtnLabel(ev.joinLabel) }}
              </button>

              <!-- Joined: checkin only -->
              <template v-else-if="isJoined(ev.id) && ev.joinLabel === 'checkin'">
                <span class="month-ev-stamped">✅ เข้าร่วมกิจกรรมแล้ว</span>
              </template>

              <!-- Joined: stamp — reward not claimed -->
              <template v-else-if="isJoined(ev.id) && ev.joinLabel === 'stamp' && !isClaimed(ev.id)">
                <span class="month-ev-stamped">✅ เข้าร่วมกิจกรรมแล้ว</span>
                <button class="month-ev-egg" @click="openEgg(ev)">🥚 รับรางวัล</button>
              </template>

              <!-- Joined: stamp — claimed -->
              <template v-else-if="isJoined(ev.id) && ev.joinLabel === 'stamp'">
                <span class="month-ev-stamped">✅ เข้าร่วมกิจกรรมแล้ว</span>
                <span class="month-ev-claimed">🎁 รับรางวัลแล้ว</span>
              </template>

              <!-- Joined: fallback (no label / other) -->
              <template v-else-if="isJoined(ev.id)">
                <span class="month-ev-stamped">✅ เข้าร่วมกิจกรรมแล้ว</span>
              </template>

              <!-- Feedback (แสดงทุกกิจกรรมที่มี feedbackUrl) -->
              <button v-if="ev.feedbackUrl" class="month-ev-feedback" @click="openLink(ev.feedbackUrl)">
                📝 Feedback
              </button>
            </div>
          </div>
        </div>
      </div>
    </div><!-- end month-events-list -->

    <!-- Egg crack overlay -->
    <Teleport to="body">
      <div v-if="egg.show" class="egg-overlay" @click.self="closeEgg">
        <div class="egg-sheet">
          <div class="egg-modal-handle"></div>

          <div class="text-center mb-4">
            <div style="font-size:16px;font-weight:900;color:#1F2937;">🎉 ยินดีต้อนรับ!</div>
            <div style="font-size:12px;color:#6B7280;margin-top:4px;">{{ egg.activityName }}</div>
          </div>

          <!-- Tap state -->
          <div v-if="egg.state === 'tap'" class="text-center">
            <!-- Screen flash -->
            <div class="screen-flash" :class="{ active: egg.flash }"></div>
            <div style="font-size:11px;font-weight:700;color:#6B7280;margin-bottom:14px;">
              แตะไข่เพื่อรับรางวัล! 🥚
            </div>
            <div class="egg-scene" @click="smashEgg">
              <!-- Egg -->
              <div
                class="egg-clickable"
                :class="{ 'egg-cracking': egg.cracking, 'egg-smashed': egg.smashed }"
              >
              <svg width="110" height="130" viewBox="0 0 120 140" style="display:block;margin:0 auto;filter:drop-shadow(0 8px 20px rgba(255,150,0,0.4));">
                <defs>
                  <radialGradient id="mEggG" cx="38%" cy="35%" r="60%">
                    <stop offset="0%"   stop-color="#FFFDE7"/>
                    <stop offset="50%"  stop-color="#FFD54F"/>
                    <stop offset="100%" stop-color="#FF8F00"/>
                  </radialGradient>
                  <radialGradient id="mEggS" cx="35%" cy="28%" r="30%">
                    <stop offset="0%"   stop-color="rgba(255,255,255,0.7)"/>
                    <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
                  </radialGradient>
                </defs>
                <ellipse cx="60" cy="78" rx="48" ry="58" fill="url(#mEggG)"/>
                <ellipse cx="60" cy="78" rx="48" ry="58" fill="url(#mEggS)"/>
                <g :style="egg.cracking ? 'opacity:1;' : 'opacity:0;'" style="transition:opacity 0.2s;">
                  <path d="M55,45 L48,55 L58,60 L50,72" stroke="#B45309" stroke-width="2.5" fill="none" stroke-linecap="round"/>
                  <path d="M65,50 L72,58 L62,65 L68,78" stroke="#B45309" stroke-width="2"   fill="none" stroke-linecap="round"/>
                  <path d="M40,80 L50,75 L45,90"         stroke="#B45309" stroke-width="2"   fill="none" stroke-linecap="round"/>
                </g>
                <text x="36" y="90" font-size="14" opacity="0.55">✨</text>
                <text x="62" y="74" font-size="10" opacity="0.45">⭐</text>
                <text x="50" y="112" font-size="12" opacity="0.45">🌟</text>
              </svg>
              </div><!-- egg-clickable -->
            </div><!-- egg-scene -->
          </div>

          <!-- Reveal state -->
          <div v-else-if="egg.state === 'reveal'" class="text-center py-2">
            <div style="font-size:24px;letter-spacing:6px;animation:floatY 1.5s ease-in-out infinite;margin-bottom:6px;">🎉 🎊 🎈</div>
            <div style="position:relative;display:inline-block;margin:10px 0;">
              <div class="prize-glow-aura"></div>
              <div style="position:relative;z-index:1;font-size:72px;animation:prizePopIn 0.6s cubic-bezier(0.34,1.56,0.64,1);filter:drop-shadow(0 6px 20px rgba(255,150,0,0.5));">
                {{ egg.prize.icon }}
              </div>
            </div>
            <div style="font-size:20px;font-weight:900;margin-bottom:4px;" :style="{ color: egg.prize.color }">{{ egg.prize.name }}</div>
            <div style="font-size:12px;color:#6B7280;line-height:1.5;margin-bottom:16px;">{{ egg.prize.desc }}</div>
            <div style="background:linear-gradient(135deg,#FFF7ED,#FFFBEB);border:2px solid #FCD34D;border-radius:18px;padding:12px 14px;margin-bottom:16px;">
              <div style="font-size:13px;font-weight:900;color:#92400E;margin-bottom:2px;">🎉 ยินดีด้วย!</div>
              <div style="font-size:11px;font-weight:600;color:#B45309;">รางวัลจะถูกส่งให้ภายใน 3 วันทำการ</div>
            </div>
            <button class="modal-close-btn" style="background:linear-gradient(135deg,#F59E0B,#D97706);" @click="closeEgg">
              รับรางวัล 🎊
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </BaseModal>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import BaseModal from '../shared/BaseModal.vue'
import { useUiStore } from '../../stores/ui.js'
import { useActivitiesStore } from '../../stores/activities.js'
import * as svc from '../../services/activitiesService.js'
import { useConfetti } from '../../composables/useConfetti.js'

const ui   = useUiStore()
const acts = useActivitiesStore()
const { launchConfetti } = useConfetti()

const selectedMonth = computed(() => ui.selectedMonthIdx ?? (new Date().getMonth() + 1))
const myStamps     = ref([])
const stampsLoaded = ref(false)
const stamping     = ref({})
const detailEv  = ref(null)

const PRIZES = [
  { icon: '⭐', name: 'แต้มสะสม +50 pts',  desc: 'แต้มจะถูกเพิ่มในแอปภายใน 24 ชั่วโมง',    color: '#F59E0B' },
  { icon: '🌟', name: 'แต้มสะสม +100 pts', desc: 'แต้มจะถูกเพิ่มในแอปภายใน 24 ชั่วโมง',    color: '#10B981' },
  { icon: '🎨', name: 'สติ๊กเกอร์ LINE',    desc: 'DS Edition พิเศษสำหรับพนักงานเท่านั้น!', color: '#6366F1' },
  { icon: '🎁', name: 'ของที่ระลึก DS',     desc: 'รับของที่ระลึกได้ที่ HR ภายใน 7 วัน',    color: '#EC4899' },
  { icon: '☕', name: 'คูปองกาแฟ 80 บาท',  desc: 'เลือกร้านได้เลย ใช้ได้ภายใน 30 วัน',     color: '#A855F7' },
]

const egg = ref({
  show: false, state: 'tap', cracking: false, smashed: false, flash: false,
  activityId: null, activityName: '', prize: null,
})

const MONTH_META = [
  { title: 'January 🎆',   icon: '🎆', grad: 'linear-gradient(135deg,#BFDBFE,#3B82F6)' },
  { title: 'February 💕',  icon: '💕', grad: 'linear-gradient(135deg,#FBCFE8,#EC4899)' },
  { title: 'March 🌸',     icon: '🌸', grad: 'linear-gradient(135deg,#C7D2FE,#818CF8)' },
  { title: 'April 🎊',     icon: '🎊', grad: 'linear-gradient(135deg,#BAE6FD,#38BDF8)' },
  { title: 'May ☀️',       icon: '☀️', grad: 'linear-gradient(135deg,#FEF08A,#FBBF24)' },
  { title: 'June 🏕️',     icon: '🏕️', grad: 'linear-gradient(135deg,#A7F3D0,#34D399)' },
  { title: 'July 🌿',      icon: '🌿', grad: 'linear-gradient(135deg,#6EE7B7,#10B981)' },
  { title: 'August 💐',    icon: '💐', grad: 'linear-gradient(135deg,#DDD6FE,#A78BFA)' },
  { title: 'September ⚡', icon: '⚡', grad: 'linear-gradient(135deg,#C7D2FE,#6366F1)' },
  { title: 'October 🎃',   icon: '🎃', grad: 'linear-gradient(135deg,#FED7AA,#F97316)' },
  { title: 'November 🍂',  icon: '🍂', grad: 'linear-gradient(135deg,#FDE68A,#F59E0B)' },
  { title: 'December 🎄',  icon: '🎄', grad: 'linear-gradient(135deg,#FECACA,#F87171)' },
]

const meta        = computed(() => MONTH_META[selectedMonth.value - 1] ?? MONTH_META[0])
const events      = computed(() => acts.getMonth(selectedMonth.value))
const isPastMonth = computed(() => selectedMonth.value < (new Date().getMonth() + 1))

const joinedIds  = computed(() => new Set(myStamps.value.map(s => String(s.activityId))))
const claimedIds = computed(() => new Set(myStamps.value.filter(s => s.rewardClaimed).map(s => String(s.activityId))))

function isJoined(id)  { return joinedIds.value.has(String(id)) }
function isClaimed(id) { return claimedIds.value.has(String(id)) }
function getActEmoji(activityId) {
  return acts.all.find(a => a.id === activityId)?.emoji || '🎯'
}

onMounted(() => {
  Promise.all([acts.load(), loadMyStamps()])
})

watch(() => ui.activeModal, (val) => {
  if (val === 'modal-month') loadMyStamps()
})

function openLink(url) {
  if (url) window.open(url, '_blank', 'noopener,noreferrer')
}

async function stampJoin(ev) {
  if (isJoined(ev.id) || stamping.value[ev.id]) return
  stamping.value[ev.id] = true

  const name = ui.currentUser?.name || 'ไม่ระบุชื่อ'
  try {
    await svc.joinActivity(ev.id, ev.name, name, ev.joinLabel)

    // Add stamp locally only after GAS confirms
    if (!myStamps.value.find(s => String(s.activityId) === String(ev.id))) {
      myStamps.value.push({
        id: Date.now().toString(),
        activityId: ev.id,
        activityName: ev.name,
        stampedAt: new Date().toLocaleString('th-TH'),
        rewardClaimed: false,
      })
    }
    if (ev.joinLabel === 'stamp') openEgg(ev)
  } catch {
    // GAS failed — ไม่เปิด egg, ปุ่มกลับมาใหม่
  } finally {
    stamping.value[ev.id] = false
  }
}

function openEgg(ev) {
  egg.value = {
    show: true, state: 'tap', cracking: false, smashed: false, flash: false,
    activityId: ev.id, activityName: ev.name, prize: null,
  }
}

function smashEgg() {
  if (egg.value.cracking || egg.value.smashed) return
  egg.value.cracking = true
  setTimeout(() => {
    egg.value.smashed = true
    egg.value.flash = true
    setTimeout(() => { egg.value.flash = false }, 350)
    const prize = PRIZES[Math.floor(Math.random() * PRIZES.length)]
    egg.value.prize = prize
    setTimeout(() => {
      egg.value.state = 'reveal'
      launchConfetti({ count: 90, colors: ['#FF6840','#FFE566','#FBBF24','#44AAFF','#44DD88','#FF3CAC'] })
      const s = myStamps.value.find(s => String(s.activityId) === String(egg.value.activityId))
      if (s) s.rewardClaimed = true
      svc.claimReward(egg.value.activityId, ui.currentUser?.name || '', prize.name).catch(() => {})
    }, 400)
  }, 750)
}

function closeEgg() { egg.value.show = false }

async function loadMyStamps() {
  const name = ui.currentUser?.name || ''
  if (!name) { myStamps.value = []; stampsLoaded.value = true; return }
  try { myStamps.value = await svc.getMyStamps(name) }
  catch { myStamps.value = [] }
  finally { stampsLoaded.value = true }
}

function joinBtnLabel(val) { return '✅ เข้าร่วมกิจกรรม' }

// 'not_yet' | 'open' | 'closed'
function joinStatus(ev) {
  const now     = Date.now()
  const openAt  = ev.joinOpenAt  ? new Date(ev.joinOpenAt).getTime()  : null
  const closeAt = ev.joinCloseAt ? new Date(ev.joinCloseAt).getTime() : null

  // ตรวจ close ก่อนเสมอ
  if (closeAt !== null && now > closeAt) return 'closed'
  if (ev.joinOpen === false) return 'closed'

  // ตรวจ open
  if (openAt !== null) {
    if (now < openAt) return 'not_yet'
  } else {
    // ไม่ได้ set joinOpenAt → ใช้เดือนของกิจกรรมเทียบเดือนปัจจุบัน
    const currentMonth = new Date().getMonth() + 1
    if (Number(ev.monthIdx) > currentMonth) return 'not_yet'
  }

  return 'open'
}

function formatOpenAt(ev) {
  if (!ev.joinOpenAt) return ''
  const d = new Date(ev.joinOpenAt)
  if (isNaN(d)) return ''
  const MONTHS_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
  return `${d.getDate()} ${MONTHS_TH[d.getMonth()]} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} น.`
}

function parseSteps(desc) {
  return desc
    .split(/\n|(?=\d+\.)/)
    .map(s => s.replace(/^\d+\.\s*/, '').trim())
    .filter(s => s.length > 0)
}
</script>

<style scoped>
/* Stamps banner */
.stamps-banner {
  background:linear-gradient(135deg,#FFFBEB,#FEF3C7);
  border:1.5px solid rgba(251,191,36,0.4);
  border-radius:16px; padding:12px 14px; margin-bottom:14px;
}
.stamps-label { font-size:12px; font-weight:800; color:#92400E; margin-bottom:8px; }
.stamps-row   { display:flex; gap:6px; flex-wrap:wrap; }
.stamp-chip {
  display:inline-flex; align-items:center; gap:4px;
  background:white; border:1.5px solid rgba(234,179,8,0.5);
  border-radius:20px; padding:3px 8px;
  font-size:11px; color:#78350F; font-weight:600;
}
.stamp-chip-name { max-width:80px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.stamp-dot-green { width:7px; height:7px; border-radius:50%; background:#10B981; flex-shrink:0; }

/* Info list in detail overlay */
.month-info-list { display:flex; flex-direction:column; gap:10px; margin-top:12px; }
.month-info-row  { display:flex; gap:8px; font-size:13px; color:#374151; line-height:1.5; }
.month-info-icon { flex-shrink:0; font-size:15px; margin-top:1px; }

/* Action buttons */
.month-ev-extlink {
  padding:7px 12px; border-radius:16px; font-size:12px; font-weight:700;
  background:#F0F0FF; color:#6366F1; border:1.5px solid #C7D2FE; cursor:pointer;
  transition:transform 0.18s;
}
.month-ev-extlink:active { transform:scale(0.96); }

.month-ev-stamped    { font-size:12px; font-weight:700; color:#10B981; }
.month-ev-claimed    { font-size:11px; font-weight:600; color:#9CA3AF; }
.month-ev-join-closed { font-size:11px; font-weight:700; color:#DC2626; background:#FEE2E2; border-radius:12px; padding:4px 10px; }

.month-ev-feedback {
  padding:7px 12px; border-radius:16px; font-size:12px; font-weight:700;
  background:#F0FDF4; color:#059669; border:1.5px solid #A7F3D0; cursor:pointer;
  transition:transform 0.18s;
}
.month-ev-feedback:active { transform:scale(0.96); }

.month-ev-egg {
  padding:6px 12px; border-radius:16px; font-size:12px; font-weight:700;
  background:linear-gradient(135deg,#FEF3C7,#FDE68A);
  color:#92400E; border:1.5px solid #FCD34D; cursor:pointer;
  animation:eggPulse 1.8s ease-in-out infinite;
}
@keyframes eggPulse {
  0%,100% { transform:scale(1); }
  50%      { transform:scale(1.05); box-shadow:0 0 10px rgba(251,191,36,0.5); }
}

/* Egg overlay */
.egg-overlay {
  position:fixed; inset:0; background:rgba(0,0,0,0.6);
  z-index:9100; display:flex; align-items:center; justify-content:center;
  padding:20px;
}
.egg-sheet {
  width:100%; max-width:340px; background:white;
  border-radius:28px; padding:22px 18px 26px;
  animation:eggPopIn 0.35s cubic-bezier(0.34,1.56,0.64,1);
  box-shadow:0 20px 60px rgba(0,0,0,0.25);
  max-height:92vh; overflow-y:auto;
}
@keyframes eggPopIn {
  from { transform:scale(0.7); opacity:0; }
  to   { transform:scale(1);   opacity:1; }
}

/* Egg scene */
.egg-scene {
  display:inline-flex; flex-direction:column;
  align-items:center; cursor:pointer; width:100%;
}
.egg-clickable { display:inline-block; transition:opacity 0.35s; }
.egg-clickable.egg-cracking { animation:eggWhack 0.35s ease-out; }
.egg-clickable.egg-smashed  { transform:scale(0); opacity:0; transition:transform 0.35s, opacity 0.35s; }
@keyframes eggWhack {
  0%,100% { transform:translate(0,0) rotate(0deg); }
  20%     { transform:translate(-6px,-4px) rotate(-5deg); }
  45%     { transform:translate(5px, 3px) rotate(4deg); }
  65%     { transform:translate(-3px,-2px) rotate(-2deg); }
  82%     { transform:translate(2px, 1px) rotate(1deg); }
}

/* Screen flash */
.screen-flash { position:fixed; inset:0; background:white; opacity:0; pointer-events:none; z-index:9999; }
.screen-flash.active { animation:flashPop 0.4s ease-out forwards; }
@keyframes flashPop {
  0%   { opacity:0.65; }
  100% { opacity:0; }
}

/* Prize reveal */
.prize-glow-aura {
  position:absolute; inset:-24px; border-radius:50%;
  background:radial-gradient(circle,rgba(255,200,50,0.55) 0%,transparent 70%);
  animation:prizeAuraPulse 1.2s ease-in-out infinite;
}
@keyframes prizeAuraPulse {
  0%,100% { transform:scale(1);    opacity:0.7; }
  50%      { transform:scale(1.18); opacity:1;   }
}
@keyframes floatY {
  0%,100% { transform:translateY(0); }
  50%      { transform:translateY(-6px); }
}
@keyframes prizePopIn {
  0%   { transform:scale(0.3); opacity:0; }
  100% { transform:scale(1);   opacity:1; }
}
</style>
