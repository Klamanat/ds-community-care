<template>
  <div class="acm-wrap" ref="wrapRef">
    <button class="acm-btn" @click.stop="toggle" title="Admin Actions">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L4 5.5V11c0 4.5 3.5 8.7 8 10 4.5-1.3 8-5.5 8-10V5.5L12 2zm0 2.18l6 2.68V11c0 3.6-2.7 7-6 8.2C8.7 18 6 14.6 6 11V6.86l6-2.68z"/>
        <circle cx="12" cy="12" r="2.5"/>
      </svg>
      <span>Admin</span>
    </button>

    <Teleport to="body">
      <div v-if="open" class="acm-backdrop" @click="open = false"></div>
      <Transition name="acm-pop">
        <div v-if="open" class="acm-dropdown" :style="dropStyle">
          <div class="acm-header">⚙️ Admin Actions</div>
          <template v-for="item in actions" :key="item.label">
            <router-link
              v-if="item.to"
              :to="item.to"
              class="acm-item"
              @click="open = false"
            >
              <span class="acm-item-ico">{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </router-link>
            <button
              v-else
              class="acm-item"
              @click="() => { item.fn?.(); open = false }"
            >
              <span class="acm-item-ico">{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </button>
          </template>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

defineProps({ actions: { type: Array, required: true } })

const open   = ref(false)
const wrapRef = ref(null)
const pos    = ref({ top: 0, right: 0 })

function toggle() {
  if (!open.value) {
    const rect = wrapRef.value?.getBoundingClientRect()
    if (rect) {
      pos.value = {
        top:   rect.bottom + 6,
        right: window.innerWidth - rect.right,
      }
    }
  }
  open.value = !open.value
}

const dropStyle = computed(() => ({
  top:   `${pos.value.top}px`,
  right: `${pos.value.right}px`,
}))
</script>

<style scoped>
.acm-wrap { position: relative; display: inline-flex; }

/* Trigger button */
.acm-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px 3px 6px;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.45);
  background: rgba(67,56,202,0.82);
  color: white;
  font-size: 10px;
  font-weight: 800;
  cursor: pointer;
  backdrop-filter: blur(6px);
  transition: background 0.15s, transform 0.1s;
  line-height: 1;
  letter-spacing: 0.3px;
}
.acm-btn:hover  { background: rgba(67,56,202,1); }
.acm-btn:active { transform: scale(0.95); }

/* Backdrop (no bg, just catches clicks) */
.acm-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9998;
}

/* Dropdown */
.acm-dropdown {
  position: fixed;
  z-index: 9999;
  min-width: 200px;
  background: white;
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08);
  overflow: hidden;
  border: 1px solid rgba(0,0,0,0.07);
}

.acm-header {
  padding: 10px 14px 8px;
  font-size: 11px;
  font-weight: 800;
  color: #6366F1;
  border-bottom: 1px solid #F3F4F6;
  letter-spacing: 0.3px;
}

.acm-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #1F2937;
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s;
}
.acm-item:hover { background: #F5F3FF; color: #4F46E5; }
.acm-item + .acm-item { border-top: 1px solid #F9FAFB; }
.acm-item-ico { font-size: 16px; width: 20px; text-align: center; flex-shrink: 0; }

/* Transition */
.acm-pop-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.acm-pop-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
.acm-pop-enter-from  { opacity: 0; transform: translateY(-6px) scale(0.97); }
.acm-pop-leave-to    { opacity: 0; transform: translateY(-4px) scale(0.97); }
</style>
