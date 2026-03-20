<template>
  <BaseModal modal-id="modal-reward">
    <div class="rw-wrap flex-1 flex flex-col overflow-hidden">

      <!-- ── Header gradient ── -->
      <div class="rw-header">
        <!-- Decorative orbs -->
        <div class="rw-orb rw-orb-1"></div>
        <div class="rw-orb rw-orb-2"></div>

        <div class="modal-handle" style="background:rgba(255,255,255,0.4);"></div>

        <div class="rw-hero">
          <div class="rw-icon">🏆</div>
          <div class="rw-title">DS Reward</div>
          <div class="rw-sub">สะสมคะแนนแลกของรางวัล 🎁</div>
        </div>

        <!-- Points + Level card -->
        <div class="rw-pts-card">
          <div class="rw-pts-left">
            <div class="rw-pts-num">
              <span v-if="reward.loading" class="rw-skeleton-num"></span>
              <span v-else>{{ reward.total.toLocaleString() }}</span>
            </div>
            <div class="rw-pts-label">คะแนนสะสม</div>
          </div>
          <div class="rw-pts-divider"></div>
          <div class="rw-pts-right">
            <div class="rw-level-badge">{{ reward.levelName }}</div>
            <div class="rw-pts-label">ระดับปัจจุบัน</div>
          </div>
        </div>

        <!-- Progress bar -->
        <div v-if="reward.nextName" class="rw-progress-wrap">
          <div class="rw-progress-bar">
            <div class="rw-progress-fill" :style="{ width: reward.progress + '%' }"></div>
          </div>
          <div class="rw-progress-label">
            <span>{{ reward.total }} pts</span>
            <span>{{ reward.nextName }} ({{ reward.nextPts }} pts)</span>
          </div>
        </div>
        <div v-else class="rw-legend-label">🎉 คุณถึงระดับสูงสุดแล้ว!</div>
      </div>

      <!-- ── Body ── -->
      <div class="modal-body-scroll rw-body">

        <!-- ── Daily check-in card ── -->
        <div
          v-if="checkinRule"
          class="rw-checkin-card"
          :class="{ done: reward.checkedInToday }"
        >
          <div class="rw-ci-left">
            <div class="rw-ci-icon">{{ reward.checkedInToday ? '✅' : '📅' }}</div>
            <div class="rw-ci-info">
              <div class="rw-ci-title">Check-in รายวัน</div>
              <div class="rw-ci-date">{{ todayThai }}</div>
            </div>
          </div>
          <div class="rw-ci-right">
            <div v-if="reward.checkedInToday" class="rw-ci-done-badge">
              <span v-if="checkinDone">+{{ checkinPts }} pts รับแล้ว!</span>
              <span v-else>เช็คอินแล้ววันนี้</span>
            </div>
            <button
              v-else
              class="rw-ci-btn"
              :disabled="reward.checkinLoading"
              @click="handleCheckin"
            >
              <span v-if="reward.checkinLoading" class="rw-ci-spinner"></span>
              <span v-else>รับ +{{ reward.loading ? '…' : checkinPts }} pts</span>
            </button>
          </div>
        </div>
        <div v-if="checkinError" class="rw-checkin-error">⚠️ {{ checkinError }}</div>

        <!-- ── Tree growth card ── -->
        <div class="rw-tree-card">
          <div class="rw-tree-top-row">
            <span class="rw-tree-label">🌳 ต้นไม้ของฉัน</span>
            <span class="rw-tree-stage-tag" :style="{ background: viewData.color }">
              <span v-if="viewData.isPreview" style="opacity:0.8;font-size:10px;">👁 </span>Lv.{{ viewData.stage + 1 }} · {{ viewData.name }}
            </span>
          </div>

          <div class="rw-tree-row">
          <div class="rw-tree-col-left">
          <div class="rw-tree-scene">
            <svg class="rw-tree-svg" viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="rw3-drop" x="-20%" y="-15%" width="140%" height="135%">
                  <feDropShadow dx="2" dy="4" stdDeviation="3" flood-color="#1A4A1A" flood-opacity="0.4"/>
                </filter>
                <radialGradient id="rw3-gs" cx="50%" cy="40%" r="50%">
                  <stop offset="0%"   stop-color="rgba(0,0,0,0.32)"/>
                  <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
                </radialGradient>
                <!-- Pine tier gradients: bright upper-left → dark lower-right for 3D effect -->
                <linearGradient id="pt-t1" x1="5%" y1="5%" x2="95%" y2="95%">
                  <stop offset="0%"   stop-color="#D1FAE5"/>
                  <stop offset="22%"  stop-color="#4ADE80"/>
                  <stop offset="65%"  stop-color="#22C55E"/>
                  <stop offset="100%" stop-color="#14532D"/>
                </linearGradient>
                <linearGradient id="pt-t2" x1="5%" y1="5%" x2="95%" y2="95%">
                  <stop offset="0%"   stop-color="#A7F3D0"/>
                  <stop offset="25%"  stop-color="#34D399"/>
                  <stop offset="65%"  stop-color="#16A34A"/>
                  <stop offset="100%" stop-color="#052E16"/>
                </linearGradient>
                <linearGradient id="pt-t3" x1="5%" y1="5%" x2="95%" y2="95%">
                  <stop offset="0%"   stop-color="#6EE7B7"/>
                  <stop offset="28%"  stop-color="#10B981"/>
                  <stop offset="68%"  stop-color="#065F46"/>
                  <stop offset="100%" stop-color="#022C22"/>
                </linearGradient>
                <!-- Trunk: horizontal light-left to dark-right -->
                <linearGradient id="pt-trunk" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stop-color="#FDE68A"/>
                  <stop offset="28%"  stop-color="#D97706"/>
                  <stop offset="100%" stop-color="#451A03"/>
                </linearGradient>
                <!-- Star glow -->
                <radialGradient id="pt-star" cx="30%" cy="30%" r="70%">
                  <stop offset="0%"   stop-color="#FEF9C3"/>
                  <stop offset="40%"  stop-color="#FBBF24"/>
                  <stop offset="100%" stop-color="#92400E"/>
                </radialGradient>
                <!-- Ornament balls -->
                <radialGradient id="rw3-fr" cx="30%" cy="25%" r="70%">
                  <stop offset="0%"   stop-color="#FFF0F0"/>
                  <stop offset="32%"  stop-color="#F87171"/>
                  <stop offset="100%" stop-color="#7F1D1D"/>
                </radialGradient>
                <radialGradient id="rw3-fo" cx="30%" cy="25%" r="70%">
                  <stop offset="0%"   stop-color="#FFF7ED"/>
                  <stop offset="32%"  stop-color="#FB923C"/>
                  <stop offset="100%" stop-color="#7C2D12"/>
                </radialGradient>
                <radialGradient id="rw3-fy" cx="30%" cy="25%" r="70%">
                  <stop offset="0%"   stop-color="#FFFBEB"/>
                  <stop offset="32%"  stop-color="#FBBF24"/>
                  <stop offset="100%" stop-color="#78350F"/>
                </radialGradient>
                <radialGradient id="rw3-fb" cx="30%" cy="25%" r="70%">
                  <stop offset="0%"   stop-color="#EFF6FF"/>
                  <stop offset="32%"  stop-color="#60A5FA"/>
                  <stop offset="100%" stop-color="#1E3A8A"/>
                </radialGradient>
                <!-- Seed gradient -->
                <radialGradient id="pt-seed" cx="32%" cy="28%" r="70%">
                  <stop offset="0%"   stop-color="#FDE68A"/>
                  <stop offset="30%"  stop-color="#D97706"/>
                  <stop offset="75%"  stop-color="#92400E"/>
                  <stop offset="100%" stop-color="#431407"/>
                </radialGradient>
              </defs>

              <ellipse cx="60" cy="126" rx="38" ry="5.5" fill="url(#rw3-gs)"/>

              <g filter="url(#rw3-drop)">
                <animateTransform attributeName="transform" type="rotate"
                  values="-2 60 119; 2 60 119; -2 60 119"
                  keyTimes="0;0.5;1" dur="3s" repeatCount="indefinite"
                  calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>

                <!-- ── Stage 0: seed (เมล็ดพันธุ์) ── -->
                <g v-if="viewData.stage === 0">
                  <!-- Soil mound -->
                  <ellipse cx="60" cy="122" rx="22" ry="6" fill="#5C3A1E" stroke="#3D1F0A" stroke-width="1"/>
                  <ellipse cx="60" cy="120" rx="15" ry="3.5" fill="#A0622A" opacity="0.6"/>
                  <!-- Seed drop shadow -->
                  <ellipse cx="62" cy="114" rx="12" ry="15.5" fill="#431407" opacity="0.28"/>
                  <!-- Seed body -->
                  <ellipse cx="60" cy="111" rx="12" ry="15" fill="url(#pt-seed)" stroke="#78350F" stroke-width="1.5"/>
                  <!-- Seed shine highlight -->
                  <ellipse cx="55.5" cy="104" rx="4" ry="5.5" fill="rgba(255,255,255,0.3)" transform="rotate(-20 55.5 104)"/>
                  <!-- Seed grain line -->
                  <path d="M60,96 Q61,104 60,126" stroke="#78350F" stroke-width="1" fill="none" opacity="0.3"/>
                  <!-- Tiny sprout -->
                  <path d="M60,96 Q58,92 60,89" stroke="#4ADE80" stroke-width="2.2" fill="none" stroke-linecap="round"/>
                  <circle cx="60" cy="87.5" r="3.5" fill="#22C55E" stroke="#16A34A" stroke-width="1"/>
                  <circle cx="58.5" cy="86" r="1.2" fill="rgba(255,255,255,0.7)"/>
                </g>

                <!-- ── Trunk (stage 1+) ── -->
                <g v-if="viewData.stage >= 1">
                  <rect :x="58" :y="viewData.trunkTop + 2" width="7" :height="120 - viewData.trunkTop" rx="3" fill="#451A03" opacity="0.3"/>
                  <rect :x="56" :y="viewData.trunkTop" width="8" :height="120 - viewData.trunkTop" rx="4" fill="url(#pt-trunk)" stroke="#78350F" stroke-width="1.2"/>
                  <rect :x="57.5" :y="viewData.trunkTop + 5" width="2" :height="Math.max(4, Math.round((120 - viewData.trunkTop) * 0.4))" rx="1" fill="rgba(255,255,255,0.35)"/>
                </g>

                <!-- ── Stage 1: young pine 3D (2 tiers) ── -->
                <g v-if="viewData.stage === 1">
                  <!-- Tier 2 (bottom) -->
                  <path d="M62,106 L92,122 Q62,127 32,122 Z" fill="#022C22" opacity="0.38"/>
                  <path d="M60,102 L90,118 Q60,123 30,118 Z" fill="url(#pt-t2)" stroke="#15803D" stroke-width="1.5"/>
                  <path d="M30,118 Q60,123 90,118" fill="none" stroke="#022C22" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
                  <circle cx="57" cy="102.5" r="2.5" fill="rgba(255,255,255,0.72)"/>
                  <!-- Tier 1 (top) -->
                  <path d="M62,93 L84,111 Q62,115 40,111 Z" fill="#022C22" opacity="0.38"/>
                  <path d="M60,89 L82,107 Q60,111 38,107 Z" fill="url(#pt-t1)" stroke="#22C55E" stroke-width="1.5"/>
                  <path d="M38,107 Q60,111 82,107" fill="none" stroke="#022C22" stroke-width="2.5" stroke-linecap="round" opacity="0.46"/>
                  <circle cx="57.5" cy="89.5" r="2.2" fill="rgba(255,255,255,0.8)"/>
                </g>

                <!-- ── Stage 2: small pine 3D (3 tiers) ── -->
                <g v-if="viewData.stage === 2">
                  <!-- Tier 3 -->
                  <path d="M62,102 L96,121 Q62,126 28,121 Z" fill="#022C22" opacity="0.38"/>
                  <path d="M60,98 L94,117 Q60,122 26,117 Z" fill="url(#pt-t3)" stroke="#15803D" stroke-width="1.5"/>
                  <path d="M26,117 Q60,122 94,117" fill="none" stroke="#022C22" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
                  <circle cx="57" cy="98.5" r="2.8" fill="rgba(255,255,255,0.6)"/>
                  <!-- Tier 2 -->
                  <path d="M62,90 L88,107 Q62,111 36,107 Z" fill="#022C22" opacity="0.38"/>
                  <path d="M60,86 L86,103 Q60,107 34,103 Z" fill="url(#pt-t2)" stroke="#16A34A" stroke-width="1.5"/>
                  <path d="M34,103 Q60,107 86,103" fill="none" stroke="#022C22" stroke-width="2.5" stroke-linecap="round" opacity="0.46"/>
                  <circle cx="57.5" cy="86.5" r="2.3" fill="rgba(255,255,255,0.73)"/>
                  <!-- Tier 1 -->
                  <path d="M62,78 L81,95 Q62,98 43,95 Z" fill="#022C22" opacity="0.38"/>
                  <path d="M60,74 L79,91 Q60,94 41,91 Z" fill="url(#pt-t1)" stroke="#22C55E" stroke-width="1.5"/>
                  <path d="M41,91 Q60,94 79,91" fill="none" stroke="#022C22" stroke-width="2.5" stroke-linecap="round" opacity="0.44"/>
                  <circle cx="57.5" cy="74.5" r="2" fill="rgba(255,255,255,0.8)"/>
                </g>

                <!-- ── Stage 3: pine tree 3D (4 tiers) ── -->
                <g v-if="viewData.stage === 3">
                  <!-- Tier 4 -->
                  <path d="M62,98 L99,119 Q62,124 25,119 Z" fill="#022C22" opacity="0.38"/>
                  <path d="M60,94 L97,115 Q60,120 23,115 Z" fill="url(#pt-t3)" stroke="#059669" stroke-width="1.5"/>
                  <path d="M23,115 Q60,120 97,115" fill="none" stroke="#022C22" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
                  <circle cx="57" cy="94.5" r="3" fill="rgba(255,255,255,0.55)"/>
                  <!-- Tier 3 -->
                  <path d="M62,86 L91,102 Q62,106 33,102 Z" fill="#022C22" opacity="0.38"/>
                  <path d="M60,82 L89,98 Q60,102 31,98 Z" fill="url(#pt-t3)" stroke="#15803D" stroke-width="1.5"/>
                  <path d="M31,98 Q60,102 89,98" fill="none" stroke="#022C22" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
                  <circle cx="57" cy="82.5" r="2.5" fill="rgba(255,255,255,0.65)"/>
                  <!-- Tier 2 -->
                  <path d="M62,74 L84,89 Q62,93 40,89 Z" fill="#022C22" opacity="0.38"/>
                  <path d="M60,70 L82,85 Q60,89 38,85 Z" fill="url(#pt-t2)" stroke="#16A34A" stroke-width="1.5"/>
                  <path d="M38,85 Q60,89 82,85" fill="none" stroke="#022C22" stroke-width="2.5" stroke-linecap="round" opacity="0.46"/>
                  <circle cx="57.5" cy="70.5" r="2.2" fill="rgba(255,255,255,0.73)"/>
                  <!-- Tier 1 -->
                  <path d="M62,62 L78,78 Q62,81 46,78 Z" fill="#022C22" opacity="0.38"/>
                  <path d="M60,58 L76,74 Q60,77 44,74 Z" fill="url(#pt-t1)" stroke="#22C55E" stroke-width="1.5"/>
                  <path d="M44,74 Q60,77 76,74" fill="none" stroke="#022C22" stroke-width="2.5" stroke-linecap="round" opacity="0.44"/>
                  <circle cx="57.5" cy="58.5" r="2" fill="rgba(255,255,255,0.82)"/>
                </g>

                <!-- ── Stage 4: mature pine 3D + ornaments (5 tiers) ── -->
                <g v-if="viewData.stage === 4">
                  <!-- Tier 5 -->
                  <path d="M62,95 L101,117 Q62,122 23,117 Z" fill="#022C22" opacity="0.38"/>
                  <path d="M60,91 L99,113 Q60,118 21,113 Z" fill="url(#pt-t3)" stroke="#059669" stroke-width="1.5"/>
                  <path d="M21,113 Q60,118 99,113" fill="none" stroke="#022C22" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
                  <circle cx="57" cy="91.5" r="3" fill="rgba(255,255,255,0.5)"/>
                  <!-- Tier 4 -->
                  <path d="M62,83 L93,100 Q62,104 31,100 Z" fill="#022C22" opacity="0.38"/>
                  <path d="M60,79 L91,96 Q60,100 29,96 Z" fill="url(#pt-t3)" stroke="#15803D" stroke-width="1.5"/>
                  <path d="M29,96 Q60,100 91,96" fill="none" stroke="#022C22" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
                  <circle cx="57" cy="79.5" r="2.5" fill="rgba(255,255,255,0.6)"/>
                  <!-- Tier 3 -->
                  <path d="M62,71 L87,88 Q62,92 37,88 Z" fill="#022C22" opacity="0.38"/>
                  <path d="M60,67 L85,84 Q60,88 35,84 Z" fill="url(#pt-t2)" stroke="#16A34A" stroke-width="1.5"/>
                  <path d="M35,84 Q60,88 85,84" fill="none" stroke="#022C22" stroke-width="2.5" stroke-linecap="round" opacity="0.46"/>
                  <circle cx="57.5" cy="67.5" r="2.2" fill="rgba(255,255,255,0.7)"/>
                  <!-- Tier 2 -->
                  <path d="M62,59 L81,76 Q62,79 43,76 Z" fill="#022C22" opacity="0.38"/>
                  <path d="M60,55 L79,72 Q60,75 41,72 Z" fill="url(#pt-t2)" stroke="#22C55E" stroke-width="1.5"/>
                  <path d="M41,72 Q60,75 79,72" fill="none" stroke="#022C22" stroke-width="2.5" stroke-linecap="round" opacity="0.44"/>
                  <circle cx="57.5" cy="55.5" r="2" fill="rgba(255,255,255,0.78)"/>
                  <!-- Tier 1 -->
                  <path d="M62,48 L76,63 Q62,66 48,63 Z" fill="#022C22" opacity="0.38"/>
                  <path d="M60,44 L74,59 Q60,62 46,59 Z" fill="url(#pt-t1)" stroke="#22C55E" stroke-width="1.5"/>
                  <path d="M46,59 Q60,62 74,59" fill="none" stroke="#022C22" stroke-width="2" stroke-linecap="round" opacity="0.42"/>
                  <circle cx="57.5" cy="44.5" r="1.8" fill="rgba(255,255,255,0.85)"/>
                  <!-- Ornament balls -->
                  <line x1="27" y1="113" x2="27" y2="118" stroke="#78350F" stroke-width="1.2"/>
                  <circle cx="27" cy="121" r="5" fill="url(#rw3-fr)" stroke="#DC2626" stroke-width="1"/>
                  <circle cx="25.5" cy="118.5" r="1.5" fill="rgba(255,255,255,0.8)"/>
                  <line x1="93" y1="113" x2="93" y2="118" stroke="#78350F" stroke-width="1.2"/>
                  <circle cx="93" cy="121" r="5" fill="url(#rw3-fo)" stroke="#EA580C" stroke-width="1"/>
                  <circle cx="91.5" cy="118.5" r="1.5" fill="rgba(255,255,255,0.8)"/>
                  <line x1="33" y1="96" x2="33" y2="100" stroke="#78350F" stroke-width="1.2"/>
                  <circle cx="33" cy="103" r="4.5" fill="url(#rw3-fy)" stroke="#CA8A04" stroke-width="1"/>
                  <circle cx="31.5" cy="100.5" r="1.3" fill="rgba(255,255,255,0.8)"/>
                  <line x1="87" y1="96" x2="87" y2="100" stroke="#78350F" stroke-width="1.2"/>
                  <circle cx="87" cy="103" r="4.5" fill="url(#rw3-fb)" stroke="#2563EB" stroke-width="1"/>
                  <circle cx="85.5" cy="100.5" r="1.3" fill="rgba(255,255,255,0.8)"/>
                  <line x1="79" y1="84" x2="79" y2="88" stroke="#78350F" stroke-width="1.1"/>
                  <circle cx="79" cy="91" r="4" fill="url(#rw3-fr)" stroke="#DC2626" stroke-width="1"/>
                  <circle cx="77.5" cy="88.5" r="1.2" fill="rgba(255,255,255,0.8)"/>
                </g>

                <!-- ── Stage 5: magical pine 3D (6 tiers + star + ornaments + sparkles) ── -->
                <g v-if="viewData.stage >= 5">
                  <!-- Tier 6 (bottom, widest) -->
                  <path d="M62,91 L104,114 Q62,119 20,114 Z" fill="#022C22" opacity="0.38"/>
                  <path d="M60,87 L102,110 Q60,115 18,110 Z" fill="url(#pt-t3)" stroke="#047857" stroke-width="1.5"/>
                  <path d="M18,110 Q60,115 102,110" fill="none" stroke="#022C22" stroke-width="3" stroke-linecap="round" opacity="0.52"/>
                  <circle cx="57" cy="87.5" r="3.2" fill="rgba(255,255,255,0.48)"/>
                  <!-- Tier 5 -->
                  <path d="M62,80 L97,100 Q62,105 27,100 Z" fill="#022C22" opacity="0.38"/>
                  <path d="M60,76 L95,96 Q60,101 25,96 Z" fill="url(#pt-t3)" stroke="#059669" stroke-width="1.5"/>
                  <path d="M25,96 Q60,101 95,96" fill="none" stroke="#022C22" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
                  <circle cx="57" cy="76.5" r="2.8" fill="rgba(255,255,255,0.56)"/>
                  <!-- Tier 4 -->
                  <path d="M62,68 L90,86 Q62,90 34,86 Z" fill="#022C22" opacity="0.38"/>
                  <path d="M60,64 L88,82 Q60,86 32,82 Z" fill="url(#pt-t2)" stroke="#15803D" stroke-width="1.5"/>
                  <path d="M32,82 Q60,86 88,82" fill="none" stroke="#022C22" stroke-width="2.5" stroke-linecap="round" opacity="0.46"/>
                  <circle cx="57.5" cy="64.5" r="2.4" fill="rgba(255,255,255,0.65)"/>
                  <!-- Tier 3 -->
                  <path d="M62,56 L84,72 Q62,76 40,72 Z" fill="#022C22" opacity="0.38"/>
                  <path d="M60,52 L82,68 Q60,72 38,68 Z" fill="url(#pt-t2)" stroke="#16A34A" stroke-width="1.5"/>
                  <path d="M38,68 Q60,72 82,68" fill="none" stroke="#022C22" stroke-width="2.5" stroke-linecap="round" opacity="0.44"/>
                  <circle cx="57.5" cy="52.5" r="2.1" fill="rgba(255,255,255,0.73)"/>
                  <!-- Tier 2 -->
                  <path d="M62,45 L78,59 Q62,62 46,59 Z" fill="#022C22" opacity="0.38"/>
                  <path d="M60,41 L76,55 Q60,58 44,55 Z" fill="url(#pt-t1)" stroke="#22C55E" stroke-width="1.5"/>
                  <path d="M44,55 Q60,58 76,55" fill="none" stroke="#022C22" stroke-width="2" stroke-linecap="round" opacity="0.42"/>
                  <circle cx="57.5" cy="41.5" r="1.9" fill="rgba(255,255,255,0.8)"/>
                  <!-- Tier 1 (top) -->
                  <path d="M62,34 L73,47 Q62,50 51,47 Z" fill="#022C22" opacity="0.38"/>
                  <path d="M60,30 L71,43 Q60,46 49,43 Z" fill="url(#pt-t1)" stroke="#22C55E" stroke-width="1.5"/>
                  <path d="M49,43 Q60,46 71,43" fill="none" stroke="#022C22" stroke-width="2" stroke-linecap="round" opacity="0.4"/>
                  <circle cx="57.5" cy="30.5" r="1.6" fill="rgba(255,255,255,0.86)"/>
                  <!-- Star on top -->
                  <polygon points="60,18 62.4,25.8 70.4,25.8 64,30.3 66.4,38 60,33.5 53.6,38 56,30.3 49.6,25.8 57.6,25.8"
                    fill="url(#pt-star)" stroke="#D97706" stroke-width="1">
                    <animate attributeName="opacity" values="0.75;1;0.75" dur="1.5s" repeatCount="indefinite"/>
                  </polygon>
                  <circle cx="60" cy="26" r="2.5" fill="rgba(255,255,255,0.9)">
                    <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite"/>
                  </circle>
                  <!-- Ornament balls tier 6 -->
                  <line x1="22" y1="110" x2="22" y2="115" stroke="#78350F" stroke-width="1.2"/>
                  <circle cx="22" cy="119" r="5.5" fill="url(#rw3-fr)" stroke="#DC2626" stroke-width="1"/>
                  <circle cx="20.5" cy="116.5" r="1.6" fill="rgba(255,255,255,0.82)"/>
                  <line x1="98" y1="110" x2="98" y2="115" stroke="#78350F" stroke-width="1.2"/>
                  <circle cx="98" cy="119" r="5.5" fill="url(#rw3-fb)" stroke="#2563EB" stroke-width="1"/>
                  <circle cx="96.5" cy="116.5" r="1.6" fill="rgba(255,255,255,0.82)"/>
                  <!-- Ornament balls tier 5 -->
                  <line x1="29" y1="96" x2="29" y2="100" stroke="#78350F" stroke-width="1.2"/>
                  <circle cx="29" cy="104" r="5" fill="url(#rw3-fy)" stroke="#CA8A04" stroke-width="1"/>
                  <circle cx="27.5" cy="101.5" r="1.5" fill="rgba(255,255,255,0.82)"/>
                  <line x1="91" y1="96" x2="91" y2="100" stroke="#78350F" stroke-width="1.2"/>
                  <circle cx="91" cy="104" r="5" fill="url(#rw3-fo)" stroke="#EA580C" stroke-width="1"/>
                  <circle cx="89.5" cy="101.5" r="1.5" fill="rgba(255,255,255,0.82)"/>
                  <!-- Ornament balls tier 4 -->
                  <line x1="36" y1="82" x2="36" y2="86" stroke="#78350F" stroke-width="1.1"/>
                  <circle cx="36" cy="89.5" r="4.5" fill="url(#rw3-fo)" stroke="#EA580C" stroke-width="1"/>
                  <circle cx="34.5" cy="87" r="1.3" fill="rgba(255,255,255,0.8)"/>
                  <line x1="84" y1="82" x2="84" y2="86" stroke="#78350F" stroke-width="1.1"/>
                  <circle cx="84" cy="89.5" r="4.5" fill="url(#rw3-fr)" stroke="#DC2626" stroke-width="1"/>
                  <circle cx="82.5" cy="87" r="1.3" fill="rgba(255,255,255,0.8)"/>
                  <!-- Ornament balls tier 3 -->
                  <line x1="42" y1="68" x2="42" y2="72" stroke="#78350F" stroke-width="1.1"/>
                  <circle cx="42" cy="75.5" r="4" fill="url(#rw3-fb)" stroke="#2563EB" stroke-width="1"/>
                  <circle cx="40.5" cy="73" r="1.2" fill="rgba(255,255,255,0.8)"/>
                  <line x1="78" y1="68" x2="78" y2="72" stroke="#78350F" stroke-width="1.1"/>
                  <circle cx="78" cy="75.5" r="4" fill="url(#rw3-fy)" stroke="#CA8A04" stroke-width="1"/>
                  <circle cx="76.5" cy="73" r="1.2" fill="rgba(255,255,255,0.8)"/>
                  <!-- Sparkle stars left -->
                  <g>
                    <circle cx="9" cy="72" r="3.5" fill="#FEF08A" stroke="#FCD34D" stroke-width="0.8">
                      <animate attributeName="r"       values="3.5;5;3.5" dur="1.8s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values="1;0.2;1"   dur="1.8s" repeatCount="indefinite"/>
                    </circle>
                    <line x1="6" y1="69" x2="12" y2="75" stroke="#FCD34D" stroke-width="1.3" stroke-linecap="round"><animate attributeName="opacity" values="1;0.1;1" dur="1.8s" repeatCount="indefinite"/></line>
                    <line x1="12" y1="69" x2="6" y2="75" stroke="#FCD34D" stroke-width="1.3" stroke-linecap="round"><animate attributeName="opacity" values="1;0.1;1" dur="1.8s" repeatCount="indefinite"/></line>
                    <line x1="9" y1="66" x2="9" y2="78" stroke="#FCD34D" stroke-width="1.3" stroke-linecap="round"><animate attributeName="opacity" values="1;0.1;1" dur="1.8s" repeatCount="indefinite"/></line>
                  </g>
                  <!-- Sparkle stars right -->
                  <g>
                    <circle cx="111" cy="66" r="3" fill="#FEF08A" stroke="#FCD34D" stroke-width="0.8">
                      <animate attributeName="r"       values="3;4.5;3"   dur="1.8s" repeatCount="indefinite" begin="0.9s"/>
                      <animate attributeName="opacity" values="0.2;1;0.2" dur="1.8s" repeatCount="indefinite" begin="0.9s"/>
                    </circle>
                    <line x1="108" y1="63" x2="114" y2="69" stroke="#FCD34D" stroke-width="1.3" stroke-linecap="round"><animate attributeName="opacity" values="0.1;1;0.1" dur="1.8s" repeatCount="indefinite" begin="0.9s"/></line>
                    <line x1="114" y1="63" x2="108" y2="69" stroke="#FCD34D" stroke-width="1.3" stroke-linecap="round"><animate attributeName="opacity" values="0.1;1;0.1" dur="1.8s" repeatCount="indefinite" begin="0.9s"/></line>
                    <line x1="111" y1="60" x2="111" y2="72" stroke="#FCD34D" stroke-width="1.3" stroke-linecap="round"><animate attributeName="opacity" values="0.1;1;0.1" dur="1.8s" repeatCount="indefinite" begin="0.9s"/></line>
                  </g>
                  <!-- Sparkle near top -->
                  <g>
                    <circle cx="105" cy="38" r="2.5" fill="#FEF9C3" stroke="#FBBF24" stroke-width="0.8">
                      <animate attributeName="r"       values="2.5;3.5;2.5" dur="1.4s" repeatCount="indefinite" begin="0.3s"/>
                      <animate attributeName="opacity" values="0.5;1;0.5"   dur="1.4s" repeatCount="indefinite" begin="0.3s"/>
                    </circle>
                    <line x1="102.5" y1="35.5" x2="107.5" y2="40.5" stroke="#FBBF24" stroke-width="1" stroke-linecap="round"><animate attributeName="opacity" values="0.3;0.9;0.3" dur="1.4s" repeatCount="indefinite" begin="0.3s"/></line>
                    <line x1="107.5" y1="35.5" x2="102.5" y2="40.5" stroke="#FBBF24" stroke-width="1" stroke-linecap="round"><animate attributeName="opacity" values="0.3;0.9;0.3" dur="1.4s" repeatCount="indefinite" begin="0.3s"/></line>
                  </g>
                </g>

                <!-- Floating glitter particles (stage 2+) -->
                <g v-if="viewData.stage >= 2">
                  <circle cx="50" cy="80" r="2.5" fill="#BBF7D0" opacity="0">
                    <animate attributeName="cy"      values="80;55;30" dur="4s"   repeatCount="indefinite" begin="0s"/>
                    <animate attributeName="cx"      values="50;45;40" dur="4s"   repeatCount="indefinite" begin="0s"/>
                    <animate attributeName="opacity" values="0;0.85;0" dur="4s"   repeatCount="indefinite" begin="0s"/>
                  </circle>
                  <circle cx="70" cy="83" r="2" fill="#FDE68A" opacity="0">
                    <animate attributeName="cy"      values="83;60;37"  dur="3.7s" repeatCount="indefinite" begin="1.4s"/>
                    <animate attributeName="cx"      values="70;74;78"  dur="3.7s" repeatCount="indefinite" begin="1.4s"/>
                    <animate attributeName="opacity" values="0;0.85;0"  dur="3.7s" repeatCount="indefinite" begin="1.4s"/>
                  </circle>
                  <circle cx="60" cy="74" r="2" fill="#FCA5A5" opacity="0">
                    <animate attributeName="cy"      values="74;50;26" dur="5s"   repeatCount="indefinite" begin="0.8s"/>
                    <animate attributeName="cx"      values="60;56;52" dur="5s"   repeatCount="indefinite" begin="0.8s"/>
                    <animate attributeName="opacity" values="0;0.8;0"  dur="5s"   repeatCount="indefinite" begin="0.8s"/>
                  </circle>
                </g>
              </g>
            </svg>

            <div v-if="viewData.stage >= 5" class="rw-float-leaf rw-fl-3">✨</div>
          </div>
          </div><!-- /col-left -->
          <div class="rw-tree-col-right">
          <div class="rw-tree-prog-bar">
            <div class="rw-tree-prog-fill" :style="{ width: viewData.progress + '%', background: viewData.color }"></div>
          </div>
          <div class="rw-tree-prog-labels">
            <span>{{ reward.total }} pts</span>
            <span v-if="viewData.nextPts">อีก {{ viewData.ptsToNext }} pts → {{ viewData.nextName }}</span>
            <span v-else>🎉 ระดับสูงสุด!</span>
          </div>

          <!-- Level info panel -->
          <div class="rw-level-panel">
            <!-- Navigation row -->
            <div class="rw-stage-nav">
              <button
                class="rw-stage-nav-btn"
                :disabled="viewData.stage === 0"
                @click="previewStage = viewData.stage - 1"
              >‹</button>
              <div class="rw-stage-dots">
                <div
                  v-for="s in TREE_STAGES" :key="s.stage"
                  class="rw-stage-dot"
                  :title="s.name"
                  :style="s.stage === viewData.stage
                    ? { background: s.color, boxShadow: '0 0 8px ' + s.color + 'CC', borderColor: s.color, transform: 'scale(1.4)' }
                    : s.stage <= treeData.stage
                      ? { background: s.color + 'BB', borderColor: s.color }
                      : {}"
                  @click="setPreview(s.stage)"
                ></div>
              </div>
              <button
                class="rw-stage-nav-btn"
                :disabled="viewData.stage === TREE_STAGES.length - 1"
                @click="previewStage = viewData.stage + 1"
              >›</button>
            </div>
            <div class="rw-level-row">
              <span class="rw-level-num" :style="{ color: viewData.color }">Lv.{{ viewData.stage + 1 }}/{{ TREE_STAGES.length }}</span>
              <span class="rw-level-name-txt" :style="{ color: viewData.color }">{{ viewData.name }}</span>
            </div>
            <div class="rw-level-desc-txt">{{ viewData.desc }}</div>
            <div class="rw-level-range-txt">
              <span v-if="viewData.isPreview && viewData.stage > treeData.stage" style="color:#F59E0B;font-weight:700;">
                ต้องการอีก {{ Math.max(0, viewData.min - reward.total).toLocaleString() }} pts ·
              </span>
              คะแนน {{ viewData.min.toLocaleString() }} – {{ viewData.max === Infinity ? '∞' : viewData.max.toLocaleString() }} pts
            </div>
          </div><!-- /level-panel -->
          </div><!-- /col-right -->
          </div><!-- /tree-row -->

          <button class="rw-tree-share-btn" @click="shareOpen = true">📸 แชร์ต้นไม้</button>
        </div>

        <!-- ── Share card overlay ── -->
        <Teleport to="body">
          <div v-if="shareOpen" class="rw-share-overlay" @click.self="shareOpen = false">
            <div class="rw-share-wrapper">
              <!-- Card (the element html2canvas captures) -->
              <div ref="cardRef" class="rw-sc">
                <!-- bg decorations -->
                <div class="rw-sc-orb rw-sc-orb1"></div>
                <div class="rw-sc-orb rw-sc-orb2"></div>

                <!-- header -->
                <div class="rw-sc-header">
                  <span class="rw-sc-brand">🌿 DS Community Care</span>
                  <span class="rw-sc-year">{{ new Date().getFullYear() }}</span>
                </div>

                <!-- tree -->
                <div class="rw-sc-tree-area">
                  <svg class="rw-sc-tree-svg" viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <filter id="sc-drop" x="-20%" y="-15%" width="140%" height="135%">
                        <feDropShadow dx="2" dy="4" stdDeviation="3" flood-color="#1A4A1A" flood-opacity="0.4"/>
                      </filter>
                      <radialGradient id="sc-gs" cx="50%" cy="40%" r="50%">
                        <stop offset="0%"   stop-color="rgba(0,0,0,0.28)"/>
                        <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
                      </radialGradient>
                      <linearGradient id="sc-t1" x1="5%" y1="5%" x2="95%" y2="95%">
                        <stop offset="0%"   stop-color="#D1FAE5"/>
                        <stop offset="22%"  stop-color="#4ADE80"/>
                        <stop offset="65%"  stop-color="#22C55E"/>
                        <stop offset="100%" stop-color="#14532D"/>
                      </linearGradient>
                      <linearGradient id="sc-t2" x1="5%" y1="5%" x2="95%" y2="95%">
                        <stop offset="0%"   stop-color="#A7F3D0"/>
                        <stop offset="25%"  stop-color="#34D399"/>
                        <stop offset="65%"  stop-color="#16A34A"/>
                        <stop offset="100%" stop-color="#052E16"/>
                      </linearGradient>
                      <linearGradient id="sc-t3" x1="5%" y1="5%" x2="95%" y2="95%">
                        <stop offset="0%"   stop-color="#6EE7B7"/>
                        <stop offset="28%"  stop-color="#10B981"/>
                        <stop offset="68%"  stop-color="#065F46"/>
                        <stop offset="100%" stop-color="#022C22"/>
                      </linearGradient>
                      <linearGradient id="sc-trunk" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%"   stop-color="#FDE68A"/>
                        <stop offset="28%"  stop-color="#D97706"/>
                        <stop offset="100%" stop-color="#451A03"/>
                      </linearGradient>
                      <radialGradient id="sc-star" cx="30%" cy="30%" r="70%">
                        <stop offset="0%"   stop-color="#FEF9C3"/>
                        <stop offset="40%"  stop-color="#FBBF24"/>
                        <stop offset="100%" stop-color="#92400E"/>
                      </radialGradient>
                      <radialGradient id="sc-fr" cx="30%" cy="25%" r="70%">
                        <stop offset="0%"   stop-color="#FFF0F0"/>
                        <stop offset="32%"  stop-color="#F87171"/>
                        <stop offset="100%" stop-color="#7F1D1D"/>
                      </radialGradient>
                      <radialGradient id="sc-fo" cx="30%" cy="25%" r="70%">
                        <stop offset="0%"   stop-color="#FFF7ED"/>
                        <stop offset="32%"  stop-color="#FB923C"/>
                        <stop offset="100%" stop-color="#7C2D12"/>
                      </radialGradient>
                      <radialGradient id="sc-fy" cx="30%" cy="25%" r="70%">
                        <stop offset="0%"   stop-color="#FFFBEB"/>
                        <stop offset="32%"  stop-color="#FBBF24"/>
                        <stop offset="100%" stop-color="#78350F"/>
                      </radialGradient>
                      <radialGradient id="sc-fb" cx="30%" cy="25%" r="70%">
                        <stop offset="0%"   stop-color="#EFF6FF"/>
                        <stop offset="32%"  stop-color="#60A5FA"/>
                        <stop offset="100%" stop-color="#1E3A8A"/>
                      </radialGradient>
                      <radialGradient id="sc-seed" cx="32%" cy="28%" r="70%">
                        <stop offset="0%"   stop-color="#FDE68A"/>
                        <stop offset="30%"  stop-color="#D97706"/>
                        <stop offset="75%"  stop-color="#92400E"/>
                        <stop offset="100%" stop-color="#431407"/>
                      </radialGradient>
                    </defs>

                    <ellipse cx="60" cy="126" rx="38" ry="5.5" fill="url(#sc-gs)"/>

                    <g filter="url(#sc-drop)">
                      <animateTransform attributeName="transform" type="rotate"
                        values="-1.5 60 119; 1.5 60 119; -1.5 60 119"
                        keyTimes="0;0.5;1" dur="3.5s" repeatCount="indefinite"
                        calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>

                      <!-- Stage 0: seed -->
                      <g v-if="treeData.stage === 0">
                        <ellipse cx="60" cy="122" rx="22" ry="6" fill="#5C3A1E" stroke="#3D1F0A" stroke-width="1"/>
                        <ellipse cx="60" cy="120" rx="15" ry="3.5" fill="#A0622A" opacity="0.6"/>
                        <ellipse cx="62" cy="114" rx="12" ry="15.5" fill="#431407" opacity="0.28"/>
                        <ellipse cx="60" cy="111" rx="12" ry="15" fill="url(#sc-seed)" stroke="#78350F" stroke-width="1.5"/>
                        <ellipse cx="55.5" cy="104" rx="4" ry="5.5" fill="rgba(255,255,255,0.3)" transform="rotate(-20 55.5 104)"/>
                        <path d="M60,96 Q61,104 60,126" stroke="#78350F" stroke-width="1" fill="none" opacity="0.3"/>
                        <path d="M60,96 Q58,92 60,89" stroke="#4ADE80" stroke-width="2.2" fill="none" stroke-linecap="round"/>
                        <circle cx="60" cy="87.5" r="3.5" fill="#22C55E" stroke="#16A34A" stroke-width="1"/>
                        <circle cx="58.5" cy="86" r="1.2" fill="rgba(255,255,255,0.7)"/>
                      </g>

                      <!-- Trunk (stage 1+) -->
                      <g v-if="treeData.stage >= 1">
                        <rect :x="58" :y="treeData.trunkTop + 2" width="7" :height="120 - treeData.trunkTop" rx="3" fill="#451A03" opacity="0.3"/>
                        <rect :x="56" :y="treeData.trunkTop" width="8" :height="120 - treeData.trunkTop" rx="4" fill="url(#sc-trunk)" stroke="#78350F" stroke-width="1.2"/>
                        <rect :x="57.5" :y="treeData.trunkTop + 5" width="2" :height="Math.max(4, Math.round((120 - treeData.trunkTop) * 0.4))" rx="1" fill="rgba(255,255,255,0.35)"/>
                      </g>

                      <!-- Stage 1: young pine 3D (2 tiers) -->
                      <g v-if="treeData.stage === 1">
                        <path d="M62,106 L92,122 Q62,127 32,122 Z" fill="#022C22" opacity="0.38"/>
                        <path d="M60,102 L90,118 Q60,123 30,118 Z" fill="url(#sc-t2)" stroke="#15803D" stroke-width="1.5"/>
                        <path d="M30,118 Q60,123 90,118" fill="none" stroke="#022C22" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
                        <circle cx="57" cy="102.5" r="2.5" fill="rgba(255,255,255,0.72)"/>
                        <path d="M62,93 L84,111 Q62,115 40,111 Z" fill="#022C22" opacity="0.38"/>
                        <path d="M60,89 L82,107 Q60,111 38,107 Z" fill="url(#sc-t1)" stroke="#22C55E" stroke-width="1.5"/>
                        <path d="M38,107 Q60,111 82,107" fill="none" stroke="#022C22" stroke-width="2.5" stroke-linecap="round" opacity="0.46"/>
                        <circle cx="57.5" cy="89.5" r="2.2" fill="rgba(255,255,255,0.8)"/>
                      </g>

                      <!-- Stage 2: small pine 3D (3 tiers) -->
                      <g v-if="treeData.stage === 2">
                        <path d="M62,102 L96,121 Q62,126 28,121 Z" fill="#022C22" opacity="0.38"/>
                        <path d="M60,98 L94,117 Q60,122 26,117 Z" fill="url(#sc-t3)" stroke="#15803D" stroke-width="1.5"/>
                        <path d="M26,117 Q60,122 94,117" fill="none" stroke="#022C22" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
                        <circle cx="57" cy="98.5" r="2.8" fill="rgba(255,255,255,0.6)"/>
                        <path d="M62,90 L88,107 Q62,111 36,107 Z" fill="#022C22" opacity="0.38"/>
                        <path d="M60,86 L86,103 Q60,107 34,103 Z" fill="url(#sc-t2)" stroke="#16A34A" stroke-width="1.5"/>
                        <path d="M34,103 Q60,107 86,103" fill="none" stroke="#022C22" stroke-width="2.5" stroke-linecap="round" opacity="0.46"/>
                        <circle cx="57.5" cy="86.5" r="2.3" fill="rgba(255,255,255,0.73)"/>
                        <path d="M62,78 L81,95 Q62,98 43,95 Z" fill="#022C22" opacity="0.38"/>
                        <path d="M60,74 L79,91 Q60,94 41,91 Z" fill="url(#sc-t1)" stroke="#22C55E" stroke-width="1.5"/>
                        <path d="M41,91 Q60,94 79,91" fill="none" stroke="#022C22" stroke-width="2.5" stroke-linecap="round" opacity="0.44"/>
                        <circle cx="57.5" cy="74.5" r="2" fill="rgba(255,255,255,0.8)"/>
                      </g>

                      <!-- Stage 3: pine tree 3D (4 tiers) -->
                      <g v-if="treeData.stage === 3">
                        <path d="M62,98 L99,119 Q62,124 25,119 Z" fill="#022C22" opacity="0.38"/>
                        <path d="M60,94 L97,115 Q60,120 23,115 Z" fill="url(#sc-t3)" stroke="#059669" stroke-width="1.5"/>
                        <path d="M23,115 Q60,120 97,115" fill="none" stroke="#022C22" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
                        <circle cx="57" cy="94.5" r="3" fill="rgba(255,255,255,0.55)"/>
                        <path d="M62,86 L91,102 Q62,106 33,102 Z" fill="#022C22" opacity="0.38"/>
                        <path d="M60,82 L89,98 Q60,102 31,98 Z" fill="url(#sc-t3)" stroke="#15803D" stroke-width="1.5"/>
                        <path d="M31,98 Q60,102 89,98" fill="none" stroke="#022C22" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
                        <circle cx="57" cy="82.5" r="2.5" fill="rgba(255,255,255,0.65)"/>
                        <path d="M62,74 L84,89 Q62,93 40,89 Z" fill="#022C22" opacity="0.38"/>
                        <path d="M60,70 L82,85 Q60,89 38,85 Z" fill="url(#sc-t2)" stroke="#16A34A" stroke-width="1.5"/>
                        <path d="M38,85 Q60,89 82,85" fill="none" stroke="#022C22" stroke-width="2.5" stroke-linecap="round" opacity="0.46"/>
                        <circle cx="57.5" cy="70.5" r="2.2" fill="rgba(255,255,255,0.73)"/>
                        <path d="M62,62 L78,78 Q62,81 46,78 Z" fill="#022C22" opacity="0.38"/>
                        <path d="M60,58 L76,74 Q60,77 44,74 Z" fill="url(#sc-t1)" stroke="#22C55E" stroke-width="1.5"/>
                        <path d="M44,74 Q60,77 76,74" fill="none" stroke="#022C22" stroke-width="2.5" stroke-linecap="round" opacity="0.44"/>
                        <circle cx="57.5" cy="58.5" r="2" fill="rgba(255,255,255,0.82)"/>
                      </g>

                      <!-- Stage 4: mature pine 3D + ornaments (5 tiers) -->
                      <g v-if="treeData.stage === 4">
                        <path d="M62,95 L101,117 Q62,122 23,117 Z" fill="#022C22" opacity="0.38"/>
                        <path d="M60,91 L99,113 Q60,118 21,113 Z" fill="url(#sc-t3)" stroke="#059669" stroke-width="1.5"/>
                        <path d="M21,113 Q60,118 99,113" fill="none" stroke="#022C22" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
                        <circle cx="57" cy="91.5" r="3" fill="rgba(255,255,255,0.5)"/>
                        <path d="M62,83 L93,100 Q62,104 31,100 Z" fill="#022C22" opacity="0.38"/>
                        <path d="M60,79 L91,96 Q60,100 29,96 Z" fill="url(#sc-t3)" stroke="#15803D" stroke-width="1.5"/>
                        <path d="M29,96 Q60,100 91,96" fill="none" stroke="#022C22" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
                        <circle cx="57" cy="79.5" r="2.5" fill="rgba(255,255,255,0.6)"/>
                        <path d="M62,71 L87,88 Q62,92 37,88 Z" fill="#022C22" opacity="0.38"/>
                        <path d="M60,67 L85,84 Q60,88 35,84 Z" fill="url(#sc-t2)" stroke="#16A34A" stroke-width="1.5"/>
                        <path d="M35,84 Q60,88 85,84" fill="none" stroke="#022C22" stroke-width="2.5" stroke-linecap="round" opacity="0.46"/>
                        <circle cx="57.5" cy="67.5" r="2.2" fill="rgba(255,255,255,0.7)"/>
                        <path d="M62,59 L81,76 Q62,79 43,76 Z" fill="#022C22" opacity="0.38"/>
                        <path d="M60,55 L79,72 Q60,75 41,72 Z" fill="url(#sc-t2)" stroke="#22C55E" stroke-width="1.5"/>
                        <path d="M41,72 Q60,75 79,72" fill="none" stroke="#022C22" stroke-width="2.5" stroke-linecap="round" opacity="0.44"/>
                        <circle cx="57.5" cy="55.5" r="2" fill="rgba(255,255,255,0.78)"/>
                        <path d="M62,48 L76,63 Q62,66 48,63 Z" fill="#022C22" opacity="0.38"/>
                        <path d="M60,44 L74,59 Q60,62 46,59 Z" fill="url(#sc-t1)" stroke="#22C55E" stroke-width="1.5"/>
                        <path d="M46,59 Q60,62 74,59" fill="none" stroke="#022C22" stroke-width="2" stroke-linecap="round" opacity="0.42"/>
                        <circle cx="57.5" cy="44.5" r="1.8" fill="rgba(255,255,255,0.85)"/>
                        <line x1="27" y1="113" x2="27" y2="118" stroke="#78350F" stroke-width="1.2"/>
                        <circle cx="27" cy="121" r="5" fill="url(#sc-fr)" stroke="#DC2626" stroke-width="1"/>
                        <circle cx="25.5" cy="118.5" r="1.5" fill="rgba(255,255,255,0.8)"/>
                        <line x1="93" y1="113" x2="93" y2="118" stroke="#78350F" stroke-width="1.2"/>
                        <circle cx="93" cy="121" r="5" fill="url(#sc-fo)" stroke="#EA580C" stroke-width="1"/>
                        <circle cx="91.5" cy="118.5" r="1.5" fill="rgba(255,255,255,0.8)"/>
                        <line x1="33" y1="96" x2="33" y2="100" stroke="#78350F" stroke-width="1.2"/>
                        <circle cx="33" cy="103" r="4.5" fill="url(#sc-fy)" stroke="#CA8A04" stroke-width="1"/>
                        <circle cx="31.5" cy="100.5" r="1.3" fill="rgba(255,255,255,0.8)"/>
                        <line x1="87" y1="96" x2="87" y2="100" stroke="#78350F" stroke-width="1.2"/>
                        <circle cx="87" cy="103" r="4.5" fill="url(#sc-fb)" stroke="#2563EB" stroke-width="1"/>
                        <circle cx="85.5" cy="100.5" r="1.3" fill="rgba(255,255,255,0.8)"/>
                        <line x1="79" y1="84" x2="79" y2="88" stroke="#78350F" stroke-width="1.1"/>
                        <circle cx="79" cy="91" r="4" fill="url(#sc-fr)" stroke="#DC2626" stroke-width="1"/>
                        <circle cx="77.5" cy="88.5" r="1.2" fill="rgba(255,255,255,0.8)"/>
                      </g>

                      <!-- Stage 5: magical pine 3D (6 tiers + star + ornaments) -->
                      <g v-if="treeData.stage >= 5">
                        <path d="M62,91 L104,114 Q62,119 20,114 Z" fill="#022C22" opacity="0.38"/>
                        <path d="M60,87 L102,110 Q60,115 18,110 Z" fill="url(#sc-t3)" stroke="#047857" stroke-width="1.5"/>
                        <path d="M18,110 Q60,115 102,110" fill="none" stroke="#022C22" stroke-width="3" stroke-linecap="round" opacity="0.52"/>
                        <circle cx="57" cy="87.5" r="3.2" fill="rgba(255,255,255,0.48)"/>
                        <path d="M62,80 L97,100 Q62,105 27,100 Z" fill="#022C22" opacity="0.38"/>
                        <path d="M60,76 L95,96 Q60,101 25,96 Z" fill="url(#sc-t3)" stroke="#059669" stroke-width="1.5"/>
                        <path d="M25,96 Q60,101 95,96" fill="none" stroke="#022C22" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
                        <circle cx="57" cy="76.5" r="2.8" fill="rgba(255,255,255,0.56)"/>
                        <path d="M62,68 L90,86 Q62,90 34,86 Z" fill="#022C22" opacity="0.38"/>
                        <path d="M60,64 L88,82 Q60,86 32,82 Z" fill="url(#sc-t2)" stroke="#15803D" stroke-width="1.5"/>
                        <path d="M32,82 Q60,86 88,82" fill="none" stroke="#022C22" stroke-width="2.5" stroke-linecap="round" opacity="0.46"/>
                        <circle cx="57.5" cy="64.5" r="2.4" fill="rgba(255,255,255,0.65)"/>
                        <path d="M62,56 L84,72 Q62,76 40,72 Z" fill="#022C22" opacity="0.38"/>
                        <path d="M60,52 L82,68 Q60,72 38,68 Z" fill="url(#sc-t2)" stroke="#16A34A" stroke-width="1.5"/>
                        <path d="M38,68 Q60,72 82,68" fill="none" stroke="#022C22" stroke-width="2.5" stroke-linecap="round" opacity="0.44"/>
                        <circle cx="57.5" cy="52.5" r="2.1" fill="rgba(255,255,255,0.73)"/>
                        <path d="M62,45 L78,59 Q62,62 46,59 Z" fill="#022C22" opacity="0.38"/>
                        <path d="M60,41 L76,55 Q60,58 44,55 Z" fill="url(#sc-t1)" stroke="#22C55E" stroke-width="1.5"/>
                        <path d="M44,55 Q60,58 76,55" fill="none" stroke="#022C22" stroke-width="2" stroke-linecap="round" opacity="0.42"/>
                        <circle cx="57.5" cy="41.5" r="1.9" fill="rgba(255,255,255,0.8)"/>
                        <path d="M62,34 L73,47 Q62,50 51,47 Z" fill="#022C22" opacity="0.38"/>
                        <path d="M60,30 L71,43 Q60,46 49,43 Z" fill="url(#sc-t1)" stroke="#22C55E" stroke-width="1.5"/>
                        <path d="M49,43 Q60,46 71,43" fill="none" stroke="#022C22" stroke-width="2" stroke-linecap="round" opacity="0.4"/>
                        <circle cx="57.5" cy="30.5" r="1.6" fill="rgba(255,255,255,0.86)"/>
                        <polygon points="60,18 62.4,25.8 70.4,25.8 64,30.3 66.4,38 60,33.5 53.6,38 56,30.3 49.6,25.8 57.6,25.8"
                          fill="url(#sc-star)" stroke="#D97706" stroke-width="1">
                          <animate attributeName="opacity" values="0.75;1;0.75" dur="1.5s" repeatCount="indefinite"/>
                        </polygon>
                        <circle cx="60" cy="26" r="2.5" fill="rgba(255,255,255,0.9)">
                          <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite"/>
                        </circle>
                        <line x1="22" y1="110" x2="22" y2="115" stroke="#78350F" stroke-width="1.2"/>
                        <circle cx="22" cy="119" r="5.5" fill="url(#sc-fr)" stroke="#DC2626" stroke-width="1"/>
                        <circle cx="20.5" cy="116.5" r="1.6" fill="rgba(255,255,255,0.82)"/>
                        <line x1="98" y1="110" x2="98" y2="115" stroke="#78350F" stroke-width="1.2"/>
                        <circle cx="98" cy="119" r="5.5" fill="url(#sc-fb)" stroke="#2563EB" stroke-width="1"/>
                        <circle cx="96.5" cy="116.5" r="1.6" fill="rgba(255,255,255,0.82)"/>
                        <line x1="29" y1="96" x2="29" y2="100" stroke="#78350F" stroke-width="1.2"/>
                        <circle cx="29" cy="104" r="5" fill="url(#sc-fy)" stroke="#CA8A04" stroke-width="1"/>
                        <circle cx="27.5" cy="101.5" r="1.5" fill="rgba(255,255,255,0.82)"/>
                        <line x1="91" y1="96" x2="91" y2="100" stroke="#78350F" stroke-width="1.2"/>
                        <circle cx="91" cy="104" r="5" fill="url(#sc-fo)" stroke="#EA580C" stroke-width="1"/>
                        <circle cx="89.5" cy="101.5" r="1.5" fill="rgba(255,255,255,0.82)"/>
                        <line x1="36" y1="82" x2="36" y2="86" stroke="#78350F" stroke-width="1.1"/>
                        <circle cx="36" cy="89.5" r="4.5" fill="url(#sc-fo)" stroke="#EA580C" stroke-width="1"/>
                        <circle cx="34.5" cy="87" r="1.3" fill="rgba(255,255,255,0.8)"/>
                        <line x1="84" y1="82" x2="84" y2="86" stroke="#78350F" stroke-width="1.1"/>
                        <circle cx="84" cy="89.5" r="4.5" fill="url(#sc-fr)" stroke="#DC2626" stroke-width="1"/>
                        <circle cx="82.5" cy="87" r="1.3" fill="rgba(255,255,255,0.8)"/>
                        <line x1="42" y1="68" x2="42" y2="72" stroke="#78350F" stroke-width="1.1"/>
                        <circle cx="42" cy="75.5" r="4" fill="url(#sc-fb)" stroke="#2563EB" stroke-width="1"/>
                        <circle cx="40.5" cy="73" r="1.2" fill="rgba(255,255,255,0.8)"/>
                        <line x1="78" y1="68" x2="78" y2="72" stroke="#78350F" stroke-width="1.1"/>
                        <circle cx="78" cy="75.5" r="4" fill="url(#sc-fy)" stroke="#CA8A04" stroke-width="1"/>
                        <circle cx="76.5" cy="73" r="1.2" fill="rgba(255,255,255,0.8)"/>
                        <g>
                          <circle cx="9" cy="72" r="3.5" fill="#FEF08A" stroke="#FCD34D" stroke-width="0.8">
                            <animate attributeName="r"       values="3.5;5;3.5" dur="1.8s" repeatCount="indefinite"/>
                            <animate attributeName="opacity" values="1;0.2;1"   dur="1.8s" repeatCount="indefinite"/>
                          </circle>
                          <line x1="6" y1="69" x2="12" y2="75" stroke="#FCD34D" stroke-width="1.3" stroke-linecap="round"><animate attributeName="opacity" values="1;0.1;1" dur="1.8s" repeatCount="indefinite"/></line>
                          <line x1="12" y1="69" x2="6" y2="75" stroke="#FCD34D" stroke-width="1.3" stroke-linecap="round"><animate attributeName="opacity" values="1;0.1;1" dur="1.8s" repeatCount="indefinite"/></line>
                          <line x1="9" y1="66" x2="9" y2="78" stroke="#FCD34D" stroke-width="1.3" stroke-linecap="round"><animate attributeName="opacity" values="1;0.1;1" dur="1.8s" repeatCount="indefinite"/></line>
                        </g>
                        <g>
                          <circle cx="111" cy="66" r="3" fill="#FEF08A" stroke="#FCD34D" stroke-width="0.8">
                            <animate attributeName="r"       values="3;4.5;3"   dur="1.8s" repeatCount="indefinite" begin="0.9s"/>
                            <animate attributeName="opacity" values="0.2;1;0.2" dur="1.8s" repeatCount="indefinite" begin="0.9s"/>
                          </circle>
                          <line x1="108" y1="63" x2="114" y2="69" stroke="#FCD34D" stroke-width="1.3" stroke-linecap="round"><animate attributeName="opacity" values="0.1;1;0.1" dur="1.8s" repeatCount="indefinite" begin="0.9s"/></line>
                          <line x1="114" y1="63" x2="108" y2="69" stroke="#FCD34D" stroke-width="1.3" stroke-linecap="round"><animate attributeName="opacity" values="0.1;1;0.1" dur="1.8s" repeatCount="indefinite" begin="0.9s"/></line>
                          <line x1="111" y1="60" x2="111" y2="72" stroke="#FCD34D" stroke-width="1.3" stroke-linecap="round"><animate attributeName="opacity" values="0.1;1;0.1" dur="1.8s" repeatCount="indefinite" begin="0.9s"/></line>
                        </g>
                      </g>

                      <!-- Floating particles (stage 2+) -->
                      <g v-if="treeData.stage >= 2">
                        <circle cx="50" cy="80" r="2.5" fill="#BBF7D0" opacity="0">
                          <animate attributeName="cy"      values="80;55;30" dur="4s"   repeatCount="indefinite" begin="0s"/>
                          <animate attributeName="cx"      values="50;45;40" dur="4s"   repeatCount="indefinite" begin="0s"/>
                          <animate attributeName="opacity" values="0;0.85;0" dur="4s"   repeatCount="indefinite" begin="0s"/>
                        </circle>
                        <circle cx="70" cy="83" r="2" fill="#FDE68A" opacity="0">
                          <animate attributeName="cy"      values="83;60;37"  dur="3.7s" repeatCount="indefinite" begin="1.4s"/>
                          <animate attributeName="cx"      values="70;74;78"  dur="3.7s" repeatCount="indefinite" begin="1.4s"/>
                          <animate attributeName="opacity" values="0;0.85;0"  dur="3.7s" repeatCount="indefinite" begin="1.4s"/>
                        </circle>
                        <circle cx="60" cy="74" r="2" fill="#FCA5A5" opacity="0">
                          <animate attributeName="cy"      values="74;50;26" dur="5s"   repeatCount="indefinite" begin="0.8s"/>
                          <animate attributeName="cx"      values="60;56;52" dur="5s"   repeatCount="indefinite" begin="0.8s"/>
                          <animate attributeName="opacity" values="0;0.8;0"  dur="5s"   repeatCount="indefinite" begin="0.8s"/>
                        </circle>
                      </g>
                    </g>
                  </svg>
                </div>

                <!-- stage badge -->
                <div class="rw-sc-stage-badge" :style="{ background: treeData.color }">
                  {{ treeData.name }}
                </div>

                <!-- name -->
                <div class="rw-sc-name">{{ userAuth.userName }}</div>

                <!-- points -->
                <div class="rw-sc-pts">{{ reward.total.toLocaleString() }}</div>
                <div class="rw-sc-pts-sub">คะแนนสะสม</div>

                <!-- progress -->
                <div class="rw-sc-prog-wrap">
                  <div class="rw-sc-prog-bar">
                    <div class="rw-sc-prog-fill" :style="{ width: treeData.progress + '%', background: treeData.color }"></div>
                  </div>
                  <div class="rw-sc-prog-label">
                    <span v-if="treeData.nextPts">{{ treeData.ptsToNext }} pts → {{ treeData.nextName }}</span>
                    <span v-else>🏆 ระดับสูงสุดแล้ว!</span>
                  </div>
                </div>

                <!-- footer -->
                <div class="rw-sc-footer">ร่วมเติบโตกับ DS Community 🌱</div>
              </div>

              <!-- actions -->
              <div class="rw-share-actions">
                <button class="rw-share-dl-btn" :disabled="capturing" @click="captureCard">
                  <span v-if="capturing">⏳ กำลังสร้าง...</span>
                  <span v-else>💾 บันทึกรูป</span>
                </button>
                <button class="rw-share-close-btn" @click="shareOpen = false">ปิด</button>
              </div>
            </div>
          </div>
        </Teleport>

        <!-- ── History section ── -->
        <div v-if="reward.history.length > 0" class="rw-section">
          <div class="rw-section-title">ประวัติคะแนน</div>

          <!-- Top 5 -->
          <div class="rw-history-list">
            <div v-for="h in reward.history.slice(0, 5)" :key="h.id" class="rw-hist-row">
              <div class="rw-hist-icon">{{ typeEmoji(h.type, h.subtype) }}</div>
              <div class="rw-hist-info">
                <div class="rw-hist-desc">{{ h.desc || typeLabel(h.type, h.subtype) }}</div>
                <div class="rw-hist-time">{{ formatTime(h.createdAt) }}</div>
              </div>
              <div class="rw-hist-pts">+{{ h.amount }}</div>
            </div>
          </div>

          <!-- Load more -->
          <template v-if="reward.history.length > 5">
            <button v-if="!showMore" class="rw-load-more-btn" @click="showMore = true">
              ดูเพิ่มเติม {{ reward.history.length - 5 }} รายการ ↓
            </button>
            <template v-else>
              <div class="rw-more-label">รายการก่อนหน้า ({{ reward.history.length - 5 }} รายการ)</div>
              <div class="rw-history-scroll">
                <div v-for="h in reward.history.slice(5)" :key="h.id" class="rw-hist-row rw-hist-row--old">
                  <div class="rw-hist-icon">{{ typeEmoji(h.type, h.subtype) }}</div>
                  <div class="rw-hist-info">
                    <div class="rw-hist-desc">{{ h.desc || typeLabel(h.type, h.subtype) }}</div>
                    <div class="rw-hist-time">{{ formatTime(h.createdAt) }}</div>
                  </div>
                  <div class="rw-hist-pts rw-hist-pts--old">+{{ h.amount }}</div>
                </div>
              </div>
            </template>
          </template>
        </div>

        <!-- Loading skeleton for history -->
        <div v-else-if="reward.loading" class="rw-section">
          <div class="rw-section-title">ประวัติคะแนน</div>
          <div v-for="i in 3" :key="i" class="rw-hist-skeleton"></div>
        </div>

        <!-- ── Rewards catalog ── -->
        <div class="rw-section">
          <div class="rw-section-title">🎁 ของรางวัล</div>
          <div v-if="rewardsLoading" class="rw-rewards-grid">
            <div v-for="i in 3" :key="i" class="rw-reward-skeleton"></div>
          </div>
          <div v-else-if="!rewardItems.length" class="rw-rewards-empty">ยังไม่มีของรางวัล</div>
          <div v-else class="rw-rewards-grid">
            <div
              v-for="item in rewardItems"
              :key="item.id"
              class="rw-reward-card"
              :class="{ 'rw-reward-card--afford': reward.total >= item.ptsCost }"
            >
              <div class="rw-reward-img-wrap">
                <img v-if="item.imageUrl" :src="item.imageUrl" class="rw-reward-img" />
                <div v-else class="rw-reward-img-placeholder">🎁</div>
                <div v-if="reward.total >= item.ptsCost" class="rw-reward-afford-badge">✓ แลกได้</div>
              </div>
              <div class="rw-reward-info">
                <div class="rw-reward-name">{{ item.name }}</div>
                <div v-if="item.description" class="rw-reward-desc">{{ item.description }}</div>
                <div class="rw-reward-footer">
                  <span v-if="item.ptsCost" class="rw-reward-pts">{{ item.ptsCost.toLocaleString() }} pts</span>
                  <span v-if="item.stock !== null" class="rw-reward-stock">เหลือ {{ item.stock }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── How to earn section ── -->
        <div class="rw-section">
          <div class="rw-section-title">✨ วิธีสะสมคะแนน</div>
          <div class="rw-earn-list">
            <div
              v-for="item in displayRules"
              :key="item.type"
              class="rw-earn-row"
              :style="{ background: ruleStyle(item).bgColor, borderColor: ruleStyle(item).color + '40' }"
            >
              <div class="rw-earn-icon">{{ item.icon }}</div>
              <div class="rw-earn-info">
                <div class="rw-earn-name">{{ item.name }}</div>
                <div class="rw-earn-desc">{{ item.desc }}</div>
              </div>
              <div class="rw-earn-badge" :style="{ background: ruleStyle(item).color }">+{{ item.pts }} pts</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import html2canvas from 'html2canvas'
import BaseModal from '../shared/BaseModal.vue'
import { useRewardStore }   from '../../stores/reward.js'
import { useUserAuthStore } from '../../stores/userAuth.js'
import { fetchRewards } from '../../services/rewardService.js'

const reward   = useRewardStore()
const userAuth = useUserAuthStore()

const checkinDone  = ref(false)
const checkinError = ref('')
const showMore     = ref(false)
const shareOpen    = ref(false)
const cardRef      = ref(null)
const capturing    = ref(false)

const rewardItems   = ref([])
const rewardsLoading = ref(false)

onMounted(async () => {
  reward.load(userAuth.userName || '', true)
  rewardsLoading.value = true
  try { rewardItems.value = await fetchRewards() } catch {}
  rewardsLoading.value = false
})

// Thai date for display
const todayThai = computed(() => {
  const d   = new Date()
  const days = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์']
  const mons = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
  return `วัน${days[d.getDay()]}ที่ ${d.getDate()} ${mons[d.getMonth()]} ${d.getFullYear() + 543}`
})

const TREE_STAGES = [
  { stage: 0, min: 0,    max: 49,       name: 'เมล็ดพันธุ์',        desc: 'จุดเริ่มต้นแห่งการเดินทาง ทุกต้นไม้ใหญ่เริ่มจากเมล็ดเล็กๆ',              color: '#6EE7B7', trunkTop: null },
  { stage: 1, min: 50,   max: 149,      name: 'ต้นกล้า',            desc: 'เริ่มแตกใบอ่อน พร้อมเติบโตสู่สิ่งที่ยิ่งใหญ่กว่าเดิม',                    color: '#4ADE80', trunkTop: 89   },
  { stage: 2, min: 150,  max: 349,      name: 'ต้นไม้น้อย',         desc: 'รากแผ่กว้าง ลำต้นแข็งแกร่ง กำลังสร้างรากฐานที่มั่นคง',                   color: '#22C55E', trunkTop: 74   },
  { stage: 3, min: 350,  max: 699,      name: 'ต้นไม้กลาง',         desc: 'ร่มเงาเริ่มปรากฏ กิ่งก้านแผ่ออกอย่างมั่นคง เป็นที่พักพิงได้แล้ว',       color: '#16A34A', trunkTop: 58   },
  { stage: 4, min: 700,  max: 1199,     name: 'ต้นไม้ใหญ่',         desc: 'ออกดอกออกผล เป็นแรงบันดาลใจและที่พึ่งพิงให้คนรอบข้าง',                   color: '#15803D', trunkTop: 44   },
  { stage: 5, min: 1200, max: Infinity, name: 'ต้นไม้แห่งปัญญา ✨', desc: 'ยืนหยัดอย่างภาคภูมิ เป็นสัญลักษณ์แห่งปัญญาและพลังของชุมชน DS',          color: '#047857', trunkTop: 30   },
]

const treeData = computed(() => {
  const pts = reward.total || 0
  let current = TREE_STAGES[0]
  for (const s of TREE_STAGES) { if (pts >= s.min) current = s }
  const next = current.stage < TREE_STAGES.length - 1 ? TREE_STAGES[current.stage + 1] : null
  let progress = 100
  if (next) {
    const done = pts - current.min
    progress = Math.min(100, Math.max(2, Math.round((done / (next.min - current.min)) * 100)))
  }
  return {
    ...current,
    nextName:  next?.name ?? null,
    nextPts:   next?.min  ?? null,
    ptsToNext: next ? next.min - pts : 0,
    progress,
  }
})

// ── Level preview navigation ───────────────────────────────────────────────
const previewStage = ref(null)

const viewData = computed(() => {
  const stage = previewStage.value !== null ? previewStage.value : treeData.value.stage
  const s    = TREE_STAGES[stage]
  const next = stage < TREE_STAGES.length - 1 ? TREE_STAGES[stage + 1] : null
  const pts  = reward.total || 0
  let progress = 100
  if (stage > treeData.value.stage)       progress = 0
  else if (stage === treeData.value.stage) progress = treeData.value.progress
  return {
    ...s,
    nextName:  next?.name ?? null,
    nextPts:   next?.min  ?? null,
    ptsToNext: next ? next.min - pts : 0,
    progress,
    isPreview: previewStage.value !== null && previewStage.value !== treeData.value.stage,
  }
})

function setPreview(stage) {
  previewStage.value = stage === treeData.value.stage ? null : stage
}

const checkinRule = computed(() =>
  displayRules.value.find(r => r.type === 'daily_checkin' && !r.subtype)
)
const checkinPts = computed(() => checkinRule.value?.pts ?? 5)

async function captureCard() {
  if (!cardRef.value || capturing.value) return
  capturing.value = true
  try {
    const canvas = await html2canvas(cardRef.value, {
      scale: 2, useCORS: true, backgroundColor: null, logging: false,
    })
    const url = canvas.toDataURL('image/png')
    canvas.toBlob(async blob => {
      const file = new File([blob], 'ds-tree.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], title: 'ต้นไม้ DS Community' }); return } catch {}
      }
      const a = document.createElement('a')
      a.href = url; a.download = `ds-tree-${Date.now()}.png`; a.click()
    })
  } catch (e) { console.error(e) }
  finally { capturing.value = false }
}

async function handleCheckin() {
  checkinError.value = ''
  if (!userAuth.userName) { checkinError.value = 'กรุณาเข้าสู่ระบบก่อน'; return }
  const res = await reward.doCheckin(userAuth.userName)
  if (res.error) { checkinError.value = 'เกิดข้อผิดพลาด กรุณาลองใหม่'; return }
  if (!res.alreadyCheckedIn) checkinDone.value = true
}

// Fallback static rules if GAS not connected yet
const FALLBACK_RULES = [
  { type: 'join_activity',    subtype: '', icon: '🙌', name: 'เข้าร่วมกิจกรรม',       desc: 'เข้าร่วม event / กิจกรรมองค์กร',           pts: 50, color: '#6366F1' },
  { type: 'activity_checkin', subtype: '', icon: '📍', name: 'Check-in กิจกรรม',      desc: 'เช็คอินเข้างานเมื่อถึงสถานที่จัดงาน',       pts: 30, color: '#3B82F6' },
  { type: 'daily_checkin',    subtype: '', icon: '📅', name: 'Check-in รายวัน',        desc: 'เช็คอินประจำวัน (1 ครั้ง/วัน)',              pts: 5,  color: '#06C755' },
  { type: 'send_empathy',     subtype: '', icon: '💌', name: 'ส่ง Empathy ให้เพื่อน', desc: 'ส่งกำลังใจ / ข้อความให้เพื่อนร่วมงาน',    pts: 10, color: '#EC4899' },
  { type: 'birthday_wish',    subtype: '', icon: '🎂', name: 'อวยพรวันเกิดเพื่อน',    desc: 'ส่งคำอวยพรวันเกิดให้เพื่อนร่วมงาน',       pts: 5,  color: '#A855F7' },
]

const displayRules = computed(() => {
  const list = reward.rules.length ? reward.rules : FALLBACK_RULES
  return list.filter(r => String(r.active) !== 'false')
})

// Build a type|subtype → rule map for history lookup
const ruleMap = computed(() => {
  const map = {}
  displayRules.value.forEach(r => {
    map[r.type + '|' + (r.subtype || '')] = r
    // Also keep bare type key for fallback (last one wins = default rule)
    if (!r.subtype) map[r.type] = r
  })
  return map
})

function ruleStyle(rule) {
  const color = rule?.color || '#6366F1'
  return { color, bgColor: color + '18' }  // 18 = ~10% opacity hex
}

function typeEmoji(type, subtype) {
  return ruleMap.value[type + '|' + (subtype || '')]?.icon
    || ruleMap.value[type]?.icon
    || '⭐'
}
function typeLabel(type, subtype) {
  const rule = ruleMap.value[type + '|' + (subtype || '')] || ruleMap.value[type]
  if (!rule) return type
  return rule.name + (subtype ? ` (${subtype})` : '')
}
function formatTime(raw) {
  if (!raw) return ''
  const m = String(raw).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{2}):(\d{2})/)
  if (m) {
    const TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
    return `${+m[1]} ${TH[+m[2] - 1]} ${+m[3] + 543} · ${m[4]}:${m[5]}`
  }
  const d = new Date(raw)
  if (isNaN(d)) return raw
  const TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${d.getDate()} ${TH[d.getMonth()]} ${d.getFullYear() + 543} · ${hh}:${mm}`
}
</script>

<style scoped>
/* ── Wrapper ── */
.rw-wrap { background: #F0F2F5; }

/* ── Header ── */
.rw-header {
  background: linear-gradient(135deg, #06C755 0%, #00A040 100%);
  padding: 0 20px 20px;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  border-radius: 28px 28px 0 0;
}

/* Decorative orbs */
.rw-orb { position: absolute; border-radius: 50%; pointer-events: none; }
.rw-orb-1 { top: -30px; right: -20px; width: 120px; height: 120px; background: radial-gradient(circle, rgba(255,255,255,0.18), transparent 70%); }
.rw-orb-2 { bottom: -20px; left: -10px; width: 90px; height: 90px; background: radial-gradient(circle, rgba(255,255,255,0.1), transparent 70%); }

/* Hero */
.rw-hero { text-align: center; position: relative; z-index: 1; margin-top: 10px; }
.rw-icon { width: 56px; height: 56px; margin: 0 auto 10px; background: rgba(255,255,255,0.2); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 30px; border: 2px solid rgba(255,255,255,0.35); }
.rw-title { font-size: 22px; font-weight: 800; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.15); }
.rw-sub { font-size: 11px; color: rgba(255,255,255,0.85); margin-top: 3px; }

/* Points card */
.rw-pts-card {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  background: rgba(0,0,0,0.15);
  border-radius: 16px;
  padding: 12px 16px;
  margin-top: 14px;
  gap: 16px;
}
.rw-pts-left, .rw-pts-right { flex: 1; text-align: center; }
.rw-pts-divider { width: 1px; height: 36px; background: rgba(255,255,255,0.3); flex-shrink: 0; }
.rw-pts-num { font-size: 26px; font-weight: 900; color: #FFE566; line-height: 1; }
.rw-skeleton-num { display: inline-block; width: 60px; height: 26px; background: rgba(255,255,255,0.2); border-radius: 6px; animation: shimmer 1.4s infinite; }
.rw-pts-label { font-size: 10px; color: rgba(255,255,255,0.75); font-weight: 700; margin-top: 3px; }
.rw-level-badge { font-size: 16px; font-weight: 800; color: white; }

/* Progress */
.rw-progress-wrap { position: relative; z-index: 1; margin-top: 12px; }
.rw-progress-bar { height: 8px; background: rgba(255,255,255,0.25); border-radius: 8px; overflow: hidden; }
.rw-progress-fill { height: 100%; background: #FFE566; border-radius: 8px; transition: width 0.6s ease; }
.rw-progress-label { display: flex; justify-content: space-between; font-size: 10px; color: rgba(255,255,255,0.8); font-weight: 700; margin-top: 4px; }
.rw-legend-label { text-align: center; font-size: 13px; font-weight: 800; color: #FFE566; margin-top: 12px; position: relative; z-index: 1; }

/* ── Body ── */
.rw-body { padding: 12px 12px 24px; }

/* Section */
.rw-section { margin-bottom: 16px; }
.rw-section-title { font-size: 13px; font-weight: 800; color: #6B7280; letter-spacing: 0.5px; margin-bottom: 8px; padding: 0 4px; }

/* History rows */
.rw-history-list { background: white; border-radius: 16px; overflow: hidden; }
.rw-hist-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid #F0F2F5; }
.rw-hist-row:last-child { border-bottom: none; }
.rw-hist-icon { font-size: 22px; width: 32px; text-align: center; flex-shrink: 0; }
.rw-hist-info { flex: 1; min-width: 0; }
.rw-hist-desc { font-size: 13px; font-weight: 600; color: #050505; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rw-hist-time { font-size: 11px; color: #65676B; margin-top: 1px; }
.rw-hist-pts { font-size: 15px; font-weight: 800; color: #06C755; flex-shrink: 0; }

/* Load more button */
.rw-load-more-btn {
  display: block;
  width: 100%;
  margin-top: 6px;
  padding: 10px;
  background: none;
  border: 1.5px dashed #D1D5DB;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  color: #6B7280;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.rw-load-more-btn:active { background: #F3F4F6; color: #374151; }

/* More label */
.rw-more-label {
  font-size: 11px;
  font-weight: 700;
  color: #9CA3AF;
  text-align: center;
  padding: 8px 0 4px;
  letter-spacing: 0.4px;
}

/* Virtual scroll container */
.rw-history-scroll {
  background: white;
  border-radius: 16px;
  overflow-y: auto;
  max-height: 220px;
}
.rw-history-scroll::-webkit-scrollbar { width: 4px; }
.rw-history-scroll::-webkit-scrollbar-track { background: transparent; }
.rw-history-scroll::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 4px; }

/* Dimmed style for older items */
.rw-hist-row--old { opacity: 0.75; }
.rw-hist-pts--old { color: #9CA3AF !important; }

/* Skeleton */
.rw-hist-skeleton { height: 52px; background: linear-gradient(90deg, #F0F2F5 25%, #E4E6EB 50%, #F0F2F5 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 12px; margin-bottom: 4px; }

/* Earn rows */
.rw-earn-list { display: flex; flex-direction: column; gap: 10px; }
.rw-earn-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 18px;
  background: white;
  border: 2px solid #06C75530;
  transition: border-color 0.2s;
}
.rw-earn-icon { font-size: 28px; flex-shrink: 0; width: 36px; text-align: center; }
.rw-earn-info { flex: 1; min-width: 0; }
.rw-earn-name { font-size: 14px; font-weight: 700; color: #111827; line-height: 1.3; }
.rw-earn-desc { font-size: 12px; color: #4B5563; margin-top: 4px; line-height: 1.5; }
.rw-earn-badge {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 15px;
  font-weight: 900;
  color: white;
  flex-shrink: 0;
  white-space: nowrap;
  box-shadow: 0 3px 10px rgba(0,0,0,0.18);
  letter-spacing: 0.3px;
}

/* ── Rewards catalog ── */
.rw-rewards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.rw-rewards-empty {
  font-size: 13px; color: #9CA3AF; text-align: center; padding: 20px 0;
}
.rw-reward-card {
  background: white;
  border: 2px solid #E5E7EB;
  border-radius: 16px;
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.rw-reward-card--afford {
  border-color: #86EFAC;
  box-shadow: 0 2px 12px rgba(34,197,94,0.15);
}
.rw-reward-img-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: #F9FAFB;
  overflow: hidden;
}
.rw-reward-img {
  width: 100%; height: 100%; object-fit: cover;
}
.rw-reward-img-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-size: 40px;
}
.rw-reward-afford-badge {
  position: absolute; bottom: 5px; right: 5px;
  background: #22C55E; color: white;
  font-size: 10px; font-weight: 800;
  padding: 2px 8px; border-radius: 20px;
}
.rw-reward-info {
  padding: 8px 10px 10px;
}
.rw-reward-name {
  font-size: 13px; font-weight: 800; color: #111827; line-height: 1.3;
}
.rw-reward-desc {
  font-size: 11px; color: #6B7280; margin-top: 3px; line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.rw-reward-footer {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 6px;
}
.rw-reward-pts {
  font-size: 13px; font-weight: 900; color: #7C3AED;
}
.rw-reward-stock {
  font-size: 10px; color: #9CA3AF; font-weight: 600;
}
.rw-reward-skeleton {
  height: 160px; background: #F3F4F6; border-radius: 16px;
  animation: shimmer 1.5s infinite;
}

/* ── Daily check-in card ── */
.rw-checkin-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  border: 2px solid #06C75530;
  border-radius: 18px;
  padding: 14px 16px;
  margin-bottom: 16px;
  gap: 10px;
  transition: border-color 0.2s;
}
.rw-checkin-card.done {
  background: #F0FDF4;
  border-color: #BBF7D0;
}
.rw-ci-left { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.rw-ci-icon { font-size: 28px; flex-shrink: 0; }
.rw-ci-info { min-width: 0; }
.rw-ci-title { font-size: 14px; font-weight: 800; color: #050505; }
.rw-ci-date  { font-size: 11px; color: #6B7280; margin-top: 2px; }
.rw-ci-right { flex-shrink: 0; }
.rw-ci-btn {
  background: linear-gradient(135deg, #06C755, #00A040);
  color: white;
  font-size: 13px;
  font-weight: 800;
  border: none;
  border-radius: 22px;
  padding: 9px 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: opacity 0.15s, transform 0.1s;
  box-shadow: 0 2px 8px rgba(6,199,85,0.35);
}
.rw-ci-btn:active { transform: scale(0.96); opacity: 0.85; }
.rw-ci-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.rw-ci-done-badge {
  font-size: 12px;
  font-weight: 800;
  color: #16A34A;
  background: #DCFCE7;
  border-radius: 20px;
  padding: 7px 14px;
}
.rw-ci-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Check-in error */
.rw-checkin-error { font-size: 12px; font-weight: 700; color: #DC2626; background: #FEF2F2; border-radius: 10px; padding: 8px 12px; margin-bottom: 12px; }

/* ── Share button ── */
.rw-tree-share-btn {
  display: block; width: 100%;
  margin-top: 12px;
  padding: 10px;
  background: linear-gradient(135deg, #059669, #047857);
  color: white; font-size: 13px; font-weight: 800;
  border: none; border-radius: 14px; cursor: pointer;
  box-shadow: 0 3px 10px rgba(5,150,105,0.3);
  transition: opacity 0.15s, transform 0.1s;
}
.rw-tree-share-btn:active { transform: scale(0.97); opacity: 0.85; }

/* ── Share overlay ── */
.rw-share-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.7);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.rw-share-wrapper {
  display: flex; flex-direction: column; align-items: center; gap: 14px;
  max-height: 90vh; overflow-y: auto;
}

/* ── Share card (the captured element) ── */
.rw-sc {
  width: 300px;
  background: linear-gradient(160deg, #064e3b 0%, #065f46 45%, #047857 100%);
  border-radius: 24px;
  padding: 22px 20px 18px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.4);
  flex-shrink: 0;
}
.rw-sc-orb {
  position: absolute; border-radius: 50%; pointer-events: none;
}
.rw-sc-orb1 {
  top: -40px; right: -30px; width: 150px; height: 150px;
  background: radial-gradient(circle, rgba(255,255,255,0.08), transparent 70%);
}
.rw-sc-orb2 {
  bottom: -30px; left: -20px; width: 110px; height: 110px;
  background: radial-gradient(circle, rgba(255,255,255,0.06), transparent 70%);
}
.rw-sc-header {
  display: flex; align-items: center; justify-content: space-between;
  position: relative; z-index: 1; margin-bottom: 12px;
}
.rw-sc-brand { font-size: 13px; font-weight: 800; color: rgba(255,255,255,0.9); }
.rw-sc-year  { font-size: 11px; color: rgba(255,255,255,0.5); font-weight: 600; }

.rw-sc-tree-area {
  display: flex; justify-content: center;
  position: relative; z-index: 1; margin-bottom: 10px;
}
.rw-sc-tree-svg {
  width: 160px; height: 173px;
  filter: drop-shadow(0 6px 16px rgba(0,0,0,0.25));
}

.rw-sc-stage-badge {
  display: inline-block;
  font-size: 11px; font-weight: 800; color: white;
  padding: 4px 16px; border-radius: 20px;
  position: relative; z-index: 1;
  margin-bottom: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
}
.rw-sc-name {
  font-size: 20px; font-weight: 900; color: white;
  position: relative; z-index: 1;
  margin-bottom: 14px;
  text-shadow: 0 2px 6px rgba(0,0,0,0.2);
}
.rw-sc-pts {
  font-size: 42px; font-weight: 900; color: #FEF08A; line-height: 1;
  position: relative; z-index: 1;
  text-shadow: 0 3px 10px rgba(0,0,0,0.3);
}
.rw-sc-pts-sub {
  font-size: 11px; color: rgba(255,255,255,0.7); font-weight: 700;
  position: relative; z-index: 1; margin-bottom: 14px; margin-top: 2px;
}
.rw-sc-prog-wrap { position: relative; z-index: 1; margin-bottom: 14px; }
.rw-sc-prog-bar  {
  height: 7px; background: rgba(255,255,255,0.2);
  border-radius: 8px; overflow: hidden; margin-bottom: 4px;
}
.rw-sc-prog-fill { height: 100%; border-radius: 8px; }
.rw-sc-prog-label { font-size: 10px; color: rgba(255,255,255,0.65); font-weight: 700; }
.rw-sc-footer {
  position: relative; z-index: 1;
  font-size: 11px; color: rgba(255,255,255,0.5); font-weight: 600;
  padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,0.12);
}

/* ── Share action buttons ── */
.rw-share-actions { display: flex; gap: 10px; width: 300px; }
.rw-share-dl-btn {
  flex: 1; padding: 13px;
  background: linear-gradient(135deg, #06C755, #059669);
  color: white; font-size: 14px; font-weight: 800;
  border: none; border-radius: 14px; cursor: pointer;
  box-shadow: 0 4px 14px rgba(6,199,85,0.4);
  transition: opacity 0.15s;
}
.rw-share-dl-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.rw-share-close-btn {
  padding: 13px 20px;
  background: rgba(255,255,255,0.15); color: white;
  font-size: 13px; font-weight: 700;
  border: 1.5px solid rgba(255,255,255,0.25); border-radius: 14px; cursor: pointer;
  transition: background 0.15s;
}
.rw-share-close-btn:active { background: rgba(255,255,255,0.25); }

/* ── Tree growth card ── */
.rw-tree-card {
  background: linear-gradient(135deg, #F0FDF4, #DCFCE7);
  border: 2px solid #BBF7D0;
  border-radius: 18px;
  padding: 10px 12px 10px;
  margin-bottom: 12px;
}
.rw-tree-top-row {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 8px;
}
.rw-tree-label { font-size: 13px; font-weight: 800; color: #14532D; }
.rw-tree-stage-tag {
  font-size: 11px; font-weight: 800; color: white;
  padding: 3px 12px; border-radius: 20px;
  transition: background 0.4s;
}
.rw-tree-row {
  display: flex; gap: 8px; align-items: flex-start;
}
.rw-tree-col-left { flex-shrink: 0; width: 108px; }
.rw-tree-col-right { flex: 1; min-width: 0; padding-top: 2px; }
.rw-tree-scene {
  position: relative;
  display: flex; justify-content: center; align-items: flex-end;
  height: 116px;
  margin-bottom: 0;
  border-radius: 16px;
  background: radial-gradient(ellipse at 50% 90%, rgba(74,222,128,0.35) 0%, rgba(187,247,208,0.25) 50%, transparent 75%);
  overflow: hidden;
}
.rw-tree-svg {
  width: 100px; height: 108px;
  filter: drop-shadow(0 6px 14px rgba(20,83,45,0.30)) drop-shadow(0 2px 5px rgba(0,0,0,0.15));
  animation: treeBreathe 4s ease-in-out infinite;
}
@keyframes treeBreathe {
  0%, 100% { transform: scale(1)    translateY(0); }
  50%       { transform: scale(1.03) translateY(-2px); }
}
.rw-float-leaf {
  position: absolute; font-size: 11px; pointer-events: none;
  animation: leafFloat 3s ease-in-out infinite;
}
.rw-fl-1 { top: 10px; left: 8px;   animation-delay: 0s;   animation-duration: 3.3s; }
.rw-fl-2 { top: 26px; right: 8px;  animation-delay: 0.9s; animation-duration: 2.9s; }
.rw-fl-3 { top: 4px;  right: 18px; animation-delay: 0.4s; animation-duration: 3.6s; }
@keyframes leafFloat {
  0%, 100% { transform: translateY(0)    rotate(0deg);  opacity: 0.8; }
  50%       { transform: translateY(-9px) rotate(14deg); opacity: 1;   }
}
.rw-tree-prog-bar {
  height: 6px; background: #BBF7D0; border-radius: 8px; overflow: hidden; margin-bottom: 4px; margin-top: 4px;
}
.rw-tree-prog-fill {
  height: 100%; border-radius: 8px; transition: width 0.8s ease, background 0.4s;
}
.rw-tree-prog-labels {
  display: flex; justify-content: space-between;
  font-size: 10px; font-weight: 700; color: #6B7280;
}

/* ── Level info panel ── */
.rw-level-panel {
  background: #F0FDF4;
  border: 1.5px solid #BBF7D0;
  border-radius: 12px;
  padding: 8px 10px 7px;
  margin-top: 7px;
  text-align: center;
}
.rw-stage-nav {
  display: flex;
  align-items: center;
  gap: 5px;
  justify-content: center;
  margin-bottom: 6px;
}
.rw-stage-nav-btn {
  width: 28px; height: 28px; flex-shrink: 0;
  border-radius: 50%;
  border: 1.5px solid #BBF7D0;
  background: white;
  color: #16A34A;
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, opacity 0.15s;
  padding: 0;
}
.rw-stage-nav-btn:disabled { opacity: 0.25; cursor: not-allowed; }
.rw-stage-nav-btn:not(:disabled):active { background: #DCFCE7; }
.rw-stage-dots {
  display: flex;
  gap: 8px;
  justify-content: center;
}
.rw-stage-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  background: #D1FAE5;
  border: 1.5px solid #BBF7D0;
  cursor: pointer;
  transition: background 0.3s, box-shadow 0.3s, border-color 0.3s, transform 0.2s;
}
.rw-level-row {
  display: flex; align-items: center; gap: 7px; justify-content: center;
  margin-bottom: 5px;
}
.rw-level-num {
  font-size: 15px; font-weight: 900; line-height: 1;
}
.rw-level-name-txt {
  font-size: 13px; font-weight: 800;
}
.rw-level-desc-txt {
  font-size: 12px; color: #374151; line-height: 1.65; margin-bottom: 5px;
}
.rw-level-range-txt {
  font-size: 11px; color: #9CA3AF; font-weight: 600;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
