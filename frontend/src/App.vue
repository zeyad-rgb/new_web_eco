<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useCatalogStore } from './stores/catalog'
import { useUIStore } from './stores/ui'
import { useAuthStore } from './stores/auth'
import { useLocaleStore } from './stores/locale'
import TheHeader from './components/layout/TheHeader.vue'
import TheFooter from './components/layout/TheFooter.vue'

import AnnouncementBar from './components/layout/AnnouncementBar.vue'
import CartDrawer from './components/cart/CartDrawer.vue'
import BackToTop from './components/common/BackToTop.vue'
import ToastNotification from './components/common/ToastNotification.vue'

const route = useRoute()
const catalog = useCatalogStore()
const ui = useUIStore()
const locale = useLocaleStore()
const demo = import.meta.env.MODE === 'preview'

const isAdmin = computed(() => route.path.startsWith('/admin'))

onMounted(() => {
  const auth = useAuthStore()
  if (auth.user?.role === 'customer') void auth.refreshCustomer().catch(() => { auth.user = null })
  locale.initLocale()
  ui.initTheme()
  // Avoid catalog requests when entering the Admin Control Center
  if (!isAdmin.value) {
    void catalog.load()
  }
  // Admin route guard validates the session when needed; avoid duplicate checks.
})
</script>

<template>
  <div v-if="isAdmin" class="admin-app">
    <router-view />
  </div>

  <template v-else>
    <AnnouncementBar :demo="demo" />
    <TheHeader />
    <main>
      <router-view />
    </main>
    <TheFooter />

    <CartDrawer />
    <BackToTop />
    <ToastNotification />
  </template>
</template>

<style>
@import './store.css';
</style>

