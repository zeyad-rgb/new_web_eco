<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCartStore } from '../../stores/cart'
import { useLocaleStore } from '../../stores/locale'
import { useCatalogStore } from '../../stores/catalog'
import { useAuthStore } from '../../stores/auth'
import SearchOverlay from '../navigation/SearchOverlay.vue'
const cart = useCartStore()
const locale = useLocaleStore()
const catalog = useCatalogStore()
const route = useRoute()
const auth = useAuthStore()
// Send signed-in people straight to their own area instead of /login (which used to
// render first and redirect only after a network round-trip).
const accountLink = computed(() => {
  const role = auth.staffSession?.signedIn ? auth.staffSession.role : auth.user?.role
  if (role === 'admin' || role === 'catalog_manager') return '/admin/dashboard'
  if (role === 'customer') return '/profile'
  return '/login'
})
const open = ref(false)
const search = ref(false)
const activeCategory = ref<string | null>(null)

const topCategories = computed(() => catalog.rootCategories)

function categoryName(category: { slug: string; name: string }) {
  return locale.getCategoryName(category as any)
}

function childCategories(parentSlug: string) {
  return catalog.categories.filter((category) => category.parent_slug === parentSlug)
}

function openMegaMenu(categorySlug: string) {
  activeCategory.value = categorySlug
}

function closeMegaMenu() {
  activeCategory.value = null
}

function formatWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('01') && digits.length === 11) return '2' + digits
  if (digits.startsWith('0020')) return digits.slice(2)
  if (digits.startsWith('20') && digits.length === 12) return digits
  return digits
}

const whatsappUrl = computed(() => {
  const phone = formatWhatsAppPhone(catalog.whatsappSettings.support_phone || '')
  const text = catalog.whatsappSettings.welcome_message || 'Hello'
  return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : ''
})

onMounted(() => {
  void catalog.load()
})

watch(() => route.fullPath, () => { open.value = false; search.value = false; closeMegaMenu() })
function closeMenu(event: KeyboardEvent) { if(event.key === 'Escape') open.value = false }
</script>
<template>
<div class="utility-bar" dir="ltr">
 <strong>{{ catalog.storefrontSettings.announcement_text }}</strong>
 <a v-if="catalog.storefrontSettings.location_url" class="visit-link" :href="catalog.storefrontSettings.location_url" target="_blank" rel="noopener noreferrer">⌖ &nbsp;{{ catalog.storefrontSettings.visit_label }}</a>
 <button v-else class="visit-link" type="button">⌖ &nbsp;{{ catalog.storefrontSettings.visit_label }}</button>
 <button
  class="language-button"
  type="button"
  :aria-label="locale.locale === 'en' ? 'التبديل إلى العربية' : 'Switch to English'"
  @click="locale.toggleLocale()"
 >{{ locale.locale === 'en' ? 'العربية' : 'English' }}</button>
</div>
<header class="cap-header" dir="ltr" @keydown="closeMenu">
 <button class="cap-menu-button" aria-label="Open menu" :aria-expanded="open" aria-controls="cap-navigation" @click="open = !open"><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M2 5h20M2 12h20M2 19h20" /></svg></button>
 <router-link to="/" class="cap-logo" aria-label="Studio Active home"><span class="logo-mark">SA</span><span class="logo-type">STUDIO<br /><b>ACTIVE</b></span></router-link>
 <nav class="category-nav" aria-label="Shop categories" @mouseleave="closeMegaMenu">
  <router-link to="/" class="category-link">HOME</router-link>
  <button
    v-for="category in topCategories"
    :key="category.slug"
    type="button"
    class="category-link mega-trigger"
    :class="{ active: activeCategory === category.slug }"
    @mouseenter="openMegaMenu(category.slug)"
    @focus="openMegaMenu(category.slug)"
    @click="openMegaMenu(activeCategory === category.slug ? '' : category.slug)"
  >{{ categoryName(category).toUpperCase() }}</button>
  <router-link to="/faq" class="category-link">CONTACT</router-link>

  <div v-if="activeCategory" class="mega-menu" @mouseenter="openMegaMenu(activeCategory)">
   <div class="mega-columns">
    <section
      v-for="group in childCategories(activeCategory)"
      :key="group.slug"
      class="mega-column"
    >
     <router-link :to="{ path: '/shop', query: { category: group.slug } }" class="mega-heading">
      {{ categoryName(group).toUpperCase() }}
     </router-link>
     <router-link
      v-for="item in childCategories(group.slug)"
      :key="item.slug"
      :to="{ path: '/shop', query: { category: item.slug } }"
     >{{ categoryName(item) }}</router-link>
    </section>
   </div>
   <router-link class="mega-all" :to="{ path: '/shop', query: { category: activeCategory } }">
    Shop all {{ categoryName(topCategories.find(c => c.slug === activeCategory) as any) }} →
   </router-link>
  </div>
 </nav>
 <div class="cap-tools">
  <button class="cap-desktop-tool" aria-label="Search" @click="search = true"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></svg></button>
  <router-link class="cap-desktop-tool" :to="accountLink" aria-label="My account"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/></svg></router-link>
  <button class="cap-bag" aria-label="Shopping bag" @click="cart.toggleDrawer(true)"><svg width="21" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 5h14l1 16H4L5 5Z"/><path d="M9 4v5a3 3 0 0 0 6 0V4"/></svg><b v-if="cart.count">{{ cart.count }}</b></button>
 </div>
