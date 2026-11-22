<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useFavoritesStore } from '../stores/favorites'
import { useCartStore } from '../stores/cart'
import { useUIStore } from '../stores/ui'
import { useLocaleStore } from '../stores/locale'
import { formatMoney } from '../utils/money'

const router = useRouter()
const auth = useAuthStore()
const favorites = useFavoritesStore()
const cart = useCartStore()
const ui = useUIStore()
const locale = useLocaleStore()

const trackOrderId = ref('')
const trackingLoading = ref(false)
const trackingResult = ref<{
  id: string
  status: string
  status_label: string
  created_at: string
  total: number
  customer_name: string
  governorate: string
  items_count: number
} | null>(null)
const trackingError = ref('')

const tierLabel = computed(() => {
  const tier = auth.user?.clubTier || 'silver'
  if (locale.isRTL) {
    if (tier.toLowerCase().includes('gold') || tier === 'ذهبي') return 'ذهبي'
    if (tier.toLowerCase().includes('bronze') || tier === 'برونزي') return 'برونزي'
    return 'فضي'
  }
  if (tier.toLowerCase().includes('gold') || tier === 'ذهبي') return 'GOLD'
  if (tier.toLowerCase().includes('bronze') || tier === 'برونزي') return 'BRONZE'
  return 'SILVER'
})

async function handleTrackOrder() {
  if (!trackOrderId.value.trim()) return
  trackingLoading.value = true
  trackingError.value = ''
  trackingResult.value = null

  try {
    const res = await fetch('/api/v1/orders/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ order_id: trackOrderId.value.trim() }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || (locale.isRTL ? 'لم نتمكن من العثور على طلب بهذا الرقم.' : 'No order found with this reference number.'))
    }
    trackingResult.value = data
    ui.showToast(locale.isRTL ? 'تم جلب بيانات الشحنة بنجاح' : 'Order details fetched successfully', 'success')
  } catch (err) {
    trackingError.value = err instanceof Error ? err.message : (locale.isRTL ? 'حصل خطأ أثناء البحث.' : 'Error fetching order details.')
    ui.showToast(trackingError.value, 'error')
  } finally {
    trackingLoading.value = false
  }
}

async function handleLogout() {
  await auth.logout()
  ui.showToast(locale.isRTL ? 'تم تسجيل الخروج بنجاح · نراك قريباً!' : 'Signed out · See you soon!', 'info', '👋')
  router.push('/shop')
}
</script>

