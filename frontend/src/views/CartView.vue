<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCatalogStore } from '../stores/catalog'
import { useCartStore } from '../stores/cart'
import { useLocaleStore } from '../stores/locale'
import { formatMoney } from '../utils/money'
import { useFreeShippingText } from '../utils/shipping'
import { getColorHex } from '../utils/colors'
import type { CartItemResolved } from '../types'

const router = useRouter()
const catalog = useCatalogStore()
const cart = useCartStore()
const locale = useLocaleStore()
const freeShippingText = useFreeShippingText()

// The store's real free-shipping threshold (0 = no offer), so the cart meter
// cannot promise something checkout will not honour (CUST-10).
const FREE_SHIPPING_THRESHOLD = computed(() => Number(catalog.shippingSettings?.free_threshold || 0))

const lines = computed(() => cart.getResolvedLines(catalog.products))
const unavailableItems = computed(() => cart.items.filter((item) => !lines.value.some((line) => line.sku === item.sku)))
const subtotal = computed(() => cart.subtotal(catalog.products))

const isFreeShipping = computed(() => FREE_SHIPPING_THRESHOLD.value > 0 && subtotal.value >= FREE_SHIPPING_THRESHOLD.value)
const freeShippingRemaining = computed(() => Math.max(0, FREE_SHIPPING_THRESHOLD.value - subtotal.value))
const freeShippingProgress = computed(() =>
  FREE_SHIPPING_THRESHOLD.value > 0 ? Math.min(100, Math.round((subtotal.value / FREE_SHIPPING_THRESHOLD.value) * 100)) : 100
)

const shippingFee = computed(() => (isFreeShipping.value ? 0 : catalog.shipping))
const estimatedTotal = computed(() => subtotal.value + shippingFee.value)
const hasOverstockLine = computed(() =>
  lines.value.some((line) => line.quantity > line.variant.stock)
)

function adjustQty(sku: string, delta: number, stock: number) {
  cart.adjust(sku, delta, stock)
}

function proceedToCheckout() {
  if (cart.count > 0 && !hasOverstockLine.value && !unavailableItems.value.length) {
    router.push('/checkout')
  }
}

function getItemImage(line: CartItemResolved): string {
  if (line.product.colorOptions?.length) {
    const match = line.product.colorOptions.find((c) => c.name === line.variant.color)
    if (match?.images?.length) return match.images[0]
  }
  if (line.product.images?.length) {
    return line.product.images[0]
  }
  return ''
}
</script>