</header>
<div v-if="open" class="cap-menu-backdrop" @click.self="open = false">
 <nav id="cap-navigation" class="cap-navigation" aria-label="Main navigation">
  <button class="cap-close" aria-label="Close menu" @click="open = false">×</button>
  <router-link to="/">HOME</router-link><router-link to="/shop">SHOP ALL</router-link>
  <router-link to="/shop?category=men">MEN</router-link><router-link to="/shop?category=women">WOMEN</router-link><router-link to="/shop?category=kids">KIDS</router-link>
  <router-link to="/shop?collection=latest">NEW DROP</router-link><router-link :to="accountLink">MY ACCOUNT</router-link>
  <button @click="open = false; search = true">SEARCH</button>
  <button @click="locale.toggleLocale()">{{ locale.locale === 'en' ? 'العربية' : 'English' }}</button>
 </nav>
</div>
<SearchOverlay :open="search" @close="search = false" />
<a v-if="catalog.whatsappSettings.enabled && whatsappUrl"
   class="whatsapp-fab"
   :href="whatsappUrl"
   target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp">
  <span class="whatsapp-label" dir="ltr">Chat with us</span>
  <span class="whatsapp-icon">
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path fill="#fff" d="M32 6C17.64 6 6 17.64 6 32c0 5.05 1.45 9.77 3.95 13.76L6.2 58l12.5-3.68A25.84 25.84 0 0 0 32 58c14.36 0 26-11.64 26-26S46.36 6 32 6Zm0 47.18a21.1 21.1 0 0 1-10.77-2.94l-.77-.46-7.42 2.18 2.2-7.23-.5-.74A21.13 21.13 0 1 1 32 53.18Zm11.86-15.75c-.65-.32-3.84-1.89-4.44-2.11-.59-.21-1.02-.32-1.45.32-.43.65-1.67 2.11-2.05 2.54-.38.43-.76.48-1.41.16-.65-.32-2.74-1.01-5.22-3.22a19.5 19.5 0 0 1-3.61-4.49c-.38-.65-.04-1 .29-1.32.29-.29.65-.76.97-1.14.32-.38.43-.65.65-1.08.21-.43.11-.81-.05-1.14-.16-.32-1.45-3.49-1.99-4.78-.52-1.25-1.05-1.08-1.45-1.1h-1.24c-.43 0-1.14.16-1.73.81-.59.65-2.27 2.22-2.27 5.41s2.32 6.28 2.65 6.71c.32.43 4.57 6.98 11.08 9.79 1.55.67 2.76 1.07 3.7 1.37 1.55.49 2.96.42 4.08.26 1.24-.19 3.84-1.57 4.38-3.09.54-1.51.54-2.81.38-3.09-.16-.27-.59-.43-1.24-.75Z"/>
    </svg>
  </span>
