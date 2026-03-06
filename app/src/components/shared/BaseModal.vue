<template>
  <Teleport to="body">
    <div
      class="modal-overlay"
      :class="{ open: ui.activeModal === modalId }"
      @click.self="ui.closeModal()"
    >
      <div class="modal-sheet" @click.stop>
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { useUiStore } from '../../stores/ui.js'

defineProps({ modalId: { type: String, required: true } })
const ui = useUiStore()
</script>