<template>
  <section class="cart-page" aria-labelledby="page-title">
    <div class="cart-container">
      <!-- Breadcrumb / Back Link -->
      <nav class="cart-nav" :aria-label="locale.isRTL ? 'مسار التنقل' : 'Breadcrumb'">
        <router-link class="back-link" to="/shop">
          <span class="back-arrow" aria-hidden="true">←</span>
          <span>{{ locale.t('cart.back_to_shop') }}</span>
        </router-link>
      </nav>

      <!-- Empty Cart State -->
      <div v-if="!cart.count" class="empty-cart-state" data-testid="empty-cart">
        <div class="empty-icon-bubble" aria-hidden="true">
          <span class="empty-icon">🛒</span>
        </div>
        <h1 id="page-title" class="empty-title">{{ locale.t('cart.empty_title') }}</h1>
        <p class="empty-desc">
          {{ locale.t('cart.empty_desc') }}
        </p>
        <div class="empty-actions">
          <router-link to="/shop" class="primary-btn cta-shop-btn">
            {{ locale.t('cart.start_shopping') }}
          </router-link>
        </div>

        <!-- Empty State Highlights / Value Props -->
        <div class="empty-features">
          <div class="feature-item">
            <span class="feature-icon" aria-hidden="true">🚚</span>
            <div class="feature-text">
              <strong>{{ locale.t('cart.feature_free_shipping') }}</strong>
              <span>{{ freeShippingText || locale.t('cart.feature_free_shipping_sub') }}</span>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon" aria-hidden="true">🔄</span>
            <div class="feature-text">
              <strong>{{ locale.t('cart.feature_free_returns') }}</strong>
              <span>{{ locale.t('cart.feature_free_returns_sub') }}</span>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon" aria-hidden="true">🔒</span>
            <div class="feature-text">
              <strong>{{ locale.t('cart.feature_secure_pay') }}</strong>
              <span>{{ locale.t('cart.feature_secure_pay_sub') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Populated Cart State -->
      <div v-else class="cart-layout-wrap">
        <!-- Main Header -->
        <header class="cart-header">
          <div class="title-group">
            <h1 id="page-title" class="main-title">{{ locale.t('cart.title') }}</h1>
            <span class="item-count-badge">({{ cart.count }} {{ cart.count === 1 ? locale.t('cart.unit_item') : locale.t('cart.unit_items') }})</span>
          </div>
          <button
            type="button"
            class="clear-cart-link"
            @click="cart.clear()"
            :title="locale.t('cart.clear_bag')"
          >
            {{ locale.t('cart.clear_bag') }}
          </button>
        </header>

        <div v-if="unavailableItems.length" class="summary-alert" role="alert">Some saved items are no longer available. Remove them to continue. <button v-for="item in unavailableItems" :key="item.sku" type="button" @click="cart.remove(item.sku)">Remove {{ item.sku }}</button></div>

        <!-- Two-column Responsive Grid -->
        <div class="cart-grid">
          <!-- Column 1: Items List -->
          <div class="cart-items-column">
            <!-- Free Shipping Progress Tracker -->
            <div class="shipping-progress-banner">
              <div class="shipping-msg">
                <span class="truck-icon" aria-hidden="true">🚚</span>
                <p v-if="freeShippingRemaining > 0">
                  {{ locale.t('cart.free_shipping_left', { amount: formatMoney(freeShippingRemaining) }) }}
                </p>
                <p v-else class="free-congrats">
                  {{ locale.t('cart.free_shipping_unlocked') }}
                </p>
              </div>
              <div
                class="meter-track"
                role="progressbar"
                :aria-valuenow="freeShippingProgress"
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <div
                  class="meter-fill"
                  :style="{ width: `${freeShippingProgress}%` }"
                  :class="{ full: isFreeShipping }"
                ></div>
              </div>
            </div>

            <!-- Items List -->
            <ul class="cart-lines-list" role="list">
              <li
                v-for="line in lines"
                :key="line.sku"
                class="cart-line-card"
                :class="{ 'stock-alert-active': line.quantity > line.variant.stock }"
              >
                <!-- Thumbnail -->
                <div class="line-thumb-area">
                  <router-link :to="`/product/${line.product.id}`" class="thumb-link" tabindex="-1" aria-hidden="true">
                    <img
                      v-if="getItemImage(line)"
                      :src="getItemImage(line)"
                      :alt="locale.getProductName(line.product)"
                      class="thumb-img"
                      loading="lazy"
                    />
                    <span
                      v-else-if="line.product.image"
                      :class="['photo', 'thumb-photo', line.product.image]"
                    ></span>
                    <span v-else class="thumb-fallback">👕</span>
                  </router-link>
                </div>

                <!-- Product Content -->
                <div class="line-content">
                  <!-- Header: Name + Line Total -->
                  <div class="line-top">
                    <div class="line-details">
                      <span v-if="line.product.label" class="line-category-label">
                        {{ line.product.label }}
                      </span>
                      <h2 class="line-name">
                        <router-link :to="`/product/${line.product.id}`">
                          {{ locale.getProductName(line.product) }}
                        </router-link>
                      </h2>
                    </div>

                    <div class="line-total-price">
                      <strong>{{ formatMoney(line.product.price * line.quantity) }}</strong>
                    </div>
                  </div>

                  <!-- Variant Attributes -->
                  <div class="line-specs">
                    <span class="spec-pill color-pill">
                      <span
                        class="color-dot"
                        :style="{ backgroundColor: getColorHex(line.variant.color, line.product.colorOptions) }"
                        aria-hidden="true"
                      ></span>
                      <span>{{ line.variant.color }}</span>
                    </span>

                    <span class="spec-pill">
                      <span class="spec-label">{{ locale.t('cart.size_label') }}</span>
                      <bdi class="spec-val">{{ line.variant.size }}</bdi>
                    </span>

                    <span class="spec-pill">
                      <span class="spec-label">{{ locale.t('cart.unit_price') }}</span>
                      <span class="spec-val">{{ formatMoney(line.product.price) }}</span>
                    </span>
                  </div>

                  <!-- Stock warning if exceeded -->
                  <div
                    v-if="line.quantity > line.variant.stock"
                    class="line-stock-warning"
                    role="alert"
                  >
                    <span class="warning-icon" aria-hidden="true">⚠️</span>
                    <span>{{ locale.t('cart.stock_exceeded', { count: String(line.variant.stock) }) }}</span>
                  </div>
                  <div
                    v-else-if="line.variant.stock <= 3 && line.variant.stock > 0"
                    class="line-stock-low"
                  >
                    <span>{{ locale.t('cart.low_stock', { count: String(line.variant.stock) }) }}</span>
                  </div>

                  <!-- Bottom: Stepper + Remove -->
                  <div class="line-bottom">
                    <div class="qty-stepper-wrap">
                      <button
                        type="button"
                        class="stepper-btn"
                        aria-label="Decrease quantity"
                        @click="adjustQty(line.sku, -1, line.variant.stock)"
                      >
                        −
                      </button>
                      <span class="stepper-count" :aria-label="`الكمية: ${line.quantity}`">
                        {{ line.quantity }}
                      </span>
                      <button
                        type="button"
                        class="stepper-btn"
                        aria-label="Increase quantity"
                        :disabled="cart.remainingStock(line.variant) <= 0"
                        @click="adjustQty(line.sku, 1, line.variant.stock)"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      class="remove-btn"
                      :aria-label="`إزالة ${line.product.name} من السلة`"
                      @click="cart.remove(line.sku)"
                    >
                      <span class="remove-icon" aria-hidden="true">✕</span>
                      <span>إزالة</span>
                    </button>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <!-- Column 2: Mini Order Summary Card -->
          <aside class="cart-summary-column" aria-label="ملخص الطلب">
            <div class="order-summary-card">
              <h2 class="summary-heading">ملخص الطلب</h2>

              <dl class="summary-list">
                <div class="summary-item">
                  <dt>المجموع الفرعي ({{ cart.count }} {{ cart.count === 1 ? 'قطعة' : 'قطع' }})</dt>
                  <dd class="summary-val">{{ formatMoney(subtotal) }}</dd>
                </div>

                <div class="summary-item">
                  <dt>الشحن التقديري</dt>
                  <dd class="summary-val">
                    <span v-if="isFreeShipping" class="free-badge">مجاني</span>
                    <span v-else>{{ formatMoney(shippingFee) }}</span>
                  </dd>
                </div>

                <div v-if="!isFreeShipping" class="shipping-hint-box">
                  <span>أضف منتجات بقيمة <strong>{{ formatMoney(freeShippingRemaining) }}</strong> للشحن المجاني.</span>
                </div>

                <div class="summary-divider"></div>

                <div class="summary-item total-item">
                  <dt>
                    <span class="total-label">المجموع الكلي التقديري</span>
                    <span class="vat-subtext">شامل ضريبة القيمة المضافة</span>
                  </dt>
                  <dd class="total-val">{{ formatMoney(estimatedTotal) }}</dd>
                </div>
              </dl>

              <div v-if="hasOverstockLine" class="summary-alert" role="alert">
                ⚠️ يرجى تصحيح الكميات التي تتجاوز المخزون قبل المتابعة لإتمام الطلب.
              </div>

              <!-- Main CTA -->
              <div class="summary-actions">
                <button
                  type="button"
                  class="primary-btn checkout-btn"
                  :disabled="hasOverstockLine || unavailableItems.length > 0 || cart.count === 0"
                  @click="proceedToCheckout"
                >
                  المتابعة لإتمام الطلب
                </button>

                <router-link to="/shop" class="secondary-link">
                  متابعة التسوق
                </router-link>
              </div>

              <!-- Trust / Security guarantees -->
              <div class="summary-trust-perks">
                <div class="trust-perk">
                  <span class="trust-icon" aria-hidden="true">🔒</span>
                  <span>دفع آمن ومشفر بنسبة ١٠٠٪</span>
                </div>
                <div class="trust-perk">
                  <span class="trust-icon" aria-hidden="true">⚡</span>
                  <span>توصيل سريع وتتبع فوري للشحنة</span>
                </div>
                <div class="trust-perk">
                  <span class="trust-icon" aria-hidden="true">↩️</span>
                  <span>إرجاع واستبدال مجاني خلال ١٤ يوم</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cart-page {
  width: 100%;
  min-height: 65vh;
  padding: 1.5rem clamp(1rem, 4vw, 3.5rem) 4rem;
  background-color: var(--paper, #fafaf8);
  color: var(--ink, #111210);
  box-sizing: border-box;
}

.cart-container {
  max-width: 1200px;
  margin: 0 auto;
}

/* Navigation & Back Link */
.cart-nav {
  margin-bottom: 1.5rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: #555;
  text-decoration: none;
  transition: color 0.15s ease;
}

.back-link:hover {
  color: #000;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.back-arrow {
  font-size: 1rem;
}

/* Empty Cart State */
.empty-cart-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3.5rem 1.5rem;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  margin-block: 1.5rem 3rem;
}

.empty-icon-bubble {
  display: grid;
  place-items: center;
  width: 96px;
  height: 96px;
  background: #f4f5f0;
  border-radius: 50%;
  margin-bottom: 1.5rem;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.04);
}

.empty-icon {
  font-size: 3.25rem;
  line-height: 1;
}

.empty-title {
  margin: 0 0 0.75rem;
  font-size: clamp(1.6rem, 3.5vw, 2.2rem);
  font-weight: 700;
  color: #111;
  letter-spacing: -0.02em;
}

.empty-desc {
  max-width: 480px;
  margin: 0 0 2rem;
  font-size: 1rem;
  line-height: 1.6;
  color: #666;
}

.empty-actions {
  margin-bottom: 3rem;
}

.primary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--lime, #d5fb52);
  color: #111210;
  font-weight: 700;
  font-size: 1rem;
  padding: 0.9rem 2.2rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  transition: background-color 0.15s ease, transform 0.1s ease;
}

.primary-btn:hover:not(:disabled) {
  background: #c3ea3e;
  transform: translateY(-1px);
}

.primary-btn:active:not(:disabled) {
  transform: translateY(0);
}

.primary-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}

