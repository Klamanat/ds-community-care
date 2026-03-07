<template>
  <div class="ul-bg">
    <div class="ul-card">
      <!-- Logo -->
      <div class="ul-logo-wrap">
        <div class="ul-logo-icon">🌟</div>
        <div class="ul-logo-title">DS Community Care</div>
        <div class="ul-logo-sub">ระบบดูแลชุมชน DS</div>
      </div>

      <div v-if="error" class="ul-error">⚠️ {{ error }}</div>

      <form @submit.prevent="doLogin">
        <label class="ul-label">รหัสพนักงาน</label>
        <input
          v-model="employeeId"
          type="text"
          class="ul-input"
          placeholder="เช่น EMP001"
          autocomplete="username"
          autofocus
          required
        />
        <button type="submit" class="ul-btn" :disabled="!employeeId.trim()">
          เข้าสู่ระบบ →
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
const error      = ref('')

function doLogin() {
  error.value = ''
  const id = employeeId.value.trim()
  if (!id) return
  auth.loginWithId(id)
  const redirect = router.currentRoute.value.query.redirect || '/'
  router.push(redirect)
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
</style>
