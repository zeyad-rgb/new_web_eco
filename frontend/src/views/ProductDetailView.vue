<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCatalogStore } from '../stores/catalog'
import { useFreeShippingText } from '../utils/shipping'
import { useCartStore } from '../stores/cart'
import { useFavoritesStore } from '../stores/favorites'
import { useUIStore } from '../stores/ui'
import { useLocaleStore } from '../stores/locale'
import ProductGallery from '../ProductGallery.vue'
import SizeGuideModal from '../components/product/SizeGuideModal.vue'
import ProductCard from '../components/product/ProductCard.vue'
import { formatMoney } from '../utils/money'
import { getColorHex } from '../utils/colors'
import { categoryPath } from '../taxonomy'
import type { Product } from '../types'

const route = useRoute()
const router = useRouter()
const catalog = useCatalogStore()
const freeShippingText = useFreeShippingText()
// Delivery estimate comes from the store settings, so an admin change reaches
// the product page instead of contradicting it (PDP-04).
const deliveryEstimate = computed(() => {
  const days = String(catalog.shippingSettings?.estimated_days || '').trim()
  if (!days) return locale.locale === 'en' ? 'Delivery across Egypt.' : 'التوصيل لكافة المحافظات.'
  return locale.locale === 'en' ? `Delivery within ${days} across Egypt.` : `التوصيل خلال ${days} لكافة المحافظات.`
})
const cart = useCartStore()
const favorites = useFavoritesStore()
const ui = useUIStore()
const locale = useLocaleStore()
const demo = import.meta.env.MODE === 'preview'

const productId = computed(() => route.params.id as string)
const product = computed(() =>
  catalog.products.find((item) => item.id === productId.value)
)

const color = ref('')
const size = ref('')
const sizeGuideOpen = ref(false)

// Accordion states
const openAccordion = ref<'specs' | 'shipping' | 'care' | null>('specs')

function toggleAccordion(key: 'specs' | 'shipping' | 'care') {
  openAccordion.value = openAccordion.value === key ? null : key
}

function syncColor() {
  if (!product.value) return
  const qColor = route.query.color as string
  if (qColor && product.value.variants.some((v) => v.color === qColor)) {
    color.value = qColor
  } else {
    color.value = product.value.variants[0]?.color ?? ''
  }
  size.value = ''
}

onMounted(syncColor)
watch(product, syncColor)

// Per-product title and description: the router only sets a generic title (FE-04),
// which made every product share one entry in search results and link previews.
function setMeta(title: string, description: string) {
  document.title = title
  let tag = document.querySelector('meta[name="description"]')
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', 'description')
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', description)
}
watch([product, () => locale.locale], () => {
  if (!product.value) return
  const name = locale.getProductName(product.value)
  const description = (product.value.description || '').trim().slice(0, 155)
  setMeta(`${name} · Studio Active`, description || name)
}, { immediate: true })

// The catalog has loaded and this id is not in it: show a real not-found state
// instead of a skeleton that never resolves.
const productMissing = computed(() =>
  !product.value && !catalog.loading && catalog.products.length > 0
)

const colors = computed(() => [
  ...new Set(product.value?.variants.map((variant) => variant.color)),
])

const failedColorPhotos = ref<Record<string, boolean>>({})
function colorPhoto(name: string): string {
  const image = product.value?.colorOptions?.find(option => option.name === name)?.images?.[0]
  return image && !failedColorPhotos.value[image] ? image : ''
}
function hideBrokenColorPhoto(event: Event) {
  const image = event.target as HTMLImageElement
  failedColorPhotos.value[image.getAttribute('src') || ''] = true
}

const detailSizes = computed(() => [
  ...new Set(
    product.value?.variants
      .filter((variant) => variant.color === color.value)
      .map((variant) => variant.size)
  ),
])

const chosen = computed(() =>
  product.value?.variants.find(
    (variant) => variant.color === color.value && variant.size === size.value
  )
)

function remaining(v?: { sku: string; stock: number }) {
  if (!v) return 0
  const cartQty = cart.items.find((line) => line.sku === v.sku)?.quantity ?? 0
  return Math.min(10, v.stock) - cartQty
}

