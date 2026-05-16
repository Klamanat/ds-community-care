<template>
  <div id="app-shell">
    <template v-if="!routerReady"></template>

    <template v-else-if="!isAdmin && !isAuth">
      <AppHeader />
      <div class="body-area">
        <AppSidebar />
        <main class="content-area">
          <RouterView v-slot="{ Component }">
            <Transition name="fade" mode="out-in">
              <component :is="Component" :key="$route.path" />
            </Transition>
          </RouterView>
        </main>
      </div>
      <AppBottomNav />

      <!-- Global Modals — :key forces remount on every open so state resets -->
      <BdayModal      :key="ui.modalKeys['modal-bday']      || 0" />
      <EmpathyModal   :key="ui.modalKeys['modal-emp']       || 0" />
      <EmpDetailModal :key="ui.modalKeys['modal-emp-detail'] || 0" />
      <FinancialModal :key="ui.modalKeys['modal-financial']  || 0" />
      <MentalModal    :key="ui.modalKeys['modal-mental']     || 0" />
      <OrgModal       :key="ui.modalKeys['modal-org']        || 0" />
      <ProfileModal   :key="ui.modalKeys['modal-profile']    || 0" />
      <MonthModal     :key="ui.modalKeys['modal-month']      || 0" />
      <CultureModal   :key="ui.modalKeys['modal-culture']    || 0" />
      <TrainingModal  :key="ui.modalKeys['modal-training']   || 0" />
      <RewardModal       :key="ui.modalKeys['modal-reward']      || 0" />
      <AnnouncementModal   :key="ui.modalKeys['modal-announcement']    || 0" />
      <ActivityTicketModal :key="ui.modalKeys['modal-activity-ticket'] || 0" />
      <NotifModal  :key="ui.modalKeys['modal-notif'] || 0" />
      <BlogModal            :key="ui.modalKeys['modal-blog']             || 0" />
      <CounselorInboxModal :key="ui.modalKeys['modal-counselor-inbox'] || 0" />
      <MonthlyPlanModal   :key="ui.modalKeys['modal-monthly-plan']    || 0" />

      <!-- Toast -->
      <div class="toast" :class="{ hidden: !ui.toast.visible }">{{ ui.toast.msg }}</div>
    </template>

    <!-- Auth layout (login / set-password): bare router view -->
    <template v-else-if="isAuth">
      <RouterView />
    </template>

    <!-- Admin layout: bare router view -->
    <template v-else>
      <RouterView />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue'
import { useRoute, useRouter, RouterView } from 'vue-router'
import AppHeader from './core/layout/AppHeader.vue'
import AppSidebar from './core/layout/AppSidebar.vue'
import AppBottomNav from './core/layout/AppBottomNav.vue'

const BdayModal           = defineAsyncComponent(() => import('./features/birthday/BdayModal.vue'))
const EmpathyModal        = defineAsyncComponent(() => import('./features/empathy/EmpathyModal.vue'))
const EmpDetailModal      = defineAsyncComponent(() => import('./features/empathy/EmpDetailModal.vue'))
const FinancialModal      = defineAsyncComponent(() => import('./features/financial/FinancialModal.vue'))
const MentalModal         = defineAsyncComponent(() => import('./features/mental/MentalModal.vue'))
const OrgModal            = defineAsyncComponent(() => import('./features/team/OrgModal.vue'))
const ProfileModal        = defineAsyncComponent(() => import('./features/team/ProfileModal.vue'))
const MonthModal          = defineAsyncComponent(() => import('./features/plans/MonthModal.vue'))
const CultureModal        = defineAsyncComponent(() => import('./features/culture/CultureModal.vue'))
const TrainingModal       = defineAsyncComponent(() => import('./features/training/TrainingModal.vue'))
const RewardModal         = defineAsyncComponent(() => import('./features/rewards/RewardModal.vue'))
const AnnouncementModal   = defineAsyncComponent(() => import('./features/announcements/AnnouncementModal.vue'))
const ActivityTicketModal = defineAsyncComponent(() => import('./features/activities/ActivityTicketModal.vue'))
const NotifModal          = defineAsyncComponent(() => import('./features/notifications/NotifModal.vue'))
const BlogModal           = defineAsyncComponent(() => import('./features/blog/BlogModal.vue'))
const CounselorInboxModal = defineAsyncComponent(() => import('./features/mental/CounselorInboxModal.vue'))
const MonthlyPlanModal    = defineAsyncComponent(() => import('./features/plans/MonthlyPlanModal.vue'))
import { useUiStore }        from './core/stores/ui.js'
import { useUserAuthStore }  from './core/stores/userAuth.js'
import { useNotifStore }     from './features/notifications/notif.store.js'
import { useCardConfigStore } from './core/stores/cardConfig.js'
import { useRewardStore }    from './features/rewards/reward.store.js'
import { useMentalStore }    from './features/mental/mental.store.js'
import { pingPresence }      from './core/services/presenceService.js'
import { supabase }          from './core/services/supabase.js'

