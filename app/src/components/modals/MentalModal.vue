<template>
  <BaseModal modal-id="modal-mental">
    <!-- Header -->
    <div class="bg-[linear-gradient(135deg,#E8F8F0,#2EAF7D,#065F46)] px-5 py-5 rounded-t-2xl flex-shrink-0">
      <div class="modal-handle"></div>
      <div class="text-center">
        <div class="text-[38px] mb-1">🧠</div>
        <div class="text-[20px] font-extrabold text-white">Mental Health Consultation</div>
        <div class="text-[11px] text-white/90 mt-1">ปรึกษาผู้เชี่ยวชาญด้านสุขภาพจิต 💚</div>
      </div>
    </div>

    <div v-if="!sent" class="modal-body-scroll p-4">
      <!-- Steps -->
      <div class="flex flex-col gap-2 mb-4">
        <div v-for="(step, i) in steps" :key="i" class="mental-step">
          <div class="mental-step-num">{{ i + 1 }}</div>
          <div class="text-[12px] text-app-mid">{{ step }}</div>
        </div>
      </div>

      <!-- Advisors -->
      <div class="text-[12px] font-extrabold text-app-mid mb-3">เลือกที่ปรึกษา</div>
      <div class="flex flex-col gap-2.5 mb-4">
        <div
          v-for="adv in advisors"
          :key="adv.name"
          class="advisor-card"
          :class="{ selected: selectedAdvisor === adv.name }"
          @click="selectedAdvisor = adv.name"
        >
          <div class="adv-avatar" :style="{ background: adv.bg }">{{ adv.emoji }}</div>
          <div class="adv-info">
            <div class="adv-name">{{ adv.name }}</div>
            <div class="adv-role">{{ adv.role }}</div>
            <div class="adv-tag">{{ adv.specialty }}</div>
          </div>
          <div class="text-[20px] text-app-light">{{ selectedAdvisor === adv.name ? '✅' : '○' }}</div>
        </div>
      </div>

      <textarea
        v-model="mentalMsg"
        placeholder="อธิบายสิ่งที่ต้องการปรึกษาคร่าวๆ (ถ้ามี)..."
        maxlength="500"
        class="w-full min-h-[80px] rounded-xl border-[1.5px] border-app-border p-3
               text-[13px] text-app-dark bg-app-bg resize-none outline-none leading-relaxed mb-3"
      ></textarea>

      <button
        class="modal-close-btn"
        style="background:linear-gradient(135deg,#2EAF7D,#065F46);"
        @click="sendRequest"
      >ส่งคำขอนัดหมาย 🌿</button>
    </div>

    <!-- Success -->
    <div v-else class="text-center p-8">
      <div class="text-[60px] mb-4" style="animation:prizePopIn 0.6s cubic-bezier(0.34,1.56,0.64,1);">🌿</div>
      <div class="text-[17px] font-black text-app-dark mb-2">ส่งคำขอสำเร็จแล้วค่ะ!</div>
      <div class="text-[13px] text-app-light leading-relaxed">ที่ปรึกษาจะติดต่อกลับภายใน 3 วันทำการ</div>
      <button
        class="modal-close-btn mt-5"
        style="background:linear-gradient(135deg,#2EAF7D,#065F46);"
        @click="reset"
      >กลับหน้าหลัก 💚</button>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref } from 'vue'
import BaseModal from '../shared/BaseModal.vue'
import { useUiStore } from '../../stores/ui.js'

const ui = useUiStore()
const selectedAdvisor = ref(null)
const mentalMsg = ref('')
const sent = ref(false)

const steps = [
  'กรอกข้อมูลเบื้องต้น (ไม่ระบุตัวตน)',
  'เลือกที่ปรึกษาที่ต้องการ',
  'รอรับการติดต่อกลับภายใน 3 วันทำการ',
  'รับการปรึกษาแบบ 1-on-1 ออนไลน์',
]

const advisors = [
  { name:'ดร. สมใจ ใจดี',  role:'นักจิตวิทยาคลินิก',       specialty:'ความเครียด · Burnout',      emoji:'👩‍⚕️', bg:'linear-gradient(135deg,#A7F3D0,#34D399)' },
  { name:'อ. วิไล สุขใจ',  role:'ที่ปรึกษาด้านสุขภาพจิต',  specialty:'ความสัมพันธ์ · EQ',          emoji:'🧑‍⚕️', bg:'linear-gradient(135deg,#BAE6FD,#38BDF8)' },
  { name:'คุณ นพมาศ ดีงาม', role:'นักสังคมสงเคราะห์คลินิก', specialty:'การปรับตัว · ความกดดัน',      emoji:'👩‍💼', bg:'linear-gradient(135deg,#DDD6FE,#7C3AED)' },
]

function sendRequest() {
  if (!selectedAdvisor.value) { ui.showToast('กรุณาเลือกที่ปรึกษา'); return }
  sent.value = true
}

function reset() {
  sent.value = false
  selectedAdvisor.value = null
  mentalMsg.value = ''
  ui.closeModal()
}
</script>
