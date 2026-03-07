import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  // User auth (no login required)
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/UserLoginView.vue'),
    meta: { authLayout: true },
  },

  // App routes (require user login)
  { path: '/',         name: 'home',     component: () => import('../views/HomeView.vue'),     meta: { requiresUser: true } },
  { path: '/star',     name: 'star',     component: () => import('../views/StarView.vue'),     meta: { requiresUser: true } },
  { path: '/notif',    name: 'notif',    component: () => import('../views/NotifView.vue'),    meta: { requiresUser: true } },
  { path: '/settings', name: 'settings', component: () => import('../views/SettingsView.vue'), meta: { requiresUser: true } },
  { path: '/idea',     name: 'idea',     component: () => import('../views/IdeaView.vue'),     meta: { requiresUser: true } },
  { path: '/bday',     name: 'bday',     component: () => import('../views/BdayView.vue'),     meta: { requiresUser: true } },
  { path: '/culture',  name: 'culture',  component: () => import('../views/CultureView.vue'),  meta: { requiresUser: true } },

  // Admin routes (separate auth)
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('../views/admin/AdminLoginView.vue'),
    meta: { adminLayout: true },
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('../views/admin/AdminDashboard.vue'),
    meta: { adminLayout: true, requiresAdmin: true },
  },
  {
    path: '/admin/employees',
    name: 'admin-employees',
    component: () => import('../views/admin/AdminEmployeesView.vue'),
    meta: { adminLayout: true, requiresAdmin: true },
  },
  {
    path: '/admin/birthdays',
    name: 'admin-birthdays',
    component: () => import('../views/admin/AdminBirthdaysView.vue'),
    meta: { adminLayout: true, requiresAdmin: true },
  },
  {
    path: '/admin/empathy',
    name: 'admin-empathy',
    component: () => import('../views/admin/AdminEmpathyView.vue'),
    meta: { adminLayout: true, requiresAdmin: true },
  },
  {
    path: '/admin/ideas',
    name: 'admin-ideas',
    component: () => import('../views/admin/AdminIdeasView.vue'),
    meta: { adminLayout: true, requiresAdmin: true },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() { return { top: 0 } },
})

router.beforeEach((to) => {
  // Admin guard
  if (to.meta.requiresAdmin) {
    const token = localStorage.getItem('admin_token')
    if (!token) return { name: 'admin-login' }
  }
  // User guard
  if (to.meta.requiresUser) {
    const id = localStorage.getItem('user_id')
    if (!id) return { name: 'login', query: { redirect: to.fullPath } }
  }
})

export default router
