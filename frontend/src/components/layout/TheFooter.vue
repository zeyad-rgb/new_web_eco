<script setup lang="ts">
import { computed } from 'vue'
import { useLocaleStore } from '../../stores/locale'

const locale = useLocaleStore()
const en = computed(() => locale.locale === 'en')
</script>

<template>
<footer class="cap-footer" :dir="en ? 'ltr' : 'rtl'">
 <router-link to="/" class="footer-brand" aria-label="Studio Active home">STUDIO ACTIVE</router-link>
 <nav :aria-label="en ? 'Footer navigation' : 'روابط الموقع'">
  <router-link to="/shop">{{ en ? 'SHOP' : 'المتجر' }}</router-link>
  <router-link to="/faq">{{ en ? 'CONTACT & HELP' : 'تواصل ومساعدة' }}</router-link>
  <router-link to="/about">{{ en ? 'ABOUT US' : 'من نحن' }}</router-link>
  <router-link to="/login">{{ en ? 'MY ACCOUNT' : 'حسابي' }}</router-link>
 </nav>
 <p>{{ en ? 'Copyright © 2026 — Studio Active' : 'جميع الحقوق محفوظة © ٢٠٢٦ — Studio Active' }}</p>
 <div class="cap-legal">
  <router-link to="/shipping">{{ en ? 'Shipping' : 'الشحن' }}</router-link>
  <router-link to="/returns">{{ en ? 'Returns' : 'الاسترجاع' }}</router-link>
  <router-link to="/privacy">{{ en ? 'Privacy' : 'الخصوصية' }}</router-link>
  <router-link to="/admin">{{ en ? 'Staff portal' : 'بوابة الموظفين' }}</router-link>
 </div>
</footer>
</template>
<style scoped>
.cap-footer{background:#111;color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:42px 20px 24px;gap:28px;border:0;min-height:310px}.footer-brand{font:900 20px Arial;letter-spacing:.12em}.cap-footer nav{display:flex;gap:25px;flex-wrap:wrap;justify-content:center;font:700 12px Arial,sans-serif}.cap-footer p{color:#888;font:11px Arial,sans-serif;margin:15px 0 0}.cap-legal{display:flex;gap:20px;font-size:10px;color:#888}.cap-footer a:hover{text-decoration:underline}@media(max-width:767px){.cap-footer{min-height:300px;gap:26px}.cap-footer nav{font-size:9px;gap:18px}}
</style>
