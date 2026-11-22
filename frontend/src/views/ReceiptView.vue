<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { formatMoney } from '../utils/money'
import { useUIStore } from '../stores/ui'
import { useLocaleStore } from '../stores/locale'
import type { OrderReceipt } from '../types'

const router = useRouter()
const ui = useUIStore()
const locale = useLocaleStore()
const receipt = ref<OrderReceipt | null>(null)
const copied = ref(false)

const whatsappLink = computed(() => {
  if (receipt.value?.whatsapp?.whatsapp_url) {
    return receipt.value.whatsapp.whatsapp_url
  }
  if (receipt.value?.id) {
    const text = encodeURIComponent(`مرحباً Studio Active، أود تأكيد ومتابعة طلبي برقم: #${receipt.value.id.slice(0, 8).toUpperCase()}`)
    return `https://wa.me/201000000000?text=${text}`
  }
  return ''
})

const isWhatsAppSent = computed(() => {
  return receipt.value?.whatsapp?.sent ?? false
})

onMounted(() => {
  const saved = sessionStorage.getItem('ecomars_last_receipt')
  if (saved) {
    try {
      receipt.value = JSON.parse(saved)
    } catch {
      receipt.value = null
    }
  }
})

function copyOrderId() {
  if (!receipt.value) return
  navigator.clipboard?.writeText(receipt.value.id)
  copied.value = true
  ui.showToast(locale.isRTL ? 'تم نسخ رقم الطلب إلى الحافظة' : 'Order ID copied to clipboard', 'success')
  setTimeout(() => {
    copied.value = false
  }, 3000)
}

function handlePrint() {
  window.print()
}
</script>

<template>
  <section class="receipt-page" aria-labelledby="page-title">
    <div class="receipt-container">
      <!-- Success Card -->
      <div v-if="receipt" class="receipt-card">
        <div class="success-icon-badge">
          <span>✓</span>
        </div>

        <h1 id="page-title" class="success-title">{{ locale.t('receipt.title') }}</h1>
        <p class="success-subtitle">
          {{ locale.t('receipt.subtitle') }}
        </p>

        <!-- Order Reference Box -->
        <div class="order-ref-box">
          <div class="ref-item">
            <span class="ref-label">{{ locale.t('receipt.order_num') }}</span>
            <div class="ref-value-row">
              <strong class="ref-value" dir="ltr">{{ receipt.id }}</strong>
              <button
                type="button"
                class="copy-btn"
                :title="copied ? locale.t('receipt.copied') : locale.t('receipt.copy')"
                @click="copyOrderId"
              >
                {{ copied ? locale.t('receipt.copied') : locale.t('receipt.copy') }}
              </button>
            </div>
          </div>

          <div class="ref-divider"></div>

          <div class="ref-item">
            <span class="ref-label">{{ locale.t('receipt.total_amount') }}</span>
            <strong class="ref-value price-highlight">{{ formatMoney(receipt.total) }}</strong>
          </div>

          <div class="ref-divider"></div>

          <div class="ref-item">
            <span class="ref-label">{{ locale.t('receipt.payment_method') }}</span>
            <strong class="ref-value">{{ locale.t('checkout.cod') }}</strong>
          </div>
        </div>

        <!-- WhatsApp Order Confirmation Status Card -->
        <div class="whatsapp-banner">
          <div class="whatsapp-banner-content">
            <div class="whatsapp-icon-circle">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.67 12.05 3.67Z"/>
              </svg>
            </div>
            <div class="whatsapp-details">
              <div class="whatsapp-headline-row">
                <h3 class="whatsapp-title">{{ locale.isRTL ? 'تأكيد الطلب عبر واتساب' : 'WhatsApp Order Confirmation' }}</h3>
                <span class="whatsapp-status-pill success">
                  ✓ {{ locale.isRTL ? 'طلبك مسجل في النظام' : 'Order Registered' }}
                </span>
              </div>
              <p class="whatsapp-desc">
                {{
                  locale.isRTL
                    ? 'سيصلك إشعار تأكيد مباشر من رقم المتجر عبر واتساب خلال دقائق لتأكيد موعد التسليم والشحن. برجاء الرد عليه بالتأكيد.'
                    : 'Our store team will send a WhatsApp confirmation message to your number shortly to verify your delivery address and dispatch.'
                }}
              </p>
            </div>
          </div>
          <a
            :href="whatsappLink"
            target="_blank"
            rel="noopener noreferrer"
            class="whatsapp-cta-btn"
          >
            <span>💬</span>
            <span>{{ locale.isRTL ? 'الاستفسار عن الطلب مع الدعم' : 'Contact Support on WhatsApp' }}</span>
          </a>
        </div>

        <!-- Order Timeline Progress (Adidas Style) -->
        <div class="timeline-card">
          <h2 class="timeline-title">{{ locale.t('receipt.timeline_title') }}</h2>
          <div class="timeline-track">
            <div class="timeline-step completed">
              <div class="step-dot">✓</div>
              <span class="step-label">{{ locale.t('receipt.step_confirmed') }}</span>
            </div>
            <div class="timeline-line active"></div>
            <div class="timeline-step active">
              <div class="step-dot">2</div>
              <span class="step-label">{{ locale.t('receipt.step_processing') }}</span>
            </div>
            <div class="timeline-line"></div>
            <div class="timeline-step">
              <div class="step-dot">3</div>
              <span class="step-label">{{ locale.t('receipt.step_shipped') }}</span>
            </div>
            <div class="timeline-line"></div>
            <div class="timeline-step">
              <div class="step-dot">4</div>
              <span class="step-label">{{ locale.t('receipt.step_delivered') }}</span>
            </div>
          </div>
        </div>

        <!-- Info Grid -->
        <div class="receipt-info-grid">
          <div class="info-tile">
            <span class="tile-icon">🚚</span>
            <div class="tile-content">
              <h4>{{ locale.t('receipt.delivery_time_title') }}</h4>
              <p>{{ locale.t('receipt.delivery_time_desc') }}</p>
            </div>
          </div>

          <div class="info-tile">
            <span class="tile-icon">🔄</span>
            <div class="tile-content">
              <h4>{{ locale.t('receipt.returns_title') }}</h4>
              <p>{{ locale.t('receipt.returns_desc') }}</p>
            </div>
          </div>

          <div class="info-tile">
            <span class="tile-icon">💬</span>
            <div class="tile-content">
              <h4>{{ locale.t('receipt.support_title') }}</h4>
              <p>{{ locale.t('receipt.support_desc') }}</p>
            </div>
          </div>
        </div>

        <!-- Action CTAs -->
        <div class="receipt-actions">
          <router-link to="/shop" class="primary receipt-btn">
            {{ locale.t('receipt.continue_shopping') }}
          </router-link>
          <button type="button" class="secondary receipt-btn print-hide" @click="handlePrint">
            {{ locale.t('receipt.print_receipt') }}
          </button>
        </div>
      </div>

      <!-- Fallback when no receipt in session -->
      <div v-else class="no-receipt-card">
        <span class="empty-icon">📦</span>
        <h2>{{ locale.t('receipt.empty_title') }}</h2>
        <p>{{ locale.t('receipt.empty_desc') }}</p>
        <router-link to="/shop" class="primary receipt-btn">
          {{ locale.t('cart.explore_shop') }}
        </router-link>
      </div>
    </div>
  </section>
