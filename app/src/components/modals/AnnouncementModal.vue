<template>
  <Teleport to="body">
    <Transition name="ann-fade">
      <div
        v-if="show"
        class="ann-overlay"
        @click.self="close"
      >
        <div class="ann-card" :class="{ 'ann-has-quiz': hasQuiz }">

          <!-- ══ VIDEO ════════════════════════════════════════════ -->
          <template v-if="ann.videoEnabled !== false">
          <div v-if="!videoHidden" class="ann-video-wrap">

            <!-- Skeleton spinner -->
            <div v-if="loading && !ann.videoUrl" class="ann-video-loading">
              <div class="ann-spinner"></div>
            </div>

            <!-- YouTube / Drive iframe -->
            <iframe
              v-else-if="embedUrl"
              :src="embedUrl"
              class="ann-iframe"
              frameborder="0"
              allowfullscreen
              allow="autoplay; fullscreen; encrypted-media"
            ></iframe>

            <!-- HTML5 video -->
            <video
              v-else-if="videoSrc"
              ref="videoRef"
              :src="videoSrc"
              class="ann-iframe"
              autoplay
              loop
              muted
              playsinline
              style="object-fit:contain;cursor:pointer;"
              @canplay="playVideo"
              @loadeddata="playVideo"
              @click="toggleVideoPlay"
            ></video>

            <!-- No video placeholder -->
            <div v-else class="ann-video-empty">
              <span style="font-size:36px;">🎬</span>
              <span style="font-size:12px;font-weight:600;opacity:0.6;">ไม่มีวิดีโอ</span>
            </div>

            <!-- Pause/play hint (HTML5 only) -->
            <Transition name="ann-hint">
              <div v-if="showHint && videoSrc" class="ann-play-hint">
                {{ vidPaused ? '▶' : '⏸' }}
              </div>
            </Transition>

            <!-- Close button -->
            <button class="ann-close-btn" @click="close">✕</button>

          </div>

          <!-- ══ VIDEO collapsed bar ══════════════════════════════ -->
          <div v-else class="ann-video-collapsed" @click="videoHidden = false">
            <div class="ann-video-collapsed-label">
              <span>▶</span>
              <span>แสดงวิดีโอ</span>
            </div>
            <button class="ann-close-btn-sm" @click.stop="close">✕</button>
          </div>

          </template><!-- end v-if videoEnabled -->

          <!-- ══ QUIZ panel ══════════════════════════════════════ -->
          <div v-if="hasQuiz && !quizPanelHidden" class="ann-quiz-panel">

            <!-- Loading -->
            <div v-if="quizLoading && !allSubmitted" class="ann-quiz-loading">
              <div class="ann-spinner" style="width:24px;height:24px;border-width:2px;"></div>
            </div>

            <template v-else-if="currentQ">

              <!-- Progress dots -->
              <div v-if="ann.quiz.length > 1" class="ann-quiz-progress">
                <span
                  v-for="(q, i) in ann.quiz"
                  :key="q.id"
                  class="ann-quiz-dot"
                  :class="{
                    'ann-dot-active': i === quizPage,
                    'ann-dot-done':   allSubmitted && quizState[q.id]?.submitted,
                  }"
                  @click="allSubmitted && (quizPage = i)"
                ></span>
              </div>

              <!-- Question -->
              <div class="ann-quiz-q">🎯 {{ currentQ.question }}</div>

              <!-- Options -->
              <div class="ann-quiz-opts">
                <button
                  v-for="opt in currentQ.options"
                  :key="opt.id"
                  class="ann-quiz-opt"
                  :class="{
                    'ann-opt-selected':  (quizState[currentQ.id]?.selected || []).includes(opt.id),
                    'ann-opt-submitted': quizState[currentQ.id]?.submitted,
                  }"
                  :disabled="quizState[currentQ.id]?.submitted"
                  @click="toggleOption(currentQ.id, opt.id, currentQ.type)"
                >
                  <template v-if="!quizState[currentQ.id]?.submitted">
                    <span class="ann-opt-indicator">
                      {{ (quizState[currentQ.id]?.selected || []).includes(opt.id) ? (currentQ.type === 'single' ? '⬤' : '☑') : (currentQ.type === 'single' ? '◯' : '☐') }}
                    </span>
                    <span class="ann-opt-text">{{ opt.text }}</span>
                  </template>
                  <template v-else>
                    <div class="ann-result-row">
                      <span class="ann-opt-text">
                        {{ (quizState[currentQ.id]?.selected || []).includes(opt.id) ? '✓ ' : '' }}{{ opt.text }}
                      </span>
                      <span class="ann-result-pct">
                        {{ quizState[currentQ.id]?.results?.total ? Math.round((quizState[currentQ.id].results.counts[opt.id] || 0) / quizState[currentQ.id].results.total * 100) : 0 }}%
                      </span>
                    </div>
                    <div class="ann-result-bar-track">
                      <div
                        class="ann-result-bar-fill"
                        :class="{ 'ann-result-mine': (quizState[currentQ.id]?.selected || []).includes(opt.id) }"
                        :style="{ width: quizState[currentQ.id]?.results?.total ? Math.round((quizState[currentQ.id].results.counts[opt.id] || 0) / quizState[currentQ.id].results.total * 100) + '%' : '0%' }"
                      ></div>
                    </div>
                    <div class="ann-result-count">{{ quizState[currentQ.id]?.results?.counts[opt.id] || 0 }} คน</div>
                  </template>
                </button>
              </div>

              <!-- Error -->
              <div v-if="quizErr" style="font-size:11px;color:#FCA5A5;text-align:center;margin-top:4px;">{{ quizErr }}</div>

              <!-- Navigation (before submit) -->
              <div v-if="!allSubmitted" class="ann-quiz-nav">
                <button
                  v-if="quizPage > 0"
                  class="ann-quiz-nav-prev"
                  @click="quizPage--"
                >◀</button>
                <button
                  v-if="!isLastPage"
                  class="ann-quiz-nav-next"
                  :disabled="!canGoNext"
                  @click="quizPage++"
                >ถัดไป ▶</button>
                <button
                  v-else
                  class="ann-quiz-submit"
                  :disabled="!allSelected || quizLoading"
                  @click="submitQuiz"
                >{{ quizLoading ? 'กำลังส่ง...' : 'ส่งคำตอบ 🎉' }}</button>
              </div>

              <!-- Done (after submit) -->
              <div v-else class="ann-quiz-done-wrap">
                <div class="ann-quiz-done">✓ ส่งคำตอบแล้ว · {{ totalRespondents }} คนร่วมสนุก</div>
                <div v-if="ann.quiz.length > 1" class="ann-quiz-result-nav">
                  <button class="ann-quiz-nav-prev" :disabled="quizPage === 0" @click="quizPage--">◀</button>
                  <span class="ann-quiz-result-label">ผล {{ quizPage + 1 }} / {{ ann.quiz.length }}</span>
                  <button class="ann-quiz-nav-next" :disabled="quizPage === ann.quiz.length - 1" @click="quizPage++">▶</button>
                </div>
              </div>

            </template>

          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { fetchAnnouncement, submitQuizAnswer, fetchQuizResults, getMyQuizAnswer } from '../../services/announcementService.js'
