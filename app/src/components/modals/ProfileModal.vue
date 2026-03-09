<template>
  <BaseModal modal-id="modal-profile">

    <!-- ── Outer flex wrapper ──────────────────────────────────────── -->
    <div class="flex-1 flex flex-col overflow-hidden">

      <!-- Handle bar (sits on gradient) -->
      <div class="flex-shrink-0 pt-3 pb-1 flex justify-center"
           style="background:linear-gradient(150deg,#2D1B69 0%,#7C3AED 45%,#C026D3 72%,#EC4899 100%);">
        <div class="w-10 h-1 rounded-full" style="background:rgba(255,255,255,0.35);"></div>
      </div>

      <!-- ── Hero gradient section ──────────────────────────────────── -->
      <div class="flex-shrink-0 relative"
           style="background:linear-gradient(150deg,#2D1B69 0%,#7C3AED 45%,#C026D3 72%,#EC4899 100%);padding-bottom:36px;">

        <!-- Depth mesh -->
        <div class="absolute inset-0 pointer-events-none"
             style="background:radial-gradient(ellipse at 15% 60%,rgba(255,255,255,0.08) 0%,transparent 55%),
                               radial-gradient(ellipse at 85% 10%,rgba(236,72,153,0.22) 0%,transparent 50%);"></div>

        <!-- Shimmer dots -->
        <div class="absolute top-3 left-4 text-white/20 font-black select-none" style="font-size:8px;letter-spacing:5px;">✦ ✦ ✦</div>
        <div class="absolute top-3 right-4 text-white/20 font-black select-none" style="font-size:8px;letter-spacing:5px;">✦ ✦ ✦</div>

        <div class="relative z-10 flex flex-col items-center pt-4 pb-2 gap-2.5">

          <!-- Metallic ring avatar -->
          <div class="relative cursor-pointer" @click="triggerUpload">
            <!-- Conic metallic ring -->
            <div class="absolute rounded-full pointer-events-none"
                 style="inset:-3px;background:conic-gradient(from 0deg,#F59E0B 0%,#FDE68A 20%,rgba(255,255,255,0.95) 35%,#EC4899 55%,#7C3AED 75%,rgba(255,255,255,0.9) 88%,#F59E0B 100%);"></div>
            <!-- Avatar -->
            <div class="relative rounded-full overflow-hidden flex items-center justify-center"
                 style="width:96px;height:96px;padding:3px;background:rgba(255,255,255,0.2);">
              <div class="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
                   :style="!previewImg ? 'background:linear-gradient(135deg,#FDE68A,#F59E0B)' : 'background:#1a0a2e'">
                <img v-if="previewImg" :src="previewImg" class="w-full h-full object-cover" />
                <span v-else class="select-none" style="font-size:44px;line-height:1;">{{ userAuth.userName ? userAuth.userName.charAt(0) : '😊' }}</span>
              </div>
            </div>
            <!-- Camera badge -->
            <div class="absolute flex items-center justify-center"
                 style="bottom:-2px;right:-2px;width:30px;height:30px;border-radius:9999px;
                        background:linear-gradient(135deg,#F59E0B,#EC4899);
                        border:2.5px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.3);font-size:13px;">
              {{ uploading ? '⏳' : '📷' }}
            </div>
          </div>
          <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />

          <!-- Name + role -->
          <div class="text-center px-6">
            <div class="font-black text-white leading-tight" style="font-size:20px;text-shadow:0 2px 14px rgba(0,0,0,0.35);">{{ userAuth.userName }}</div>
            <div class="text-white/70 mt-0.5 font-semibold" style="font-size:12px;">{{ userAuth.userRole }}</div>
            <div v-if="userAuth.userDept"
                 class="inline-block mt-2 font-bold text-white/90"
                 style="font-size:10px;padding:3px 12px;border-radius:999px;background:rgba(255,255,255,0.16);border:1px solid rgba(255,255,255,0.28);">
              🏢 {{ userAuth.userDept }}
            </div>
          </div>

          <div v-if="uploading" class="text-white/65 font-medium" style="font-size:11px;">กำลังอัปโหลดรูป...</div>
        </div>
      </div>

      <!-- ── Body: white rounded sheet slides over gradient ─────────── -->
      <div class="flex-1 overflow-y-auto"
           style="-webkit-overflow-scrolling:touch;
                  margin-top:-20px;border-radius:20px 20px 0 0;
                  background:#fff;position:relative;z-index:10;">
        <div class="px-4 pt-4 pb-6 flex flex-col gap-3.5">

          <!-- Upload error -->
          <div v-if="uploadError"
               class="flex items-center gap-2 rounded-2xl px-3 font-semibold text-red-600"
               style="font-size:12px;padding:10px 12px;background:#FEF2F2;border:1px solid #FECACA;">
            ⚠️ {{ uploadError }}
          </div>

          <!-- Frosted info card -->
          <div class="rounded-2xl overflow-hidden"
               style="border:1px solid rgba(124,58,237,0.13);
                      box-shadow:0 8px 32px rgba(99,102,241,0.12),0 2px 8px rgba(0,0,0,0.05);">

            <!-- Card header label -->
            <div class="flex items-center gap-2 px-4 pt-4 pb-2.5"
                 style="background:linear-gradient(135deg,#F5F3FF,#FDF2F8);border-bottom:1.5px solid rgba(124,58,237,0.08);">
              <div style="width:3px;height:16px;border-radius:3px;background:linear-gradient(to bottom,#7C3AED,#EC4899);flex-shrink:0;"></div>
              <span class="font-extrabold uppercase"
                    style="font-size:10px;letter-spacing:2px;background:linear-gradient(135deg,#7C3AED,#EC4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">
                ข้อมูลส่วนตัว
              </span>
            </div>

            <!-- Fields -->
            <div class="bg-white">

              <!-- รหัสพนักงาน -->
              <div class="flex items-center gap-3 px-4 py-3.5" style="border-bottom:1px solid rgba(124,58,237,0.07);">
                <div class="flex-shrink-0 flex items-center justify-center rounded-xl"
                     style="width:36px;height:36px;font-size:15px;background:linear-gradient(135deg,#EDE9FE,#DDD6FE);box-shadow:0 3px 8px rgba(124,58,237,0.18);">🪪</div>
                <div class="flex-1 min-w-0">
                  <div class="font-extrabold uppercase text-[#A78BFA]" style="font-size:9px;letter-spacing:1.5px;margin-bottom:2px;">รหัสพนักงาน</div>
                  <div class="font-extrabold text-[#1E1B4B] truncate" style="font-size:14px;">{{ userAuth.userId || '—' }}</div>
                </div>
              </div>

              <!-- ชื่อ -->
              <div class="flex items-center gap-3 px-4 py-3.5" style="border-bottom:1px solid rgba(124,58,237,0.07);">
                <div class="flex-shrink-0 flex items-center justify-center rounded-xl"
                     style="width:36px;height:36px;font-size:15px;background:linear-gradient(135deg,#FCE7F3,#FBCFE8);box-shadow:0 3px 8px rgba(236,72,153,0.15);">👤</div>
                <div class="flex-1 min-w-0">
                  <div class="font-extrabold uppercase text-[#F472B6]" style="font-size:9px;letter-spacing:1.5px;margin-bottom:2px;">ชื่อ</div>
                  <input v-if="editing" v-model="editName" maxlength="60"
                    class="w-full font-bold text-[#1E1B4B] outline-none"
                    style="font-size:13px;border:1.5px solid #C4B5FD;background:#FAFAFE;border-radius:10px;padding:6px 10px;" />
                  <div v-else class="font-extrabold text-[#1E1B4B] truncate" style="font-size:14px;">{{ userAuth.userName || '—' }}</div>
                </div>
              </div>

              <!-- ตำแหน่ง -->
              <div class="flex items-center gap-3 px-4 py-3.5" style="border-bottom:1px solid rgba(124,58,237,0.07);">
                <div class="flex-shrink-0 flex items-center justify-center rounded-xl"
                     style="width:36px;height:36px;font-size:15px;background:linear-gradient(135deg,#D1FAE5,#A7F3D0);box-shadow:0 3px 8px rgba(52,211,153,0.15);">💼</div>
                <div class="flex-1 min-w-0">
                  <div class="font-extrabold uppercase text-[#34D399]" style="font-size:9px;letter-spacing:1.5px;margin-bottom:2px;">ตำแหน่ง</div>
                  <input v-if="editing" v-model="editRole" maxlength="80"
                    class="w-full font-bold text-[#1E1B4B] outline-none"
                    style="font-size:13px;border:1.5px solid #C4B5FD;background:#FAFAFE;border-radius:10px;padding:6px 10px;" />
                  <div v-else class="font-extrabold text-[#1E1B4B] truncate" style="font-size:14px;">{{ userAuth.userRole || '—' }}</div>
                </div>
              </div>

              <!-- แผนก -->
              <div class="flex items-center gap-3 px-4 py-3.5">
                <div class="flex-shrink-0 flex items-center justify-center rounded-xl"
                     style="width:36px;height:36px;font-size:15px;background:linear-gradient(135deg,#FEF3C7,#FDE68A);box-shadow:0 3px 8px rgba(245,158,11,0.15);">🏢</div>
                <div class="flex-1 min-w-0">
                  <div class="font-extrabold uppercase text-[#F59E0B]" style="font-size:9px;letter-spacing:1.5px;margin-bottom:2px;">แผนก</div>
                  <input v-if="editing" v-model="editDept" maxlength="60"
                    class="w-full font-bold text-[#1E1B4B] outline-none"
                    style="font-size:13px;border:1.5px solid #C4B5FD;background:#FAFAFE;border-radius:10px;padding:6px 10px;" />
                  <div v-else class="font-extrabold text-[#1E1B4B] truncate" style="font-size:14px;">{{ userAuth.userDept || '—' }}</div>
                </div>
              </div>

            </div>
          </div>

          <!-- Upload hint -->
          <div class="text-center font-medium" style="font-size:11px;color:#B0A8D8;">
            📷 กดที่รูปโปรไฟล์เพื่อเปลี่ยนรูปภาพ
          </div>

          <!-- Action buttons -->
          <div class="flex flex-col gap-2.5">
            <template v-if="editing">
              <button
                class="w-full font-extrabold text-white"
                style="padding:14px;font-size:14px;border:none;border-radius:16px;cursor:pointer;
                       background:linear-gradient(135deg,#4F46E5,#7C3AED,#EC4899);
                       box-shadow:0 8px 24px rgba(124,58,237,0.4),0 2px 6px rgba(0,0,0,0.08);
                       -webkit-tap-highlight-color:transparent;"
                :disabled="saving"
                @click="saveEdit"
              >{{ saving ? '⏳ กำลังบันทึก...' : '✅ บันทึกข้อมูล' }}</button>
              <button
                class="w-full font-bold text-[#7C3AED]"
                style="padding:12px;font-size:13px;border-radius:16px;cursor:pointer;
                       background:#F5F3FF;border:1.5px solid #DDD6FE;
                       -webkit-tap-highlight-color:transparent;"
                @click="cancelEdit"
              >ยกเลิก</button>
            </template>
            <template v-else>
              <button
                class="w-full font-extrabold text-white"
                style="padding:14px;font-size:14px;border:none;border-radius:16px;cursor:pointer;
                       background:linear-gradient(135deg,#4F46E5,#7C3AED,#EC4899);
                       box-shadow:0 8px 24px rgba(124,58,237,0.4),0 2px 6px rgba(0,0,0,0.08);
                       -webkit-tap-highlight-color:transparent;"
                @click="startEdit"
              >✏️ แก้ไขข้อมูล</button>
              <button
                class="w-full font-bold text-white"
                style="padding:12px;font-size:13px;border:none;border-radius:16px;cursor:pointer;
                       background:linear-gradient(135deg,#F43F5E,#EF4444);
                       box-shadow:0 4px 16px rgba(239,68,68,0.3);
                       -webkit-tap-highlight-color:transparent;"
                @click="handleLogout"
              >🚪 ออกจากระบบ</button>
              <button
                class="w-full font-bold text-[#9CA3AF]"
                style="padding:12px;font-size:13px;border-radius:16px;cursor:pointer;
                       background:#F9FAFB;border:1.5px solid #E5E7EB;
                       -webkit-tap-highlight-color:transparent;"
                @click="ui.closeModal()"
              >ปิด</button>
            </template>
          </div>

        </div>
      </div>
    </div>

  </BaseModal>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseModal from '../shared/BaseModal.vue'
import { useUiStore } from '../../stores/ui.js'
import { useUserAuthStore } from '../../stores/userAuth.js'
import { resizeToBase64 } from '../../composables/useImageCompress.js'
import { gasGet, gasPost } from '../../services/api.js'
import { uploadImage as driveUpload } from '../../services/activitiesService.js'

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
    const b64 = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = () => reject(new Error('อ่านไฟล์ไม่ได้'))
      reader.onload  = ev => resolve(ev.target.result)
      reader.readAsDataURL(file)
    })
    userAuth.userImgUrl = b64
    localStorage.setItem('user_img', b64)
    ui.currentUser.img = b64
    ui.showToast('อัปโหลดรูปสำเร็จ 📷')
    driveUpload(b64, file.name, 'profiles')
      .then(res => gasGet('updateEmployeeSelf', { id: userAuth.userId, imgId: res.data.id }))
      .catch(() => {})
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
  userAuth.userName = name
  userAuth.userRole = role
  userAuth.userDept = dept
  localStorage.setItem('user_name', name)
  localStorage.setItem('user_role', role)
  localStorage.setItem('user_dept', dept)
  ui.currentUser.name = name
  ui.currentUser.role = role
  ui.currentUser.dept = dept

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