</template>

<style scoped>
.receipt-page {
  min-height: 80vh;
  padding: 3rem 1.5rem 5rem;
  background: #f8f9f6;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.receipt-container {
  width: 100%;
  max-width: 780px;
}

.receipt-card,
.no-receipt-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: clamp(2rem, 5vw, 3.5rem);
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

.success-icon-badge {
  width: 72px;
  height: 72px;
  margin: 0 auto 1.5rem;
  background: #e8f5e9;
  border: 2px solid #2e7d32;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #2e7d32;
  font-size: 2.2rem;
  font-weight: 800;
  animation: popIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes popIn {
  0% { transform: scale(0.6); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.success-title {
  font-size: clamp(1.6rem, 3.5vw, 2.3rem);
  margin: 0 0 0.75rem;
  color: #111;
  font-weight: 800;
}

.success-subtitle {
  color: #666;
  font-size: 1rem;
  line-height: 1.6;
  max-width: 540px;
  margin: 0 auto 2.5rem;
}

/* Order Ref Box */
.order-ref-box {
  background: #fdfdfc;
  border: 1px solid #e8e9e4;
  border-radius: 6px;
  padding: 1.5rem;
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-bottom: 2.5rem;
}

.ref-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  text-align: start;
}

.ref-label {
  font-size: 0.8rem;
  color: #777;
  text-transform: uppercase;
}

.ref-value-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ref-value {
  font-size: 1.05rem;
  color: #111;
  font-weight: 700;
}

.price-highlight {
  color: #111;
  font-size: 1.25rem;
}

.copy-btn {
  background: #f0f0ee;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.copy-btn:hover {
  background: #111;
  color: #fff;
  border-color: #111;
}

.ref-divider {
  width: 1px;
  height: 40px;
  background: #e2e4df;
}

/* Timeline */
.timeline-card {
  border-top: 1px solid #eee;
  padding: 2rem 0;
  margin-bottom: 2rem;
}

.timeline-title {
  font-size: 1.1rem;
  margin-bottom: 1.75rem;
  text-align: start;
}

.timeline-track {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}

.timeline-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  z-index: 2;
}

.step-dot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f0f0ee;
  border: 2px solid #ccc;
  display: grid;
  place-items: center;
  font-size: 0.85rem;
  font-weight: 700;
  color: #666;
}

.timeline-step.completed .step-dot {
  background: #2e7d32;
  border-color: #2e7d32;
  color: #fff;
}

.timeline-step.active .step-dot {
  background: #111;
  border-color: #111;
  color: #fff;
}

