<template>
  <div class="tab-page">

    <!-- Greeting Hero -->
    <div class="hv-hero">
      <div>
        <div class="hv-greeting">{{ timeGreeting }}, <span class="hv-uname">{{ firstName }}</span> 👋</div>
        <div class="hv-date">{{ todayStr }}</div>
      </div>
      <div class="hv-avatar" @click="ui.openModal('modal-settings')">
        <img v-if="auth.userImgUrl" :src="auth.userImgUrl" class="hv-avatar-img" alt="" />
        <div v-else class="hv-avatar-fb">{{ initials }}</div>
      </div>
    </div>


    <!-- Section 1: กิจกรรมและข่าวสาร -->
    <div class="sec">
      <div class="sec-hdr">
        <span class="sec-title">🎊 กิจกรรมและข่าวสาร</span>
        <span class="sec-more" @click="ui.openModal('modal-bday')">ดูทั้งหมด</span>
      </div>

      <!-- Birthday card + Quick links: stacked on mobile, side-by-side on SM+ -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:items-stretch">

        <!-- Birthday card -->
        <div
          class="ripple-host relative overflow-hidden rounded-2xl cursor-pointer
                 transition-transform duration-150 active:scale-[0.99]"
          @click="cardClick('bday', () => ui.openModal('modal-bday'))"
        >
          <div v-if="!cardConfig.isEnabled('bday')" class="hc-soon-badge">🔜 เร็วๆ นี้</div>
          <!-- aspect-ratio spacer: mobile uses 375/150, SM+ capped by parent height -->
          <div class="sm:hidden" style="aspect-ratio:375/150;"></div>
          <div class="hidden sm:block" style="height:160px;"></div>
          <img src="/images/bday-header.jpg"
               alt="ภาพพื้นหลังวันเกิด"
               class="absolute inset-0 w-full h-full object-cover object-top" />
          <div class="absolute inset-0"
               style="background:linear-gradient(to bottom,rgba(10,0,40,0.18) 0%,rgba(10,0,40,0.62) 100%);"></div>
          <div class="absolute inset-0 flex flex-col justify-center items-start p-4 gap-3">
            <div>
              <div style="font-size:26px;font-weight:900;color:white;line-height:1.1;white-space:nowrap;
                          text-shadow:0 2px 12px rgba(0,0,0,0.5),0 0 24px rgba(255,100,200,0.4);">
                🎂 Birthday Celebration
              </div>
              <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.9);margin-top:5px;
                          text-shadow:0 1px 4px rgba(0,0,0,0.4);">{{ bdaySub }}</div>
            </div>
            <div class="bday-home-strip">
              <div
                v-for="emp in bdayEmps.slice(0, 5)"
                :key="emp.key"
                class="bday-strip-av"
                :style="{ background: bday.getFallbackBg(emp.fallbackIdx) }"
              >
                <img v-if="emp.photo" :src="emp.photo" class="w-full h-full object-cover" alt=""
                     @error="(e) => e.target.style.display='none'" />
                <svg v-else xmlns="http://www.w3.org/2000/svg"
                     style="width:60%;height:60%;fill:rgba(255,255,255,0.8);" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <div v-if="bdayEmps.length > 5" class="bday-strip-more">+{{ bdayEmps.length - 5 }}</div>
            </div>
          </div>
        </div>

        <!-- Quick links: 3-col on mobile, flex-col on SM+ -->
        <div class="grid grid-cols-3 gap-2 sm:flex sm:flex-col">
          <div class="c-card ripple-host sm:flex-1"
               :style="{ background: cardConfig.getBg('culture') }"
               @click="cardClick('culture', () => ui.openModal('modal-culture'))">
            <div class="c-emo">🤝</div>
            <div class="c-lbl">Team Culture</div>
            <div class="c-sub">{{ cardConfig.isEnabled('culture') ? 'วัฒนธรรมองค์กร' : '🔜 เร็วๆ นี้' }}</div>
          </div>
          <div class="c-card ripple-host sm:flex-1"
               :style="{ background: cardConfig.getBg('training') }"
               @click="cardClick('training', () => ui.openModal('modal-training'))">
            <div class="c-emo">
              <img src="/images/icon-training.png" alt="" style="width:28px;height:28px;object-fit:contain;" />
            </div>
            <div class="c-lbl">Training</div>
            <div class="c-sub">{{ cardConfig.isEnabled('training') ? 'การฝึกอบรม' : '🔜 เร็วๆ นี้' }}</div>
          </div>
          <div class="c-card ripple-host sm:flex-1"
               :style="{ background: cardConfig.getBg('reward') }"
               @click="cardClick('reward', () => ui.openModal('modal-reward'))">
            <div class="c-emo">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L4 5.5V11C4 15.5 7.5 19.7 12 21C16.5 19.7 20 15.5 20 11V5.5L12 2Z" fill="white"/>
                <text x="12" y="16.5" text-anchor="middle" font-size="10" font-weight="900" fill="#06C755" font-family="Arial,sans-serif">R</text>
              </svg>
            </div>
            <div class="c-lbl">DS Reward</div>
            <div v-if="!cardConfig.isEnabled('reward')" class="c-sub">🔜 เร็วๆ นี้</div>
          </div>
        </div>

      </div>
    </div>

    <!-- Section 2: บริการปรึกษา -->
    <div class="sec">
      <div class="sec-hdr">
        <span class="sec-title">💙 Consult Service</span>
      </div>
      <ConsultCards />
    </div>

    <!-- Section 3: เครื่องมือ -->
    <div class="sec">
      <div class="sec-hdr">
        <span class="sec-title">🛠 Other</span>
      </div>
      <div class="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-4">
        <div class="tool-card ripple-host flex-col items-start"
             :style="{ background: cardConfig.getBg('monthly') }"
             @click="cardClick('monthly', () => ui.openModal('modal-monthly-plan'))">
          <div class="ti">📅</div>
          <div class="tt">Monthly Plan</div>
          <div class="ts">ตารางเข้าออฟฟิศ {{ currentYear }}</div>
          <div class="mp-months">
            <span v-for="m in monthDots" :key="m.i" class="mp-dot" :class="{ active: m.i === currentMonth }"></span>
          </div>
          <div v-if="!cardConfig.isEnabled('monthly')" class="etags">
            <span class="etag">🔜 เร็วๆ นี้</span>
          </div>
        </div>
        <div class="tool-card ripple-host flex-col items-start"
             :style="{ background: cardConfig.getBg('market') }"
             @click="cardClick('market', () => {})">
          <div class="ti">🛍️</div>
          <div class="tt">ตลาดนัด</div>
          <div class="ts">ปล่อยของง่าย ขายคล่อง!</div>
          <div class="etags"><span class="etag">🔜 เร็วๆ นี้</span></div>
        </div>
        <div class="tool-card ripple-host flex-col items-start"
             :style="{ background: cardConfig.getBg('idea') }"
             @click="cardClick('idea', () => router.push('/idea'))">
          <div class="ti">💡</div>
          <div class="tt">เสนอไอเดีย</div>
          <div class="ts">แชร์ความคิดสร้างสรรค์</div>
          <div v-if="!cardConfig.isEnabled('idea')" class="etags">
            <span class="etag">🔜 เร็วๆ นี้</span>
          </div>
        </div>
        <div class="tool-card ripple-host flex-col items-start"
             :style="{ background: cardConfig.getBg('fortune') }"
             @click="cardClick('fortune', () => {})">
          <div class="ti">🔮</div>
          <div class="tt">สายมู</div>
          <div class="ts">ดูดวง, ฤกษ์มงคล</div>
          <div class="etags"><span class="etag">🔜 เร็วๆ นี้</span></div>
        </div>
      </div>
    </div>

    <!-- Section 4: Empathy Board -->
    <div class="sec">
      <div class="sec-hdr">
        <span class="sec-title">💝 Empathy Board</span>
        <span class="sec-more" @click="cardClick('empathy', () => ui.openModal('modal-emp'))">ส่งคำชื่นชม</span>
      </div>
      <EmpathyBoard />
    </div>

    <!-- Section 5: กิจกรรมรายเดือน -->
    <div class="sec">
      <div class="sec-hdr">
        <span class="sec-title">📅 Activities</span>
      </div>
      <MonthsGrid @month-click="(idx) => ui.openMonthModal(idx)" />
    </div>

  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ConsultCards from '../components/home/ConsultCards.vue'
