import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { gasGet } from '../services/api.js'

export const useUserAuthStore = defineStore('userAuth', () => {
  const userId     = ref(localStorage.getItem('user_id')   || '')
  const userName   = ref(localStorage.getItem('user_name') || '')
  const userRole   = ref(localStorage.getItem('user_role') || '')
  const userImgUrl = ref(localStorage.getItem('user_img')  || '')
  const userDept   = ref(localStorage.getItem('user_dept') || '')
  const isLoading  = ref(false)
  const error      = ref('')

  const isAuthenticated = computed(() => !!userId.value)

  async function loginWithEmployee(id) {
    isLoading.value = true; error.value = ''
    try {
      const res  = await gasGet('getEmployees')
      const emp  = (res.data || []).find(e => String(e.empCode).toLowerCase() === String(id).trim().toLowerCase())
      if (!emp) {
        error.value = 'ไม่พบรหัสพนักงานนี้ กรุณาตรวจสอบอีกครั้ง'
        return false
      }
      _persist(emp)
      return true
    } catch (e) {
      error.value = e.message?.includes('VITE_GAS_URL')
        ? 'ยังไม่ได้ตั้งค่า GAS URL — กรุณาตั้งค่า VITE_GAS_URL'
        : (e.message || 'เกิดข้อผิดพลาด')
      return false
    } finally {
      isLoading.value = false
    }
  }

  function _persist(emp) {
    userId.value     = String(emp.id)
    userName.value   = emp.name   || ''
    userRole.value   = emp.role   || ''
    userImgUrl.value = emp.imgUrl || ''
    userDept.value   = emp.dept   || ''
    localStorage.setItem('user_id',   userId.value)
    localStorage.setItem('user_name', userName.value)
    localStorage.setItem('user_role', userRole.value)
    localStorage.setItem('user_img',  userImgUrl.value)
    localStorage.setItem('user_dept', userDept.value)
  }

  function logout() {
    userId.value = ''; userName.value = ''; userRole.value = ''
    userImgUrl.value = ''; userDept.value = ''
    ;['user_id','user_name','user_role','user_img','user_dept','dsc_ann_seen'].forEach(k => localStorage.removeItem(k))
  }

  return { userId, userName, userRole, userImgUrl, userDept, isLoading, error, isAuthenticated, loginWithEmployee, logout }
})