import { useUiStore } from '../../stores/ui.js'

const ui        = useUiStore()
const show       = ref(false)
const loading    = ref(false)
const videoRef   = ref(null)
const dismissed  = ref(false)   // ปิดแล้วใน session นี้ → ไม่เปิดซ้ำ
const ann        = ref({ title: '', videoUrl: '', desc: '', id: '', quiz: null })
const vidPaused   = ref(false)
const showHint    = ref(false)
const videoHidden    = ref(false)
const quizPanelHidden = ref(false)
let   _hintTimer  = null

// ── Quiz state ──
const quizState   = ref({})          // { [qId]: { selected, submitted, results, err } }
const quizLoading = ref(false)
const quizErr     = ref('')
const quizPage    = ref(0)           // current question index

const hasQuiz      = computed(() => Array.isArray(ann.value.quiz) && ann.value.quiz.length > 0)
const currentQ     = computed(() => hasQuiz.value ? ann.value.quiz[quizPage.value] : null)
const isLastPage   = computed(() => hasQuiz.value && quizPage.value === ann.value.quiz.length - 1)
const canGoNext    = computed(() => (quizState.value[currentQ.value?.id]?.selected?.length || 0) > 0)
const allSelected  = computed(() => hasQuiz.value && ann.value.quiz.every(q => (quizState.value[q.id]?.selected?.length || 0) > 0))
const allSubmitted = computed(() => hasQuiz.value && ann.value.quiz.every(q => quizState.value[q.id]?.submitted))
const totalRespondents = computed(() => {
  if (!hasQuiz.value || !ann.value.quiz[0]) return 0
  return quizState.value[ann.value.quiz[0].id]?.results?.total || 0
})
const myName  = computed(() => ui.currentUser?.name || '')

