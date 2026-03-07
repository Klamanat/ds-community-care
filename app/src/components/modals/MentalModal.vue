<template>
  <BaseModal modal-id="modal-mental">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#A8E6CF 0%,#56C596 45%,#2EAF7D 100%);padding:0 20px 18px;position:relative;overflow:hidden;flex-shrink:0;border-radius:28px 28px 0 0;">
      <!-- Glow orbs -->
      <div style="position:absolute;top:-30px;right:-20px;width:110px;height:110px;background:rgba(255,255,255,0.1);border-radius:50%;pointer-events:none;"></div>
      <div style="position:absolute;bottom:-20px;left:10px;width:70px;height:70px;background:rgba(255,255,255,0.08);border-radius:50%;pointer-events:none;"></div>

      <div class="modal-handle" style="background:rgba(255,255,255,0.4);"></div>
      <div style="text-align:center;position:relative;z-index:1;">
        <div style="font-size:52px;margin-bottom:4px;">🧠</div>
        <div style="font-size:20px;font-weight:800;color:white;text-shadow:0 2px 4px rgba(0,0,0,0.15);">Mental Health Consultation</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.85);margin-top:3px;">ดูแลสุขภาพใจ พร้อม 24/7 💙</div>
      </div>
      <!-- Anonymous badge -->
      <div style="display:flex;align-items:center;justify-content:center;gap:6px;background:rgba(255,255,255,0.18);border-radius:30px;padding:7px 18px;margin-top:12px;backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,0.3);">
        <span style="font-size:14px;">🔒</span>
        <span style="font-size:11px;font-weight:700;color:white;">ข้อความของคุณจะถูกปกปิดตัวตน 100%</span>
      </div>
    </div>

    <!-- Body -->
    <div class="modal-body-scroll">

      <!-- ── Form state ── -->
      <div v-if="!sent" style="padding:16px;">

        <!-- Advisor list -->
        <div style="font-size:12px;font-weight:800;color:#6B7280;margin-bottom:12px;text-align:center;letter-spacing:0.5px;">
          🌿 เลือกที่ปรึกษาที่ต้องการส่งข้อความ
        </div>

        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px;">
          <div
            v-for="adv in advisors"
            :key="adv.id"
            class="advisor-card"
            :class="{ selected: selectedAdvisor?.id === adv.id }"
            @click="selectAdvisor(adv)"
          >
            <div class="adv-avatar" :style="{ background: adv.bg }">{{ adv.emoji }}</div>
            <div class="adv-info">
              <div class="adv-name">{{ adv.name }}</div>
              <div class="adv-role">ที่ปรึกษาด้านสุขภาพจิต</div>
              <div class="adv-tag">💬 พร้อมรับฟัง</div>
            </div>
            <div class="adv-check" :class="{ checked: selectedAdvisor?.id === adv.id }">
              {{ selectedAdvisor?.id === adv.id ? '✅' : '○' }}
            </div>
          </div>
        </div>

        <!-- Composer (shown after advisor selected) -->
        <Transition name="slide-down">
          <div v-if="selectedAdvisor" style="margin-bottom:14px;">
            <!-- Selected advisor banner -->
            <div style="background:linear-gradient(135deg,#F0FDF4,#DCFCE7);border-radius:14px;padding:10px 14px;margin-bottom:10px;display:flex;align-items:center;gap:10px;">
              <div :style="{ background: selectedAdvisor.bg }" style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">
                {{ selectedAdvisor.emoji }}
              </div>
              <div>
                <div style="font-size:12px;font-weight:800;color:#1F2937;">ส่งถึง: <span style="color:#2EAF7D;">{{ selectedAdvisor.name }}</span></div>
                <div style="font-size:10px;color:#9CA3AF;">🔒 ตัวตนของคุณจะถูกปกปิดโดยอัตโนมัติ</div>
              </div>
            </div>

            <!-- Quick topic chips -->
            <div style="font-size:11px;font-weight:700;color:#6B7280;margin-bottom:6px;">เรื่องที่ต้องการปรึกษา:</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
              <span
                v-for="chip in mentalChips"
                :key="chip"
                class="mental-chip"
                :class="{ active: selectedChip === chip }"
                @click="selectedChip = chip; mentalMsg = chip"
              >{{ chip }}</span>
            </div>

            <textarea
              v-model="mentalMsg"
              placeholder="พิมพ์ข้อความที่ต้องการส่งได้เลยค่ะ... ไม่มีใครรู้ว่าเป็นคุณ 🌿"
              maxlength="500"
              style="width:100%;min-height:90px;border-radius:14px;border:1.5px solid #E5E7EB;padding:12px;font-family:'Sarabun',sans-serif;font-size:13px;color:#1F2937;background:#F9FAFB;resize:none;outline:none;line-height:1.6;box-sizing:border-box;"
            ></textarea>

            <button
              class="modal-close-btn"
              style="margin-top:10px;background:linear-gradient(135deg,#56C596,#2EAF7D);"
              @click="sendMsg"
            >ส่งข้อความ 🔒</button>

            <button
              style="width:100%;padding:10px;background:none;border:none;color:#9CA3AF;font-size:12px;font-family:'Sarabun',sans-serif;cursor:pointer;margin-top:4px;"
              @click="selectedAdvisor = null; mentalMsg = ''; selectedChip = null"
            >← เลือกที่ปรึกษาใหม่</button>
          </div>
        </Transition>

        <!-- Privacy notice -->
        <div style="background:linear-gradient(135deg,#F0FDF4,#DCFCE7);border:1.5px solid #86EFAC;border-radius:14px;padding:12px;text-align:center;">
          <div style="font-size:11px;color:#15803D;font-weight:700;line-height:1.6;">
            🔐 ระบบจะไม่เปิดเผยชื่อหรือข้อมูลใดๆ<br>การพูดคุยเป็นความลับ 100%
          </div>
        </div>
      </div>

      <!-- ── Success state ── -->
      <div v-else style="text-align:center;padding:32px 20px;">
        <div style="font-size:60px;margin-bottom:14px;animation:prizePopIn 0.6s cubic-bezier(0.34,1.56,0.64,1);">💌</div>
        <div style="font-size:17px;font-weight:900;color:#1F2937;margin-bottom:8px;">ส่งข้อความสำเร็จแล้วค่ะ</div>
        <div style="font-size:13px;color:#9CA3AF;line-height:1.7;margin-bottom:20px;">
          ส่งถึง <strong>{{ successAdvisor }}</strong> แล้วค่ะ 💚<br>กำลังรอรับฟังคุณอยู่นะคะ
        </div>
        <div style="background:linear-gradient(135deg,#F0FDF4,#DCFCE7);border-radius:16px;padding:14px;margin-bottom:16px;">
          <div style="font-size:11px;color:#15803D;font-weight:700;line-height:1.6;">
            🔒 ตัวตนของคุณถูกปกปิดเรียบร้อยแล้ว<br>ที่ปรึกษาจะติดต่อกลับภายใน 24 ชั่วโมงค่ะ
          </div>
        </div>
        <button
          class="modal-close-btn"
          style="background:linear-gradient(135deg,#56C596,#2EAF7D);"
          @click="reset"
        >กลับหน้าหลัก 💙</button>
      </div>

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
const selectedChip = ref(null)
const sent = ref(false)
const successAdvisor = ref('')

