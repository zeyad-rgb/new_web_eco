<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCatalogStore } from '../../stores/catalog'
import { useAuthStore } from '../../stores/auth'
import { useUIStore } from '../../stores/ui'
import { useLocaleStore } from '../../stores/locale'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const router = useRouter()
const catalog = useCatalogStore()
const auth = useAuthStore()
const ui = useUIStore()
const locale = useLocaleStore()

const expandedCategory = ref<string | null>(null)

function toggleCategory(slug: string) {
  expandedCategory.value = expandedCategory.value === slug ? null : slug
}

function navigateTo(path: string, query?: Record<string, string>) {
  emit('close')
  router.push({ path, query })
}
</script>

<template>
  <div v-if="open" class="mobile-drawer-backdrop" @click.self="emit('close')">
    <aside
      class="mobile-drawer"
      role="dialog"
      aria-modal="true"
      aria-label="قائمة التصفح"
    >
      <!-- Header -->
      <div class="drawer-top-bar">
        <router-link to="/" class="brand" dir="ltr" @click="emit('close')">
          STUDIO<span>ACTIVE</span>
        </router-link>
        <button
          type="button"
          class="close-btn"
          aria-label="إغلاق القائمة"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>

      <!-- User Welcome / Account Strip -->
      <div class="user-strip">
        <div v-if="auth.isStaff" class="user-badge is-staff" @click="navigateTo('/admin/dashboard')">
          <div class="user-avatar">⚡</div>
          <div>
            <strong>{{ auth.user?.name || 'مسؤول المتجر' }}</strong>
            <small>{{ locale.locale === 'en' ? 'Control Center' : 'لوحة التحكم الإدارية' }} ({{ auth.isAdmin ? 'ADMIN' : 'STAFF' }})</small>
          </div>
        </div>
        <div v-else-if="auth.isAuthenticated" class="user-badge" @click="navigateTo('/profile')">
          <div class="user-avatar">👤</div>
          <div>
            <strong>{{ auth.user?.name }}</strong>
            <small>{{ locale.locale === 'en' ? 'My account & orders' : 'حسابي وطلباتي' }}</small>
          </div>
        </div>
        <div v-else class="login-prompt">
          <p>{{ locale.locale === 'en' ? 'Sign in to follow your orders' : 'سجل دخولك لمتابعة طلباتك' }}</p>
          <div class="login-btns">
            <button type="button" class="login-btn" @click="navigateTo('/login')">
              تسجيل الدخول
            </button>
            <button type="button" class="register-btn" @click="navigateTo('/register')">
              إنشاء حساب
            </button>
          </div>
        </div>
      </div>

      <!-- Categories & Links List -->
      <div class="drawer-nav-list">
        <div class="nav-section">
          <p class="section-label">الأقسام الرئيسية</p>

          <div
            v-for="root in catalog.rootCategories"
            :key="root.slug"
            class="accordion-item"
          >
            <div class="accordion-head">
              <span
                class="cat-title"
                @click="navigateTo('/shop', { category: root.slug })"
              >
                {{ root.name }}
              </span>
              <button
                type="button"
                class="expand-icon"
                :aria-expanded="expandedCategory === root.slug"
                @click="toggleCategory(root.slug)"
              >
                {{ expandedCategory === root.slug ? '−' : '+' }}
              </button>
            </div>

            <div
              v-show="expandedCategory === root.slug"
              class="subcat-list"
            >
              <button
                v-for="sub in catalog.categories.filter((c) => c.parent_slug === root.slug)"
                :key="sub.slug"
                type="button"
                class="subcat-link"
                @click="navigateTo('/shop', { category: sub.slug })"
              >
                {{ sub.name }}
              </button>
              <button
                type="button"
                class="subcat-link all"
                @click="navigateTo('/shop', { category: root.slug })"
              >
                كل منتجات {{ root.name }} ←
              </button>
            </div>
          </div>
        </div>

        <div class="nav-section">
          <p class="section-label">المجموعات والمميزات</p>
          <button
            type="button"
            class="simple-link highlight"
            @click="navigateTo('/shop', { collection: 'latest' })"
          >
            🔥 وصل حديثاً
          </button>
          <button
            type="button"
            class="simple-link"
            @click="navigateTo('/shop', { collection: 'training' })"
          >
            ⚡ تشكيلة التمرين
          </button>
          <button
            type="button"
            class="simple-link"
            @click="navigateTo('/shop', { collection: 'everyday' })"
          >
            👟 الأساسيات اليومية
          </button>
          <button
            type="button"
            class="simple-link"
            @click="navigateTo('/discover')"
          >
            🔍 استكشف كافة الفئات
          </button>
        </div>

        <div class="nav-section">
          <p class="section-label">المساعدة والدعم</p>
          <button type="button" class="simple-link" @click="navigateTo('/faq')">
            الأسئلة الشائعة
          </button>
          <button type="button" class="simple-link" @click="navigateTo('/shipping')">
            الشحن والتوصيل
          </button>
          <button type="button" class="simple-link" @click="navigateTo('/returns')">
            سياسة الإرجاع
          </button>
        </div>

        <!-- Language Switcher & Dark / Light Theme Toggle -->
        <div class="nav-section drawer-theme-section">
          <button type="button" class="drawer-theme-toggle" @click="locale.toggleLocale">
            <span>{{ locale.locale === 'en' ? '🌐 Switch to Arabic' : '🌐 التبديل إلى English' }}</span>
            <span class="theme-pill">{{ locale.locale === 'en' ? 'العربية' : 'EN' }}</span>
          </button>

          <button type="button" class="drawer-theme-toggle" style="margin-top: 0.5rem" @click="ui.toggleTheme">
            <span>{{ ui.theme === 'dark' ? (locale.locale === 'en' ? '☀️ Switch to Light' : '☀️ التبديل للوضع النهاري') : (locale.locale === 'en' ? '🌙 Switch to Dark' : '🌙 التبديل للوضع الليلي') }}</span>
            <span class="theme-pill">{{ ui.theme === 'dark' ? (locale.locale === 'en' ? 'Dark' : 'ليلي') : (locale.locale === 'en' ? 'Light' : 'نهاري') }}</span>
          </button>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.mobile-drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(17, 18, 16, 0.6);
  backdrop-filter: blur(4px);
  z-index: 150;
  display: flex;
  justify-content: flex-start;
  animation: fadeIn 0.2s ease-out;
}

