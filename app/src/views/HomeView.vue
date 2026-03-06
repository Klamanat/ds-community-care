<template>
  <div class="tab-page">

    <!-- Section 1: กิจกรรมและข่าวสาร -->
    <div class="sec">
      <div class="sec-hdr">
        <span class="sec-title">🎊 กิจกรรมและข่าวสาร</span>
        <span class="sec-more" @click="ui.openModal('modal-bday')">ดูทั้งหมด</span>
      </div>

      <!-- Birthday banner -->
      <div class="bday-home-banner ripple-host" @click="ui.openModal('modal-bday')">
        <img src="/images/bday-hero.jpg" class="bday-hero-img" />
        <div class="bday-hero-overlay">
          <!-- Confetti dots -->
          <span class="bday-dot" style="top:10px;left:14%;background:#FFE500;width:7px;height:7px;animation-delay:0s;"></span>
          <span class="bday-dot" style="top:7px;left:38%;background:#FF6BCB;width:5px;height:5px;animation-delay:0.5s;"></span>
          <span class="bday-dot" style="top:14px;right:28%;background:#60AEFF;width:6px;height:6px;animation-delay:1s;"></span>
          <span class="bday-dot" style="bottom:12px;left:22%;background:#44DD88;width:5px;height:5px;animation-delay:0.3s;"></span>
          <span class="bday-dot" style="bottom:9px;right:18%;background:#FF8C00;width:7px;height:7px;animation-delay:0.8s;"></span>
          <span class="bday-dot" style="top:42%;left:6%;background:#FF6BCB;width:4px;height:4px;animation-delay:1.3s;"></span>
          <!-- Floating emoji -->
          <span class="bday-float-emoji" style="right:14%;top:8%;animation-delay:0s;">🎉</span>
          <span class="bday-float-emoji" style="right:6%;bottom:12%;animation-delay:1.1s;font-size:14px;">✨</span>
          <span class="bday-float-emoji" style="left:4%;bottom:14%;animation-delay:0.6s;font-size:13px;">🎈</span>
          <div class="flex-1">
            <div class="bday-home-label">🎂 Birthday Celebration</div>
            <div class="bday-home-sub">{{ bdaySub }}</div>
          </div>
          <div class="bday-home-strip">
            <div
              v-for="emp in bdayEmps.slice(0, 5)"
              :key="emp.key"
              class="bday-strip-av"
              :style="{ background: bday.getFallbackBg(emp.fallbackIdx) }"
            >
              <img v-if="emp.photo" :src="emp.photo" class="w-full h-full object-cover" />
              <span v-else>{{ bday.getFallbackEmoji(emp.fallbackIdx) }}</span>
            </div>
            <div v-if="bdayEmps.length > 5" class="bday-strip-more">+{{ bdayEmps.length - 5 }}</div>
          </div>
        </div>
      </div>

      <!-- Quick links -->
      <div class="grid grid-cols-3 gap-2 mt-3">
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