.cta-shop-btn {
  min-width: 200px;
  min-height: 3rem;
}

/* Empty perks */
.empty-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  width: 100%;
  max-width: 820px;
  padding-top: 2rem;
  border-top: 1px solid #f0f0ed;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  text-align: start;
  padding: 0.75rem 1rem;
  background: #fafaf8;
  border-radius: 8px;
}

.feature-icon {
  font-size: 1.6rem;
  flex-shrink: 0;
}

.feature-text {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.feature-text strong {
  font-size: 0.92rem;
  color: #111;
}

.feature-text span {
  font-size: 0.8rem;
  color: #666;
}

/* Populated Cart Layout */
.cart-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.title-group {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
}

.main-title {
  margin: 0;
  font-size: clamp(1.75rem, 3.5vw, 2.4rem);
  font-weight: 800;
  letter-spacing: -0.03em;
}

.item-count-badge {
  font-size: 1rem;
  color: #666;
  font-weight: 500;
}

.clear-cart-link {
  background: none;
  border: none;
  color: #777;
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0.3rem 0.5rem;
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 0.15s ease;
}

.clear-cart-link:hover {
  color: #b32626;
}

/* Grid layout */
.cart-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 2rem;
  align-items: start;
}

/* Shipping banner */
.shipping-progress-banner {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
}

