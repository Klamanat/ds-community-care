<template>
  <div class="tab-page">

    <!-- Section 1: กิจกรรมและข่าวสาร -->
    <div class="sec">
      <div class="sec-hdr">
        <span class="sec-title">🎊 กิจกรรมและข่าวสาร</span>
        <span class="sec-more" @click="ui.openModal('modal-bday')">ดูทั้งหมด</span>
      </div>

      <!-- Birthday + quick links -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:items-stretch">

        <!-- Birthday card -->
        <div
          class="ripple-host relative overflow-hidden rounded-2xl cursor-pointer sm:h-full"
          @click="cardClick('bday', () => ui.openModal('modal-bday'))"
        >
          <div v-if="!cardConfig.isEnabled('bday')" class="hc-soon-badge">🔜 เร็วๆ นี้</div>
          <!-- Mobile-only height spacer (aspect-ratio 375/150) -->
          <div class="sm:hidden" style="aspect-ratio:375/150;"></div>

          <img src="/images/bday-header.jpg"
               class="absolute inset-0 w-full h-full object-cover object-top" />
          <div class="absolute inset-0" style="background:linear-gradient(to bottom,rgba(10,0,40,0.18) 0%,rgba(10,0,40,0.58) 100%);"></div>
          <div class="absolute inset-0 flex flex-col justify-center items-start p-3 gap-3">
            <div>
              <div style="font-size:28px;font-weight:900;color:white;line-height:1.1;white-space:nowrap;
                          text-shadow:0 2px 12px rgba(0,0,0,0.5),0 0 24px rgba(255,100,200,0.4);">
                🎂 Birthday Celebration
              </div>
              <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.9);margin-top:5px;
                          text-shadow:0 1px 4px rgba(0,0,0,0.4);">{{ bdaySub }}</div>
            </div>
            <div class="bday-home-strip">
              <div
                v-for="emp in bdayEmps.slice(0, 3)"
                :key="emp.key"
                class="bday-strip-av"
                :style="{ background: bday.getFallbackBg(emp.fallbackIdx) }"
              >
                <img v-if="emp.photo" :src="emp.photo" class="w-full h-full object-cover" @error="(e) => e.target.style.display='none'" />
                <svg v-else xmlns="http://www.w3.org/2000/svg" style="width:60%;height:60%;fill:rgba(255,255,255,0.8);" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <div v-if="bdayEmps.length > 3" class="bday-strip-more">+{{ bdayEmps.length - 3 }}</div>
            </div>
          </div>
        </div>

        <!-- Quick links: 4-col on mobile, flex-col on PC -->
        <div class="grid grid-cols-3 gap-2 sm:flex sm:flex-col">
          <div class="c-card ripple-host bg-[linear-gradient(135deg,#FF6B00,#FF3CAC,#A855F7,#3B82F6)] sm:flex-1"
               @click="cardClick('culture', () => ui.openModal('modal-culture'))">
            <div class="c-emo">🤝</div>
            <div class="c-lbl">Team Culture</div>
            <div class="c-sub">{{ cardConfig.isEnabled('culture') ? 'วัฒนธรรมองค์กร' : '🔜 เร็วๆ นี้' }}</div>
          </div>
          <div class="c-card ripple-host bg-[linear-gradient(135deg,#FFD6DC,#FF8FA3,#FF4D6D)] sm:flex-1"
               @click="cardClick('training', () => ui.openModal('modal-training'))">
            <div class="c-emo"><img src="/images/icon-training.png" style="width:26px;height:26px;object-fit:contain;" /></div>
            <div class="c-lbl">Training</div>
            <div class="c-sub">{{ cardConfig.isEnabled('training') ? 'การฝึกอบรม' : '🔜 เร็วๆ นี้' }}</div>
          </div>
          <div class="c-card ripple-host bg-[linear-gradient(135deg,#06C755,#00A040)] sm:flex-1"
               @click="cardClick('reward', () => ui.openModal('modal-reward'))">
            <div class="c-emo">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
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
        <div class="tool-card org ripple-host flex-col items-start"
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
        <div class="tool-card emp ripple-host flex-col items-start"
             @click="cardClick('market', () => {})">
          <div class="ti">🛍️</div>
          <div class="tt">ตลาดนัด</div>
          <div class="ts">ปล่อยของง่าย ขายคล่อง เพื่อนจองพร้อมช้อป!</div>
          <div class="etags">
            <span class="etag">🔜 เร็วๆ นี้</span>
          </div>
        </div>
        <div class="tool-card org ripple-host flex-col items-start"
             @click="cardClick('idea', () => router.push('/idea'))">
          <div class="ti">💡</div>
          <div class="tt">เสนอไอเดีย</div>
          <div class="ts">แชร์ความคิดสร้างสรรค์</div>
          <div v-if="!cardConfig.isEnabled('idea')" class="etags">
            <span class="etag">🔜 เร็วๆ นี้</span>
          </div>
        </div>
        <div class="tool-card emp ripple-host flex-col items-start"
             @click="cardClick('fortune', () => {})">
          <div class="ti">🔮</div>
          <div class="tt">สายมู</div>
          <div class="ts">ดูดวง, ฤกษ์มงคล, วันดีประจำสัปดาห์</div>
          <div class="etags">
            <span class="etag">🔜 เร็วๆ นี้</span>
          </div>
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
import { useUiStore } from '../stores/ui.js'
import { useBirthdayStore } from '../stores/birthday.js'
import { useCardConfigStore } from '../stores/cardConfig.js'

const router = useRouter()
const ui = useUiStore()
const bday = useBirthdayStore()
const cardConfig = useCardConfigStore()

function cardClick(key, action) {
  if (!cardConfig.isEnabled(key)) { ui.showToast('🔜 เร็วๆ นี้'); return }
  action()
}

const currentMonth = new Date().getMonth()
const currentYear  = new Date().getFullYear() + 543   // พ.ศ.
const monthDots    = Array.from({ length: 12 }, (_, i) => ({ i }))

onMounted(() => bday.loadMonth(currentMonth))

const bdayEmps = computed(() => bday.allEmployees[currentMonth] || [])
const bdaySub = computed(() => {
  const n = bdayEmps.value.length
  if (!n) return 'เดือนนี้ยังไม่มีวันเกิด 🙁'
  return `เดือนนี้มี ${n} คนเกิดวันเกิด 🎉`
})
</script>

<style scoped>
/* Monthly Plan dots */
.mp-months {
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
  margin-top: 6px;
}
.mp-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #C7D2FE;
}
.mp-dot.active {
  background: #4F46E5;
  box-shadow: 0 0 0 2px rgba(79,70,229,0.25);
}

.hc-soon-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0,0,0,0.55);
  color: white;
  font-size: 13px;
  font-weight: 800;
  padding: 6px 16px;
  border-radius: 20px;
  backdrop-filter: blur(4px);
  pointer-events: none;
  white-space: nowrap;
  z-index: 10;
}
</style>
