<template>
  <div class="skeleton-card" :style="{ height: height || '120px', borderRadius: radius || '16px' }">
    <div class="skeleton" style="height:100%;"></div>
  </div>
</template>

<script setup>
defineProps({ height: String, radius: String })
</script>

<style scoped>
.skeleton-card { overflow: hidden; }
</style>
