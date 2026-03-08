<template>
  <BaseModal modal-id="modal-bday" sheet-class="modal-sheet--bday">
    <!-- Festive illustrated header — ตรงกับ ds-community-care.html -->
    <div style="position:relative;overflow:hidden;flex-shrink:0;border-radius:28px 28px 0 0;background:linear-gradient(160deg,#FF6BC8 0%,#A855F7 45%,#3B82F6 100%);">
      <div class="modal-handle" style="background:rgba(255,255,255,0.45);margin:14px auto 0;position:relative;z-index:5;"></div>
      <svg viewBox="0 0 375 188" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block;margin-top:-4px;">
        <image href="/images/bday-header.jpg" width="375" height="188" preserveAspectRatio="xMidYMid slice"/>
        <rect width="375" height="188" fill="rgba(255,255,255,0.08)"/>
        <text x="187" y="162" text-anchor="middle" font-size="22" font-weight="800" fill="#1A1A2E" font-family="Sarabun,sans-serif" stroke="white" stroke-width="3" paint-order="stroke">🎂 Birthday Celebration 🎊</text>
        <text x="187" y="180" text-anchor="middle" font-size="12" fill="#3D1A78" font-family="Sarabun,sans-serif" stroke="rgba(255,255,255,0.8)" stroke-width="2" paint-order="stroke" letter-spacing="1">✨ ฉลองวันเกิดพนักงานรายเดือน ✨</text>
      </svg>
    </div>

    <div class="modal-body-scroll">
      <!-- Main tab buttons -->
      <div style="display:flex;background:#F3F4F6;border-radius:50px;padding:3px;margin:12px 16px 0;gap:3px;">
        <button
          class="bday-tab"
          :class="{ active: activeTab === 'board' }"
          @click="activeTab = 'board'"
        >🎊 Birthday Board</button>
        <button
          v-if="isMyBirthday"
          class="bday-tab"
          :class="{ active: activeTab === 'surprise' }"
          style="position:relative;"
          @click="activeTab = 'surprise'; resetSurpriseView()"
        >
          🎁 Surprise Box
          <span style="position:absolute;top:-4px;right:-2px;background:#FF4455;color:white;font-size:7px;font-weight:800;padding:1px 4px;border-radius:8px;line-height:1.5;">NEW</span>
        </button>
      </div>

      <!-- ── BIRTHDAY BOARD TAB ── -->
      <div v-if="activeTab === 'board'" class="px-4 pb-4">
        <!-- Month strip -->
        <div style="display:flex;gap:5px;overflow-x:auto;scrollbar-width:none;padding-bottom:6px;margin:12px 0 14px;">
          <button
            v-for="m in monthBtns"
            :key="m.idx"
            class="month-tab"
            :class="{ active: selectedMonth === m.idx }"
            @click="selectedMonth = m.idx; selectedPerson = null"
          >{{ m.label }}</button>
        </div>

        <!-- Grid view -->
        <template v-if="!selectedPerson">
          <div class="text-[12px] font-black text-app-mid mb-3">
            🎂 พนักงานเดือน {{ monthFullNames[selectedMonth - 1] }}
          </div>
          <div v-if="loading" class="text-center py-10 text-app-light">
            <div class="bday-spinner"></div>
            <div class="text-[12px] font-bold mt-3">กำลังโหลด...</div>
          </div>
          <div v-else-if="!loading && currentEmps.length === 0" class="text-center py-8 text-app-light">
            <div class="text-[40px] mb-2">🎈</div>
            <div class="text-[13px] font-bold">ไม่มีพนักงานเกิดเดือนนี้</div>
          </div>
          <div v-else class="grid grid-cols-2 gap-3">
            <div
              v-for="emp in currentEmps"
              :key="emp.key"
              class="emp-photo-card-bday"
              @click="openPerson(emp)"
            >
              <div class="photo-circle-wrap-sm">
                <img v-if="emp.photo" :src="emp.photo" style="width:100%;height:100%;object-fit:cover;" />
                <div
                  v-else
                  class="photo-circle-fallback"
                  style="font-size:30px;"
                  :style="{ background: bday.getFallbackBg(emp.fallbackIdx) }"
                >{{ bday.getFallbackEmoji(emp.fallbackIdx) }}</div>
              </div>
              <div class="epc-name">{{ emp.name }}</div>
              <div class="epc-date">🎂 {{ emp.date }}</div>
              <div class="epc-wishes">❤️ {{ emp.wishes.length }} คำอวยพร</div>
            </div>
          </div>
        </template>

        <!-- Person detail (inline) -->
        <template v-else>
          <!-- Back button -->
          <div class="flex items-center gap-2 mb-3 cursor-pointer" @click="selectedPerson = null; wishSent = false">
            <span class="text-[20px] text-app-mid">‹</span>
            <span class="text-[12px] font-bold" style="color:#6366F1;">กลับ</span>
          </div>

          <!-- Person banner -->
          <div class="bday-person-banner mb-4">
            <div class="bb-confetti">🎉🎊✨🎈🎁</div>
            <div class="photo-circle-wrap-sm" style="margin:0 auto 8px;border:3px solid rgba(255,255,255,0.6);box-shadow:0 4px 12px rgba(0,0,0,0.2);">
              <img v-if="selectedPerson.photo" :src="selectedPerson.photo" style="width:100%;height:100%;object-fit:cover;" />
              <div
                v-else
                class="photo-circle-fallback"
                style="font-size:30px;background:rgba(255,255,255,0.2);"
              >{{ bday.getFallbackEmoji(selectedPerson.fallbackIdx) }}</div>
            </div>
            <div class="bb-name">{{ selectedPerson.name }}</div>
            <div class="bb-role">{{ selectedPerson.role }} • {{ selectedPerson.date }}</div>
            <div class="bb-wish-count">❤️ {{ selectedPerson.wishes.length }} คำอวยพร</div>
          </div>

          <!-- Divider -->
          <div style="display:flex;align-items:center;gap:6px;margin:14px 0 10px;">
            <div style="flex:1;height:1px;background:#E5E7EB;"></div>
            <div class="text-[11px] font-black text-app-mid whitespace-nowrap">💌 คำอวยพรจากเพื่อนๆ</div>
            <div style="flex:1;height:1px;background:#E5E7EB;"></div>
          </div>

          <!-- Wish feed -->
          <div style="display:flex;flex-direction:column;gap:8px;max-height:180px;overflow-y:auto;scrollbar-width:thin;margin-bottom:14px;">
            <div v-if="!selectedPerson.wishes.length" class="text-center py-5 text-app-light text-[13px]">
              ยังไม่มีคำอวยพรค่ะ<br>เป็นคนแรกที่อวยพรได้เลย! 🎉
            </div>
            <div
              v-for="(w, i) in selectedPerson.wishes"
              :key="i"
              class="wish-item"
              :class="{ 'wi-new': i === 0 && justSent }"
            >
              <div class="wi-header-row">
                <div class="wi-av" :style="{ background: bday.getSenderAvatar(w.avIdx).bg }">
                  {{ bday.getSenderAvatar(w.avIdx).av }}
                </div>
                <div class="wi-name">{{ w.from }}</div>
                <div class="wi-time">{{ w.time }}</div>
              </div>
              <div class="wi-msg">{{ w.msg }}</div>
            </div>
          </div>

          <!-- Wish composer -->
          <template v-if="!wishSent">
            <div class="text-[12px] font-black text-app-mid mb-2">
              ✍️ ส่งคำอวยพรให้ <span style="color:#6366F1;">{{ selectedPerson.name }}</span>
            </div>

            <!-- Quick wish chips -->
            <div class="flex flex-wrap gap-1.5 mb-2">
              <span
                v-for="chip in wishChips"
                :key="chip"
                class="wish-chip"
                :class="{ active: selectedChip === chip }"
                @click="selectedChip = chip; wishMsg = chip"
              >{{ chip }}</span>
            </div>

            <!-- Emoji picker -->
            <div class="flex gap-1.5 items-center mb-2">
              <span class="text-[11px] font-bold text-app-light">Emoji:</span>
              <span v-for="e in emojiPicker" :key="e" class="emo-pick" @click="wishMsg += e">{{ e }}</span>
            </div>

            <textarea
              v-model="wishMsg"
              placeholder="พิมพ์คำอวยพรของคุณที่นี่..."
              rows="3"
              maxlength="500"
              class="w-full rounded-xl p-3 text-[13px] text-app-dark bg-app-bg resize-none outline-none mb-2"
              :style="wishError ? 'border:1.5px solid #F43F5E;' : 'border:1.5px solid #E5E7EB;'"
            ></textarea>

            <button class="modal-close-btn" @click="sendWish">ส่งคำอวยพร 🎉</button>
          </template>

          <!-- Success state -->
          <div v-else class="text-center py-4">
            <div class="text-[48px] mb-2" style="display:inline-block;animation:bounce-click 0.5s ease;">🎊</div>
            <div class="text-[15px] font-black text-app-dark mb-1">ส่งคำอวยพรสำเร็จ! 🎉</div>
            <div class="text-[12px] text-app-light leading-relaxed" v-html="successMsg"></div>
            <button
              class="mt-3 text-[13px] font-bold cursor-pointer"
              style="background:none;border:none;color:#6366F1;"
              @click="wishSent = false; wishMsg = ''; selectedChip = null; justSent = false"
            >อวยพรอีกครั้ง ✍️</button>
          </div>
        </template>
      </div>

      <!-- ── SURPRISE BOX TAB ── -->
      <div v-if="activeTab === 'surprise' && isMyBirthday" class="px-4 pb-4 pt-3">
        <!-- Eligible state -->
        <div v-if="surpriseState === 'eligible'">
          <!-- Birthday card illustration -->
          <div class="rounded-3xl overflow-hidden mb-4" style="background:linear-gradient(135deg,#FFF0FB,#FCE7F3);border:1.5px solid #FBCFE8;">
            <div class="text-center py-5 px-4">
              <div class="text-[14px] font-black" style="color:#9D174D;">🎂 Happy Birthday! 🎂</div>
              <div class="text-[36px] my-2">🎉 🎊 🎈</div>
              <div class="text-[12px] font-bold" style="color:#BE185D;">ทุบไข่ทองเพื่อลุ้นรางวัลสุดพิเศษ!</div>
            </div>
          </div>

          <!-- Prize hints header -->
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;">
            <div style="flex:1;height:1px;background:#E5E7EB;"></div>
            <div class="text-[11px] font-black text-app-mid whitespace-nowrap">🎰 รางวัลที่อาจซ่อนอยู่ข้างใน</div>
            <div style="flex:1;height:1px;background:#E5E7EB;"></div>
          </div>

          <!-- Prize hint cards -->
          <div class="flex gap-2 mb-5">
            <div class="prize-hint">
              <div class="text-[22px]">🏠</div>
              <div class="ph-name">WFH พิเศษ</div>
              <div class="ph-sub">1 วัน</div>
            </div>
            <div class="prize-hint">
              <div class="text-[22px]">🎨</div>
              <div class="ph-name">สติ๊กเกอร์ LINE</div>
              <div class="ph-sub">Exclusive Pack</div>
            </div>
            <div class="prize-hint">
              <div class="text-[22px]">⭐</div>
              <div class="ph-name">แต้มสะสม</div>
              <div class="ph-sub">+50 ~ +500 pts</div>
            </div>
          </div>

          <!-- Smash instruction -->
          <div class="text-center mb-2">
            <div style="display:inline-block;background:linear-gradient(135deg,#FFF7ED,#FFFBEB);border:1.5px solid #FCD34D;border-radius:20px;padding:5px 16px;font-size:11px;font-weight:700;color:#92400E;margin-bottom:14px;">
              🔨 กดฆ้อนเพื่อทุบไข่และลุ้นรางวัล!
            </div>

            <!-- Egg + Hammer -->
            <div style="position:relative;width:160px;margin:0 auto;">
              <svg
                width="120" height="140" viewBox="0 0 120 140"
                style="display:block;margin:0 auto;filter:drop-shadow(0 8px 20px rgba(255,150,0,0.4));transition:transform 0.3s,opacity 0.3s;cursor:pointer;"
                :style="eggSmashed ? 'transform:scale(0);opacity:0;' : ''"
                @click="smashEgg"
              >
                <defs>
                  <radialGradient id="eggGrad2" cx="38%" cy="35%" r="60%">
                    <stop offset="0%" stop-color="#FFFDE7"/>
                    <stop offset="50%" stop-color="#FFD54F"/>
                    <stop offset="100%" stop-color="#FF8F00"/>
                  </radialGradient>
                  <radialGradient id="eggShine2" cx="35%" cy="28%" r="30%">
                    <stop offset="0%" stop-color="rgba(255,255,255,0.7)"/>
                    <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
                  </radialGradient>
                </defs>
                <ellipse cx="60" cy="78" rx="48" ry="58" fill="url(#eggGrad2)"/>
                <ellipse cx="60" cy="78" rx="48" ry="58" fill="url(#eggShine2)"/>
                <!-- Cracks -->
                <g :style="eggCracked ? 'opacity:1;transition:opacity 0.3s;' : 'opacity:0;'">
                  <path d="M55,45 L48,55 L58,60 L50,72" stroke="#B45309" stroke-width="2.5" fill="none" stroke-linecap="round"/>
                  <path d="M65,50 L72,58 L62,65 L68,78" stroke="#B45309" stroke-width="2" fill="none" stroke-linecap="round"/>
                  <path d="M40,80 L50,75 L45,90" stroke="#B45309" stroke-width="2" fill="none" stroke-linecap="round"/>
                </g>
                <text x="38" y="90" font-size="14" opacity="0.6">✨</text>
                <text x="62" y="75" font-size="10" opacity="0.5">⭐</text>
                <text x="52" y="110" font-size="12" opacity="0.5">🌟</text>
              </svg>

              <!-- Hammer -->
              <div
                class="sb-hammer"
                :class="{ smashing: hammerSwing }"
                :style="eggSmashed ? 'display:none;' : ''"
                @click="smashEgg"
              >🔨</div>
            </div>
          </div>

          <div class="text-center mt-3">
            <span class="text-[10px] text-app-light font-semibold">⏳ สิทธิ์ 1 ครั้งต่อเดือน ⏳</span>
          </div>
        </div>

        <!-- Prize reveal state -->
        <div v-if="surpriseState === 'reveal'" class="text-center py-4">
          <div class="text-[28px] mb-1" style="letter-spacing:6px;animation:floatY 1.5s ease-in-out infinite;">🎉 🎊 🎈</div>
          <div class="text-[72px] my-3" style="animation:prizePopIn 0.6s cubic-bezier(0.34,1.56,0.64,1);filter:drop-shadow(0 6px 16px rgba(255,150,0,0.35));">
            {{ currentPrize.icon }}
          </div>
          <div class="text-[20px] font-black mb-1" :style="{ color: currentPrize.color }">{{ currentPrize.name }}</div>
          <div class="text-[13px] text-app-mid mb-5 leading-relaxed">{{ currentPrize.desc }}</div>
          <div style="background:linear-gradient(135deg,#FFF7ED,#FFFBEB);border:2px solid #FCD34D;border-radius:18px;padding:14px 16px;margin-bottom:18px;position:relative;overflow:hidden;">
            <div style="position:absolute;top:-8px;right:-8px;font-size:40px;opacity:0.12;">🎁</div>
            <div class="text-[13px] font-black mb-1" style="color:#92400E;">🎉 ยินดีด้วยค่ะ!</div>
            <div class="text-[11px] font-semibold" style="color:#B45309;">รางวัลจะถูกส่งให้ภายใน 3 วันทำการ</div>
          </div>
          <button class="modal-close-btn" style="background:linear-gradient(135deg,#F59E0B,#D97706);" @click="confirmPrize">รับรางวัล 🎊</button>
        </div>

        <!-- Already used state -->
        <div v-if="surpriseState === 'used'" class="text-center py-8 px-4">
          <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#D1FAE5,#A7F3D0);display:flex;align-items:center;justify-content:center;font-size:40px;margin:0 auto 16px;box-shadow:0 4px 16px rgba(16,185,129,0.2);">✅</div>
          <div class="text-[16px] font-black text-app-dark mb-2">ใช้สิทธิ์แล้วค่ะ</div>
          <div class="text-[12px] text-app-mid leading-relaxed">
            พบกันใหม่เดือนหน้านะคะ 💫<br>
            <span class="text-[11px] text-app-light">ขอบคุณที่ร่วมสนุกกับเรา 🎉</span>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import BaseModal from '../shared/BaseModal.vue'
