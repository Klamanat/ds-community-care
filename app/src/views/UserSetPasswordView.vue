<template>
  <div class="sp-bg">
    <div class="sp-card">
      <!-- Logo -->
      <div class="sp-logo-wrap">
        <div class="sp-logo-icon">🔑</div>
        <div class="sp-logo-title">ตั้งรหัสผ่านครั้งแรก</div>
        <div class="sp-logo-sub">กรุณาตั้งรหัสผ่านส่วนตัวของคุณ</div>
      </div>

      <!-- Success -->
      <div v-if="done" class="sp-success">
        <div style="font-size:40px;margin-bottom:8px;">✅</div>
        <div style="font-weight:800;font-size:16px;color:#065F46;">ตั้งรหัสผ่านสำเร็จ!</div>
        <div style="font-size:13px;color:#6B7280;margin-top:4px;">กรุณา login ด้วยรหัสผ่านใหม่</div>
        <button class="sp-btn" style="margin-top:16px;" @click="goLogin">ไป Login →</button>
      </div>

      <template v-else>
        <!-- Error -->
        <div v-if="auth.error" class="sp-error">⚠️ {{ auth.error }}</div>

        <form @submit.prevent="doSetPassword">
          <!-- Employee ID -->
          <label class="sp-label">รหัสพนักงาน</label>
          <input
            v-model="selectedId"
            type="text"
            class="sp-input"
            placeholder="เช่น EMP001"
            :readonly="!!route.query.employeeId"
            required
          />

          <!-- New password -->
          <label class="sp-label" style="margin-top:14px;">รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)</label>
          <div style="position:relative;">
            <input
              v-model="password"
              :type="showPw ? 'text' : 'password'"
              class="sp-input"
              placeholder="รหัสผ่านของคุณ"
              autocomplete="new-password"
              required minlength="6"
            />
            <button
              type="button"
              style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:16px;color:#9CA3AF;"
              @click="showPw = !showPw"
            >{{ showPw ? '🙈' : '👁️' }}</button>
          </div>

          <!-- Confirm password -->
          <label class="sp-label" style="margin-top:14px;">ยืนยันรหัสผ่าน</label>
          <input
            v-model="confirm"
            :type="showPw ? 'text' : 'password'"
            class="sp-input"
            placeholder="พิมพ์รหัสผ่านอีกครั้ง"
            autocomplete="new-password"
            required
          />
          <div v-if="confirm && password !== confirm" style="font-size:12px;color:#DC2626;margin-top:4px;">
            รหัสผ่านไม่ตรงกัน
          </div>

          <button
            type="submit"
            class="sp-btn"
            :disabled="auth.isLoading || !selectedId || password !== confirm || password.length < 6"
          >
            <span v-if="auth.isLoading">กำลังบันทึก...</span>
            <span v-else>ตั้งรหัสผ่าน ✅</span>
          </button>
        </form>

        <div class="sp-divider">หรือ</div>
        <button class="sp-link-btn" @click="router.push('/login')">
          ← กลับหน้า Login
        </button>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserAuthStore } from '../stores/userAuth.js'

const auth     = useUserAuthStore()
const router   = useRouter()
const route    = useRoute()

const selectedId = ref(route.query.employeeId || '')
const password   = ref('')
const confirm    = ref('')
const showPw     = ref(false)
const done       = ref(false)


async function doSetPassword() {
  if (password.value !== confirm.value) return
  auth.error = ''
  const ok = await auth.setPassword(selectedId.value, password.value)
  if (ok) done.value = true
}

function goLogin() {
  router.push(`/login?employeeId=${selectedId.value}`)
}
</script>

<style scoped>
.sp-bg {
  min-height: 100dvh;
  background: linear-gradient(135deg, #064E3B 0%, #059669 60%, #34D399 100%);
  display: flex; align-items: center; justify-content: center;
  padding: 24px 16px;
  font-family: 'Sarabun', sans-serif;
}
.sp-card {
  background: white; border-radius: 24px; padding: 32px 28px;
  width: 100%; max-width: 380px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.3);
}
.sp-logo-wrap { text-align: center; margin-bottom: 24px; }
.sp-logo-icon  { font-size: 48px; margin-bottom: 8px; }
.sp-logo-title { font-size: 20px; font-weight: 900; color: #1F2937; }
.sp-logo-sub   { font-size: 13px; color: #6B7280; margin-top: 4px; }
.sp-label {
  display: block; font-size: 12px; font-weight: 700; color: #374151;
  margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.3px;
}
.sp-input {
  width: 100%; padding: 10px 14px; border: 1.5px solid #E5E7EB; border-radius: 10px;
  font-size: 14px; font-family: 'Sarabun', sans-serif; outline: none;
  color: #1F2937; background: #F9FAFB; box-sizing: border-box; transition: border-color 0.15s;
}
.sp-input:focus { border-color: #059669; background: white; }
.sp-btn {
  width: 100%; margin-top: 20px; padding: 13px;
  background: linear-gradient(135deg, #059669, #047857);
  border: none; border-radius: 12px; color: white;
  font-size: 15px; font-weight: 800; font-family: 'Sarabun', sans-serif;
  cursor: pointer; transition: opacity 0.15s;
}
.sp-btn:hover:not(:disabled) { opacity: 0.9; }
.sp-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.sp-error {
  background: #FEF2F2; border: 1.5px solid #FECACA; border-radius: 10px;
  padding: 10px 14px; font-size: 13px; color: #DC2626;
  font-weight: 600; margin-bottom: 16px;
}
.sp-success {
  text-align: center; background: #D1FAE5; border: 1.5px solid #6EE7B7;
  border-radius: 14px; padding: 24px 16px;
}
.sp-divider {
  text-align: center; color: #9CA3AF; font-size: 12px;
  margin: 16px 0; position: relative;
}
.sp-divider::before, .sp-divider::after {
  content: ''; position: absolute; top: 50%;
  width: 40%; height: 1px; background: #E5E7EB;
}
.sp-divider::before { left: 0; }
.sp-divider::after  { right: 0; }
.sp-link-btn {
  width: 100%; padding: 11px; background: #F9FAFB;
  border: 1.5px solid #E5E7EB; border-radius: 12px; color: #374151;
  font-size: 14px; font-weight: 700; font-family: 'Sarabun', sans-serif;
  cursor: pointer; transition: all 0.15s;
}
.sp-link-btn:hover { background: #F3F4F6; }
</style>
