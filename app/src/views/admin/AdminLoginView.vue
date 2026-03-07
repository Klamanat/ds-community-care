<template>
  <div class="admin-login-bg">
    <div class="admin-login-card">
      <!-- Logo -->
      <div class="text-center mb-6">
        <div style="font-size:48px;margin-bottom:8px;">🛡️</div>
        <div style="font-size:22px;font-weight:900;color:#1F2937;">DS Admin</div>
        <div style="font-size:13px;color:#6B7280;margin-top:4px;">ระบบจัดการข้อมูล DS Community Care</div>
      </div>

      <!-- Error -->
      <div v-if="admin.error" class="admin-error-box mb-4">
        ⚠️ {{ admin.error }}
      </div>

      <!-- Form -->
      <form @submit.prevent="doLogin">
        <label class="admin-label">Username</label>
        <input
          v-model="username"
          type="text"
          class="admin-input"
          placeholder="admin"
          autocomplete="username"
          required
        />

        <label class="admin-label mt-3">Password</label>
        <div style="position:relative;">
          <input
            v-model="password"
            :type="showPw ? 'text' : 'password'"
            class="admin-input"
            placeholder="••••••"
            autocomplete="current-password"
            required
          />
          <button
            type="button"
            style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:16px;color:#9CA3AF;"
            @click="showPw = !showPw"
          >{{ showPw ? '🙈' : '👁️' }}</button>
        </div>

        <button
          type="submit"
          class="admin-submit-btn mt-5"
          :disabled="admin.isLoading"
        >
          <span v-if="admin.isLoading">กำลังเข้าสู่ระบบ...</span>
          <span v-else>เข้าสู่ระบบ 🔐</span>
        </button>
      </form>

      <div style="text-align:center;margin-top:20px;font-size:11px;color:#9CA3AF;">
        DS Community Care Admin Panel v1.0
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '../../stores/admin.js'

const admin    = useAdminStore()
const router   = useRouter()
const username = ref('')
const password = ref('')
const showPw   = ref(false)

async function doLogin() {
  const ok = await admin.login(username.value, password.value)
  if (ok) router.push('/admin')
}
</script>

<style scoped>
.admin-login-bg {
  min-height: 100dvh;
  background: linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%);
  display: flex; align-items: center; justify-content: center;
  padding: 24px 16px;
}
.admin-login-card {
  background: white; border-radius: 20px; padding: 32px 28px;
  width: 100%; max-width: 380px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.admin-label { display: block; font-size: 12px; font-weight: 700; color: #374151; margin-bottom: 6px; }
.admin-input {
  width: 100%; padding: 10px 14px; border: 1.5px solid #E5E7EB; border-radius: 10px;
  font-size: 14px; font-family: 'Sarabun', sans-serif; outline: none;
  color: #1F2937; background: #F9FAFB; box-sizing: border-box; transition: border-color 0.15s;
}
.admin-input:focus { border-color: #6366F1; background: white; }
.admin-submit-btn {
  width: 100%; padding: 12px; background: linear-gradient(135deg, #6366F1, #4F46E5);
  border: none; border-radius: 12px; color: white; font-size: 15px; font-weight: 800;
  font-family: 'Sarabun', sans-serif; cursor: pointer; transition: opacity 0.15s;
}
.admin-submit-btn:hover:not(:disabled) { opacity: 0.9; }
.admin-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.admin-error-box {
  background: #FEF2F2; border: 1.5px solid #FECACA; border-radius: 10px;
  padding: 10px 14px; font-size: 13px; color: #DC2626; font-weight: 600;
}
.mt-3 { margin-top: 12px; }
.mt-5 { margin-top: 20px; }
.mb-4 { margin-bottom: 16px; }
</style>