function handleAdd() {
  if (chosen.value && remaining(chosen.value) > 0) {
    cart.add(chosen.value.sku, chosen.value.stock)
    const name = locale.getProductName(product.value!)
    ui.showToast(
      locale.locale === 'en' ? `Added "${name}" to shopping bag` : `تمت إضافة "${name}" إلى حقيبة التسوق`,
      'success',
      '🛍'
    )
    cart.toggleDrawer(true)
  }
}

function handleToggleFavorite() {
  if (!product.value) return
  const isFav = favorites.isFavorite(product.value.id)
  const name = locale.getProductName(product.value)
  favorites.toggle(product.value.id)
  if (!isFav) {
    ui.showToast(
      locale.locale === 'en' ? `Added "${name}" to wishlist` : `تمت إضافة "${name}" إلى قائمة الرغبات`,
      'success',
      '♥'
    )
  } else {
    ui.showToast(
      locale.locale === 'en' ? `Removed "${name}" from wishlist` : `تمت إزالة "${name}" من قائمة الرغبات`,
      'info'
    )
  }
}

// Breadcrumb
const breadcrumb = computed(() => {
  if (!product.value?.categoryId) return []
  return categoryPath(catalog.categories, product.value.categoryId)
})

// Related products (prioritize matching category or collection)
const relatedProducts = computed(() => {
  if (!product.value) return []
  const currentCat = product.value.categoryId
  const sameCategory = catalog.products.filter(
    (p) => p.id !== product.value?.id && p.categoryId === currentCat
  )
  const otherProducts = catalog.products.filter(
    (p) => p.id !== product.value?.id && p.categoryId !== currentCat
  )
  return [...sameCategory, ...otherProducts].slice(0, 4)
})
</script>

