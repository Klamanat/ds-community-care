<template>
  <div style="background:#0D0D1A;min-height:100vh;overflow-x:hidden;">
    <!-- Hero Header -->
    <div style="position:relative;overflow:hidden;padding:28px 20px 24px;background:linear-gradient(160deg,#1A0A2E 0%,#2D0A4E 50%,#1A0A2E 100%);">
      <div style="position:absolute;top:8px;left:10%;font-size:18px;opacity:0.5;animation:floatY 3s ease-in-out infinite;">🎉</div>
      <div style="position:absolute;top:14px;right:15%;font-size:14px;opacity:0.4;animation:floatY 2.5s ease-in-out infinite 0.5s;">✨</div>
      <div style="position:absolute;bottom:12px;left:20%;font-size:16px;opacity:0.45;animation:floatY 3.5s ease-in-out infinite 1s;">🎊</div>
      <div style="position:relative;z-index:2;text-align:center;">
        <div style="font-size:52px;margin-bottom:4px;filter:drop-shadow(0 0 16px rgba(255,200,0,0.5));">🎂</div>
        <div style="font-size:22px;font-weight:900;color:#FFD700;text-shadow:0 0 12px rgba(255,215,0,0.5);">Birthday Celebration</div>
        <div style="font-size:13px;color:rgba(200,170,255,0.85);margin-top:4px;letter-spacing:1.5px;">Digital Solutions Team 🎊</div>
      </div>
      <!-- Tab buttons -->
      <div style="position:relative;z-index:2;display:flex;gap:8px;justify-content:center;margin-top:16px;">
        <button class="bday-tab" :class="{ active: pageTab === 'board' }" @click="pageTab = 'board'">🎊 Birthday Board</button>
        <button class="bday-tab" :class="{ active: pageTab === 'surprise' }" @click="pageTab = 'surprise'" style="position:relative;">
          🎁 Surprise Box
          <span style="position:absolute;top:-4px;right:-2px;background:#FF4455;color:white;font-size:7px;font-weight:800;padding:1px 4px;border-radius:8px;line-height:1.5;">NEW</span>
        </button>
      </div>
    </div>

    <!-- Board Tab -->
    <div v-if="pageTab === 'board'" style="padding:0 16px 32px;">
      <!-- Month selector -->
      <div style="display:flex;gap:6px;overflow-x:auto;padding:4px 0 12px;scrollbar-width:none;">
        <button
          v-for="m in monthBtns"
          :key="m.idx"
          class="m-sel-btn"
          :class="{ active: selectedMonth === m.idx }"
          @click="selectMonth(m.idx)"
          style="flex-shrink:0;"
        >{{ m.label }}</button>
      </div>

      <!-- Back button when viewing a person -->
      <div v-if="selectedPerson" style="margin-bottom:12px;">
        <button @click="selectedPerson = null" style="background:rgba(168,85,247,0.1);border:1.5px solid rgba(168,85,247,0.3);border-radius:12px;padding:7px 14px;font-size:12px;font-weight:700;color:rgba(200,170,255,0.9);cursor:pointer;">← กลับ</button>
      </div>

      <!-- Person board detail -->
      <template v-if="selectedPerson">
        <div class="bday-banner">
          <div class="bb-confetti">🎉🎊🎈</div>
          <div class="bb-name">{{ selectedPerson.name }}</div>
          <div class="bb-role">{{ selectedPerson.role }} • {{ selectedPerson.date }}</div>
          <div class="bb-wish-count">❤️ {{ selectedPerson.wishes.length }} คำอวยพร</div>
        </div>

        <!-- Wish feed -->
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
          <div v-if="!selectedPerson.wishes.length" style="text-align:center;padding:20px;color:rgba(200,170,255,0.6);font-size:13px;">
            ยังไม่มีคำอวยพรค่ะ เป็นคนแรกได้เลย! 🎉
          </div>
          <div v-for="(w, i) in selectedPerson.wishes" :key="i" class="wish-item" :class="{ 'wi-new': i === 0 }">
            <div class="wi-header">
              <div class="wi-av" :style="{ background: bday.getSenderAvatar(w.avIdx).bg }">{{ bday.getSenderAvatar(w.avIdx).av }}</div>
              <div class="wi-name" style="color:rgba(200,170,255,0.9);">{{ w.from }}</div>
              <div class="wi-time">{{ w.time }}</div>
            </div>
            <div class="wi-msg" style="color:rgba(220,200,255,0.8);padding-left:0;margin-top:4px;">{{ w.msg }}</div>
          </div>
        </div>

        <!-- Send wish form -->
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(168,85,247,0.2);border-radius:18px;padding:16px;">
          <div style="font-size:12px;font-weight:700;color:rgba(200,170,255,0.8);margin-bottom:10px;">✉️ ส่งคำอวยพรถึง {{ selectedPerson.name }}</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;">
            <button
              v-for="chip in wishChips"
              :key="chip"
              class="wish-chip"
              :class="{ active: selectedChip === chip }"
              @click="selectedChip = chip; wishMsg = chip"
            >{{ chip }}</button>
          </div>
          <textarea
            v-model="wishMsg"
            placeholder="หรือพิมพ์ข้อความเอง..."
            rows="2"
            maxlength="500"
            style="width:100%;border:1.5px solid rgba(168,85,247,0.25);border-radius:14px;padding:10px 12px;font-family:'Sarabun',sans-serif;font-size:13px;color:rgba(220,200,255,0.9);background:rgba(255,255,255,0.05);resize:none;outline:none;box-sizing:border-box;margin-bottom:8px;"
          ></textarea>
          <button
            style="width:100%;padding:11px;background:linear-gradient(135deg,#A855F7,#7C3AED);border:none;border-radius:14px;color:white;font-family:'Sarabun',sans-serif;font-size:13px;font-weight:800;cursor:pointer;"
            @click="sendWish"
          >ส่งคำอวยพร 🎊</button>
        </div>
      </template>

      <!-- Employee grid -->
      <template v-else>
        <div style="font-size:13px;font-weight:700;color:rgba(200,170,255,0.7);margin-bottom:12px;">
          🎂 พนักงานเดือน {{ monthName(selectedMonth) }}
        </div>
        <div v-if="currentMonthEmps.length === 0" style="text-align:center;padding:32px;color:rgba(200,170,255,0.5);">
          ไม่มีพนักงานเกิดเดือนนี้ค่ะ 🙁
        </div>
        <div v-else style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
          <div
            v-for="emp in currentMonthEmps"
            :key="emp.key"
            class="emp-photo-card"
            style="background:rgba(255,255,255,0.04);border-color:rgba(168,85,247,0.2);"
            @click="selectedPerson = emp"
          >
            <div class="photo-circle-wrap">
              <img v-if="emp.photo" :src="emp.photo" style="width:100%;height:100%;object-fit:cover;" />
              <div v-else class="photo-circle-fallback" :style="{ background: bday.getFallbackBg(emp.fallbackIdx) }">
                {{ bday.getFallbackEmoji(emp.fallbackIdx) }}
              </div>
            </div>
            <div class="epc-name" style="color:rgba(220,200,255,0.9);">{{ emp.name }}</div>
            <div class="epc-date" style="color:rgba(200,170,255,0.7);">🎂 {{ emp.date }}</div>
            <div class="epc-wishes" style="color:rgba(200,170,255,0.8);">❤️ {{ emp.wishes.length }} คำอวยพร</div>
          </div>
        </div>
      </template>
    </div>

    <!-- Surprise Box Tab -->
    <div v-else style="padding:16px 16px 32px;">
      <div style="text-align:center;padding:32px 20px;">
        <div style="font-size:64px;margin-bottom:14px;animation:prizePopIn 0.6s cubic-bezier(0.34,1.56,0.64,1);">🎁</div>
        <div style="font-size:18px;font-weight:900;color:#FFD700;margin-bottom:8px;">Surprise Box</div>
        <div style="font-size:13px;color:rgba(200,170,255,0.7);line-height:1.7;">กิจกรรมเซอร์ไพรส์สุดพิเศษ<br>สำหรับพนักงานในเดือนเกิด ✨</div>
        <div style="display:flex;gap:10px;margin-top:20px;">
          <div class="prize-hint" v-for="p in prizes" :key="p.icon">
            <div style="font-size:32px;">{{ p.icon }}</div>
            <div class="ph-name">{{ p.name }}</div>
            <div class="ph-sub">{{ p.sub }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useBirthdayStore } from '../stores/birthday.js'
