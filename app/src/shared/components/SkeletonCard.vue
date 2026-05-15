<template>
  <div
    class="skeleton overflow-hidden rounded-md"
    :style="{ height: height || '120px', borderRadius: radius || '14px' }"
  ></div>
</template>

<script setup>
defineProps({ height: String, radius: String })
</script>
