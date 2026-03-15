<template>
  <div v-if="training.isLoading" class="tr-loading">⏳ กำลังโหลด...</div>
  <div v-else class="tr-cat-grid">
    <button
      v-for="cat in training.categories"
      :key="cat.key"
      class="tr-cat-card"
      :style="{ '--cat-color': cat.color, '--cat-bg': cat.bgColor }"
      @click="$emit('open-category', cat)"
    >
      <div class="tr-cat-icon">{{ cat.icon }}</div>
      <div class="tr-cat-name">{{ cat.name }}</div>
      <div class="tr-cat-tag">{{ cat.tag }}</div>
      <div class="tr-cat-count">
        {{ countByCategory(cat.key) }}
        {{ cat.key === 'site' ? 'สถานที่' : cat.key === 'blog' ? 'โพสต์' : cat.key === 'idp' ? 'วิดีโอ' : 'หลักสูตร' }}
      </div>
    </button>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useTrainingStore } from '../../../stores/training.js'
import { useBlogStore }     from '../../../stores/blog.js'

defineEmits(['open-category'])

const training = useTrainingStore()
const blog     = useBlogStore()

onMounted(() => training.loadIdpVideos())

function countByCategory(key) {
  if (key === 'site') return training.siteVisits.length
  if (key === 'blog') return blog.posts.length
  if (key === 'idp')  return training.idpVideos.length
  return (training.courses || []).filter(c => c.category === key).length
}
</script>

<style scoped>
@import './training.css';
</style>
