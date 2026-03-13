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
                <img v-if="emp.photo" :src="emp.photo" style="width:100%;height:100%;object-fit:cover;" @error="(e) => e.target.style.display='none'" />
                <div
                  v-else
                  class="photo-circle-fallback"
                  :style="{ background: bday.getFallbackBg(emp.fallbackIdx) }"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" style="width:55%;height:55%;fill:rgba(255,255,255,0.8);" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
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
              <img v-if="selectedPerson.photo" :src="selectedPerson.photo" style="width:100%;height:100%;object-fit:cover;" @error="(e) => e.target.style.display='none'" />
              <div
                v-else
                class="photo-circle-fallback"
                style="background:rgba(255,255,255,0.2);"
              >
                <svg xmlns="http://www.w3.org/2000/svg" style="width:55%;height:55%;fill:rgba(255,255,255,0.85);" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
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
        <div v-if="surpriseState === 'eligible'" class="eligible-arena">
          <!-- Birthday card illustration -->
          <div class="rounded-3xl overflow-hidden mb-4" style="background:rgba(255,255,255,0.72);border:1.5px solid rgba(251,191,36,0.35);backdrop-filter:blur(4px);">
            <div class="text-center py-5 px-4">
              <div class="text-[14px] font-black" style="color:#9D174D;">🎂 Happy Birthday! 🎂</div>
              <div class="text-[36px] my-2">🎉 🎊 🎈</div>
              <div class="text-[12px] font-bold" style="color:#BE185D;">เปิดกล่องของขวัญเพื่อลุ้นรางวัลสุดพิเศษ!</div>
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

          <!-- Screen flash on open -->
          <div class="screen-flash" :class="{ active: flashScreen }"></div>

          <!-- Open instruction -->
          <div class="text-center" style="margin-bottom:6px;">
            <div style="display:inline-block;background:linear-gradient(135deg,#FFF3F0,#FFE8E3);border:1.5px solid #FDBA9D;border-radius:20px;padding:5px 18px;font-size:12px;font-weight:700;color:#C2410C;">
              🎁 แตะกล่องเพื่อลุ้นรางวัล!
            </div>
          </div>

          <!-- Gift Box block -->
          <div style="border:2.5px dashed rgba(234,179,8,0.7);border-radius:24px;padding:16px 12px 10px;background:rgba(255,255,255,0.35);backdrop-filter:blur(2px);margin:0 4px;">
          <div
            class="gift-anim-wrap gift-block"
            :class="{ 'is-bouncing': !lidLifting && !boxOpened && !isShaking, 'is-shaking': isShaking }"
            @click="openBox"
          >
            <svg
              viewBox="0 0 160 170"
              style="display:block;width:100%;max-width:240px;margin:0 auto;overflow:visible;transition:transform 0.5s cubic-bezier(0.4,0,0.2,1),opacity 0.5s;"
              :style="boxOpened ? 'transform:scale(0.05);opacity:0;' : ''"
            >
                <defs>
                  <linearGradient id="sBodyF" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stop-color="#FF6840"/>
                    <stop offset="100%" stop-color="#EE4D2D"/>
                  </linearGradient>
                  <linearGradient id="sBodyR" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"   stop-color="#D94126"/>
                    <stop offset="100%" stop-color="#B83320"/>
                  </linearGradient>
                  <linearGradient id="sLidF" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stop-color="#FF7D52"/>
                    <stop offset="100%" stop-color="#F26144"/>
                  </linearGradient>
                  <linearGradient id="sLidR" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"   stop-color="#E05035"/>
                    <stop offset="100%" stop-color="#C24028"/>
                  </linearGradient>
                  <linearGradient id="sLidTop" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%"   stop-color="#F47A5E"/>
                    <stop offset="100%" stop-color="#FF9575"/>
                  </linearGradient>
                </defs>

                <!-- Light rays (burst on open) -->
                <g class="ray-group" :class="{ 'ray-active': showRays }">
                  <line x1="64" y1="123" x2="64"  y2="15"  stroke="#FFE566" stroke-width="9" stroke-linecap="round" opacity="0.75"/>
                  <line x1="64" y1="123" x2="134" y2="53"  stroke="#FFCF5C" stroke-width="8" stroke-linecap="round" opacity="0.65"/>
                  <line x1="64" y1="123" x2="154" y2="123" stroke="#FFE566" stroke-width="9" stroke-linecap="round" opacity="0.75"/>
                  <line x1="64" y1="123" x2="134" y2="193" stroke="#FFCF5C" stroke-width="8" stroke-linecap="round" opacity="0.65"/>
                  <line x1="64" y1="123" x2="64"  y2="215" stroke="#FFE566" stroke-width="9" stroke-linecap="round" opacity="0.75"/>
                  <line x1="64" y1="123" x2="-6"  y2="193" stroke="#FFCF5C" stroke-width="8" stroke-linecap="round" opacity="0.65"/>
                  <line x1="64" y1="123" x2="-26" y2="123" stroke="#FFE566" stroke-width="9" stroke-linecap="round" opacity="0.75"/>
                  <line x1="64" y1="123" x2="-6"  y2="53"  stroke="#FFCF5C" stroke-width="8" stroke-linecap="round" opacity="0.65"/>
                </g>

                <!-- Ground shadow -->
                <ellipse cx="80" cy="163" rx="56" ry="6" fill="rgba(0,0,0,0.2)"/>

                <!-- Box body: front face -->
                <rect x="10" y="88" width="108" height="70" rx="5" fill="url(#sBodyF)"/>
                <rect x="10" y="88" width="52"  height="70" rx="5" fill="rgba(255,255,255,0.06)"/>
                <!-- Box body: right side face -->
                <polygon points="118,88 144,72 144,142 118,158" fill="url(#sBodyR)"/>
                <polygon points="118,88 144,72 144,94 118,102"  fill="rgba(255,255,255,0.06)"/>
                <!-- Bottom edge -->
                <rect x="10" y="153" width="108" height="5" rx="2" fill="rgba(0,0,0,0.12)"/>

                <!-- Ribbon: vertical on front body -->
                <rect x="57" y="88" width="22" height="70" fill="rgba(255,255,255,0.88)"/>
                <!-- Ribbon: horizontal on front body -->
                <rect x="10" y="113" width="108" height="18" fill="rgba(255,255,255,0.84)"/>
                <rect x="57" y="113" width="22"  height="18" fill="rgba(255,255,255,0.96)"/>
                <!-- Ribbon: horizontal on right side (perspective) -->
                <polygon points="118,113 144,99 144,115 118,129" fill="rgba(255,255,255,0.65)"/>

                <!-- Sparkles (appear on open) -->
                <g style="transition:opacity 0.25s 0.15s;" :style="lidLifting ? 'opacity:1' : 'opacity:0'">
                  <text x="2"   y="60" font-size="15">✨</text>
                  <text x="130" y="48" font-size="13">⭐</text>
                  <text x="138" y="82" font-size="12">✨</text>
                  <text x="0"   y="90" font-size="11">🌟</text>
                  <text x="58"  y="12" font-size="18">🎊</text>
                  <text x="108" y="24" font-size="13">💫</text>
                </g>
                <!-- Prize peek inside -->
                <g style="transition:opacity 0.4s 0.32s;" :style="lidLifting ? 'opacity:1' : 'opacity:0'">
                  <text x="38" y="105" font-size="22">🎉</text>
                  <text x="78" y="102" font-size="16">✨</text>
                </g>

                <!-- Lid group (flies up on open) -->
                <g
                  style="transition:transform 0.55s cubic-bezier(0.22,0.61,0.36,1),opacity 0.45s 0.05s;"
                  :style="lidLifting ? 'transform:translateY(-62px);opacity:0;' : 'transform:translateY(0);opacity:1;'"
                >
                  <!-- Lid: top surface -->
                  <polygon points="8,64 118,64 144,48 34,48" fill="url(#sLidTop)"/>
                  <polygon points="8,64 60,64 86,48 34,48"   fill="rgba(255,255,255,0.1)"/>
                  <!-- Lid: front face -->
                  <rect x="8" y="64" width="110" height="24" rx="5" fill="url(#sLidF)"/>
                  <rect x="8" y="64" width="55"  height="24" rx="5" fill="rgba(255,255,255,0.09)"/>
                  <!-- Lid: right face -->
                  <polygon points="118,64 144,48 144,72 118,88" fill="url(#sLidR)"/>
                  <!-- Lid: bottom edge -->
                  <rect x="8" y="82" width="110" height="6" rx="3" fill="rgba(0,0,0,0.12)"/>
                  <!-- Ribbon: vertical on lid front -->
                  <rect x="57" y="64" width="22" height="24" fill="rgba(255,255,255,0.88)"/>
                  <!-- Ribbon: vertical on lid top (perspective strip) -->
                  <polygon points="57,64 79,64 105,48 83,48" fill="rgba(255,255,255,0.72)"/>
                  <!-- Bow: left loop -->
                  <ellipse cx="62" cy="44" rx="22" ry="10" fill="white" opacity="0.96" transform="rotate(-22 62 44)"/>
                  <!-- Bow: right loop -->
                  <ellipse cx="92" cy="38" rx="22" ry="10" fill="white" opacity="0.96" transform="rotate(22 92 38)"/>
                  <!-- Bow: loop depth shadows -->
                  <ellipse cx="55" cy="41" rx="9" ry="4" fill="rgba(210,65,35,0.13)" transform="rotate(-22 55 41)"/>
                  <ellipse cx="99" cy="35" rx="9" ry="4" fill="rgba(210,65,35,0.13)" transform="rotate(22 99 35)"/>
                  <!-- Bow: center knot -->
                  <ellipse cx="77" cy="43" rx="12" ry="8" fill="white"/>
                  <ellipse cx="77" cy="42" rx="6"  ry="4" fill="#FBBF24"/>
                  <ellipse cx="76" cy="41" rx="3"  ry="2" fill="rgba(255,255,255,0.65)"/>
                </g>
              </svg>
          </div>
          </div>

          <div class="text-center mt-3" style="position:relative;z-index:1;">
            <span class="text-[10px] font-semibold" style="color:#92400E;">⏳ สิทธิ์ 1 ครั้งต่อเดือน ⏳</span>
          </div>

          <!-- Coin decorations (bg layer) -->
          <div class="bg-coin" style="top:6px;left:8px;font-size:28px;animation-delay:0s">🪙</div>
          <div class="bg-coin" style="top:10px;right:10px;font-size:22px;animation-delay:0.5s">🪙</div>
          <div class="bg-coin" style="top:36%;left:0px;font-size:20px;animation-delay:1s">🪙</div>
          <div class="bg-coin" style="top:36%;right:0px;font-size:20px;animation-delay:1.5s">🪙</div>
          <div class="bg-coin" style="top:62%;left:6px;font-size:24px;animation-delay:0.7s">🪙</div>
          <div class="bg-coin" style="top:62%;right:6px;font-size:22px;animation-delay:1.2s">🪙</div>
          <div class="bg-coin" style="bottom:44px;left:22%;font-size:15px;animation-delay:2s">🪙</div>
          <div class="bg-coin" style="bottom:44px;right:22%;font-size:13px;animation-delay:0.9s">🪙</div>
          <div class="bg-coin" style="top:18%;left:42%;font-size:12px;animation-delay:2.4s">🪙</div>
          <div class="bg-coin" style="top:52%;left:18%;font-size:11px;animation-delay:1.7s">🪙</div>
          <div class="bg-coin" style="top:52%;right:18%;font-size:11px;animation-delay:2.8s">🪙</div>
        </div>

        <!-- Prize reveal state -->
        <div v-if="surpriseState === 'reveal'" class="text-center py-4">
          <div class="text-[28px] mb-1" style="letter-spacing:6px;animation:floatY 1.5s ease-in-out infinite;">🎉 🎊 🎈</div>
          <div style="position:relative;display:inline-block;margin:12px 0;">
            <div class="prize-glow-aura"></div>
            <div style="position:relative;z-index:1;font-size:72px;animation:prizePopIn 0.6s cubic-bezier(0.34,1.56,0.64,1);filter:drop-shadow(0 6px 20px rgba(255,150,0,0.5));">
              {{ currentPrize.icon }}
            </div>
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
import { useConfetti } from '../../composables/useConfetti.js'

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
const boxOpened = ref(false)
const lidLifting = ref(false)
const isShaking = ref(false)
const tapCount = ref(0)
const showRays = ref(false)
const flashScreen = ref(false)
const currentPrize = ref(null)
const { launchConfetti } = useConfetti()

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
  const wishes = await bday.loadWishes(emp.key)
  // Set directly on selectedPerson in case store emp was replaced by background image fetch
  if (selectedPerson.value?.key === emp.key) {
    selectedPerson.value.wishes = wishes
  }
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

