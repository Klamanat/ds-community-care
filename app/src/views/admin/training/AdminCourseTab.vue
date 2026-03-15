<template>
  <div class="al-card">
    <div v-if="loading" class="al-loading">⏳ กำลังโหลด...</div>
    <div v-else-if="!rows.length" class="al-empty">📭 ไม่มีหลักสูตรในหมวดนี้</div>
    <div v-else>
      <div class="al-item" v-for="r in rows" :key="r.id">
        <div class="al-item-body">
          <div class="al-item-title">{{ r.title }}</div>
          <div v-if="r.instructor" class="al-item-sub">👩‍🏫 {{ r.instructor }}</div>
          <div class="al-item-meta">
            <span class="al-badge" :class="r.section ? 'al-badge-blue' : 'al-badge-pending'">
              {{ sectionLabel(r.section) }}
            </span>
          </div>
        </div>
        <div class="al-item-actions">
          <button class="al-btn al-btn-edit"   @click="$emit('edit', r)">แก้ไข</button>
          <button class="al-btn al-btn-delete" @click="$emit('delete', r)">ลบ</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  rows:    { type: Array,   default: () => [] },
  loading: { type: Boolean, default: false },
})
defineEmits(['edit', 'delete'])

function sectionLabel(sec) {
  if (!sec) return 'ไม่ระบุ section'
  if (sec.startsWith('train')) return `📅 เทรน ${sec.replace('train', '')}`
  if (sec === 'new') return '✨ ใหม่'
  return sec
}
</script>

<style scoped>
@import '../admin.css';
</style>
