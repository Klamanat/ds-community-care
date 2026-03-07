<template>
  <BaseModal modal-id="modal-profile">
    <!-- Header gradient -->
    <div class="bg-[linear-gradient(135deg,#6366F1,#A855F7,#EC4899)] px-5 py-6 rounded-t-2xl flex-shrink-0">
      <div class="modal-handle"></div>
      <div class="text-center">

        <!-- Avatar — click to upload -->
        <div class="relative inline-block mx-auto mb-3" @click="triggerUpload">
          <div class="w-[80px] h-[80px] rounded-full border-[3px] border-white/50 overflow-hidden
                      flex items-center justify-center cursor-pointer"
               :style="!previewImg ? 'background:linear-gradient(135deg,#FDE68A,#F59E0B)' : ''">
            <img v-if="previewImg" :src="previewImg" class="w-full h-full object-cover" />
            <span v-else class="text-[38px]">{{ userAuth.userName ? userAuth.userName.charAt(0) : '😊' }}</span>
          </div>
          <div class="absolute inset-0 rounded-full flex items-center justify-center
                      bg-black/30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
            <span class="text-white text-[11px] font-bold">📷</span>
          </div>
          <div class="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full
                      flex items-center justify-center shadow-md cursor-pointer text-[13px]">
            {{ uploading ? '⏳' : '📷' }}
          </div>
        </div>

        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />

        <div class="text-[18px] font-extrabold text-white">{{ userAuth.userName }}</div>
        <div class="text-[12px] text-white/80 mt-1">{{ userAuth.userRole }}</div>
        <div v-if="uploading" class="text-[11px] text-white/70 mt-1">กำลังอัปโหลดรูป...</div>
      </div>
    </div>

    <div class="modal-body-scroll p-5">

      <!-- Upload error -->
      <div v-if="uploadError" style="background:#FEF2F2;border-radius:8px;padding:8px 12px;font-size:12px;color:#DC2626;margin-bottom:12px;">
        ⚠️ {{ uploadError }}
      </div>

      <div class="modal-section-label">ข้อมูลส่วนตัว</div>
      <div class="modal-info-card">
        <div class="flex flex-col gap-3">
          <!-- Employee ID — always read-only -->
          <div>
            <div class="text-[11px] text-app-light mb-1">รหัสพนักงาน</div>
            <div class="w-full border-[1.5px] border-app-border rounded-sm px-3 py-2.5
                        text-[13px] text-app-light bg-app-bg">{{ userAuth.userId }}</div>
          </div>

          <!-- ชื่อ -->
          <div>
            <div class="text-[11px] text-app-light mb-1">ชื่อ</div>
            <input v-if="editing" v-model="editName" maxlength="60"
              class="w-full border-[1.5px] border-indigo-300 rounded-sm px-3 py-2.5 text-[13px] text-app-dark bg-white outline-none focus:border-indigo-500" />
            <div v-else class="w-full border-[1.5px] border-app-border rounded-sm px-3 py-2.5
                        text-[13px] text-app-dark bg-app-bg">{{ userAuth.userName }}</div>
          </div>

          <!-- ตำแหน่ง -->
          <div>
            <div class="text-[11px] text-app-light mb-1">ตำแหน่ง</div>
            <input v-if="editing" v-model="editRole" maxlength="80"
              class="w-full border-[1.5px] border-indigo-300 rounded-sm px-3 py-2.5 text-[13px] text-app-dark bg-white outline-none focus:border-indigo-500" />
            <div v-else class="w-full border-[1.5px] border-app-border rounded-sm px-3 py-2.5
                        text-[13px] text-app-dark bg-app-bg">{{ userAuth.userRole }}</div>
          </div>

          <!-- แผนก -->
          <div>
            <div class="text-[11px] text-app-light mb-1">แผนก</div>
            <input v-if="editing" v-model="editDept" maxlength="60"
              class="w-full border-[1.5px] border-indigo-300 rounded-sm px-3 py-2.5 text-[13px] text-app-dark bg-white outline-none focus:border-indigo-500" />
            <div v-else class="w-full border-[1.5px] border-app-border rounded-sm px-3 py-2.5
                        text-[13px] text-app-dark bg-app-bg">{{ userAuth.userDept || '—' }}</div>
          </div>
        </div>
      </div>

      <div style="font-size:11px;color:#9CA3AF;text-align:center;margin-top:8px;margin-bottom:16px;">
        กดที่รูปโปรไฟล์ด้านบนเพื่ออัปโหลดรูปภาพ 📷
      </div>

      <!-- Buttons -->
      <template v-if="editing">
        <button class="modal-close-btn" :disabled="saving" @click="saveEdit">
          {{ saving ? 'กำลังบันทึก...' : 'บันทึก ✅' }}
        </button>
        <button
          class="modal-close-btn"
          style="background:#F3F4F6;color:#374151;margin-top:8px;"
          @click="cancelEdit"
        >ยกเลิก</button>
      </template>
      <template v-else>
        <button class="modal-close-btn" @click="startEdit">แก้ไขข้อมูล ✏️</button>
        <button
          class="modal-close-btn"
          style="background:linear-gradient(135deg,#EF4444,#DC2626);margin-top:8px;"
          @click="handleLogout"
        >ออกจากระบบ 🚪</button>
        <button
          class="modal-close-btn"
          style="background:#F3F4F6;color:#374151;margin-top:8px;"
          @click="ui.closeModal()"
        >ปิด</button>
      </template>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseModal from '../shared/BaseModal.vue'
