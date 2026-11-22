<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCatalogStore } from '../stores/catalog'
import { useFavoritesStore } from '../stores/favorites'
import { useLocaleStore } from '../stores/locale'
import ProductGallery from '../ProductGallery.vue'
import { categoryBranch, categoryPath } from '../taxonomy'
import { getColorHex } from '../utils/colors'
import ProductCard from '../components/product/ProductCard.vue'

const route = useRoute()
const router = useRouter()
const catalog = useCatalogStore()
onMounted(() => { void catalog.load() })
const favorites = useFavoritesStore()
const locale = useLocaleStore()
const demo = import.meta.env.MODE === 'preview'

// Filter state synchronized with route query
const query = ref('')
const category = ref('')
const collection = ref('')
const typeFilter = ref('')
const sizeFilter = ref('')
const colorFilter = ref('')
const fitFilter = ref('')
const sort = ref('')
const filterOpen = ref(false)

const isFavorites = computed(() => route.query.favorites === 'true')

function syncFromQuery() {
  query.value = (route.query.q as string) || ''
  category.value = (route.query.category as string) || ''
  collection.value = (route.query.collection as string) || ''
  typeFilter.value = (route.query.type as string) || ''
  sizeFilter.value = (route.query.size as string) || ''
  colorFilter.value = (route.query.color as string) || ''
  fitFilter.value = (route.query.fit as string) || ''
  sort.value = (route.query.sort as string) || ''
}

syncFromQuery()
watch(() => route.query, syncFromQuery)

function updateRouteQuery() {
  const q: Record<string, string> = {}
  if (query.value.trim()) q.q = query.value.trim()
  if (category.value) q.category = category.value
  if (collection.value) q.collection = collection.value
  if (typeFilter.value) q.type = typeFilter.value
  if (sizeFilter.value) q.size = sizeFilter.value
  if (colorFilter.value) q.color = colorFilter.value
  if (fitFilter.value) q.fit = fitFilter.value
  if (sort.value) q.sort = sort.value
  if (isFavorites.value) q.favorites = 'true'

  router.replace({ path: '/shop', query: q })
}

function clearFilters() {
  query.value = ''
  category.value = ''
  collection.value = ''
  typeFilter.value = ''
  sizeFilter.value = ''
  colorFilter.value = ''
  fitFilter.value = ''
  sort.value = ''
  if (isFavorites.value) {
    router.push({ path: '/shop' })
  } else {
    updateRouteQuery()
  }
}

const breadcrumb = computed(() => categoryPath(catalog.categories, category.value))
const scopedCategories = computed(() =>
  category.value ? categoryBranch(catalog.categories, category.value) : null
)
const typeCategories = computed(() => {
  if (!typeFilter.value) return null
  const included = new Set<string>()
  for (const item of catalog.categories.filter((item) => item.type_slug === typeFilter.value)) {
    for (const slug of categoryBranch(catalog.categories, item.slug)) included.add(slug)
  }
  return included
})

const categoryChips = computed(() => {
  const selected = breadcrumb.value.at(-1)
  if (!selected) return catalog.rootCategories
  const children = catalog.categories.filter((item) => item.parent_slug === selected.slug)
  return children.length
    ? children
    : catalog.categories.filter((item) => item.parent_slug === selected.parent_slug)
})

const title = computed(() => {
  if (isFavorites.value) return locale.locale === 'en' ? 'Wishlist' : 'المفضلة'
  if (collection.value) {
    if (locale.locale === 'en') {
      const map: Record<string, string> = {
        training: 'Training Collection',
        everyday: 'Everyday Essentials',
        latest: 'New Arrivals',
        sale: 'Sale & Offers',
      }
      return map[collection.value] || collection.value
    }
    return catalog.collections.find((group) => group.slug === collection.value)?.name ?? collection.value
  }
  if (category.value) {
    const cat = catalog.categories.find((c) => c.slug === category.value)
    if (cat) return locale.getCategoryName(cat)
  }
  if (typeFilter.value) {
    const t = catalog.productTypes.find((type) => type.slug === typeFilter.value)
    if (t) return locale.locale === 'en' ? t.name : t.name
  }
  return locale.t('shop.title')
})

