<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCatalogStore } from '../../stores/catalog'
import { useCartStore } from '../../stores/cart'
import { useLocaleStore } from '../../stores/locale'
import { formatMoney } from '../../utils/money'

const router = useRouter()
const catalog = useCatalogStore()
const cart = useCartStore()
const locale = useLocaleStore()

// Synced with the encrypted server setting in piastres.
// 0 = the store has no free-shipping offer (or settings not loaded yet): the meter is hidden.
const freeShippingThreshold = computed(() => Number(catalog.shippingSettings?.free_threshold || 0))

const lines = computed(() => cart.getResolvedLines(catalog.products))
const subtotal = computed(() => cart.subtotal(catalog.products))

const freeShippingProgress = computed(() => {
  const threshold = freeShippingThreshold.value
  return threshold > 0 ? Math.min(100, Math.round((subtotal.value / threshold) * 100)) : 100
})

const freeShippingRemaining = computed(() => {
  return Math.max(0, freeShippingThreshold.value - subtotal.value)
})

function close() {
  cart.toggleDrawer(false)
}

function goToCheckout() {
  close()
  router.push('/checkout')
}

function goToCart() {
  close()
  router.push('/cart')
}

function goToShop() {
  close()
  router.push('/shop')
}
</script>

<template>
  <div v-if="cart.isDrawerOpen" class="cart-drawer-backdrop" @click.self="close">
    <aside
      class="cart-drawer"
      role="dialog"
      aria-modal="true"
      aria-label="حقيبة التسوق"
    >
      <!-- Header -->
      <div class="drawer-header">
        <div class="drawer-title">
          <h2>{{ locale.t('cart.title') }}</h2>
          <span>({{ cart.count }} {{ locale.locale === 'en' ? 'items' : 'قطع' }})</span>
        </div>
        <button
          type="button"
          class="close-btn"
          :aria-label="locale.locale === 'en' ? 'Close shopping bag' : 'إغلاق حقيبة التسوق'"
          @click="close"
        >
          ✕
        </button>
      </div>

      <!-- Free Shipping Bar (Adidas Style) -->
      <div v-if="freeShippingThreshold > 0" class="shipping-meter">
        <p v-if="freeShippingRemaining > 0" class="shipping-meter-text">
          <template v-if="locale.locale === 'en'">
            Add <strong>{{ formatMoney(freeShippingRemaining) }}</strong> more for <strong>FREE shipping</strong>!
          </template>
          <template v-else>
            أضف منتجات بقيمة <strong>{{ formatMoney(freeShippingRemaining) }}</strong> للحصول على <strong>شحن مجاني</strong>!
          </template>
        </p>
        <p v-else class="shipping-meter-text free">
          {{ locale.t('cart.free_shipping_unlocked') }}
        </p>
        <div class="meter-bar">
          <div
            class="meter-fill"
            :style="{ width: freeShippingProgress + '%' }"
            :class="{ full: freeShippingRemaining === 0 }"
          ></div>
        </div>
      </div>

      <!-- Content -->
      <div class="drawer-items">
        <div v-if="!cart.count" class="empty-cart-drawer">
          <span class="empty-cart-icon">🛍️</span>
          <h3>{{ locale.t('cart.empty_title') }}</h3>
          <p>{{ locale.t('cart.empty_desc') }}</p>
          <button type="button" class="primary explore-shop-btn" @click="goToShop">
            {{ locale.t('cart.explore_shop') }}
          </button>
        </div>

        <div
          v-for="line in lines"
          :key="line.sku"
          class="drawer-item"
        >
          <div class="item-thumb">
            <img
              v-if="line.product.images?.length"
              :src="line.product.images[0]"
              :alt="locale.getProductName(line.product)"
            />
            <span
              v-else-if="line.product.image"
              :class="['photo', line.product.image]"
            ></span>
          </div>

          <div class="item-details">
            <div class="item-head">
              <h4>{{ locale.getProductName(line.product) }}</h4>
              <button
                type="button"
                class="remove-btn"
                :aria-label="locale.locale === 'en' ? 'Remove item' : 'إزالة المنتج'"
                @click="cart.remove(line.sku)"
              >
                ✕
              </button>
            </div>

            <p class="item-meta">
              {{ line.variant.color }} · {{ locale.t('common.size') }}: <bdi>{{ line.variant.size }}</bdi>
            </p>

            <div class="item-bottom">
              <div class="qty-stepper">
                <button
                  type="button"
                  :aria-label="locale.locale === 'en' ? 'Decrease quantity' : 'تقليل الكمية'"
                  @click="cart.adjust(line.sku, -1, line.variant.stock)"
                >
                  −
                </button>
                <span>{{ line.quantity }}</span>
                <button
                  type="button"
                  :aria-label="locale.locale === 'en' ? 'Increase quantity' : 'زيادة الكمية'"
                  :disabled="cart.remainingStock(line.variant) <= 0"
                  @click="cart.adjust(line.sku, 1, line.variant.stock)"
                >
                  +
                </button>
              </div>

              <strong class="item-price">
                {{ formatMoney(line.product.price * line.quantity) }}
              </strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Summary & CTA -->
      <div v-if="cart.count > 0" class="drawer-footer">
        <div class="subtotal-row">
          <span>{{ locale.t('common.subtotal') }}:</span>
          <strong>{{ formatMoney(subtotal) }}</strong>
        </div>
        <p class="taxes-note">{{ locale.t('cart.taxes_notice') }}</p>

        <button
          type="button"
          class="primary wide checkout-btn"
          @click="goToCheckout"
        >
          {{ locale.t('common.checkout') }}
        </button>

        <button
          type="button"
          class="view-cart-btn"
          @click="goToCart"
        >
          {{ locale.t('common.view_cart') }}
        </button>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.cart-drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(17, 18, 16, 0.55);
  backdrop-filter: blur(2px);
  z-index: 100;
  display: flex;
  justify-content: flex-end;
  animation: fadeIn 0.2s ease-out;
}