import { useUiStore } from '../../stores/ui.js'
import { useUserAuthStore } from '../../stores/userAuth.js'
import { fileToCompressedBase64 } from '../../composables/useImageCompress.js'
import { gasGet, gasPost } from '../../services/api.js'

const ui       = useUiStore()
const userAuth = useUserAuthStore()
const router   = useRouter()

// --- Upload ---
const fileInput   = ref(null)
const uploading   = ref(false)
const uploadError = ref('')
const previewImg  = computed(() => userAuth.userImgUrl || '')

function triggerUpload() {
  if (uploading.value) return
  uploadError.value = ''
  fileInput.value?.click()
}

async function onFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  uploading.value = true; uploadError.value = ''
  try {
    const base64 = await fileToCompressedBase64(file)
    userAuth.userImgUrl = base64
    localStorage.setItem('user_img', base64)
    ui.currentUser.img = base64
    await gasPost('uploadImage', {
      sheetName: 'Employees',
      keyCol:    'id',
      keyVal:    userAuth.userId,
      imageBase64: base64,
    })
    ui.showToast('อัปโหลดรูปสำเร็จ 📷')
  } catch (err) {
    uploadError.value = err.message || 'อัปโหลดไม่สำเร็จ'
  } finally {
    uploading.value = false
    e.target.value = ''
  }
}

// --- Edit profile ---
const editing  = ref(false)
const saving   = ref(false)
const editName = ref('')
const editRole = ref('')
const editDept = ref('')

function startEdit() {
  editName.value = userAuth.userName
  editRole.value = userAuth.userRole
  editDept.value = userAuth.userDept
  editing.value  = true
}

function cancelEdit() {
  editing.value = false
}

async function saveEdit() {
  const name = editName.value.trim()
  const role = editRole.value.trim()
  const dept = editDept.value.trim()
  if (!name) { ui.showToast('กรุณากรอกชื่อ'); return }

  saving.value = true
  // Update locally first
  userAuth.userName = name
  userAuth.userRole = role
  userAuth.userDept = dept
  localStorage.setItem('user_name', name)
  localStorage.setItem('user_role', role)
  localStorage.setItem('user_dept', dept)
  ui.currentUser.name = name
  ui.currentUser.role = role
  ui.currentUser.dept = dept

  // Sync to GAS (fire and forget)
  try {
    await gasGet('updateEmployeeSelf', { id: userAuth.userId, name, role, dept })
  } catch {}

  saving.value  = false
  editing.value = false
  ui.showToast('บันทึกข้อมูลสำเร็จ ✅')
}

// --- Logout ---
function handleLogout() {
  userAuth.logout()
  ui.closeModal()
  router.push('/login')
}
</script>