function playVideo() {
  const el = videoRef.value
  if (!el) return
  el.muted = true
  el.loop  = true
  el.play().catch(() => {})
  vidPaused.value = false
}

function toggleVideoPlay() {
  const el = videoRef.value
  if (!el) return
  if (el.paused) { el.play().catch(() => {}); vidPaused.value = false }
  else           { el.pause();                vidPaused.value = true  }
  showHint.value = true
  clearTimeout(_hintTimer)
  _hintTimer = setTimeout(() => { showHint.value = false }, 700)
}

// เมื่อ modal เปิด — รอ DOM แล้ว play
watch(show, async (val) => {
  if (!val) return
  videoHidden.value    = false
  quizPanelHidden.value = false
  quizPage.value    = 0
  await nextTick()
  playVideo()
})

// YouTube / Drive → iframe embed, Supabase Storage / direct URL → HTML5 video
const embedUrl = computed(() => {
  const url = ann.value.videoUrl || ''
  if (!url) return ''
  // YouTube
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1&loop=1&playlist=${yt[1]}&mute=1&controls=1&rel=0&modestbranding=1`
  // Google Drive — use /preview iframe (Drive doesn't support HTML5 video streaming)
  const drive = url.match(/drive\.google\.com\/file\/d\/([^/]+)/)
  if (drive) return `https://drive.google.com/file/d/${drive[1]}/preview`
  return ''
})

const isYouTube = computed(() => !!ann.value.videoUrl?.match(/youtube\.com|youtu\.be/))

// Supabase Storage / direct URL → HTML5 <video>
const videoSrc = computed(() => {
  const url = ann.value.videoUrl || ''
  if (!url || embedUrl.value) return ''
  return url
})

const LS_SEEN = 'dsc_ann_seen'
const LS_DATA = 'dsc_ann_data'

function getSeen() {
  try { return JSON.parse(localStorage.getItem(LS_SEEN) || '{}') } catch { return {} }
}
function setSeen(id, days) {
  const s = getSeen()
  s[id] = Date.now() + days * 24 * 60 * 60 * 1000
  localStorage.setItem(LS_SEEN, JSON.stringify(s))
}
function hasSeen(id) {
  const s = getSeen()
  return s[id] && Date.now() < s[id]
}
function getCached() {
  try { return JSON.parse(localStorage.getItem(LS_DATA) || 'null') } catch { return null }
}
function setCached(data) {
  try { localStorage.setItem(LS_DATA, JSON.stringify(data)) } catch {}
}

// ── Quiz logic ──────────────────────────────────────────
async function loadQuiz() {
  if (!hasQuiz.value || !ann.value.id) return
  // Init per-question state
  const s = {}
  ann.value.quiz.forEach(q => { s[q.id] = { selected: [], submitted: false, results: { counts: {}, total: 0 }, err: '' } })
  quizState.value = s
  if (!myName.value) return
  quizLoading.value = true
  try {
    const checks = await Promise.all(
      ann.value.quiz.map(q => getMyQuizAnswer(ann.value.id, myName.value, q.id))
    )
    // If every question already answered → check video before closing
    if (checks.every(ans => ans !== null)) {
      if (ann.value.videoEnabled !== false) {
        quizPanelHidden.value = true   // มี video section → ซ่อน quiz, คงไว้ดู video
      } else {
        setSeen(ann.value.id, 365)
        show.value = false
      }
      return
    }
    // Load results for already-answered questions
    await Promise.all(
      ann.value.quiz.map(async (q, i) => {
        if (!checks[i]) return
        const results = await fetchQuizResults(ann.value.id, q.id)
        quizState.value[q.id].selected  = checks[i]
        quizState.value[q.id].submitted = true
        quizState.value[q.id].results   = results
      })
    )
  } catch { /* silent */ } finally {
    quizLoading.value = false
  }
}

