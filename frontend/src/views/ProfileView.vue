<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useFavoritesStore } from '../stores/favorites'
import { useCartStore } from '../stores/cart'
import { useUIStore } from '../stores/ui'
import { useLocaleStore } from '../stores/locale'
import { formatMoney } from '../utils/money'
import { useFreeShippingText } from '../utils/shipping'

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

const freeShippingText = useFreeShippingText()

// CUST-07: "2026-11-22 04:39:43" → "نوفمبر ٢٠٢٦" / "November 2026"
const memberSince = computed(() => {
  const raw = auth.user?.joinedDate
  const date = raw ? new Date(String(raw).replace(' ', 'T')) : null
  if (!date || Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(locale.isRTL ? 'ar-EG' : 'en-GB', { month: 'long', year: 'numeric' }).format(date)
})

// CUST-06: the customer's own orders (server-side, session-scoped).
type MyOrder = { id: string; created_at: string; status: string; total: number; items_count: number }
const myOrders = ref<MyOrder[]>([])
const ordersLoading = ref(true)
const ordersError = ref(false)
const statusLabels: Record<string, [string, string]> = {
  processing: ['قيد التجهيز', 'Processing'],
  shipped: ['تم الشحن', 'Shipped'],
  delivered: ['تم التوصيل', 'Delivered'],
  cancelled: ['ملغي', 'Cancelled'],
  returned: ['مرتجع', 'Returned'],
}
const statusLabel = (status: string) => (statusLabels[status] ?? [status, status])[locale.isRTL ? 0 : 1]
const orderDate = (value: string) => {
  const date = new Date(String(value).replace(' ', 'T'))
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(locale.isRTL ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

async function loadMyOrders() {
  ordersLoading.value = true
  ordersError.value = false
  try {
    const res = await fetch('/customer/orders', { credentials: 'include', headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(String(res.status))
    myOrders.value = (await res.json()).orders ?? []
  } catch {
    ordersError.value = true
  } finally {
    ordersLoading.value = false
  }
}

function trackOrder(id: string) {
  trackOrderId.value = id
  void handleTrackOrder()
}

onMounted(loadMyOrders)

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
      <!-- Account header. Points and tiers return here once a loyalty programme exists (CUST-03). -->
      <div class="club-card">
        <div class="club-badge-row">
          <span class="club-tag">{{ locale.isRTL ? 'حسابي' : 'My account' }}</span>
        </div>

        <h2>{{ locale.t('profile.welcome', { name: auth.user?.name ?? '' }) }}</h2>
        <p v-if="memberSince" class="member-since">{{ locale.t('profile.member_since', { date: memberSince }) }}</p>
      </div>

      <!-- Quick Action Cards Grid -->
      <div class="profile-grid">
        <div class="profile-card">
          <h3>{{ locale.t('profile.account_info') }}</h3>
          <div class="info-row">
            <span>{{ locale.t('profile.name') }}</span>
            <strong>{{ auth.user?.name }}</strong>
          </div>
          <div class="info-row">
            <span>{{ locale.t('profile.email') }}</span>
            <strong dir="ltr">{{ auth.user?.email }}</strong>
          </div>
          <div class="info-row">
            <span>{{ locale.t('profile.phone') }}</span>
            <strong dir="ltr">{{ auth.user?.phone }}</strong>
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

      <!-- My orders (CUST-06): read from /customer/orders, newest first -->
      <div class="benefits-card my-orders-card">
        <h3>{{ locale.isRTL ? 'طلباتي' : 'My orders' }}</h3>
        <p v-if="ordersLoading" class="orders-note">{{ locale.isRTL ? 'جاري تحميل طلباتك…' : 'Loading your orders…' }}</p>
        <p v-else-if="ordersError" class="orders-note">
          {{ locale.isRTL ? 'تعذّر تحميل الطلبات.' : 'Could not load your orders.' }}
          <button type="button" class="link-btn" @click="loadMyOrders">{{ locale.isRTL ? 'حاول مرة أخرى' : 'Try again' }}</button>
        </p>
        <p v-else-if="!myOrders.length" class="orders-note">
          {{ locale.isRTL ? 'لا توجد طلبات بعد.' : 'No orders yet.' }}
          <router-link to="/shop">{{ locale.isRTL ? 'ابدأ التسوق' : 'Start shopping' }}</router-link>
        </p>
        <ul v-else class="orders-list">
          <li v-for="order in myOrders" :key="order.id" class="order-row" data-test="my-order">
            <div>
              <strong>{{ orderDate(order.created_at) }}</strong>
              <small dir="ltr">#{{ order.id.slice(0, 8).toUpperCase() }} · {{ order.items_count }} {{ locale.isRTL ? 'قطعة' : 'items' }}</small>
            </div>
            <span class="order-status" :class="'status-' + order.status">{{ statusLabel(order.status) }}</span>
            <strong class="order-total">{{ formatMoney(order.total) }}</strong>
            <button type="button" class="link-btn" @click="trackOrder(order.id)">{{ locale.isRTL ? 'تتبع' : 'Track' }}</button>
          </li>
        </ul>
      </div>

      <!-- What every customer gets. Only services the store actually provides (CUST-02/04). -->
      <div class="benefits-card">
        <h3>{{ locale.isRTL ? 'مزايا التسوق معنا' : 'Shopping with us' }}</h3>
        <div class="benefits-list">
          <div v-if="freeShippingText" class="benefit-item">
            <span>🚚</span>
            <div>
              <strong>{{ locale.isRTL ? 'شحن مجاني' : 'Free shipping' }}</strong>
              <small>{{ freeShippingText }}</small>
            </div>
          </div>
          <div class="benefit-item">
            <span>💵</span>
            <div>
              <strong>{{ locale.isRTL ? 'الدفع عند الاستلام' : 'Cash on delivery' }}</strong>
              <small>{{ locale.isRTL ? 'ادفع نقداً عند وصول طلبك' : 'Pay in cash when your order arrives' }}</small>
            </div>
          </div>
          <div class="benefit-item">
            <span>📦</span>
            <div>
              <strong>{{ locale.isRTL ? 'تتبع طلباتك' : 'Order tracking' }}</strong>
              <small>{{ locale.isRTL ? 'كل طلباتك وحالتها في مكان واحد' : 'All your orders and their status in one place' }}</small>
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
.orders-note { color: #555; margin: 0; }
.orders-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.75rem; }
.order-row { display: grid; grid-template-columns: 1fr auto auto auto; align-items: center; gap: 1rem; padding: 0.9rem 1rem; border: 1px solid #e3e5df; border-radius: 6px; }
.order-row small { display: block; color: #555; margin-top: 0.2rem; }
.order-status { font-size: 0.8rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 999px; background: #eef0ea; color: #222; }
.order-status.status-delivered { background: #dff3e4; color: #14532d; }
.order-status.status-cancelled, .order-status.status-returned { background: #fde2e1; color: #7f1d1d; }
.link-btn { background: none; border: 0; padding: 0; color: #1d4ed8; text-decoration: underline; cursor: pointer; font: inherit; }
@media (max-width: 600px) { .order-row { grid-template-columns: 1fr auto; } }
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