import MonthsGrid from '../components/home/MonthsGrid.vue'
import EmpathyBoard from '../components/home/EmpathyBoard.vue'
import { useUiStore } from '../core/stores/ui.js'
import { useUserAuthStore } from '../core/stores/userAuth.js'
import { useBirthdayStore } from '../features/birthday/birthday.store.js'
import { useCardConfigStore } from '../core/stores/cardConfig.js'

const router     = useRouter()
const ui         = useUiStore()
const auth       = useUserAuthStore()
const bday       = useBirthdayStore()
const cardConfig = useCardConfigStore()

function cardClick(key, action) {
  if (!cardConfig.isEnabled(key)) { ui.showToast('🔜 เร็วๆ นี้'); return }
  action()
}

const currentMonth = new Date().getMonth()
const currentYear  = new Date().getFullYear() + 543
const monthDots    = Array.from({ length: 12 }, (_, i) => ({ i }))

// ── Greeting ──────────────────────────────────────────────
const firstName = computed(() => {
  const name = auth.userName || ''
  return name.split(' ')[0] || 'คุณ'
})
const initials = computed(() => (auth.userName || '').slice(0, 1).toUpperCase() || '?')
const timeGreeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'อรุณสวัสดิ์'
  if (h < 17) return 'สวัสดีตอนบ่าย'
  return 'สวัสดีตอนเย็น'
})
const todayStr = computed(() =>
  new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' })
)

