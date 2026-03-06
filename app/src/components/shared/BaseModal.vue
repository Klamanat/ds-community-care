<template>
  <Teleport to="body">
    <div
      v-show="ui.activeModal === modalId"
      class="modal-overlay"
      @click.self="ui.closeModal()"
    >
      <div
        class="modal-sheet"
        :class="[{ open: ui.activeModal === modalId }, sheetClass]"
        @click.stop
      >
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { useUiStore } from '../../stores/ui.js'

defineProps({
  modalId:    { type: String, required: true },
  sheetClass: { type: String, default: '' },
})
const ui = useUiStore()
</script>
