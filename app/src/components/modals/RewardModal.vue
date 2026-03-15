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
        <div class="rw-checkin-card" :class="{ done: reward.checkedInToday }">
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
              <span v-else>รับ +{{ checkinPts }} pts</span>
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

          <div class="rw-tree-scene">
            <svg class="rw-tree-svg" viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <!-- Chibi trunk: radial, warm amber highlight center → dark brown edge -->
                <radialGradient id="rw3-trunk" cx="35%" cy="30%" r="65%">
                  <stop offset="0%"   stop-color="#FCD34D"/>
                  <stop offset="45%"  stop-color="#D97706"/>
                  <stop offset="100%" stop-color="#78350F"/>
                </radialGradient>
                <!-- Chibi foliage: bright candy-ball (light center → medium edge, NO dark) -->
                <radialGradient id="rw3-f0" cx="36%" cy="30%" r="64%">
                  <stop offset="0%"   stop-color="#ECFDF5"/>
                  <stop offset="100%" stop-color="#86EFAC"/>
                </radialGradient>
                <radialGradient id="rw3-f1" cx="36%" cy="30%" r="64%">
                  <stop offset="0%"   stop-color="#D1FAE5"/>
                  <stop offset="100%" stop-color="#4ADE80"/>
                </radialGradient>
                <radialGradient id="rw3-f2" cx="36%" cy="30%" r="64%">
                  <stop offset="0%"   stop-color="#A7F3D0"/>
                  <stop offset="100%" stop-color="#22C55E"/>
                </radialGradient>
                <radialGradient id="rw3-f3" cx="36%" cy="30%" r="64%">
                  <stop offset="0%"   stop-color="#86EFAC"/>
                  <stop offset="100%" stop-color="#16A34A"/>
                </radialGradient>
                <radialGradient id="rw3-f4" cx="36%" cy="30%" r="64%">
                  <stop offset="0%"   stop-color="#6EE7B7"/>
                  <stop offset="100%" stop-color="#15803D"/>
                </radialGradient>
                <radialGradient id="rw3-f5" cx="36%" cy="30%" r="64%">
                  <stop offset="0%"   stop-color="#A7F3D0"/>
                  <stop offset="100%" stop-color="#059669"/>
                </radialGradient>
                <!-- Fruits: bright cute gradients -->
                <radialGradient id="rw3-fr" cx="36%" cy="28%" r="62%">
                  <stop offset="0%"   stop-color="#FCA5A5"/>
                  <stop offset="100%" stop-color="#DC2626"/>
                </radialGradient>
                <radialGradient id="rw3-fo" cx="36%" cy="28%" r="62%">
                  <stop offset="0%"   stop-color="#FED7AA"/>
                  <stop offset="100%" stop-color="#EA580C"/>
                </radialGradient>
                <radialGradient id="rw3-fy" cx="36%" cy="28%" r="62%">
                  <stop offset="0%"   stop-color="#FEF9C3"/>
                  <stop offset="100%" stop-color="#CA8A04"/>
                </radialGradient>
                <radialGradient id="rw3-gs" cx="50%" cy="40%" r="50%">
                  <stop offset="0%"   stop-color="rgba(0,0,0,0.22)"/>
                  <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
                </radialGradient>
              </defs>

              <ellipse cx="60" cy="126" rx="38" ry="5.5" fill="url(#rw3-gs)"/>

              <g>
                <animateTransform attributeName="transform" type="rotate"
                  values="-2 60 119; 2 60 119; -2 60 119"
                  keyTimes="0;0.5;1" dur="3s" repeatCount="indefinite"
                  calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>

                <!-- ── Stage 0: chibi sprout ── -->
                <g v-if="viewData.stage === 0">
                  <ellipse cx="60" cy="121" rx="14" ry="5.5" fill="#B45309" stroke="#78350F" stroke-width="1.5"/>
                  <path d="M60 121 Q59 115 61 108" stroke="#22C55E" stroke-width="3" fill="none" stroke-linecap="round"/>
                  <!-- Left leaf -->
                  <ellipse cx="51" cy="114" rx="9" ry="6" fill="url(#rw3-f1)" stroke="#22C55E" stroke-width="1.5" transform="rotate(-35 51 114)"/>
                  <circle cx="48.5" cy="111" r="2" fill="rgba(255,255,255,0.65)"/>
                  <!-- Right leaf -->
                  <ellipse cx="69" cy="112" rx="9" ry="6" fill="url(#rw3-f0)" stroke="#22C55E" stroke-width="1.5" transform="rotate(35 69 112)"/>
                  <circle cx="66.5" cy="109" r="2" fill="rgba(255,255,255,0.65)"/>
                  <!-- Top bud -->
                  <circle cx="60" cy="104" r="6.5" fill="url(#rw3-f0)" stroke="#22C55E" stroke-width="1.5"/>
                  <circle cx="57.5" cy="101.5" r="2.2" fill="rgba(255,255,255,0.7)"/>
                </g>

                <!-- ── Trunk (stage 1+): chibi rounded rect ── -->
                <g v-if="viewData.stage >= 1">
                  <!-- Shadow -->
                  <rect :x="58" :y="viewData.trunkTop+2" width="7" :height="119-viewData.trunkTop" rx="3.5" fill="#78350F" opacity="0.35"/>
                  <!-- Main trunk -->
                  <rect :x="56" :y="viewData.trunkTop" width="8" :height="119-viewData.trunkTop" rx="4" fill="url(#rw3-trunk)" stroke="#78350F" stroke-width="1.5"/>
                  <!-- Shine streak -->
                  <rect :x="58" :y="viewData.trunkTop+5" width="2.5" :height="Math.max(4, Math.round((119-viewData.trunkTop)*0.38))" rx="1.5" fill="rgba(255,255,255,0.32)"/>
                </g>

                <!-- ── Roots (stage 2+): cute rounded ── -->
                <g v-if="viewData.stage >= 2">
                  <path d="M56 118 Q44 118 35 123" stroke="#78350F" stroke-width="5.5" fill="none" stroke-linecap="round"/>
                  <path d="M64 118 Q76 118 85 123" stroke="#78350F" stroke-width="5.5" fill="none" stroke-linecap="round"/>
                  <path d="M55 119 Q47 121 40 125" stroke="#92400E" stroke-width="3"   fill="none" stroke-linecap="round"/>
                  <path d="M65 119 Q73 121 80 125" stroke="#92400E" stroke-width="3"   fill="none" stroke-linecap="round"/>
                </g>

                <!-- ── Stage 1: chibi sapling ── -->
                <g v-if="viewData.stage === 1">
                  <!-- Side balls -->
                  <circle cx="43" cy="96" r="14" fill="url(#rw3-f3)" stroke="#15803D" stroke-width="2"/>
                  <circle cx="40" cy="93"  r="4.5" fill="rgba(255,255,255,0.6)"/>
                  <circle cx="77" cy="95" r="14" fill="url(#rw3-f3)" stroke="#15803D" stroke-width="2"/>
                  <circle cx="74" cy="92"  r="4.5" fill="rgba(255,255,255,0.6)"/>
                  <!-- Main crown -->
                  <circle cx="60" cy="84" r="20" fill="url(#rw3-f2)" stroke="#16A34A" stroke-width="2">
                    <animate attributeName="r" values="20;21.5;20" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                  </circle>
                  <circle cx="53" cy="77" r="6.5" fill="rgba(255,255,255,0.58)"/>
                  <circle cx="66" cy="88" r="2.5" fill="#16A34A" opacity="0.4"/>
                  <circle cx="55" cy="91" r="2"   fill="#16A34A" opacity="0.35"/>
                  <!-- Upper -->
                  <circle cx="61" cy="68" r="15" fill="url(#rw3-f1)" stroke="#22C55E" stroke-width="2">
                    <animate attributeName="r" values="15;16.5;15" dur="2.7s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                  </circle>
                  <circle cx="55" cy="62" r="4.5" fill="rgba(255,255,255,0.62)"/>
                  <!-- Top -->
                  <circle cx="61" cy="55" r="11" fill="url(#rw3-f0)" stroke="#22C55E" stroke-width="2">
                    <animate attributeName="r" values="11;12.5;11" dur="2.4s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                  </circle>
                  <circle cx="56" cy="50" r="3.5" fill="rgba(255,255,255,0.68)"/>
                </g>

                <!-- ── Stage 2: chibi small tree + flowers ── -->
                <g v-if="viewData.stage === 2">
                  <!-- Back balls -->
                  <circle cx="38" cy="95" r="17" fill="url(#rw3-f4)" stroke="#15803D" stroke-width="2"/>
                  <circle cx="34" cy="91" r="5"   fill="rgba(255,255,255,0.5)"/>
                  <circle cx="82" cy="93" r="17" fill="url(#rw3-f4)" stroke="#15803D" stroke-width="2"/>
                  <circle cx="78" cy="89" r="5"   fill="rgba(255,255,255,0.5)"/>
                  <!-- Mid -->
                  <circle cx="44" cy="82" r="18" fill="url(#rw3-f3)" stroke="#15803D" stroke-width="2"/>
                  <circle cx="76" cy="80" r="18" fill="url(#rw3-f3)" stroke="#15803D" stroke-width="2"/>
                  <!-- Main -->
                  <circle cx="60" cy="86" r="23" fill="url(#rw3-f3)" stroke="#16A34A" stroke-width="2">
                    <animate attributeName="r" values="23;24.5;23" dur="3.5s" repeatCount="indefinite" begin="0.2s" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                  </circle>
                  <circle cx="51" cy="77" r="7"   fill="rgba(255,255,255,0.52)"/>
                  <circle cx="67" cy="90" r="2.8" fill="#16A34A" opacity="0.4"/>
                  <!-- Upper -->
                  <circle cx="60" cy="69" r="19" fill="url(#rw3-f2)" stroke="#22C55E" stroke-width="2">
                    <animate attributeName="r" values="19;20.5;19" dur="3s" repeatCount="indefinite" begin="0.5s" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                  </circle>
                  <circle cx="52" cy="61" r="5.8" fill="rgba(255,255,255,0.56)"/>
                  <!-- Crown -->
                  <circle cx="61" cy="53" r="15" fill="url(#rw3-f1)" stroke="#22C55E" stroke-width="2">
                    <animate attributeName="r" values="15;16.5;15" dur="2.7s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                  </circle>
                  <circle cx="55" cy="46" r="4.5" fill="rgba(255,255,255,0.62)"/>
                  <!-- Top -->
                  <circle cx="61" cy="40" r="11" fill="url(#rw3-f0)" stroke="#22C55E" stroke-width="2">
                    <animate attributeName="r" values="11;12.5;11" dur="2.4s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                  </circle>
                  <circle cx="56" cy="34" r="3.5" fill="rgba(255,255,255,0.68)"/>
                  <!-- Cute flowers -->
                  <g><ellipse cx="35" cy="86" rx="3.5" ry="5.5" fill="#FBCFE8"/><ellipse cx="35" cy="86" rx="5.5" ry="3.5" fill="#FBCFE8"/><circle cx="35" cy="86" r="3" fill="#FDE047"/><circle cx="34" cy="85" r="0.9" fill="rgba(255,255,255,0.8)"/></g>
                  <g><ellipse cx="85" cy="84" rx="3.5" ry="5.5" fill="#FBCFE8"/><ellipse cx="85" cy="84" rx="5.5" ry="3.5" fill="#FBCFE8"/><circle cx="85" cy="84" r="3" fill="#FDE047"/><circle cx="84" cy="83" r="0.9" fill="rgba(255,255,255,0.8)"/></g>
                  <g><ellipse cx="46" cy="71" rx="3"   ry="4.5" fill="#BAE6FD"/><ellipse cx="46" cy="71" rx="4.5" ry="3"   fill="#BAE6FD"/><circle cx="46" cy="71" r="2.5" fill="#FBBF24"/><circle cx="45" cy="70" r="0.8" fill="rgba(255,255,255,0.8)"/></g>
                </g>

                <!-- ── Stage 3+: large chibi canopy ── -->
                <g v-if="viewData.stage >= 3">
                  <!-- Far back -->
                  <circle cx="30" cy="97" r="19" fill="url(#rw3-f5)" stroke="#059669" stroke-width="2"/>
                  <circle cx="26" cy="93" r="5.5" fill="rgba(255,255,255,0.44)"/>
                  <circle cx="90" cy="95" r="19" fill="url(#rw3-f5)" stroke="#059669" stroke-width="2"/>
                  <circle cx="86" cy="91" r="5.5" fill="rgba(255,255,255,0.44)"/>
                  <!-- Inner back -->
                  <circle cx="41" cy="84" r="21" fill="url(#rw3-f4)" stroke="#15803D" stroke-width="2"/>
                  <circle cx="80" cy="82" r="21" fill="url(#rw3-f4)" stroke="#15803D" stroke-width="2"/>
                  <!-- Main base -->
                  <circle cx="60" cy="90" r="27" fill="url(#rw3-f4)" stroke="#15803D" stroke-width="2">
                    <animate attributeName="r" values="27;28.5;27" dur="3.5s" repeatCount="indefinite" begin="0.2s" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                  </circle>
                  <circle cx="49" cy="78" r="8.5" fill="rgba(255,255,255,0.46)"/>
                  <circle cx="68" cy="93" r="3.5" fill="#15803D" opacity="0.38"/>
                  <!-- Front mid clusters -->
                  <circle cx="43" cy="75" r="21" fill="url(#rw3-f3)" stroke="#16A34A" stroke-width="2"/>
                  <circle cx="37" cy="67" r="6.5" fill="rgba(255,255,255,0.5)"/>
                  <circle cx="77" cy="73" r="21" fill="url(#rw3-f3)" stroke="#16A34A" stroke-width="2"/>
                  <circle cx="71" cy="65" r="6.5" fill="rgba(255,255,255,0.5)"/>
                  <!-- Centre front -->
                  <circle cx="60" cy="75" r="24" fill="url(#rw3-f3)" stroke="#16A34A" stroke-width="2">
                    <animate attributeName="r" values="24;25.5;24" dur="3s" repeatCount="indefinite" begin="0.5s" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                  </circle>
                  <circle cx="49" cy="65" r="7.5" fill="rgba(255,255,255,0.47)"/>
                  <!-- Upper -->
                  <circle cx="60" cy="58" r="21" fill="url(#rw3-f2)" stroke="#22C55E" stroke-width="2">
                    <animate attributeName="r" values="21;22.5;21" dur="3.2s" repeatCount="indefinite" begin="0.3s" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                  </circle>
                  <circle cx="50" cy="48" r="6.5" fill="rgba(255,255,255,0.5)"/>
                  <!-- Flowers (stage 3+ base) -->
                  <g><ellipse cx="27" cy="88" rx="4" ry="6"   fill="#FBCFE8"/><ellipse cx="27" cy="88" rx="6"   ry="4" fill="#FBCFE8"/><circle cx="27" cy="88" r="3.5" fill="#FDE047"/><circle cx="26" cy="87" r="1"   fill="rgba(255,255,255,0.8)"/></g>
                  <g><ellipse cx="93" cy="86" rx="4" ry="6"   fill="#FBCFE8"/><ellipse cx="93" cy="86" rx="6"   ry="4" fill="#FBCFE8"/><circle cx="93" cy="86" r="3.5" fill="#FDE047"/><circle cx="92" cy="85" r="1"   fill="rgba(255,255,255,0.8)"/></g>
                  <g><ellipse cx="40" cy="63" rx="3.5" ry="5.5" fill="#BAE6FD"/><ellipse cx="40" cy="63" rx="5.5" ry="3.5" fill="#BAE6FD"/><circle cx="40" cy="63" r="3"   fill="#FBBF24"/><circle cx="39" cy="62" r="0.8" fill="rgba(255,255,255,0.8)"/></g>
                  <g><ellipse cx="80" cy="61" rx="3.5" ry="5.5" fill="#FCA5A5"/><ellipse cx="80" cy="61" rx="5.5" ry="3.5" fill="#FCA5A5"/><circle cx="80" cy="61" r="3"   fill="#FDE047"/><circle cx="79" cy="60" r="0.8" fill="rgba(255,255,255,0.8)"/></g>
                  <!-- Stage 3 specific top -->
                  <g v-if="viewData.stage === 3">
                    <circle cx="61" cy="41" r="17" fill="url(#rw3-f1)" stroke="#22C55E" stroke-width="2">
                      <animate attributeName="r" values="17;18.5;17" dur="2.7s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                    </circle>
                    <circle cx="53" cy="33" r="5.5" fill="rgba(255,255,255,0.58)"/>
                    <circle cx="61" cy="26" r="12" fill="url(#rw3-f0)" stroke="#22C55E" stroke-width="2">
                      <animate attributeName="r" values="12;13.5;12" dur="2.4s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                    </circle>
                    <circle cx="56" cy="20" r="3.8" fill="rgba(255,255,255,0.68)"/>
                    <g><ellipse cx="74" cy="34" rx="3" ry="4.5" fill="#FBCFE8"/><ellipse cx="74" cy="34" rx="4.5" ry="3" fill="#FBCFE8"/><circle cx="74" cy="34" r="2.5" fill="#FDE047"/></g>
                  </g>
                </g>

                <!-- ── Stage 4+: chibi fruits + tall crown ── -->
                <g v-if="viewData.stage >= 4">
                  <!-- Cute fruits with stroke + highlight -->
                  <line x1="36" y1="100" x2="37" y2="105" stroke="#78350F" stroke-width="1.5"/><circle cx="37"  cy="108" r="6.5" fill="url(#rw3-fr)" stroke="#DC2626" stroke-width="1.2"/><circle cx="35"  cy="105.5" r="2"   fill="rgba(255,255,255,0.65)"/>
                  <line x1="84" y1="98"  x2="83" y2="103" stroke="#78350F" stroke-width="1.5"/><circle cx="83"  cy="106" r="6.5" fill="url(#rw3-fo)" stroke="#EA580C" stroke-width="1.2"/><circle cx="81"  cy="103.5" r="2"   fill="rgba(255,255,255,0.65)"/>
                  <line x1="40" y1="83"  x2="41" y2="88"  stroke="#78350F" stroke-width="1.3"/><circle cx="41"  cy="91"  r="5.5" fill="url(#rw3-fy)" stroke="#CA8A04" stroke-width="1.2"/><circle cx="39.5" cy="88.5" r="1.7" fill="rgba(255,255,255,0.6)"/>
                  <line x1="80" y1="81"  x2="79" y2="86"  stroke="#78350F" stroke-width="1.3"/><circle cx="79"  cy="89"  r="5.5" fill="url(#rw3-fr)" stroke="#DC2626" stroke-width="1.2"/><circle cx="77.5" cy="86.5" r="1.7" fill="rgba(255,255,255,0.6)"/>
                  <line x1="47" y1="66"  x2="48" y2="71"  stroke="#78350F" stroke-width="1.2"/><circle cx="48"  cy="74"  r="5"   fill="url(#rw3-fo)" stroke="#EA580C" stroke-width="1.1"/><circle cx="46.5" cy="71.5" r="1.5" fill="rgba(255,255,255,0.58)"/>
                  <line x1="73" y1="64"  x2="72" y2="69"  stroke="#78350F" stroke-width="1.2"/><circle cx="72"  cy="72"  r="5"   fill="url(#rw3-fy)" stroke="#CA8A04" stroke-width="1.1"/><circle cx="70.5" cy="69.5" r="1.5" fill="rgba(255,255,255,0.58)"/>
                  <line x1="53" y1="50"  x2="54" y2="55"  stroke="#78350F" stroke-width="1.1"/><circle cx="54"  cy="58"  r="4.5" fill="url(#rw3-fr)" stroke="#DC2626" stroke-width="1"/><circle cx="52.5" cy="55.5" r="1.3" fill="rgba(255,255,255,0.58)"/>
                  <line x1="67" y1="51"  x2="66" y2="56"  stroke="#78350F" stroke-width="1.1"/><circle cx="66"  cy="59"  r="4.5" fill="url(#rw3-fo)" stroke="#EA580C" stroke-width="1"/><circle cx="64.5" cy="56.5" r="1.3" fill="rgba(255,255,255,0.58)"/>
                  <!-- Stage 4 crown -->
                  <g v-if="viewData.stage === 4">
                    <circle cx="44" cy="48" r="17" fill="url(#rw3-f2)" stroke="#22C55E" stroke-width="2"/>
                    <circle cx="38" cy="40" r="5"   fill="rgba(255,255,255,0.52)"/>
                    <circle cx="76" cy="46" r="17" fill="url(#rw3-f2)" stroke="#22C55E" stroke-width="2"/>
                    <circle cx="70" cy="38" r="5"   fill="rgba(255,255,255,0.52)"/>
                    <circle cx="60" cy="36" r="21" fill="url(#rw3-f1)" stroke="#22C55E" stroke-width="2">
                      <animate attributeName="r" values="21;22.5;21" dur="2.8s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                    </circle>
                    <circle cx="50" cy="25" r="6.5" fill="rgba(255,255,255,0.54)"/>
                    <circle cx="60" cy="17" r="14" fill="url(#rw3-f0)" stroke="#22C55E" stroke-width="2">
                      <animate attributeName="r" values="14;15.5;14" dur="2.4s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                    </circle>
                    <circle cx="54" cy="10" r="4.5" fill="rgba(255,255,255,0.65)"/>
                    <g><ellipse cx="32" cy="40" rx="3.5" ry="5.5" fill="#FBCFE8"/><ellipse cx="32" cy="40" rx="5.5" ry="3.5" fill="#FBCFE8"/><circle cx="32" cy="40" r="3" fill="#FDE047"/></g>
                    <g><ellipse cx="88" cy="38" rx="3.5" ry="5.5" fill="#BAE6FD"/><ellipse cx="88" cy="38" rx="5.5" ry="3.5" fill="#BAE6FD"/><circle cx="88" cy="38" r="3" fill="#FDE047"/></g>
                    <g><ellipse cx="53" cy="26" rx="3"   ry="4.5" fill="#FCA5A5"/><ellipse cx="53" cy="26" rx="4.5" ry="3"   fill="#FCA5A5"/><circle cx="53" cy="26" r="2.5" fill="#FDE047"/></g>
                  </g>
                </g>

                <!-- ── Stage 5: ancient magical chibi ── -->
                <g v-if="viewData.stage >= 5">
                  <path d="M53 102 Q36 97 21 104" stroke="#78350F" stroke-width="3.5" fill="none" stroke-linecap="round"/>
                  <path d="M67 100 Q84 95 99 102" stroke="#78350F" stroke-width="3.5" fill="none" stroke-linecap="round"/>
                  <!-- Far-side chibi blobs -->
                  <circle cx="19"  cy="100" r="21" fill="url(#rw3-f5)" stroke="#047857" stroke-width="2"/>
                  <circle cx="13"  cy="93"  r="6.5" fill="rgba(255,255,255,0.42)"/>
                  <circle cx="101" cy="98"  r="21" fill="url(#rw3-f5)" stroke="#047857" stroke-width="2"/>
                  <circle cx="95"  cy="91"  r="6.5" fill="rgba(255,255,255,0.42)"/>
                  <!-- Grand centre crown -->
                  <circle cx="44" cy="47" r="19" fill="url(#rw3-f5)" stroke="#047857" stroke-width="2"/>
                  <circle cx="37" cy="39" r="5.8" fill="rgba(255,255,255,0.46)"/>
                  <circle cx="76" cy="45" r="19" fill="url(#rw3-f5)" stroke="#047857" stroke-width="2"/>
                  <circle cx="69" cy="37" r="5.8" fill="rgba(255,255,255,0.46)"/>
                  <circle cx="60" cy="34" r="23" fill="url(#rw3-f5)" stroke="#047857" stroke-width="2">
                    <animate attributeName="r" values="23;25;23" dur="2.8s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                  </circle>
                  <circle cx="49" cy="22" r="7"   fill="rgba(255,255,255,0.46)"/>
                  <circle cx="60" cy="15" r="15" fill="url(#rw3-f5)" stroke="#047857" stroke-width="2">
                    <animate attributeName="r" values="15;17;15" dur="2.3s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                  </circle>
                  <circle cx="53" cy="7"  r="4.8" fill="rgba(255,255,255,0.5)"/>
                  <!-- Many flowers (magical) -->
                  <g><ellipse cx="7"   cy="91" rx="4"   ry="6"   fill="#FBCFE8"/><ellipse cx="7"   cy="91" rx="6"   ry="4"   fill="#FBCFE8"/><circle cx="7"   cy="91" r="3.5" fill="#FDE047"/><circle cx="6"   cy="90" r="1"   fill="rgba(255,255,255,0.8)"/></g>
                  <g><ellipse cx="113" cy="89" rx="4"   ry="6"   fill="#BAE6FD"/><ellipse cx="113" cy="89" rx="6"   ry="4"   fill="#BAE6FD"/><circle cx="113" cy="89" r="3.5" fill="#FDE047"/><circle cx="112" cy="88" r="1"   fill="rgba(255,255,255,0.8)"/></g>
                  <g><ellipse cx="32"  cy="35" rx="3.5" ry="5.5" fill="#FCA5A5"/><ellipse cx="32"  cy="35" rx="5.5" ry="3.5" fill="#FCA5A5"/><circle cx="32"  cy="35" r="3"   fill="#FDE047"/></g>
                  <g><ellipse cx="89"  cy="33" rx="3.5" ry="5.5" fill="#FBCFE8"/><ellipse cx="89"  cy="33" rx="5.5" ry="3.5" fill="#FBCFE8"/><circle cx="89"  cy="33" r="3"   fill="#A78BFA"/></g>
                  <g><ellipse cx="50"  cy="19" rx="3"   ry="4.5" fill="#BAE6FD"/><ellipse cx="50"  cy="19" rx="4.5" ry="3"   fill="#BAE6FD"/><circle cx="50"  cy="19" r="2.5" fill="#FDE047"/></g>
                  <!-- Chibi sparkle stars -->
                  <g>
                    <circle cx="8" cy="63" r="3.5" fill="#FEF08A" stroke="#FCD34D" stroke-width="1">
                      <animate attributeName="r"       values="3.5;5;3.5" dur="1.8s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values="1;0.2;1"   dur="1.8s" repeatCount="indefinite"/>
                    </circle>
                    <line x1="5" y1="60" x2="11" y2="66" stroke="#FCD34D" stroke-width="1.5" stroke-linecap="round"><animate attributeName="opacity" values="1;0.1;1" dur="1.8s" repeatCount="indefinite"/></line>
                    <line x1="11" y1="60" x2="5" y2="66" stroke="#FCD34D" stroke-width="1.5" stroke-linecap="round"><animate attributeName="opacity" values="1;0.1;1" dur="1.8s" repeatCount="indefinite"/></line>
                    <line x1="8" y1="58" x2="8" y2="68" stroke="#FCD34D" stroke-width="1.5" stroke-linecap="round"><animate attributeName="opacity" values="1;0.1;1" dur="1.8s" repeatCount="indefinite"/></line>
                  </g>
                  <g>
                    <circle cx="112" cy="57" r="3" fill="#FEF08A" stroke="#FCD34D" stroke-width="1">
                      <animate attributeName="r"       values="3;4.5;3"   dur="1.8s" repeatCount="indefinite" begin="0.9s"/>
                      <animate attributeName="opacity" values="0.2;1;0.2" dur="1.8s" repeatCount="indefinite" begin="0.9s"/>
                    </circle>
                    <line x1="109" y1="54" x2="115" y2="60" stroke="#FCD34D" stroke-width="1.5" stroke-linecap="round"><animate attributeName="opacity" values="0.1;1;0.1" dur="1.8s" repeatCount="indefinite" begin="0.9s"/></line>
                    <line x1="115" y1="54" x2="109" y2="60" stroke="#FCD34D" stroke-width="1.5" stroke-linecap="round"><animate attributeName="opacity" values="0.1;1;0.1" dur="1.8s" repeatCount="indefinite" begin="0.9s"/></line>
                    <line x1="112" y1="52" x2="112" y2="62" stroke="#FCD34D" stroke-width="1.5" stroke-linecap="round"><animate attributeName="opacity" values="0.1;1;0.1" dur="1.8s" repeatCount="indefinite" begin="0.9s"/></line>
                  </g>
                </g>

                <!-- Cute floating particles (stage 2+): pink, blue, yellow -->
                <g v-if="viewData.stage >= 2">
                  <circle cx="52" cy="78" r="2.8" fill="#FBCFE8" opacity="0">
                    <animate attributeName="cy"      values="78;52;26" dur="4s"   repeatCount="indefinite" begin="0s"/>
                    <animate attributeName="cx"      values="52;47;42" dur="4s"   repeatCount="indefinite" begin="0s"/>
                    <animate attributeName="opacity" values="0;0.9;0"  dur="4s"   repeatCount="indefinite" begin="0s"/>
                  </circle>
                  <circle cx="68" cy="82" r="2.2" fill="#BAE6FD" opacity="0">
                    <animate attributeName="cy"      values="82;58;34"  dur="3.6s" repeatCount="indefinite" begin="1.5s"/>
                    <animate attributeName="cx"      values="68;73;78"  dur="3.6s" repeatCount="indefinite" begin="1.5s"/>
                    <animate attributeName="opacity" values="0;0.88;0"  dur="3.6s" repeatCount="indefinite" begin="1.5s"/>
                  </circle>
                  <circle cx="60" cy="72" r="2.2" fill="#FDE047" opacity="0">
                    <animate attributeName="cy"      values="72;48;24" dur="5s"   repeatCount="indefinite" begin="0.9s"/>
                    <animate attributeName="cx"      values="60;56;52" dur="5s"   repeatCount="indefinite" begin="0.9s"/>
                    <animate attributeName="opacity" values="0;0.85;0" dur="5s"   repeatCount="indefinite" begin="0.9s"/>
                  </circle>
                </g>
              </g>
            </svg>

            <div v-if="viewData.stage >= 5" class="rw-float-leaf rw-fl-3">✨</div>
          </div>

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
          </div>

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
                      <!-- Chibi trunk: radial, warm amber highlight center → dark brown edge -->
                      <radialGradient id="rwsc-trunk" cx="35%" cy="30%" r="65%">
                        <stop offset="0%"   stop-color="#FCD34D"/>
                        <stop offset="45%"  stop-color="#D97706"/>
                        <stop offset="100%" stop-color="#78350F"/>
                      </radialGradient>
                      <!-- Chibi foliage: candy-ball (bright center → medium edge, NO dark) -->
                      <radialGradient id="rwsc-f0" cx="36%" cy="30%" r="64%">
                        <stop offset="0%"   stop-color="#ECFDF5"/>
                        <stop offset="100%" stop-color="#86EFAC"/>
                      </radialGradient>
                      <radialGradient id="rwsc-f1" cx="36%" cy="30%" r="64%">
                        <stop offset="0%"   stop-color="#D1FAE5"/>
                        <stop offset="100%" stop-color="#4ADE80"/>
                      </radialGradient>
                      <radialGradient id="rwsc-f2" cx="36%" cy="30%" r="64%">
                        <stop offset="0%"   stop-color="#A7F3D0"/>
                        <stop offset="100%" stop-color="#22C55E"/>
                      </radialGradient>
                      <radialGradient id="rwsc-f3" cx="36%" cy="30%" r="64%">
                        <stop offset="0%"   stop-color="#86EFAC"/>
                        <stop offset="100%" stop-color="#16A34A"/>
                      </radialGradient>
                      <radialGradient id="rwsc-f4" cx="36%" cy="30%" r="64%">
                        <stop offset="0%"   stop-color="#6EE7B7"/>
                        <stop offset="100%" stop-color="#15803D"/>
                      </radialGradient>
                      <radialGradient id="rwsc-f5" cx="36%" cy="30%" r="64%">
                        <stop offset="0%"   stop-color="#A7F3D0"/>
                        <stop offset="100%" stop-color="#059669"/>
                      </radialGradient>
                      <!-- Fruits: bright cute gradients -->
                      <radialGradient id="rwsc-fr" cx="36%" cy="28%" r="62%">
                        <stop offset="0%"   stop-color="#FCA5A5"/>
                        <stop offset="100%" stop-color="#DC2626"/>
                      </radialGradient>
                      <radialGradient id="rwsc-fo" cx="36%" cy="28%" r="62%">
                        <stop offset="0%"   stop-color="#FED7AA"/>
                        <stop offset="100%" stop-color="#EA580C"/>
                      </radialGradient>
                      <radialGradient id="rwsc-fy" cx="36%" cy="28%" r="62%">
                        <stop offset="0%"   stop-color="#FEF9C3"/>
                        <stop offset="100%" stop-color="#CA8A04"/>
                      </radialGradient>
                      <radialGradient id="rwsc-gs" cx="50%" cy="40%" r="50%">
                        <stop offset="0%"   stop-color="rgba(0,0,0,0.22)"/>
                        <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
                      </radialGradient>
                    </defs>

                    <!-- Grass + ground shadow -->
                    <ellipse cx="60" cy="122" rx="46" ry="9" fill="#BBF7D0"/>
                    <ellipse cx="60" cy="119" rx="38" ry="5" fill="#86EFAC"/>
                    <ellipse cx="60" cy="126" rx="36" ry="5" fill="url(#rwsc-gs)"/>

                    <g>
                      <animateTransform attributeName="transform" type="rotate"
                        values="-2 60 119; 2 60 119; -2 60 119"
                        keyTimes="0;0.5;1" dur="3s" repeatCount="indefinite"
                        calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>

                      <!-- Stage 0: chibi sprout -->
                      <g v-if="treeData.stage === 0">
                        <ellipse cx="60" cy="121" rx="14" ry="5.5" fill="#B45309" stroke="#78350F" stroke-width="1.5"/>
                        <path d="M60 121 Q59 115 61 108" stroke="#22C55E" stroke-width="3" fill="none" stroke-linecap="round"/>
                        <ellipse cx="51" cy="114" rx="9" ry="6" fill="url(#rwsc-f1)" stroke="#22C55E" stroke-width="1.5" transform="rotate(-35 51 114)"/>
                        <circle cx="48.5" cy="111" r="2" fill="rgba(255,255,255,0.65)"/>
                        <ellipse cx="69" cy="112" rx="9" ry="6" fill="url(#rwsc-f0)" stroke="#22C55E" stroke-width="1.5" transform="rotate(35 69 112)"/>
                        <circle cx="66.5" cy="109" r="2" fill="rgba(255,255,255,0.65)"/>
                        <circle cx="60" cy="104" r="6.5" fill="url(#rwsc-f0)" stroke="#22C55E" stroke-width="1.5"/>
                        <circle cx="57.5" cy="101.5" r="2.2" fill="rgba(255,255,255,0.7)"/>
                      </g>

                      <!-- Trunk (stage 1+): chibi rounded rect -->
                      <g v-if="treeData.stage >= 1">
                        <rect :x="58" :y="treeData.trunkTop+2" width="7" :height="119-treeData.trunkTop" rx="3.5" fill="#78350F" opacity="0.35"/>
                        <rect :x="56" :y="treeData.trunkTop" width="8" :height="119-treeData.trunkTop" rx="4" fill="url(#rwsc-trunk)" stroke="#78350F" stroke-width="1.5"/>
                        <rect :x="58" :y="treeData.trunkTop+5" width="2.5" :height="Math.max(4, Math.round((119-treeData.trunkTop)*0.38))" rx="1.5" fill="rgba(255,255,255,0.32)"/>
                      </g>

                      <!-- Roots (stage 2+): cute rounded -->
                      <g v-if="treeData.stage >= 2">
                        <path d="M56 118 Q44 118 35 123" stroke="#78350F" stroke-width="5.5" fill="none" stroke-linecap="round"/>
                        <path d="M64 118 Q76 118 85 123" stroke="#78350F" stroke-width="5.5" fill="none" stroke-linecap="round"/>
                        <path d="M55 119 Q47 121 40 125" stroke="#92400E" stroke-width="3"   fill="none" stroke-linecap="round"/>
                        <path d="M65 119 Q73 121 80 125" stroke="#92400E" stroke-width="3"   fill="none" stroke-linecap="round"/>
                      </g>

                      <!-- Stage 1: chibi sapling -->
                      <g v-if="treeData.stage === 1">
                        <circle cx="43" cy="96" r="14" fill="url(#rwsc-f3)" stroke="#15803D" stroke-width="2"/>
                        <circle cx="40" cy="93"  r="4.5" fill="rgba(255,255,255,0.6)"/>
                        <circle cx="77" cy="95" r="14" fill="url(#rwsc-f3)" stroke="#15803D" stroke-width="2"/>
                        <circle cx="74" cy="92"  r="4.5" fill="rgba(255,255,255,0.6)"/>
                        <circle cx="60" cy="84" r="20" fill="url(#rwsc-f2)" stroke="#16A34A" stroke-width="2"/>
                        <circle cx="53" cy="77" r="6.5" fill="rgba(255,255,255,0.58)"/>
                        <circle cx="66" cy="88" r="2.5" fill="#16A34A" opacity="0.4"/>
                        <circle cx="55" cy="91" r="2"   fill="#16A34A" opacity="0.35"/>
                        <circle cx="61" cy="68" r="15" fill="url(#rwsc-f1)" stroke="#22C55E" stroke-width="2"/>
                        <circle cx="55" cy="62" r="4.5" fill="rgba(255,255,255,0.62)"/>
                        <circle cx="61" cy="55" r="11" fill="url(#rwsc-f0)" stroke="#22C55E" stroke-width="2"/>
                        <circle cx="56" cy="50" r="3.5" fill="rgba(255,255,255,0.68)"/>
                      </g>

                      <!-- Stage 2: chibi small tree + flowers -->
                      <g v-if="treeData.stage === 2">
                        <circle cx="38" cy="95" r="17" fill="url(#rwsc-f4)" stroke="#15803D" stroke-width="2"/>
                        <circle cx="34" cy="91" r="5"   fill="rgba(255,255,255,0.5)"/>
                        <circle cx="82" cy="93" r="17" fill="url(#rwsc-f4)" stroke="#15803D" stroke-width="2"/>
                        <circle cx="78" cy="89" r="5"   fill="rgba(255,255,255,0.5)"/>
                        <circle cx="44" cy="82" r="18" fill="url(#rwsc-f3)" stroke="#15803D" stroke-width="2"/>
                        <circle cx="76" cy="80" r="18" fill="url(#rwsc-f3)" stroke="#15803D" stroke-width="2"/>
                        <circle cx="60" cy="86" r="23" fill="url(#rwsc-f3)" stroke="#16A34A" stroke-width="2"/>
                        <circle cx="51" cy="77" r="7"   fill="rgba(255,255,255,0.52)"/>
                        <circle cx="67" cy="90" r="2.8" fill="#16A34A" opacity="0.4"/>
                        <circle cx="60" cy="69" r="19" fill="url(#rwsc-f2)" stroke="#22C55E" stroke-width="2"/>
                        <circle cx="52" cy="61" r="5.8" fill="rgba(255,255,255,0.56)"/>
                        <circle cx="61" cy="53" r="15" fill="url(#rwsc-f1)" stroke="#22C55E" stroke-width="2"/>
                        <circle cx="55" cy="46" r="4.5" fill="rgba(255,255,255,0.62)"/>
                        <circle cx="61" cy="40" r="11" fill="url(#rwsc-f0)" stroke="#22C55E" stroke-width="2"/>
                        <circle cx="56" cy="34" r="3.5" fill="rgba(255,255,255,0.68)"/>
                        <!-- Cute flowers -->
                        <g><ellipse cx="35" cy="86" rx="3.5" ry="5.5" fill="#FBCFE8"/><ellipse cx="35" cy="86" rx="5.5" ry="3.5" fill="#FBCFE8"/><circle cx="35" cy="86" r="3" fill="#FDE047"/><circle cx="34" cy="85" r="0.9" fill="rgba(255,255,255,0.8)"/></g>
                        <g><ellipse cx="85" cy="84" rx="3.5" ry="5.5" fill="#FBCFE8"/><ellipse cx="85" cy="84" rx="5.5" ry="3.5" fill="#FBCFE8"/><circle cx="85" cy="84" r="3" fill="#FDE047"/><circle cx="84" cy="83" r="0.9" fill="rgba(255,255,255,0.8)"/></g>
                        <g><ellipse cx="46" cy="71" rx="3"   ry="4.5" fill="#BAE6FD"/><ellipse cx="46" cy="71" rx="4.5" ry="3"   fill="#BAE6FD"/><circle cx="46" cy="71" r="2.5" fill="#FBBF24"/><circle cx="45" cy="70" r="0.8" fill="rgba(255,255,255,0.8)"/></g>
                      </g>

                      <!-- Stage 3+: large chibi canopy -->
                      <g v-if="treeData.stage >= 3">
                        <circle cx="30" cy="97" r="19" fill="url(#rwsc-f5)" stroke="#059669" stroke-width="2"/>
                        <circle cx="26" cy="93" r="5.5" fill="rgba(255,255,255,0.44)"/>
                        <circle cx="90" cy="95" r="19" fill="url(#rwsc-f5)" stroke="#059669" stroke-width="2"/>
                        <circle cx="86" cy="91" r="5.5" fill="rgba(255,255,255,0.44)"/>
                        <circle cx="41" cy="84" r="21" fill="url(#rwsc-f4)" stroke="#15803D" stroke-width="2"/>
                        <circle cx="80" cy="82" r="21" fill="url(#rwsc-f4)" stroke="#15803D" stroke-width="2"/>
                        <circle cx="60" cy="90" r="27" fill="url(#rwsc-f4)" stroke="#15803D" stroke-width="2"/>
                        <circle cx="49" cy="78" r="8.5" fill="rgba(255,255,255,0.46)"/>
                        <circle cx="68" cy="93" r="3.5" fill="#15803D" opacity="0.38"/>
                        <circle cx="43" cy="75" r="21" fill="url(#rwsc-f3)" stroke="#16A34A" stroke-width="2"/>
                        <circle cx="37" cy="67" r="6.5" fill="rgba(255,255,255,0.5)"/>
                        <circle cx="77" cy="73" r="21" fill="url(#rwsc-f3)" stroke="#16A34A" stroke-width="2"/>
                        <circle cx="71" cy="65" r="6.5" fill="rgba(255,255,255,0.5)"/>
                        <circle cx="60" cy="75" r="24" fill="url(#rwsc-f3)" stroke="#16A34A" stroke-width="2"/>
                        <circle cx="49" cy="65" r="7.5" fill="rgba(255,255,255,0.47)"/>
                        <circle cx="60" cy="58" r="21" fill="url(#rwsc-f2)" stroke="#22C55E" stroke-width="2"/>
                        <circle cx="50" cy="48" r="6.5" fill="rgba(255,255,255,0.5)"/>
                        <!-- Flowers (stage 3+ base) -->
                        <g><ellipse cx="27" cy="88" rx="4" ry="6"   fill="#FBCFE8"/><ellipse cx="27" cy="88" rx="6"   ry="4" fill="#FBCFE8"/><circle cx="27" cy="88" r="3.5" fill="#FDE047"/><circle cx="26" cy="87" r="1"   fill="rgba(255,255,255,0.8)"/></g>
                        <g><ellipse cx="93" cy="86" rx="4" ry="6"   fill="#FBCFE8"/><ellipse cx="93" cy="86" rx="6"   ry="4" fill="#FBCFE8"/><circle cx="93" cy="86" r="3.5" fill="#FDE047"/><circle cx="92" cy="85" r="1"   fill="rgba(255,255,255,0.8)"/></g>
                        <g><ellipse cx="40" cy="63" rx="3.5" ry="5.5" fill="#BAE6FD"/><ellipse cx="40" cy="63" rx="5.5" ry="3.5" fill="#BAE6FD"/><circle cx="40" cy="63" r="3"   fill="#FBBF24"/><circle cx="39" cy="62" r="0.8" fill="rgba(255,255,255,0.8)"/></g>
                        <g><ellipse cx="80" cy="61" rx="3.5" ry="5.5" fill="#FCA5A5"/><ellipse cx="80" cy="61" rx="5.5" ry="3.5" fill="#FCA5A5"/><circle cx="80" cy="61" r="3"   fill="#FDE047"/><circle cx="79" cy="60" r="0.8" fill="rgba(255,255,255,0.8)"/></g>
                        <!-- Stage 3 specific top -->
                        <g v-if="treeData.stage === 3">
                          <circle cx="61" cy="41" r="17" fill="url(#rwsc-f1)" stroke="#22C55E" stroke-width="2"/>
                          <circle cx="53" cy="33" r="5.5" fill="rgba(255,255,255,0.58)"/>
                          <circle cx="61" cy="26" r="12" fill="url(#rwsc-f0)" stroke="#22C55E" stroke-width="2"/>
                          <circle cx="56" cy="20" r="3.8" fill="rgba(255,255,255,0.68)"/>
                          <g><ellipse cx="74" cy="34" rx="3" ry="4.5" fill="#FBCFE8"/><ellipse cx="74" cy="34" rx="4.5" ry="3" fill="#FBCFE8"/><circle cx="74" cy="34" r="2.5" fill="#FDE047"/></g>
                        </g>
                      </g>

                      <!-- Stage 4+: chibi fruits + tall crown -->
                      <g v-if="treeData.stage >= 4">
                        <line x1="36" y1="100" x2="37" y2="105" stroke="#78350F" stroke-width="1.5"/><circle cx="37"  cy="108" r="6.5" fill="url(#rwsc-fr)" stroke="#DC2626" stroke-width="1.2"/><circle cx="35"  cy="105.5" r="2"   fill="rgba(255,255,255,0.65)"/>
                        <line x1="84" y1="98"  x2="83" y2="103" stroke="#78350F" stroke-width="1.5"/><circle cx="83"  cy="106" r="6.5" fill="url(#rwsc-fo)" stroke="#EA580C" stroke-width="1.2"/><circle cx="81"  cy="103.5" r="2"   fill="rgba(255,255,255,0.65)"/>
                        <line x1="40" y1="83"  x2="41" y2="88"  stroke="#78350F" stroke-width="1.3"/><circle cx="41"  cy="91"  r="5.5" fill="url(#rwsc-fy)" stroke="#CA8A04" stroke-width="1.2"/><circle cx="39.5" cy="88.5" r="1.7" fill="rgba(255,255,255,0.6)"/>
                        <line x1="80" y1="81"  x2="79" y2="86"  stroke="#78350F" stroke-width="1.3"/><circle cx="79"  cy="89"  r="5.5" fill="url(#rwsc-fr)" stroke="#DC2626" stroke-width="1.2"/><circle cx="77.5" cy="86.5" r="1.7" fill="rgba(255,255,255,0.6)"/>
                        <line x1="47" y1="66"  x2="48" y2="71"  stroke="#78350F" stroke-width="1.2"/><circle cx="48"  cy="74"  r="5"   fill="url(#rwsc-fo)" stroke="#EA580C" stroke-width="1.1"/><circle cx="46.5" cy="71.5" r="1.5" fill="rgba(255,255,255,0.58)"/>
                        <line x1="73" y1="64"  x2="72" y2="69"  stroke="#78350F" stroke-width="1.2"/><circle cx="72"  cy="72"  r="5"   fill="url(#rwsc-fy)" stroke="#CA8A04" stroke-width="1.1"/><circle cx="70.5" cy="69.5" r="1.5" fill="rgba(255,255,255,0.58)"/>
                        <line x1="53" y1="50"  x2="54" y2="55"  stroke="#78350F" stroke-width="1.1"/><circle cx="54"  cy="58"  r="4.5" fill="url(#rwsc-fr)" stroke="#DC2626" stroke-width="1"/><circle cx="52.5" cy="55.5" r="1.3" fill="rgba(255,255,255,0.58)"/>
                        <line x1="67" y1="51"  x2="66" y2="56"  stroke="#78350F" stroke-width="1.1"/><circle cx="66"  cy="59"  r="4.5" fill="url(#rwsc-fo)" stroke="#EA580C" stroke-width="1"/><circle cx="64.5" cy="56.5" r="1.3" fill="rgba(255,255,255,0.58)"/>
                        <!-- Stage 4 crown -->
                        <g v-if="treeData.stage === 4">
                          <circle cx="44" cy="48" r="17" fill="url(#rwsc-f2)" stroke="#22C55E" stroke-width="2"/>
                          <circle cx="38" cy="40" r="5"   fill="rgba(255,255,255,0.52)"/>
                          <circle cx="76" cy="46" r="17" fill="url(#rwsc-f2)" stroke="#22C55E" stroke-width="2"/>
                          <circle cx="70" cy="38" r="5"   fill="rgba(255,255,255,0.52)"/>
                          <circle cx="60" cy="36" r="21" fill="url(#rwsc-f1)" stroke="#22C55E" stroke-width="2"/>
                          <circle cx="50" cy="25" r="6.5" fill="rgba(255,255,255,0.54)"/>
                          <circle cx="60" cy="17" r="14" fill="url(#rwsc-f0)" stroke="#22C55E" stroke-width="2"/>
                          <circle cx="54" cy="10" r="4.5" fill="rgba(255,255,255,0.65)"/>
                          <g><ellipse cx="32" cy="40" rx="3.5" ry="5.5" fill="#FBCFE8"/><ellipse cx="32" cy="40" rx="5.5" ry="3.5" fill="#FBCFE8"/><circle cx="32" cy="40" r="3" fill="#FDE047"/></g>
                          <g><ellipse cx="88" cy="38" rx="3.5" ry="5.5" fill="#BAE6FD"/><ellipse cx="88" cy="38" rx="5.5" ry="3.5" fill="#BAE6FD"/><circle cx="88" cy="38" r="3" fill="#FDE047"/></g>
                          <g><ellipse cx="53" cy="26" rx="3"   ry="4.5" fill="#FCA5A5"/><ellipse cx="53" cy="26" rx="4.5" ry="3"   fill="#FCA5A5"/><circle cx="53" cy="26" r="2.5" fill="#FDE047"/></g>
                        </g>
                      </g>

                      <!-- Stage 5: ancient magical chibi -->
                      <g v-if="treeData.stage >= 5">
                        <path d="M53 102 Q36 97 21 104" stroke="#78350F" stroke-width="3.5" fill="none" stroke-linecap="round"/>
                        <path d="M67 100 Q84 95 99 102" stroke="#78350F" stroke-width="3.5" fill="none" stroke-linecap="round"/>
                        <circle cx="19"  cy="100" r="21" fill="url(#rwsc-f5)" stroke="#047857" stroke-width="2"/>
                        <circle cx="13"  cy="93"  r="6.5" fill="rgba(255,255,255,0.42)"/>
                        <circle cx="101" cy="98"  r="21" fill="url(#rwsc-f5)" stroke="#047857" stroke-width="2"/>
                        <circle cx="95"  cy="91"  r="6.5" fill="rgba(255,255,255,0.42)"/>
                        <circle cx="44" cy="47" r="19" fill="url(#rwsc-f5)" stroke="#047857" stroke-width="2"/>
                        <circle cx="37" cy="39" r="5.8" fill="rgba(255,255,255,0.46)"/>
                        <circle cx="76" cy="45" r="19" fill="url(#rwsc-f5)" stroke="#047857" stroke-width="2"/>
                        <circle cx="69" cy="37" r="5.8" fill="rgba(255,255,255,0.46)"/>
                        <circle cx="60" cy="34" r="23" fill="url(#rwsc-f5)" stroke="#047857" stroke-width="2"/>
                        <circle cx="49" cy="22" r="7"   fill="rgba(255,255,255,0.46)"/>
                        <circle cx="60" cy="15" r="15" fill="url(#rwsc-f5)" stroke="#047857" stroke-width="2"/>
                        <circle cx="53" cy="7"  r="4.8" fill="rgba(255,255,255,0.5)"/>
                        <!-- Many flowers (magical) -->
                        <g><ellipse cx="7"   cy="91" rx="4"   ry="6"   fill="#FBCFE8"/><ellipse cx="7"   cy="91" rx="6"   ry="4"   fill="#FBCFE8"/><circle cx="7"   cy="91" r="3.5" fill="#FDE047"/><circle cx="6"   cy="90" r="1"   fill="rgba(255,255,255,0.8)"/></g>
                        <g><ellipse cx="113" cy="89" rx="4"   ry="6"   fill="#BAE6FD"/><ellipse cx="113" cy="89" rx="6"   ry="4"   fill="#BAE6FD"/><circle cx="113" cy="89" r="3.5" fill="#FDE047"/><circle cx="112" cy="88" r="1"   fill="rgba(255,255,255,0.8)"/></g>
                        <g><ellipse cx="32"  cy="35" rx="3.5" ry="5.5" fill="#FCA5A5"/><ellipse cx="32"  cy="35" rx="5.5" ry="3.5" fill="#FCA5A5"/><circle cx="32"  cy="35" r="3"   fill="#FDE047"/></g>
                        <g><ellipse cx="89"  cy="33" rx="3.5" ry="5.5" fill="#FBCFE8"/><ellipse cx="89"  cy="33" rx="5.5" ry="3.5" fill="#FBCFE8"/><circle cx="89"  cy="33" r="3"   fill="#A78BFA"/></g>
                        <g><ellipse cx="50"  cy="19" rx="3"   ry="4.5" fill="#BAE6FD"/><ellipse cx="50"  cy="19" rx="4.5" ry="3"   fill="#BAE6FD"/><circle cx="50"  cy="19" r="2.5" fill="#FDE047"/></g>
                        <!-- Chibi sparkle stars -->
                        <g>
                          <circle cx="8" cy="63" r="3.5" fill="#FEF08A" stroke="#FCD34D" stroke-width="1">
                            <animate attributeName="r"       values="3.5;5;3.5" dur="1.8s" repeatCount="indefinite"/>
                            <animate attributeName="opacity" values="1;0.2;1"   dur="1.8s" repeatCount="indefinite"/>
                          </circle>
                          <line x1="5" y1="60" x2="11" y2="66" stroke="#FCD34D" stroke-width="1.5" stroke-linecap="round"><animate attributeName="opacity" values="1;0.1;1" dur="1.8s" repeatCount="indefinite"/></line>
                          <line x1="11" y1="60" x2="5" y2="66" stroke="#FCD34D" stroke-width="1.5" stroke-linecap="round"><animate attributeName="opacity" values="1;0.1;1" dur="1.8s" repeatCount="indefinite"/></line>
                          <line x1="8" y1="58" x2="8" y2="68" stroke="#FCD34D" stroke-width="1.5" stroke-linecap="round"><animate attributeName="opacity" values="1;0.1;1" dur="1.8s" repeatCount="indefinite"/></line>
                        </g>
                        <g>
                          <circle cx="112" cy="57" r="3" fill="#FEF08A" stroke="#FCD34D" stroke-width="1">
                            <animate attributeName="r"       values="3;4.5;3"   dur="1.8s" repeatCount="indefinite" begin="0.9s"/>
                            <animate attributeName="opacity" values="0.2;1;0.2" dur="1.8s" repeatCount="indefinite" begin="0.9s"/>
                          </circle>
                          <line x1="109" y1="54" x2="115" y2="60" stroke="#FCD34D" stroke-width="1.5" stroke-linecap="round"><animate attributeName="opacity" values="0.1;1;0.1" dur="1.8s" repeatCount="indefinite" begin="0.9s"/></line>
                          <line x1="115" y1="54" x2="109" y2="60" stroke="#FCD34D" stroke-width="1.5" stroke-linecap="round"><animate attributeName="opacity" values="0.1;1;0.1" dur="1.8s" repeatCount="indefinite" begin="0.9s"/></line>
                          <line x1="112" y1="52" x2="112" y2="62" stroke="#FCD34D" stroke-width="1.5" stroke-linecap="round"><animate attributeName="opacity" values="0.1;1;0.1" dur="1.8s" repeatCount="indefinite" begin="0.9s"/></line>
                        </g>
                      </g>

                      <!-- Cute floating particles (stage 2+): pink, blue, yellow -->
                      <g v-if="treeData.stage >= 2">
                        <circle cx="52" cy="78" r="2.8" fill="#FBCFE8" opacity="0">
                          <animate attributeName="cy"      values="78;52;26" dur="4s"   repeatCount="indefinite" begin="0s"/>
                          <animate attributeName="cx"      values="52;47;42" dur="4s"   repeatCount="indefinite" begin="0s"/>
                          <animate attributeName="opacity" values="0;0.9;0"  dur="4s"   repeatCount="indefinite" begin="0s"/>
                        </circle>
                        <circle cx="68" cy="82" r="2.2" fill="#BAE6FD" opacity="0">
                          <animate attributeName="cy"      values="82;58;34"  dur="3.6s" repeatCount="indefinite" begin="1.5s"/>
                          <animate attributeName="cx"      values="68;73;78"  dur="3.6s" repeatCount="indefinite" begin="1.5s"/>
                          <animate attributeName="opacity" values="0;0.88;0"  dur="3.6s" repeatCount="indefinite" begin="1.5s"/>
                        </circle>
                        <circle cx="60" cy="72" r="2.2" fill="#FDE047" opacity="0">
                          <animate attributeName="cy"      values="72;48;24" dur="5s"   repeatCount="indefinite" begin="0.9s"/>
                          <animate attributeName="cx"      values="60;56;52" dur="5s"   repeatCount="indefinite" begin="0.9s"/>
                          <animate attributeName="opacity" values="0;0.85;0" dur="5s"   repeatCount="indefinite" begin="0.9s"/>
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