const filterCount = computed(
  () =>
    [
      query.value,
      typeFilter.value,
      category.value,
      collection.value,
      sizeFilter.value,
      colorFilter.value,
      fitFilter.value,
      sort.value,
    ].filter(Boolean).length
)

const visible = computed(() => {
  const matches = catalog.products.filter(
    (product) =>
      (!isFavorites.value || favorites.isFavorite(product.id)) &&
      (!scopedCategories.value || scopedCategories.value.has(product.categoryId ?? '')) &&
      (!typeCategories.value || typeCategories.value.has(product.categoryId ?? '')) &&
      (!collection.value || product.collections.includes(collection.value)) &&
      (!fitFilter.value || product.fit === fitFilter.value) &&
      (product.name + ' ' + product.label).toLowerCase().includes(query.value.trim().toLowerCase()) &&
      ((!sizeFilter.value && !colorFilter.value) ||
        product.variants.some(
          (variant) =>
            variant.stock > 0 &&
            (!sizeFilter.value || variant.size === sizeFilter.value) &&
            (!colorFilter.value || variant.color === colorFilter.value)
        ))
  )

  if (sort.value === 'new')
    return matches.sort(
      (a, b) =>
        Number(b.collections.includes('latest')) - Number(a.collections.includes('latest'))
    )
  if (sort.value === 'asc') return matches.sort((a, b) => a.price - b.price)
  if (sort.value === 'desc') return matches.sort((a, b) => b.price - a.price)
  return matches
})
</script>