const ui         = useUiStore()
const userAuth   = useUserAuthStore()
const notif      = useNotifStore()
const cardConfig = useCardConfigStore()
const reward     = useRewardStore()
const mental     = useMentalStore()

// Load card config once at app start (non-admin users also need to know which cards are on/off)
cardConfig.load()
const route    = useRoute()
const router   = useRouter()

// Wait for initial navigation to complete before rendering any layout.
// Without this, route.meta is empty on first render and isAdmin flashes false.
const routerReady = ref(false)
router.isReady().then(() => { routerReady.value = true })

const isAdmin  = computed(() => !!route.meta.adminLayout)
const isAuth   = computed(() => !!route.meta.authLayout)

// Sync logged-in user profile → ui.currentUser
function syncUser() {
  if (userAuth.userId) {
    ui.currentUser = {
      id:    userAuth.userId,
      name:  userAuth.userName,
      role:  userAuth.userRole,
      img:   userAuth.userImgUrl,
      dept:  userAuth.userDept,
      emoji: '😊',
    }
  }
}
syncUser()
watch(() => userAuth.userId,    syncUser)
watch(() => userAuth.userImgUrl, img => { if (ui.currentUser) ui.currentUser.img = img })

// Load notifications when user is known; sync unread count → badge
// Deferred by 3s on first load so it doesn't compete with critical data on cold GAS start
function loadNotifs(immediate = false) {
  if (!userAuth.userName) return
  if (immediate || notif.items.length) {
    notif.load(userAuth.userName)
  } else {
    setTimeout(() => notif.load(userAuth.userName), 3000)
  }
}
onMounted(() => loadNotifs(false))
watch(() => userAuth.userName, () => loadNotifs(true))  // login/logout → immediate
watch(() => notif.unreadCount, count => { ui.notifBadge = count }, { immediate: true })

// Session restore — if no Supabase session exists, try to create one silently.
// Phase 4: On app start, restore real Supabase session and refresh role/name from server.
// AUTH-01: If session exists → user has real authenticated session (not anonymous).
// AUTH-03: refreshFromServer() re-fetches role from DB → prevents localStorage role spoofing.
// Do NOT force logout — auth is localStorage-primary; Supabase session enhances RLS only.
onMounted(async () => {
  if (userAuth.userId && !isAdmin.value) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      // Real session available → refresh role/name/dept from server (AUTH-03)
      await userAuth.refreshFromServer()
    } else {
      // No session: silently attempt anonymous re-auth for RLS 'authenticated' role
      await supabase.auth.signInAnonymously().catch(() => {})
    }
  }
})

// On logout: reset feature store caches so next user gets fresh data
watch(() => userAuth.userId, (newId, oldId) => {
  if (oldId && !newId) {
    notif.reset()
    reward.reset()
    mental.reset()
    ui.currentUser = null
  }
})

// Presence ping — update last_seen_at on mount + every 3 min (non-admin only)
let _pingInterval = null
function startPresencePing() {
  if (!userAuth.userName || isAdmin.value) return
  pingPresence(userAuth.userName, userAuth.userDept)
  _pingInterval = setInterval(() => pingPresence(userAuth.userName, userAuth.userDept), 3 * 60 * 1000)
}
onMounted(() => startPresencePing())
watch(() => userAuth.userName, () => {
  clearInterval(_pingInterval)
  startPresencePing()
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
