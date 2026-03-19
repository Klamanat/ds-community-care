<template>
  <div class="ul-bg">
    <div class="ul-card">

      <!-- Logo -->
      <div class="ul-logo-wrap">
        <div class="ul-logo-icon">🌟</div>
        <div class="ul-logo-title">DS Community Care</div>
        <div class="ul-logo-sub">ระบบดูแลชุมชน DS</div>
      </div>

      <div v-if="auth.error" class="ul-error">⚠️ {{ auth.error }}</div>

      <!-- Step 1: Employee code -->
      <form v-if="step === 'code'" @submit.prevent="doCheck">
        <label class="ul-label">รหัสพนักงาน</label>
        <input
          v-model="employeeId"
          type="text"
          class="ul-input"
          placeholder="เช่น 11XXXXXX"
          autocomplete="username"
          autofocus
          required
        />
        <button type="submit" class="ul-btn" :disabled="checking || !employeeId.trim()">
          <span v-if="checking">กำลังตรวจสอบ...</span>
          <span v-else>ถัดไป →</span>
        </button>
      </form>

      <!-- Step 2: Set new passcode (first login) -->
      <form v-else-if="step === 'setup'" @submit.prevent="doSetup">
        <div class="ul-back" @click="step = 'code'; auth.error = ''">‹ เปลี่ยนรหัสพนักงาน</div>
        <div class="ul-emp-badge">👤 {{ employeeId }}</div>
        <div class="ul-setup-msg">ยินดีต้อนรับ! กรุณาตั้งรหัสผ่านสำหรับการเข้าสู่ระบบครั้งถัดไป</div>
        <label class="ul-label">ตั้งรหัสผ่านใหม่</label>
        <input
          v-model="passcode"
          :type="showPass ? 'text' : 'password'"
          class="ul-input"
          placeholder="กรอกรหัสผ่านที่ต้องการ"
          autocomplete="new-password"
          autofocus
          required
        />
        <label class="ul-label" style="margin-top:12px;">ยืนยันรหัสผ่าน</label>
        <input
          v-model="passcode2"
          :type="showPass ? 'text' : 'password'"
          class="ul-input"
          placeholder="กรอกรหัสผ่านอีกครั้ง"
          autocomplete="new-password"
          required
        />
        <div class="ul-show-pass" @click="showPass = !showPass">
          {{ showPass ? '🙈 ซ่อน' : '👁 แสดง' }}
        </div>
        <button type="submit" class="ul-btn" :disabled="auth.isLoading || !passcode.trim() || !passcode2.trim()">
          <span v-if="auth.isLoading">กำลังบันทึก...</span>
          <span v-else>บันทึกและเข้าสู่ระบบ →</span>
        </button>
      </form>

      <!-- Step 3: Enter existing passcode -->
      <form v-else @submit.prevent="doLogin">
        <div class="ul-back" @click="step = 'code'; auth.error = ''">‹ เปลี่ยนรหัสพนักงาน</div>
        <div class="ul-emp-badge">👤 {{ employeeId }}</div>
        <label class="ul-label">รหัสผ่าน</label>
        <input
          v-model="passcode"
          :type="showPass ? 'text' : 'password'"
          class="ul-input"
          placeholder="กรอกรหัสผ่าน"
          autocomplete="current-password"
          autofocus
          required
        />
        <div class="ul-show-pass" @click="showPass = !showPass">
          {{ showPass ? '🙈 ซ่อน' : '👁 แสดง' }}
        </div>
        <button type="submit" class="ul-btn" :disabled="auth.isLoading || !passcode.trim()">
          <span v-if="auth.isLoading">กำลังตรวจสอบ...</span>
          <span v-else>เข้าสู่ระบบ →</span>
        </button>
      </form>

      <div style="text-align:center;margin-top:24px;font-size:11px;color:#9CA3AF;">
        DS Community Care v1.0
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserAuthStore } from '../stores/userAuth.js'

const auth       = useUserAuthStore()
const router     = useRouter()
const employeeId = ref('')
const passcode   = ref('')
const passcode2  = ref('')
const showPass   = ref(false)
const step       = ref('code')  // 'code' | 'setup' | 'login'
const checking   = ref(false)

