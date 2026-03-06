<template>
  <BaseModal modal-id="modal-profile">
    <!-- Header -->
    <div class="bg-[linear-gradient(135deg,#6366F1,#A855F7,#EC4899)] px-5 py-6 rounded-t-2xl flex-shrink-0">
      <div class="modal-handle"></div>
      <div class="text-center">
        <div class="w-[72px] h-[72px] rounded-full bg-[linear-gradient(135deg,#FDE68A,#F59E0B)]
                    flex items-center justify-center text-[36px] border-[3px] border-white/50 mx-auto mb-3">
          {{ ui.currentUser.emoji }}
        </div>
        <div class="text-[18px] font-extrabold text-white">{{ ui.currentUser.name }}</div>
        <div class="text-[12px] text-white/80 mt-1">{{ ui.currentUser.role }}</div>
      </div>
    </div>

    <div class="modal-body-scroll p-5">
      <div class="modal-section-label">ข้อมูลส่วนตัว</div>
      <div class="modal-info-card">
        <div class="flex flex-col gap-3">
          <div>
            <div class="text-[11px] text-app-light mb-1">ชื่อ-นามสกุล</div>
            <input
              v-model="name"
              class="w-full border-[1.5px] border-app-border rounded-sm px-3 py-2.5
                     text-[13px] text-app-dark bg-app-bg outline-none"
            />
          </div>
          <div>
            <div class="text-[11px] text-app-light mb-1">ตำแหน่ง</div>
            <input
              v-model="role"
              class="w-full border-[1.5px] border-app-border rounded-sm px-3 py-2.5
                     text-[13px] text-app-dark bg-app-bg outline-none"
            />
          </div>
          <div>
            <div class="text-[11px] text-app-light mb-1">Avatar Emoji</div>
            <div class="flex gap-2 flex-wrap">
              <span
                v-for="e in emojiOptions"
                :key="e"
                class="text-[28px] cursor-pointer rounded-lg p-1 transition-all duration-150"
                :class="ui.currentUser.emoji === e ? 'border-2 border-indigo' : 'border-2 border-transparent'"
                @click="ui.currentUser.emoji = e"
              >{{ e }}</span>
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
