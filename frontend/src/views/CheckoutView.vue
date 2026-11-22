<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCatalogStore } from '../stores/catalog'
import { useCartStore } from '../stores/cart'
import { useUIStore } from '../stores/ui'
import { useLocaleStore } from '../stores/locale'
import { formatMoney } from '../utils/money'

const router = useRouter()
const auth = useAuthStore()
const catalog = useCatalogStore()
const cart = useCartStore()
const ui = useUIStore()
const locale = useLocaleStore()
const demo = import.meta.env.MODE === 'preview'

// Customer Delivery Form
const customer = ref({
  name: '',
  email: '',
  phone: '',
  governorate: 'Cairo',
  city: '',
  address: '',
  notes: '',
})

const GOVERNORATES = computed(() => {
  if (locale.isRTL) {
    return [
      'القاهرة', 'الجيزة', 'الإسكندرية', 'القليوبية', 'الشرقية', 'الدقهلية',
      'البحيرة', 'الغربية', 'المنوفية', 'دمياط', 'بورسعيد', 'الإسماعيلية',
      'السويس', 'كفر الشيخ', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط',
      'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر', 'مطروح',
    ]
  }
  return [
    'Cairo', 'Giza', 'Alexandria', 'Qalyubia', 'Sharqia', 'Dakahlia',
    'Beheira', 'Gharbia', 'Monufia', 'Damietta', 'Port Said', 'Ismailia',
    'Suez', 'Kafr El Sheikh', 'Fayoum', 'Beni Suef', 'Minya', 'Asyut',
    'Sohag', 'Qena', 'Luxor', 'Aswan', 'Red Sea', 'Matrouh',
  ]
})

// Shipping Options
const shippingMethod = ref<'standard' | 'express'>('standard')

// Payment Options
const paymentMethod = ref<'cod' | 'card' | 'instapay'>('cod')

// Promo Code
const promoCode = ref('')
const discountAmount = ref(0)
const promoError = ref('')
const promoApplied = ref(false)

// State
const submitting = ref(false)
const errorMessage = ref('')
let pending: { key: string; id: string } | undefined

const lines = computed(() => cart.getResolvedLines(catalog.products))
const subtotal = computed(() => cart.subtotal(catalog.products))

const quotedShipping = ref<number | null>(null)
const computedShippingFee = computed(() => !demo && quotedShipping.value !== null ? quotedShipping.value : demo && shippingMethod.value === 'express' ? 15000 : catalog.shipping)
const grandTotal = computed(() => subtotal.value + computedShippingFee.value - discountAmount.value)

async function refreshQuote(code = '') {
  if (demo || !cart.items.length) return
  const csrf = await auth.fetchCsrfToken()
  const response = await fetch('/checkout/quote', { method: 'POST', credentials: 'include', headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf }, body: JSON.stringify({ items: cart.items, discount_code: code }) })
  const result = await response.json()
  if (!response.ok) throw new Error(result.message || 'Unable to price order.')
  quotedShipping.value = result.shipping_fee
  discountAmount.value = result.discount
}
watch(() => JSON.stringify(cart.items), () => { promoApplied.value = false; discountAmount.value = 0; void refreshQuote().catch(() => { quotedShipping.value = null }) }, { immediate: true })
async function applyPromo() {
  if (!demo) {
    promoError.value = ''
    try { await refreshQuote(promoCode.value.trim().toUpperCase()); promoApplied.value = true }
    catch (err) { promoError.value = err instanceof Error ? err.message : 'Invalid code.' }
    return
  }
  promoError.value = ''
  const code = promoCode.value.trim().toUpperCase()
  if (code === 'ECOMARS10' || code === 'ADIDAS10') {
    discountAmount.value = Math.round(subtotal.value * 0.1)
    promoApplied.value = true
  } else if (code) {
    promoError.value = 'Invalid promo code.'
  }
}