<template>
  <section class="profile-page" aria-labelledby="page-title">
    <div class="profile-container">
      <!-- Member Status Card (Adidas adiClub Style) -->
      <div class="club-card">
        <div class="club-badge-row">
          <span class="club-tag">{{ locale.t('profile.club_title') }}</span>
          <span class="tier-badge">{{ tierLabel }}</span>
        </div>

        <h2>{{ locale.t('profile.welcome', { name: auth.user?.name || (locale.isRTL ? 'البطل الرياضي' : 'Active Member') }) }}</h2>
        <p class="member-since">{{ locale.t('profile.member_since', { date: auth.user?.joinedDate || (locale.isRTL ? 'نوفمبر ٢٠٢٦' : 'Nov 2026') }) }}</p>

        <div class="points-box">
          <div class="points-val">
            <strong>{{ auth.user?.points ?? 350 }}</strong>
            <small>{{ locale.t('profile.reward_points') }}</small>
          </div>
          <p class="points-hint">
            {{ locale.t('profile.points_hint') }}
          </p>
        </div>
      </div>

      <!-- Quick Action Cards Grid -->
      <div class="profile-grid">
        <div class="profile-card">
          <h3>{{ locale.t('profile.account_info') }}</h3>
          <div class="info-row">
            <span>{{ locale.t('profile.name') }}</span>
            <strong>{{ auth.user?.name || (locale.isRTL ? 'عميل تجريبي' : 'Demo Customer') }}</strong>
          </div>
          <div class="info-row">
            <span>{{ locale.t('profile.email') }}</span>
            <strong dir="ltr">{{ auth.user?.email || 'user@example.com' }}</strong>
          </div>
          <div class="info-row">
            <span>{{ locale.t('profile.phone') }}</span>
            <strong dir="ltr">{{ auth.user?.phone || '01000000000' }}</strong>
          </div>
        </div>

        <div class="profile-card">
          <h3>{{ locale.t('profile.quick_activity') }}</h3>
          <div class="stats-row">
            <router-link :to="{ path: '/shop', query: { favorites: 'true' } }" class="stat-box">
              <span class="stat-num">{{ favorites.count }}</span>
              <span class="stat-lbl">{{ locale.t('profile.wishlist') }}</span>
            </router-link>

            <router-link to="/cart" class="stat-box">
              <span class="stat-num">{{ cart.count }}</span>
              <span class="stat-lbl">{{ locale.t('profile.in_cart') }}</span>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Member Benefits Bar -->
      <div class="benefits-card">
        <h3>{{ locale.t('profile.exclusive_benefits') }}</h3>
        <div class="benefits-list">
          <div class="benefit-item">
            <span>🚚</span>
            <div>
              <strong>{{ locale.t('profile.free_shipping_benefit') }}</strong>
              <small>{{ locale.t('profile.free_shipping_sub') }}</small>
            </div>
          </div>
          <div class="benefit-item">
            <span>🎟</span>
            <div>
              <strong>{{ locale.t('profile.birthday_discount') }}</strong>
              <small>{{ locale.t('profile.birthday_sub') }}</small>
            </div>
          </div>
          <div class="benefit-item">
            <span>⚡</span>
            <div>
              <strong>{{ locale.t('profile.early_access') }}</strong>
              <small>{{ locale.t('profile.early_access_sub') }}</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Live Order Tracking Card -->
      <div class="tracker-card">
        <h3>{{ locale.t('profile.track_package') }}</h3>
        <p class="tracker-subtitle">{{ locale.t('profile.track_subtitle') }}</p>

        <form class="tracker-form" @submit.prevent="handleTrackOrder">
          <input
            v-model.trim="trackOrderId"
            type="text"
            :placeholder="locale.t('profile.track_input_placeholder')"
            aria-label="Order ID"
            dir="ltr"
            required
          />
          <button type="submit" class="primary tracker-submit-btn" :disabled="trackingLoading">
            {{ trackingLoading ? locale.t('profile.tracking_loading') : locale.t('profile.track_btn') }}
          </button>
        </form>

        <div v-if="trackingError" class="tracker-error">
          {{ trackingError }}
        </div>

        <div v-if="trackingResult" class="tracking-result-box">
          <div class="result-header">
            <div>
              <span class="res-label">{{ locale.t('profile.order_status') }}</span>
              <strong class="res-status-tag">{{ trackingResult.status_label }}</strong>
            </div>
            <div class="res-amount">
              <span class="res-label">{{ locale.t('profile.amount_due') }}</span>
              <strong>{{ formatMoney(trackingResult.total) }}</strong>
            </div>
          </div>

          <div class="result-details">
            <div class="res-row">
              <span>{{ locale.isRTL ? 'اسم العميل:' : 'Customer Name:' }}</span>
              <strong>{{ trackingResult.customer_name }}</strong>
            </div>
            <div class="res-row">
              <span>{{ locale.isRTL ? 'محافظة التسليم:' : 'Governorate:' }}</span>
              <strong>{{ trackingResult.governorate }}</strong>
            </div>
            <div class="res-row">
              <span>{{ locale.isRTL ? 'عدد المنتجات:' : 'Total Items:' }}</span>
              <strong>{{ trackingResult.items_count }} {{ locale.isRTL ? 'منتج' : 'items' }}</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Logout Button -->
      <div class="logout-wrap">
        <button type="button" class="logout-btn" @click="handleLogout">
          {{ locale.t('profile.sign_out') }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.profile-page {
  background: #f8f9f6;
  min-height: 80vh;
  padding: 3rem clamp(1rem, 5vw, 5rem);
}

.profile-container {
  max-width: 900px;
  margin: 0 auto;
}

/* adiClub Style Banner */
.club-card {
  background: #111210;
  color: #fff;
  border-radius: 8px;
  padding: 2.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
}

.club-badge-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.club-tag {
  background: var(--lime);
  color: #111;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.25rem 0.65rem;
  letter-spacing: 0.05em;
  border-radius: 2px;
}

.tier-badge {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  font-size: 0.8rem;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
}

.club-card h2 {
  font-size: clamp(1.8rem, 3.5vw, 2.5rem);
  margin: 0 0 0.25rem;
}

.member-since {
  color: #999;
  font-size: 0.85rem;
  margin: 0 0 1.5rem;
}

.points-box {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.points-val {
  display: flex;
  flex-direction: column;
  border-inline-end: 1px solid rgba(255, 255, 255, 0.15);
  padding-inline-end: 1.5rem;
}

.points-val strong {
  font-size: 2.2rem;
  line-height: 1;
  color: var(--lime);
}

.points-val small {
  font-size: 0.8rem;
  color: #ccc;
  margin-top: 0.25rem;
}

.points-hint {
  margin: 0;
  font-size: 0.85rem;
  color: #bbb;
  line-height: 1.5;
}

/* Grid */
.profile-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.profile-card {
  background: #fff;
  border: 1px solid #e1e3dd;
  border-radius: 8px;
  padding: 1.5rem;
}

.profile-card h3 {
  margin: 0 0 1.25rem;
  font-size: 1.1rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.65rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.6rem 0;
  border-bottom: 1px dashed #eee;
  font-size: 0.9rem;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row span {
  color: #666;
}

.stats-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8f9f6;
  border: 1px solid #e5e7e0;
  border-radius: 6px;
  padding: 1.2rem;
  text-decoration: none;
  transition: all 0.2s ease;
}

.stat-box:hover {
  border-color: #111;
  transform: translateY(-2px);
}

.stat-num {
  font-size: 1.8rem;
  font-weight: 800;
  color: #111;
}

.stat-lbl {
  font-size: 0.82rem;
  color: #555;
  margin-top: 0.25rem;
}

/* Benefits */
.benefits-card {
  background: #fff;
  border: 1px solid #e1e3dd;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.benefits-card h3 {
  margin: 0 0 1.25rem;
  font-size: 1.1rem;
}

.benefits-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
}

.benefit-item {
  display: flex;
  gap: 0.85rem;
  align-items: flex-start;
}

.benefit-item span {
  font-size: 1.6rem;
}

.benefit-item strong {
  display: block;
  font-size: 0.92rem;
  color: #111;
}

.benefit-item small {
  color: #666;
  font-size: 0.8rem;
}

/* Tracker Card */
.tracker-card {
  background: #fff;
  border: 1px solid #e1e3dd;
  border-radius: 8px;
  padding: 1.75rem;
  margin-bottom: 2rem;
}

.tracker-card h3 {
  margin: 0 0 0.4rem;
  font-size: 1.15rem;
}

.tracker-subtitle {
  color: #666;
  font-size: 0.88rem;
  margin: 0 0 1.25rem;
}

.tracker-form {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.tracker-form input {
  flex: 1;
  min-width: 240px;
  padding: 0.75rem 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.95rem;
}

.tracker-submit-btn {
  padding: 0.75rem 1.5rem;
  font-size: 0.95rem;
  white-space: nowrap;
}

.tracker-error {
  color: #d32f2f;
  background: #ffebee;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  font-size: 0.88rem;
  margin-top: 0.75rem;
}

.tracking-result-box {
  background: #fbfbf9;
  border: 1px solid #e5e5e0;
  border-radius: 6px;
  padding: 1.25rem;
  margin-top: 1rem;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
  margin-bottom: 1rem;
}

.res-label {
  display: block;
  font-size: 0.78rem;
  color: #777;
  margin-bottom: 0.25rem;
}

.res-status-tag {
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #a5d6a7;
  padding: 0.25rem 0.65rem;
  border-radius: 4px;
  font-size: 0.88rem;
}

.res-amount strong {
  font-size: 1.15rem;
  color: #111;
}

.result-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.res-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.88rem;
  color: #555;
}

.res-row strong {
  color: #111;
}

.logout-wrap {
  text-align: center;
}

.logout-btn {
  background: none;
  border: 1px solid #ccc;
  color: #777;
  padding: 0.75rem 2rem;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.logout-btn:hover {
  border-color: #d32f2f;
  color: #d32f2f;
}

@media (max-width: 650px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
  .points-box {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  .points-val {
    border: none;
    padding: 0;
  }
}

:global([data-theme="dark"]) .profile-page {
  background: #111210 !important;
  color: #ffffff !important;
}

:global([data-theme="dark"]) .profile-card,
:global([data-theme="dark"]) .benefits-card,
:global([data-theme="dark"]) .tracker-card {
  background: #181916 !important;
  border-color: #272924 !important;
  color: #ffffff !important;
}

:global([data-theme="dark"]) .profile-card h3,
:global([data-theme="dark"]) .benefits-card h3,
:global([data-theme="dark"]) .tracker-card h3 {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .info-row span {
  color: #a1a1aa !important;
}

:global([data-theme="dark"]) .info-row strong {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .stat-box {
  background: #20221e !important;
  border-color: #383b33 !important;
}

:global([data-theme="dark"]) .stat-num {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .stat-lbl {
  color: #a1a1aa !important;
}

:global([data-theme="dark"]) .benefit-item {
  background: #20221e !important;
  border-color: #383b33 !important;
}

:global([data-theme="dark"]) .benefit-item strong {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .benefit-item small {
  color: #a1a1aa !important;
}

:global([data-theme="dark"]) .tracker-subtitle {
  color: #a1a1aa !important;
}

:global([data-theme="dark"]) .tracker-form input {
  background: #1f211d !important;
  border-color: #383b33 !important;
  color: #ffffff !important;
}

:global([data-theme="dark"]) .tracking-result-box {
  background: #1f211d !important;
  border-color: #383b33 !important;
}

:global([data-theme="dark"]) .res-amount strong {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .res-row span {
  color: #a1a1aa !important;
}

:global([data-theme="dark"]) .res-row strong {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .logout-btn {
  border-color: #52525b !important;
  color: #d4d4d8 !important;
}

:global([data-theme="dark"]) .logout-btn:hover {
  border-color: #ef4444 !important;
  color: #ef4444 !important;
}
</style>
