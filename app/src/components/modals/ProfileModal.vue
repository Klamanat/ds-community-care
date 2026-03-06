<template>
  <BaseModal modal-id="modal-profile">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6366F1,#A855F7,#EC4899);padding:24px 20px;border-radius:24px 24px 0 0;flex-shrink:0;">
      <div class="modal-handle" style="background:rgba(255,255,255,0.4);margin-bottom:16px;"></div>
      <div style="text-align:center;">
        <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#FDE68A,#F59E0B);display:flex;align-items:center;justify-content:center;font-size:36px;border:3px solid rgba(255,255,255,0.5);margin:0 auto 12px;">{{ ui.currentUser.emoji }}</div>
        <div style="font-size:18px;font-weight:800;color:white;">{{ ui.currentUser.name }}</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.8);margin-top:4px;">{{ ui.currentUser.role }}</div>
      </div>
    </div>

    <div class="modal-body-scroll" style="padding:16px 20px;">
      <div class="modal-section-label">ข้อมูลส่วนตัว</div>

      <div class="modal-info-card">
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div>
            <div style="font-size:11px;color:var(--light);margin-bottom:3px;">ชื่อ-นามสกุล</div>
            <input v-model="name" style="width:100%;border:1.5px solid var(--border);border-radius:10px;padding:9px 12px;font-family:'Sarabun',sans-serif;font-size:13px;color:var(--dark);background:var(--bg);outline:none;box-sizing:border-box;" />
          </div>
          <div>
            <div style="font-size:11px;color:var(--light);margin-bottom:3px;">ตำแหน่ง</div>
            <input v-model="role" style="width:100%;border:1.5px solid var(--border);border-radius:10px;padding:9px 12px;font-family:'Sarabun',sans-serif;font-size:13px;color:var(--dark);background:var(--bg);outline:none;box-sizing:border-box;" />
          </div>
          <div>
            <div style="font-size:11px;color:var(--light);margin-bottom:3px;">Avatar Emoji</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <span v-for="e in emojiOptions" :key="e" :style="{ fontSize:'28px', cursor:'pointer', border: ui.currentUser.emoji === e ? '2px solid var(--indigo)' : '2px solid transparent', borderRadius:'8px', padding:'2px 4px' }" @click="ui.currentUser.emoji = e">{{ e }}</span>
            </div>
          </div>
        </div>
      </div>

      <button class="modal-close-btn" @click="saveProfile">บันทึกโปรไฟล์ 💾</button>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref } from 'vue'
import BaseModal from '../shared/BaseModal.vue'
import { useUiStore } from '../../stores/ui.js'

const ui = useUiStore()
const name = ref(ui.currentUser.name)
const role = ref(ui.currentUser.role)
const emojiOptions = ['😊','🦁','🌸','🦊','🐬','🦋','🐯','⭐','🌟','😎','🦄','🐺']

function saveProfile() {
  ui.currentUser.name = name.value.trim() || ui.currentUser.name
  ui.currentUser.role = role.value.trim() || ui.currentUser.role
  ui.showToast('บันทึกโปรไฟล์แล้ว 💾')
  ui.closeModal()
}
</script>