function fillDemoData() {
  if (locale.isRTL) {
    customer.value = {
      name: 'عميل تجريبي',
      email: 'client@example.com',
      phone: '01000000000',
      governorate: 'القاهرة',
      city: 'المعادي',
      address: 'شارع ٩، عمارة ١٥، شقة ٤',
      notes: 'يرجى الاتصال قبل الوصول بنصف ساعة',
    }
  } else {
    customer.value = {
      name: 'Alex Morgan',
      email: 'alex.morgan@example.com',
      phone: '01012345678',
      governorate: 'Cairo',
      city: 'New Cairo',
      address: 'Street 90, Building 14, Apt 4',
      notes: 'Please call 30 mins before arrival',
    }
  }
}

async function handleOrder() {
  if (submitting.value || !cart.count) return
  submitting.value = true
  errorMessage.value = ''

  const fullAddress = `${customer.value.governorate} - ${customer.value.city} - ${customer.value.address} ${customer.value.notes ? `(ملاحظات: ${customer.value.notes})` : ''}`
  const payload = {
    name: customer.value.name,
    phone: customer.value.phone,
    address: fullAddress,
    items: cart.items,
    payment_method: 'cod',
    discount_code: promoApplied.value ? promoCode.value.trim().toUpperCase() : undefined,
  }

  const key = JSON.stringify(payload)
  if (!pending || pending.key !== key) {
    pending = { key, id: crypto.randomUUID() }
  }

  try {
    if (demo) {
      for (const line of lines.value) {
        line.variant.stock -= line.quantity
      }
      const receipt = {
        id: 'DEMO-' + pending.id.slice(0, 8).toUpperCase(),
        total: grandTotal.value,
      }
      sessionStorage.setItem('ecomars_last_receipt', JSON.stringify(receipt))
    } else {
      const csrf = await auth.fetchCsrfToken()
      const response = await fetch('/api/v1/orders', {
        credentials: 'include',
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': csrf,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ ...payload, request_id: pending.id }),
      })
      const data = await response.json()
      if (!response.ok) {
        if (response.status === 409) await catalog.load(true)
        throw new Error(
          response.status === 422
            ? 'راجع بيانات الطلب ورقم الموبايل.'
            : data.message || 'الطلب ما اتسجلش.'
        )
      }
      sessionStorage.setItem('ecomars_last_receipt', JSON.stringify(data))
      // Refresh catalog when the shopper returns; the receipt does not need it.
      catalog.invalidateFreshness()
    }

    cart.clear()
    pending = undefined
    ui.showToast('تم تسجيل طلبك بنجاح! جاري تحويلك إلى إيصال الطلب', 'success', '🎉')
    router.push('/receipt')
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'حصل خطأ، حاول تاني.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="checkout-layout-page" aria-labelledby="page-title">
    <div class="checkout-container">
      <!-- Empty Cart Guard -->
      <div v-if="!cart.count && !submitting" class="empty-checkout">
        <h2>{{ locale.t('checkout.empty_title') }}</h2>
        <p>{{ locale.t('checkout.empty_desc') }}</p>
        <router-link class="primary" to="/shop">{{ locale.t('checkout.back_to_shop') }}</router-link>
      </div>

      <div v-else class="checkout-grid">
        <!-- Main Form Area -->
        <div class="checkout-main">
          <div class="checkout-header">
            <h1 id="page-title">{{ locale.t('checkout.page_title') }}</h1>
            <p>{{ locale.t('checkout.subtitle') }}</p>
          </div>

          <button
            v-if="demo"
            type="button"
            class="demo-fill-btn"
            @click="fillDemoData"
          >
            {{ locale.t('checkout.demo_fill') }}
          </button>

          <form id="checkout-form" @submit.prevent="handleOrder">
            <!-- Step 1: Contact & Address -->
            <fieldset class="form-section">
              <legend class="section-legend">
                <span class="step-num">{{ locale.isRTL ? '١' : '1' }}</span> {{ locale.t('checkout.step_1') }}
              </legend>

              <div class="form-row two-cols">
                <label>
                  {{ locale.t('checkout.full_name') }}
                  <input
                    v-model.trim="customer.name"
                    required
                    maxlength="120"
                    :placeholder="locale.t('checkout.name_placeholder')"
                  />
                </label>

                <label>
                  {{ locale.t('checkout.phone') }}
                  <input
                    v-model.trim="customer.phone"
                    dir="ltr"
                    type="tel"
                    required
                    pattern="01[0125][0-9]{8}"
                    placeholder="01xxxxxxxxx"
                  />
                </label>
              </div>

              <div class="form-row">
                <label>
                  {{ locale.isRTL ? 'البريد الإلكتروني (لتأكيد الطلب وتتبع الشحنة)' : 'Email Address (For order tracking & receipt)' }}
                  <input
                    v-model.trim="customer.email"
                    type="email"
                    placeholder="your-email@example.com"
                  />
                </label>
              </div>

              <div class="form-row two-cols">
                <label>
                  {{ locale.t('checkout.governorate') }}
                  <select v-model="customer.governorate" required>
                    <option v-for="gov in GOVERNORATES" :key="gov" :value="gov">
                      {{ gov }}
                    </option>
                  </select>
                </label>

                <label>
                  {{ locale.t('checkout.city') }}
                  <input
                    v-model.trim="customer.city"
                    required
                    :placeholder="locale.t('checkout.city_placeholder')"
                  />
                </label>
              </div>

              <div class="form-row">
                <label>
                  {{ locale.t('checkout.address') }}
                  <input
                    v-model.trim="customer.address"
                    required
                    maxlength="250"
                    :placeholder="locale.t('checkout.address_placeholder')"
                  />
                </label>
              </div>

              <div class="form-row">
                <label>
                  {{ locale.t('checkout.notes') }}
                  <input
                    v-model.trim="customer.notes"
                    :placeholder="locale.t('checkout.notes_placeholder')"
                  />
                </label>
              </div>
            </fieldset>

            <!-- Step 2: Shipping Method -->
            <fieldset class="form-section">
              <legend class="section-legend">
                <span class="step-num">{{ locale.isRTL ? '٢' : '2' }}</span> {{ locale.t('checkout.step_2') }}
              </legend>

              <div class="choice-cards">
                <label
                  class="choice-card"
                  :class="{ selected: shippingMethod === 'standard' }"
                >
                  <input
                    v-model="shippingMethod"
                    type="radio"
                    value="standard"
                  />
                  <div class="choice-content">
                    <div class="choice-title">
                      <strong>{{ locale.t('checkout.shipping_std') }}</strong>
                      <span class="price-tag">
                        {{ formatMoney(catalog.shipping) }}
                      </span>
                    </div>
                    <small>{{ locale.t('checkout.shipping_std_desc') }}</small>
                  </div>
                </label>

                <label
                  v-if="demo"
                  class="choice-card"
                  :class="{ selected: shippingMethod === 'express' }"
                >
                  <input
                    v-model="shippingMethod"
                    type="radio"
                    value="express"
                  />
                  <div class="choice-content">
                    <div class="choice-title">
                      <strong>{{ locale.t('checkout.shipping_exp') }}</strong>
                      <span class="price-tag">{{ formatMoney(15000) }}</span>
                    </div>
                    <small>{{ locale.t('checkout.shipping_exp_desc') }}</small>
                  </div>
                </label>
              </div>
            </fieldset>

            <!-- Step 3: Payment Method -->
            <fieldset class="form-section">
              <legend class="section-legend">
                <span class="step-num">{{ locale.isRTL ? '٣' : '3' }}</span> {{ locale.t('checkout.step_3') }}
              </legend>

              <div class="choice-cards">
                <label
                  class="choice-card"
                  :class="{ selected: paymentMethod === 'cod' }"
                >
                  <input
                    v-model="paymentMethod"
                    type="radio"
                    value="cod"
                  />
                  <div class="choice-content">
                    <div class="choice-title">
                      <div class="method-header">
                        <span class="method-icon">💵</span>
                        <strong>{{ locale.t('checkout.cod') }}</strong>
                      </div>
                      <span class="method-badge popular">{{ locale.t('checkout.popular') }}</span>
                    </div>
                    <small>{{ locale.t('checkout.cod_desc') }}</small>
                  </div>
                </label>

                <label
                  v-if="demo"
                  class="choice-card"
                  :class="{ selected: paymentMethod === 'card' }"
                >
                  <input
                    v-model="paymentMethod"
                    type="radio"
                    value="card"
                  />
                  <div class="choice-content">
                    <div class="choice-title">
                      <div class="method-header">
                        <span class="method-icon">💳</span>
                        <strong>{{ locale.t('checkout.card') }}</strong>
                      </div>
                      <span class="method-badge secure">{{ locale.t('checkout.secure') }}</span>
                    </div>
                    <small>{{ locale.t('checkout.card_desc') }}</small>
                    <div v-if="paymentMethod === 'card'" class="payment-extra-hint">
                      <span class="card-pills">
                        <span class="pill-badge">VISA</span>
                        <span class="pill-badge">Mastercard</span>
                        <span class="pill-badge">Meeza ميزة</span>
                      </span>
                    </div>
                  </div>
                </label>

                <label
                  v-if="demo"
                  class="choice-card"
                  :class="{ selected: paymentMethod === 'instapay' }"
                >
                  <input
                    v-model="paymentMethod"
                    type="radio"
                    value="instapay"
                  />
                  <div class="choice-content">
                    <div class="choice-title">
                      <div class="method-header">
                        <span class="method-icon">⚡</span>
                        <strong>{{ locale.t('checkout.instapay') }}</strong>
                      </div>
                      <span class="method-badge instant">{{ locale.t('checkout.instant') }}</span>
                    </div>
                    <small>{{ locale.t('checkout.instapay_desc') }}</small>
                    <div v-if="paymentMethod === 'instapay'" class="payment-extra-hint">
                      <small class="instapay-note">
                        {{ locale.isRTL ? 'عنوان الدفع عبر InstaPay:' : 'InstaPay Payment Address:' }} <strong>ecomars@instapay</strong>
                      </small>
                    </div>
                  </div>
                </label>
              </div>
            </fieldset>

            <!-- Error Notification -->
            <div v-if="errorMessage" class="error-alert" role="alert">
              {{ errorMessage }}
            </div>

            <!-- Trust Guarantee Bar -->
            <div class="checkout-guarantee-bar">
              <div class="guarantee-pill">
                <span class="g-icon">🔒</span>
                <span>{{ locale.t('checkout.guarantee_secure') }}</span>
              </div>
              <div class="guarantee-pill">
                <span class="g-icon">🔄</span>
                <span>{{ locale.t('checkout.guarantee_returns') }}</span>
              </div>
              <div class="guarantee-pill">
                <span class="g-icon">🚚</span>
                <span>{{ locale.t('checkout.guarantee_inspect') }}</span>
              </div>
            </div>

            <!-- Submit Button (Mobile view also has this) -->
            <button
              class="primary wide submit-order-btn"
              type="submit"
              :disabled="submitting"
            >
              {{ submitting ? locale.t('checkout.submitting') : locale.t('checkout.confirm_with_total', { total: formatMoney(grandTotal) }) }}
            </button>
          </form>
        </div>

        <!-- Sticky Sidebar: Order Summary -->
        <aside class="checkout-sidebar">
          <div class="sidebar-card">
            <h3>{{ locale.t('checkout.order_summary') }} ({{ cart.count }} {{ locale.isRTL ? 'قطع' : 'items' }})</h3>

            <!-- Itemized List -->
            <div class="order-summary-items">
              <div
                v-for="line in lines"
                :key="line.sku"
                class="summary-item"
              >
                <div class="summary-thumb">
                  <img
                    v-if="line.product.images?.length"
                    :src="line.product.images[0]"
                    :alt="locale.getProductName(line.product)"
                  />
                  <span
                    v-else-if="line.product.image"
                    :class="['photo', line.product.image]"
                  ></span>
                  <span class="qty-badge">{{ line.quantity }}</span>
                </div>
                <div class="summary-meta">
                  <h6>{{ locale.getProductName(line.product) }}</h6>
                  <small>{{ line.variant.color }} · {{ locale.t('checkout.size_lbl') }} {{ line.variant.size }}</small>
                </div>
                <strong class="summary-price">
                  {{ formatMoney(line.product.price * line.quantity) }}
                </strong>
              </div>
            </div>

            <!-- Promo Code Form -->
            <div class="promo-box">
              <div class="promo-input-row">
                <input
                  v-model="promoCode"
                  :placeholder="locale.t('checkout.promo_placeholder')"
                  :disabled="promoApplied"
                />
                <button
                  type="button"
                  :disabled="promoApplied || !promoCode.trim()"
                  @click="applyPromo"
                >
                  {{ promoApplied ? locale.t('checkout.code_applied') : locale.t('checkout.apply_code') }}
                </button>
              </div>
              <p v-if="promoApplied" class="promo-success">
                {{ locale.t('checkout.code_success') }}
              </p>
              <p v-if="promoError" class="promo-err">
                {{ promoError }}
              </p>
            </div>

            <!-- Totals Breakdown -->
            <div class="totals-breakdown">
              <div class="total-row">
                <span>{{ locale.t('checkout.subtotal') }}</span>
                <span>{{ formatMoney(subtotal) }}</span>
              </div>
              <div class="total-row">
                <span>{{ locale.t('checkout.shipping_fee') }}</span>
                <span>{{ computedShippingFee === 0 ? locale.t('checkout.free') : formatMoney(computedShippingFee) }}</span>
              </div>
              <div v-if="discountAmount > 0" class="total-row discount-row">
                <span>{{ locale.t('checkout.applied_discount') }}</span>
                <span>- {{ formatMoney(discountAmount) }}</span>
              </div>
              <div class="total-row grand-total-row">
                <strong>{{ locale.t('checkout.grand_total') }}</strong>
                <strong>{{ formatMoney(grandTotal) }}</strong>
              </div>
            </div>

            <!-- Security Assurance -->
            <div class="security-assurance">
              <span>🔒</span>
              <p>{{ locale.t('checkout.security_note') }}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </section>
</template>

<style scoped>
.checkout-layout-page {
  background: #f8f9f6;
  min-height: 85vh;
  padding: 2.5rem clamp(1rem, 5vw, 5rem);
}

.checkout-container {
  max-width: 1360px;
  margin: 0 auto;
}

.empty-checkout {
  text-align: center;
  padding: 4rem 1rem;
  background: #fff;
  border-radius: 8px;
}

.checkout-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(320px, 1fr);
  gap: 2.5rem;
  align-items: flex-start;
}

.checkout-header {
  margin-bottom: 2rem;
}

.checkout-header h1 {
  margin: 0 0 0.5rem;
  font-size: clamp(1.8rem, 3.5vw, 2.5rem);
}

.checkout-header p {
  color: #666;
  margin: 0;
}

.demo-fill-btn {
  background: #f2f5ea;
  border: 1px dashed #7a8f3b;
  color: #435417;
  padding: 0.65rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  border-radius: 6px;
  margin-bottom: 1.5rem;
}

/* Form Styles */
.form-section {
  background: #fff;
  border: 1px solid #e1e3dd;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.section-legend {
  font-size: 1.15rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0 0.5rem;
}

.step-num {
  display: grid;
  place-items: center;
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 50%;
  background: #111;
  color: #fff;
  font-size: 0.85rem;
}

.form-row {
  margin-bottom: 1rem;
}

.form-row.two-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-section label {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.88rem;
  font-weight: 600;
  color: #222;
}

.form-section input,
.form-section select {
  padding: 0.8rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  font-size: 0.95rem;
}

.form-section input:focus,
.form-section select:focus {
  outline: 2px solid #111;
  border-color: #111;
}

/* Choice Cards */
.choice-cards {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.choice-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.choice-card:hover {
  border-color: #999;
}

.choice-card.selected {
  border-color: #111;
  background: #fbfbf9;
  box-shadow: inset 0 0 0 1px #111;
}

.choice-card input[type='radio'] {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: #111;
}

.choice-content {
  flex: 1;
}

.choice-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.2rem;
}

.price-tag {
  font-weight: 700;
  color: #111;
}

.choice-content small {
  color: #666;
  font-size: 0.82rem;
}

.method-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.method-icon {
  font-size: 1.15rem;
}

.method-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  letter-spacing: 0.02em;
}

