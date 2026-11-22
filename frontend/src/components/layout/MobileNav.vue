<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useCartStore } from '../../stores/cart'
import { useLocaleStore } from '../../stores/locale'

const route = useRoute()
const cart = useCartStore()
const locale = useLocaleStore()
</script>

<template>
  <nav class="app-tabs" :aria-label="locale.locale === 'en' ? 'Quick navigation' : 'التنقل السريع'">
    <router-link
      to="/"
      class="tab-link"
      :aria-current="route.path === '/' ? 'page' : undefined"
    >
      <span class="tab-icon" aria-hidden="true">🏠</span>
      <span class="tab-label">{{ locale.locale === 'en' ? 'Home' : 'الرئيسية' }}</span>
    </router-link>

    <router-link
      to="/discover"
      class="tab-link"
      :aria-current="route.path === '/discover' ? 'page' : undefined"
    >
      <span class="tab-icon" aria-hidden="true">🔍</span>
      <span class="tab-label">{{ locale.locale === 'en' ? 'Discover' : 'اكتشف' }}</span>
    </router-link>

    <router-link
      to="/shop"
      class="tab-link"
      :aria-current="route.path === '/shop' ? 'page' : undefined"
    >
      <span class="tab-icon" aria-hidden="true">🛍</span>
      <span class="tab-label">{{ locale.locale === 'en' ? 'Shop' : 'المتجر' }}</span>
    </router-link>

    <router-link
      to="/cart"
      class="tab-link"
      :aria-current="route.path === '/cart' ? 'page' : undefined"
    >
      <span class="tab-icon" aria-hidden="true">🛒</span>
      <span class="tab-label">{{ locale.locale === 'en' ? `Bag (${cart.count})` : `السلة (${cart.count})` }}</span>
    </router-link>
  </nav>
</template>

<style scoped>
.app-tabs {
  display: none;
  position: fixed;
  inset: auto 0 0;
  z-index: 50;
  background: rgba(250, 250, 248, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid rgba(209, 212, 201, 0.6);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding: 0.35rem 0.5rem calc(0.35rem + env(safe-area-inset-bottom, 0px));
}

@media (max-width: 768px) {
  .app-tabs {
    display: flex;
    justify-content: space-around;
    align-items: stretch;
  }
}

.app-tabs a,
.tab-link {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.45rem 0.25rem 0.35rem;
  color: #5d6356;
  text-decoration: none;
  font-size: 0.75rem;
  border-bottom: 2.5px solid transparent;
  background: transparent;
  transition: color 0.25s ease, border-color 0.25s ease, background-color 0.25s ease;
}

.tab-icon {
  font-size: 1.25rem;
  line-height: 1;
  transition: transform 0.25s ease;
}

.tab-label {
  font-size: 0.75rem;
  line-height: 1.2;
  white-space: nowrap;
  transition: color 0.25s ease;
}

.app-tabs a:hover,
.tab-link:hover {
  color: var(--ink, #111210);
}

.app-tabs a:hover .tab-icon,
.tab-link:hover .tab-icon {
  transform: scale(1.08);
}

.app-tabs a[aria-current="page"],
.app-tabs .tab-link[aria-current="page"] {
  color: var(--ink, #111210);
  font-weight: 700;
  border-bottom-color: var(--lime, #d5fb52);
  background: transparent;
}

.app-tabs a[aria-current="page"] .tab-icon,
.app-tabs .tab-link[aria-current="page"] .tab-icon {
  transform: scale(1.1);
}
</style>