import { useBirthdayStore } from '../../stores/birthday.js'
import { useUiStore } from '../../stores/ui.js'

const bday = useBirthdayStore()
const ui = useUiStore()

const currentMonth = new Date().getMonth() + 1

// Surprise Box only available to the user whose birthday is this month
const isMyBirthday = computed(() => {
  const myName = (ui.currentUser?.name || '').trim().toLowerCase()
  if (!myName) return false
  const emps = bday.allEmployees[currentMonth - 1] || []
  return emps.some(e => e.name.trim().toLowerCase() === myName)
})

// Tab & navigation
const activeTab = ref('board')
const selectedMonth = ref(currentMonth)
const selectedPerson = ref(null)

// Wish composer
const wishMsg = ref('')
const selectedChip = ref(null)
const wishSent = ref(false)
const wishError = ref(false)
const justSent = ref(false)
const successMsg = ref('')

// Surprise box
const surpriseState = ref('eligible') // 'eligible' | 'reveal' | 'used'
const eggSmashed = ref(false)
const eggCracked = ref(false)
const hammerSwing = ref(false)
const currentPrize = ref(null)

const PRIZES = [
  { icon: '🏠', name: 'WFH พิเศษ 1 วัน', desc: 'Work From Home ได้ 1 วัน เลือกวันได้เองภายใน 30 วัน', color: '#F59E0B' },
  { icon: '🎨', name: 'สติ๊กเกอร์ LINE Exclusive', desc: 'DS Community Care Edition พิเศษสำหรับพนักงานเท่านั้น!', color: '#6366F1' },
  { icon: '⭐', name: 'แต้มสะสม +200 pts', desc: 'แต้มจะถูกเพิ่มในแอปภายใน 24 ชั่วโมง', color: '#10B981' },
  { icon: '🌟', name: 'แต้มสะสม +500 pts 🎰', desc: 'แจ็คพ็อต!! แต้มพิเศษจะถูกเพิ่มในแอปภายใน 24 ชั่วโมง', color: '#EC4899' },
  { icon: '🎁', name: 'สติ๊กเกอร์ + แต้ม 50 pts', desc: 'ได้ทั้งสติ๊กเกอร์ LINE และแต้มสะสมเลยค่ะ!', color: '#A855F7' },
]