.method-badge.popular {
  background: #eef2e6;
  color: #3b5723;
  border: 1px solid #c9d8b8;
}

.method-badge.secure {
  background: #e8f4fd;
  color: #0b6399;
  border: 1px solid #bce1f8;
}

.method-badge.instant {
  background: #fff8e1;
  color: #8c6b00;
  border: 1px solid #ffe082;
}

.payment-extra-hint {
  margin-top: 0.6rem;
  padding-top: 0.6rem;
  border-top: 1px dashed #e5e5e0;
}

.card-pills {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.pill-badge {
  background: #fff;
  border: 1px solid #dcdfd8;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  color: #333;
}

.instapay-note {
  display: inline-block;
  background: #fdfae8;
  padding: 0.35rem 0.65rem;
  border-radius: 4px;
  color: #5a4b10;
  font-size: 0.8rem;
  border: 1px solid #fae8a4;
}

.checkout-guarantee-bar {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  margin: 1.25rem 0 0.5rem;
  padding: 0.85rem 1rem;
  background: #f1f3ed;
  border-radius: 6px;
  flex-wrap: wrap;
}

.guarantee-pill {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #444;
}

.guarantee-pill .g-icon {
  font-size: 0.95rem;
}

.submit-order-btn {
  min-height: 3.5rem;
  font-size: 1.1rem;
  letter-spacing: 0.02em;
  margin-top: 1rem;
}

.error-alert {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
  padding: 1rem;
  border-radius: 6px;
  margin: 1rem 0;
  font-weight: 600;
}

/* Sidebar Order Summary */
.checkout-sidebar {
  position: sticky;
  top: 6rem;
}

.sidebar-card {
  background: #fff;
  border: 1px solid #e1e3dd;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
}

.sidebar-card h3 {
  margin: 0 0 1.25rem;
  font-size: 1.15rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.75rem;
}

.order-summary-items {
  max-height: 280px;
  overflow-y: auto;
  border-bottom: 1px solid #eee;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 0.85rem;
}

.summary-thumb {
  position: relative;
  width: 52px;
  height: 52px;
  background: #f4f4f4;
  flex-shrink: 0;
  border-radius: 4px;
  overflow: visible;
}

.summary-thumb img,
.summary-thumb .photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.qty-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #111;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
}