.shipping-msg {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.6rem;
}

.truck-icon {
  font-size: 1.2rem;
}

.shipping-msg p {
  margin: 0;
  font-size: 0.88rem;
  color: #333;
}

.shipping-msg p.free-congrats {
  color: #1b6826;
  font-weight: 600;
}

.meter-track {
  height: 6px;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
}

.meter-fill {
  height: 100%;
  background: #111210;
  transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.meter-fill.full {
  background: #2e7d32;
}

/* Cart line card */
.cart-lines-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cart-line-card {
  display: flex;
  gap: 1.25rem;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1.25rem;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.cart-line-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.cart-line-card.stock-alert-active {
  border-color: #fca5a5;
  background: #fffafa;
}

.line-thumb-area {
  width: 96px;
  height: 96px;
  background: #f4f4f4;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid #f0f0f0;
}

.thumb-link {
  display: block;
  width: 100%;
  height: 100%;
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.thumb-photo {
  width: 100%;
  height: 100%;
  display: block;
}

.thumb-fallback {
  display: grid;
  place-items: center;
  height: 100%;
  font-size: 2.2rem;
}

.line-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
}

.line-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.line-details {
  min-width: 0;
}

.line-category-label {
  display: block;
  font-size: 0.75rem;
  color: #71717a;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.2rem;
}

.line-name {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.35;
}

.line-name a {
  color: inherit;
  text-decoration: none;
  transition: color 0.15s ease;
}

.line-name a:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.line-total-price {
  font-size: 1.15rem;
  font-weight: 700;
  white-space: nowrap;
  color: #111;
}

/* Line specs */
.line-specs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.spec-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: #555;
  background: #f4f5f1;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
}

.color-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.2);
}