function openBox() {
  if (boxOpened.value || lidLifting.value || isShaking.value) return
  isShaking.value = true
  setTimeout(() => {
    isShaking.value = false
    showRays.value = true
    flashScreen.value = true
    setTimeout(() => { flashScreen.value = false }, 350)
    lidLifting.value = true
    setTimeout(() => {
      boxOpened.value = true
      const prize = PRIZES[Math.floor(Math.random() * PRIZES.length)]
      currentPrize.value = prize
      setTimeout(() => {
        surpriseState.value = 'reveal'
        launchConfetti({ count: 120, colors: ['#EE4D2D','#FF6840','#FFE566','#FBBF24','#FF3CAC','#44AAFF','#44DD88'] })
      }, 400)
    }, 650)
  }, 500)
}

function confirmPrize() {
  surpriseState.value = 'used'
}
</script>

<style scoped>

/* ── Golden arena ── */
.eligible-arena {
  position: relative;
  background: linear-gradient(160deg, #FFFBEB 0%, #FEF9C3 30%, #FEF08A 60%, #FCD34D 90%, #F59E0B 100%);
  border-radius: 20px;
  border: 2px solid rgba(234,179,8,0.45);
  padding: 12px 6px 6px;
  overflow: hidden;
}
/* push all direct-children content above the coin layer */
.eligible-arena > *:not(.bg-coin) {
  position: relative;
  z-index: 1;
}
.bg-coin {
  position: absolute;
  z-index: 0;
  opacity: 0.17;
  pointer-events: none;
  user-select: none;
  animation: coinFloat 3s ease-in-out infinite;
  filter: saturate(1.3);
}
@keyframes coinFloat {
  0%, 100% { transform: translateY(0) rotate(-8deg) scale(1); }
  50%       { transform: translateY(-12px) rotate(10deg) scale(1.06); }
}

/* ── Gift block ── */
.gift-block {
  display: block;
  width: 100%;
  cursor: pointer;
  padding: 10px 0 4px;
}

/* ── Bounce + glow ── */
@keyframes giftBounce {
  0%, 100% { transform: translateY(0) scaleX(1) scaleY(1); }
  40%       { transform: translateY(-12px) scaleX(0.96) scaleY(1.04); }
  55%       { transform: translateY(-14px) scaleX(0.95) scaleY(1.05); }
  70%       { transform: translateY(-2px) scaleX(1.02) scaleY(0.98); }
}
@keyframes giftGlow {
  0%, 100% { filter: drop-shadow(0 10px 22px rgba(238,77,45,0.4)); }
  50%       { filter: drop-shadow(0 16px 36px rgba(238,77,45,0.75)) drop-shadow(0 0 20px rgba(255,150,50,0.5)); }
}
.gift-anim-wrap.is-bouncing {
  animation: giftBounce 2s ease-in-out infinite;
}
.gift-anim-wrap.is-bouncing svg {
  animation: giftGlow 2s ease-in-out infinite;
}

/* ── Shake ── */
@keyframes giftShake {
  0%   { transform: rotate(0) scale(1); }
  12%  { transform: rotate(-11deg) scale(1.05) translateX(-3px); }
  28%  { transform: rotate(11deg)  scale(1.05) translateX(3px); }
  44%  { transform: rotate(-7deg)  scale(1.02) translateX(-2px); }
  60%  { transform: rotate(7deg)   scale(1.02) translateX(2px); }
  76%  { transform: rotate(-3deg); }
  90%  { transform: rotate(3deg); }
  100% { transform: rotate(0) scale(1); }
}
.gift-anim-wrap.is-shaking { animation: giftShake 0.5s ease-in-out; }

/* ── SVG light rays ── */
.ray-group { opacity: 0; }
.ray-group.ray-active { animation: rayBurst 0.8s ease-out forwards; }
@keyframes rayBurst {
  0%   { opacity: 0; }
  15%  { opacity: 1; }
  100% { opacity: 0; }
}

/* ── Screen flash ── */
.screen-flash {
  position: fixed;
  inset: 0;
  background: white;
  opacity: 0;
  pointer-events: none;
  z-index: 9999;
}
.screen-flash.active {
  animation: flashPop 0.4s ease-out forwards;
}
@keyframes flashPop {
  0%   { opacity: 0.65; }
  100% { opacity: 0; }
}

/* ── Prize glow aura ── */
.prize-glow-aura {
  position: absolute;
  inset: -24px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,200,50,0.55) 0%, transparent 70%);
  animation: prizeAuraPulse 1.2s ease-in-out infinite;
}
@keyframes prizeAuraPulse {
  0%, 100% { transform: scale(1);    opacity: 0.7; }
  50%       { transform: scale(1.18); opacity: 1;   }
}
</style>
