import { createRouter, createWebHashHistory } from 'vue-router'
import { track } from '@vercel/analytics'

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
{ path: '/settings', name: 'settings', component: () => import('../views/SettingsView.vue'), meta: { requiresUser: true } },
  { path: '/idea',     name: 'idea',     component: () => import('../views/IdeaView.vue'),     meta: { requiresUser: true } },
  { path: '/bday',     name: 'bday',     component: () => import('../views/BdayView.vue'),     meta: { requiresUser: true } },
  { path: '/culture',    name: 'culture',    component: () => import('../views/CultureView.vue'),    meta: { requiresUser: true } },
  { path: '/tickets',    name: 'tickets',    component: () => import('../views/ActivityTicketsView.vue'), meta: { requiresUser: true } },

  // Admin login (no layout)
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('../views/admin/AdminLoginView.vue'),
    meta: { adminLayout: true },
  },

  // Admin routes — wrapped in AdminLayout (sidebar)
  {
    path: '/admin',
    component: () => import('../views/admin/AdminLayout.vue'),
    meta: { adminLayout: true, requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'admin',
        component: () => import('../views/admin/AdminDashboard.vue'),
      },
      {
        path: 'employees',
        name: 'admin-employees',
        component: () => import('../views/admin/AdminEmployeesView.vue'),
      },
      {
        path: 'birthdays',
        redirect: '/admin/employees',
      },
      {
        path: 'empathy',
        name: 'admin-empathy',
        component: () => import('../views/admin/AdminEmpathyView.vue'),
      },
      {
        path: 'ideas',
        name: 'admin-ideas',
        component: () => import('../views/admin/AdminIdeasView.vue'),
      },
      {
        path: 'activities',
        name: 'admin-activities',
        component: () => import('../views/admin/AdminActivitiesView.vue'),
      },
      {
        path: 'activities/scan',
        name: 'admin-ticket-scan',
        component: () => import('../views/admin/AdminTicketScanView.vue'),
      },
      {
        path: 'announcement',
        name: 'admin-announcement',
        component: () => import('../views/admin/AdminAnnouncementView.vue'),
      },
      {
        path: 'reward-rules',
        name: 'admin-reward-rules',
        component: () => import('../views/admin/AdminRewardRulesView.vue'),
      },
      {
        path: 'rewards',
        name: 'admin-rewards',
        component: () => import('../views/admin/AdminRewardsView.vue'),
      },
      {
        path: 'training',
        name: 'admin-training',
        component: () => import('../views/admin/AdminTrainingView.vue'),
      },
      {
        path: 'mental',
        name: 'admin-mental',
        component: () => import('../views/admin/AdminMentalView.vue'),
      },
      {
        path: 'home-cards',
        name: 'admin-home-cards',
        component: () => import('../views/admin/AdminHomeCardsView.vue'),
      },
      {
        path: 'plans',
        name: 'admin-plans',
        component: () => import('../views/admin/AdminPlansView.vue'),
      },
      {
        path: 'migrate',
        name: 'admin-migrate',
        component: () => import('../views/admin/AdminMigrateView.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() { return { top: 0 } },
})

// Hash routing ไม่ trigger History API → ส่ง pageview ด้วยตัวเองทุกครั้งที่ route เปลี่ยน
router.afterEach((to) => {
  track('pageview', { path: to.fullPath, name: String(to.name || '') })
})

router.beforeEach((to) => {
  // Admin guard (check matched chain for nested routes)
  if (to.matched.some(r => r.meta.requiresAdmin)) {
    const name = localStorage.getItem('admin_name')
    if (!name) return { name: 'admin-login' }
  }
  // User guard
  if (to.meta.requiresUser) {
    const id = localStorage.getItem('user_id')
    if (!id) return { name: 'login', query: { redirect: to.fullPath } }
  }
})

export default router