.spec-label {
  color: #777;
}

.spec-val {
  font-weight: 600;
  color: #222;
}

/* Warnings */
.line-stock-warning {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  color: #b32626;
  background: #fee2e2;
  padding: 0.4rem 0.7rem;
  border-radius: 4px;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.line-stock-low {
  font-size: 0.8rem;
  color: #b45309;
  margin-bottom: 0.6rem;
  font-weight: 500;
}

/* Line bottom */
.line-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-top: auto;
  padding-top: 0.5rem;
}

/* Stepper */
.qty-stepper-wrap {
  display: inline-flex;
  align-items: center;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #ffffff;
  overflow: hidden;
}

.stepper-btn {
  background: none;
  border: none;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  color: #111;
  transition: background-color 0.12s ease;
}

.stepper-btn:hover:not(:disabled) {
  background-color: #f3f4f6;
}

.stepper-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.stepper-count {
  min-width: 32px;
  text-align: center;
  font-size: 0.92rem;
  font-weight: 700;
  padding: 0 0.25rem;
}

.remove-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 0.4rem 0.8rem;
  font-size: 0.82rem;
  color: #71717a;
  cursor: pointer;
  transition: all 0.15s ease;
}

.remove-btn:hover {
  border-color: #fca5a5;
  color: #b32626;
  background: #fffafa;
}

.remove-icon {
  font-size: 0.85rem;
}

/* Order Summary Column */
.cart-summary-column {
  position: sticky;
  top: 1.5rem;
}

.order-summary-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
}

.summary-heading {
  margin: 0 0 1.25rem;
  font-size: 1.25rem;
  font-weight: 700;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid #f0f0ed;
}

.summary-list {
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 0.95rem;
  color: #4b5563;
}

.summary-item dt {
  margin: 0;
}

.summary-item dd {
  margin: 0;
  font-weight: 600;
  color: #111;
}

.free-badge {
  color: #1b6826;
  background: #e8f5e9;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
}