.cart-drawer {
  width: 100%;
  max-width: 440px;
  height: 100%;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 30px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.drawer-header {
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
}

.drawer-title {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.drawer-title h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
}

.drawer-title span {
  font-size: 0.85rem;
  color: #666;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #333;
  padding: 0.25rem;
  display: grid;
  place-items: center;
}

.close-btn:hover {
  color: #000;
}

/* Shipping Meter */
.shipping-meter {
  background: #f7f8f6;
  padding: 0.85rem 1.5rem;
  border-bottom: 1px solid #eaeaea;
}

.shipping-meter-text {
  margin: 0 0 0.4rem;
  font-size: 0.82rem;
  color: #333;
}

.shipping-meter-text.free {
  color: #1b6826;
  font-weight: 600;
}

.meter-bar {
  height: 6px;
  background: #e2e4dc;
  border-radius: 999px;
  overflow: hidden;
}

.meter-fill {
  height: 100%;
  background: #191c17;
  transition: width 0.3s ease;
}

.meter-fill.full {
  background: #2e7d32;
}

/* Items List */
.drawer-items {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.5rem;
}

.empty-cart-drawer {
  text-align: center;
  padding: 3.5rem 1rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-cart-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  background: #f1f3ec;
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
}

.empty-cart-drawer h3 {
  margin: 0 0 0.5rem;
  font-size: 1.3rem;
  font-weight: 800;
  color: #111;
}

.empty-cart-drawer p {
  color: #666;
  font-size: 0.9rem;
  line-height: 1.6;
  margin: 0 0 1.75rem;
  max-width: 260px;
}

.explore-shop-btn {
  padding: 0.85rem 1.75rem;
  font-size: 0.95rem;
  font-weight: 700;
  border-radius: 4px;
}

.empty-msg {
  text-align: center;
  color: #888;
  margin-top: 3rem;
  font-size: 0.95rem;
}

.drawer-item {
  display: flex;
  gap: 1rem;
  padding-block: 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.item-thumb {
  width: 76px;
  height: 76px;
  background: #f4f4f4;
  flex-shrink: 0;
  overflow: hidden;
}

.item-thumb img,
.item-thumb .photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.item-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}

.item-head h4 {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1.3;
}

.remove-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 0;
  font-size: 0.9rem;
}

.remove-btn:hover {
  color: #d32f2f;
}

.item-meta {
  margin: 0.2rem 0;
  font-size: 0.8rem;
  color: #666;
}

.item-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}

.qty-stepper {
  display: inline-flex;
  align-items: center;
  border: 1px solid #ccc;
  background: #fff;
}

.qty-stepper button {
  background: none;
  border: none;
  padding: 0.25rem 0.6rem;
  cursor: pointer;
  font-weight: bold;
}

.qty-stepper span {
  padding: 0 0.5rem;
  font-size: 0.85rem;
  min-width: 1.5rem;
  text-align: center;
}

.item-price {
  font-size: 0.95rem;
}

/* Footer */
.drawer-footer {
  border-top: 1px solid #eee;
  padding: 1.25rem 1.5rem;
  background: #fafaf8;
}

.subtotal-row {
  display: flex;
  justify-content: space-between;
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
}

.taxes-note {
  margin: 0 0 1rem;
  font-size: 0.78rem;
  color: #777;
}

.checkout-btn {
  min-height: 3.1rem;
  font-size: 1rem;
  letter-spacing: 0.02em;
  margin-bottom: 0.6rem;
}

.view-cart-btn {
  width: 100%;
  background: none;
  border: 1px solid #ccc;
  padding: 0.75rem;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  color: #111;
}

.view-cart-btn:hover {
  border-color: #111;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
</style>
