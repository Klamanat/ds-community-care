<template>
  <div>
    <div v-if="!training.siteVisits.length" class="tr-section-empty">ยังไม่มีข้อมูล</div>
    <div v-else class="tr-sv-grid">

      <div
        v-for="site in training.siteVisits" :key="site.id"
        class="tr-sv-card"
        :class="training.isSiteVoted(site.id) ? 'tr-sv-card--voted' : ''"
      >
        <div class="tr-sv-bar" :style="siteHeroStyle(site)">
          <span class="tr-sv-bar-icon">🏭</span>
          <div class="tr-sv-bar-right">
            <span class="tr-sv-bar-num">{{ site.voteCount || 0 }}</span>
            <span class="tr-sv-bar-lbl">คน</span>
          </div>
        </div>
        <div class="tr-sv-body">
          <div class="tr-sv-title">{{ site.title }}</div>
          <div v-if="site.instructor" class="tr-sv-sub">👤 {{ site.instructor }}</div>
          <div v-if="site.description" class="tr-sv-desc">{{ site.description }}</div>
        </div>
        <div class="tr-sv-foot">
          <button
            class="tr-sv-btn"
            :class="training.isSiteVoted(site.id) ? 'tr-sv-btn--voted' : ''"
            :disabled="siteVotingId === site.id"
            @click="voteToggle(site)"
          >
            <span v-if="siteVotingId === site.id">⏳</span>
            <span v-else-if="training.isSiteVoted(site.id)">✅ โหวตแล้ว</span>
            <span v-else>🗳️ โหวต</span>
          </button>
        </div>
      </div>

      <!-- Card: อื่นๆ -->
      <div class="tr-sv-card tr-sv-card--other" :class="otherVoted ? 'tr-sv-card--voted' : ''">
        <div class="tr-sv-bar tr-sv-bar--other">
          <span class="tr-sv-bar-icon">✍️</span>
          <div class="tr-sv-bar-right">
            <span class="tr-sv-bar-num" style="color:rgba(255,255,255,0.6);">—</span>
            <span class="tr-sv-bar-lbl">{{ otherVoted ? 'โหวตแล้ว' : 'เสนอ' }}</span>
          </div>
        </div>
        <div class="tr-sv-body">
          <div class="tr-sv-title">อื่นๆ / เสนอสถานที่</div>
          <textarea
            v-model="otherText"
            class="tr-sv-other-input"
            :disabled="otherVoted"
            placeholder="ชื่อสถานที่ที่อยากไป (ไม่บังคับ)"
            rows="2"
            maxlength="200"
          ></textarea>
        </div>
        <div class="tr-sv-foot">
          <button
            class="tr-sv-btn"
            :class="otherVoted ? 'tr-sv-btn--voted' : ''"
            :disabled="otherSubmitting"
            @click="voteOther"
          >
            <span v-if="otherSubmitting">⏳</span>
            <span v-else-if="otherVoted">✅ โหวตแล้ว</span>
            <span v-else>🗳️ โหวต</span>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useTrainingStore } from '../../../stores/training.js'
import { useUserAuthStore } from '../../../stores/userAuth.js'
import * as svc from '../../../services/trainingService.js'

const training = useTrainingStore()
const userAuth = useUserAuthStore()

const siteVotingId    = ref(null)
const otherVoted      = ref(false)
const otherText       = ref('')
const otherSubmitting = ref(false)

onMounted(async () => {
  const empId = userAuth.empCode || userAuth.userName
  await training.loadMySuggestion(empId)
  if (training.mySuggestion) {
    otherVoted.value = true
    otherText.value  = training.mySuggestion.suggestion
  }
})

function siteHeroStyle(site) {
  const c = (site.color && site.color.startsWith('#')) ? site.color : '#0EA5E9'
  return { background: `linear-gradient(140deg, ${c} 0%, ${c}cc 55%, ${c}88 100%)` }
}

async function voteToggle(site) {
  if (siteVotingId.value) return
  siteVotingId.value = site.id
  const empId   = userAuth.empCode || userAuth.userName
  const empName = userAuth.userName || empId

  if (training.isSiteVoted(site.id)) {
    await training.cancelSiteVote(site.id, empId)
  } else {
    const prevVoted = training.siteVisits.find(s => s.id !== site.id && training.isSiteVoted(s.id))
    if (prevVoted) await training.cancelSiteVote(prevVoted.id, empId)
    if (otherVoted.value) {
      otherVoted.value = false
      otherText.value  = ''
      try { await svc.cancelSiteSuggestion(empId) } catch {}
    }
    await training.voteSite(site.id, empId, empName)
  }
  siteVotingId.value = null
}

async function voteOther() {
  if (otherSubmitting.value) return
  const empId   = userAuth.empCode || userAuth.userName
  const empName = userAuth.userName || empId
  otherSubmitting.value = true
  try {
    if (otherVoted.value) {
      await svc.cancelSiteSuggestion(empId)
      otherVoted.value      = false
      otherText.value       = ''
      training.mySuggestion = null
    } else {
      const prevVoted = training.siteVisits.find(s => training.isSiteVoted(s.id))
      if (prevVoted) await training.cancelSiteVote(prevVoted.id, empId)
      const text = otherText.value || 'อื่นๆ'
      await svc.submitSiteSuggestion(empId, empName, text)
      otherVoted.value      = true
      training.mySuggestion = { suggestion: text }
    }
  } catch {}
  otherSubmitting.value = false
}
</script>

<style scoped>
@import './training.css';
</style>
