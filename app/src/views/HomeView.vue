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
          @click="ui.openModal('modal-bday')"
        >
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
                <img v-if="emp.photo" :src="emp.photo" class="w-full h-full object-cover" />
                <span v-else>{{ bday.getFallbackEmoji(emp.fallbackIdx) }}</span>
              </div>
              <div v-if="bdayEmps.length > 3" class="bday-strip-more">+{{ bdayEmps.length - 3 }}</div>
            </div>
          </div>
        </div>

        <!-- Quick links: 3-col on mobile, flex-col on PC -->
        <div class="grid grid-cols-3 gap-2 sm:flex sm:flex-col">
          <div class="c-card ripple-host bg-[linear-gradient(135deg,#FF6B00,#FF3CAC,#A855F7,#3B82F6)] sm:flex-1" @click="ui.openModal('modal-culture')">
            <div class="c-emo">🤝</div>
            <div class="c-lbl">Team Culture</div>
            <div class="c-sub">วัฒนธรรมองค์กร</div>
          </div>
          <div class="c-card ripple-host bg-[linear-gradient(135deg,#FFD6DC,#FF8FA3,#FF4D6D)] sm:flex-1" @click="ui.openModal('modal-training')">
            <div class="c-emo"><img src="/images/icon-training.png" style="width:26px;height:26px;object-fit:contain;" /></div>
            <div class="c-lbl">Training</div>
            <div class="c-sub">การฝึกอบรม</div>
          </div>
          <div class="c-card ripple-host bg-[linear-gradient(135deg,#06C755,#00A040)] sm:flex-1" @click="ui.openModal('modal-reward')">
            <div class="c-emo">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L4 5.5V11C4 15.5 7.5 19.7 12 21C16.5 19.7 20 15.5 20 11V5.5L12 2Z" fill="white"/>
                <text x="12" y="16.5" text-anchor="middle" font-size="10" font-weight="900" fill="#06C755" font-family="Arial,sans-serif">R</text>
              </svg>
            </div>
            <div class="c-lbl">DS Reward</div>
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
        <span class="sec-title">🛠 เครื่องมือ</span>
      </div>
      <div class="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-4">
        <div class="tool-card org ripple-host flex-col items-start" @click="ui.openModal('modal-org')">
          <div class="ti">🏆</div>
          <div class="tt">Star Gang</div>
          <div class="ts">สมาชิกดาวเด่น</div>
          <div class="org-avs">
            <div class="org-av" style="background:linear-gradient(135deg,#FDE68A,#F59E0B);">🌟</div>
            <div class="org-av" style="background:linear-gradient(135deg,#FBCFE8,#EC4899);">⭐</div>
            <div class="org-av" style="background:linear-gradient(135deg,#C7D2FE,#6366F1);">✨</div>
          </div>
        </div>
        <div class="tool-card emp ripple-host flex-col items-start" @click="ui.openModal('modal-emp')">
          <div class="ti">💝</div>
          <div class="tt">Empathy Board</div>
          <div class="ts">ชื่นชมเพื่อนร่วมงาน</div>
          <div class="etags">
            <span class="etag">เก่งมาก ⭐</span>
            <span class="etag">ขอบคุณ 🙏</span>
          </div>
        </div>
        <div class="tool-card org ripple-host flex-col items-start" @click="router.push('/idea')">
          <div class="ti">💡</div>
          <div class="tt">เสนอไอเดีย</div>
          <div class="ts">แชร์ความคิดสร้างสรรค์</div>
        </div>
        <div class="tool-card emp ripple-host flex-col items-start" @click="router.push('/star')">
          <div class="ti">⭐</div>
          <div class="tt">Star of Month</div>
          <div class="ts">พนักงานดาวเด่น</div>
        </div>
      </div>
    </div>

    <!-- Section 4: Empathy Board -->
    <div class="sec">
      <div class="sec-hdr">
        <span class="sec-title">💝 Empathy Board</span>
        <span class="sec-more" @click="ui.openModal('modal-emp')">ส่งคำชื่นชม</span>
      </div>
      <EmpathyBoard />
    </div>

    <!-- Section 5: กิจกรรมรายเดือน -->
    <div class="sec">
      <div class="sec-hdr">
        <span class="sec-title">📅 กิจกรรมรายเดือน</span>
      </div>
      <MonthsGrid @month-click="(idx) => ui.openMonthModal(idx)" />
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import ConsultCards from '../components/home/ConsultCards.vue'
import MonthsGrid from '../components/home/MonthsGrid.vue'
import EmpathyBoard from '../components/home/EmpathyBoard.vue'
import { useUiStore } from '../stores/ui.js'
import { useBirthdayStore } from '../stores/birthday.js'

const router = useRouter()
const ui = useUiStore()
const bday = useBirthdayStore()

const currentMonth = new Date().getMonth()

const bdayEmps = computed(() => bday.allEmployees[currentMonth] || [])
const bdaySub = computed(() => {
  const n = bdayEmps.value.length
  if (!n) return 'เดือนนี้ยังไม่มีวันเกิด 🙁'
  return `เดือนนี้มี ${n} คนเกิดวันเกิด 🎉`
})
</script>
