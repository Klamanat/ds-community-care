<template>
  <div>
    <!-- ── Poster Timeline ── -->
    <div class="idp-section-label">📋 IDP Plan {{ currentYear }}</div>
    <div v-if="training.idpLoading" class="idp-skeletons">
      <div v-for="i in 3" :key="i" class="idp-skeleton"></div>
    </div>
    <div v-else-if="!training.idpPosters.length" class="tr-section-empty">
      ยังไม่มีโปสเตอร์ — รอ Admin อัปโหลด 📌
    </div>
    <div v-else class="idp-timeline">
      <div v-for="poster in training.idpPosters" :key="poster.id" class="idp-tl-item">
        <div class="idp-tl-dot"></div>
        <div class="idp-tl-card">
          <div v-if="poster.date" class="idp-tl-date">{{ formatMonth(poster.date) }}</div>
          <img
            v-if="poster.imageUrl"
            :src="poster.imageUrl"
            :alt="poster.title"
            class="idp-tl-img"
            loading="lazy"
            @error="onImgError"
          />
          <div class="idp-tl-info">
            <div class="idp-tl-title">{{ poster.title }}</div>
            <div v-if="poster.description" class="idp-tl-desc">{{ poster.description }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Video Grid ── -->
    <div class="idp-section-label" style="margin-top:24px;">🎬 วิดีโอ</div>
    <div v-if="training.idpLoading" class="idp-skeletons">
      <div v-for="i in 2" :key="i" class="idp-skeleton idp-skeleton--video"></div>
    </div>
    <div v-else-if="!training.idpVideos.length" class="tr-section-empty">
      ยังไม่มีวิดีโอ — รอ Admin เพิ่ม link 🎬
    </div>
    <div v-else class="idp-video-grid">
      <div
        v-for="video in training.idpVideos"
        :key="video.id"
        class="idp-video-card"
        @click="openVideo(video)"
      >
        <div class="idp-video-thumb">
          <img
            v-if="getYtId(video.videoUrl)"
            :src="`https://img.youtube.com/vi/${getYtId(video.videoUrl)}/hqdefault.jpg`"
            :alt="video.title"
            class="idp-video-thumb-img"
            loading="lazy"
            @error="onImgError"
          />
          <div v-else class="idp-video-thumb-placeholder">🎬</div>
          <div class="idp-video-play">▶</div>
        </div>
        <div class="idp-video-info">
          <div class="idp-video-title">{{ video.title }}</div>
          <div v-if="video.description" class="idp-video-desc">{{ video.description }}</div>
        </div>
      </div>
    </div>

    <!-- ── Video lightbox ── -->
    <Teleport to="body">
      <div v-if="activeVideo" class="idp-lightbox" @click.self="closeVideo">
        <div class="idp-lb-box">
          <button class="idp-lb-close" @click="closeVideo">✕</button>
          <div class="idp-lb-title">{{ activeVideo.title }}</div>
          <div class="idp-lb-embed-wrap">
            <iframe
              v-if="getEmbedUrl(activeVideo)"
              :src="getEmbedUrl(activeVideo)"
              class="idp-lb-iframe"
              frameborder="0"
              allow="autoplay; encrypted-media; picture-in-picture; web-share"
              allowfullscreen="true"
            ></iframe>
            <a v-else :href="activeVideo.videoUrl" target="_blank" rel="noopener" class="idp-lb-link">
              🔗 เปิดวิดีโอในหน้าใหม่
            </a>
          </div>
          <div v-if="activeVideo.description" class="idp-lb-desc">{{ activeVideo.description }}</div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useTrainingStore } from '../../../stores/training.js'

const training    = useTrainingStore()
const activeVideo = ref(null)
const currentYear = new Date().getFullYear()

onMounted(async () => {
  await Promise.all([training.loadIdpPosters(), training.loadIdpVideos()])
})

function formatMonth(date) {
  if (!date) return ''
  const parts = date.split('-')
  if (parts.length < 2) return date
  const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
  const month = months[parseInt(parts[1]) - 1] || parts[1]
  const year  = parseInt(parts[0]) + 543
  return `${month} ${year}`
}