<template>
  <section id="shop" class="shop listing">
    <!-- Breadcrumbs -->
    <nav class="listing-path" :aria-label="locale.locale === 'en' ? 'Breadcrumb navigation' : 'مسار التنقل'">
      <router-link to="/">{{ locale.locale === 'en' ? 'Home' : 'الرئيسية' }}</router-link>
      <span aria-hidden="true">/</span>
      <router-link to="/shop" @click="clearFilters">{{ locale.locale === 'en' ? 'Shop' : 'المتجر' }}</router-link>

      <template v-for="(node, index) in breadcrumb" :key="node.slug">
        <span aria-hidden="true">/</span>
        <router-link
          v-if="index < breadcrumb.length - 1"
          :to="{ path: '/shop', query: { category: node.slug } }"
        >
          {{ locale.getCategoryName(node) }}
        </router-link>
        <span v-else aria-current="page">{{ locale.getCategoryName(node) }}</span>
      </template>

      <template v-if="!breadcrumb.length && (typeFilter || collection || isFavorites)">
        <span aria-hidden="true">/</span>
        <span aria-current="page">{{ title }}</span>
      </template>
    </nav>

    <!-- Heading -->
    <div class="heading">
      <h1>{{ title }}</h1>
      <span aria-live="polite">{{ visible.length }} {{ locale.t('shop.items_count') }}</span>
    </div>

    <!-- Category Toolbar -->
    <div class="listing-toolbar">
      <nav class="category-strip" :aria-label="locale.locale === 'en' ? 'Product categories' : 'تصنيفات المنتجات'">
        <router-link
          to="/shop"
          :aria-current="!category && !collection && !typeFilter && !isFavorites ? 'page' : undefined"
          @click="clearFilters"
        >
          {{ locale.locale === 'en' ? 'All Products' : 'كل المنتجات' }}
        </router-link>
        <router-link
          v-for="item in categoryChips"
          :key="item.slug"
          :to="{ path: '/shop', query: { category: item.slug } }"
          :aria-current="category === item.slug ? 'page' : undefined"
        >
          {{ locale.getCategoryName(item) }}
        </router-link>
      </nav>

      <button
        class="filter-toggle"
        type="button"
        :aria-expanded="filterOpen"
        aria-controls="listing-filters"
        @click="filterOpen = !filterOpen"
      >
        {{ locale.t('shop.filter_sort') }} <b v-if="filterCount">{{ filterCount }}</b>
        <span aria-hidden="true">☷</span>
      </button>
    </div>

    <!-- Active Filter Chips (Adidas Style) -->
    <div v-if="filterCount > 0" class="active-chips-bar" :aria-label="locale.t('shop.active_filters')">
      <span class="chips-title">{{ locale.t('shop.active_filters') }}</span>

      <span v-if="query" class="filter-chip">
        {{ locale.locale === 'en' ? 'Search:' : 'البحث:' }} "{{ query }}"
        <button type="button" aria-label="Remove filter" @click="query = ''; updateRouteQuery()">✕</button>
      </span>

      <span v-if="category" class="filter-chip">
        {{ locale.locale === 'en' ? 'Category:' : 'التصنيف:' }} {{ catalog.categories.find(c => c.slug === category)?.name || category }}
        <button type="button" aria-label="Remove filter" @click="category = ''; updateRouteQuery()">✕</button>
      </span>

      <span v-if="collection" class="filter-chip">
        {{ locale.locale === 'en' ? 'Collection:' : 'المجموعة:' }} {{ catalog.collections.find(g => g.slug === collection)?.name || collection }}
        <button type="button" aria-label="Remove filter" @click="collection = ''; updateRouteQuery()">✕</button>
      </span>

      <span v-if="typeFilter" class="filter-chip">
        {{ locale.locale === 'en' ? 'Type:' : 'النوع:' }} {{ catalog.productTypes.find(t => t.slug === typeFilter)?.name || typeFilter }}
        <button type="button" aria-label="Remove filter" @click="typeFilter = ''; updateRouteQuery()">✕</button>
      </span>

      <span v-if="sizeFilter" class="filter-chip">
        {{ locale.locale === 'en' ? 'Size:' : 'المقاس:' }} {{ sizeFilter }}
        <button type="button" aria-label="Remove filter" @click="sizeFilter = ''; updateRouteQuery()">✕</button>
      </span>

      <span v-if="colorFilter" class="filter-chip">
        {{ locale.locale === 'en' ? 'Color:' : 'اللون:' }} {{ colorFilter }}
        <button type="button" aria-label="Remove filter" @click="colorFilter = ''; updateRouteQuery()">✕</button>
      </span>

      <span v-if="fitFilter" class="filter-chip">
        {{ locale.locale === 'en' ? 'Fit:' : 'القصّة:' }} {{ fitFilter }}
        <button type="button" aria-label="Remove filter" @click="fitFilter = ''; updateRouteQuery()">✕</button>
      </span>

      <button type="button" class="clear-all-chip" @click="clearFilters">
        {{ locale.t('shop.clear_all') }} ✕
      </button>
    </div>

    <!-- Collapsible Filters -->
    <div v-show="filterOpen" id="listing-filters" class="catalog-controls">
      <div class="filters">
        <input
          v-model="query"
          type="search"
          :placeholder="locale.t('shop.search_model_placeholder')"
          :aria-label="locale.t('shop.search_model_placeholder')"
          @change="updateRouteQuery"
        />
        <select
          v-model="collection"
          :aria-label="locale.t('shop.filter_collection')"
          @change="updateRouteQuery"
        >
          <option value="">{{ locale.t('shop.all_collections') }}</option>
          <option
            v-for="item in catalog.collections"
            :key="item.slug"
            :value="item.slug"
          >
            {{ locale.locale === 'en' ? (item.slug === 'training' ? 'Training' : item.slug === 'everyday' ? 'Everyday Essentials' : item.slug === 'latest' ? 'New Arrivals' : 'Sale') : item.name }}
          </option>
        </select>
        <select
          v-model="category"
          :aria-label="locale.t('shop.filter_category')"
          @change="updateRouteQuery"
        >
          <option value="">{{ locale.t('shop.all_categories') }}</option>
          <option
            v-for="{ category: item, path } in catalog.categoryList"
            :key="item.slug"
            :value="item.slug"
          >
            {{ path.map((node) => locale.getCategoryName(node)).join(locale.locale === 'en' ? ' → ' : ' ← ') }}
          </option>
        </select>
        <select
          v-model="typeFilter"
          :aria-label="locale.t('shop.all_types')"
          @change="updateRouteQuery"
        >
          <option value="">{{ locale.t('shop.all_types') }}</option>
          <option
            v-for="t in catalog.productTypes"
            :key="t.slug"
            :value="t.slug"
          >
            {{ t.name }}
          </option>
        </select>
        <select
          v-model="sizeFilter"
          :aria-label="locale.t('shop.filter_size')"
          @change="updateRouteQuery"
        >
          <option value="">{{ locale.t('shop.all_sizes') }}</option>
          <option v-for="item in catalog.availableSizes" :key="item">
            {{ item }}
          </option>
        </select>
        <select
          v-model="fitFilter"
          :aria-label="locale.t('shop.filter_fit')"
          @change="updateRouteQuery"
        >
          <option value="">{{ locale.t('shop.all_fits') }}</option>
          <option v-for="f in catalog.fits" :key="f">{{ f }}</option>
        </select>
        <select
          v-model="sort"
          :aria-label="locale.t('shop.sort_by')"
          @change="updateRouteQuery"
        >
          <option value="">{{ locale.t('shop.sort_default') }}</option>
          <option value="new">{{ locale.t('shop.sort_newest') }}</option>
          <option value="asc">{{ locale.t('shop.sort_price_low') }}</option>
          <option value="desc">{{ locale.t('shop.sort_price_high') }}</option>
        </select>
      </div>

      <div class="swatches" :aria-label="locale.t('shop.filter_by_color')">
        <button
          class="swatch-label"
          :aria-pressed="!colorFilter"
          @click="colorFilter = ''; updateRouteQuery()"
        >
          {{ locale.t('shop.all_colors') }}
        </button>
        <button
          v-for="item in catalog.catalogColors"
          :key="item"
          class="swatch-label"
          :aria-pressed="colorFilter === item"
          @click="colorFilter = item; updateRouteQuery()"
        >
          <span
            class="dot"
            :style="{ background: getColorHex(item) }"
          ></span>
          {{ item }}
        </button>
        <button class="reset" @click="clearFilters">{{ locale.t('shop.clear_all') }}</button>
      </div>
    </div>

    <!-- Product Grid (Skeletons when loading cold without cache) -->
    <div v-if="catalog.loading && !visible.length" class="grid shop-skeletons" role="status" aria-label="Loading products">
      <div v-for="n in 6" :key="'skel-' + n" class="product-card skeleton-card">
        <div class="skeleton-image-box"></div>
        <div class="skeleton-details">
          <div class="skeleton-pill w-tag"></div>
          <div class="skeleton-pill w-title"></div>
          <div class="skeleton-pill w-price"></div>
          <div class="skeleton-dots">
            <span class="skel-dot"></span>
            <span class="skel-dot"></span>
            <span class="skel-dot"></span>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="catalog.status && !visible.length" role="alert" class="empty-results-box">
      <h3>Products are temporarily unavailable</h3>
      <p>{{ catalog.status }}</p>
      <button class="primary" type="button" @click="catalog.load()">Try again</button>
    </div>
    <div v-else-if="!visible.length" class="empty-results-box">
      <span class="empty-icon">🔍</span>
      <h3>{{ locale.t('shop.no_results') }}</h3>
      <p>{{ locale.t('shop.no_results_sub') }}</p>
      <button type="button" class="primary reset-all-btn" @click="clearFilters">
        {{ locale.t('shop.clear_all') }}
      </button>
    </div>
    <div v-else class="grid">
      <ProductCard
        v-for="product in visible"
        :key="product.id"
        :product="product"
      />
    </div>
  </section>