.step-label {
  font-size: 0.8rem;
  color: #666;
  font-weight: 600;
  white-space: nowrap;
}

.timeline-line {
  flex: 1;
  height: 2px;
  background: #e0e0e0;
  margin: 0 0.5rem;
  margin-bottom: 1.5rem;
}

.timeline-line.active {
  background: #2e7d32;
}

/* Info Grid */
.receipt-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.25rem;
  text-align: start;
  margin-bottom: 2.5rem;
}

.info-tile {
  background: #fafaf8;
  padding: 1.25rem;
  border-radius: 6px;
  display: flex;
  gap: 0.85rem;
  align-items: flex-start;
}

.tile-icon {
  font-size: 1.6rem;
  line-height: 1;
}

.tile-content h4 {
  margin: 0 0 0.35rem;
  font-size: 0.92rem;
  color: #111;
}

.tile-content p {
  margin: 0;
  font-size: 0.82rem;
  color: #666;
  line-height: 1.45;
}

/* Actions */
.receipt-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.receipt-btn {
  padding: 0.9rem 2.2rem;
  font-size: 1rem;
  border-radius: 4px;
}

.no-receipt-card {
  padding: 4rem 2rem;
}

.no-receipt-card .empty-icon {
  font-size: 3.5rem;
  display: block;
  margin-bottom: 1rem;
}

.no-receipt-card h2 {
  margin-bottom: 0.75rem;
}

.no-receipt-card p {
  color: #666;
  margin-bottom: 2rem;
}

.whatsapp-banner {
  background: #f0fdf4;
  border: 2px solid #22c55e;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.08);
}

.whatsapp-banner-content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.whatsapp-icon-circle {
  width: 44px;
  height: 44px;
  background: #22c55e;
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.whatsapp-details {
  flex: 1;
}

.whatsapp-headline-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 0.35rem;
}

.whatsapp-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #14532d;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: -0.02em;
}

.whatsapp-status-pill {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
}

.whatsapp-status-pill.success {
  background: #dcfce7;
  color: #15803d;
  border: 1px solid #86efac;
}

.whatsapp-status-pill.pending {
  background: #fef9c3;
  color: #854d0e;
  border: 1px solid #fde047;
}

.whatsapp-desc {
  font-size: 0.9rem;
  line-height: 1.5;
  color: #166534;
  margin: 0;
}

.whatsapp-cta-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: #22c55e;
  color: #ffffff;
  text-decoration: none;
  font-size: 1rem;
  font-weight: 800;
  padding: 0.85rem 1.5rem;
  border-radius: 6px;
  letter-spacing: 0.01em;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 10px rgba(34, 197, 94, 0.25);
}

.whatsapp-cta-btn:hover {
  background: #16a34a;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(34, 197, 94, 0.35);
}

:global([data-theme="dark"]) .whatsapp-banner {
  background: #052e16 !important;
  border-color: #22c55e !important;
}

:global([data-theme="dark"]) .whatsapp-title {
  color: #4ade80 !important;
}

:global([data-theme="dark"]) .whatsapp-desc {
  color: #bbf7d0 !important;
}

@media print {
  .print-hide,
  header,
  footer,
  nav {
    display: none !important;
  }
  .receipt-page {
    padding: 0;
    background: #fff;
  }
  .receipt-card {
    border: none;
    box-shadow: none;
  }
}

@media (max-width: 600px) {
  .order-ref-box {
    flex-direction: column;
    align-items: flex-start;
  }
  .ref-divider {
    display: none;
  }
  .step-label {
    font-size: 0.7rem;
  }
}

:global([data-theme="dark"]) .receipt-page {
  background: #111210 !important;
  color: #ffffff !important;
}

:global([data-theme="dark"]) .receipt-card,
:global([data-theme="dark"]) .no-receipt-card {
  background: #181916 !important;
  border-color: #272924 !important;
  color: #ffffff !important;
}

:global([data-theme="dark"]) .success-title {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .success-subtitle {
  color: #a1a1aa !important;
}

:global([data-theme="dark"]) .order-ref-box {
  background: #1f211d !important;
  border-color: #383b33 !important;
}

:global([data-theme="dark"]) .ref-label {
  color: #a1a1aa !important;
}

:global([data-theme="dark"]) .ref-value {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .timeline-card {
  background: #1f211d !important;
  border-color: #383b33 !important;
}

:global([data-theme="dark"]) .timeline-title {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .timeline-step .step-label {
  color: #a1a1aa !important;
}

:global([data-theme="dark"]) .timeline-step.completed .step-label,
:global([data-theme="dark"]) .timeline-step.active .step-label {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .info-tile {
  background: #1f211d !important;
  border-color: #383b33 !important;
}

:global([data-theme="dark"]) .tile-content h4 {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .tile-content p {
  color: #a1a1aa !important;
}

:global([data-theme="dark"]) .no-receipt-card h2 {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .no-receipt-card p {
  color: #a1a1aa !important;
}
</style>
