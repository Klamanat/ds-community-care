<template>
  <BaseModal modal-id="modal-blog-post" sheet-class="modal-sheet--blog">
    <!-- Header -->
    <div class="bp-header" :style="headerStyle">
      <div class="modal-handle" style="background:rgba(255,255,255,0.4);"></div>

      <div v-if="post" style="position:relative;z-index:1;margin-top:10px;">
        <div class="bp-cat-badge">{{ catInfo.label }}</div>
        <div class="bp-title">{{ post.title }}</div>
        <div class="bp-meta">
          <span class="bp-author">✍️ {{ post.authorName || 'ไม่ระบุชื่อ' }}</span>
          <span class="bp-dot">·</span>
          <span class="bp-date">{{ formatDate(post.createdAt) }}</span>
        </div>
      </div>
      <div v-else style="position:relative;z-index:1;margin-top:10px;">
        <div style="font-size:28px;font-weight:900;color:#fff;">📝 บล็อก</div>
      </div>
    </div>

    <!-- Body -->
    <div class="modal-body-scroll" style="padding:20px;">
      <div v-if="!post" class="bp-empty">ไม่พบบทความ</div>
      <div v-else class="bp-body">{{ post.body }}</div>
    </div>
  </BaseModal>
</template>

<script setup>
import { computed } from 'vue'
import BaseModal from '../shared/BaseModal.vue'
import { useBlogStore, getCatInfo } from '../../stores/blog.js'

const blog = useBlogStore()
const post = computed(() => blog.selectedPost)

const catInfo = computed(() => post.value ? getCatInfo(post.value.category) : getCatInfo('other'))

const headerStyle = computed(() => {
  const c = catInfo.value.color || '#6366F1'
  return `background: linear-gradient(135deg, ${c}66 0%, ${c}bb 40%, ${c} 100%);
    padding: 0 20px 20px; position: relative; overflow: hidden;
    flex-shrink: 0; border-radius: 28px 28px 0 0;`
})

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<style scoped>
.bp-header {
  min-height: 130px;
}
.bp-cat-badge {
  display: inline-block;
  font-size: 11px; font-weight: 700;
  background: rgba(255,255,255,0.25);
  color: #fff; padding: 4px 12px; border-radius: 20px;
  margin-bottom: 10px;
  border: 1px solid rgba(255,255,255,0.35);
}
.bp-title {
  font-size: 20px; font-weight: 900;
  color: #fff; line-height: 1.3;
  text-shadow: 0 2px 6px rgba(0,0,0,0.15);
  margin-bottom: 10px;
}
.bp-meta {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: rgba(255,255,255,0.8);
}
.bp-author { font-weight: 700; }
.bp-dot    { opacity: 0.6; }
.bp-date   { opacity: 0.8; }

.bp-empty {
  text-align: center; padding: 40px 0;
  font-size: 14px; color: #9CA3AF;
}
.bp-body {
  font-size: 15px; color: #1F2937;
  line-height: 1.85;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