</template>

<!-- Listing layout and type; unscoped so it can reach the shared card and
     .photo rules that live in store.css and ProductCard.vue. -->
<style src="../styles/storefront-shop.css"></style>

<style scoped>
.active-chips-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  padding: 0.5rem 0;
}

.chips-title {
  font-size: 0.82rem;
  color: var(--text-muted, #71717a);
  font-weight: 700;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--chip-bg, #111210);
  color: var(--chip-text, #ffffff);
  border: 1px solid var(--border-light, #333);
  padding: 0.35rem 0.65rem;
  border-radius: 4px;
  font-size: 0.82rem;
  font-weight: 600;
}

.filter-chip button {
  background: none;
  border: none;
  color: #d4d4d8;
  cursor: pointer;
  padding: 0;
  font-size: 0.8rem;
  display: grid;
  place-items: center;
}

.filter-chip button:hover {
  color: #fff;
}

.clear-all-chip {
  background: none;
  border: 1px dashed var(--border-light, #999);
  color: var(--text-secondary, #444);
  padding: 0.35rem 0.65rem;
  border-radius: 4px;
  font-size: 0.82rem;
  cursor: pointer;
  font-weight: 600;
}

.clear-all-chip:hover {
  border-color: #ef4444;
  color: #ef4444;
}

.empty-results-box {
  grid-column: 1 / -1;
  text-align: center;
  padding: 4rem 1.5rem;
  background: var(--bg-card, #fbfbf9);
  border: 1px dashed var(--border-light, #d5d8d0);
  border-radius: 8px;
  margin: 2rem 0;
}

.empty-icon {
  font-size: 2.8rem;
  display: block;
  margin-bottom: 1rem;
}

.empty-results-box h3 {
  font-size: 1.4rem;
  margin-bottom: 0.5rem;
  color: var(--text-primary, #111);
}

.empty-results-box p {
  color: var(--text-muted, #666);
  font-size: 0.95rem;
  max-width: 480px;
  margin: 0 auto 1.5rem;
}

.reset-all-btn {
  padding: 0.75rem 2rem;
  font-size: 0.95rem;
}

/* Skeleton Loading Shimmer for Product Cards */
.shop-skeletons .skeleton-card {
  background: var(--bg-surface, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  display: flex;
  flex-direction: column;
  pointer-events: none;
  overflow: hidden;
}

.skeleton-image-box {
  width: 100%;
  aspect-ratio: 1 / 1;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-details {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-pill {
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 3px;
}

.skeleton-pill.w-tag {
  height: 0.75rem;
  width: 35%;
}

.skeleton-pill.w-title {
  height: 1.15rem;
  width: 80%;
  margin: 0.25rem 0;
}

.skeleton-pill.w-price {
  height: 1.15rem;
  width: 45%;
}

.skeleton-dots {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.5rem;
}

.skel-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #e5e7eb;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

:global([data-theme="dark"]) .skeleton-image-box,
:global([data-theme="dark"]) .skeleton-pill {
  background: linear-gradient(90deg, #1f211d 25%, #2a2e27 50%, #1f211d 75%) !important;
  background-size: 200% 100% !important;
}

:global([data-theme="dark"]) .shop-skeletons .skeleton-card {
  background: #181916 !important;
  border-color: #272924 !important;
}

:global([data-theme="dark"]) .skel-dot {
  background: #2a2e27 !important;
}

/* Dark Theme Overrides for Shop View */
:global([data-theme="dark"]) .chips-title {
  color: #a1a1aa !important;
}

:global([data-theme="dark"]) .filter-chip {
  background: #242721 !important;
  color: #ffffff !important;
  border-color: #3f423b !important;
}

:global([data-theme="dark"]) .clear-all-chip {
  border-color: #52525b !important;
  color: #e4e4e7 !important;
}

:global([data-theme="dark"]) .empty-results-box {
  background: #181916 !important;
  border-color: #2c2f28 !important;
}

:global([data-theme="dark"]) .empty-results-box h3 {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .empty-results-box p {
  color: #a1a1aa !important;
}
</style>
