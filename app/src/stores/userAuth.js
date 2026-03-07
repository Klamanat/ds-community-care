import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useUserAuthStore = defineStore('userAuth', () => {
  const userId   = ref(localStorage.getItem('user_id')   || '')
  const userName = ref(localStorage.getItem('user_name') || '')

  const isAuthenticated = computed(() => !!userId.value)

  function loginWithId(id, name = '') {
    userId.value   = id
    userName.value = name || id
    localStorage.setItem('user_id',   id)
    localStorage.setItem('user_name', name || id)
  }

  function logout() {
    userId.value = ''; userName.value = ''
    localStorage.removeItem('user_id')
    localStorage.removeItem('user_name')
  }

  return { userId, userName, isAuthenticated, loginWithId, logout }
})
