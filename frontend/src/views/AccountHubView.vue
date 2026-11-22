<script setup lang="ts">
import { useAuthStore } from '../stores/auth'
import { useLocaleStore } from '../stores/locale'

const auth = useAuthStore()
const locale = useLocaleStore()
const isEnglish = () => locale.locale === 'en'
</script>

<template>
  <main class="account-hub" :dir="locale.isRTL ? 'rtl' : 'ltr'">
    <header class="hub-heading">
      <p class="eyebrow">{{ isEnglish() ? 'STUDIO ACTIVE · YOUR SPACE' : 'ستوديو أكتيف · حسابك' }}</p>
      <h1>{{ isEnglish() ? `Welcome, ${auth.user?.name || 'member'}` : `أهلاً ${auth.user?.name || 'بك'}` }}</h1>
      <p>{{ isEnglish() ? 'Choose where you want to go next.' : 'اختار تحب تروح لأنهي صفحة.' }}</p>
    </header>

    <section class="hub-options" :aria-label="isEnglish() ? 'Account destinations' : 'اختيارات الحساب'">
      <router-link class="hub-card" to="/profile">
        <span class="hub-icon" aria-hidden="true">♙</span>
        <span><strong>{{ isEnglish() ? 'My membership' : 'عضويتي' }}</strong><small>{{ isEnglish() ? 'Profile, orders and account details' : 'الملف الشخصي والطلبات وبيانات الحساب' }}</small></span>
        <span class="hub-arrow" aria-hidden="true">→</span>
      </router-link>

      <router-link class="hub-card" to="/shop">
        <span class="hub-icon" aria-hidden="true">▦</span>
        <span><strong>{{ isEnglish() ? 'Continue shopping' : 'كمّل تسوق' }}</strong><small>{{ isEnglish() ? 'Browse products and collections' : 'تصفح المنتجات والـcollections' }}</small></span>
        <span class="hub-arrow" aria-hidden="true">→</span>
      </router-link>

      <router-link class="hub-card admin-card" to="/admin/dashboard">
        <span class="hub-icon" aria-hidden="true">⌘</span>
        <span><strong>{{ isEnglish() ? 'Admin workspace' : 'لوحة الإدارة' }}</strong><small>{{ isEnglish() ? 'Staff sign-in required' : 'تسجيل دخول الموظفين مطلوب' }}</small></span>
        <span class="hub-arrow" aria-hidden="true">→</span>
      </router-link>
    </section>

    <button class="hub-logout" type="button" @click="auth.logout(); $router.replace('/')">
      {{ isEnglish() ? 'Sign out' : 'تسجيل الخروج' }}
    </button>
  </main>
</template>

<style scoped>
.account-hub{max-width:980px;min-height:65vh;margin:auto;padding:clamp(2rem,7vw,5rem) 1.25rem;color:var(--ink,#111);}
.hub-heading{margin-bottom:2rem}.eyebrow{font-size:.75rem;font-weight:800;letter-spacing:.16em;color:#68705d}.hub-heading h1{font-size:clamp(2rem,6vw,3.6rem);margin:.5rem 0}.hub-heading>p:last-child{color:#64685f}
.hub-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.8rem}.hub-card{min-height:175px;padding:1.2rem;display:flex;flex-direction:column;align-items:flex-start;justify-content:space-between;gap:1.2rem;text-decoration:none;color:inherit;background:#f4f5f0;border:1px solid #e1e3dc;transition:transform .18s ease,border-color .18s ease}.hub-card:hover,.hub-card:focus-visible{transform:translateY(-3px);border-color:#111}.hub-icon{font-size:1.5rem}.hub-card strong,.hub-card small{display:block}.hub-card strong{font-size:1.1rem}.hub-card small{margin-top:.35rem;color:#666b60;line-height:1.45}.hub-arrow{align-self:flex-end;font-size:1.25rem}.admin-card{background:#171914;color:#fff;border-color:#171914}.admin-card small{color:#c3c7bd}.admin-card:hover,.admin-card:focus-visible{border-color:#c8ff00}.hub-logout{margin-top:1.5rem;padding:.7rem 1rem;background:transparent;border:1px solid #aaa;cursor:pointer}
@media(max-width:700px){.hub-options{grid-template-columns:1fr}.hub-card{min-height:130px;flex-direction:row;justify-content:flex-start;align-items:center}.hub-card>span:nth-child(2){flex:1}.hub-arrow{align-self:center}}
:global([data-theme="dark"]) .account-hub{color:#f5f5f5}:global([data-theme="dark"]) .hub-card{background:#161616;color:#f5f5f5;border-color:#333}:global([data-theme="dark"]) .hub-card small{color:#b5b5b5}:global([data-theme="dark"]) .admin-card{background:#20221e}
</style>
