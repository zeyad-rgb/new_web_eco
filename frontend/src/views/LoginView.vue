<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useUIStore } from '../stores/ui'
import { useLocaleStore } from '../stores/locale'

const router = useRouter()
const auth = useAuthStore()
const ui = useUIStore()
const locale = useLocaleStore()

const email = ref('')
const password = ref('')
const rememberMe = ref(true)
const loading = ref(false)
const error = ref('')

onMounted(async () => {
  await auth.fetchCsrfToken()
  if (auth.staffSession?.signedIn) {
    const target = router.currentRoute.value.query.redirect
    await router.replace(typeof target === 'string' && target.startsWith('/admin/') ? target : '/admin/dashboard')
  } else if (auth.user?.role === 'customer') {
    try { if (await auth.refreshCustomer()) await router.replace('/profile') } catch { auth.user = null }
  }
})

async function handleLogin() {
  email.value = email.value.trim()
  if (!email.value || !password.value) return
  loading.value = true
  error.value = ''
  try {
    // 1. Ensure fresh CSRF token & check active session
    const csrf = await auth.fetchCsrfToken()

    // 2. If already signed in as staff, redirect directly
    if (auth.isStaff) {
      const redirect = (router.currentRoute.value.query.redirect as string) || '/admin/dashboard'
      await router.replace(redirect)
      return
    }

    // 3. Dispatch login with CSRF and credentials
    const staffResponse = await fetch('/staff/dispatch-login', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrf || auth.csrfToken,
      },
      credentials: 'include',
      body: JSON.stringify({ email: email.value, password: password.value }),
    })
    const staffResult = await staffResponse.json()
    if (!staffResponse.ok) throw new Error(staffResult.message || (locale.locale === 'en' ? 'Invalid email or password.' : 'بيانات الدخول غير صحيحة.'))

    // 4. Staff login → save server CSRF token in auth store & open admin
    if (staffResult.type === 'staff') {
      auth.loginAsStaff(email.value, staffResult.role || 'admin', staffResult.csrf)
      password.value = ''
      ui.showToast(
        locale.locale === 'en' ? 'Welcome back! Opening control panel…' : 'مرحباً بعودتك! جاري فتح لوحة التحكم…',
        'success',
        '⚡'
      )
      const redirect = (router.currentRoute.value.query.redirect as string) || '/admin/dashboard'
      await router.replace(redirect)
      return
    }

    // 5. Customer login → authenticated customer session token
    auth.acceptCustomer(staffResult.user, staffResult.csrf)
    password.value = ''
    ui.showToast(
      locale.locale === 'en' ? 'Welcome back! Happy shopping 🛍' : 'مرحباً بعودتك! تسوق ممتع 🛍',
      'success',
      '👋'
    )
    router.push('/profile')
  } catch (err) {
    error.value = err instanceof Error ? err.message : (locale.locale === 'en' ? 'Login failed.' : 'فشل تسجيل الدخول.')
  } finally {
    loading.value = false
  }
}

function handleForgot() {
  ui.showToast(locale.locale === 'en' ? 'Password recovery is not connected yet. Please contact store support.' : 'استعادة كلمة المرور غير مفعلة حاليًا. تواصل مع دعم المتجر.', 'info')
}

</script>

