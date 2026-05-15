<template>
  <div class="text-center py-8 px-4">
    <div class="text-[48px] mb-2">{{ icon }}</div>
    <div class="text-[14px] font-bold text-app-mid">{{ title }}</div>
    <div v-if="sub" class="text-[12px] text-app-light mt-1">{{ sub }}</div>
  </div>
</template>

<script setup>
defineProps({
  icon:  { type: String, default: '📭' },
  title: { type: String, required: true },
  sub:   { type: String, default: '' }
})
</script>
