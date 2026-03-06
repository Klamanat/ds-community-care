<template>
  <BaseModal modal-id="modal-financial">
    <!-- Header -->
    <div class="px-5 pt-5 pb-4 rounded-t-2xl flex-shrink-0 relative overflow-hidden"
         style="background:linear-gradient(135deg,#FEF3C7 0%,#F59E0B 50%,#D97706 100%);">
      <div class="modal-handle"></div>
      <div class="text-center relative z-10">
        <div class="text-[38px] mb-1">💰</div>
        <div class="text-[20px] font-extrabold text-white" style="text-shadow:0 2px 6px rgba(0,0,0,0.2);">Financial Consultation</div>
        <div class="text-[11px] text-white/90 mt-1">ปรึกษาผู้เชี่ยวชาญด้านการเงิน ✨</div>
      </div>
      <div class="flex items-center justify-center gap-2 bg-white/20 rounded-full px-4 py-2 mt-3
                  border border-white/35">
        <span class="text-[13px]">🔒</span>
        <span class="text-[11px] font-bold text-white">Anonymous 100% · 5 เคส/ปี · Follow up 3 ครั้ง</span>
      </div>
    </div>

    <div v-if="!sent" class="modal-body-scroll p-4">
      <div class="text-[12px] font-extrabold text-app-mid mb-3 text-center tracking-wide">📋 เลือกหัวข้อที่ต้องการปรึกษา</div>

      <div class="flex flex-col gap-2.5 mb-4">
        <div
          v-for="t in topics"
          :key="t.id"
          class="fin-topic"
          :class="{ selected: selectedTopic === t.id }"
          @click="selectedTopic = t.id"
        >
          <div class="fin-topic-icon" :style="{ background: t.bg }">{{ t.icon }}</div>
          <div class="fin-topic-info">
            <div class="fin-topic-name">{{ t.name }}</div>
            <div class="fin-topic-desc">{{ t.desc }}</div>
          </div>
          <div class="fin-topic-check">{{ selectedTopic === t.id ? '✅' : '○' }}</div>
        </div>
      </div>

      <div v-if="selectedTopic">
        <textarea
          v-model="finMsg"
          placeholder="อธิบายสถานการณ์คร่าวๆ ได้เลยค่ะ... ตัวตนของคุณจะถูกปกปิด 🔒"
          maxlength="500"
          class="w-full min-h-[80px] rounded-xl border-[1.5px] border-app-border p-3
                 text-[13px] text-app-dark bg-app-bg resize-none outline-none leading-relaxed mb-3"
        ></textarea>
        <button
          class="modal-close-btn mb-1"
          style="background:linear-gradient(135deg,#F59E0B,#D97706);"
          @click="sendRequest"
        >ส่งคำขอปรึกษา 🔒</button>
        <button
          class="w-full py-2.5 bg-transparent border-none text-app-light text-[12px] cursor-pointer"
          @click="selectedTopic = null"
        >← เลือกหัวข้อใหม่</button>
      </div>

      <div class="bg-[linear-gradient(135deg,#FFFBEB,#FEF3C7)] border-[1.5px] border-[#FCD34D]
                  rounded-xl p-3 text-center mt-2">
        <div class="text-[11px] text-[#92400E] font-bold leading-relaxed">
          🔐 ข้อมูลของคุณถูกเก็บเป็นความลับ<br>มีเพียง Admin และที่ปรึกษาที่ได้รับมอบหมายเท่านั้นที่เห็น
        </div>
      </div>
    </div>

    <!-- Success -->
    <div v-else class="text-center p-8">
      <div class="text-[60px] mb-4" style="animation:prizePopIn 0.6s cubic-bezier(0.34,1.56,0.64,1);">📩</div>
      <div class="text-[17px] font-black text-app-dark mb-2">ส่งคำขอสำเร็จแล้วค่ะ!</div>
      <div class="text-[13px] text-app-light leading-relaxed mb-5">ที่ปรึกษาจะติดต่อกลับภายใน 10 วันทำการ</div>
      <button
        class="modal-close-btn"
        style="background:linear-gradient(135deg,#F59E0B,#D97706);"
        @click="reset"
      >กลับหน้าหลัก 💛</button>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref } from 'vue'
import BaseModal from '../shared/BaseModal.vue'
import { useUiStore } from '../../stores/ui.js'

const ui = useUiStore()
const selectedTopic = ref(null)
const finMsg = ref('')
const sent = ref(false)

const topics = [
  { id:'debt',   icon:'💸', bg:'linear-gradient(135deg,#FECACA,#EF4444)', name:'การจัดการหนี้สิน',           desc:'หนี้บัตรเครดิต · หนี้นอกระบบ · ภาระหนี้สะสม' },
  { id:'save',   icon:'📊', bg:'linear-gradient(135deg,#A7F3D0,#10B981)', name:'การวางแผนและออมเงิน',         desc:'ออมเงิน · รายได้ไม่พอรายจ่าย · เงินสำรองฉุกเฉิน' },
  { id:'invest', icon:'🏠', bg:'linear-gradient(135deg,#C7D2FE,#6366F1)', name:'การวางแผนสินทรัพย์และการลงทุน', desc:'ซื้อบ้าน/รถ · ลงทุนเบื้องต้น · จัดสรรสินทรัพย์' },
  { id:'crisis', icon:'🆘', bg:'linear-gradient(135deg,#FDE68A,#F59E0B)', name:'ภาวะวิกฤตทางการเงิน',        desc:'รายได้หยุดกะทันหัน · ค่าใช้จ่ายฉุกเฉิน · ถูกหลอกลวง' },
]

function sendRequest() {
  if (!selectedTopic.value) return
  sent.value = true
}

function reset() {
  sent.value = false
  selectedTopic.value = null
  finMsg.value = ''
  ui.closeModal()
}
</script>
