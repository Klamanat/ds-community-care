<template>
  <div class="min-h-screen bg-app-bg flex items-center justify-center px-4 py-8">
    <div class="w-full max-w-sm bg-white rounded-2xl shadow-app-lg overflow-hidden">

      <!-- Hero gradient -->
      <div class="h-36 bg-gradient-to-br from-indigo via-purple to-pink
                  flex flex-col items-center justify-center gap-3">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-white/20 border border-white/35
                      flex items-center justify-center shadow-lg">
            <img src="/favicon.svg" alt="DS" class="w-8 h-8" />
          </div>
          <div class="text-left">
            <div class="text-white font-black text-xl leading-none tracking-tight"
                 style="text-shadow:0 1px 8px rgba(0,0,0,0.3)">DS Community</div>
            <div class="text-white/70 font-bold text-xs tracking-[0.12em] uppercase mt-1">Care · Admin Panel</div>
          </div>
        </div>
      </div>

      <!-- Form body -->
      <div class="px-7 py-7">
        <p class="text-center text-app-light text-sm mb-6">ระบบจัดการข้อมูล DS Community Care</p>

        <!-- Error -->
        <div
          v-if="admin.error"
          class="bg-coral/10 border border-coral/30 text-coral text-sm
                 rounded-lg px-4 py-3 mb-5 font-semibold"
        >
          ⚠️ {{ admin.error }}
        </div>

        <form @submit.prevent="doLogin" class="space-y-4">
          <!-- Username -->
          <div>
            <label class="block text-xs font-bold text-app-mid mb-1.5">Username</label>
            <input
              v-model="username"
              type="text"
              class="w-full border border-app-border rounded-lg px-4 py-3 text-sm
                     text-app-dark bg-app-bg placeholder:text-app-light
                     focus:outline-none focus:border-indigo transition-colors"
              placeholder="admin"
              autocomplete="username"
              required
            />
          </div>

          <!-- Password -->
          <div>
            <label class="block text-xs font-bold text-app-mid mb-1.5">Password</label>
            <div class="relative">
              <input
                v-model="password"
                :type="showPw ? 'text' : 'password'"
                class="w-full border border-app-border rounded-lg px-4 py-3 pr-12 text-sm
                       text-app-dark bg-app-bg placeholder:text-app-light
                       focus:outline-none focus:border-indigo transition-colors"
                placeholder="••••••"
                autocomplete="current-password"
                required
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-app-light
                       hover:text-app-mid transition-colors"
                aria-label="แสดง/ซ่อนรหัสผ่าน"
                @click="showPw = !showPw"
              >{{ showPw ? '🙈' : '👁️' }}</button>
            </div>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            class="w-full py-3 rounded-xl bg-gradient-to-r from-indigo to-purple
                   text-white font-bold text-sm shadow-app active:scale-95 transition-transform
                   disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
            :disabled="admin.isLoading"
          >
            <span v-if="admin.isLoading">กำลังเข้าสู่ระบบ...</span>
            <span v-else>เข้าสู่ระบบ 🔐</span>
          </button>
        </form>

        <p class="text-center text-app-light text-xs mt-6">
          DS Community Care Admin Panel v1.0
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '../../core/stores/admin.js'

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
