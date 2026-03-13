<template>
  <Teleport to="body">
    <Transition name="ann-fade">
      <div
        v-if="show"
        class="ann-overlay"
        @click.self="close"
      >
        <div class="ann-card">

          <!-- ══ HEADER ══════════════════════════════════════════ -->
          <div class="ann-header">
            <!-- Decorative orbs -->
            <div class="ann-orb ann-orb-1"></div>
            <div class="ann-orb ann-orb-2"></div>
            <div class="ann-orb ann-orb-3"></div>

            <!-- Pull handle (mobile) -->
            <div class="ann-handle"></div>

            <!-- Top row: badge + close -->
            <div class="ann-header-row">
              <div class="ann-badge">
                <span style="font-size:11px;">📢</span>
                <span>ประกาศ</span>
              </div>
              <button class="ann-close-btn" @click="close">✕</button>
            </div>

            <!-- Icon circle -->
            <div class="ann-icon-wrap">
              <div class="ann-icon-ring">
                <span style="font-size:28px;line-height:1;">📣</span>
              </div>
            </div>

            <!-- Title -->
            <div v-if="loading && !ann.title" class="ann-title-skeleton"></div>
            <div v-else class="ann-title">{{ ann.title || 'กำลังโหลด...' }}</div>
          </div>

          <!-- ══ VIDEO ════════════════════════════════════════════ -->
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
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            ></iframe>

            <!-- HTML5 video -->
            <video
              v-else-if="ann.videoUrl"
              :src="ann.videoUrl"
              class="ann-iframe"
              controls
              playsinline
              style="object-fit:contain;"
            ></video>

            <!-- No video placeholder -->
            <div v-else class="ann-video-empty">
              <span style="font-size:36px;">🎬</span>
              <span style="font-size:12px;font-weight:600;opacity:0.6;">ไม่มีวิดีโอ</span>
            </div>
          </div>

          <!-- ══ BODY ═════════════════════════════════════════════ -->
          <div class="ann-body">
            <!-- Desc skeleton -->
            <div v-if="loading && !ann.desc" class="ann-desc-skeleton">
              <div class="ann-skel-line" style="width:100%"></div>
              <div class="ann-skel-line" style="width:75%"></div>
            </div>
            <p v-else-if="ann.desc" class="ann-desc">{{ ann.desc }}</p>

            <!-- Actions -->
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
import { ref, computed, onMounted } from 'vue'
import { fetchAnnouncement } from '../../services/announcementService.js'

const show      = ref(false)
const loading   = ref(false)
const dismissed = ref(false)   // ปิดแล้วใน session นี้ → ไม่เปิดซ้ำ
const ann       = ref({ title: '', videoUrl: '', desc: '', id: '' })

const embedUrl = computed(() => {
  const url = ann.value.videoUrl || ''
  if (!url) return ''
  let m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/)
  if (m) return `https://www.youtube.com/embed/${m[1]}?autoplay=1&rel=0`
  m = url.match(/drive\.google\.com\/file\/d\/([^/]+)/)
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`
  return ''
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
  max-height: 92dvh;
  display: flex;
  flex-direction: column;
  border-radius: 28px 28px 0 0;
  overflow: hidden;
  box-shadow:
    0 -4px 40px rgba(124, 58, 237, 0.25),
    0 0 0 1px rgba(255,255,255,0.08);
}
@media (min-width: 600px) {
  .ann-card {
    border-radius: 24px;
    box-shadow:
      0 24px 80px rgba(79, 70, 229, 0.35),
      0 0 0 1px rgba(255,255,255,0.1);
  }
}

/* ── Header ──────────────────────────────────────────── */
.ann-header {
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  background: linear-gradient(145deg, #4F46E5 0%, #7C3AED 45%, #C026D3 80%, #DB2777 100%);
  padding: 0 16px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

/* Decorative orbs */
.ann-orb {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  pointer-events: none;
}
.ann-orb-1 { width: 160px; height: 160px; top: -60px; right: -40px; filter: blur(30px); }
.ann-orb-2 { width: 90px;  height: 90px;  bottom: -20px; left: -20px; filter: blur(20px); }
.ann-orb-3 { width: 50px;  height: 50px;  top: 30px; left: 30%; filter: blur(12px); background: rgba(255,200,255,0.2); }

/* Pull handle */
.ann-handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.35);
  margin: 10px auto 4px;
}
@media (min-width: 600px) { .ann-handle { display: none; } }

/* Top row */
.ann-header-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 1;
}

/* Badge pill */
.ann-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

/* Close button */
.ann-close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.18);
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
.ann-close-btn:hover { background: rgba(255, 255, 255, 0.3); }

/* Icon circle */
.ann-icon-wrap {
  position: relative;
  z-index: 1;
  margin-top: 4px;
}
.ann-icon-ring {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 0 0 8px rgba(255,255,255,0.06),
    0 4px 20px rgba(0,0,0,0.2);
}

/* Title */
.ann-title {
  position: relative;
  z-index: 1;
  color: white;
  font-size: 18px;
  font-weight: 900;
  text-align: center;
  line-height: 1.35;
  text-shadow: 0 1px 8px rgba(0,0,0,0.25);
  padding: 0 8px;
}
.ann-title-skeleton {
  width: 180px;
  height: 22px;
  border-radius: 8px;
  background: rgba(255,255,255,0.2);
  animation: ann-pulse 1.2s ease-in-out infinite;
}

/* ── Video ───────────────────────────────────────────── */
.ann-video-wrap {
  flex-shrink: 0;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #0a0a14;
  position: relative;
  overflow: hidden;
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

/* ── Body ────────────────────────────────────────────── */
.ann-body {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: white;
  padding: 18px 18px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Desc */
.ann-desc {
  font-size: 13px;
  color: #4B5563;
  line-height: 1.7;
  margin: 0;
}
.ann-desc-skeleton { display: flex; flex-direction: column; gap: 8px; }
.ann-skel-line {
  height: 12px;
  border-radius: 6px;
  background: #F3F4F6;
  animation: ann-pulse 1.2s ease-in-out infinite;
}

/* Actions */
.ann-actions {
  display: flex;
  gap: 10px;
  margin-top: auto;
}
.ann-btn-ghost {
  flex: 1;
  padding: 11px 8px;
  border-radius: 16px;
  border: 1.5px solid #E5E7EB;
  background: #F9FAFB;
  color: #6B7280;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  font-family: 'Sarabun', sans-serif;
  transition: border-color 0.15s, color 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.ann-btn-ghost:hover { border-color: #A78BFA; color: #7C3AED; }

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
