<template>
  <BaseModal modal-id="modal-bday">
    <!-- Header -->
    <div class="bg-[linear-gradient(160deg,#FF6BC8,#A855F7,#3B82F6)] px-5 pt-5 pb-4 rounded-t-2xl flex-shrink-0">
      <div class="modal-handle" style="background:rgba(255,255,255,0.4);"></div>
      <div class="text-center">
        <div class="text-[36px] mb-1">🎂</div>
        <div class="text-[20px] font-black text-white">Birthday Board</div>
        <div class="text-[11px] text-white/85 mt-1">อวยพรเพื่อนร่วมงานวันเกิด 🎉</div>
      </div>
      <div class="flex gap-2 justify-center mt-3">
        <button
          v-for="t in ['board','send']"
          :key="t"
          class="px-5 py-1.5 rounded-full text-[12px] font-bold border transition-all duration-150"
          :class="activeTab === t
            ? 'bg-white text-[#7C3AED]'
            : 'bg-white/20 text-white border-white/30'"
          @click="activeTab = t; selectedPerson = null"
        >{{ t === 'board' ? '🎊 Birthday Board' : '💌 ส่งคำอวยพร' }}</button>
      </div>
    </div>

    <div class="modal-body-scroll">
      <!-- Board tab -->
      <div v-if="activeTab === 'board'" class="p-4">
        <div class="flex gap-1.5 overflow-x-auto pb-3 scrollbar-hide">
          <button
            v-for="m in monthBtns"
            :key="m.idx"
            class="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold
                   border cursor-pointer transition-all duration-150 whitespace-nowrap"
            :class="selectedMonth === m.idx
              ? 'bg-pink text-white border-pink'
              : 'border-app-border text-app-mid bg-white'"
            @click="selectedMonth = m.idx"
          >{{ m.label }}</button>
        </div>
        <div v-if="currentEmps.length === 0" class="text-center py-6 text-app-light text-[13px]">
          ไม่มีพนักงานเกิดเดือนนี้ค่ะ 🙁
        </div>
        <div v-else class="grid grid-cols-3 gap-3">
          <div
            v-for="emp in currentEmps"
            :key="emp.key"
            class="rounded-xl p-2.5 text-center cursor-pointer border border-app-border bg-white hover:border-pink/40 transition-all duration-150"
            @click="selectedPerson = emp; activeTab = 'send'"
          >
            <div class="w-16 h-16 rounded-full mx-auto mb-2 overflow-hidden">
              <img v-if="emp.photo" :src="emp.photo" class="w-full h-full object-cover" />
              <div
                v-else
                class="w-full h-full flex items-center justify-center text-[28px]"
                :style="{ background: bday.getFallbackBg(emp.fallbackIdx) }"
              >{{ bday.getFallbackEmoji(emp.fallbackIdx) }}</div>
            </div>
            <div class="epc-name">{{ emp.name }}</div>
            <div class="epc-date">🎂 {{ emp.date }}</div>
            <div class="epc-wishes">❤️ {{ emp.wishes.length }}</div>
          </div>
        </div>
      </div>

      <!-- Send tab -->
      <div v-if="activeTab === 'send'" class="p-4">
        <!-- Select person -->
        <div v-if="!selectedPerson" class="mb-4">
          <div class="text-[12px] font-bold text-app-dark mb-2">เลือกพนักงาน</div>
          <div class="grid grid-cols-3 gap-2">
            <div
              v-for="emp in allBdayEmps"
              :key="emp.key"
              class="rounded-xl p-2 text-center cursor-pointer border-2 transition-all duration-150"
              :class="selectedPerson?.key === emp.key ? 'border-pink bg-pink/5' : 'border-app-border'"
              @click="selectedPerson = emp"
            >
              <div
                class="w-12 h-12 rounded-full mx-auto mb-1 flex items-center justify-center text-[22px]"
                :style="{ background: bday.getFallbackBg(emp.fallbackIdx) }"
              >{{ bday.getFallbackEmoji(emp.fallbackIdx) }}</div>
              <div class="text-[10px] font-bold text-app-dark truncate">{{ emp.name }}</div>
            </div>
          </div>
        </div>

        <template v-if="selectedPerson">
          <!-- Person banner -->
          <div class="flex items-center gap-3 p-3 bg-[linear-gradient(135deg,#FFF0FB,#FCE7F3)]
                      rounded-xl border border-pink/20 mb-4">
            <div
              class="w-12 h-12 rounded-full flex items-center justify-center text-[24px] flex-shrink-0"
              :style="{ background: bday.getFallbackBg(selectedPerson.fallbackIdx) }"
            >{{ bday.getFallbackEmoji(selectedPerson.fallbackIdx) }}</div>
            <div class="flex-1">
              <div class="text-[14px] font-black text-app-dark">{{ selectedPerson.name }}</div>
              <div class="text-[11px] text-app-light">🎂 {{ selectedPerson.date }}</div>
            </div>
            <button class="text-[20px] text-app-light cursor-pointer" @click="selectedPerson = null">✕</button>
          </div>

          <div class="flex flex-wrap gap-1.5 mb-3">
            <button
              v-for="chip in wishChips"
              :key="chip"
              class="wish-chip"
              :class="{ selected: selectedChip === chip }"
              @click="selectedChip = chip; wishMsg = chip"
            >{{ chip }}</button>
          </div>

          <textarea
            v-model="wishMsg"
            placeholder="หรือพิมพ์ข้อความเอง..."
            rows="3"
            maxlength="500"
            class="w-full rounded-xl border-[1.5px] border-app-border p-3
                   text-[13px] text-app-dark bg-app-bg resize-none outline-none mb-3"
          ></textarea>

          <button
            class="modal-close-btn mb-2"
            style="background:linear-gradient(135deg,#EC4899,#BE185D);"
            @click="sendWish"
          >ส่งคำอวยพร 💌</button>

          <div v-if="selectedPerson.wishes.length" class="mt-3">
            <div class="text-[11px] font-bold text-app-mid mb-2">❤️ คำอวยพรล่าสุด</div>
            <div v-for="(w, i) in selectedPerson.wishes.slice(0,3)" :key="i" class="wi-row">
              <div class="wi-av" :style="{ background: bday.getSenderAvatar(w.avIdx).bg }">
                {{ bday.getSenderAvatar(w.avIdx).av }}
              </div>
              <div class="wi-body">
                <div class="wi-name">{{ w.from }}</div>
                <div class="wi-msg">{{ w.msg }}</div>
                <div class="wi-time">{{ w.time }}</div>
              </div>
            </div>
          </div>
        </template>
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

