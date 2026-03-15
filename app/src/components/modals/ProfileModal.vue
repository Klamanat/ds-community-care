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

          <!-- Counselor inbox -->
          <template v-if="isCounselor">
            <div class="pf-divider" style="margin:16px 0 12px;"></div>
            <div class="pf-section-title" style="font-size:14px;">
              💚 กล่องข้อความที่ปรึกษา
              <span v-if="mental.unreadCount" class="pf-unread-badge">{{ mental.unreadCount }}</span>
            </div>
            <div v-if="mental.requestsLoading" class="pf-req-loading">⏳ กำลังโหลด...</div>
            <div v-else-if="mental.requestsError" class="pf-req-error">
              ⚠️ {{ mental.requestsError }}
              <button class="pf-req-retry" @click="mental.loadMyRequests(userAuth.userId, true)">โหลดใหม่</button>
            </div>
            <div v-else-if="!mental.myRequests.length" class="pf-req-empty">📭 ยังไม่มีข้อความ</div>
            <div v-else class="pf-req-list">
              <div
                v-for="r in mental.myRequests"
                :key="r.id"
                class="pf-req-item"
                :class="{ 'pf-req-unread': r.isRead !== 'true' }"
                @click="mental.markRead(r.id)"
              >
                <div class="pf-req-msg">{{ r.message }}</div>
                <div class="pf-req-meta">
                  <span class="pf-req-time">{{ fmtTime(r.createdAt) }}</span>
                  <span v-if="r.isRead !== 'true'" class="pf-req-new">ใหม่</span>
                </div>
              </div>
            </div>
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
import { ref, computed, onMounted, watch } from 'vue'
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

onMounted(async () => {
  await mental.loadAdvisors()
  if (isCounselor.value) mental.loadMyRequests(userAuth.userId, true)
})

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
function fmtTime(iso) {
  if (!iso) return ''
  try {
    const d    = new Date(iso)
    const diff = Date.now() - d
    if (diff < 60000)    return 'เมื่อกี้'
    if (diff < 3600000)  return Math.floor(diff / 60000) + ' นาทีที่แล้ว'
    if (diff < 86400000) return Math.floor(diff / 3600000) + ' ชั่วโมงที่แล้ว'
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
  } catch { return '' }
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

/* ── Counselor inbox ── */
.pf-unread-badge {
  display: inline-flex; align-items: center; justify-content: center;
  background: #EF4444; color: white;
  font-size: 10px; font-weight: 800;
  min-width: 18px; height: 18px; border-radius: 9px;
  padding: 0 5px; margin-left: 6px; vertical-align: middle;
}
.pf-req-loading { font-size: 12px; color: #9CA3AF; padding: 8px 0; }
.pf-req-empty   { font-size: 12px; color: #9CA3AF; padding: 8px 0; }
.pf-req-error {
  font-size: 12px; color: #DC2626; padding: 8px 10px;
  background: #FEF2F2; border-radius: 8px;
  display: flex; align-items: center; gap: 8px;
}
.pf-req-retry {
  background: none; border: 1px solid #DC2626; color: #DC2626;
  font-size: 11px; font-weight: 700; border-radius: 6px;
  padding: 2px 8px; cursor: pointer; margin-left: auto;
}
.pf-req-retry:hover { background: #FEF2F2; }
.pf-req-list    { display: flex; flex-direction: column; gap: 8px; }
.pf-req-item {
  padding: 10px 12px;
  background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px;
  cursor: pointer; transition: background 0.1s;
}
.pf-req-item:active { background: #F0FDF4; }
.pf-req-unread { background: #F0FDF4; border-color: #86EFAC; }
.pf-req-msg  { font-size: 13px; color: #111827; line-height: 1.5; margin-bottom: 4px; }
.pf-req-meta { display: flex; align-items: center; gap: 8px; }
.pf-req-time { font-size: 10px; color: #9CA3AF; }
.pf-req-new  {
  font-size: 10px; font-weight: 800; color: #15803D;
  background: #DCFCE7; padding: 1px 6px; border-radius: 10px;
}

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
