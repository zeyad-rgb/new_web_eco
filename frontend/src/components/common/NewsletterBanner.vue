<script setup lang="ts">
import { ref } from 'vue'
import { useUIStore } from '../../stores/ui'

const ui = useUIStore()
const email = ref('')
const subscribed = ref(false)
const demo = import.meta.env.MODE === 'preview'

function handleSubscribe() {
  if (!demo) {
    ui.showToast('Newsletter signup will be available soon.', 'info')
    return
  }
  if (email.value.trim()) {
    subscribed.value = true
    ui.showToast('شكرًا لانضمامك! كود الخصم ECOMARS10 متاح لك الآن', 'success', '🎉')
    email.value = ''
  }
}
</script>

<template>
  <section class="newsletter-banner" aria-label="النشرة البريدية ومجتمع إيكومارس">
    <div class="newsletter-inner">
      <div class="newsletter-copy">
        <span class="badge">انضم إلى مجتمعنا الرياضي</span>
        <h2>احصل على خصم ١٠٪ على أول طلب</h2>
        <p>
          كن أول من يعلم بإطلاق التشكيلات الجديدة، الفعاليات الرياضية، والعروض الحصرية للأعضاء.
        </p>
      </div>

      <div class="newsletter-form-wrap">
        <div v-if="subscribed" class="subscribed-alert">
          ✓ تم اشتراكك بنجاح! تفقد بريدك الإلكتروني للحصول على كود الخصم.
        </div>

        <form v-else class="newsletter-form" @submit.prevent="handleSubscribe">
          <input
            v-model="email"
            type="email"
            required
            placeholder="أدخل بريدك الإلكتروني…"
            aria-label="البريد الإلكتروني"
          />
          <button type="submit" class="primary">
            انضم الآن ←
          </button>
        </form>
        <small class="terms-note">
          بالتسجيل، أنت توافق على شروط الخدمة وسياسة الخصوصية الخاصة بـ EcoMars.
        </small>
      </div>
    </div>
  </section>
</template>

<style scoped>
.newsletter-banner {
  background: #111210;
  color: #ffffff;
  padding: clamp(2.5rem, 5vw, 4.5rem) clamp(1rem, 5vw, 5rem);
  margin-top: 4rem;
}

.newsletter-inner {
  max-width: 1440px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 3rem;
  flex-wrap: wrap;
}

.newsletter-copy {
  flex: 1;
  min-width: 280px;
  max-width: 580px;
}

.badge {
  display: inline-block;
  background: var(--lime);
  color: #111;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  margin-bottom: 0.85rem;
  letter-spacing: 0.05em;
}

.newsletter-copy h2 {
  font-size: clamp(1.8rem, 4vw, 2.7rem);
  margin: 0 0 0.8rem;
  line-height: 1.15;
}

.newsletter-copy p {
  color: #b5b8b0;
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
}

.newsletter-form-wrap {
  flex: 1;
  min-width: 280px;
  max-width: 500px;
}

.newsletter-form {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.newsletter-form input {
  flex: 1;
  min-width: 200px;
  padding: 0.85rem 1rem;
  border: 1px solid #333;
  background: #1c1d1a;
  color: #fff;
  font-size: 0.95rem;
  border-radius: 2px;
}

.newsletter-form input:focus {
  outline: 2px solid var(--lime);
  border-color: transparent;
}

.newsletter-form button {
  padding: 0.85rem 1.6rem;
  white-space: nowrap;
}

.terms-note {
  display: block;
  font-size: 0.75rem;
  color: #888;
  margin-top: 0.75rem;
}

.subscribed-alert {
  background: rgba(213, 251, 82, 0.15);
  border: 1px solid var(--lime);
  color: var(--lime);
  padding: 1rem;
  font-size: 0.95rem;
  font-weight: 600;
}

@media (max-width: 768px) {
  .newsletter-inner {
    flex-direction: column;
    gap: 1.8rem;
    align-items: stretch;
  }
}
</style>
