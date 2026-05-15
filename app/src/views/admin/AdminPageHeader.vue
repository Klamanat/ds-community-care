<template>
  <div class="al-page-banner">
    <div class="al-page-banner-left">
      <h1 class="al-page-banner-title">{{ title }}</h1>
      <p v-if="sub" class="al-page-banner-sub">{{ sub }}</p>
    </div>
    <div class="al-page-banner-actions">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  sub:   { type: String, default: '' },
})
</script>

<style scoped>
.al-page-banner-title {
  font-size: 22px;
  font-weight: 900;
  color: white;
  margin: 0;
  line-height: 1.2;
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 10px rgba(0,0,0,0.30), 0 1px 3px rgba(0,0,0,0.20);
}
@media (min-width: 768px) {
  .al-page-banner-title { font-size: 26px; }
}
.al-page-banner-sub {
  font-size: 13px;
  color: rgba(255,255,255,0.92);
  font-weight: 700;
  margin: 3px 0 0;
  text-shadow: 0 1px 4px rgba(0,0,0,0.25);
  letter-spacing: 0.01em;
}
</style>