<template>
  <section class="auth-page" aria-labelledby="page-title">
    <!-- Brand Panel (Desktop) -->
    <div class="auth-brand-panel">
      <div class="brand-panel-logo" dir="ltr">STUDIO<span>ACTIVE</span></div>
      <p class="brand-panel-tagline">
        <template v-if="locale.locale === 'en'">
          WELCOME BACK TO<br/>THE ATHLETES CLUB.
        </template>
        <template v-else>
          مرحباً بعودتك<br/>إلى نادي الأبطال.
        </template>
      </p>
      <p class="brand-panel-desc">
        {{ locale.locale === 'en' ? 'Sign in to track your shipments, earn club points, and access member-exclusive activewear drops.' : 'سجّل دخولك لمتابعة طلباتك، كسب نقاط المكافآت، والاستمتاع بعروض حصرية للأعضاء.' }}
      </p>
      <div class="brand-features">
        <div class="brand-feature">
          <span class="brand-feature-icon">🏆</span>
          <span>{{ locale.locale === 'en' ? 'Earn reward points with every purchase' : 'اكسب نقاط مع كل طلب واستبدلها بخصومات' }}</span>
        </div>
        <div class="brand-feature">
          <span class="brand-feature-icon">🚚</span>
          <span>{{ locale.locale === 'en' ? 'Free express shipping on orders over 800 EGP' : 'شحن مجاني للأعضاء فوق ٨٠٠ جنيه' }}</span>
        </div>
        <div class="brand-feature">
          <span class="brand-feature-icon">⚡</span>
          <span>{{ locale.locale === 'en' ? 'Early access to limited edition drops' : 'وصول مبكر للتشكيلات الجديدة' }}</span>
        </div>
      </div>
    </div>

    <!-- Form Panel -->
    <div class="auth-form-panel">
      <div class="auth-box">
        <div class="auth-header">
          <h1 id="page-title">{{ locale.t('auth.login_title') }}</h1>
          <p>{{ locale.t('auth.login_subtitle') }}</p>
        </div>

        <div v-if="error" class="auth-error" role="alert">
          {{ error }}
        </div>

        <form class="auth-form" @submit.prevent="handleLogin">
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
            {{ locale.t('auth.password') }}
            <input
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
              placeholder="••••••••"
            />
          </label>

          <div class="auth-options">
            <label class="remember-label">
              <input v-model="rememberMe" type="checkbox" />
              <span>{{ locale.t('auth.remember_me') }}</span>
            </label>

            <button type="button" class="forgot-link-btn" @click="handleForgot">
              {{ locale.t('auth.forgot_password') }}
            </button>
          </div>

          <button type="submit" class="primary wide auth-submit-btn" :disabled="loading">
            {{ loading ? (locale.locale === 'en' ? 'Verifying…' : 'جاري التحقق…') : locale.t('auth.sign_in_btn') }}
          </button>
        </form>

        <div class="auth-divider">{{ locale.locale === 'en' ? 'OR' : 'أو' }}</div>

        <div class="auth-footer">
          <p>
            {{ locale.t('auth.no_account') }}
            <router-link to="/register"><strong>{{ locale.t('auth.register_title') }}</strong></router-link>
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
  max-width: 420px;
  animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.auth-header {
  text-align: start;
  margin-bottom: 2rem;
}

.auth-header h1 {
  margin: 0 0 0.5rem;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.auth-header p {
  color: #666;
  font-size: 0.9rem;
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
  gap: 1.25rem;
}

.auth-form label {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
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

.auth-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.82rem;
}

.remember-label {
  flex-direction: row !important;
  align-items: center;
  gap: 0.5rem !important;
  font-weight: normal !important;
  cursor: pointer;
}

.remember-label input[type=checkbox] {
  accent-color: var(--lime, #d5fb52);
  width: 1.1rem;
  height: 1.1rem;
}

.forgot-link,
.forgot-link-btn {
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  font-size: 0.82rem;
  color: #666;
  text-decoration: underline;
  text-underline-offset: 0.2em;
  cursor: pointer;
  transition: color 0.15s ease;
}

.forgot-link-btn:hover {
  color: var(--ink, #111);
}

.auth-submit-btn {
  min-height: 3.4rem;
  font-size: 1.05rem;
  margin-top: 0.75rem;
  border-radius: var(--radius-sm, 4px);
  letter-spacing: 0.02em;
}

.auth-divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 0.5rem 0;
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
  margin-top: 2rem;
  padding-top: 1.5rem;
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

:global([data-theme="dark"]) .forgot-link-btn {
  color: #a1a1aa !important;
}

:global([data-theme="dark"]) .forgot-link-btn:hover {
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
