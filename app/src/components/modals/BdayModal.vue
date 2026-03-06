<template>
  <BaseModal modal-id="modal-bday">
    <!-- Festive header -->
    <div style="position:relative;overflow:hidden;flex-shrink:0;border-radius:24px 24px 0 0;background:linear-gradient(160deg,#FF6BC8 0%,#A855F7 45%,#3B82F6 100%);">
      <div class="modal-handle" style="background:rgba(255,255,255,0.45);margin:14px auto 0;position:relative;z-index:5;"></div>
      <div style="padding:16px 20px 20px;text-align:center;position:relative;z-index:1;">
        <div style="font-size:48px;margin-bottom:6px;">🎂</div>
        <div style="font-size:20px;font-weight:900;color:white;">Birthday Celebration</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.85);margin-top:4px;">กดที่รูปเพื่ออวยพร ❤️</div>
      </div>

      <!-- Tab -->
      <div style="display:flex;gap:8px;padding:0 20px 16px;position:relative;z-index:1;">
        <button class="bday-tab" :class="{ active: tab === 'board' }" @click="tab = 'board'">🎊 Birthday Board</button>
        <button class="bday-tab" :class="{ active: tab === 'send' }" @click="tab = 'send'">💌 ส่งคำอวยพร</button>
      </div>
    </div>

    <div class="modal-body-scroll" style="padding:16px 20px;">
      <!-- Month tabs -->
      <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:12px;scrollbar-width:none;">
        <button
          v-for="m in monthBtns"
          :key="m.idx"
          class="month-tab"
          :class="{ active: currentMonth === m.idx }"
          @click="currentMonth = m.idx"
          style="flex-shrink:0;"
        >{{ m.label }}</button>
      </div>

      <!-- Employee photos grid -->
      <div v-if="tab === 'board'">
        <div v-if="!currentEmps.length" style="text-align:center;padding:32px;color:var(--light);">ไม่มีพนักงานเกิดเดือนนี้ค่ะ 🙁</div>
        <div v-else style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;">
          <div
            v-for="emp in currentEmps"
            :key="emp.key"
            class="emp-photo-card"
            @click="openPersonDetail(emp)"
          >
            <div class="photo-circle-wrap" style="pointer-events:none;">
              <img v-if="emp.photo" :src="emp.photo" style="width:100%;height:100%;object-fit:cover;" />
              <div v-else class="photo-circle-fallback" :style="{ background: bday.getFallbackBg(emp.fallbackIdx) }">
                {{ bday.getFallbackEmoji(emp.fallbackIdx) }}
              </div>
            </div>
            <div class="epc-name">{{ emp.name }}</div>
            <div class="epc-date">🎂 {{ emp.date }}</div>
            <div class="epc-wishes">❤️ {{ emp.wishes.length }}</div>
          </div>
        </div>
      </div>

      <!-- Selected person detail -->
      <div v-if="selectedEmp">
        <button @click="selectedEmp = null" style="background:rgba(168,85,247,0.1);border:1.5px solid rgba(168,85,247,0.2);border-radius:12px;padding:7px 14px;font-size:12px;font-weight:700;color:var(--mid);cursor:pointer;margin-bottom:12px;">← กลับ</button>

        <div class="bday-banner">
          <div class="bb-confetti">🎉🎊🎈</div>
          <div class="bb-name">{{ selectedEmp.name }}</div>
          <div class="bb-role">{{ selectedEmp.role }}</div>
          <div class="bb-wish-count">❤️ {{ selectedEmp.wishes.length }} คำอวยพร</div>
        </div>

        <!-- Wishes -->
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">
          <div v-for="(w, i) in selectedEmp.wishes" :key="i" class="wish-item" :class="{ 'wi-new': i === 0 }">
            <div class="wi-header">
              <div class="wi-av" :style="{ background: bday.getSenderAvatar(w.avIdx).bg }">{{ bday.getSenderAvatar(w.avIdx).av }}</div>
              <div class="wi-name">{{ w.from }}</div>
              <div class="wi-time">{{ w.time }}</div>
            </div>
            <div style="font-size:12px;color:var(--mid);line-height:1.5;margin-top:4px;">{{ w.msg }}</div>
          </div>
        </div>

        <!-- Send wish form -->
        <div style="border-top:1px solid var(--border);padding-top:14px;">
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;">
            <button v-for="chip in wishChips" :key="chip" class="wish-chip" :class="{ active: wishMsg === chip }" @click="wishMsg = chip">{{ chip }}</button>
          </div>
          <textarea v-model="wishMsg" placeholder="หรือพิมพ์เอง..." rows="2" maxlength="500" style="width:100%;border:1.5px solid rgba(168,85,247,0.2);border-radius:12px;padding:10px;font-family:'Sarabun',sans-serif;font-size:13px;color:var(--dark);background:var(--bg);resize:none;outline:none;box-sizing:border-box;margin-bottom:8px;"></textarea>
          <button class="modal-close-btn" style="background:linear-gradient(135deg,#A855F7,#7C3AED);" @click="sendWish">ส่งคำอวยพร 🎊</button>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, computed } from 'vue'
import BaseModal from '../shared/BaseModal.vue'
import { useBirthdayStore } from '../../stores/birthday.js'
import { useUiStore } from '../../stores/ui.js'

const bday = useBirthdayStore()
const ui = useUiStore()
const tab = ref('board')
const currentMonth = ref(new Date().getMonth())
const selectedEmp = ref(null)
const wishMsg = ref('')

const wishChips = ['สุขสันต์วันเกิดนะคะ 🎂','ขอให้มีความสุขมากๆ 🌟','Happy Birthday! 🎉','ขอให้โชคดี 🍀']

const monthBtns = [
  {idx:0,label:'ม.ค.'},{idx:1,label:'ก.พ.'},{idx:2,label:'มี.ค. 🎉'},
  {idx:3,label:'เม.ย.'},{idx:4,label:'พ.ค.'},{idx:5,label:'มิ.ย.'},
  {idx:6,label:'ก.ค.'},{idx:7,label:'ส.ค.'},{idx:8,label:'ก.ย.'},
  {idx:9,label:'ต.ค.'},{idx:10,label:'พ.ย.'},{idx:11,label:'ธ.ค.'},
]

const currentEmps = computed(() => bday.allEmployees[currentMonth.value] || [])

function openPersonDetail(emp) {
  selectedEmp.value = emp
  wishMsg.value = ''
}

function sendWish() {
  if (!wishMsg.value.trim() || !selectedEmp.value) return
  bday.sendWish(selectedEmp.value.key, wishMsg.value.trim(), ui.currentUser.name, 0)
  wishMsg.value = ''
}
</script>
