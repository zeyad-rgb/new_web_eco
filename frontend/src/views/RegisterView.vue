<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useUIStore } from '../stores/ui'
import { useLocaleStore } from '../stores/locale'
import { useFreeShippingText } from '../utils/shipping'

const router = useRouter()
const auth = useAuthStore()
const ui = useUIStore()
const locale = useLocaleStore()
const freeShippingText = useFreeShippingText()

const name = ref('')
const email = ref('')
const phone = ref('')
const password = ref('')
const confirmPassword = ref('')
const agreeTerms = ref(true)
const loading = ref(false)
const error = ref('')

async function handleRegister() {
  if (password.value !== confirmPassword.value) {
    error.value = locale.locale === 'en' ? 'Passwords do not match.' : 'كلمات المرور غير متطابقة.'
    return
  }
  if (!agreeTerms.value) {
    error.value = locale.locale === 'en' ? 'Please agree to the Terms of Service and Privacy Policy.' : 'يرجى الموافقة على الشروط والأحكام وسياسة الخصوصية.'
    return
  }

  loading.value = true
  error.value = ''
  try {
    await auth.register(name.value, email.value, phone.value, password.value)
    ui.showToast(
      locale.locale === 'en' ? `Welcome ${name.value}! Your account is ready.` : `أهلاً بك يا ${name.value}! حسابك جاهز.`,
      'success',
      '🎁'
    )
    router.push('/shop')
  } catch (err) {
    error.value = err instanceof Error ? err.message : (locale.locale === 'en' ? 'Registration failed.' : 'فشل إنشاء الحساب.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="auth-page" aria-labelledby="page-title">
    <!-- Brand Panel (Desktop) -->
    <div class="auth-brand-panel">
      <div class="brand-panel-logo" dir="ltr">STUDIO<span>ACTIVE</span></div>
      <p class="brand-panel-tagline">
        <template v-if="locale.locale === 'en'">
          JOIN THE ATHLETES CLUB.<br/>WHERE POWER MEETS STYLE.
        </template>
        <template v-else>
          انضم لعائلة الأبطال.<br/>حيث تلتقي القوة بالأناقة.
        </template>
      </p>
      <p class="brand-panel-desc">
        {{ locale.locale === 'en' ? 'Create your account to save your details and follow every order.' : 'أنشئ حسابك لحفظ بياناتك ومتابعة كل طلباتك.' }}
      </p>
      <div class="brand-features">
        <div class="brand-feature">
          <span class="brand-feature-icon">📦</span>
          <span>{{ locale.locale === 'en' ? 'See all your orders and track them in one place' : 'شوف كل طلباتك وتابعها من مكان واحد' }}</span>
        </div>
        <div v-if="freeShippingText" class="brand-feature">
          <span class="brand-feature-icon">🚚</span>
          <span>{{ freeShippingText }}</span>
        </div>
        <div class="brand-feature">
          <span class="brand-feature-icon">💵</span>
          <span>{{ locale.locale === 'en' ? 'Cash on delivery' : 'الدفع عند الاستلام' }}</span>
        </div>
      </div>
    </div>

    <!-- Form Panel -->
    <div class="auth-form-panel">
      <div class="auth-box">
        <div class="auth-header">
          <h1 id="page-title">{{ locale.t('auth.register_title') }}</h1>
          <p>{{ locale.t('auth.register_subtitle') }}</p>
        </div>

        <div v-if="error" class="auth-error" role="alert">
          {{ error }}
        </div>

        <form class="auth-form" @submit.prevent="handleRegister">
          <label>
            {{ locale.locale === 'en' ? 'Full Name *' : 'الاسم بالكامل *' }}
            <input
              v-model.trim="name"
              required
              :placeholder="locale.locale === 'en' ? 'e.g. Youssef Ahmed' : 'مثال: يوسف أحمد'"
            />
          </label>

          <label>
            {{ locale.t('auth.email') }}
            <input
              v-model.trim="email"
              type="email"
              required
              autocomplete="email"
              placeholder="name@example.com"
            />
          </label>

          <label>
            {{ locale.locale === 'en' ? 'Mobile Phone *' : 'رقم الموبايل *' }}
            <input
              v-model.trim="phone"
              dir="ltr"
              type="tel"
              required
              pattern="01[0125][0-9]{8}"
              placeholder="01xxxxxxxxx"
            />
          </label>

          <label>
            {{ locale.t('auth.password') }}
            <input
              v-model="password"
              type="password"
              required
              minlength="6"
              :placeholder="locale.locale === 'en' ? '6 characters or more' : '٦ أحرف أو أكثر'"
            />
          </label>

          <label>
            {{ locale.t('auth.confirm_password') }}
            <input
              v-model="confirmPassword"
              type="password"
              required
              :placeholder="locale.locale === 'en' ? 'Re-enter your password' : 'أعد إدخال كلمة المرور'"
            />
          </label>

          <label class="terms-label">
            <input v-model="agreeTerms" type="checkbox" required />
            <span v-if="locale.locale === 'en'">
              I agree to the <router-link to="/terms">Terms of Service</router-link> and <router-link to="/privacy">Privacy Policy</router-link>.
            </span>
            <span v-else>
              أوافق على <router-link to="/terms">الشروط والأحكام</router-link> و <router-link to="/privacy">سياسة الخصوصية</router-link>.
            </span>
          </label>

          <button type="submit" class="primary wide auth-submit-btn" :disabled="loading">
            {{ loading ? (locale.locale === 'en' ? 'Creating Account…' : 'جاري إنشاء الحساب…') : locale.t('auth.register_btn') }}
          </button>
        </form>

        <div class="auth-divider">{{ locale.locale === 'en' ? 'OR' : 'أو' }}</div>

        <div class="auth-footer">
          <p>
            {{ locale.t('auth.have_account') }}
            <router-link to="/login"><strong>{{ locale.t('auth.login_title') }}</strong></router-link>
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.auth-page {
  min-height: 80vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: #f8f9f6;
}

.auth-brand-panel {
  background: #111210;
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  position: relative;
  overflow: hidden;
}

.auth-brand-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #111210 40%, #1a2418 100%);
  z-index: 0;
}

.auth-brand-panel > * {
  position: relative;
  z-index: 1;
}

.brand-panel-logo {
  font: 900 2.5rem/1 Arial;
  letter-spacing: -0.08em;
  margin-bottom: 1.5rem;
}

.brand-panel-logo span {
  color: var(--lime);
}

.brand-panel-tagline {
  font-size: 1.3rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 0.75rem;
  line-height: 1.4;
}

.brand-panel-desc {
  color: #a4a79e;
  font-size: 0.9rem;
  text-align: center;
  max-width: 320px;
  line-height: 1.6;
}

.brand-features {
  margin-top: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.brand-feature {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.88rem;
  color: #c8cbc2;
}

.brand-feature-icon {
  width: 2rem;
  height: 2rem;
  background: rgba(213, 251, 82, 0.12);
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.auth-form-panel {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem 2rem;
}

.auth-box {
  width: 100%;
  max-width: 440px;
  animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.auth-header {
  text-align: start;
  margin-bottom: 1.75rem;
}

.auth-header h1 {
  margin: 0 0 0.5rem;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.auth-header p {
  color: #666;
  font-size: 0.88rem;
  line-height: 1.6;
  margin: 0;
}

.auth-error {
  background: var(--error-bg, #ffebee);
  color: #c62828;
  border: 1px solid #ffcdd2;
  border-left: 4px solid #c62828;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm, 4px);
  font-size: 0.88rem;
  margin-bottom: 1.5rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.auth-form label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
}

.auth-form input[type='email'],
.auth-form input[type='password'],
.auth-form input[type='text'],
.auth-form input[type='tel'] {
  padding: 0.85rem 1rem;
  border: 1.5px solid #ddd;
  border-radius: var(--radius-sm, 4px);
  font-size: 0.95rem;
  background: #fafaf8;
  transition: all 0.2s ease;
}

.auth-form input:focus {
  outline: none;
  border-color: var(--ink, #111);
  background: #fff;
  box-shadow: 0 0 0 3px rgba(17, 18, 16, 0.06);
}

.terms-label {
  flex-direction: row !important;
  align-items: center;
  gap: 0.6rem !important;
  font-size: 0.82rem !important;
  font-weight: normal !important;
  color: #555 !important;
  cursor: pointer;
  margin-top: 0.25rem;
}

.terms-label input[type='checkbox'] {
  accent-color: var(--lime, #d5fb52);
  width: 1.15rem;
  height: 1.15rem;
  flex-shrink: 0;
}

.terms-label a {
  color: var(--ink, #111);
  text-decoration: underline;
  font-weight: 600;
}

.auth-submit-btn {
  min-height: 3.4rem;
  font-size: 1.05rem;
  margin-top: 0.5rem;
  border-radius: var(--radius-sm, 4px);
  letter-spacing: 0.02em;
}

.auth-divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1.25rem 0 0.5rem;
  color: #999;
  font-size: 0.8rem;
}

.auth-divider::before,
.auth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e5e5e0;
}

.auth-footer {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid #eee;
  font-size: 0.9rem;
  color: #555;
}

.auth-footer strong {
  color: var(--ink, #111);
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

@media (max-width: 768px) {
  .auth-page {
    grid-template-columns: 1fr;
    min-height: auto;
  }
  .auth-brand-panel {
    display: none;
  }
  .auth-form-panel {
    padding: 2rem 1.25rem;
    min-height: 80vh;
  }
}

:global([data-theme="dark"]) .auth-box {
  background: #181916 !important;
  border-color: #272924 !important;
  color: #ffffff !important;
}

:global([data-theme="dark"]) .auth-header h1 {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .auth-header p {
  color: #a1a1aa !important;
}

:global([data-theme="dark"]) .auth-form label {
  color: #e4e4e7 !important;
}

:global([data-theme="dark"]) .auth-form input {
  background: #1f211d !important;
  border-color: #383b33 !important;
  color: #ffffff !important;
}

:global([data-theme="dark"]) .terms-label {
  color: #a1a1aa !important;
}

:global([data-theme="dark"]) .terms-label a {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .auth-footer {
  border-color: #272924 !important;
  color: #a1a1aa !important;
}

:global([data-theme="dark"]) .auth-footer strong {
  color: #ffffff !important;
}
</style>
