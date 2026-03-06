<template>
  <div>
    <!-- Birthday Banner -->
    <section class="sec">
      <BdayBanner
        :label="bdayLabel"
        :sub="bdaySub"
        :placeholders="bdayPlaceholders"
      />
    </section>

    <!-- Carousel shortcuts -->
    <section class="sec">
      <div class="c-row">
        <div class="c-card ripple-host" @click="router.push('/bday')">
          <div class="c-bg bg-bday"><span class="c-emo">🎂</span><span class="c-lbl">Birthday</span></div>
        </div>
        <div class="c-card ripple-host" @click="router.push('/culture')">
          <div class="c-bg bg-culture"><span class="c-emo">🔥</span><span class="c-lbl">FIRE Culture</span></div>
        </div>
        <div class="c-card ripple-host" @click="ui.openModal('modal-training')">
          <div class="c-bg bg-training"><span class="c-emo">📚</span><span class="c-lbl">Training</span></div>
        </div>
        <div class="c-card ripple-host" @click="ui.openModal('modal-reward')">
          <div class="c-bg bg-reward"><span class="c-emo">⭐</span><span class="c-lbl">DS Reward</span></div>
        </div>
      </div>
    </section>

    <!-- Consult cards -->
    <section class="sec">
      <div class="sec-hdr">
        <div class="sec-title">🤝 บริการปรึกษา</div>
      </div>
      <ConsultCards />
    </section>

    <!-- Tool cards -->
    <section class="sec">
      <div class="sec-hdr">
        <div class="sec-title">🛠 เครื่องมือ</div>
      </div>
      <div class="tool-row">
        <div class="tool-card org ripple-host" @click="ui.openModal('modal-org')">
          <div class="ti">🏆</div>
          <div class="tt">Star Gang</div>
          <div class="ts">สมาชิกดาวเด่น</div>
          <div class="org-avs">
            <div class="org-av" style="background:linear-gradient(135deg,#FDE68A,#F59E0B);">🌟</div>
            <div class="org-av" style="background:linear-gradient(135deg,#FBCFE8,#EC4899);">⭐</div>
            <div class="org-av" style="background:linear-gradient(135deg,#C7D2FE,#6366F1);">✨</div>
          </div>
        </div>
        <div class="tool-card emp ripple-host" @click="ui.openModal('modal-emp')">
          <div class="ti">💝</div>
          <div class="tt">Empathy Board</div>
          <div class="ts">ชื่นชมเพื่อนร่วมงาน</div>
          <div class="etags">
            <span class="etag">เก่งมาก ⭐</span>
            <span class="etag">ขอบคุณ 🙏</span>
            <span class="etag">สู้ๆ 💪</span>
          </div>
        </div>
        <div class="tool-card org ripple-host" @click="router.push('/idea')">
          <div class="ti">💡</div>
          <div class="tt">เสนอไอเดีย</div>
          <div class="ts">แชร์ความคิดสร้างสรรค์</div>
        </div>
        <div class="tool-card emp ripple-host" @click="router.push('/star')">
          <div class="ti">⭐</div>
          <div class="tt">Star of Month</div>
          <div class="ts">พนักงานดาวเด่น</div>
        </div>
      </div>
    </section>

    <!-- Months Grid -->
    <section class="sec">
      <div class="sec-hdr">
        <div class="sec-title">📅 กิจกรรมรายเดือน</div>
      </div>
      <MonthsGrid @month-click="openMonthModal" />
    </section>

    <!-- Empathy Board -->
    <section class="sec">
      <div class="sec-hdr">
        <div class="sec-title">💝 Empathy Board</div>
        <span class="sec-more" @click="ui.openModal('modal-emp')">ส่งคำชื่นชม</span>
      </div>
      <EmpathyBoard />
    </section>
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

const bdayPlaceholders = computed(() => {
  return (bday.allEmployees[currentMonth] || []).slice(0, 3).map((e, i) => ({
    bg: bday.getFallbackBg(e.fallbackIdx),
    emoji: bday.getFallbackEmoji(e.fallbackIdx)
  }))
})

function openMonthModal(monthIdx) {
  // Month detail shown via MonthModal - for now navigate to bday
  router.push('/bday')
}
</script>
