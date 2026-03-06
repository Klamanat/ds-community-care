<template>
  <RouterLink
    :to="to"
    class="nav-i ripple-host"
    :class="{ active: isActive }"
    @click.passive="handleRippleClick"
    custom
    v-slot="{ navigate }"
  >
    <div
      class="nav-i ripple-host"
      :class="{ active: isActive }"
      @click="(e) => { handleRippleClick(e); navigate(e) }"
    >
      <span class="nav-ico">{{ icon }}</span>
      <span v-if="badge && badge > 0" class="nav-badge">{{ badge }}</span>
      <span class="nav-lbl">{{ label }}</span>
    </div>
  </RouterLink>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useRipple } from '../../composables/useRipple.js'

const props = defineProps({
  to: { type: String, required: true },
  icon: { type: String, required: true },
  label: { type: String, required: true },
  badge: { type: Number, default: 0 },
  mobile: { type: Boolean, default: false }
})

const route = useRoute()
const isActive = computed(() => {
  if (props.to === '/') return route.path === '/'
  return route.path.startsWith(props.to)
})

const { handleRippleClick } = useRipple()
</script>
