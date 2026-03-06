<template>
  <div class="tab-page">

    <!-- Section 1: กิจกรรมและข่าวสาร -->
    <div class="sec fade-in">
      <div class="sec-hdr">
        <span class="sec-title">🎊 กิจกรรมและข่าวสาร</span>
        <span class="sec-more" @click="router.push('/bday')">ดูทั้งหมด</span>
      </div>
      <BdayBanner
        :label="bdayLabel"
        :sub="bdaySub"
        :placeholders="bdayPlaceholders"
      />
      <div class="grid grid-cols-4 gap-2 mt-3">
        <div
          class="c-card ripple-host bg-[linear-gradient(135deg,#FF6CAB,#FF3CAC,#784BA0)]"
          @click="router.push('/bday')"
        >
          <div class="c-emo">🎂</div>
          <div class="c-lbl">Birthday</div>
        </div>
        <div
          class="c-card ripple-host bg-[linear-gradient(135deg,#FF6B00,#FF3CAC,#A855F7,#3B82F6)]"
          @click="router.push('/culture')"
        >
          <div class="c-emo">🔥</div>
          <div class="c-lbl">FIRE Culture</div>
        </div>
        <div
          class="c-card ripple-host bg-[linear-gradient(135deg,#FFD6DC,#FF8FA3,#FF4D6D)]"
          @click="ui.showToast('Training — เร็วๆนี้ 🚀')"
        >
          <div class="c-emo">📚</div>
          <div class="c-lbl">Training</div>
        </div>
        <div
          class="c-card ripple-host bg-[linear-gradient(135deg,#06C755,#00A040)]"
          @click="ui.showToast('DS Reward — เร็วๆนี้ 🚀')"
        >
          <div class="c-emo">⭐</div>
          <div class="c-lbl">DS Reward</div>
        </div>
      </div>
    </div>

    <!-- Section 2: บริการปรึกษา -->
    <div class="sec">
      <div class="sec-hdr">
        <span class="sec-title">🤝 บริการปรึกษา</span>
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
import BdayBanner from '../components/home/BdayBanner.vue'
import ConsultCards from '../components/home/ConsultCards.vue'
import MonthsGrid from '../components/home/MonthsGrid.vue'
import EmpathyBoard from '../components/home/EmpathyBoard.vue'
import { useUiStore } from '../stores/ui.js'
import { useBirthdayStore } from '../stores/birthday.js'

const router = useRouter()
const ui = useUiStore()
const bday = useBirthdayStore()

const currentMonth = new Date().getMonth()

const bdayLabel = computed(() => {
  const emps = bday.allEmployees[currentMonth] || []
  if (!emps.length) return '🎂 Birthday Celebration'
  return `🎂 ${emps.map(e => e.name).join(', ')}`
})

const bdaySub = computed(() => {
  const emps = bday.allEmployees[currentMonth] || []
  if (!emps.length) return 'เดือนนี้ยังไม่มีวันเกิด 🙁'
  return `เดือนนี้มี ${emps.length} คนเกิดวันเกิด! 🎉`
})

const bdayPlaceholders = computed(() =>
  (bday.allEmployees[currentMonth] || []).slice(0, 3).map(e => ({
    bg: bday.getFallbackBg(e.fallbackIdx),
    emoji: bday.getFallbackEmoji(e.fallbackIdx)
  }))
)
</script>
