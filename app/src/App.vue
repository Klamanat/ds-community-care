<template>
  <div id="app-shell">
    <template v-if="!isAdmin && !isAuth">
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

      <!-- Global Modals -->
      <BdayModal />
      <EmpathyModal />
      <EmpDetailModal />
      <FinancialModal />
      <MentalModal />
      <OrgModal />
      <ProfileModal />
      <MonthModal />
      <CultureModal />
      <TrainingModal />
      <RewardModal />

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
import { computed, watch } from 'vue'
import { useRoute, RouterView } from 'vue-router'
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
import { useUiStore } from './stores/ui.js'
import { useUserAuthStore } from './stores/userAuth.js'

const ui       = useUiStore()
const userAuth = useUserAuthStore()
const route    = useRoute()
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
watch(() => userAuth.userId, syncUser)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
