<template>
  <div>
    <AdminPageHeader title="💌 Empathy Board" sub="จัดการ Empathy ของทีม">
      <span class="al-badge al-badge-blue">{{ channels.length }} คน</span>
    </AdminPageHeader>

    <main class="al-main">
      <div class="al-body">
        <div class="al-card">
          <div v-if="loading" class="al-loading-skeletons">
            <SkeletonCard height="68px" />
            <SkeletonCard height="68px" />
            <SkeletonCard height="68px" />
          </div>
          <EmptyState v-else-if="!channels.length" title="ไม่มีข้อมูล" sub="ยังไม่มีรายการ Empathy" />

          <div v-else>
            <div class="al-item fade-in" v-for="ch in channels" :key="ch.id" @click="handleRippleClick">
              <div class="al-item-avatar">
                <img v-if="ch.imgUrl" :src="ch.imgUrl" alt="" />
                <span v-else>💌</span>
              </div>
              <div class="al-item-body">
                <div class="al-item-title">{{ ch.name }}</div>
                <div class="al-item-sub">{{ ch.role }}</div>
                <div class="al-item-meta">
                  <span>💬 {{ ch.count }}</span>
                  <span>❤️ {{ ch.likes }}</span>
                </div>
              </div>
              <button class="al-btn al-btn-delete" @click.stop="confirmDelete(ch)">ลบ</button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Delete Confirm -->
    <BaseModal padded modal-id="admin-empathy-del">
      <div class="al-modal-title">🗑️ ยืนยันลบ</div>
      <p class="text-sm text-app-mid mb-3">
        ลบ Empathy ทั้งหมดของ <strong>{{ delTarget?.name }}</strong>?<br>
        <span class="text-xs text-app-light">({{ delTarget?.count }} kudos)</span>
      </p>
      <div class="bg-coral/10 rounded-sm p-3 text-xs text-coral font-semibold mb-1">
        ⚠️ จะลบ kudos, replies และ likes ทั้งหมดของคนนี้
      </div>
      <div class="al-modal-footer">
        <button class="al-btn al-btn-cancel" @click="ui.closeModal()">ยกเลิก</button>
        <button class="al-btn al-btn-delete" :disabled="deleting" @click="doDelete">
          {{ deleting ? 'กำลังลบ...' : '🗑️ ลบ' }}
        </button>
      </div>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import * as svc from '../../core/services/adminService.js'
import { useUiStore } from '../../core/stores/ui.js'
import AdminPageHeader from './AdminPageHeader.vue'
import BaseModal from '../../shared/components/BaseModal.vue'
import SkeletonCard from '../../shared/components/SkeletonCard.vue'
import EmptyState from '../../shared/components/EmptyState.vue'
import { useRipple } from '../../core/composables/useRipple.js'
import { useFadeIn } from '../../core/composables/useFadeIn.js'

const ui = useUiStore()
const { handleRippleClick } = useRipple()
useFadeIn('.fade-in')

const comments  = ref([])
const likesRaw  = ref([])
const empMap    = ref({})
const photoMap  = ref({})
const loading   = ref(true)
const deleting  = ref(false)
const delTarget = ref(null)

const channels = computed(() => {
  const likesMap = {}
  for (const l of likesRaw.value) {
    const cid = String(l.channel_id || l.channelId || '').trim()
    if (cid) likesMap[cid] = (likesMap[cid] || 0) + 1
  }

  const map = new Map()
  for (const c of comments.value) {
    const cid = String(c.post_id || c.postId || '').trim()
    if (!cid) continue
    if (!map.has(cid)) {
      const emp = empMap.value[cid] || {}
      map.set(cid, {
        id:     cid,
        name:   emp.name  || cid,
        role:   emp.role  || '',
        imgUrl: photoMap.value[cid] || '',
        count:  0,
        likes:  likesMap[cid] || 0,
      })
    }
    map.get(cid).count++
  }
  return [...map.values()].sort((a, b) => b.count - a.count)
})

onMounted(async () => {
  try {
    const [cmts, emps, lks, photos] = await Promise.all([
      svc.getAll('EmpathyComments'),
      svc.getEmployees(),
      svc.getAll('ChannelLikes'),
      svc.getAll('EmpathyPhotos'),
    ])
    const m = {}
    ;(emps || []).forEach(e => {
      if (e.empCode) m[String(e.empCode)] = e
      if (e.id)      m[String(e.id)]      = e
    })
    const pm = {}
    ;(photos || []).forEach(p => {
      const empId  = p.employee_id || p.employeeId || ''
      const emp    = m[String(empId)] || {}
      const code   = emp.empCode || String(empId)
      const imgUrl = p.img_url  || p.imgUrl || ''
      if (!imgUrl || !code) return
      const resolvedUrl = imgUrl.startsWith('http')
        ? imgUrl
        : imgUrl.startsWith('drive:')
          ? `https://lh3.googleusercontent.com/d/${imgUrl.slice(6)}`
          : `https://lh3.googleusercontent.com/d/${imgUrl}`
      pm[code] = resolvedUrl
    })
    empMap.value   = m
    photoMap.value = pm
    comments.value = cmts || []
    likesRaw.value = lks  || []
  } catch {
    comments.value = []
  } finally {
    loading.value = false
  }
})

function confirmDelete(ch) {
  delTarget.value = ch
  ui.openModal('admin-empathy-del')
}

async function doDelete() {
  deleting.value = true
  try {
    await svc.deleteChannel(delTarget.value.id)
    comments.value = comments.value.filter(c => String(c.postId) !== delTarget.value.id)
    ui.closeModal()
    delTarget.value = null
  } catch {} finally {
    deleting.value = false
  }
}
</script>

<style scoped>
@import './admin.css';
</style>