const activeTab = ref('board')
const selectedMonth = ref(new Date().getMonth() + 1)
const selectedPerson = ref(null)
const wishMsg = ref('')
const selectedChip = ref(null)

const wishChips = ['สุขสันต์วันเกิดนะคะ 🎂','ขอให้มีความสุขมากๆ 🌟','Happy Birthday! 🎉','ขอให้โชคดีตลอดปี 🍀']

const monthBtns = [
  {idx:1,label:'ม.ค.'},{idx:2,label:'ก.พ.'},{idx:3,label:'มี.ค.'},
  {idx:4,label:'เม.ย.'},{idx:5,label:'พ.ค.'},{idx:6,label:'มิ.ย.'},
  {idx:7,label:'ก.ค.'},{idx:8,label:'ส.ค.'},{idx:9,label:'ก.ย.'},
  {idx:10,label:'ต.ค.'},{idx:11,label:'พ.ย.'},{idx:12,label:'ธ.ค.'},
]

const currentEmps = computed(() => bday.allEmployees[selectedMonth.value - 1] || [])
const allBdayEmps = computed(() => Object.values(bday.allEmployees).flat())

function sendWish() {
  if (!wishMsg.value.trim() || !selectedPerson.value) return
  bday.sendWish(selectedPerson.value.key, wishMsg.value.trim(), ui.currentUser.name, 0)
  ui.showToast('ส่งคำอวยพรแล้ว 🎉')
  wishMsg.value = ''
  selectedChip.value = null
}
</script>
