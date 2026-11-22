<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAdminStore } from '../../stores/admin'
import { useAuthStore } from '../../stores/auth'
import { useLocaleStore } from '../../stores/locale'
import DashboardSection from './DashboardSection.vue'
import ProductsSection from './ProductsSection.vue'
import OrdersSection from './OrdersSection.vue'
import CustomersSection from './CustomersSection.vue'
import CategoriesSection from './CategoriesSection.vue'
import SettingsSection from './SettingsSection.vue'
import AuditSection from './AuditSection.vue'

const props = defineProps<{
  section: string
  productId: string
  initialCategory: string
}>()

const admin = useAdminStore()
const auth = useAuthStore()
const locale = useLocaleStore()
const router = useRouter()
const { busy, products, staffRole, isAdminRole, inventoryMetrics } = storeToRefs(admin)

const SECTIONS = {
  dashboard: DashboardSection,
  products: ProductsSection,
  orders: OrdersSection,
  customers: CustomersSection,
  categories: CategoriesSection,
  settings: SettingsSection,
  audit: AuditSection,
} as const

const activeSection = computed(() => SECTIONS[props.section as keyof typeof SECTIONS] ?? DashboardSection)
// Only the products section needs the route parameters.
const sectionProps = computed(() =>
  props.section === 'products' ? { productId: props.productId, initialCategory: props.initialCategory } : {}
)

onMounted(async () => {
  await admin.run(async () => {
    if (!(await admin.loadBundle())) {
      await router.replace('/login?redirect=' + encodeURIComponent('/admin/' + props.section))
      return
    }
    await admin.loadSection(props.section)
  })
})

watch(() => props.section, (section) => {
  if (admin.ready) void admin.loadSection(section)
})

async function logout() {
  await auth.logout()
  await router.replace('/shop')
}
</script>

<template>
  <main class="admin-shell" :dir="locale.isRTL ? 'rtl' : 'ltr'">
    <aside class="admin-sidebar">
      <div class="sidebar-header">
        <router-link class="admin-brand" to="/admin/dashboard">
          STUDIO <span class="lime-text">ACTIVE</span>
          <small class="brand-sub">CONTROL CENTER</small>
        </router-link>
      </div>

      <div class="sidebar-nav">
        <div class="sidebar-label">WORKSPACE</div>
        <router-link to="/admin/dashboard" class="sidebar-link">
          <span class="nav-icon">▦</span>
          <span>لوحة التحكم</span>
        </router-link>
        <router-link to="/admin/products" class="sidebar-link">
          <span class="nav-icon">▤</span>
          <span>المنتجات والمخزون</span>
          <span v-if="products.length" class="counter-pill">{{ products.length }}</span>
        </router-link>
        <router-link to="/admin/categories" class="sidebar-link">
          <span class="nav-icon">⌘</span>
          <span>التصنيفات</span>
        </router-link>

        <!-- Orders and customers are admin-only on the server (ADM-02). -->
        <template v-if="isAdminRole">
          <router-link to="/admin/orders" class="sidebar-link">
            <span class="nav-icon">▣</span>
            <span>الطلبات</span>
            <span v-if="inventoryMetrics.processingCount" class="badge-alert">{{ inventoryMetrics.processingCount }}</span>
          </router-link>
          <router-link to="/admin/customers" class="sidebar-link">
            <span class="nav-icon">♙</span>
            <span>العملاء</span>
          </router-link>

          <div class="sidebar-label">ADMINISTRATION</div>
          <router-link to="/admin/settings" class="sidebar-link">
            <span class="nav-icon">⚙</span>
            <span>إعدادات المتجر</span>
          </router-link>
          <router-link to="/admin/audit" class="sidebar-link">
            <span class="nav-icon">≡</span>
            <span>سجل النشاط</span>
          </router-link>
        </template>
      </div>

      <div class="sidebar-footer">
        <router-link to="/shop" class="sidebar-action-btn view-shop">
          <span>↗ عرض المتجر</span>
        </router-link>
        <button type="button" class="sidebar-action-btn logout-btn" :disabled="busy" @click="logout">
          <span>⤴ تسجيل الخروج</span>
        </button>
      </div>
    </aside>

    <section class="admin-workspace">
      <header class="workspace-topbar">
        <div class="topbar-breadcrumb">
          <span class="site-tag">Studio Active</span>
          <span class="sep">/</span>
          <b class="active-sec">{{ section.toUpperCase() }}</b>
        </div>
        <div class="topbar-user">
          <span class="role-badge">{{ staffRole === 'admin' ? 'SYSTEM ADMIN' : 'STAFF MANAGER' }}</span>
          <span class="user-email">{{ auth.user?.email || '' }}</span>
        </div>
      </header>

      <div class="workspace-content">
        <component :is="activeSection" v-bind="sectionProps" />
      </div>
    </section>
  </main>
</template>

<style src="../../styles/admin.css"></style>
