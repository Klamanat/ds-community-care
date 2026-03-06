import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/',        name: 'home',     component: () => import('../views/HomeView.vue') },
  { path: '/star',    name: 'star',     component: () => import('../views/StarView.vue') },
  { path: '/notif',   name: 'notif',    component: () => import('../views/NotifView.vue') },
  { path: '/settings',name: 'settings', component: () => import('../views/SettingsView.vue') },
  { path: '/idea',    name: 'idea',     component: () => import('../views/IdeaView.vue') },
  { path: '/bday',    name: 'bday',     component: () => import('../views/BdayView.vue') },
  { path: '/culture', name: 'culture',  component: () => import('../views/CultureView.vue') },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() { return { top: 0 } }
})

export default router
