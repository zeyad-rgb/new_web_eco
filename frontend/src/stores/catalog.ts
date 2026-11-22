import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Product, Category, ProductType, Group, ManagedProduct } from '../types'
import { categoryRows } from '../taxonomy'
import taxonomySeed from '../taxonomy-seed.json'

const demo = import.meta.env.MODE === 'preview'
const SIZES = ['M', 'L', 'XL', '2XL', '3XL']
const CATALOG_CACHE_KEY = 'studioactive_catalog_cache'

export const useCatalogStore = defineStore('catalog', () => {
  const products = ref<Product[]>([])
  const managed = ref<ManagedProduct[]>([])
  const categories = ref<Category[]>([])
  const productTypes = ref<ProductType[]>([])
  const collections = ref<Group[]>([])
  const shipping = ref(8500)
  // Neutral defaults until /api/v1/products answers: no free-shipping promise is shown
  // before the real store setting is known (free_threshold 0 hides it).
  const shippingSettings = ref<any>({ fee: 8500, free_threshold: 0, currency: 'EGP', estimated_days: '2-4 أيام عمل' })
  const storefrontSettings = ref<any>({ announcement_text: '', visit_label: 'Visit Us', location_url: '' })
  const whatsappSettings = ref<any>({ enabled: true, support_phone: '01000000000', welcome_message: 'Hello, I would like to ask about your products.' })
  const status = ref('')
  const loading = ref(false)
  const lastLoadedAt = ref<number>(0)
  let invalidated = false

  // ⚡ SWR instant hydration: show the cached catalog at once, then always revalidate.
  // The cache is a paint shortcut only, so lastLoadedAt stays 0 and load() still fetches.
  const CACHE_MAX_AGE = 10 * 60_000
  try {
    const cached = sessionStorage.getItem(CATALOG_CACHE_KEY)
    if (cached) {
      const data = JSON.parse(cached)
      if (Array.isArray(data.products) && data.products.length && Date.now() - (data.cachedAt ?? 0) < CACHE_MAX_AGE) {
        products.value = data.products
        categories.value = data.categories || []
        productTypes.value = data.productTypes || []
        collections.value = data.collections || []
        shipping.value = data.shipping || 8500
        shippingSettings.value = data.shippingSettings || shippingSettings.value
        storefrontSettings.value = data.storefrontSettings || storefrontSettings.value
        whatsappSettings.value = data.whatsappSettings || whatsappSettings.value
      }
    }
  } catch {}

  const rootCategories = computed(() => categories.value.filter((item) => !item.parent_slug))
  const categoryList = computed(() => categoryRows(categories.value))
  const availableSizes = computed(() => [
    ...new Set(products.value.flatMap((product) => product.variants.map((v) => v.size))),
  ])
  const catalogColors = computed(() => [
    ...new Set(products.value.flatMap((product) => product.variants.map((v) => v.color))),
  ])
  const fits = computed(() => [...new Set(products.value.map((product) => product.fit))])

  async function load(force = false) {
    // Avoid concurrent duplicate catalog requests.
    if (loading.value && !force) return
    // ⚡ Avoid duplicate network calls if catalog data is already loaded and fresh (< 60s)
    if (!force && products.value.length > 0 && (Date.now() - lastLoadedAt.value < 60_000)) {
      return
    }

    loading.value = true
    status.value = ''
    if (demo) {
      const template = document.querySelector<HTMLScriptElement>('#preview-catalog')
      const base: Product[] = template
        ? JSON.parse(template.textContent ?? '[]')
        : await (await fetch('./products.json')).json()
      categories.value = taxonomySeed.categories
      productTypes.value = taxonomySeed.types
      const tee = base.find((item) => item.id === 'training-tee')
      if (tee && !base.some((item) => item.id === 'women-training-tee')) {
        base.push({
          ...tee,
          id: 'women-training-tee',
          name: 'تيشيرت تمرين حريمي',
          categoryId: 'women-tees',
          collections: [],
        })
      }
      collections.value = [
        { slug: 'training', name: 'مجموعة التمرين' },
        { slug: 'everyday', name: 'الأساسيات اليومية' },
        { slug: 'latest', name: 'وصل حديثًا' },
      ]
      products.value = base.map((product) => ({
        ...product,
        variants: ['أسود', 'رمادي', 'أبيض'].flatMap((color, index) =>
          SIZES.map((size) => ({
            sku: [product.id, index, size].join('-'),
            color,
            size,
            stock: product.id === 'training-shorts' && size === '3XL' ? 0 : 5,
          }))
        ),
      }))
      managed.value = products.value.map((product) => ({
        ...product,
        categoryId: product.categoryId!,
        published: true,
      }))
      loading.value = false
      return
    }

    try {
      const response = await fetch('/api/v1/products', { cache: force || invalidated ? 'no-cache' : 'default', headers: { Accept: 'application/json' } })
      if (!response.ok) throw new Error('Catalog API unavailable')
      const data = await response.json()
      products.value = data.products || []
      categories.value = data.categories || []
      productTypes.value = data.productTypes || []
      collections.value = data.collections || []
      shipping.value = data.shipping || 8500
      // Store settings come from the same response; without these the first visit in a
      // tab showed the hard-coded defaults (4000 EGP banner, 800 EGP threshold, demo WhatsApp number).
      shippingSettings.value = data.shippingSettings || shippingSettings.value
      storefrontSettings.value = data.storefrontSettings || storefrontSettings.value
      whatsappSettings.value = data.whatsappSettings || whatsappSettings.value
      lastLoadedAt.value = Date.now()
      invalidated = false

      // ⚡ Cache catalog for instant 0ms loads
      try {
        sessionStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify({ ...data, cachedAt: Date.now() }))
      } catch {}
    } catch {
      if (!products.value.length) {
        products.value = []
        status.value = 'تعذر تحميل المنتجات. حاول مرة أخرى.'
      }
    } finally {
      loading.value = false
    }
  }

  function invalidateFreshness() {
    invalidated = true
    lastLoadedAt.value = 0
  }

  function updateDemoCatalog(groups: Category[], items: ManagedProduct[], types: ProductType[]) {
    if (!demo) return
    categories.value = groups
    productTypes.value = types
    managed.value = items
    const previous = new Map(products.value.map((product) => [product.id, product]))
    products.value = items
      .filter((item) => item.published)
      .map((item) => {
        const current = previous.get(item.id)
        return {
          ...item,
          label: item.label ?? current?.label ?? '',
          image: item.image ?? current?.image ?? '',
          fit: item.fit ?? current?.fit ?? '',
          collections: item.collections ?? current?.collections ?? [],
          category: groups.find((group) => group.slug === item.categoryId)?.name ?? '',
          variants: item.variants.map((variant) => ({
            ...variant,
            sku:
              variant.sku ??
              [item.id, variant.colorId ?? encodeURIComponent(variant.color), variant.size].join('-'),
          })),
        }
      })
  }

  return {
    products,
    managed,
    categories,
    productTypes,
    collections,
    shipping,
    shippingSettings,
    storefrontSettings,
    whatsappSettings,
    status,
    loading,
    rootCategories,
    categoryList,
    availableSizes,
    catalogColors,
    fits,
    load,
    invalidateFreshness,
    updateDemoCatalog,
  }
})