async function doCheck() {
  auth.error = ''
  const id = employeeId.value.trim()
  if (!id) return
  checking.value = true
  try {
    const { exists, status } = await auth.checkEmployee(id)
    if (!exists) { auth.error = 'ไม่พบรหัสพนักงานนี้ กรุณาตรวจสอบอีกครั้ง'; return }
    if (status === 'no_passcode') {
      // No passcode required — login directly
      const ok = await auth.loginWithEmployee(id)
      if (ok) router.push(router.currentRoute.value.query.redirect || '/')
    } else if (status === 'needs_setup') {
      step.value = 'setup'
    } else {
      step.value = 'login'
    }
    passcode.value = ''
    passcode2.value = ''
  } finally {
    checking.value = false
  }
}

async function doSetup() {
  auth.error = ''
  if (passcode.value !== passcode2.value) {
    auth.error = 'รหัสผ่านทั้งสองช่องไม่ตรงกัน กรุณาลองใหม่'
    return
  }
  const id = employeeId.value.trim()
  const ok = await auth.setPasscode(id, passcode.value.trim())
  if (!ok) return  // error set by store
  // Now login
  const loggedIn = await auth.loginWithEmployee(id, passcode.value.trim())
  if (loggedIn) router.push(router.currentRoute.value.query.redirect || '/')
}

async function doLogin() {
  auth.error = ''
  const ok = await auth.loginWithEmployee(employeeId.value.trim(), passcode.value.trim())
  if (ok) router.push(router.currentRoute.value.query.redirect || '/')
}
</script>

<style scoped>
.ul-bg {
  min-height: 100dvh;
  background: linear-gradient(135deg, #1E1B4B 0%, #4338CA 60%, #7C3AED 100%);
  display: flex; align-items: center; justify-content: center;
  padding: 24px 16px;
  font-family: 'Sarabun', sans-serif;
}
.ul-card {
  background: white; border-radius: 24px; padding: 32px 28px;
  width: 100%; max-width: 360px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.35);
}
.ul-logo-wrap { text-align: center; margin-bottom: 28px; }
.ul-logo-icon  { font-size: 52px; margin-bottom: 8px; }
.ul-logo-title { font-size: 22px; font-weight: 900; color: #1F2937; }
.ul-logo-sub   { font-size: 13px; color: #6B7280; margin-top: 4px; }
.ul-label {
  display: block; font-size: 12px; font-weight: 700; color: #374151;
  margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.3px;
}
.ul-input {
  width: 100%; padding: 11px 14px; border: 1.5px solid #E5E7EB; border-radius: 10px;
  font-size: 15px; font-family: 'Sarabun', sans-serif; outline: none;
  color: #1F2937; background: #F9FAFB; box-sizing: border-box; transition: border-color 0.15s;
}
.ul-input:focus { border-color: #6366F1; background: white; }
.ul-btn {
  width: 100%; margin-top: 18px; padding: 13px;
  background: linear-gradient(135deg, #6366F1, #4F46E5);
  border: none; border-radius: 12px; color: white;
  font-size: 15px; font-weight: 800; font-family: 'Sarabun', sans-serif;
  cursor: pointer; transition: opacity 0.15s;
}
.ul-btn:hover:not(:disabled) { opacity: 0.9; }
.ul-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.ul-error {
  background: #FEF2F2; border: 1.5px solid #FECACA; border-radius: 10px;
  padding: 10px 14px; font-size: 13px; color: #DC2626;
  font-weight: 600; margin-bottom: 16px;
}
.ul-back {
  font-size: 12px; font-weight: 700; color: #6366F1;
  cursor: pointer; margin-bottom: 14px;
}
.ul-emp-badge {
  background: #EEF2FF; border-radius: 10px; padding: 8px 14px;
  font-size: 14px; font-weight: 700; color: #4F46E5;
  margin-bottom: 16px;
}
.ul-show-pass {
  font-size: 11px; font-weight: 700; color: #6B7280;
  cursor: pointer; margin-top: 6px; text-align: right;
}
.ul-setup-msg {
  font-size: 13px; color: #6B7280; margin-bottom: 16px; line-height: 1.5;
}
</style>
