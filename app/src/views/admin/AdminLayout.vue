<template>
  <!-- Mobile overlay -->
  <div
    v-if="sideOpen"
    class="fixed inset-0 bg-app-dark/50 z-[150] md:hidden"
    @click="sideOpen = false"
  />

  <div class="flex h-screen overflow-hidden bg-app-bg">

    <!-- ─── Sidebar ─── -->
    <aside
      class="fixed inset-y-0 left-0 z-[200] w-64 bg-app-dark flex flex-col shrink-0
             transition-transform duration-300 ease-out md:relative md:translate-x-0"
      :class="sideOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- Brand -->
      <div class="flex items-center gap-3 px-5 py-4 border-b border-white/10 shrink-0">
        <div class="w-9 h-9 rounded-xl bg-white/18 border border-white/30
                    flex items-center justify-center shrink-0">
          <img src="/favicon.svg" alt="DS" class="w-6 h-6" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-white font-black text-sm leading-none tracking-tight"
               style="text-shadow:0 1px 6px rgba(0,0,0,0.3)">DS Community</div>
          <div class="text-white/50 text-[11px] mt-0.5 font-bold tracking-widest uppercase">Care · Admin</div>
        </div>
        <button
          class="w-7 h-7 flex items-center justify-center rounded text-white/40
                 hover:text-white transition-colors md:hidden"
          aria-label="ปิดเมนู"
          @click="sideOpen = false"
        >✕</button>
      </div>

      <!-- Nav -->
      <nav class="flex-1 overflow-y-auto py-3 px-2 space-y-px">
        <template v-for="group in navGroups" :key="group.group">
          <div class="px-3 pt-5 pb-1 text-white/25 text-[10px] font-extrabold uppercase tracking-widest first:pt-2">
            {{ group.group }}
          </div>
          <router-link
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
            :class="isActive(item)
              ? 'bg-indigo/25 text-white shadow-app-sm'
              : 'text-white/60 hover:text-white hover:bg-white/8'"
            @click="sideOpen = false"
          >
            <div
              v-if="isActive(item)"
              class="absolute left-0 inset-y-2 w-[3px] rounded-r-full bg-gradient-to-b from-indigo to-purple"
            />
            <span class="text-base w-5 text-center leading-none shrink-0">{{ item.icon }}</span>
            <div class="min-w-0 flex-1">
              <div class="text-sm font-semibold leading-none truncate">{{ item.label }}</div>
              <div class="text-[11px] text-white/30 mt-0.5 truncate">{{ item.sub }}</div>
            </div>
          </router-link>
        </template>
      </nav>

      <!-- Footer: user info + logout -->
      <div class="border-t border-white/10 p-3 shrink-0">
        <div class="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-white/5 mb-2">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo to-purple
                      flex items-center justify-center text-white font-bold text-sm shrink-0">
            {{ (admin.adminName || 'A')[0].toUpperCase() }}
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-white text-sm font-semibold truncate">{{ admin.adminName }}</div>
            <div class="text-white/30 text-xs">Administrator</div>
          </div>
        </div>
        <button
          class="w-full py-2 rounded-lg text-white/40 text-sm font-semibold
                 hover:text-coral hover:bg-coral/10 transition-colors"
          @click="doLogout"
        >
          ออกจากระบบ
        </button>
      </div>
    </aside>

    <!-- ─── Main area ─── -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">

      <!-- Topbar -->
      <header class="h-14 bg-white/95 backdrop-blur-sm border-b border-app-border flex items-center
                     gap-3 px-4 shrink-0 shadow-app-sm sticky top-0 z-10">
        <!-- Hamburger — mobile only -->
        <button
          class="w-9 h-9 flex items-center justify-center rounded-lg
                 text-app-mid hover:bg-app-bg transition-colors md:hidden"
          aria-label="เปิดเมนู"
          @click="sideOpen = true"
        >☰</button>

        <!-- Breadcrumb -->
        <div class="flex items-center gap-2 text-sm min-w-0">
          <span class="text-app-light hidden sm:inline font-semibold">DS Admin</span>
          <span class="text-app-border hidden sm:inline">/</span>
          <span class="flex items-center gap-1.5 font-semibold text-app-dark truncate">
            <span>{{ currentItem.icon }}</span>
            <span class="truncate">{{ currentItem.label }}</span>
          </span>
        </div>

        <!-- User chip -->
        <div class="ml-auto flex items-center gap-2.5 bg-app-bg border border-app-border px-3 py-1.5 rounded-xl shrink-0">
          <div class="w-7 h-7 rounded-full bg-gradient-to-br from-indigo to-purple
                      flex items-center justify-center text-white text-xs font-extrabold shrink-0 shadow-app-sm">
            {{ (admin.adminName || 'A')[0].toUpperCase() }}
          </div>
          <span class="text-sm font-semibold text-app-dark hidden sm:block">{{ admin.adminName }}</span>
        </div>
      </header>

      <!-- Page content — each child view handles its own padding via .al-main -->
      <div class="flex-1 overflow-y-auto">
        <RouterView />
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '../../core/stores/admin.js'

const route  = useRoute()
const router = useRouter()
const admin  = useAdminStore()

const sideOpen = ref(false)

const navGroups = [
  {
    group: 'ภาพรวม',
    items: [
      { to: '/admin', icon: '🏠', label: 'Dashboard', sub: 'Overview' },
    ],
  },
  {
    group: 'พนักงาน',
    items: [
      { to: '/admin/employees', icon: '👥', label: 'พนักงาน & วันเกิด', sub: 'Employees · Birthdays' },
    ],
  },
  {
    group: 'ชุมชน',
    items: [
      { to: '/admin/empathy',      icon: '💌', label: 'Empathy',        sub: 'Posts · Kudos' },
      { to: '/admin/ideas',        icon: '💡', label: 'ไอเดีย',         sub: 'Ideas' },
      { to: '/admin/activities',   icon: '📅', label: 'กิจกรรม',        sub: 'Activities' },
      { to: '/admin/announcement', icon: '📢', label: 'ประกาศ / Popup', sub: 'Announcement' },
      { to: '/admin/plans',        icon: '📋', label: 'Monthly Plans',  sub: 'แผนรายเดือน' },
      { to: '/admin/gifts',        icon: '🎁', label: 'ของขวัญ',        sub: 'จัดการรายการ' },
    ],
  },
  {
    group: 'พัฒนา',
    items: [
      { to: '/admin/training', icon: '📚', label: 'Training',      sub: 'หลักสูตร' },
      { to: '/admin/mental',   icon: '💚', label: 'Mental Health', sub: 'ที่ปรึกษา' },
    ],
  },
  {
    group: 'คะแนน & รางวัล',
    items: [
      { to: '/admin/reward-rules', icon: '🏆', label: 'วิธีสะสมคะแนน', sub: 'PointRules' },
      { to: '/admin/rewards',      icon: '🎁', label: 'ของรางวัล',      sub: 'Rewards' },
    ],
  },
  {
    group: 'ระบบ',
    items: [
      { to: '/admin/home-cards', icon: '🃏', label: 'Home Cards',     sub: 'เปิด-ปิด cards' },
      { to: '/admin/migrate',    icon: '🔄', label: 'Migrate Images', sub: 'Drive → Storage' },
    ],
  },
]

const navItems = navGroups.flatMap(g => g.items)

function isActive(item) {
  if (item.to === '/admin') return route.path === '/admin'
  return route.path.startsWith(item.to)
}

const currentItem = computed(() => navItems.find(i => isActive(i)) || navItems[0])

function doLogout() {
  admin.logout()
  router.push('/admin/login')
}
</script>
