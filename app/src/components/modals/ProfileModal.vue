<template>
  <BaseModal modal-id="modal-profile">
    <div class="flex-1 flex flex-col overflow-hidden">

      <!-- ── Cover + Avatar ── -->
      <div class="pf-cover-wrap">
        <!-- Cover photo -->
        <div class="pf-cover"></div>

        <!-- Avatar overlapping cover -->
        <div class="pf-av-wrap">
          <div class="pf-av" @click="triggerUpload">
            <img v-if="previewImg" :src="previewImg" class="pf-av-img" @error="e => e.target.style.display='none'" />
            <span v-else class="pf-av-initial">{{ userAuth.userName?.charAt(0) || '😊' }}</span>
            <div class="pf-cam-btn">{{ uploading ? '⏳' : '📷' }}</div>
          </div>
          <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
        </div>
      </div>

      <!-- ── Name + role ── -->
      <div class="pf-identity">
        <div class="pf-name">{{ userAuth.userName || '—' }}</div>
        <div v-if="userAuth.userRole" class="pf-role">{{ userAuth.userRole }}</div>
        <div v-if="userAuth.userDept" class="pf-dept-chip">🏢 {{ userAuth.userDept }}</div>
        <div v-if="uploading" class="pf-uploading">กำลังอัปโหลดรูป...</div>
        <div v-if="uploadError" class="pf-upload-err">⚠️ {{ uploadError }}</div>
      </div>

      <!-- ── Action buttons (Facebook style) ── -->
      <div class="pf-actions">
        <template v-if="!editing">
          <button class="pf-btn-primary" @click="startEdit">✏️ แก้ไขโปรไฟล์</button>
          <button class="pf-btn-secondary" @click="triggerUpload">📷</button>
        </template>
        <template v-else>
          <button class="pf-btn-primary" :disabled="saving" @click="saveEdit">
            {{ saving ? '⏳ กำลังบันทึก...' : '✅ บันทึก' }}
          </button>
          <button class="pf-btn-secondary" @click="cancelEdit">ยกเลิก</button>
        </template>
      </div>

      <!-- ── Divider ── -->
      <div class="pf-divider"></div>

      <!-- ── Info / Edit section ── -->
      <div class="modal-body-scroll pf-body">

        <!-- View mode -->
        <template v-if="!editing">
          <div class="pf-section-title">ข้อมูลส่วนตัว</div>

          <div class="pf-info-row">
            <span class="pf-info-icon">🪪</span>
            <div>
              <div class="pf-info-label">รหัสพนักงาน</div>
              <div class="pf-info-val">{{ userAuth.userId || '—' }}</div>
            </div>
          </div>
          <div class="pf-info-row">
            <span class="pf-info-icon">👤</span>
            <div>
              <div class="pf-info-label">ชื่อ</div>
              <div class="pf-info-val">{{ userAuth.userName || '—' }}</div>
            </div>
          </div>
          <div class="pf-info-row">
            <span class="pf-info-icon">💼</span>
            <div>
              <div class="pf-info-label">ตำแหน่ง</div>
              <div class="pf-info-val">{{ userAuth.userRole || '—' }}</div>
            </div>
          </div>
          <div class="pf-info-row">
            <span class="pf-info-icon">🏢</span>
            <div>
              <div class="pf-info-label">แผนก</div>
              <div class="pf-info-val">{{ userAuth.userDept || '—' }}</div>
            </div>
          </div>
          <div v-if="isStarGang" class="pf-info-row">
            <span class="pf-info-icon">✨</span>
            <div>
              <div class="pf-info-label">สโลแกน Star Gang</div>
              <div class="pf-info-val" style="font-style:italic;">{{ userAuth.userSlogan || '—' }}</div>
            </div>
          </div>

          <!-- Counselor inbox button -->
          <template v-if="isCounselor">
            <div class="pf-divider" style="margin:16px 0 12px;"></div>
            <div class="pf-section-title" style="font-size:14px;">💚 เมนูที่ปรึกษา</div>
            <button class="pf-counselor-btn" @click="openInbox">
              <span class="pf-counselor-icon">💬</span>
              <div class="pf-counselor-info">
                <div class="pf-counselor-label">กล่องข้อความที่ปรึกษา</div>
                <div class="pf-counselor-sub">ดูข้อความจากผู้ขอคำปรึกษา</div>
              </div>
              <span v-if="mental.unreadCount" class="pf-counselor-badge">{{ mental.unreadCount }}</span>
              <span class="pf-counselor-arr">›</span>
            </button>
          </template>

          <!-- Logout -->
          <div class="pf-divider" style="margin:16px 0 12px;"></div>
          <button class="pf-logout-btn" @click="handleLogout">
            <span>🚪</span> ออกจากระบบ
          </button>
        </template>

        <!-- Edit mode -->
        <template v-else>
          <div class="pf-section-title">แก้ไขข้อมูล</div>

          <div class="pf-field">
            <label class="pf-field-label">ชื่อ</label>
            <input v-model="editName" maxlength="60" class="pf-input" placeholder="ชื่อ-นามสกุล" />
          </div>
          <div class="pf-field">
            <label class="pf-field-label">ตำแหน่ง</label>
            <input v-model="editRole" maxlength="80" class="pf-input" placeholder="ตำแหน่งงาน" />
          </div>
          <div class="pf-field">
            <label class="pf-field-label">แผนก</label>
            <input v-model="editDept" maxlength="60" class="pf-input" placeholder="ชื่อแผนก" />
          </div>
          <div v-if="isStarGang" class="pf-field">
            <label class="pf-field-label">✨ สโลแกน Star Gang</label>
            <input v-model="editSlogan" maxlength="100" class="pf-input" placeholder="ประโยคที่เป็นตัวเอง..." />
          </div>
        </template>

      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BaseModal from '../shared/BaseModal.vue'