const wishChips = ['🎉 สุขสันต์วันเกิดนะคะ!', '🌟 ขอให้โชคดีตลอดปีนะ!', '🎂 ขอให้มีความสุขมากๆ!', '💪 สุขภาพแข็งแรงนะ!']
const emojiPicker = ['🎉', '🎂', '🌸', '✨', '🥳', '💖']

const monthBtns = [
  { idx: 1,  label: 'ม.ค.'  }, { idx: 2,  label: 'ก.พ.'  }, { idx: 3,  label: 'มี.ค.' },
  { idx: 4,  label: 'เม.ย.' }, { idx: 5,  label: 'พ.ค.'  }, { idx: 6,  label: 'มิ.ย.' },
  { idx: 7,  label: 'ก.ค.'  }, { idx: 8,  label: 'ส.ค.'  }, { idx: 9,  label: 'ก.ย.'  },
  { idx: 10, label: 'ต.ค.'  }, { idx: 11, label: 'พ.ย.'  }, { idx: 12, label: 'ธ.ค.'  },
]
const monthFullNames = [
  'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม',
]

const currentEmps = computed(() => bday.allEmployees[selectedMonth.value - 1] || [])

// Local loading state — starts true, resolves after fetch
const loading = ref(true)

onMounted(async () => {
  await bday.loadMonth(selectedMonth.value - 1)
  loading.value = false
})