function toggleOption(qId, optId, type) {
  const st = quizState.value[qId]
  if (!st || st.submitted) return
  if (type === 'single') {
    st.selected = [optId]
  } else {
    const idx = st.selected.indexOf(optId)
    if (idx >= 0) st.selected.splice(idx, 1)
    else st.selected.push(optId)
  }
}

async function submitQuiz() {
  if (!allSelected.value || quizLoading.value) return
  quizLoading.value = true
  quizErr.value     = ''
  try {
    const name = myName.value || `user_${Date.now()}`
    await Promise.all(
      ann.value.quiz
        .filter(q => !quizState.value[q.id]?.submitted)
        .map(q => submitQuizAnswer(ann.value.id, name, q.id, [...quizState.value[q.id].selected]))
    )
    await Promise.all(
      ann.value.quiz.map(async q => {
        const results = await fetchQuizResults(ann.value.id, q.id)
        quizState.value[q.id].submitted = true
        quizState.value[q.id].results   = results
      })
    )
    const hasVideoSection = ann.value.videoEnabled !== false
    setTimeout(() => {
      if (hasVideoSection) {
        quizPanelHidden.value = true   // มี video section → ซ่อน quiz, คงไว้ดู video
      } else {
        setSeen(ann.value.id, 365)     // ไม่มี video → mark seen แล้วปิด modal
        show.value = false
      }
    }, 2500)
  } catch {
    quizErr.value = 'ส่งคำตอบไม่สำเร็จ กรุณาลองใหม่'
  } finally {
    quizLoading.value = false
  }
}

function close() {
  // ปิดชั่วคราว — ไม่บันทึก seen → refresh/login ใหม่จะแสดงอีก
  dismissed.value = true
  show.value = false
}
function closeAck() {
  // กด "รับทราบ" → ไม่แสดงซ้ำ 1 วัน
  if (ann.value.id) setSeen(ann.value.id, 1)
  show.value = false
}
function closeDontShow() {
  // กด "ไม่แสดงอีก 7 วัน"
  if (ann.value.id) setSeen(ann.value.id, 7)
  show.value = false
}

onMounted(async () => {
  const cached = getCached()
  if (cached && cached.id && !hasSeen(cached.id)) {
    ann.value  = cached
    show.value = true
  }

  loading.value = !show.value
  try {
    const data = await fetchAnnouncement()

    if (!data || !data.id) {
      setCached(null)
      show.value = false
      return
    }

    setCached(data)

    if (hasSeen(data.id)) {
      show.value = false
      return
    }

    ann.value  = data
    if (!dismissed.value) {
      show.value = true
      loadQuiz()
    }
  } catch {
    if (!cached) show.value = false
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* ── Overlay ─────────────────────────────────────────── */
.ann-overlay {
  position: fixed;
  inset: 0;
  z-index: 500;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(30, 8, 55, 0.65);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
@media (min-width: 600px) {
  .ann-overlay { align-items: center; padding: 24px; }
}
@media (min-width: 900px) {
  .ann-overlay { padding: 40px; }
}

/* ── Card ────────────────────────────────────────────── */
.ann-card {
  width: 100%;
  max-width: 460px;
  max-height: 92svh;
  border-radius: 28px 28px 0 0;
  overflow: hidden;
  background: #0D0820;
  padding-bottom: env(safe-area-inset-bottom);
  position: relative;
  display: flex;
  flex-direction: column;
  box-shadow:
    0 -2px 0 rgba(244, 114, 182, 0.4),
    0 -8px 40px rgba(168, 85, 247, 0.25),
    0 0 0 1px rgba(255,255,255,0.07);
}
/* Rainbow shimmer strip */
.ann-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, #F472B6, #A78BFA, #60A5FA, #34D399, #FBBF24, #F472B6);
  background-size: 300% 100%;
  animation: ann-shimmer 4s linear infinite;
  z-index: 20;
}
@media (min-width: 600px) {
  .ann-card {
    border-radius: 28px;
    max-height: calc(100dvh - 48px);
    box-shadow:
      0 28px 80px rgba(168, 85, 247, 0.3),
      0 0 0 1px rgba(255,255,255,0.1);
  }
}
@media (min-width: 900px) {
  .ann-card {
    max-width: 720px;
    max-height: calc(100dvh - 80px);
  }
}

/* ── Close button ────────────────────────────────────── */
.ann-close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.12);
  backdrop-filter: blur(12px);
  color: rgba(255,255,255,0.8);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, transform 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.ann-close-btn:hover { background: rgba(255,255,255,0.22); transform: scale(1.1) rotate(90deg); }

/* ── Video wrap ──────────────────────────────────────── */
.ann-video-wrap {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #060310;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}
.ann-iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.ann-video-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #060310;
}
.ann-spinner {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 3px solid rgba(167, 139, 250, 0.15);
  border-top-color: #C084FC;
  animation: ann-spin 0.8s linear infinite;
}
.ann-video-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgba(255,255,255,0.4);
}

.ann-video-collapsed {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(167,139,250,0.08), rgba(236,72,153,0.05));
  cursor: pointer;
  transition: background 0.18s;
  border-bottom: 1px solid rgba(167,139,250,0.1);
}
.ann-video-collapsed:hover { background: rgba(167,139,250,0.13); }
.ann-video-collapsed-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  color: rgba(196,181,253,0.7);
}
.ann-close-btn-sm {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: none;
  background: rgba(167,139,250,0.1);
  color: rgba(167,139,250,0.5);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}
