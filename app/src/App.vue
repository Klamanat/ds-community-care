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
      <AnnouncementModal />
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
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter, RouterView } from 'vue-router'
import AppHeader from './components/layout/AppHeader.vue'
import AppSidebar from './components/layout/AppSidebar.vue'
import AppBottomNav from './components/layout/AppBottomNav.vue'
import BdayModal from './components/modals/BdayModal.vue'
import EmpathyModal from './components/modals/EmpathyModal.vue'
import EmpDetailModal from './components/modals/EmpDetailModal.vue'
import FinancialModal from './components/modals/FinancialModal.vue'
import MentalModal from './components/modals/MentalModal.vue'
import OrgModal from './components/modals/OrgModal.vue'
import ProfileModal from './components/modals/ProfileModal.vue'
import MonthModal from './components/modals/MonthModal.vue'
import CultureModal from './components/modals/CultureModal.vue'
import TrainingModal from './components/modals/TrainingModal.vue'
import RewardModal from './components/modals/RewardModal.vue'
import AnnouncementModal from './components/modals/AnnouncementModal.vue'
import NotifModal       from './components/modals/NotifModal.vue'
import BlogModal            from './components/modals/BlogModal.vue'
import CounselorInboxModal  from './components/modals/CounselorInboxModal.vue'
import MonthlyPlanModal    from './components/modals/MonthlyPlanModal.vue'
import { useUiStore }        from './stores/ui.js'
import { useUserAuthStore }  from './stores/userAuth.js'
import { useNotifStore }     from './stores/notif.js'
import { useCardConfigStore } from './stores/cardConfig.js'
import { pingPresence }      from './services/presenceService.js'

const ui         = useUiStore()
const userAuth   = useUserAuthStore()
const notif      = useNotifStore()
const cardConfig = useCardConfigStore()

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
