import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { staffList, staffRequest } from '../api/staff'
import type { EditableProduct } from '../product-options'
import type { Category, ProductType } from '../taxonomy'
import { useAuthStore } from './auth'
import { useCatalogStore } from './catalog'
import { useUIStore } from './ui'

export const PAGE_SIZE = 50
export const LOW_STOCK = 2

export interface StoreSettings {
  storefront: { announcement_text: string; visit_label: string; location_url: string }
  shipping: { fee: number; free_threshold: number; currency: string; express_available: boolean; estimated_days: string }
  payment_methods: { cash_on_delivery: boolean; card: boolean; instapay: boolean; vodafone_cash: boolean }
  discounts: Array<{ code: string; percent: number; min_spend: number; active: boolean }>
  whatsapp: {
    enabled: boolean; provider: string; support_phone: string; webhook_url: string
    api_token: string; instance_id: string; welcome_message: string; auto_confirm: boolean
  }
}

/** Empty, promise-free defaults. Real values always come from the server (ADM-01). */
export const defaultSettings = (): StoreSettings => ({
  storefront: { announcement_text: '', visit_label: 'Visit Us', location_url: '' },
  shipping: { fee: 8500, free_threshold: 0, currency: 'EGP', express_available: true, estimated_days: '2-4 أيام عمل' },
  payment_methods: { cash_on_delivery: true, card: false, instapay: false, vodafone_cash: false },
  discounts: [],
  whatsapp: {
    enabled: true, provider: 'direct_link', support_phone: '', webhook_url: '',
    api_token: '', instance_id: '', welcome_message: '', auto_confirm: true,
  },
})

/**
 * Shared state for the admin control center. Each section component reads from here
 * instead of receiving props, so sections stay independent of one another.
 */