const reward   = useRewardStore()
const userAuth = useUserAuthStore()

const checkinDone  = ref(false)
const checkinError = ref('')
const showMore     = ref(false)
const shareOpen    = ref(false)
const cardRef      = ref(null)
const capturing    = ref(false)

onMounted(() => {
  reward.load(userAuth.userName || '', true)
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
  { stage: 1, min: 50,   max: 149,      name: 'ต้นกล้า',            desc: 'เริ่มแตกใบอ่อน พร้อมเติบโตสู่สิ่งที่ยิ่งใหญ่กว่าเดิม',                    color: '#4ADE80', trunkTop: 90   },
  { stage: 2, min: 150,  max: 349,      name: 'ต้นไม้น้อย',         desc: 'รากแผ่กว้าง ลำต้นแข็งแกร่ง กำลังสร้างรากฐานที่มั่นคง',                   color: '#22C55E', trunkTop: 75   },
  { stage: 3, min: 350,  max: 699,      name: 'ต้นไม้กลาง',         desc: 'ร่มเงาเริ่มปรากฏ กิ่งก้านแผ่ออกอย่างมั่นคง เป็นที่พักพิงได้แล้ว',       color: '#16A34A', trunkTop: 60   },
  { stage: 4, min: 700,  max: 1199,     name: 'ต้นไม้ใหญ่',         desc: 'ออกดอกออกผล เป็นแรงบันดาลใจและที่พึ่งพิงให้คนรอบข้าง',                   color: '#15803D', trunkTop: 45   },
  { stage: 5, min: 1200, max: Infinity, name: 'ต้นไม้แห่งปัญญา ✨', desc: 'ยืนหยัดอย่างภาคภูมิ เป็นสัญลักษณ์แห่งปัญญาและพลังของชุมชน DS',          color: '#047857', trunkTop: 35   },
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

const checkinPts = computed(() => {
  const rule = (reward.rules.length ? reward.rules : FALLBACK_RULES)
    .find(r => r.type === 'daily_checkin' && !r.subtype)
  return rule?.pts ?? 5
})

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
  border-radius: 20px;
  padding: 14px 16px 12px;
  margin-bottom: 16px;
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
.rw-tree-scene {
  position: relative;
  display: flex; justify-content: center; align-items: flex-end;
  height: 134px;
  margin-bottom: 10px;
  overflow: hidden;
}
.rw-tree-svg {
  width: 120px; height: 130px;
  filter: drop-shadow(0 6px 14px rgba(0,0,0,0.18)) drop-shadow(0 2px 4px rgba(0,0,0,0.10));
}
.rw-float-leaf {
  position: absolute; font-size: 14px; pointer-events: none;
  animation: leafFloat 3s ease-in-out infinite;
}
.rw-fl-1 { top: 18px; left: 16px;  animation-delay: 0s;   animation-duration: 3.3s; }
.rw-fl-2 { top: 38px; right: 16px; animation-delay: 0.9s; animation-duration: 2.9s; }
.rw-fl-3 { top: 8px;  right: 28px; animation-delay: 0.4s; animation-duration: 3.6s; }
@keyframes leafFloat {
  0%, 100% { transform: translateY(0)    rotate(0deg);  opacity: 0.8; }
  50%       { transform: translateY(-9px) rotate(14deg); opacity: 1;   }
}
.rw-tree-prog-bar {
  height: 7px; background: #BBF7D0; border-radius: 8px; overflow: hidden; margin-bottom: 5px;
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
  border-radius: 14px;
  padding: 12px 16px 10px;
  margin-top: 10px;
  text-align: center;
}
.rw-stage-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  margin-bottom: 10px;
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
