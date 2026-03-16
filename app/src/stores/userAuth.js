import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '../services/supabase.js'
import { login as authLogin } from '../services/userAuthService.js'
import { fetchImages, getCached } from '../services/imageService.js'
import { fetchAllEmployees } from '../services/teamService.js'

export const useUserAuthStore = defineStore('userAuth', () => {
  const userId     = ref(localStorage.getItem('user_id')     || '')
  const userName   = ref(localStorage.getItem('user_name')   || '')
  const userRole   = ref(localStorage.getItem('user_role')   || '')
  const userImgId  = ref(localStorage.getItem('user_imgid')  || '')
  const userImgUrl = ref(localStorage.getItem('user_img')    || getCached(localStorage.getItem('user_imgid') || '') || '')
  const userDept   = ref(localStorage.getItem('user_dept')   || '')
  const userSlogan = ref(localStorage.getItem('user_slogan') || '')
  const isLoading  = ref(false)
  const error      = ref('')

  // Restore session from Supabase on page reload
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) _syncFromMeta(session.user)
  })

  // Keep state in sync if session changes (e.g. token refresh, sign-out elsewhere)
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      _syncFromMeta(session.user)
    } else if (!session) {
      _clearLocal()
    }
  })

  // Background profile sync — refresh name/role/dept/slogan/image across devices
  if (userId.value) {
    setTimeout(function() { fetchAllEmployees().then(emps => {
      const emp = emps.find(e => String(e.id) === String(userId.value))
      if (!emp) return
      const changed = emp.name !== userName.value
        || (emp.role || '') !== userRole.value
        || (emp.dept || '') !== userDept.value
        || (emp.star_gang_slogan || emp.starGangSlogan || '') !== userSlogan.value
        || (emp.img_id || emp.imgId || '') !== userImgId.value
      if (changed) {
        _persist(emp)
      } else if (!userImgUrl.value && userImgId.value) {
        const cached = getCached(userImgId.value)
        if (cached) userImgUrl.value = cached
        else fetchImages([userImgId.value]).then(map => {
          if (map[userImgId.value]) userImgUrl.value = map[userImgId.value]
        }).catch(() => {})
      }
    }).catch(() => {}) }, 5000)
  }

  const isAuthenticated = computed(() => !!userId.value)

  async function loginWithEmployee(id, password) {
    isLoading.value = true; error.value = ''
    try {
      const emp = await authLogin(id, password || '')
      _persist(emp)
      return true
    } catch (e) {
      error.value = e.message || 'เกิดข้อผิดพลาด'
      return false
    } finally {
      isLoading.value = false
    }
  }

  function _syncFromMeta(user) {
    const m = user.user_metadata || {}
    if (m.employee_id || m.employeeId) {
      userId.value     = String(m.employee_id || m.employeeId || '')
      userName.value   = m.name    || ''
      userRole.value   = m.role    || ''
      userImgId.value  = m.img_id  || m.imgId  || ''
      userImgUrl.value = m.img_url || m.imgUrl || getCached(userImgId.value) || ''
      userDept.value   = m.dept    || ''
      userSlogan.value = m.star_gang_slogan || m.starGangSlogan || ''
      _saveLocal()
    }
  }

  function _persist(emp) {
    userId.value     = String(emp.id || emp.employee_id || '')
    userName.value   = emp.name   || ''
    userRole.value   = emp.role   || ''
    userImgId.value  = emp.img_id  || emp.imgId  || ''
    userImgUrl.value = emp.img_url || emp.imgUrl || getCached(userImgId.value) || ''
    userDept.value   = emp.dept           || ''
    userSlogan.value = emp.star_gang_slogan || emp.starGangSlogan || ''
    _saveLocal()
    if (userImgId.value && !userImgUrl.value) {
      fetchImages([userImgId.value]).then(map => {
        if (map[userImgId.value]) userImgUrl.value = map[userImgId.value]
      }).catch(() => {})
    }
  }

  function _saveLocal() {
    localStorage.setItem('user_id',     userId.value)
    localStorage.setItem('user_name',   userName.value)
    localStorage.setItem('user_role',   userRole.value)
    localStorage.setItem('user_imgid',  userImgId.value)
    localStorage.setItem('user_img',    userImgUrl.value)
    localStorage.setItem('user_dept',   userDept.value)
    localStorage.setItem('user_slogan', userSlogan.value)
  }

  function _clearLocal() {
    userId.value = ''; userName.value = ''; userRole.value = ''
    userImgId.value = ''; userImgUrl.value = ''; userDept.value = ''; userSlogan.value = ''
  }

  async function logout() {
    await supabase.auth.signOut()
    _clearLocal()
    ;['user_id','user_name','user_role','user_imgid','user_img','user_dept','user_slogan','dsc_ann_seen'].forEach(k => localStorage.removeItem(k))
  }

  return { userId, userName, userRole, userImgId, userImgUrl, userDept, userSlogan, isLoading, error, isAuthenticated, loginWithEmployee, logout }
})
