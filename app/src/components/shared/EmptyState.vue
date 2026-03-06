<template>
  <div class="empty-state">
    <div class="empty-icon">{{ icon }}</div>
    <div class="empty-title">{{ title }}</div>
    <div v-if="sub" class="empty-sub">{{ sub }}</div>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, default: '📭' },
  title: { type: String, required: true },
  sub: { type: String, default: '' }
})
</script>

<style scoped>
.empty-state { text-align: center; padding: 32px 16px; }
.empty-icon { font-size: 48px; margin-bottom: 10px; }
.empty-title { font-size: 14px; font-weight: 700; color: var(--mid); }
.empty-sub { font-size: 12px; color: var(--light); margin-top: 4px; }
</style>
