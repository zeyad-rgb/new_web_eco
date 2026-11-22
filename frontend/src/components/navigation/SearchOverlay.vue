<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCatalogStore } from '../../stores/catalog'
import { useLocaleStore } from '../../stores/locale'
import { formatMoney } from '../../utils/money'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const router = useRouter()
const catalog = useCatalogStore()
const locale = useLocaleStore()

const inputRef = ref<HTMLInputElement>()
const query = ref('')

const POPULAR_SEARCHES = computed(() => {
  if (locale.isRTL) {
    return ['تيشيرت تمرين', 'شورتات', 'بناطيل', 'ملابس نسائية', 'وصل حديثاً']
  }
  return ['Training Tee', 'Running Shorts', 'Joggers & Pants', 'Women Sports', 'New Arrivals']
})

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      query.value = ''
      nextTick(() => inputRef.value?.focus())
    }
  }
)

const matchingProducts = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return catalog.products
    .filter((product) => {
      const name = locale.getProductName(product)
      const label = product.label || ''
      const cat = product.category || ''
      return (name + ' ' + label + ' ' + cat).toLowerCase().includes(q)
    })
    .slice(0, 6)
})

const matchingCategories = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return catalog.categories.filter((cat) => {
    const name = locale.getCategoryName(cat)
    return (name + ' ' + cat.slug).toLowerCase().includes(q)
  }).slice(0, 4)
})

function submitSearch(term?: string) {
  const q = term !== undefined ? term : query.value.trim()
  emit('close')
  if (q) {
    router.push({ path: '/shop', query: { q } })
  }
}

function selectProduct(id: string) {
  emit('close')
  router.push(`/product/${id}`)
}
</script>

<template>
  <div v-if="open" class="search-overlay-backdrop" @click.self="emit('close')">
    <div class="search-modal" role="dialog" aria-modal="true" :aria-label="locale.t('nav.search')">
      <div class="search-header">
        <form class="search-input-wrap" @submit.prevent="submitSearch()">
          <span class="search-icon" aria-hidden="true">⌕</span>
          <input
            ref="inputRef"
            v-model="query"
            type="search"
            :placeholder="locale.t('nav.search_placeholder')"
            :aria-label="locale.t('nav.search')"
            @keydown.esc="emit('close')"
          />
          <button
            v-if="query"
            type="button"
            class="clear-input-btn"
            :aria-label="locale.t('search.clear')"
            @click="query = ''; inputRef?.focus()"
          >
            ✕
          </button>
        </form>

        <button
          type="button"
          class="close-search-btn"
          :aria-label="locale.t('search.cancel')"
          @click="emit('close')"
        >
          {{ locale.t('search.cancel') }}
        </button>
      </div>

      <div class="search-body">
        <!-- Default State: Popular Searches -->
        <div v-if="!query.trim()" class="search-suggestions">
          <p class="section-title">{{ locale.t('search.popular') }}</p>
          <div class="tag-chips">
            <button
              v-for="term in POPULAR_SEARCHES"
              :key="term"
              type="button"
              class="tag-chip"
              @click="submitSearch(term)"
            >
              {{ term }}
            </button>
          </div>
        </div>

        <!-- Live Results State -->
        <div v-else class="search-results">
          <div v-if="matchingCategories.length" class="category-matches">
            <p class="section-title">{{ locale.t('search.matching_categories') }}</p>
            <div class="category-links">
              <router-link
                v-for="cat in matchingCategories"
                :key="cat.slug"
                :to="{ path: '/shop', query: { category: cat.slug } }"
                class="category-pill"
                @click="emit('close')"
              >
                {{ locale.getCategoryName(cat) }}
              </router-link>
            </div>
          </div>

          <div class="product-matches">
            <p class="section-title">{{ locale.t('search.suggested_products') }} ({{ matchingProducts.length }})</p>
            <p v-if="!matchingProducts.length" class="no-results-msg">
              {{ locale.t('search.no_products_found', { query }) }}
            </p>

            <div v-else class="product-matches-grid">
              <article
                v-for="p in matchingProducts"
                :key="p.id"
                class="match-card"
                @click="selectProduct(p.id)"
              >
                <div class="match-thumb">
                  <img v-if="p.images?.length" :src="p.images[0]" :alt="locale.getProductName(p)" />
                  <span v-else :class="['photo', p.image]"></span>
                </div>
                <div class="match-info">
                  <h5>{{ locale.getProductName(p) }}</h5>
                  <p class="match-cat">{{ locale.getCategoryName({ name: p.category, slug: p.category }) }}</p>
                  <strong class="match-price">{{ formatMoney(p.price) }}</strong>
                </div>
              </article>
            </div>
          </div>

          <button
            v-if="query.trim()"
            type="button"
            class="full-search-cta"
            @click="submitSearch()"
          >
            {{ locale.t('search.see_all_results', { query }) }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-overlay-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(17, 18, 16, 0.6);
  backdrop-filter: blur(4px);
  z-index: 110;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  animation: fadeIn 0.15s ease-out;
}