import { useUiStore }       from '../../stores/ui.js'
import { useUserAuthStore } from '../../stores/userAuth.js'
import { useTeamStore }     from '../../stores/team.js'
import { useMentalStore }   from '../../stores/mental.js'
import { gasGet }           from '../../services/api.js'
import { uploadImage as driveUpload } from '../../services/activitiesService.js'

const ui       = useUiStore()
const userAuth = useUserAuthStore()
const team     = useTeamStore()
const mental   = useMentalStore()
const router   = useRouter()

onMounted(() => mental.loadAdvisors())

const isCounselor = computed(() => mental.isCounselor(userAuth.userId))

const isStarGang = computed(() => {
  const name = userAuth.userName
  if (!name) return false
  return team.sgMembers.some(m => (m.name || '').trim().toLowerCase() === name.trim().toLowerCase())
})

// ── Upload ──────────────────────────────────────────────────
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

// ── Edit ────────────────────────────────────────────────────
const editing    = ref(false)
const saving     = ref(false)
const editName   = ref('')
const editRole   = ref('')
const editDept   = ref('')
const editSlogan = ref('')

function startEdit() {
  editName.value   = userAuth.userName
  editRole.value   = userAuth.userRole
  editDept.value   = userAuth.userDept
  editSlogan.value = userAuth.userSlogan
  editing.value    = true
}
function cancelEdit() { editing.value = false }

async function saveEdit() {
  const name = editName.value.trim()
  if (!name) { ui.showToast('กรุณากรอกชื่อ'); return }
  saving.value = true
  userAuth.userName   = name
  userAuth.userRole   = editRole.value.trim()
  userAuth.userDept   = editDept.value.trim()
  userAuth.userSlogan = editSlogan.value.trim()
  localStorage.setItem('user_name',   name)
  localStorage.setItem('user_role',   userAuth.userRole)
  localStorage.setItem('user_dept',   userAuth.userDept)
  localStorage.setItem('user_slogan', userAuth.userSlogan)
  ui.currentUser.name = name; ui.currentUser.role = userAuth.userRole
  try { await gasGet('updateEmployeeSelf', { id: userAuth.userId, name, role: userAuth.userRole, dept: userAuth.userDept, starGangSlogan: userAuth.userSlogan }) } catch {}
  saving.value = false; editing.value = false
  ui.showToast('บันทึกข้อมูลสำเร็จ ✅')
}

// ── Counselor inbox ──────────────────────────────────────────
function openInbox() {
  ui.closeModal()
  setTimeout(() => ui.openModal('modal-counselor-inbox'), 150)
}

// ── Logout ──────────────────────────────────────────────────
function handleLogout() {
  userAuth.logout()
  ui.closeModal()
  router.push('/login')
}
</script>

