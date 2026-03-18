<template>
  <div class="flex flex-col gap-3">

    <div class="consult-card mental ripple-host"
         :class="{ 'opacity-60': !cardConfig.isEnabled('mental') }"
         @click="cardClick('mental', () => ui.openModal('modal-mental'))">
      <div class="ci" style="width:48px;height:48px;overflow:hidden;border-radius:14px;background:none;padding:0;flex-shrink:0;">
        <img src="/images/icon-mental.png" style="width:100%;height:100%;object-fit:cover;" />
      </div>
      <div class="ci-info">
        <div class="ci-title">Mental Health Consultation</div>
        <div class="ci-sub">{{ cardConfig.isEnabled('mental') ? 'ดูแลสุขภาพใจ • พร้อม 24/7 🌿' : '🔜 เร็วๆ นี้' }}</div>
      </div>
      <div class="ci-arr">›</div>
    </div>

    <div class="consult-card financial ripple-host"
         :class="{ 'opacity-60': !cardConfig.isEnabled('financial') }"
         @click="cardClick('financial', () => ui.openModal('modal-financial'))">
      <div class="ci">💰</div>
      <div class="ci-info">
        <div class="ci-title">Financial Consultation</div>
        <div class="ci-sub">{{ cardConfig.isEnabled('financial') ? 'ปรึกษาผู้เชี่ยวชาญด้านการเงิน ✨' : '🔜 เร็วๆ นี้' }}</div>
      </div>
      <div class="ci-arr">›</div>
    </div>

  </div>
</template>

<script setup>
import { useUiStore } from '../../stores/ui.js'
import { useCardConfigStore } from '../../stores/cardConfig.js'

const ui         = useUiStore()
const cardConfig = useCardConfigStore()

function cardClick(key, action) {
  if (!cardConfig.isEnabled(key)) { ui.showToast('🔜 เร็วๆ นี้'); return }
  action()
}
</script>