const advisors = [
  { id: 'manaow', name: 'พี่มะนาว', emoji: '🍋', bg: 'linear-gradient(135deg,#FDE68A,#F59E0B)' },
  { id: 'nicole', name: 'พี่นิโคล', emoji: '🌸', bg: 'linear-gradient(135deg,#FBCFE8,#EC4899)' },
  { id: 'oak',    name: 'พี่โอ๊ค',  emoji: '🌳', bg: 'linear-gradient(135deg,#A7F3D0,#10B981)' },
  { id: 'pae',    name: 'พี่เป้',   emoji: '🎯', bg: 'linear-gradient(135deg,#C7D2FE,#6366F1)' },
  { id: 'wut',    name: 'พี่วุฒิ',  emoji: '🌊', bg: 'linear-gradient(135deg,#BAE6FD,#0EA5E9)' },
  { id: 'eve',    name: 'พี่อีฟ',   emoji: '🌺', bg: 'linear-gradient(135deg,#FED7E2,#F472B6)' },
]

const mentalChips = ['😔 ความเครียด', '🤗 ขอกำลังใจ', '🔥 Burnout', '💞 ความสัมพันธ์']

function selectAdvisor(adv) {
  selectedAdvisor.value = adv
  mentalMsg.value = ''
  selectedChip.value = null
}

function sendMsg() {
  if (!mentalMsg.value.trim()) { ui.showToast('กรุณาพิมพ์ข้อความ'); return }
  successAdvisor.value = selectedAdvisor.value.name
  sent.value = true
}

function reset() {
  sent.value = false
  selectedAdvisor.value = null
  mentalMsg.value = ''
  selectedChip.value = null
  ui.closeModal()
}
</script>

<style scoped>
.slide-down-enter-active { transition: all 0.3s ease; }
.slide-down-leave-active { transition: all 0.2s ease; }
.slide-down-enter-from   { opacity: 0; transform: translateY(-8px); }
.slide-down-leave-to     { opacity: 0; transform: translateY(-8px); }
</style>
