<template>
  <div class="tab-page star-page">

    <!-- Header -->
    <div class="text-center fade-in">
      <div class="text-[48px] mb-2" style="filter:drop-shadow(0 0 16px rgba(255,200,0,0.5));">⭐</div>
      <div class="text-[22px] font-black bg-[linear-gradient(90deg,#FFF5C0,#FFD700,#F5C518,#FFE566)]
                  bg-clip-text text-transparent tracking-widest">Star Gang</div>
      <div class="text-[11px] text-app-light mt-1">พนักงานดาวเด่นประจำเดือน March 2026 🏆</div>
    </div>

    <!-- Join Star Gang Banner -->
    <div class="rounded-[20px] p-5 relative overflow-hidden"
         style="background:linear-gradient(135deg,#1A1200 0%,#3D2800 40%,#7A4F00 65%,#3D2800 85%,#1A1200 100%);">
      <div class="relative z-10 text-center">
        <div class="text-[15px] font-black tracking-[2px] mb-1
                    bg-[linear-gradient(90deg,#FFF5C0,#FFD700,#F5C518,#FFE566)]
                    bg-clip-text text-transparent">✦ JOIN STAR GANG ✦</div>
        <div class="text-[11px] text-[rgba(255,210,60,0.75)] mb-3 leading-relaxed">
          พร้อมเป็นส่วนหนึ่งของทีมแล้วหรือยัง? ✨
        </div>
        <div class="inline-flex items-center gap-1.5 bg-white/10 rounded-[20px] px-4 py-1.5 mb-3">
          <span class="text-[11px] text-[rgba(255,210,60,0.9)] font-bold">สมาชิกแล้ว</span>
          <span class="text-[14px] font-black text-[#FFD700]">{{ team.joinCount }}</span>
          <span class="text-[11px] text-[rgba(255,210,60,0.9)] font-bold">/ 30 คน</span>
        </div>
        <!-- Progress bar -->
        <div class="w-full bg-white/15 rounded-full h-1.5 mb-4 overflow-hidden">
          <div
            class="h-full rounded-full bg-[linear-gradient(90deg,#FFE566,#F5C518)] transition-all duration-500"
            :style="{ width: Math.min(100,(team.joinCount/30)*100) + '%' }"
          ></div>
        </div>
        <button
          class="w-full py-3 border-none rounded-md text-[14px] font-black tracking-wide transition-opacity"
          :class="joined
            ? 'bg-white/20 text-[rgba(255,210,60,0.8)] cursor-default'
            : 'bg-[linear-gradient(135deg,#F5C518,#C8860A)] text-[#1A1200] cursor-pointer'"
          :disabled="joined || joining"
          @click="handleJoin"
        >
          <span v-if="joining">⏳ กำลังเข้าร่วม...</span>
          <span v-else-if="joined">✓ เป็นสมาชิก Star Gang แล้ว</span>
          <span v-else>✦ JOIN TEAM ✦</span>
        </button>
      </div>
    </div>

    <!-- Star Grid -->
    <div v-if="team.isLoading" class="text-center py-8 text-[13px]" style="color:#9CA3AF;">กำลังโหลด...</div>
    <div v-else-if="team.sgMembers.length === 0" class="text-center py-8 text-[13px]" style="color:#9CA3AF;">
      ยังไม่มีสมาชิก Star Gang
    </div>
    <div v-else class="star-grid fade-in">
      <div
        v-for="(s, idx) in team.sgMembers"
        :key="s.id || s.name"
        class="star-card ripple-host"
        @click="openProfile(s, idx)"
      >
        <div class="star-av" :style="{ background: team.getGrad(idx), overflow: 'hidden' }">
          <img v-if="s.imgUrl" :src="s.imgUrl" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" @error="e => e.target.style.display='none'" />
          <span v-else>{{ EMOJIS[idx % EMOJIS.length] }}</span>
        </div>
        <div class="star-name">{{ s.name }}</div>
        <div class="star-role">{{ s.starGangRole || s.role }}</div>
        <div v-if="s.starGangSlogan" class="text-[10px] text-[rgba(255,210,60,0.65)] mt-0.5 leading-tight px-1 text-center italic">"{{ s.starGangSlogan }}"</div>
        <div v-if="s.pts" class="star-pts">⭐ {{ s.pts }} pts</div>
      </div>
    </div>

    <!-- ── Star Gang Profile Card ── -->
    <Transition name="sg-profile">
      <div v-if="profileMember" class="sg-overlay" @click.self="profileMember = null">
        <div class="sg-card">
          <!-- Close btn -->
          <button class="sg-close-x" @click="profileMember = null">✕</button>

          <!-- Top strip: gold gradient -->
          <div class="sg-card-top">
            <div class="sg-sparkle sg-sparkle-l">✦</div>
            <div class="sg-sparkle sg-sparkle-r">✦</div>
            <div class="sg-label-strip">⭐ STAR GANG MEMBER ⭐</div>
          </div>

          <!-- Avatar -->
          <div class="sg-card-av-wrap">
            <div class="sg-card-av" :style="{ background: profileGrad }">
              <img v-if="profileMember.imgUrl" :src="profileMember.imgUrl"
                   style="width:100%;height:100%;object-fit:cover;border-radius:50%;"
                   @error="e => e.target.style.display='none'" />
              <span v-else style="font-size:44px;">{{ EMOJIS[profileIdx % EMOJIS.length] }}</span>
            </div>
          </div>

          <!-- Info body -->
          <div class="sg-card-body">
            <div class="sg-card-name">{{ profileMember.name }}</div>
            <div class="sg-card-role">{{ profileMember.starGangRole || profileMember.role }}</div>

            <!-- Slogan box -->
            <div v-if="profileMember.starGangSlogan" class="sg-card-slogan-box">
              <span class="sg-quote-mark">"</span>
              <span class="sg-card-slogan-text">{{ profileMember.starGangSlogan }}</span>
              <span class="sg-quote-mark">"</span>
            </div>

            <!-- Points chip -->
            <div v-if="profileMember.pts" class="sg-card-pts">
              ⭐ {{ profileMember.pts }} pts
            </div>

            <!-- Divider line -->
            <div class="sg-card-divider"></div>
            <div class="sg-card-footer-label">DS Community Care · 2026</div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTeamStore } from '../stores/team.js'
import { useUiStore } from '../stores/ui.js'
import { useUserAuthStore } from '../stores/userAuth.js'
import { useFadeIn } from '../composables/useFadeIn.js'

const team = useTeamStore()
const ui = useUiStore()
const userAuth = useUserAuthStore()
useFadeIn()

const EMOJIS = ['🦁','🌸','🦊','🐬','🦋','🐯','⭐','🌟','🦄','😎','🐺','✨']

const joining       = ref(false)
const profileMember = ref(null)
const profileIdx    = ref(0)
const profileGrad   = ref('')

function openProfile(s, idx) {
  profileMember.value = s
  profileIdx.value    = idx
  profileGrad.value   = team.getGrad(idx)
}


const joined = computed(() => {
  const name = userAuth.userName
  if (!name) return false
  return team.sgMembers.some(m =>
    (m.name || '').trim().toLowerCase() === name.trim().toLowerCase()
  )
})

onMounted(() => team.loadStarGang())

async function handleJoin() {
  if (joined.value || joining.value) return
  if (!userAuth.userName) { ui.showToast('กรุณาเข้าสู่ระบบก่อน'); return }
  joining.value = true
  try {
    await team.joinStarGang({ id: userAuth.userId, name: userAuth.userName, role: userAuth.userRole })
    ui.showToast('ยินดีต้อนรับสู่ Star Gang! ⭐')
  } finally {
    joining.value = false
  }
}
</script>

<style scoped>
/* Overlay */
.sg-overlay {
  position: fixed; inset: 0; z-index: 9000;
  background: rgba(0,0,0,0.65);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  backdrop-filter: blur(6px);
}

/* Card */
.sg-card {
  position: relative;
  width: 100%; max-width: 340px;
  border-radius: 28px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 28px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,200,0,0.15);
}