.mobile-drawer {
  width: 85%;
  max-width: 360px;
  height: 100%;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  box-shadow: 8px 0 30px rgba(0, 0, 0, 0.2);
  animation: slideInLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.drawer-top-bar {
  padding: 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  color: #333;
}

/* User Strip */
.user-strip {
  background: #f7f8f4;
  padding: 1.25rem;
  border-bottom: 1px solid #e5e7e0;
}

.user-badge {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  cursor: pointer;
}

.user-avatar {
  width: 2.6rem;
  height: 2.6rem;
  background: #111;
  color: #fff;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 1.2rem;
}

.user-badge strong {
  display: block;
  font-size: 0.95rem;
}

.user-badge small {
  color: #666;
  font-size: 0.78rem;
}

.login-prompt p {
  margin: 0 0 0.85rem;
  font-size: 0.82rem;
  color: #444;
}

.login-btns {
  display: flex;
  gap: 0.5rem;
}

.login-btn,
.register-btn {
  flex: 1;
  padding: 0.6rem;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  border-radius: 4px;
}

.login-btn {
  background: #111;
  color: #fff;
  border: 1px solid #111;
}

.register-btn {
  background: #fff;
  color: #111;
  border: 1px solid #ccc;
}

/* Nav list */
.drawer-nav-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.25rem;
}

.nav-section {
  margin-bottom: 1.5rem;
}

.section-label {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  color: #888;
  letter-spacing: 0.05em;
  margin-bottom: 0.65rem;
}

.accordion-item {
  border-bottom: 1px solid #f0f0f0;
}

.accordion-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 0;
}

.cat-title {
  font-size: 1rem;
  font-weight: 700;
  color: #111;
  cursor: pointer;
}

.expand-icon {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #666;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
}

.subcat-list {
  display: flex;
  flex-direction: column;
  padding-bottom: 0.75rem;
  padding-inline-start: 0.75rem;
}

.subcat-link {
  background: none;
  border: none;
  text-align: start;
  padding: 0.5rem 0;
  font-size: 0.9rem;
  color: #555;
  cursor: pointer;
}

.subcat-link.all {
  font-weight: 700;
  color: #111;
  margin-top: 0.25rem;
}

.simple-link {
  width: 100%;
  background: none;
  border: none;
  text-align: start;
  padding: 0.75rem 0;
  font-size: 0.95rem;
  color: #222;
  cursor: pointer;
  border-bottom: 1px solid #f7f7f7;
}

.simple-link.highlight {
  font-weight: 700;
  color: #1a4d2e;
}

.drawer-theme-section {
  padding-top: 1rem;
}

.drawer-theme-toggle {
  width: 100%;
  background: #f0f2eb;
  border: 1px solid #dfe2d8;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  color: #222;
  cursor: pointer;
  transition: all 0.15s ease;
}

.drawer-theme-toggle:hover {
  background: #e4e7dd;
}

.theme-pill {
  font-size: 0.75rem;
  background: var(--lime, #d5fb52);
  color: #111;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-weight: 800;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInLeft {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
</style>
