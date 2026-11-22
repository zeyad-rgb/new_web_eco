<script setup lang="ts">
import { useFreeShippingText } from '../../utils/shipping'

const freeShippingText = useFreeShippingText()
// Trust badges inspired by Adidas & EcoMars activewear
</script>

<template>
  <section class="trust-section" aria-label="لماذا تتسوق من EcoMars؟">
    <div class="trust-header">
      <h2 class="trust-heading">لماذا تتسوق من EcoMars؟</h2>
    </div>

    <div class="trust-bar" role="list">
      <div class="trust-item" role="listitem">
        <span class="trust-icon" aria-hidden="true">🚚</span>
        <div class="trust-text">
          <strong>شحن مجاني</strong>
          <small>{{ freeShippingText || 'على الطلبات المؤهلة' }}</small>
        </div>
      </div>

      <div class="trust-item" role="listitem">
        <span class="trust-icon" aria-hidden="true">↩️</span>
        <div class="trust-text">
          <strong>إرجاع واستبدال مجاني</strong>
          <small>خلال ١٤ يوماً من الاستلام</small>
        </div>
      </div>

      <div class="trust-item" role="listitem">
        <span class="trust-icon" aria-hidden="true">🔒</span>
        <div class="trust-text">
          <strong>دفع آمن ١٠٠٪</strong>
          <small>الدفع عند الاستلام وبطاقات الائتمان</small>
        </div>
      </div>

      <div class="trust-item" role="listitem">
        <span class="trust-icon" aria-hidden="true">✓</span>
        <div class="trust-text">
          <strong>جودة رياضية أصلية</strong>
          <small>أقمشة عالية التحمل والأداء</small>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Fade-in entrance animation */
@keyframes trustFadeIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.trust-section {
  max-width: 1440px;
  margin: 3rem auto 1.5rem;
  padding: 0 clamp(1rem, 5vw, 5rem);
  animation: trustFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}

/* Subtle section heading */
.trust-header {
  text-align: center;
  margin-bottom: 1.25rem;
}

.trust-heading {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  font-size: 0.92rem;
  font-weight: 600;
  color: #63685e;
  letter-spacing: 0.02em;
  margin: 0;
}

.trust-heading::before,
.trust-heading::after {
  content: '';
  width: 2.25rem;
  height: 1px;
  background: #dbded5;
  display: inline-block;
}

/* Base trust bar */
.trust-bar {
  display: flex;
}

.trust-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Lime-tinted circular icon */
.trust-icon {
  font-size: 1.6rem;
  width: 3.25rem;
  height: 3.25rem;
  display: grid;
  place-items: center;
  background: #f1fad1;
  border: 1px solid rgba(170, 205, 40, 0.28);
  border-radius: 50%;
  flex-shrink: 0;
  color: #38450f;
  font-weight: 700;
  line-height: 1;
  transition: transform 0.25s ease, background-color 0.25s ease;
}

/* Typography */
.trust-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.trust-text strong {
  font-size: 1rem;
  font-weight: 600;
  color: #111210;
  line-height: 1.35;
  white-space: nowrap;
}

.trust-text small {
  font-size: 0.78rem;
  font-weight: 400;
  color: #71756c;
  line-height: 1.4;
  margin-top: 0.2rem;
}

/* Desktop layout: 4 columns in one unified box with thin vertical dividers */
@media (min-width: 769px) {
  .trust-bar {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    background: #ffffff;
    border: 1px solid #e5e7e0;
    border-radius: 6px;
    overflow: hidden;
  }

  .trust-item {
    padding: 1.6rem 1.25rem;
    justify-content: center;
    transition: background-color 0.2s ease;
  }

  .trust-item:not(:last-child) {
    border-inline-end: 1px solid #e5e7e0;
  }

  .trust-item:hover {
    background-color: #fafbf7;
  }

  .trust-item:hover .trust-icon {
    transform: scale(1.08);
    background-color: #ebf8be;
  }
}

/* Mobile & tablet layout: Horizontal scrolling strip */
@media (max-width: 768px) {
  .trust-section {
    margin: 2rem auto 1rem;
    padding: 0 1rem;
  }

  .trust-heading::before,
  .trust-heading::after {
    width: 1.5rem;
  }

  .trust-bar {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    gap: 0.75rem;
    padding: 0.25rem 0.25rem 0.65rem;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .trust-bar::-webkit-scrollbar {
    display: none;
  }

  .trust-item {
    flex: 0 0 auto;
    width: clamp(235px, 72vw, 285px);
    scroll-snap-align: start;
    background: #ffffff;
    border: 1px solid #e5e7e0;
    border-radius: 8px;
    padding: 1.1rem 1.15rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  }
}

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .trust-section {
    animation: none;
    opacity: 1;
    transform: none;
  }

  .trust-item,
  .trust-icon {
    transition: none;
  }
}
</style>