.search-modal {
  width: 100%;
  max-width: 900px;
  background: #ffffff;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.search-header {
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid #ebebeb;
}

.search-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f4f5f1;
  border-radius: 6px;
  padding: 0.35rem 0.85rem;
  gap: 0.65rem;
}

.search-icon {
  font-size: 1.35rem;
  color: #666;
}

.search-input-wrap input {
  flex: 1;
  border: none;
  background: none;
  font-size: 1.05rem;
  color: #111;
  outline: none;
  padding: 0.5rem 0;
}

.clear-input-btn {
  background: none;
  border: none;
  font-size: 0.9rem;
  color: #777;
  cursor: pointer;
}

.close-search-btn {
  background: none;
  border: none;
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  padding: 0.5rem 0.85rem;
}

.close-search-btn:hover {
  color: #000;
}

.search-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.section-title {
  margin: 0 0 0.85rem;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #666;
  letter-spacing: 0.05em;
}

.tag-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-chip {
  background: #f3f4f0;
  border: 1px solid #e1e3dc;
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  font-size: 0.85rem;
  color: #191c17;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tag-chip:hover {
  background: #191c17;
  color: #ffffff;
  border-color: #191c17;
}

/* Category matches */
.category-matches {
  margin-bottom: 1.5rem;
}

.category-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.category-pill {
  background: #191c17;
  color: #fff;
  padding: 0.45rem 0.9rem;
  border-radius: 4px;
  font-size: 0.85rem;
  text-decoration: none;
}

/* Product Matches */
.product-matches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.match-card {
  display: flex;
  gap: 0.8rem;
  padding: 0.6rem;
  border: 1px solid #eee;
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.match-card:hover {
  border-color: #111;
}

.match-thumb {
  width: 60px;
  height: 60px;
  flex-shrink: 0;
  background: #f7f7f7;
  overflow: hidden;
}

.match-thumb img,
.match-thumb .photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.match-info h5 {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.3;
}

.match-cat {
  margin: 0.2rem 0;
  font-size: 0.75rem;
  color: #777;
}

.match-price {
  font-size: 0.85rem;
}

.no-results-msg {
  color: #777;
  font-size: 0.9rem;
}

.full-search-cta {
  width: 100%;
  margin-top: 1.5rem;
  padding: 0.85rem;
  background: #f5f6f2;
  border: 1px solid #d9ddd5;
  font-weight: 700;
  font-size: 0.92rem;
  cursor: pointer;
  text-align: center;
}

.full-search-cta:hover {
  background: #191c17;
  color: #fff;
  border-color: #191c17;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

:global([data-theme="dark"]) .search-modal {
  background: #181916 !important;
  border: 1px solid #272924 !important;
  color: #ffffff !important;
}

:global([data-theme="dark"]) .search-header {
  border-bottom-color: #272924 !important;
}

:global([data-theme="dark"]) .search-input-wrap {
  background: #222420 !important;
}

:global([data-theme="dark"]) .search-input-wrap input {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .search-icon {
  color: #a1a1aa !important;
}

:global([data-theme="dark"]) .close-search-btn {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .section-title {
  color: #a1a1aa !important;
}

:global([data-theme="dark"]) .tag-chip {
  background: #222420 !important;
  border-color: #383b33 !important;
  color: #ffffff !important;
}

:global([data-theme="dark"]) .tag-chip:hover {
  background: #ffffff !important;
  color: #000000 !important;
}

:global([data-theme="dark"]) .match-card {
  background: #20221e !important;
  border-color: #383b33 !important;
}

:global([data-theme="dark"]) .match-card:hover {
  border-color: #ffffff !important;
}

:global([data-theme="dark"]) .match-info h5 {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .match-cat {
  color: #a1a1aa !important;
}

:global([data-theme="dark"]) .match-price {
  color: #ffffff !important;
}

:global([data-theme="dark"]) .full-search-cta {
  background: #222420 !important;
  border-color: #383b33 !important;
  color: #ffffff !important;
}

:global([data-theme="dark"]) .full-search-cta:hover {
  background: #ffffff !important;
  color: #000000 !important;
}
</style>
