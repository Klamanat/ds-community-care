<template>
  <div class="admin-page">
    <div class="admin-page-header">
      <h1 class="admin-page-title">📝 จัดการบล็อก</h1>
      <button class="abv-refresh-btn" @click="load(true)">🔄 รีเฟรช</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="abv-loading">⏳ กำลังโหลด...</div>

    <!-- Empty -->
    <div v-else-if="!posts.length" class="abv-empty">ยังไม่มีโพสต์</div>

    <!-- Table -->
    <div v-else class="abv-table-wrap">
      <table class="abv-table">
        <thead>
          <tr>
            <th>หมวด</th>
            <th>หัวข้อ</th>
            <th>ผู้เขียน</th>
            <th>วันที่</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="post in posts" :key="post.id" class="abv-row">
            <td>
              <span class="abv-cat-badge" :style="catStyle(post.category)">
                {{ getCatInfo(post.category).label }}
              </span>
            </td>
            <td class="abv-title-cell">
              <div class="abv-title">{{ post.title }}</div>
              <div class="abv-excerpt">{{ post.body?.slice(0, 80) }}{{ post.body?.length > 80 ? '...' : '' }}</div>
            </td>
            <td class="abv-author">{{ post.authorName || '—' }}</td>
            <td class="abv-date">{{ formatDate(post.createdAt) }}</td>
            <td>
              <button
                class="abv-del-btn"
                :disabled="deletingId === post.id"
                @click="deletePost(post)"
              >
                {{ deletingId === post.id ? '⏳' : '🗑️' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { adminGetBlogPosts, adminDeleteBlogPost } from '../../services/blogService.js'
import { getCatInfo } from '../../stores/blog.js'

const posts      = ref([])
const loading    = ref(false)
const deletingId = ref(null)

async function load(force = false) {
  loading.value = true
  try {
    posts.value = await adminGetBlogPosts()
  } catch {
    posts.value = []
  } finally {
    loading.value = false
  }
}

async function deletePost(post) {
  if (!confirm(`ลบโพสต์ "${post.title}" ใช่ไหม?`)) return
  deletingId.value = post.id
  try {
    await adminDeleteBlogPost(post.id)
    posts.value = posts.value.filter(p => p.id !== post.id)
  } catch {
    alert('ลบไม่สำเร็จ')
  } finally {
    deletingId.value = null
  }
}

function catStyle(key) {
  const c = getCatInfo(key)
  return { background: c.bg, color: c.color, border: `1px solid ${c.color}33` }
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
}

onMounted(() => load())
</script>

<style scoped>
.abv-refresh-btn {
  font-size: 12px; font-weight: 700;
  background: #F0F9FF; color: #0369A1;
  border: 1.5px solid #BAE6FD;
  border-radius: 8px; padding: 6px 14px; cursor: pointer;
}
.abv-loading { padding: 32px; color: #9CA3AF; font-size: 14px; text-align: center; }
.abv-empty   { padding: 48px; color: #9CA3AF; font-size: 14px; text-align: center; }

.abv-table-wrap { overflow-x: auto; border-radius: 12px; border: 1px solid #E5E7EB; }
.abv-table {
  width: 100%; border-collapse: collapse;
  font-size: 13px;
}
.abv-table thead tr {
  background: #F9FAFB;
}
.abv-table th {
  padding: 10px 14px;
  text-align: left; font-size: 11px; font-weight: 700;
  color: #6B7280; text-transform: uppercase; letter-spacing: 0.4px;
  border-bottom: 1px solid #E5E7EB;
}
.abv-table td { padding: 12px 14px; border-bottom: 1px solid #F3F4F6; vertical-align: top; }
.abv-row:last-child td { border-bottom: none; }
.abv-row:hover { background: #FAFAFA; }

.abv-cat-badge {
  display: inline-block;
  font-size: 10px; font-weight: 700;
  padding: 3px 10px; border-radius: 20px; white-space: nowrap;
}
.abv-title-cell { max-width: 260px; }
.abv-title   { font-weight: 700; color: #111827; margin-bottom: 3px; line-height: 1.35; }
.abv-excerpt { font-size: 11px; color: #9CA3AF; line-height: 1.5; }
.abv-author  { color: #374151; white-space: nowrap; }
.abv-date    { color: #9CA3AF; white-space: nowrap; font-size: 12px; }

.abv-del-btn {
  font-size: 16px; background: none; border: none; cursor: pointer;
  padding: 4px 8px; border-radius: 6px; transition: background 0.12s;
}
.abv-del-btn:hover   { background: #FEF2F2; }
.abv-del-btn:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