.shipping-hint-box {
  background: #fbfbf9;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  padding: 0.55rem 0.75rem;
  font-size: 0.8rem;
  color: #555;
  line-height: 1.4;
}

.summary-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 0.5rem 0;
}

.total-item {
  align-items: flex-start;
  padding-top: 0.25rem;
}

.total-label {
  display: block;
  font-size: 1.05rem;
  font-weight: 800;
  color: #111;
}

.vat-subtext {
  display: block;
  font-size: 0.75rem;
  color: #888;
  font-weight: normal;
  margin-top: 0.15rem;
}

.total-val {
  font-size: 1.35rem;
  font-weight: 800;
  color: #111;
}

.summary-alert {
  margin-top: 1rem;
  padding: 0.6rem 0.8rem;
  background: #fee2e2;
  color: #b32626;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1.4;
}

.summary-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.checkout-btn {
  width: 100%;
  min-height: 3.2rem;
  font-size: 1.05rem;
  letter-spacing: 0.01em;
}

.secondary-link {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: transparent;
  color: #111;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  transition: all 0.15s ease;
}

.secondary-link:hover {
  border-color: #111;
  background: #f9fafb;
}

/* Trust Perks */
.summary-trust-perks {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid #f0f0ed;
}

.trust-perk {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.82rem;
  color: #555;
}

.trust-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .cart-grid {
    grid-template-columns: 1fr;
    gap: 1.75rem;
  }

  .cart-summary-column {
    position: static;
  }
}

@media (max-width: 640px) {
  .cart-page {
    padding-inline: 1rem;
    padding-top: 1rem;
  }

  .empty-cart-state {
    padding: 2.5rem 1rem;
  }

  .empty-icon-bubble {
    width: 80px;
    height: 80px;
  }

  .empty-icon {
    font-size: 2.75rem;
  }

  .cart-line-card {
    padding: 1rem;
    gap: 0.9rem;
  }

  .line-thumb-area {
    width: 78px;
    height: 78px;
  }

  .line-name {
    font-size: 0.95rem;
  }

  .line-total-price {
    font-size: 1rem;
  }

  .line-bottom {
    flex-wrap: wrap;
  }

  .stepper-btn {
    width: 30px;
    height: 30px;
  }
}

:global([data-theme="dark"]) .cart-page {
  background: #111210 !important;
  color: #ffffff !important;
}

:global([data-theme="dark"]) .back-link {
  color: #d4d4d8 !important;
}

:global([data-theme="dark"]) .empty-cart-state {
  background: #181916 !important;
  border-color: #272924 !important;
  color: #ffffff !important;
}

:global([data-theme="dark"]) .empty-title {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .empty-desc {
  color: #a1a1aa !important;
}

:global([data-theme="dark"]) .main-title {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .clear-cart-link {
  color: #a1a1aa !important;
}

:global([data-theme="dark"]) .cart-line-card {
  background: #181916 !important;
  border-color: #272924 !important;
  color: #ffffff !important;
}

:global([data-theme="dark"]) .line-name a {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .line-total-price strong {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .spec-pill {
  background: #242721 !important;
  border-color: #383b33 !important;
  color: #ffffff !important;
}

:global([data-theme="dark"]) .stepper-btn {
  background: #242721 !important;
  border-color: #383b33 !important;
  color: #ffffff !important;
}

:global([data-theme="dark"]) .order-summary-card {
  background: #181916 !important;
  border-color: #272924 !important;
  color: #ffffff !important;
}

:global([data-theme="dark"]) .summary-heading {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .summary-item dt {
  color: #e4e4e7 !important;
}

:global([data-theme="dark"]) .summary-item dd {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .total-item {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .total-val {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .secondary-link {
  border-color: #383b33 !important;
  color: #ffffff !important;
}

:global([data-theme="dark"]) .secondary-link:hover {
  background: #242721 !important;
}

:global([data-theme="dark"]) .trust-perk {
  color: #d4d4d8 !important;
}
</style>