function getYtId(url) {
  if (!url) return null
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

function getEmbedUrl(video) {
  const id = getYtId(video.videoUrl)
  return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : null
}

function openVideo(video) {
  activeVideo.value = video
}

function closeVideo() {
  activeVideo.value = null
}

function onImgError(e) {
  e.target.style.display = 'none'
}
</script>

<style scoped>
@import './training.css';

/* ── Section label ── */
.idp-section-label {
  font-size: 13px; font-weight: 800; color: #7C3AED;
  margin-bottom: 14px; letter-spacing: 0.3px;
}

/* ── Skeletons ── */
.idp-skeletons { display: flex; flex-direction: column; gap: 14px; }
.idp-skeleton {
  height: 200px; border-radius: 16px;
  background: linear-gradient(90deg,#F3F4F6 25%,#E9EAEC 50%,#F3F4F6 75%);
  background-size: 200% 100%; animation: shimmer 1.4s infinite;
}
.idp-skeleton--video { height: 160px; }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* ── Poster Timeline ── */
.idp-timeline {
  position: relative;
  padding-left: 26px;
}
.idp-timeline::before {
  content: '';
  position: absolute; left: 8px; top: 18px; bottom: 18px;
  width: 2px; background: linear-gradient(to bottom, #D8B4FE, #E9D5FF 80%, transparent);
}
.idp-tl-item {
  position: relative;
  margin-bottom: 20px;
}
.idp-tl-item:last-child { margin-bottom: 0; }
.idp-tl-dot {
  position: absolute; left: -21px; top: 18px;
  width: 10px; height: 10px; border-radius: 50%;
  background: #A855F7; border: 2px solid #fff;
  box-shadow: 0 0 0 2.5px #A855F7;
}
.idp-tl-card {
  background: #fff;
  border: 1.5px solid #F3E8FF;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(168,85,247,0.07);
}
.idp-tl-date {
  font-size: 11px; font-weight: 800;
  color: #A855F7; background: #FAF5FF;
  padding: 7px 16px;
  border-bottom: 1px solid #F3E8FF;
  letter-spacing: 0.4px;
}
.idp-tl-img {
  width: 100%; display: block;
  object-fit: contain;
  background: #FAFAFA;
  max-height: 480px;
}
.idp-tl-info { padding: 12px 16px 14px; }
.idp-tl-title {
  font-size: 14px; font-weight: 800; color: #111827;
  line-height: 1.4; margin-bottom: 4px;
}
.idp-tl-desc {
  font-size: 12px; color: #6B7280; line-height: 1.65;
}

/* ── Video Grid ── */
.idp-video-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.idp-video-card {
  background: #fff;
  border: 1.5px solid #E5E7EB;
  border-radius: 12px; overflow: hidden;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: transform 0.15s, box-shadow 0.15s;
}
.idp-video-card:active {
  transform: scale(0.97);
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}
.idp-video-thumb {
  position: relative;
  background: #111; width: 100%;
  padding-top: 56.25%; /* 16:9 */
  overflow: hidden;
}
.idp-video-thumb-img {
  position: absolute; inset: 0;
  width: 100%; height: 100%; object-fit: cover;
}
.idp-video-thumb-placeholder {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; background: #1E1B4B;
}
.idp-video-play {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.32);
  color: #fff; font-size: 22px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.5);
  transition: background 0.15s;
}
.idp-video-card:active .idp-video-play { background: rgba(0,0,0,0.5); }
.idp-video-info { padding: 6px 8px 8px; }
.idp-video-title {
  font-size: 11px; font-weight: 800; color: #111827;
  line-height: 1.35;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.idp-video-desc { display: none; }

/* ── Video Lightbox ── */
.idp-lightbox {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.88);
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
}
.idp-lb-box {
  background: #111827;
  border-radius: 20px; overflow: hidden;
  width: 100%; max-width: 640px;
  position: relative;
}
.idp-lb-close {
  position: absolute; top: 10px; right: 12px; z-index: 10;
  width: 32px; height: 32px; border-radius: 50%;
  background: rgba(255,255,255,0.15); border: none; color: #fff;
  font-size: 14px; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s;
}
.idp-lb-close:hover { background: rgba(255,255,255,0.28); }
.idp-lb-title {
  font-size: 14px; font-weight: 800; color: #fff;
  padding: 14px 48px 10px 16px; line-height: 1.4;
}
.idp-lb-embed-wrap {
  position: relative; width: 100%;
  padding-top: 56.25%;
  background: #000;
}
.idp-lb-iframe {
  position: absolute; inset: 0; width: 100%; height: 100%;
}
.idp-lb-link {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  color: #C084FC; font-size: 15px; font-weight: 800;
  text-decoration: none;
}
.idp-lb-desc {
  font-size: 13px; color: #9CA3AF;
  padding: 12px 16px 16px; line-height: 1.6;
}
</style>