onMounted(() => {
  bday.loadMonth(currentMonth)
})

const bdayEmps = computed(() => bday.allEmployees[currentMonth] || [])
const bdaySub  = computed(() => {
  const n = bdayEmps.value.length
  if (!n) return 'เดือนนี้ยังไม่มีวันเกิด 🙁'
  return `เดือนนี้มี ${n} คนเกิดวันเกิด 🎉`
})
</script>

<style scoped>
/* === Greeting Hero === */
.hv-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 0;
  gap: 12px;
}
.hv-greeting {
  font-size: 17px;
  font-weight: 900;
  color: #1A1235;
  line-height: 1.25;
}
.hv-uname {
  background: linear-gradient(135deg, #6366F1, #A855F7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hv-date {
  font-size: 11px;
  color: #7A6F9E;
  margin-top: 3px;
  font-weight: 600;
}
.hv-avatar { flex-shrink: 0; cursor: pointer; }
.hv-avatar-img {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  object-position: top;
  border: 2.5px solid #E2DCFB;
  box-shadow: 0 2px 10px rgba(99,102,241,0.15);
  display: block;
}
.hv-avatar-fb {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366F1, #A855F7);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 900;
  color: white;
  border: 2.5px solid rgba(99,102,241,0.2);
  box-shadow: 0 2px 10px rgba(99,102,241,0.2);
}

/* === Monthly Plan dots === */
.mp-months { display: flex; gap: 3px; flex-wrap: wrap; margin-top: 6px; }
.mp-dot { width: 6px; height: 6px; border-radius: 50%; background: #C7D2FE; }
.mp-dot.active { background: #4F46E5; box-shadow: 0 0 0 2px rgba(79,70,229,0.25); }

/* === Soon badge === */
.hc-soon-badge {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0,0,0,0.55);
  color: white; font-size: 13px; font-weight: 800;
  padding: 6px 16px; border-radius: 20px;
  backdrop-filter: blur(4px);
  pointer-events: none; white-space: nowrap; z-index: 10;
}
</style>
