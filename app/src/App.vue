<template>
  <div id="app-shell">
    <AppHeader />
    <div class="body-area">
      <AppSidebar />
      <main class="content-area">
        <div class="router-view-wrapper">
          <RouterView v-slot="{ Component }">
            <Transition name="fade" mode="out-in">
              <component :is="Component" :key="$route.path" />
            </Transition>
          </RouterView>
        </div>
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

    <!-- Toast -->
    <div class="toast" :class="{ hidden: !ui.toast.visible }">{{ ui.toast.msg }}</div>
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
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
import { useUiStore } from './stores/ui.js'

const ui = useUiStore()
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
