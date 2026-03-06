<template>
  <div class="min-h-screen bg-[#0D0D1A] overflow-x-hidden">

    <!-- Hero Header -->
    <div class="relative overflow-hidden px-5 pt-7 pb-6"
         style="background:linear-gradient(160deg,#1A0A2E 0%,#2D0A4E 50%,#1A0A2E 100%);">
      <!-- floating confetti -->
      <div class="absolute left-[10%] top-2 text-[18px] opacity-50" style="animation:floatY 3s ease-in-out infinite;">🎉</div>
      <div class="absolute right-[15%] top-3.5 text-[14px] opacity-40" style="animation:floatY 2.5s ease-in-out infinite 0.5s;">✨</div>
      <div class="absolute left-[20%] bottom-3 text-[16px] opacity-45" style="animation:floatY 3.5s ease-in-out infinite 1s;">🎊</div>

      <div class="relative z-10 text-center">
        <div class="text-[52px] mb-1" style="filter:drop-shadow(0 0 16px rgba(255,200,0,0.5));">🎂</div>
        <div class="text-[22px] font-black text-[#FFD700]" style="text-shadow:0 0 12px rgba(255,215,0,0.5);">Birthday Celebration</div>
        <div class="text-[13px] text-[rgba(200,170,255,0.85)] mt-1 tracking-[1.5px]">Digital Solutions Team 🎊</div>
      </div>

      <!-- Tab buttons -->
      <div class="relative z-10 flex gap-2 justify-center mt-4">
        <button
          class="px-5 py-2 rounded-full text-[12px] font-bold border transition-all duration-150"
          :class="pageTab === 'board'
            ? 'bg-purple text-white border-purple'
            : 'bg-white/10 text-[rgba(200,170,255,0.8)] border-[rgba(168,85,247,0.3)]'"
          @click="pageTab = 'board'"
        >🎊 Birthday Board</button>
        <button
          class="relative px-5 py-2 rounded-full text-[12px] font-bold border transition-all duration-150"
          :class="pageTab === 'surprise'
            ? 'bg-purple text-white border-purple'
            : 'bg-white/10 text-[rgba(200,170,255,0.8)] border-[rgba(168,85,247,0.3)]'"
          @click="pageTab = 'surprise'"
        >
          🎁 Surprise Box
          <span class="absolute -top-1 -right-0.5 bg-[#FF4455] text-white text-[7px] font-black px-1 py-0.5 rounded-md leading-none">NEW</span>
        </button>
      </div>
    </div>

    <!-- Board Tab -->
    <div v-if="pageTab === 'board'" class="px-4 pb-8">

      <!-- Month selector -->
      <div class="flex gap-1.5 overflow-x-auto py-3 scrollbar-hide">
        <button
          v-for="m in monthBtns"
          :key="m.idx"
          class="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all duration-150 whitespace-nowrap"
          :class="selectedMonth === m.idx
            ? 'bg-purple text-white border-purple'
            : 'bg-white/8 text-[rgba(200,170,255,0.8)] border-[rgba(168,85,247,0.25)]'"
          @click="selectMonth(m.idx)"
        >{{ m.label }}</button>
      </div>

      <!-- Back button -->
      <div v-if="selectedPerson" class="mb-3">
        <button
          class="bg-[rgba(168,85,247,0.1)] border-[1.5px] border-[rgba(168,85,247,0.3)] rounded-xl
                 px-4 py-1.5 text-[12px] font-bold text-[rgba(200,170,255,0.9)] cursor-pointer"
          @click="selectedPerson = null"
        >← กลับ</button>
      </div>

      <!-- Person detail view -->
      <template v-if="selectedPerson">
        <!-- Banner -->
        <div class="rounded-2xl p-5 mb-4 text-center relative overflow-hidden"
             style="background:linear-gradient(135deg,#3D0A6E,#6B21A8,#3D0A6E);">
          <div class="text-[20px] mb-1">🎉🎊🎈</div>
          <div class="text-[20px] font-black text-white">{{ selectedPerson.name }}</div>
          <div class="text-[12px] text-white/70 mt-1">{{ selectedPerson.role }} • {{ selectedPerson.date }}</div>
          <div class="text-[11px] text-pink mt-1">❤️ {{ selectedPerson.wishes.length }} คำอวยพร</div>
        </div>

        <!-- Wish feed -->
        <div class="flex flex-col gap-2 mb-4">
          <div v-if="!selectedPerson.wishes.length"
               class="text-center py-5 text-[13px] text-[rgba(200,170,255,0.6)]">
            ยังไม่มีคำอวยพรค่ะ เป็นคนแรกได้เลย! 🎉
          </div>
          <div
            v-for="(w, i) in selectedPerson.wishes"
            :key="i"
            class="bg-white/5 border border-[rgba(168,85,247,0.2)] rounded-xl p-3"
          >
            <div class="flex items-center gap-2 mb-1.5">
              <div class="wi-av" :style="{ background: bday.getSenderAvatar(w.avIdx).bg }">
                {{ bday.getSenderAvatar(w.avIdx).av }}
              </div>
              <div class="text-[12px] font-extrabold text-[rgba(200,170,255,0.9)] flex-1">{{ w.from }}</div>
              <div class="text-[10px] text-[rgba(200,170,255,0.5)]">{{ w.time }}</div>
            </div>
            <div class="text-[12px] text-[rgba(220,200,255,0.8)] leading-relaxed">{{ w.msg }}</div>
          </div>
        </div>

        <!-- Send wish form -->
        <div class="bg-white/4 border border-[rgba(168,85,247,0.2)] rounded-[18px] p-4">
          <div class="text-[12px] font-bold text-[rgba(200,170,255,0.8)] mb-2">
            ✉️ ส่งคำอวยพรถึง {{ selectedPerson.name }}
          </div>
          <div class="flex flex-wrap gap-1.5 mb-2.5">
            <button
              v-for="chip in wishChips"
              :key="chip"
              class="px-3 py-1.5 rounded-full text-[11px] font-bold border-2 transition-all duration-150 cursor-pointer"
              :class="selectedChip === chip
                ? 'border-purple text-purple bg-purple/10'
                : 'border-[rgba(168,85,247,0.3)] text-[rgba(200,170,255,0.8)] bg-transparent'"
              @click="selectedChip = chip; wishMsg = chip"
            >{{ chip }}</button>
          </div>
          <textarea
            v-model="wishMsg"
            placeholder="หรือพิมพ์ข้อความเอง..."
            rows="2"
            maxlength="500"
            class="w-full border-[1.5px] border-[rgba(168,85,247,0.25)] rounded-xl px-3 py-2.5
                   text-[13px] text-[rgba(220,200,255,0.9)] bg-white/5 resize-none outline-none mb-2"
          ></textarea>
          <button
            class="w-full py-3 bg-[linear-gradient(135deg,#A855F7,#7C3AED)] border-none rounded-md
                   text-white text-[13px] font-extrabold cursor-pointer"
            @click="sendWish"
          >ส่งคำอวยพร 🎊</button>
        </div>
      </template>

      <!-- Employee grid -->
      <template v-else>
        <div class="text-[13px] font-bold text-[rgba(200,170,255,0.7)] mb-3">
          🎂 พนักงานเดือน {{ monthName(selectedMonth) }}
        </div>
        <div v-if="currentMonthEmps.length === 0"
             class="text-center py-8 text-[rgba(200,170,255,0.5)] text-[13px]">
          ไม่มีพนักงานเกิดเดือนนี้ค่ะ 🙁
        </div>
        <div v-else class="grid grid-cols-3 gap-3">
          <div
            v-for="emp in currentMonthEmps"
            :key="emp.key"
            class="bg-white/4 border border-[rgba(168,85,247,0.2)] rounded-xl p-3 text-center cursor-pointer"
            @click="selectedPerson = emp"
          >
            <div class="w-[68px] h-[68px] rounded-full mx-auto mb-2 overflow-hidden">
              <img v-if="emp.photo" :src="emp.photo" class="w-full h-full object-cover" />
              <div
                v-else
                class="w-full h-full flex items-center justify-center text-[32px]"
                :style="{ background: bday.getFallbackBg(emp.fallbackIdx) }"
              >{{ bday.getFallbackEmoji(emp.fallbackIdx) }}</div>
            </div>
            <div class="text-[11px] font-extrabold text-[rgba(220,200,255,0.9)] truncate">{{ emp.name }}</div>
            <div class="text-[9px] text-[rgba(200,170,255,0.7)] mt-0.5">🎂 {{ emp.date }}</div>
            <div class="text-[10px] text-pink mt-0.5">❤️ {{ emp.wishes.length }}</div>
          </div>
        </div>
      </template>
    </div>

    <!-- Surprise Box Tab -->
    <div v-else class="px-4 pb-8 text-center pt-8">
      <div class="text-[64px] mb-4" style="animation:prizePopIn 0.6s cubic-bezier(0.34,1.56,0.64,1);">🎁</div>
      <div class="text-[18px] font-black text-[#FFD700] mb-2">Surprise Box</div>
      <div class="text-[13px] text-[rgba(200,170,255,0.7)] leading-relaxed">
        กิจกรรมเซอร์ไพรส์สุดพิเศษ<br>สำหรับพนักงานในเดือนเกิด ✨
      </div>
      <div class="flex gap-2.5 justify-center mt-5">
        <div
          v-for="p in prizes"
          :key="p.icon"
          class="flex-1 bg-white/5 border border-[rgba(168,85,247,0.2)] rounded-xl p-3"
        >
          <div class="text-[32px] mb-1">{{ p.icon }}</div>
          <div class="text-[11px] font-extrabold text-white/80">{{ p.name }}</div>
          <div class="text-[10px] text-white/50 mt-0.5">{{ p.sub }}</div>
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
const selectedMonth = ref(new Date().getMonth() + 1)
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
  bday.sendWish(selectedPerson.value.key, wishMsg.value.trim(), ui.currentUser.name, 0)
  wishMsg.value = ''
  selectedChip.value = null
}

const prizes = [
  { icon:'🎂', name:'Birthday Cake', sub:'เค้กวันเกิดสุดพิเศษ' },
  { icon:'🎁', name:'Gift Voucher',  sub:'คูปองของขวัญ' },
  { icon:'🌸', name:'Day Off',       sub:'วันหยุดพิเศษ 1 วัน' },
]

onMounted(() => bday.loadMonth(selectedMonth.value - 1))
</script>