/* Close X */
.sg-close-x {
  position: absolute; top: 12px; right: 14px; z-index: 10;
  background: rgba(255,255,255,0.15); border: none;
  color: rgba(255,220,80,0.8); font-size: 14px; font-weight: 700;
  width: 28px; height: 28px; border-radius: 50%; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  line-height: 1;
}
.sg-close-x:active { background: rgba(255,255,255,0.25); }

/* Gold top strip */
.sg-card-top {
  background: linear-gradient(135deg,#1A1200 0%,#3D2800 35%,#7A4F00 58%,#3D2800 80%,#1A1200 100%);
  padding: 16px 20px 48px;
  text-align: center;
  position: relative;
}
.sg-label-strip {
  font-size: 10px; font-weight: 800; letter-spacing: 3px;
  color: rgba(255,210,60,0.7);
  text-transform: uppercase;
}
.sg-sparkle { position: absolute; top: 18px; font-size: 10px; color: rgba(255,210,60,0.25); }
.sg-sparkle-l { left: 18px; }
.sg-sparkle-r { right: 18px; }

/* Avatar — overlapping strip and body */
.sg-card-av-wrap {
  display: flex; justify-content: center;
  margin-top: -44px;
  margin-bottom: 14px;
  position: relative; z-index: 2;
}
.sg-card-av {
  width: 88px; height: 88px; border-radius: 50%;
  border: 4px solid #fff;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
  box-shadow: 0 0 0 3px rgba(255,200,0,0.4), 0 8px 24px rgba(0,0,0,0.25);
}

/* Info body */
.sg-card-body {
  padding: 0 24px 24px;
  text-align: center;
}
.sg-card-name {
  font-size: 22px; font-weight: 900; color: #111827;
  margin-bottom: 4px; letter-spacing: 0.5px;
}
.sg-card-role {
  font-size: 12px; font-weight: 700; color: #C8860A;
  margin-bottom: 14px; letter-spacing: 0.5px;
}

/* Slogan */
.sg-card-slogan-box {
  background: linear-gradient(135deg,#FFFBEB,#FEF3C7);
  border: 1px solid rgba(245,197,24,0.35);
  border-radius: 16px; padding: 10px 16px;
  margin-bottom: 14px;
  display: flex; align-items: flex-start; gap: 4px;
}
.sg-quote-mark { font-size: 18px; color: #F5C518; font-weight: 900; line-height: 1.2; flex-shrink: 0; }
.sg-card-slogan-text { font-size: 12px; color: #92400E; font-style: italic; line-height: 1.6; text-align: left; }

/* Points */
.sg-card-pts {
  display: inline-flex; align-items: center; gap: 4px;
  background: linear-gradient(135deg,#FEF3C7,#FDE68A);
  border: 1px solid rgba(245,197,24,0.4);
  border-radius: 20px; padding: 5px 14px;
  font-size: 12px; font-weight: 800; color: #92400E;
  margin-bottom: 16px;
}

/* Divider + footer */
.sg-card-divider {
  height: 1px; background: linear-gradient(90deg,transparent,#E5E7EB,transparent);
  margin-bottom: 10px;
}
.sg-card-footer-label {
  font-size: 9.5px; color: #D1D5DB; font-weight: 600;
  letter-spacing: 1.5px; text-transform: uppercase;
}

/* Transition */
.sg-profile-enter-active { transition: opacity 0.2s ease, transform 0.3s cubic-bezier(0.34,1.3,0.64,1); }
.sg-profile-leave-active { transition: opacity 0.15s ease, transform 0.2s ease; }
.sg-profile-enter-from, .sg-profile-leave-to { opacity: 0; }
.sg-profile-enter-from .sg-card { transform: scale(0.88) translateY(16px); }
.sg-profile-leave-to .sg-card   { transform: scale(0.94) translateY(8px); }
</style>
