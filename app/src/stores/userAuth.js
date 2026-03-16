import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { gasGet } from '../services/api.js'
import { fetchImages, getCached } from '../services/imageService.js'
import { fetchAllEmployees } from '../services/teamService.js'

export const useUserAuthStore = defineStore('userAuth', () => {
  const userId     = ref(localStorage.getItem('user_id')    || '')
  const userName   = ref(localStorage.getItem('user_name')  || '')
  const userRole   = ref(localStorage.getItem('user_role')  || '')
  const userImgId  = ref(localStorage.getItem('user_imgid') || '')
  const userImgUrl = ref(localStorage.getItem('user_img')   || getCached(localStorage.getItem('user_imgid') || '') || '')
  const userDept   = ref(localStorage.getItem('user_dept')   || '')
  const userSlogan = ref(localStorage.getItem('user_slogan') || '')
  const isLoading  = ref(false)
  const error      = ref('')

  // Background profile sync on app start — refreshes name/role/dept/slogan/image across devices
  // Deferred 5s so it doesn't compete with critical data calls on cold GAS start
  if (userId.value) {
    setTimeout(function() { fetchAllEmployees().then(emps => {
      const emp = emps.find(e => String(e.id) === String(userId.value))
      if (!emp) return
      const changed = emp.name !== userName.value
        || (emp.role || '') !== userRole.value
        || (emp.dept || '') !== userDept.value
        || (emp.starGangSlogan || '') !== userSlogan.value
        || (emp.imgId || '') !== userImgId.value
      if (changed) {
        _persist(emp)  // updates all fields + triggers image fetch if needed
      } else if (!userImgUrl.value && userImgId.value) {
        // Text data unchanged — resolve image only
        const cached = getCached(userImgId.value)
        if (cached) userImgUrl.value = cached
        else fetchImages([userImgId.value]).then(map => {
          if (map[userImgId.value]) userImgUrl.value = map[userImgId.value]
        }).catch(() => {})
      }
    }).catch(() => {}) }, 5000)
  }

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
    userImgId.value  = emp.imgId  || ''
    userImgUrl.value = emp.imgUrl || getCached(emp.imgId || '') || ''
    userDept.value   = emp.dept           || ''
    userSlogan.value = emp.starGangSlogan || ''
    localStorage.setItem('user_id',     userId.value)
    localStorage.setItem('user_name',   userName.value)
    localStorage.setItem('user_role',   userRole.value)
    localStorage.setItem('user_imgid',  userImgId.value)
    localStorage.setItem('user_img',    userImgUrl.value)
    localStorage.setItem('user_dept',   userDept.value)
    localStorage.setItem('user_slogan', userSlogan.value)
    // Fetch Drive image in background if not available immediately
    if (userImgId.value && !userImgUrl.value) {
      fetchImages([userImgId.value]).then(map => {
        if (map[userImgId.value]) userImgUrl.value = map[userImgId.value]
      }).catch(() => {})
    }
  }

  function logout() {
    userId.value = ''; userName.value = ''; userRole.value = ''
    userImgUrl.value = ''; userDept.value = ''; userSlogan.value = ''
    ;['user_id','user_name','user_role','user_imgid','user_img','user_dept','user_slogan','dsc_ann_seen'].forEach(k => localStorage.removeItem(k))
  }

  return { userId, userName, userRole, userImgId, userImgUrl, userDept, userSlogan, isLoading, error, isAuthenticated, loginWithEmployee, logout }
})
