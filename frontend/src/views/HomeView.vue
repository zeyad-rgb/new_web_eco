<script setup lang="ts">
import { computed } from 'vue'
import { useCatalogStore } from '../stores/catalog'
import { useLocaleStore } from '../stores/locale'
import { categoryBranch } from '../taxonomy'
import ProductCard from '../components/product/ProductCard.vue'

const catalog = useCatalogStore()
const locale = useLocaleStore()

// Newest first: products the staff marked as "latest", then the rest.
const latest = computed(() =>
  [...catalog.products]
    .sort((a, b) => Number(b.collections.includes('latest')) - Number(a.collections.includes('latest')))
    .slice(0, 4)
)

// Editorial images for categories we have artwork for; others fall back to a product photo.
const TILE_IMAGES: Record<string, string> = {
  men: '/reference/men',
  women: '/reference/women',
  tees: '/reference/tees',
  shorts: '/reference/shorts',
  bottoms: '/reference/bottoms',
}

/** Two widths so phones download the 640px file instead of the full tile. */
function tileSrcset(base: string): string {
  return base.startsWith('/reference/') ? `${base}@640.webp 640w, ${base}.webp 1000w` : ''
}

/** Number of published products inside a category branch (a parent counts its children). */
function productCount(slug: string): number {
  const branch = categoryBranch(catalog.categories, slug)
  return catalog.products.filter((product) => branch.has(product.categoryId ?? '')).length
}

// Built from the real taxonomy so a tile never lands on an empty shop page.
// Top-level categories first (Men / Women); if too few of those have stock,
// fill up with the deepest categories that do, so the row is never half empty.
const tiles = computed(() => {
  const build = (category: { slug: string; name: string }) => ({
    slug: category.slug,
    label: locale.getCategoryName(category),
    count: productCount(category.slug),
    image: TILE_IMAGES[category.slug] ?? '',
  })
  const stocked = (list: typeof catalog.categories) => list.map(build).filter((tile) => tile.count > 0)

  const roots = stocked(catalog.categories.filter((item) => !item.parent_slug))
  if (roots.length >= 2) return roots.slice(0, 4)

  const leaves = stocked(catalog.categories.filter((item) => item.parent_slug))
    .sort((a, b) => b.count - a.count)
  const seen = new Set(roots.map((tile) => tile.slug))
  return [...roots, ...leaves.filter((tile) => !seen.has(tile.slug))].slice(0, 4)
})

function categoryLink(slug: string) {
  return { path: '/shop', query: { category: slug } }
}
</script>

