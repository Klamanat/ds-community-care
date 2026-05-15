<template>
  <Teleport to="body">
    <div
      v-if="ui.activeModal === modalId"
      class="modal-overlay"
      @click.self="ui.closeModal()"
    >
      <div
        class="modal-sheet relative"
        :class="[{ open: isOpen }, sheetClass]"
        @click.stop
      >
        <!-- Universal close button -->
        <button
          class="modal-x-btn"
          @click="ui.closeModal()"
        >✕</button>

        <div
          v-if="padded"
          style="padding: 20px; overflow-y: auto; max-height: calc(90dvh - 56px); overscroll-behavior: contain;"
        >
          <slot />
        </div>
        <slot v-else />
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { useUiStore } from '../../core/stores/ui.js'

defineProps({
  modalId:    { type: String, required: true },
  sheetClass: { type: String, default: '' },
  padded:     { type: Boolean, default: false },
})
const ui = useUiStore()
const isOpen = ref(false)

onMounted(() => nextTick(() => { isOpen.value = true }))
</script>