import { useUiStore } from '../stores/ui.js'

const bday = useBirthdayStore()
const ui = useUiStore()

const pageTab = ref('board')
const selectedMonth = ref(new Date().getMonth() + 1) // 1-based
const selectedPerson = ref(null)
const wishMsg = ref('')
const selectedChip = ref(null)

const wishChips = ['สุขสันต์วันเกิดนะคะ 🎂', 'ขอให้มีความสุขมากๆ 🌟', 'Happy Birthday! 🎉', 'ขอให้โชคดีตลอดปี 🍀']

const monthBtns = [
  {idx:1,label:'ม.ค.'},{idx:2,label:'ก.พ.'},{idx:3,label:'มี.ค. 🎉'},
  {idx:4,label:'เม.ย.'},{idx:5,label:'พ.ค.'},{idx:6,label:'มิ.ย.'},
  {idx:7,label:'ก.ค.'},{idx:8,label:'ส.ค.'},{idx:9,label:'ก.ย.'},
  {idx:10,label:'ต.ค.'},{idx:11,label:'พ.ย.'},{idx:12,label:'ธ.ค.'},
]

const MONTH_NAMES = ['','January','February','March','April','May','June','July','August','September','October','November','December']
function monthName(idx) { return MONTH_NAMES[idx] || '' }

const currentMonthEmps = computed(() => bday.allEmployees[selectedMonth.value - 1] || [])

function selectMonth(idx) {
  selectedMonth.value = idx
  selectedPerson.value = null
  bday.loadMonth(idx - 1)
}

function sendWish() {
  if (!wishMsg.value.trim() || !selectedPerson.value) return
  bday.sendWish(
    selectedPerson.value.key,
    wishMsg.value.trim(),
    ui.currentUser.name,
    0
  )
  wishMsg.value = ''
  selectedChip.value = null
}

const prizes = [
  { icon:'🎂', name:'Birthday Cake', sub:'เค้กวันเกิดสุดพิเศษ' },
  { icon:'🎁', name:'Gift Voucher', sub:'คูปองของขวัญ' },
  { icon:'🌸', name:'Day Off', sub:'วันหยุดพิเศษ 1 วัน' },
]

onMounted(() => {
  bday.loadMonth(selectedMonth.value - 1)
})
</script>