<template>
  <div class="sport-home" dir="ltr">
    <section class="sport-hero">
      <img
        src="/reference/hero.webp"
        srcset="/reference/hero@640.webp 640w, /reference/hero.webp 1600w"
        sizes="100vw"
        alt="Studio Active training collection"
        fetchpriority="high"
        width="1600"
        height="900"
      />
      <div class="hero-copy">
        <p class="hero-kicker">STUDIO ACTIVE · DROP 01</p>
        <h1>WEAR<br />IT <span>EVERYWHERE</span></h1>
        <router-link to="/shop" class="hero-cta" aria-label="Shop all products">SHOP NOW <span aria-hidden="true">→</span></router-link>
      </div>
      <div class="hero-foot">
        <strong>EVERYDAY ESSENTIALS</strong>
        <span>WINTER 26</span>
        <strong>MADE IN EGYPT</strong>
      </div>
    </section>

    <section v-if="tiles.length" class="collection-intro">
      <h2><i></i> THE DROP <i></i></h2>
      <p>Everyday pieces, built to be worn on repeat.</p>
    </section>

    <section v-if="tiles.length" class="collection-grid" aria-label="Shop by collection">
      <router-link v-for="tile in tiles" :key="tile.slug" :to="categoryLink(tile.slug)" class="collection-card">
        <img
          :src="tile.image ? tile.image + '.webp' : '/reference/tees.webp'"
          :srcset="tileSrcset(tile.image || '/reference/tees')"
          sizes="(max-width: 700px) 50vw, 25vw"
          :alt="tile.label"
          loading="lazy"
          width="1000"
          height="1250"
        />
        <span>{{ tile.label }}</span>
        <b>→</b>
      </router-link>
    </section>

    <section class="featured">
      <div class="section-title"><h2>JUST LANDED</h2><router-link to="/shop?collection=latest">VIEW ALL →</router-link></div>
      <p v-if="catalog.loading">Loading collection…</p>
      <div v-else-if="catalog.status" role="alert">{{ catalog.status }}</div>
      <div v-else class="product-grid"><ProductCard v-for="product in latest" :key="product.id" :product="product" /></div>
    </section>

    <section class="story-banner">
      <div><p>THE STUDIO ACTIVE EDIT</p><h2>OFF DUTY,<br /><span>ON REPEAT.</span></h2><router-link class="hero-cta" to="/shop">SHOP THE EDIT →</router-link></div>
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
.sport-home{width:100%;background:var(--street-paper);color:var(--street-ink)}.sport-hero{position:relative;width:100%;height:474px;overflow:hidden;background:#2a2a2a}.sport-hero>img{width:100%;height:100%;display:block;object-fit:cover;object-position:center}.sport-hero::after{content:'';position:absolute;inset:0;background:linear-gradient(100deg,#0b0b0cd9 0%,#0b0b0c99 42%,#0b0b0c26 100%)}.hero-copy{position:absolute;z-index:2;inset-block:0;inset-inline-start:clamp(18px,5vw,64px);display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:1.1rem;max-width:min(560px,62%);color:#fff}.hero-kicker{margin:0;font-size:.72rem;letter-spacing:.26em;font-weight:800;color:#f0efe9}.hero-copy h1{margin:0;font-size:clamp(3rem,8vw,6rem);line-height:.86;font-weight:900;letter-spacing:-.03em;text-transform:uppercase}.hero-copy h1 span{color:var(--street-clay)}.hero-cta{display:inline-flex;align-items:center;justify-content:center;gap:24px;background:var(--street-ink);color:var(--street-paper);font-size:14px;font-weight:800;letter-spacing:.12em;padding:15px 32px;border-radius:0}.hero-cta span{font-size:24px}.hero-foot{position:absolute;z-index:2;inset-inline:clamp(18px,5vw,64px);bottom:18px;display:flex;justify-content:space-between;align-items:center;gap:1rem;color:#fff;font-size:.7rem;letter-spacing:.16em;font-weight:800;text-transform:uppercase}.hero-foot strong{font-size:.7rem;font-weight:800}@media(max-width:700px){.hero-foot span{display:none}}.collection-intro{text-align:center;padding:14px 16px 8px}.collection-intro h2{display:flex;justify-content:center;align-items:center;gap:18px;margin:0;font-size:20px;letter-spacing:.2em;text-transform:uppercase;font-weight:800}.collection-intro i{width:48px;height:1px;background:var(--street-ink)}.collection-intro p{margin:10px 0 0;font-size:14px;color:var(--street-ink-soft)}.collection-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:28px;padding:20px clamp(18px,4vw,55px)}.collection-card{position:relative;height:260px;overflow:hidden;background:#eee}.collection-card:after{content:'';position:absolute;inset:45% 0 0;background:linear-gradient(transparent,#111b)}.collection-card img{width:100%;height:100%;object-fit:cover}.collection-card span{position:absolute;z-index:1;bottom:18px;inset-inline-start:15px;color:#fff;font-size:15px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.collection-card b{position:absolute;z-index:1;right:15px;bottom:15px;color:#fff;font-size:23px}.featured{max-width:1100px;margin:auto;padding:35px clamp(18px,4vw,55px)}.section-title{display:flex;justify-content:space-between}.section-title h2{margin:0;font-size:24px}.section-title a{font-size:11px;font-weight:900;text-decoration:underline}.product-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:20px}.story-banner{min-height:360px;display:flex;align-items:center;padding:50px 9%;background:linear-gradient(90deg,#0b0b0ce0,#0b0b0c40),url('/reference/women.webp') center/cover;color:#fff}.story-banner h2{font-size:68px;line-height:.9}.story-banner h2 span{color:var(--street-clay)}.mobile-actions{display:none}
@media(max-width:767px){.sport-hero{height:490px}.hero-copy{max-width:none;inset-inline:16px}.hero-cta{font-size:14px;padding:11px 20px}.hero-foot{left:16px;right:16px}.hero-foot strong{font-size:16px}.hero-foot span{font-size:8px}.collection-intro h2{font-size:19px}.collection-grid{grid-template-columns:repeat(2,1fr);gap:10px;padding:18px 10px}.collection-card{height:220px}.featured{padding:30px 16px}.product-grid{grid-template-columns:repeat(2,1fr);gap:12px}.story-banner{min-height:300px}.story-banner h2{font-size:48px}.mobile-actions{display:grid;position:fixed;z-index:30;grid-template-columns:repeat(5,1fr);bottom:0;left:0;right:0;background:#fff;border-top:1px solid #ddd;padding:7px 4px}.mobile-actions a,.mobile-actions button{display:flex;flex-direction:column;align-items:center;border:0;background:none;font-size:20px}.mobile-actions span{font-size:10px}}
</style>