.summary-meta {
  flex: 1;
}

.summary-meta h6 {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.3;
}

.summary-meta small {
  color: #666;
  font-size: 0.78rem;
}

.summary-price {
  font-size: 0.92rem;
}

/* Promo Box */
.promo-box {
  margin-bottom: 1.25rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 1.25rem;
}

.promo-input-row {
  display: flex;
  gap: 0.4rem;
}

.promo-input-row input {
  flex: 1;
  padding: 0.65rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.85rem;
}

.promo-input-row button {
  background: #111;
  color: #fff;
  border: none;
  padding: 0 1rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}

.promo-success {
  margin: 0.4rem 0 0;
  color: #2e7d32;
  font-size: 0.82rem;
  font-weight: 600;
}

.promo-err {
  margin: 0.4rem 0 0;
  color: #c62828;
  font-size: 0.82rem;
}

/* Totals */
.totals-breakdown {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  font-size: 0.95rem;
}

.total-row {
  display: flex;
  justify-content: space-between;
}

.discount-row {
  color: #2e7d32;
  font-weight: 600;
}

.grand-total-row {
  border-top: 1px solid #eee;
  padding-top: 0.85rem;
  margin-top: 0.35rem;
  font-size: 1.25rem;
}

.security-assurance {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: #fbfbf9;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 0.75rem;
  margin-top: 1.25rem;
}

