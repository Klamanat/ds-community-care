<template>
  <Teleport to="body">
    <Transition name="ann-fade">
      <div
        v-if="show"
        class="ann-overlay"
        @click.self="close"
      >
        <div class="ann-card">

          <!-- ══ VIDEO (full card) ════════════════════════════════ -->
          <div class="ann-video-wrap">

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

            <!-- HTML5 video (Drive / direct URL) -->
            <video
              v-else-if="videoSrc"
              ref="videoRef"
              :src="videoSrc"
              class="ann-iframe"
              autoplay
              loop
              muted
              playsinline
              style="object-fit:cover;"
              @canplay="playVideo"
              @loadeddata="playVideo"
            ></video>

            <!-- No video placeholder -->
            <div v-else class="ann-video-empty">
              <span style="font-size:36px;">🎬</span>
              <span style="font-size:12px;font-weight:600;opacity:0.6;">ไม่มีวิดีโอ</span>
            </div>

            <!-- Floating close button -->
            <button class="ann-close-btn" @click="close">✕</button>

            <!-- Floating actions at bottom -->
            <div class="ann-actions">
              <button class="ann-btn-ghost" @click="closeDontShow">ไม่แสดงอีก 7 วัน</button>
              <button class="ann-btn-primary" @click="closeAck">รับทราบ ✓</button>
            </div>

          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { fetchAnnouncement } from '../../services/announcementService.js'

const show      = ref(false)
const loading   = ref(false)
const videoRef  = ref(null)
const dismissed = ref(false)   // ปิดแล้วใน session นี้ → ไม่เปิดซ้ำ
const ann       = ref({ title: '', videoUrl: '', desc: '', id: '' })

function playVideo() {
  const el = videoRef.value
  if (!el) return
  el.muted = true
  el.loop  = true
  el.play().catch(() => {})
}

// เมื่อ modal เปิด — รอ DOM แล้ว play
watch(show, async (val) => {
  if (!val) return
  await nextTick()
  playVideo()
})

// YouTube / Drive → iframe embed, Supabase Storage / direct URL → HTML5 video
const embedUrl = computed(() => {
  const url = ann.value.videoUrl || ''
  if (!url) return ''
  // YouTube
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1&loop=1&playlist=${yt[1]}&mute=1&controls=0&rel=0&modestbranding=1`
  // Google Drive — use /preview iframe (Drive doesn't support HTML5 video streaming)
  const drive = url.match(/drive\.google\.com\/file\/d\/([^/]+)/)
  if (drive) return `https://drive.google.com/file/d/${drive[1]}/preview`
  return ''
})

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
      if (!show.value) setCached(null)
      else if (!cached) show.value = false
      return
    }

    setCached(data)

    if (hasSeen(data.id)) {
      show.value = false
      return
    }

    ann.value  = data
    if (!dismissed.value) show.value = true
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
  background: rgba(15, 10, 40, 0.6);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
@media (min-width: 600px) {
  .ann-overlay { align-items: center; padding: 24px; }
}

/* ── Card ────────────────────────────────────────────── */
.ann-card {
  width: 100%;
  max-width: 480px;
  border-radius: 28px 28px 0 0;
  overflow: hidden;
  box-shadow:
    0 -4px 40px rgba(124, 58, 237, 0.25),
    0 0 0 1px rgba(255,255,255,0.08);
  background: #000;
}
@media (min-width: 600px) {
  .ann-card {
    border-radius: 24px;
    box-shadow:
      0 24px 80px rgba(79, 70, 229, 0.35),
      0 0 0 1px rgba(255,255,255,0.1);
  }
}

/* Close button — floating top-right */
.ann-close-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 10;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  color: white;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.ann-close-btn:hover { background: rgba(0, 0, 0, 0.65); }

/* ── Video (fills entire card) ───────────────────────── */
.ann-video-wrap {
  width: 100%;
  aspect-ratio: 9 / 16;
  max-height: 88dvh;
  background: #0a0a14;
  position: relative;
  overflow: hidden;
}
@media (min-width: 600px) {
  .ann-video-wrap { aspect-ratio: 16 / 9; max-height: none; }
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
  background: #0a0a14;
}
.ann-spinner {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 3px solid rgba(255,255,255,0.1);
  border-top-color: rgba(255,255,255,0.7);
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
  color: white;
}

/* Actions — floating bottom */
.ann-actions {
  position: absolute;
  bottom: 20px;
  left: 16px;
  right: 16px;
  z-index: 10;
  display: flex;
  gap: 10px;
}
.ann-btn-ghost {
  flex: 1;
  padding: 11px 8px;
  border-radius: 16px;
  border: 1.5px solid rgba(255,255,255,0.3);
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(8px);
  color: rgba(255,255,255,0.85);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  font-family: 'Sarabun', sans-serif;
  transition: background 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.ann-btn-ghost:hover { background: rgba(0,0,0,0.6); }

.ann-btn-primary {
  flex: 2;
  padding: 12px 8px;
  border-radius: 16px;
  border: none;
  background: linear-gradient(135deg, #6366F1, #A855F7, #EC4899);
  background-size: 200% 200%;
  color: white;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
  font-family: 'Sarabun', sans-serif;
  box-shadow: 0 4px 18px rgba(124, 58, 237, 0.4);
  transition: opacity 0.15s, transform 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.ann-btn-primary:hover  { opacity: 0.92; }
.ann-btn-primary:active { transform: scale(0.97); }

/* ── Transitions ─────────────────────────────────────── */
.ann-fade-enter-active { transition: opacity 0.3s ease; }
.ann-fade-leave-active { transition: opacity 0.2s ease; }
.ann-fade-enter-from,
.ann-fade-leave-to     { opacity: 0; }

/* Card slides up on enter (mobile) */
.ann-fade-enter-active .ann-card {
  animation: annCardIn 0.4s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.ann-fade-leave-active .ann-card {
  animation: annCardOut 0.2s ease forwards;
}

@keyframes annCardIn  { from { transform: translateY(60px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes annCardOut { from { transform: translateY(0);   opacity: 1; } to { transform: translateY(30px); opacity: 0; } }

/* Desktop: scale instead of slide */
@media (min-width: 600px) {
  .ann-fade-enter-active .ann-card { animation: annCardInDt 0.35s cubic-bezier(0.34, 1.4, 0.64, 1); }
  .ann-fade-leave-active .ann-card { animation: annCardOutDt 0.2s ease forwards; }
}
@keyframes annCardInDt  { from { transform: scale(0.88); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes annCardOutDt { from { transform: scale(1);    opacity: 1; } to { transform: scale(0.93); opacity: 0; } }

/* ── Keyframes ───────────────────────────────────────── */
@keyframes ann-spin  { to { transform: rotate(360deg); } }
@keyframes ann-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
</style>