</a>
</template>
<style scoped>
.utility-bar{height:40px;background:#d35a28;color:#20150f;position:relative;display:flex;align-items:center;justify-content:center;font-size:12px}.utility-bar strong{font-weight:800}.utility-bar .visit-link{position:absolute;right:10.5%;top:50%;transform:translateY(-50%);border:0;background:none;color:inherit;font-size:12px;text-decoration:none}.utility-bar .language-button{position:absolute;right:3.5%;top:50%;transform:translateY(-50%);border:0;background:none;color:inherit;font-size:12px}.whatsapp-fab{position:fixed;right:22px;bottom:22px;width:58px;height:58px;border-radius:29px;background:#25d366;color:#fff;display:grid;place-items:center;z-index:100;box-shadow:0 7px 18px #0002;overflow:hidden;direction:ltr;transition:width .32s cubic-bezier(.22,.75,.28,1),border-radius .32s,transform .18s ease,box-shadow .18s ease;animation:whatsappEntrance .55s .15s both}.whatsapp-fab:hover{width:230px;transform:translateY(-2px);box-shadow:0 10px 24px #0002}.whatsapp-icon{position:absolute;right:0;top:0;width:58px;height:58px;border-radius:29px;display:grid;place-items:center}.whatsapp-icon svg{width:38px;height:38px;fill:#fff}.whatsapp-label{position:absolute;left:28px;top:50%;transform:translate(-8px,-50%);font-size:20px;font-weight:800;white-space:nowrap;opacity:0;transition:opacity .14s ease .08s,transform .28s cubic-bezier(.22,.75,.28,1)}.whatsapp-fab:hover .whatsapp-label{opacity:1;transform:translate(0,-50%)}.whatsapp-fab:active{transform:scale(.96)}@keyframes whatsappEntrance{0%{opacity:0;transform:translateY(16px) scale(.82)}65%{transform:translateY(-2px) scale(1.03)}100%{opacity:1;transform:none}}.cap-header{width:100%;height:95px;background:#fff;color:#161616;display:grid;grid-template-columns:190px 1fr 190px;align-items:center;padding:0 3%;position:relative;z-index:40;border-bottom:1px solid #eee}.cap-header button{background:none;color:inherit;border:0;padding:8px}.cap-menu-button{display:none}.cap-logo{grid-column:1;display:flex;align-items:center;justify-content:flex-start;gap:7px}.logo-mark{width:54px;height:54px;flex:none;background:#d35a28;border:4px solid #111;border-radius:50%;display:grid;place-items:center;color:#111;font:900 25px/1 Arial}.logo-type{font:900 10px/1 Arial;letter-spacing:.12em;text-align:left}.logo-type b{font-size:12px}.category-nav{grid-column:2;display:flex;align-items:center;justify-content:center;gap:clamp(22px,3.2vw,48px);white-space:nowrap}.category-nav a,.category-link{font-size:16px;font-weight:500}.category-nav button.category-link{border:0;background:none;color:inherit;font:inherit;padding:10px 0}.category-link.active{text-decoration:underline;text-underline-offset:8px}.mega-menu{position:absolute;top:95px;left:0;width:100vw;height:360px;background:#fff;color:#111;border-top:1px solid #e2e2e2;border-bottom:1px solid #e2e2e2;box-shadow:0 12px 24px #0002;padding:28px 4%;z-index:80}.mega-columns{display:grid;grid-template-columns:repeat(5,minmax(150px,1fr));gap:28px}.mega-column{display:flex;flex-direction:column;align-items:flex-start;gap:8px}.mega-heading{font-weight:900!important;margin-bottom:6px}.mega-column>a{font-size:13px}.mega-column>a:hover{text-decoration:underline}.mega-all{display:inline-block;margin-top:24px;font-size:12px;font-weight:900;text-decoration:underline}.category-nav a.router-link-active{text-decoration:underline;text-underline-offset:6px}.cap-tools{grid-column:3;justify-self:end;display:flex;align-items:center;gap:18px}.cap-tools button,.cap-tools a{display:grid;place-items:center}.cap-bag{position:relative}.cap-bag b{position:absolute;top:0;right:-4px;background:#111;color:#fff;border-radius:50%;font-size:10px;padding:2px 5px}.cap-menu-backdrop{position:fixed;inset:0;background:#0008;z-index:80}.cap-navigation{height:100%;width:min(360px,90vw);background:#111;color:white;display:flex;flex-direction:column;padding:65px 28px}.cap-navigation>a,.cap-navigation>button{padding:16px 0;border:0;border-bottom:1px solid #333;background:none;color:white;text-align:left;font-size:13px}.cap-navigation .cap-close{position:absolute;right:22px;top:10px;font-size:32px;border:0}.category-nav a:last-child{display:inline}
@media(prefers-reduced-motion:reduce){.whatsapp-fab{animation:none}.whatsapp-fab,.whatsapp-label{transition:none}}
@media(max-width:1000px){.cap-header{grid-template-columns:150px 1fr 150px;padding:0 2%}.category-nav{gap:18px}.category-nav a{font-size:13px}}
@media(max-width:767px){.whatsapp-fab{right:14px;bottom:80px;width:56px;height:56px}.whatsapp-fab:hover{width:56px;border-radius:28px;transform:none}.whatsapp-fab:hover .whatsapp-label{display:none}.whatsapp-icon{width:56px;height:56px}.whatsapp-icon svg{width:32px;height:32px}.utility-bar{height:auto;min-height:40px;gap:.75rem;padding-inline:12px;justify-content:space-between}.utility-bar strong{flex:1;text-align:center;font-size:11px}.utility-bar .visit-link,.utility-bar .language-button{position:static;transform:none;inset:auto;white-space:nowrap}.utility-bar strong{display:none}.utility-bar span{left:18px;right:auto}.utility-bar button{right:14px}.cap-header{height:68px;grid-template-columns:68px 1fr 68px;padding:0 4%}.cap-menu-button{display:grid;grid-column:1;place-items:center}.cap-logo{grid-column:2;justify-self:center}.logo-mark{width:42px;height:42px;font-size:19px}.logo-type{display:none}.category-nav{display:none}.cap-tools{grid-column:3;gap:0}.cap-tools .cap-desktop-tool{display:none}}
</style>