.ann-close-btn-sm:hover { background: rgba(167,139,250,0.22); color: #C4B5FD; }

/* ── Transitions ─────────────────────────────────────── */
.ann-fade-enter-active { transition: opacity 0.3s ease; }
.ann-fade-leave-active { transition: opacity 0.22s ease; }
.ann-fade-enter-from,
.ann-fade-leave-to     { opacity: 0; }

.ann-fade-enter-active .ann-card {
  animation: annCardIn 0.45s cubic-bezier(0.34, 1.5, 0.64, 1);
}
.ann-fade-leave-active .ann-card {
  animation: annCardOut 0.2s ease forwards;
}
@keyframes annCardIn  { from { transform: translateY(72px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes annCardOut { from { transform: translateY(0); opacity: 1; } to { transform: translateY(32px); opacity: 0; } }

@media (min-width: 600px) {
  .ann-fade-enter-active .ann-card { animation: annCardInDt 0.38s cubic-bezier(0.34, 1.5, 0.64, 1); }
  .ann-fade-leave-active .ann-card { animation: annCardOutDt 0.2s ease forwards; }
}
@keyframes annCardInDt  { from { transform: scale(0.86); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes annCardOutDt { from { transform: scale(1); opacity: 1; } to { transform: scale(0.93); opacity: 0; } }

/* ── Play/pause hint ─────────────────────────────────── */
.ann-play-hint {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 8;
  font-size: 48px;
  filter: drop-shadow(0 0 24px rgba(236,72,153,0.7));
}
.ann-hint-enter-active { transition: opacity 0.1s ease; }
.ann-hint-leave-active { transition: opacity 0.5s ease; }
.ann-hint-enter-from,
.ann-hint-leave-to     { opacity: 0; }

/* ── Keyframes ───────────────────────────────────────── */
@keyframes ann-spin    { to { transform: rotate(360deg); } }
@keyframes ann-shimmer { from { background-position: 0 0; } to { background-position: 300% 0; } }

/* ── Card + quiz layout ──────────────────────────────── */
.ann-card.ann-has-quiz .ann-video-wrap {
  flex-shrink: 0;
}

/* ── Quiz panel ──────────────────────────────────────── */
.ann-quiz-panel {
  background: linear-gradient(180deg, #130E2E 0%, #0D0820 100%);
  border-top: 1px solid rgba(167,139,250,0.14);
  padding: 18px 16px 22px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  -webkit-overflow-scrolling: touch;
}
.ann-quiz-loading {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}
.ann-quiz-q {
  font-size: 14px;
  font-weight: 800;
  line-height: 1.5;
  background: linear-gradient(135deg, #F9A8D4 0%, #C4B5FD 60%, #93C5FD 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.ann-quiz-opts {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ann-quiz-opt {
  width: 100%;
  padding: 11px 14px;
  border-radius: 14px;
  border: 1.5px solid rgba(167,139,250,0.16);
  background: rgba(167,139,250,0.06);
  color: rgba(255,255,255,0.78);
  font-size: 13px;
  font-family: 'Sarabun', sans-serif;
  cursor: pointer;
  text-align: left;
  transition: all 0.18s;
  display: flex;
  align-items: center;
  gap: 10px;
  -webkit-tap-highlight-color: transparent;
}
.ann-quiz-opt:hover:not(:disabled) {
  background: rgba(167,139,250,0.14);
  border-color: rgba(167,139,250,0.4);
  transform: translateX(3px);
}
.ann-opt-selected {
  background: rgba(236,72,153,0.14) !important;
  border-color: #F472B6 !important;
  color: white !important;
}
.ann-opt-submitted {
  cursor: default;
  padding: 10px 14px;
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
  transform: none !important;
}
.ann-opt-indicator { font-size: 13px; flex-shrink: 0; color: rgba(167,139,250,0.55); }
.ann-opt-selected .ann-opt-indicator { color: #F9A8D4; }
.ann-opt-text { font-weight: 600; flex: 1; }

/* Result bar */
.ann-result-row { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
.ann-result-pct { font-size: 12px; font-weight: 800; color: rgba(255,255,255,0.65); flex-shrink: 0; }
.ann-result-bar-track {
  height: 6px;
  background: rgba(255,255,255,0.07);
  border-radius: 4px;
  overflow: hidden;
}
.ann-result-bar-fill {
  height: 100%;
  border-radius: 4px;
  background: rgba(167,139,250,0.45);
  transition: width 0.7s cubic-bezier(0.34,1.2,0.64,1);
}
.ann-result-mine { background: linear-gradient(90deg, #F472B6, #A78BFA); }
.ann-result-count { font-size: 10px; color: rgba(255,255,255,0.28); }

/* Progress dots */
.ann-quiz-progress {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 10px;
}
.ann-quiz-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(167,139,250,0.2);
  transition: all 0.25s;
  flex-shrink: 0;
}
.ann-quiz-dot.ann-dot-active {
  width: 18px;
  border-radius: 4px;
  background: #C084FC;
}
.ann-quiz-dot.ann-dot-done { background: rgba(167,139,250,0.5); cursor: pointer; }

/* Navigation (prev / next / submit) */
.ann-quiz-nav {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 4px;
}
.ann-quiz-nav-prev {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1.5px solid rgba(167,139,250,0.25);
  background: rgba(167,139,250,0.08);
  color: rgba(196,181,253,0.7);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.18s;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}
.ann-quiz-nav-prev:hover { background: rgba(167,139,250,0.18); color: #C4B5FD; }
.ann-quiz-nav-next {
  flex: 1;
  padding: 11px 8px;
  border-radius: 20px;
  border: none;
  background: rgba(167,139,250,0.18);
  color: #C4B5FD;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  font-family: 'Sarabun', sans-serif;
  transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
}
.ann-quiz-nav-next:hover:not(:disabled) { background: rgba(167,139,250,0.3); }
.ann-quiz-nav-next:disabled { opacity: 0.32; cursor: not-allowed; }

/* Done + result navigation */
.ann-quiz-done-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}
.ann-quiz-result-nav {
  display: flex;
  align-items: center;
  gap: 12px;
}
.ann-quiz-result-label {
  font-size: 11px;
  font-weight: 700;
  color: rgba(196,181,253,0.6);
  min-width: 60px;
  text-align: center;
}

/* Submit / done */
.ann-quiz-footer { margin-top: 2px; }
.ann-quiz-submit {
  flex: 1;
  width: 100%;
  padding: 14px;
  border-radius: 20px;
  border: none;
  background: linear-gradient(135deg, #EC4899, #A855F7, #6366F1);
  color: white;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
  font-family: 'Sarabun', sans-serif;
  box-shadow: 0 6px 24px rgba(236,72,153,0.4);
  transition: all 0.22s;
  -webkit-tap-highlight-color: transparent;
  letter-spacing: 0.3px;
}
.ann-quiz-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(236,72,153,0.55);
}
.ann-quiz-submit:active:not(:disabled) { transform: scale(0.97); }
.ann-quiz-submit:disabled { opacity: 0.38; cursor: not-allowed; }

.ann-quiz-done {
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  color: rgba(249,168,212,0.75);
  padding: 4px 0 2px;
  letter-spacing: 0.3px;
}
</style>