export const useAdminStore = defineStore('admin', () => {
  const auth = useAuthStore()
  const ui = useUIStore()

  // Catalog
  const categories = ref<Category[]>([])
  const productTypes = ref<ProductType[]>([])
  const collections = ref<{ slug: string; name: string }[]>([])
  const products = ref<EditableProduct[]>([])

  // Operations
  const orders = ref<any[]>([])
  const ordersTotal = ref<number | null>(null)
  const orderPage = ref(1)
  const customers = ref<any[]>([])
  const customersTotal = ref<number | null>(null)
  const customerPage = ref(1)
  const whatsappQueue = ref<any[]>([])
  const auditEvents = ref<any[]>([])
  const analytics = ref<{ revenue: number; processing: number } | null>(null)

  // Session / UI
  const signedIn = ref(true)
  const ready = ref(false)
  const busy = ref(false)
  const error = ref('')
  const staffRole = ref(auth.staffSession?.role || '')
  const isAdminRole = computed(() => staffRole.value === 'admin')
  let csrf = ''
  const csrfToken = () => csrf

  // Settings
  const settings = ref<StoreSettings>(defaultSettings())
  const settingsLoaded = ref(false)

  // Filters
  const searchOrders = ref('')
  const filterOrderStatus = ref('')
  const searchCustomers = ref('')

  async function request(path: string, data?: object, method = data ? 'POST' : 'GET') {
    const body = await staffRequest(path, {
      method,
      headers: data ? { 'Content-Type': 'application/json' } : {},
      body: data ? JSON.stringify(data) : undefined,
    })
    if (body?.csrf) { csrf = body.csrf; auth.csrfToken = body.csrf }
    return body
  }

  /** Runs an action with the busy flag and a single place for error reporting. */
  async function run(action: () => Promise<void>) {
    if (busy.value) return
    busy.value = true
    error.value = ''
    try {
      await action()
    } catch (failure) {
      error.value = failure instanceof Error ? failure.message : 'حدث خطأ غير متوقع.'
      ui.showToast(error.value, 'error')
    } finally {
      busy.value = false
    }
  }

  function applySettings(rows: unknown) {
    if (!Array.isArray(rows)) return
    const base = defaultSettings()
    for (const item of rows as Array<{ key: keyof StoreSettings; value: any }>) {
      if (!item?.value) continue
      if (item.key === 'whatsapp' || item.key === 'storefront') settings.value[item.key] = { ...base[item.key], ...item.value }
      else if (item.key in settings.value) (settings.value as any)[item.key] = item.value
    }
  }

  async function loadCatalog() {
    const data = await request('catalog')
    categories.value = data.categories || []
    productTypes.value = data.productTypes || []
    collections.value = data.collections || []
    products.value = data.products || []
  }

  async function loadBundle(): Promise<boolean> {
    try {
      const data = await request('bundle')
      csrf = data.session.csrf
      signedIn.value = data.session.signedIn
      staffRole.value = data.session.role || ''
      if (data.session.signedIn) {
        categories.value = data.catalog?.categories || []
        productTypes.value = data.catalog?.productTypes || []
        collections.value = data.catalog?.collections || []
        products.value = data.catalog?.products || []
        orders.value = data.orders || []
        analytics.value = data.analytics || null
        whatsappQueue.value = data.whatsappQueue || []
        applySettings(data.settings)
      }
      ready.value = true
      return data.session.signedIn
    } catch {
      return false
    }
  }

  async function loadOrders() {
    const params = new URLSearchParams({ page: String(orderPage.value) })
    if (filterOrderStatus.value) params.set('status', filterOrderStatus.value)
    const query = searchOrders.value.trim()
    if (/^[0-9a-f-]{4,}$/i.test(query)) params.set('q', query)
    const [list, queue] = await Promise.all([staffList('orders?' + params), request('whatsapp-queue')])
    orders.value = list.items
    ordersTotal.value = list.total
    whatsappQueue.value = queue
  }

  async function loadCustomers() {
    const list = await staffList('customers?page=' + customerPage.value)
    customers.value = list.items
    customersTotal.value = list.total
  }

  async function loadSettings() {
    applySettings(await request('settings'))
    settingsLoaded.value = true
  }

  async function loadAudit() {
    auditEvents.value = await request('audit')
  }

  /** Loads whatever the given section needs. Safe to call repeatedly. */
  async function loadSection(section: string) {
    if (!signedIn.value) return
    try {
      // Orders and the WhatsApp queue are admin-only on the server, so a catalog
      // manager's dashboard must not request them (ADM-02).
      if ((section === 'orders' || section === 'dashboard') && isAdminRole.value) await loadOrders()
      if (section === 'customers') await loadCustomers()
      if (section === 'settings' && isAdminRole.value) await loadSettings()
      if (section === 'audit' && isAdminRole.value) await loadAudit()
    } catch (failure) {
      error.value = failure instanceof Error ? failure.message : 'تعذر تحميل بيانات القسم.'
    }
  }

  const inventoryMetrics = computed(() => {
    const published = products.value.filter((p) => p.published)
    const variants = products.value.flatMap((p) => p.variants)
    const categoryCounts = categories.value
      .map((cat) => ({ ...cat, count: published.filter((p) => p.categoryId === cat.slug).length }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
    return {
      published: published.length,
      drafts: products.value.length - published.length,
      stockUnits: variants.reduce((total, v) => total + v.stock, 0),
      lowStock: variants.filter((v) => v.stock > 0 && v.stock <= LOW_STOCK).length,
      outOfStock: variants.filter((v) => v.stock === 0).length,
      totalRevenue: analytics.value?.revenue ?? orders.value.reduce((sum, o) => sum + (o.status === 'delivered' ? o.total : 0), 0),
      processingCount: analytics.value?.processing ?? orders.value.filter((o) => o.status === 'processing').length,
      categoryCounts,
      maxCategoryCount: Math.max(1, ...categoryCounts.map((c) => c.count)),
    }
  })

  /** Variants at or below the low-stock threshold, most urgent first. */
  const restockList = computed(() =>
    products.value
      .flatMap((p) => p.variants.filter((v) => v.stock <= LOW_STOCK).map((v) => ({ product: p, color: v.color, size: v.size, stock: v.stock })))
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 8)
  )

  const pageCount = (total: number | null, page: number, shown: number) =>
    total === null ? (shown < PAGE_SIZE ? page : page + 1) : Math.max(1, Math.ceil(total / PAGE_SIZE))
  const orderPages = computed(() => pageCount(ordersTotal.value, orderPage.value, orders.value.length))
  const customerPages = computed(() => pageCount(customersTotal.value, customerPage.value, customers.value.length))

  async function goToPage(kind: 'orders' | 'customers', page: number) {
    if (kind === 'orders') { orderPage.value = page; await loadSection('orders') }
    else { customerPage.value = page; await loadSection('customers') }
  }

  function invalidateStorefront() {
    useCatalogStore().invalidateFreshness()
  }

  return {
    categories, productTypes, collections, products,
    orders, ordersTotal, orderPage, customers, customersTotal, customerPage,
    whatsappQueue, auditEvents, analytics,
    signedIn, ready, busy, error, staffRole, isAdminRole, csrfToken,
    settings, settingsLoaded,
    searchOrders, filterOrderStatus, searchCustomers,
    request, run, loadCatalog, loadBundle, loadSection, loadOrders, goToPage,
    inventoryMetrics, restockList, orderPages, customerPages,
    invalidateStorefront,
  }
})