<template>
  <section class="app-page pdp-page" aria-labelledby="page-title">
    <!-- Breadcrumb trail -->
    <nav class="listing-path" :aria-label="locale.locale === 'en' ? 'Breadcrumb navigation' : 'مسار التصفح'">
      <router-link to="/">{{ locale.locale === 'en' ? 'Home' : 'الرئيسية' }}</router-link>
      <span aria-hidden="true">/</span>
      <router-link to="/shop">{{ locale.locale === 'en' ? 'Shop' : 'المتجر' }}</router-link>
      <template v-for="node in breadcrumb" :key="node.slug">
        <span aria-hidden="true">/</span>
        <router-link :to="{ path: '/shop', query: { category: node.slug } }">
          {{ locale.getCategoryName(node) }}
        </router-link>
      </template>
      <span aria-hidden="true">/</span>
      <span aria-current="page" style="font-weight: bold">{{ product ? locale.getProductName(product) : '...' }}</span>
    </nav>

    <div v-if="product" class="drawer-body product-detail">
      <!-- Media Gallery -->
      <ProductGallery
        :name="locale.getProductName(product)"
        :image="product.image"
        :images="product.images"
        :color-options="product.colorOptions"
        :selected-color="color"
        :demo="demo"
        detail
      />

      <!-- Options & Actions -->
      <div class="product-options">
        <div class="product-header-row">
          <div>
            <p v-if="product.label" class="label">{{ product.label }}</p>
            <h1 id="page-title" class="product-title">{{ locale.getProductName(product) }}</h1>
          </div>
          <button
            type="button"
            class="favorite-pdp-btn"
            :class="{ active: favorites.isFavorite(product.id) }"
            :aria-label="favorites.isFavorite(product.id) ? (locale.locale === 'en' ? 'Remove from wishlist' : 'إزالة من المفضلة') : (locale.locale === 'en' ? 'Add to wishlist' : 'حفظ في المفضلة')"
            @click="handleToggleFavorite"
          >
            {{ favorites.isFavorite(product.id) ? '♥' : '♡' }}
          </button>
        </div>

        <strong class="detail-price">{{ formatMoney(product.price) }}</strong>
        <p class="product-desc">{{ product.description }}</p>

        <!-- Each color uses its own first uploaded photo as the selector. -->
        <div class="option-group">
          <div class="option-header"><strong>{{ locale.t('common.color') }}:</strong></div>
          <div class="color-photo-options" role="group" :aria-label="locale.t('common.color')">
            <button
              v-for="item in colors"
              :key="item"
              class="color-photo-option"
              type="button"
              :aria-label="item"
              :aria-pressed="color === item"
              @click="color = item; size = ''"
            >
              <img v-if="colorPhoto(item)" :src="colorPhoto(item)" alt="" loading="lazy" @error="hideBrokenColorPhoto">
              <span v-else class="color-photo-fallback" :style="{ background: getColorHex(item, product.colorOptions) }" aria-hidden="true"></span>
              <span v-if="color === item" class="color-photo-selected" aria-hidden="true">✓</span>
            </button>
          </div>
        </div>

        <!-- Size Selection -->
        <div class="option-group">
          <div class="option-header">
            <strong>{{ locale.t('common.size') }}:</strong>
            <button
              type="button"
              class="size-guide-btn"
              @click="sizeGuideOpen = true"
            >
              📏 {{ locale.t('common.size_guide') }}
            </button>
          </div>
          <div class="options">
            <button
              v-for="item in detailSizes"
              :key="item"
              type="button"
              :aria-pressed="size === item"
              :disabled="
                remaining(
                  product.variants.find(
                    (variant) => variant.color === color && variant.size === item
                  )
                ) <= 0
              "
              @click="size = item"
            >
              {{ item }}
            </button>
          </div>
        </div>

        <!-- Urgency Alert -->
        <div
          v-if="chosen && remaining(chosen) > 0 && remaining(chosen) <= 3"
          class="urgency-badge"
        >
          ⚡ {{ locale.locale === 'en' ? `Fast! Only ${remaining(chosen)} left in stock.` : `سارع بالطلب! متبقي ${remaining(chosen)} قطع فقط في المخزون.` }}
        </div>

        <!-- Add to Cart CTA & Wishlist -->
        <div class="pdp-actions">
          <button
            class="primary wide add-to-bag-btn"
            type="button"
            :disabled="!chosen || remaining(chosen) <= 0"
            @click="handleAdd"
          >
            {{ !size ? (locale.locale === 'en' ? 'SELECT A SIZE FIRST' : 'اختر المقاس أولاً') : remaining(chosen) <= 0 ? locale.t('common.out_of_stock') : locale.t('common.add_to_bag') }}
          </button>
          <button
            type="button"
            class="pdp-fav-btn"
            :class="{ active: favorites.isFavorite(product.id) }"
            :aria-label="favorites.isFavorite(product.id) ? (locale.locale === 'en' ? 'Remove from wishlist' : 'إزالة من المفضلة') : (locale.locale === 'en' ? 'Add to wishlist' : 'حفظ في المفضلة')"
            @click="handleToggleFavorite"
          >
            <span aria-hidden="true">{{ favorites.isFavorite(product.id) ? '♥' : '♡' }}</span>
          </button>
        </div>

        <!-- Adidas Style Accordions -->
        <div class="pdp-accordions">
          <!-- Accordion 1: Details -->
          <div class="accordion-item">
            <button
              type="button"
              class="accordion-trigger"
              :aria-expanded="openAccordion === 'specs'"
              @click="toggleAccordion('specs')"
            >
              <span>{{ locale.t('pdp.specs') }}</span>
              <span class="acc-icon">{{ openAccordion === 'specs' ? '−' : '+' }}</span>
            </button>
            <div v-show="openAccordion === 'specs'" class="accordion-content">
              <ul>
                <li><strong>{{ locale.locale === 'en' ? 'Fit:' : 'القصّة:' }}</strong> {{ product.fit || 'Regular Fit' }}</li>
                <li><strong>{{ locale.locale === 'en' ? 'Material:' : 'الخامة:' }}</strong> {{ locale.locale === 'en' ? 'Premium activewear cotton blend with breathable fibers' : 'قطن ممتاز مع ألياف مرنة عالية التهوية' }}</li>
                <li><strong>{{ locale.locale === 'en' ? 'Purpose:' : 'الاستخدام:' }}</strong> {{ locale.locale === 'en' ? 'Ideal for gym training, running, and all-day movement' : 'مثالي لتمارين الجيم، الجري، والأنشطة اليومية' }}</li>
              </ul>
            </div>
          </div>

          <!-- Accordion 2: Shipping & Returns -->
          <div class="accordion-item">
            <button
              type="button"
              class="accordion-trigger"
              :aria-expanded="openAccordion === 'shipping'"
              @click="toggleAccordion('shipping')"
            >
              <span>{{ locale.locale === 'en' ? 'Shipping & Free Returns' : 'الشحن والإرجاع المجاني' }}</span>
              <span class="acc-icon">{{ openAccordion === 'shipping' ? '−' : '+' }}</span>
            </button>
            <div v-show="openAccordion === 'shipping'" class="accordion-content">
              <p v-if="freeShippingText">• {{ freeShippingText }}</p>
              <p>• {{ deliveryEstimate }}</p>
              <p>• {{ locale.locale === 'en' ? 'Inspect and try your item with Cash on Delivery option.' : 'إمكانية معاينة واستلام مع خيار الدفع نقداً عند الباب.' }}</p>
              <p>• {{ locale.locale === 'en' ? 'Hassle-free 14-day exchange and return policy.' : 'إرجاع واستبدال مجاني وسهل خلال ١٤ يوماً من تاريخ الاستلام.' }}</p>
            </div>
          </div>

          <!-- Accordion 3: Care -->
          <div class="accordion-item">
            <button
              type="button"
              class="accordion-trigger"
              :aria-expanded="openAccordion === 'care'"
              @click="toggleAccordion('care')"
            >
              <span>{{ locale.t('pdp.care') }}</span>
              <span class="acc-icon">{{ openAccordion === 'care' ? '−' : '+' }}</span>
            </button>
            <div v-show="openAccordion === 'care'" class="accordion-content">
              <p>• {{ locale.locale === 'en' ? 'Machine wash cold (30°C) with similar colors.' : 'يُغسل في الغسالة بماء بارد (٣٠ درجة مئوية) مع ألوان مماثلة.' }}</p>
              <p>• {{ locale.locale === 'en' ? 'Do not bleach or dry clean to preserve elasticity.' : 'يُمنع استخدام المبيضات أو التنظيف الجاف للحفاظ على مرونة النسيج.' }}</p>
              <p>• {{ locale.locale === 'en' ? 'Iron on low heat; avoid direct heat on logos.' : 'الكي على درجة حرارة منخفضة وتجنب كي الشعار أو الطبعات مباشرة.' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Unknown product id -->
    <div v-else-if="productMissing" class="drawer-body product-missing" data-test="product-missing">
      <h1>{{ locale.locale === 'en' ? 'Product not found' : 'المنتج غير موجود' }}</h1>
      <p>{{ locale.locale === 'en' ? 'This product may have been removed or the link is incorrect.' : 'ربما تم حذف هذا المنتج أو أن الرابط غير صحيح.' }}</p>
      <router-link class="primary" to="/shop">{{ locale.locale === 'en' ? 'Browse the shop' : 'تصفح المتجر' }}</router-link>
    </div>

    <!-- Product Detail Skeleton (Cold Start without Cache) -->
    <div v-else class="drawer-body product-detail skeleton-pdp">
      <div class="skeleton-gallery-box"></div>
      <div class="product-options">
        <div class="skeleton-pill w-label"></div>
        <div class="skeleton-pill w-pdp-title"></div>
        <div class="skeleton-pill w-pdp-price"></div>
        <div class="skeleton-pill w-pdp-desc"></div>
        <div class="skeleton-pill w-pdp-desc short"></div>
        <div class="skeleton-sizes-row">
          <span class="skel-size-btn"></span>
          <span class="skel-size-btn"></span>
          <span class="skel-size-btn"></span>
          <span class="skel-size-btn"></span>
        </div>
        <div class="skeleton-pill w-buy-btn"></div>
      </div>
    </div>

    <!-- Customer Reviews & Fit Breakdown (Adidas Style) -->

    <!-- Related Products -->
    <section v-if="relatedProducts.length" class="related-section">
      <div class="section-head">
        <h2>{{ locale.t('pdp.related') }}</h2>
        <router-link to="/shop">{{ locale.t('pdp.view_all') }}</router-link>
      </div>
      <div class="grid related-grid">
        <ProductCard
          v-for="item in relatedProducts"
          :key="item.id"
          :product="item"
        />
      </div>
    </section>

    <!-- Size Guide Modal -->
    <SizeGuideModal :open="sizeGuideOpen" @close="sizeGuideOpen = false" />

    <!-- Mobile Sticky Purchase Bar (Adidas style) -->
    <div v-if="product" class="mobile-sticky-bar">
      <div class="sticky-info">
        <span class="sticky-title">{{ locale.getProductName(product) }}</span>
        <span class="sticky-price">{{ formatMoney(product.price) }}</span>
      </div>
      <button
        class="primary sticky-buy-btn"
        type="button"
        :disabled="!chosen || remaining(chosen) <= 0"
        @click="handleAdd"
      >
        {{ !size ? (locale.locale === 'en' ? 'SELECT SIZE' : 'اختر المقاس') : remaining(chosen) <= 0 ? locale.t('common.out_of_stock') : locale.t('common.add_to_bag') }}
      </button>
    </div>
  </section>
</template>

<!-- Page-level layout and type live in one stylesheet (unscoped so it can
     reach the shared .product-detail / .product-options rules in store.css). -->
<style src="../styles/storefront-pdp.css"></style>

<style scoped>
.product-missing { display: grid; gap: 1rem; justify-items: center; text-align: center; padding: 4rem 1rem; }
.product-missing .primary { display: inline-block; padding: 0.75rem 1.5rem; }
.pdp-page {
  padding-bottom: 5rem;
}

.product-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.product-title {
  margin: 0;
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  line-height: 1.1;
}

.favorite-pdp-btn {
  background: none;
  border: 1px solid #ddd;
  font-size: 1.6rem;
  width: 3.2rem;
  height: 3.2rem;
  display: grid;
  place-items: center;
  cursor: pointer;
  border-radius: 50%;
  color: #333;
  transition: all 0.2s ease;
}

.favorite-pdp-btn.active {
  color: #b32626;
  border-color: #b32626;
}

.product-desc {
  font-size: 0.95rem;
  color: #555;
  line-height: 1.6;
  margin: 0.75rem 0 1.5rem;
}

.color-photo-options { display: flex; flex-wrap: wrap; gap: .6rem; }
.color-photo-option { position: relative; display: grid; place-items: center; width: 70px; height: 86px; padding: 3px; overflow: hidden; border: 1px solid var(--line, #ddd); background: #f2f3f3; cursor: pointer; }
.color-photo-option img { display: block; width: 100%; height: 100%; object-fit: cover; }
.color-photo-option[aria-pressed="true"] { border: 2px solid #111; padding: 2px; }
.color-photo-option:hover { border-color: #111; }
.color-photo-option:focus-visible { outline: 3px solid #668800; outline-offset: 3px; }
.color-photo-fallback { width: 30px; height: 30px; border-radius: 50%; border: 1px solid #777; }
.color-photo-selected { position: absolute; inset-inline-end: 3px; bottom: 3px; width: 18px; height: 18px; display: grid; place-items: center; color: #fff; background: #111; font-size: 12px; line-height: 1; }
:global([data-theme="dark"]) .color-photo-option { background: #252525; border-color: #777; }
:global([data-theme="dark"]) .color-photo-option[aria-pressed="true"] { border-color: #c8ff00; }

.option-group {
  margin-bottom: 1.25rem;
}

.option-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.45rem;
  font-size: 0.9rem;
}

.size-guide-btn {
  background: none;
  border: none;
  text-decoration: underline;
  cursor: pointer;
  color: #111;
  font-size: 0.85rem;
  font-weight: 600;
}

.urgency-badge {
  background: #fff3cd;
  border: 1px solid #ffeeba;
  color: #856404;
  padding: 0.65rem 0.85rem;
  border-radius: 4px;
  font-size: 0.86rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.pdp-actions {
  display: flex;
  gap: 0.75rem;
  align-items: stretch;
  margin-bottom: 2rem;
}

.add-to-bag-btn {
  flex: 1;
  min-height: 3.4rem;
  font-size: 1.05rem;
  letter-spacing: 0.02em;
  margin-bottom: 0;
}

.pdp-fav-btn {
  width: 3.4rem;
  height: 3.4rem;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.4rem;
  color: #222;
  transition: all 0.2s ease;
}

.pdp-fav-btn:hover {
  background: #ebebeb;
  border-color: #111;
}

.pdp-fav-btn.active {
  background: #fff0f0;
  border-color: #e53935;
  color: #e53935;
}

/* Mobile Sticky Bar */
.mobile-sticky-bar {
  display: none;
}

@media (max-width: 768px) {
  .mobile-sticky-bar {
    position: fixed;
    bottom: 3.8rem; /* Just above mobile bottom nav */
    left: 0;
    right: 0;
    background: #fff;
    padding: 0.75rem 1rem;
    box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.08);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    z-index: 95;
    border-top: 1px solid #eaeaea;
  }

  .sticky-info {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .sticky-title {
    font-size: 0.85rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 170px;
  }

  .sticky-price {
    font-size: 0.95rem;
    font-weight: 800;
    color: #111;
  }

  .sticky-buy-btn {
    min-height: 2.75rem;
    padding: 0 1.25rem;
    font-size: 0.9rem;
    white-space: nowrap;
    border-radius: 4px;
  }
}

/* Accordions */
.pdp-accordions {
  border-top: 1px solid #eee;
  margin-top: 1rem;
}

.accordion-item {
  border-bottom: 1px solid #eee;
}

.accordion-trigger {
  width: 100%;
  padding: 1.1rem 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: none;
  border: none;
  font-size: 0.98rem;
  font-weight: 700;
  cursor: pointer;
  text-align: start;
}

.acc-icon {
  font-size: 1.3rem;
  color: #555;
}

.accordion-content {
  padding-bottom: 1.25rem;
  font-size: 0.88rem;
  color: #555;
  line-height: 1.6;
}

.accordion-content ul {
  padding-inline-start: 1.2rem;
  margin: 0;
}

.accordion-content li {
  margin-bottom: 0.35rem;
}

/* Related */
.related-section {
  max-width: 1440px;
  margin: 4rem auto 0;
  padding-top: 2rem;
  border-top: 1px solid #e5e5e5;
}

.related-grid {
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.25rem;
}

.related-img-wrap {
  aspect-ratio: 1;
  background: #f4f5f1;
  overflow: hidden;
}

.related-img-wrap img,
.related-img-wrap .photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

:global([data-theme="dark"]) .product-options {
  background: #181916 !important;
  border-color: #272924 !important;
  color: #ffffff !important;
}

:global([data-theme="dark"]) .product-title {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .detail-price {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .product-desc {
  color: #d4d4d8 !important;
}

:global([data-theme="dark"]) .option-header strong {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .size-guide-btn {
  color: var(--lime) !important;
}

:global([data-theme="dark"]) .size-chip {
  background: #20221e !important;
  border-color: #383b33 !important;
  color: #ffffff !important;
}

:global([data-theme="dark"]) .size-chip:hover {
  border-color: #ffffff !important;
}

:global([data-theme="dark"]) .size-chip.selected {
  background: #ffffff !important;
  color: #000000 !important;
  border-color: #ffffff !important;
}

:global([data-theme="dark"]) .pdp-accordions,
:global([data-theme="dark"]) .accordion-item {
  border-color: #272924 !important;
}

:global([data-theme="dark"]) .accordion-trigger {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .acc-icon {
  color: #a1a1aa !important;
}

:global([data-theme="dark"]) .accordion-content {
  color: #d4d4d8 !important;
}

:global([data-theme="dark"]) .related-section {
  border-color: #272924 !important;
}

:global([data-theme="dark"]) .related-section h2 {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .related-section a {
  color: var(--lime) !important;
}

/* Skeleton Shimmer for Product Detail Page */
.skeleton-pdp {
  pointer-events: none;
}

.skeleton-gallery-box {
  width: 100%;
  aspect-ratio: 1 / 1;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

.skeleton-pill {
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 3px;
}

.skeleton-pill.w-label {
  height: 0.85rem;
  width: 25%;
  margin-bottom: 0.5rem;
}

.skeleton-pill.w-pdp-title {
  height: 2.2rem;
  width: 75%;
  margin-bottom: 0.75rem;
}

.skeleton-pill.w-pdp-price {
  height: 1.6rem;
  width: 35%;
  margin-bottom: 1.5rem;
}

.skeleton-pill.w-pdp-desc {
  height: 0.9rem;
  width: 95%;
  margin-bottom: 0.5rem;
}

.skeleton-pill.w-pdp-desc.short {
  width: 60%;
  margin-bottom: 1.5rem;
}

.skeleton-sizes-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.skel-size-btn {
  width: 50px;
  height: 44px;
  background: #f3f4f6;
  border-radius: 4px;
}

.skeleton-pill.w-buy-btn {
  height: 52px;
  width: 100%;
  margin-top: 1rem;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

:global([data-theme="dark"]) .skeleton-gallery-box,
:global([data-theme="dark"]) .skeleton-pill,
:global([data-theme="dark"]) .skel-size-btn {
  background: linear-gradient(90deg, #1f211d 25%, #2a2e27 50%, #1f211d 75%) !important;
  background-size: 200% 100% !important;
}
</style>
