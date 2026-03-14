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
            <span class="rw-tree-stage-tag" :style="{ background: treeData.color }">{{ treeData.name }}</span>
          </div>

          <div class="rw-tree-scene">
            <svg class="rw-tree-svg" viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg">
              <!-- Ground (static) -->
              <ellipse cx="60" cy="122" rx="46" ry="9" fill="#BBF7D0"/>
              <ellipse cx="60" cy="119" rx="38" ry="5" fill="#86EFAC"/>

              <!-- Animated tree wrapper -->
              <g>
                <animateTransform attributeName="transform" type="rotate"
                  values="-1.2 60 119; 1.2 60 119; -1.2 60 119"
                  keyTimes="0;0.5;1" dur="4s" repeatCount="indefinite"
                  calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>

                <!-- Stage 0: seed -->
                <g v-if="treeData.stage === 0">
                  <ellipse cx="60" cy="117" rx="6" ry="4" fill="#6EE7B7"/>
                  <line x1="60" y1="115" x2="53" y2="108" stroke="#4ADE80" stroke-width="2" stroke-linecap="round"/>
                  <line x1="60" y1="115" x2="67" y2="108" stroke="#22C55E" stroke-width="2" stroke-linecap="round"/>
                  <ellipse cx="51" cy="106" rx="5" ry="3.5" fill="#4ADE80" transform="rotate(-25,51,106)"/>
                  <ellipse cx="69" cy="106" rx="5" ry="3.5" fill="#22C55E" transform="rotate(25,69,106)"/>
                </g>

                <!-- Trunk -->
                <g v-if="treeData.stage >= 1">
                  <rect x="56" :y="treeData.trunkTop" width="8"
                        :height="115 - treeData.trunkTop" rx="3" fill="#92400E"/>
                  <line x1="59" :y1="(treeData.trunkTop||90)+6" x2="59" y2="112"
                        stroke="#78350F" stroke-width="1" opacity="0.4"/>
                </g>

                <!-- Stage 1: bush -->
                <g v-if="treeData.stage === 1">
                  <circle cx="47" cy="98" r="10" fill="#16A34A"/>
                  <circle cx="73" cy="98" r="10" fill="#16A34A"/>
                  <circle cx="60" cy="88" r="15" fill="#22C55E">
                    <animate attributeName="r" values="15;16.5;15" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                  </circle>
                  <circle cx="60" cy="77" r="11" fill="#4ADE80">
                    <animate attributeName="r" values="11;12.5;11" dur="2.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                  </circle>
                </g>

                <!-- Stage 2+: layered leaves -->
                <g v-if="treeData.stage >= 2">
                  <ellipse cx="60" cy="107" rx="30" ry="12" fill="#15803D"/>
                  <ellipse cx="60" cy="99" rx="24" ry="11" fill="#16A34A">
                    <animate attributeName="rx" values="24;26;24" dur="3.5s" repeatCount="indefinite" begin="0.2s" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                  </ellipse>
                  <ellipse cx="60" cy="90" rx="19" ry="10" fill="#22C55E">
                    <animate attributeName="rx" values="19;21;19" dur="3s" repeatCount="indefinite" begin="0.5s" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                  </ellipse>
                  <circle cx="60" cy="79" r="13" fill="#22C55E">
                    <animate attributeName="r" values="13;14.5;13" dur="2.8s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                  </circle>
                  <circle cx="60" cy="69" r="10" fill="#4ADE80" v-if="treeData.stage === 2">
                    <animate attributeName="r" values="10;11.5;10" dur="2.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                  </circle>
                </g>

                <!-- Stage 3+ -->
                <g v-if="treeData.stage >= 3">
                  <ellipse cx="60" cy="69" rx="15" ry="9" fill="#22C55E">
                    <animate attributeName="rx" values="15;17;15" dur="3.2s" repeatCount="indefinite" begin="0.3s" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                  </ellipse>
                  <circle cx="60" cy="59" r="11" :fill="treeData.stage === 3 ? '#4ADE80' : '#22C55E'">
                    <animate attributeName="r" values="11;12.5;11" dur="2.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                  </circle>
                </g>

                <!-- Stage 4+: fruits -->
                <g v-if="treeData.stage >= 4">
                  <circle cx="43" cy="102" r="3.5" fill="#EF4444"><animate attributeName="r" values="3.5;4.3;3.5" dur="2.1s" repeatCount="indefinite" begin="0s"/></circle>
                  <circle cx="77" cy="100" r="3.5" fill="#F97316"><animate attributeName="r" values="3.5;4.3;3.5" dur="2.1s" repeatCount="indefinite" begin="0.5s"/></circle>
                  <circle cx="47" cy="89"  r="3"   fill="#FBBF24"><animate attributeName="r" values="3;3.8;3"     dur="2.4s" repeatCount="indefinite" begin="0.9s"/></circle>
                  <circle cx="73" cy="87"  r="3"   fill="#EF4444"><animate attributeName="r" values="3;3.8;3"     dur="2.4s" repeatCount="indefinite" begin="1.3s"/></circle>
                  <circle cx="52" cy="77"  r="2.5" fill="#F97316"><animate attributeName="r" values="2.5;3.2;2.5" dur="2.2s" repeatCount="indefinite" begin="0.4s"/></circle>
                  <circle cx="68" cy="75"  r="2.5" fill="#FBBF24"><animate attributeName="r" values="2.5;3.2;2.5" dur="2.2s" repeatCount="indefinite" begin="1s"/></circle>
                  <ellipse cx="60" cy="50" rx="13" ry="8" fill="#22C55E">
                    <animate attributeName="rx" values="13;15;13" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                  </ellipse>
                  <circle cx="60" cy="41" r="9" fill="#4ADE80">
                    <animate attributeName="r" values="9;10.5;9" dur="2.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                  </circle>
                </g>

                <!-- Stage 5: ancient + twinkling stars -->
                <g v-if="treeData.stage >= 5">
                  <ellipse cx="33" cy="76" rx="11" ry="8" fill="#4ADE80" opacity="0.85" transform="rotate(-20,33,76)"/>
                  <ellipse cx="87" cy="73" rx="11" ry="8" fill="#4ADE80" opacity="0.85" transform="rotate(20,87,73)"/>
                  <circle cx="60" cy="31" r="7" fill="#86EFAC">
                    <animate attributeName="r" values="7;9;7" dur="2s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                  </circle>
                  <g>
                    <line x1="14" y1="57" x2="22" y2="65" stroke="#FCD34D" stroke-width="2"><animate attributeName="opacity" values="1;0.1;1" dur="1.8s" repeatCount="indefinite"/></line>
                    <line x1="22" y1="57" x2="14" y2="65" stroke="#FCD34D" stroke-width="2"><animate attributeName="opacity" values="1;0.1;1" dur="1.8s" repeatCount="indefinite"/></line>
                    <circle cx="18" cy="61" r="2.5" fill="#FEF08A">
                      <animate attributeName="r"       values="2.5;4;2.5" dur="1.8s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values="1;0.2;1"   dur="1.8s" repeatCount="indefinite"/>
                    </circle>
                  </g>
                  <g>
                    <line x1="96" y1="50" x2="104" y2="58" stroke="#FCD34D" stroke-width="2"><animate attributeName="opacity" values="0.2;1;0.2" dur="1.8s" repeatCount="indefinite"/></line>
                    <line x1="104" y1="50" x2="96" y2="58" stroke="#FCD34D" stroke-width="2"><animate attributeName="opacity" values="0.2;1;0.2" dur="1.8s" repeatCount="indefinite"/></line>
                    <circle cx="100" cy="54" r="2" fill="#FEF08A">
                      <animate attributeName="r"       values="2;3.5;2" dur="1.8s" repeatCount="indefinite" begin="0.9s"/>
                      <animate attributeName="opacity" values="0.2;1;0.2" dur="1.8s" repeatCount="indefinite" begin="0.9s"/>
                    </circle>
                  </g>
                </g>

                <!-- Floating particles (stage 2+) -->
                <g v-if="treeData.stage >= 2">
                  <circle cx="52" cy="78" r="2" fill="#4ADE80" opacity="0">
                    <animate attributeName="cy"      values="78;52;28"   dur="4s"   repeatCount="indefinite" begin="0s"/>
                    <animate attributeName="cx"      values="52;48;44"   dur="4s"   repeatCount="indefinite" begin="0s"/>
                    <animate attributeName="opacity" values="0;0.85;0"   dur="4s"   repeatCount="indefinite" begin="0s"/>
                  </circle>
                  <circle cx="68" cy="82" r="1.5" fill="#86EFAC" opacity="0">
                    <animate attributeName="cy"      values="82;58;34"   dur="3.6s" repeatCount="indefinite" begin="1.4s"/>
                    <animate attributeName="cx"      values="68;72;76"   dur="3.6s" repeatCount="indefinite" begin="1.4s"/>
                    <animate attributeName="opacity" values="0;0.7;0"    dur="3.6s" repeatCount="indefinite" begin="1.4s"/>
                  </circle>
                  <circle cx="60" cy="72" r="1.5" fill="#A7F3D0" opacity="0">
                    <animate attributeName="cy"      values="72;48;24"   dur="5s"   repeatCount="indefinite" begin="0.8s"/>
                    <animate attributeName="opacity" values="0;0.65;0"   dur="5s"   repeatCount="indefinite" begin="0.8s"/>
                  </circle>
                </g>
              </g>
            </svg>

            <div v-if="treeData.stage >= 3" class="rw-float-leaf rw-fl-1">🍃</div>
            <div v-if="treeData.stage >= 4" class="rw-float-leaf rw-fl-2">🍃</div>
            <div v-if="treeData.stage >= 5" class="rw-float-leaf rw-fl-3">✨</div>
          </div>

          <div class="rw-tree-prog-bar">
            <div class="rw-tree-prog-fill" :style="{ width: treeData.progress + '%', background: treeData.color }"></div>
          </div>
          <div class="rw-tree-prog-labels">
            <span>{{ reward.total }} pts</span>
            <span v-if="treeData.nextPts">อีก {{ treeData.ptsToNext }} pts → {{ treeData.nextName }}</span>
            <span v-else>🎉 ระดับสูงสุด!</span>
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
                    <ellipse cx="60" cy="122" rx="46" ry="9" fill="#BBF7D0"/>
                    <ellipse cx="60" cy="119" rx="38" ry="5" fill="#86EFAC"/>
                    <g>
                      <animateTransform attributeName="transform" type="rotate"
                        values="-1.2 60 119; 1.2 60 119; -1.2 60 119"
                        keyTimes="0;0.5;1" dur="4s" repeatCount="indefinite"
                        calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                      <g v-if="treeData.stage === 0">
                        <ellipse cx="60" cy="117" rx="6" ry="4" fill="#6EE7B7"/>
                        <line x1="60" y1="115" x2="53" y2="108" stroke="#4ADE80" stroke-width="2" stroke-linecap="round"/>
                        <line x1="60" y1="115" x2="67" y2="108" stroke="#22C55E" stroke-width="2" stroke-linecap="round"/>
                        <ellipse cx="51" cy="106" rx="5" ry="3.5" fill="#4ADE80" transform="rotate(-25,51,106)"/>
                        <ellipse cx="69" cy="106" rx="5" ry="3.5" fill="#22C55E" transform="rotate(25,69,106)"/>
                      </g>
                      <g v-if="treeData.stage >= 1">
                        <rect x="56" :y="treeData.trunkTop" width="8" :height="115 - treeData.trunkTop" rx="3" fill="#92400E"/>
                        <line x1="59" :y1="(treeData.trunkTop||90)+6" x2="59" y2="112" stroke="#78350F" stroke-width="1" opacity="0.4"/>
                      </g>
                      <g v-if="treeData.stage === 1">
                        <circle cx="47" cy="98" r="10" fill="#16A34A"/>
                        <circle cx="73" cy="98" r="10" fill="#16A34A"/>
                        <circle cx="60" cy="88" r="15" fill="#22C55E">
                          <animate attributeName="r" values="15;16.5;15" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                        </circle>
                        <circle cx="60" cy="77" r="11" fill="#4ADE80">
                          <animate attributeName="r" values="11;12.5;11" dur="2.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                        </circle>
                      </g>
                      <g v-if="treeData.stage >= 2">
                        <ellipse cx="60" cy="107" rx="30" ry="12" fill="#15803D"/>
                        <ellipse cx="60" cy="99" rx="24" ry="11" fill="#16A34A">
                          <animate attributeName="rx" values="24;26;24" dur="3.5s" repeatCount="indefinite" begin="0.2s" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                        </ellipse>
                        <ellipse cx="60" cy="90" rx="19" ry="10" fill="#22C55E">
                          <animate attributeName="rx" values="19;21;19" dur="3s" repeatCount="indefinite" begin="0.5s" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                        </ellipse>
                        <circle cx="60" cy="79" r="13" fill="#22C55E">
                          <animate attributeName="r" values="13;14.5;13" dur="2.8s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                        </circle>
                        <circle cx="60" cy="69" r="10" fill="#4ADE80" v-if="treeData.stage === 2">
                          <animate attributeName="r" values="10;11.5;10" dur="2.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                        </circle>
                      </g>
                      <g v-if="treeData.stage >= 3">
                        <ellipse cx="60" cy="69" rx="15" ry="9" fill="#22C55E">
                          <animate attributeName="rx" values="15;17;15" dur="3.2s" repeatCount="indefinite" begin="0.3s" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                        </ellipse>
                        <circle cx="60" cy="59" r="11" :fill="treeData.stage === 3 ? '#4ADE80' : '#22C55E'">
                          <animate attributeName="r" values="11;12.5;11" dur="2.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                        </circle>
                      </g>
                      <g v-if="treeData.stage >= 4">
                        <circle cx="43" cy="102" r="3.5" fill="#EF4444"><animate attributeName="r" values="3.5;4.3;3.5" dur="2.1s" repeatCount="indefinite" begin="0s"/></circle>
                        <circle cx="77" cy="100" r="3.5" fill="#F97316"><animate attributeName="r" values="3.5;4.3;3.5" dur="2.1s" repeatCount="indefinite" begin="0.5s"/></circle>
                        <circle cx="47" cy="89"  r="3"   fill="#FBBF24"><animate attributeName="r" values="3;3.8;3"     dur="2.4s" repeatCount="indefinite" begin="0.9s"/></circle>
                        <circle cx="73" cy="87"  r="3"   fill="#EF4444"><animate attributeName="r" values="3;3.8;3"     dur="2.4s" repeatCount="indefinite" begin="1.3s"/></circle>
                        <circle cx="52" cy="77"  r="2.5" fill="#F97316"><animate attributeName="r" values="2.5;3.2;2.5" dur="2.2s" repeatCount="indefinite" begin="0.4s"/></circle>
                        <circle cx="68" cy="75"  r="2.5" fill="#FBBF24"><animate attributeName="r" values="2.5;3.2;2.5" dur="2.2s" repeatCount="indefinite" begin="1s"/></circle>
                        <ellipse cx="60" cy="50" rx="13" ry="8" fill="#22C55E">
                          <animate attributeName="rx" values="13;15;13" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                        </ellipse>
                        <circle cx="60" cy="41" r="9" fill="#4ADE80">
                          <animate attributeName="r" values="9;10.5;9" dur="2.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                        </circle>
                      </g>
                      <g v-if="treeData.stage >= 5">
                        <ellipse cx="33" cy="76" rx="11" ry="8" fill="#4ADE80" opacity="0.85" transform="rotate(-20,33,76)"/>
                        <ellipse cx="87" cy="73" rx="11" ry="8" fill="#4ADE80" opacity="0.85" transform="rotate(20,87,73)"/>
                        <circle cx="60" cy="31" r="7" fill="#86EFAC">
                          <animate attributeName="r" values="7;9;7" dur="2s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
                        </circle>
                        <g>
                          <line x1="14" y1="57" x2="22" y2="65" stroke="#FCD34D" stroke-width="2"><animate attributeName="opacity" values="1;0.1;1" dur="1.8s" repeatCount="indefinite"/></line>
                          <line x1="22" y1="57" x2="14" y2="65" stroke="#FCD34D" stroke-width="2"><animate attributeName="opacity" values="1;0.1;1" dur="1.8s" repeatCount="indefinite"/></line>
                          <circle cx="18" cy="61" r="2.5" fill="#FEF08A">
                            <animate attributeName="r"       values="2.5;4;2.5" dur="1.8s" repeatCount="indefinite"/>
                            <animate attributeName="opacity" values="1;0.2;1"   dur="1.8s" repeatCount="indefinite"/>
                          </circle>
                        </g>
                        <g>
                          <line x1="96" y1="50" x2="104" y2="58" stroke="#FCD34D" stroke-width="2"><animate attributeName="opacity" values="0.2;1;0.2" dur="1.8s" repeatCount="indefinite"/></line>
                          <line x1="104" y1="50" x2="96" y2="58" stroke="#FCD34D" stroke-width="2"><animate attributeName="opacity" values="0.2;1;0.2" dur="1.8s" repeatCount="indefinite"/></line>
                          <circle cx="100" cy="54" r="2" fill="#FEF08A">
                            <animate attributeName="r"       values="2;3.5;2"   dur="1.8s" repeatCount="indefinite" begin="0.9s"/>
                            <animate attributeName="opacity" values="0.2;1;0.2" dur="1.8s" repeatCount="indefinite" begin="0.9s"/>
                          </circle>
                        </g>
                      </g>
                      <g v-if="treeData.stage >= 2">
                        <circle cx="52" cy="78" r="2" fill="#4ADE80" opacity="0">
                          <animate attributeName="cy" values="78;52;28" dur="4s" repeatCount="indefinite" begin="0s"/>
                          <animate attributeName="cx" values="52;48;44" dur="4s" repeatCount="indefinite" begin="0s"/>
                          <animate attributeName="opacity" values="0;0.85;0" dur="4s" repeatCount="indefinite" begin="0s"/>
                        </circle>
                        <circle cx="68" cy="82" r="1.5" fill="#86EFAC" opacity="0">
                          <animate attributeName="cy" values="82;58;34" dur="3.6s" repeatCount="indefinite" begin="1.4s"/>
                          <animate attributeName="cx" values="68;72;76" dur="3.6s" repeatCount="indefinite" begin="1.4s"/>
                          <animate attributeName="opacity" values="0;0.7;0" dur="3.6s" repeatCount="indefinite" begin="1.4s"/>
                        </circle>
                        <circle cx="60" cy="72" r="1.5" fill="#A7F3D0" opacity="0">
                          <animate attributeName="cy" values="72;48;24" dur="5s" repeatCount="indefinite" begin="0.8s"/>
                          <animate attributeName="opacity" values="0;0.65;0" dur="5s" repeatCount="indefinite" begin="0.8s"/>
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
  { stage: 0, min: 0,    max: 49,       name: 'เมล็ดพันธุ์',        color: '#6EE7B7', trunkTop: null },
  { stage: 1, min: 50,   max: 149,      name: 'ต้นกล้า',            color: '#4ADE80', trunkTop: 90   },
  { stage: 2, min: 150,  max: 349,      name: 'ต้นไม้น้อย',         color: '#22C55E', trunkTop: 75   },
  { stage: 3, min: 350,  max: 699,      name: 'ต้นไม้กลาง',         color: '#16A34A', trunkTop: 60   },
  { stage: 4, min: 700,  max: 1199,     name: 'ต้นไม้ใหญ่',         color: '#15803D', trunkTop: 45   },
  { stage: 5, min: 1200, max: Infinity, name: 'ต้นไม้แห่งปัญญา ✨', color: '#047857', trunkTop: 35   },
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
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.10));
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

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
