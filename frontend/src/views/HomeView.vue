<script setup lang="ts">
import { computed } from 'vue'
import { useCatalogStore } from '../stores/catalog'
import ProductCard from '../components/product/ProductCard.vue'

const catalog = useCatalogStore()
const latest = computed(() => catalog.products.slice(0, 4))
const collections = [
  { label: 'MEN', slug: 'men', image: '/reference/men.jpg' },
  { label: 'WOMEN', slug: 'women', image: '/reference/women.jpg' },
  { label: 'T-SHIRTS', slug: 't-shirts', image: '/campaign/sculptural-sportswear.webp' },
  { label: 'SHORTS', slug: 'shorts', image: '/campaign/cairo-dawn.webp' },
]
function categoryLink(slug: string) {
  return { path: '/shop', query: { category: slug } }
}
</script>

<template>
  <div class="sport-home" dir="ltr">
    <section class="sport-hero">
      <img src="/campaign/sculptural-sportswear.webp" alt="Studio Active sportswear collection" fetchpriority="high" />
      <div class="hero-copy">
        <p>MOVE. TRAIN. REPEAT.<br />/ <br />MOVE WITH PURPOSE<br />/ <br />BUILT FOR<br />EVERY MOTION</p>
        <h1>FEEL<br />THE<br /><span>MOVE</span></h1>
        <router-link to="/shop" class="hero-cta" aria-label="Shop all products">SHOP NOW <span>→</span></router-link>
      </div>
      <div class="hero-foot"><strong>PUSH<br />YOUR LIMITS</strong><span>WINTER COLLECTION</span><strong>DROP 01<br />MOVE WITH<br />PURPOSE</strong></div>
    </section>

    <section class="collection-intro">
      <h2><i></i> SHOP BY COLLECTION <i></i></h2>
      <p>luxury collection waiting for you</p>
    </section>

    <section class="collection-grid" aria-label="Shop by collection">
      <router-link v-for="collection in collections" :key="collection.slug" :to="categoryLink(collection.slug)" class="collection-card">
        <img :src="collection.image" :alt="collection.label" loading="lazy" />
        <span>{{ collection.label }}</span>
        <b>→</b>
      </router-link>
    </section>

    <section class="featured">
      <div class="section-title"><h2>NEW ARRIVALS</h2><router-link to="/shop?collection=latest">VIEW ALL →</router-link></div>
      <p v-if="catalog.loading">Loading collection…</p>
      <div v-else-if="catalog.status" role="alert">{{ catalog.status }}</div>
      <div v-else class="product-grid"><ProductCard v-for="product in latest" :key="product.id" :product="product" /></div>
    </section>

    <section class="story-banner">
      <div><p>THE STUDIO ACTIVE EDIT</p><h2>BUILT FOR<br /><span>EVERY MOTION.</span></h2><router-link class="hero-cta" to="/shop">EXPLORE THE EDIT →</router-link></div>
    </section>

    <nav class="mobile-actions" aria-label="Quick navigation">
      <router-link to="/shop">▦<span>Shop</span></router-link>
      <router-link to="/shop?favorites=true">♡<span>Wishlist</span></router-link>
      <router-link to="/cart">🛒<span>Cart</span></router-link>
      <router-link to="/login">♙<span>Account</span></router-link>
      <button type="button" @click="$router.push('/shop')">⌕<span>Search</span></button>
    </nav>
  </div>
</template>

<style scoped>
.sport-home{width:100%;background:#fff;color:#111}.sport-hero{position:relative;width:100%;height:474px;overflow:hidden;background:#2a2a2a}.sport-hero>img{width:100%;height:100%;display:block;object-fit:cover;object-position:center}.hero-copy{position:absolute;z-index:2;left:22px;top:70px;width:calc(100% - 44px);color:#fff}.hero-copy p{width:210px;margin:0;font-size:11px;line-height:1.7;font-weight:800}.hero-copy h1{position:absolute;left:82px;top:170px;margin:0;font-size:92px;line-height:.82;font-weight:900;letter-spacing:-5px;color:#fff}.hero-copy h1 span{display:block;color:#d35a28}.hero-copy .hero-cta{position:absolute;left:36%;top:310px}.hero-cta{display:inline-flex;align-items:center;justify-content:center;gap:28px;background:#fa5a21;color:#111;font-size:16px;font-weight:900;padding:13px 30px;border-radius:7px}.hero-cta span{font-size:24px}.hero-foot{position:absolute;z-index:2;left:22px;right:22px;bottom:16px;display:flex;justify-content:space-between;align-items:flex-end;color:#fff}.hero-foot strong{font-size:28px;line-height:.92}.hero-foot span{position:absolute;left:50%;transform:translateX(-50%);font-size:14px;font-weight:800}.collection-intro{text-align:center;padding:14px 16px 8px}.collection-intro h2{display:flex;justify-content:center;align-items:center;gap:18px;margin:0;font-size:22px}.collection-intro i{width:48px;height:2px;background:#d35a28}.collection-intro p{margin:10px 0 0;font-size:15px;font-style:italic}.collection-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:28px;padding:20px clamp(18px,4vw,55px)}.collection-card{position:relative;height:260px;overflow:hidden;background:#eee}.collection-card:after{content:'';position:absolute;inset:45% 0 0;background:linear-gradient(transparent,#111b)}.collection-card img{width:100%;height:100%;object-fit:cover}.collection-card span{position:absolute;z-index:1;bottom:18px;left:15px;color:#fff;font-size:18px;font-weight:900}.collection-card b{position:absolute;z-index:1;right:15px;bottom:15px;color:#fff;font-size:23px}.featured{max-width:1100px;margin:auto;padding:35px clamp(18px,4vw,55px)}.section-title{display:flex;justify-content:space-between}.section-title h2{margin:0;font-size:24px}.section-title a{font-size:11px;font-weight:900;text-decoration:underline}.product-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:20px}.story-banner{min-height:360px;display:flex;align-items:center;padding:50px 9%;background:linear-gradient(90deg,#16191b99,#16191b22),url('/campaign/cairo-dawn.webp') center/cover;color:#fff}.story-banner h2{font-size:68px;line-height:.9}.story-banner h2 span{color:#fa5a21}.mobile-actions{display:none}
@media(max-width:767px){.sport-hero{height:490px}.hero-copy{left:16px;top:40px;width:calc(100% - 32px)}.hero-copy p{width:150px;font-size:8px}.hero-copy h1{left:18px;top:150px;font-size:64px}.hero-copy .hero-cta{left:180px;top:318px}.hero-cta{font-size:14px;padding:11px 20px}.hero-foot{left:16px;right:16px}.hero-foot strong{font-size:16px}.hero-foot span{font-size:8px}.collection-intro h2{font-size:19px}.collection-grid{grid-template-columns:repeat(2,1fr);gap:10px;padding:18px 10px}.collection-card{height:220px}.featured{padding:30px 16px}.product-grid{grid-template-columns:repeat(2,1fr);gap:12px}.story-banner{min-height:300px}.story-banner h2{font-size:48px}.mobile-actions{display:grid;position:fixed;z-index:30;grid-template-columns:repeat(5,1fr);bottom:0;left:0;right:0;background:#fff;border-top:1px solid #ddd;padding:7px 4px}.mobile-actions a,.mobile-actions button{display:flex;flex-direction:column;align-items:center;border:0;background:none;font-size:20px}.mobile-actions span{font-size:10px}}
</style>
