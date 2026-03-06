<template>
  <BaseModal modal-id="modal-financial">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#FEF3C7 0%,#F59E0B 50%,#D97706 100%);padding:20px 20px 18px;position:relative;overflow:hidden;border-radius:28px 28px 0 0;flex-shrink:0;">
      <div class="modal-handle" style="background:rgba(255,255,255,0.45);margin-bottom:12px;"></div>
      <div style="text-align:center;position:relative;z-index:1;">
        <div style="font-size:38px;margin-bottom:4px;">💰</div>
        <div style="font-size:20px;font-weight:800;color:white;text-shadow:0 2px 6px rgba(0,0,0,0.2);">Financial Consultation</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.9);margin-top:3px;">ปรึกษาผู้เชี่ยวชาญด้านการเงิน ✨</div>
      </div>
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;background:rgba(255,255,255,0.2);border-radius:30px;padding:8px 18px;margin-top:12px;border:1px solid rgba(255,255,255,0.35);">
        <span style="font-size:13px;">🔒</span>
        <span style="font-size:11px;font-weight:700;color:white;">Anonymous 100% · 5 เคส/ปี · Follow up 3 ครั้ง</span>
      </div>
    </div>

    <div v-if="!sent" class="modal-body-scroll" style="padding:16px;">
      <div style="font-size:12px;font-weight:800;color:var(--mid);margin-bottom:12px;text-align:center;letter-spacing:0.5px;">📋 เลือกหัวข้อที่ต้องการปรึกษา</div>

      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
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
        <textarea v-model="finMsg" placeholder="อธิบายสถานการณ์คร่าวๆ ได้เลยค่ะ... ตัวตนของคุณจะถูกปกปิด 🔒" maxlength="500" style="width:100%;min-height:80px;border-radius:14px;border:1.5px solid var(--border);padding:12px;font-family:'Sarabun',sans-serif;font-size:13px;color:var(--dark);background:var(--bg);resize:none;outline:none;line-height:1.6;box-sizing:border-box;margin-bottom:12px;"></textarea>
        <button class="modal-close-btn" style="background:linear-gradient(135deg,#F59E0B,#D97706);" @click="sendRequest">ส่งคำขอปรึกษา 🔒</button>
        <button @click="selectedTopic = null" style="width:100%;padding:10px;background:none;border:none;color:var(--light);font-size:12px;font-family:'Sarabun',sans-serif;cursor:pointer;margin-top:4px;">← เลือกหัวข้อใหม่</button>
      </div>

      <div style="background:linear-gradient(135deg,#FFFBEB,#FEF3C7);border:1.5px solid #FCD34D;border-radius:14px;padding:12px;text-align:center;margin-top:8px;">
        <div style="font-size:11px;color:#92400E;font-weight:700;line-height:1.7;">🔐 ข้อมูลของคุณถูกเก็บเป็นความลับ<br>มีเพียง Admin และที่ปรึกษาที่ได้รับมอบหมายเท่านั้นที่เห็น</div>
      </div>
    </div>

    <!-- Success state -->
    <div v-else style="text-align:center;padding:32px 20px;">
      <div style="font-size:60px;margin-bottom:14px;animation:prizePopIn 0.6s cubic-bezier(0.34,1.56,0.64,1);">📩</div>
      <div style="font-size:17px;font-weight:900;color:var(--dark);margin-bottom:8px;">ส่งคำขอสำเร็จแล้วค่ะ!</div>
      <div style="font-size:13px;color:var(--light);line-height:1.7;margin-bottom:20px;">ที่ปรึกษาจะติดต่อกลับภายใน 10 วันทำการ</div>
      <button class="modal-close-btn" style="background:linear-gradient(135deg,#F59E0B,#D97706);" @click="reset">กลับหน้าหลัก 💛</button>
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