.security-assurance span {
  font-size: 1.25rem;
}

.security-assurance p {
  margin: 0;
  font-size: 0.78rem;
  color: #555;
  line-height: 1.4;
}

@media (max-width: 900px) {
  .checkout-grid {
    grid-template-columns: 1fr;
  }
  .checkout-sidebar {
    position: static;
  }
}

@media (max-width: 550px) {
  .form-row.two-cols {
    grid-template-columns: 1fr;
  }
}

:global([data-theme="dark"]) .checkout-layout-page {
  background: #111210 !important;
  color: #ffffff !important;
}

:global([data-theme="dark"]) .checkout-header h1 {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .checkout-header p {
  color: #a1a1aa !important;
}

:global([data-theme="dark"]) .form-section {
  background: #181916 !important;
  border-color: #272924 !important;
  color: #ffffff !important;
}

:global([data-theme="dark"]) .section-legend {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .step-num {
  background: var(--lime) !important;
  color: #000000 !important;
}

:global([data-theme="dark"]) .form-row label {
  color: #e4e4e7 !important;
}

:global([data-theme="dark"]) .form-row input,
:global([data-theme="dark"]) .form-row select {
  background: #1f211d !important;
  border-color: #383b33 !important;
  color: #ffffff !important;
}

:global([data-theme="dark"]) .choice-card {
  background: #181916 !important;
  border-color: #2c2f28 !important;
  color: #ffffff !important;
}

:global([data-theme="dark"]) .choice-card.selected {
  background: #20231e !important;
  border-color: var(--lime) !important;
}

:global([data-theme="dark"]) .choice-title strong {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .choice-content small {
  color: #a1a1aa !important;
}

:global([data-theme="dark"]) .price-tag {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .sidebar-card {
  background: #181916 !important;
  border-color: #272924 !important;
  color: #ffffff !important;
}

:global([data-theme="dark"]) .sidebar-card h3 {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .summary-meta h6 {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .summary-meta small {
  color: #a1a1aa !important;
}

:global([data-theme="dark"]) .summary-price {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .promo-box {
  border-color: #272924 !important;
}

:global([data-theme="dark"]) .promo-input-row input {
  background: #1f211d !important;
  border-color: #383b33 !important;
  color: #ffffff !important;
}

:global([data-theme="dark"]) .total-row {
  color: #e4e4e7 !important;
}

:global([data-theme="dark"]) .grand-total-row {
  border-color: #272924 !important;
  color: #ffffff !important;
}

:global([data-theme="dark"]) .guarantee-pill {
  background: #1f211d !important;
  border-color: #383b33 !important;
  color: #ffffff !important;
}

:global([data-theme="dark"]) .security-assurance {
  background: #1f211d !important;
  border-color: #272924 !important;
}

:global([data-theme="dark"]) .security-assurance p {
  color: #d4d4d8 !important;
}
</style>
