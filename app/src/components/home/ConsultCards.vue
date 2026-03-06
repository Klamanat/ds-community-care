<template>
  <div class="flex flex-col gap-3">
    <div class="consult-card mental ripple-host" @click="ui.openModal('modal-mental')">
      <div class="ci">🧠</div>
      <div class="ci-info">
        <div class="ci-title">Mental Health Consultation</div>
        <div class="ci-sub">ปรึกษานักจิตวิทยา • ฟรี • ไม่ระบุตัวตน</div>
      </div>
      <div class="ci-arr">›</div>
    </div>
    <div class="consult-card financial ripple-host" @click="ui.openModal('modal-financial')">
      <div class="ci">💰</div>
      <div class="ci-info">
        <div class="ci-title">Financial Consultation</div>
        <div class="ci-sub">ปรึกษาการเงิน • 5 เคส/ปี • Follow up 3 ครั้ง</div>
      </div>
      <div class="ci-arr">›</div>
    </div>
  </div>
</template>

<script setup>
import { useUiStore } from '../../stores/ui.js'
const ui = useUiStore()
</script>