<style scoped>
/* ── Cover ── */
.pf-cover-wrap {
  position: relative;
  flex-shrink: 0;
}
.pf-cover {
  width: 100%;
  height: 160px;
  background: linear-gradient(135deg, #1877F2 0%, #4F46E5 40%, #7C3AED 70%, #C026D3 100%);
}

/* ── Avatar ── */
.pf-av-wrap {
  position: absolute;
  bottom: -44px;
  left: 50%;
  transform: translateX(-50%);
}
.pf-av {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  border: 4px solid white;
  background: #E4E6EB;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.pf-av-img  { width: 100%; height: 100%; object-fit: cover; }
.pf-av-initial { font-size: 42px; line-height: 1; user-select: none; }
.pf-cam-btn {
  position: absolute;
  bottom: 4px;
  right: 0px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #E4E6EB;
  border: 2px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}

/* ── Identity ── */
.pf-identity {
  margin-top: 52px;
  text-align: center;
  padding: 0 16px 12px;
}
.pf-name { font-size: 22px; font-weight: 900; color: #050505; margin-bottom: 2px; }
.pf-role { font-size: 14px; color: #65676B; font-weight: 500; margin-bottom: 6px; }
.pf-dept-chip {
  display: inline-block;
  background: #E7F3FF;
  color: #1877F2;
  font-size: 12px;
  font-weight: 700;
  padding: 3px 12px;
  border-radius: 20px;
}
.pf-uploading { font-size: 11px; color: #65676B; margin-top: 6px; }
.pf-upload-err { font-size: 11px; color: #F43F5E; margin-top: 6px; }

/* ── Action buttons ── */
.pf-actions {
  display: flex;
  gap: 8px;
  padding: 0 16px 12px;
  justify-content: center;
}
.pf-btn-primary {
  flex: 1;
  padding: 8px 16px;
  background: #1877F2;
  color: white;
  font-size: 14px;
  font-weight: 700;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
.pf-btn-primary:active { background: #1565C0; }
.pf-btn-primary:disabled { opacity: 0.6; }
.pf-btn-secondary {
  padding: 8px 16px;
  background: #E4E6EB;
  color: #050505;
  font-size: 14px;
  font-weight: 700;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  min-width: 48px;
}
.pf-btn-secondary:active { background: #CDD0D4; }

/* ── Divider ── */
.pf-divider { height: 8px; background: #F0F2F5; flex-shrink: 0; }

/* ── Body ── */
.pf-body { padding: 16px; }
.pf-section-title {
  font-size: 17px;
  font-weight: 800;
  color: #050505;
  margin-bottom: 12px;
}

/* ── Info rows ── */
.pf-info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #F0F2F5;
}
.pf-info-row:last-child { border-bottom: none; }
.pf-info-icon { font-size: 20px; width: 28px; text-align: center; flex-shrink: 0; }
.pf-info-label { font-size: 11px; color: #65676B; font-weight: 600; margin-bottom: 1px; }
.pf-info-val   { font-size: 14px; color: #050505; font-weight: 600; }

/* ── Edit fields ── */
.pf-field { margin-bottom: 14px; }
.pf-field-label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #65676B;
  margin-bottom: 6px;
}
.pf-input {
  width: 100%;
  padding: 10px 12px;
  border: 1.5px solid #CDD0D4;
  border-radius: 8px;
  font-size: 15px;
  color: #050505;
  outline: none;
  background: white;
}
.pf-input:focus { border-color: #1877F2; }

/* ── Counselor menu button ── */
.pf-counselor-btn {
  display: flex; align-items: center; gap: 12px;
  width: 100%; padding: 12px 10px;
  background: linear-gradient(135deg, #F0FDF4, #DCFCE7);
  border: 1.5px solid #86EFAC; border-radius: 12px;
  cursor: pointer; text-align: left; transition: box-shadow 0.15s;
}
.pf-counselor-btn:active { box-shadow: 0 0 0 3px rgba(46,175,125,0.2); }
.pf-counselor-icon  { font-size: 22px; flex-shrink: 0; }
.pf-counselor-info  { flex: 1; }
.pf-counselor-label { font-size: 14px; font-weight: 800; color: #15803D; }
.pf-counselor-sub   { font-size: 11px; color: #4ADE80; margin-top: 1px; }
.pf-counselor-badge {
  display: inline-flex; align-items: center; justify-content: center;
  background: #EF4444; color: white;
  font-size: 10px; font-weight: 800;
  min-width: 20px; height: 20px; border-radius: 10px; padding: 0 5px;
}
.pf-counselor-arr { font-size: 22px; color: #86EFAC; flex-shrink: 0; }

/* ── Logout ── */
.pf-logout-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 8px;
  background: none;
  border: none;
  color: #F43F5E;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  border-radius: 8px;
}
.pf-logout-btn:active { background: #FFF0F0; }
</style>
