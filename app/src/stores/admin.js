import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as svc from '../services/adminService.js'

export const useAdminStore = defineStore('admin', () => {
  const token     = ref(localStorage.getItem('admin_token') || '')
  const adminName = ref(localStorage.getItem('admin_name') || '')
  const isLoading = ref(false)
  const error     = ref('')

  const isAuthenticated = computed(() => !!token.value)

  async function login(username, password) {
    isLoading.value = true
    error.value = ''
    try {
      const data = await svc.login(username, password)
      token.value     = data.token
      adminName.value = data.name
      localStorage.setItem('admin_token', data.token)
      localStorage.setItem('admin_name',  data.name)
      return true
    } catch (e) {
      error.value = e.message || 'Login failed'
      return false
    } finally {
      isLoading.value = false
    }
  }

  function logout() {
    token.value     = ''
    adminName.value = ''
    error.value     = ''
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_name')
  }

  return { token, adminName, isLoading, error, isAuthenticated, login, logout }
})