watch(selectedMonth, async (m) => {
  const idx = m - 1
  if (!bday.loadedMonths.has(idx)) loading.value = true
  await bday.loadMonth(idx)
  loading.value = false
})

async function openPerson(emp) {
  selectedPerson.value = emp
  wishSent.value = false
  wishMsg.value = ''
  selectedChip.value = null
  justSent.value = false
  await bday.loadWishes(emp.key)
}

function sendWish() {
  if (!wishMsg.value.trim()) {
    wishError.value = true
    setTimeout(() => wishError.value = false, 1000)
    return
  }
  const msg = wishMsg.value.trim()
  const name = ui.currentUser?.name || 'ทีมงาน'
  bday.sendWish(selectedPerson.value.key, msg, name, 0)
  successMsg.value = `ส่งถึง <strong>${selectedPerson.value.name}</strong> แล้วค่ะ 💌<br>"${msg}"`
  wishSent.value = true
  justSent.value = true
  selectedChip.value = null
}

function resetSurpriseView() {
  // Keep current state — don't reset if already used/revealed
}

function smashEgg() {
  if (eggSmashed.value) return
  hammerSwing.value = true
  setTimeout(() => { eggCracked.value = true }, 200)
  setTimeout(() => {
    eggSmashed.value = true
    const prize = PRIZES[Math.floor(Math.random() * PRIZES.length)]
    currentPrize.value = prize
    setTimeout(() => { surpriseState.value = 'reveal' }, 400)
  }, 700)
}

function confirmPrize() {
  surpriseState.value = 'used'
}
</script>
