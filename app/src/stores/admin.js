import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../services/supabase.js'
import * as svc from '../services/adminService.js'

export const useAdminStore = defineStore('admin', () => {
  const adminName = ref(localStorage.getItem('admin_name') || '')
  const isLoading = ref(false)
  const error     = ref('')

  // Restore admin session on page reload
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user?.user_metadata?.role === 'admin') {
      adminName.value = session.user.user_metadata?.name || adminName.value
    } else if (session && session.user?.user_metadata?.role !== 'admin') {
      // Logged in as non-admin — don't expose admin state
      adminName.value = ''
      localStorage.removeItem('admin_name')
    }
  })

  supabase.auth.onAuthStateChange((_event, session) => {
    if (!session) {
      adminName.value = ''
      localStorage.removeItem('admin_name')
    }
  })

  const isAuthenticated = computed(() => !!adminName.value)

  async function login(username, password) {
    isLoading.value = true
    error.value = ''
    try {
      const data = await svc.login(username, password)
      adminName.value = data.name
      localStorage.setItem('admin_name', data.name)
      return true
    } catch (e) {
      error.value = e.message || 'Login failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    adminName.value = ''
    error.value     = ''
    localStorage.removeItem('admin_name')
  }

  return { adminName, isLoading, error, isAuthenticated, login, logout }
})
