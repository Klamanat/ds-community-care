<template>
  <BaseModal modal-id="modal-mental">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#E8F8F0,#2EAF7D,#065F46);padding:20px 20px 18px;border-radius:28px 28px 0 0;flex-shrink:0;">
      <div class="modal-handle" style="background:rgba(255,255,255,0.45);margin-bottom:12px;"></div>
      <div style="text-align:center;">
        <div style="font-size:38px;margin-bottom:4px;">🧠</div>
        <div style="font-size:20px;font-weight:800;color:white;">Mental Health Consultation</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.9);margin-top:3px;">ปรึกษาผู้เชี่ยวชาญด้านสุขภาพจิต 💚</div>
      </div>
    </div>

    <div v-if="!sent" class="modal-body-scroll" style="padding:16px;">
      <!-- Steps -->
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
        <div v-for="(step, i) in steps" :key="i" class="mental-step">
          <div class="mental-step-num">{{ i + 1 }}</div>
          <div style="font-size:12px;color:var(--mid);">{{ step }}</div>
        </div>
      </div>

      <!-- Advisors -->
      <div style="font-size:12px;font-weight:800;color:var(--mid);margin-bottom:12px;">เลือกที่ปรึกษา</div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
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
          <div style="font-size:20px;color:var(--light);">{{ selectedAdvisor === adv.name ? '✅' : '○' }}</div>
        </div>
      </div>

      <textarea v-model="mentalMsg" placeholder="อธิบายสิ่งที่ต้องการปรึกษาคร่าวๆ (ถ้ามี)..." maxlength="500" style="width:100%;min-height:80px;border-radius:14px;border:1.5px solid var(--border);padding:12px;font-family:'Sarabun',sans-serif;font-size:13px;color:var(--dark);background:var(--bg);resize:none;outline:none;line-height:1.6;box-sizing:border-box;margin-bottom:12px;"></textarea>

      <button class="modal-close-btn" style="background:linear-gradient(135deg,#2EAF7D,#065F46);" @click="sendRequest">ส่งคำขอนัดหมาย 🌿</button>
    </div>

    <!-- Success -->
    <div v-else style="text-align:center;padding:32px 20px;">
      <div style="font-size:60px;margin-bottom:14px;animation:prizePopIn 0.6s cubic-bezier(0.34,1.56,0.64,1);">🌿</div>
      <div style="font-size:17px;font-weight:900;color:var(--dark);margin-bottom:8px;">ส่งคำขอสำเร็จแล้วค่ะ!</div>
      <div style="font-size:13px;color:var(--light);line-height:1.7;">ที่ปรึกษาจะติดต่อกลับภายใน 3 วันทำการ</div>
      <button class="modal-close-btn" style="background:linear-gradient(135deg,#2EAF7D,#065F46);margin-top:20px;" @click="reset">กลับหน้าหลัก 💚</button>
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
  { name:'ดร. สมใจ ใจดี',  role:'นักจิตวิทยาคลินิก',        specialty:'ความเครียด · Burnout',      emoji:'👩‍⚕️', bg:'linear-gradient(135deg,#A7F3D0,#34D399)' },
  { name:'อ. วิไล สุขใจ', role:'ที่ปรึกษาด้านสุขภาพจิต',    specialty:'ความสัมพันธ์ · EQ',           emoji:'🧑‍⚕️', bg:'linear-gradient(135deg,#BAE6FD,#38BDF8)' },
  { name:'คุณ นพมาศ ดีงาม',role:'นักสังคมสงเคราะห์คลินิก', specialty:'การปรับตัว · ความกดดัน',       emoji:'👩‍💼', bg:'linear-gradient(135deg,#DDD6FE,#7C3AED)' },
]

function sendRequest() {
  if (!selectedAdvisor.value) { useUiStore().showToast('กรุณาเลือกที่ปรึกษา'); return }
  sent.value = true
}

function reset() {
  sent.value = false
  selectedAdvisor.value = null
  mentalMsg.value = ''
  ui.closeModal()
}
</script>
