<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ProductEditor from './ProductEditor.vue'
import { staffRequest } from './api/staff'
import type { EditableProduct, ProductStock } from './product-options'
import { categoryBranch, categoryPath, categoryRows, type Category, type ProductType } from './taxonomy'
import { useCatalogStore } from './stores/catalog'
import { useAuthStore } from './stores/auth'
import { useUIStore } from './stores/ui'
import { useLocaleStore } from './stores/locale'

const router = useRouter()
const auth = useAuthStore()
const editorRef = ref<InstanceType<typeof ProductEditor>>()
const editorDraftKey = computed(() => 'studioactive_product_draft_v1:' + (auth.user?.email || '') + ':' + (props.productId || 'new') + ':' + props.initialCategory)
const ui = useUIStore()
const locale = useLocaleStore()

const props = defineProps<{
  demo: boolean
  section: string
  productId: string
  demoCategories: Category[]
  demoTypes: ProductType[]
  demoProducts: EditableProduct[]
  initialCategory: string
}>()

type Stock = ProductStock
type Product = EditableProduct

// State
const categories = ref<Category[]>([])
const products = ref<Product[]>([])
const orders = ref<any[]>([])
const orderPage = ref(1)
const customerPage = ref(1)
const analytics = ref<{ revenue: number; processing: number } | null>(null)
const customers = ref<any[]>([])
const auditEvents = ref<any[]>([])
const productTypes = ref<ProductType[]>([])

// Auth & UI State (Optimistic App Shell)
const signedIn = ref(true)
const ready = ref(false)
const busy = ref(false)
const notice = ref('')
const error = ref('')
const staffRole = ref(auth.staffSession?.role || 'admin')
let csrf = ''

// WhatsApp Queue State
const whatsappQueue = ref<any[]>([])

// Settings State
interface StoreSettings {
  storefront: {
    announcement_text: string
    visit_label: string
    location_url: string
  }
  shipping: {
    fee: number
    free_threshold: number
    currency: string
    express_available: boolean
    estimated_days: string
  }
  payment_methods: {
    cash_on_delivery: boolean
    card: boolean
    instapay: boolean
    vodafone_cash: boolean
  }
  discounts: Array<{
    code: string
    percent: number
    min_spend: number
    active: boolean
  }>
  whatsapp: {
    enabled: boolean
    provider: string
    support_phone: string
    webhook_url: string
    api_token: string
    instance_id: string
    welcome_message: string
    auto_confirm: boolean
  }
}

const defaultSettings: StoreSettings = {
  storefront: {
    announcement_text: 'Free shipping over 4000 EGP',
    visit_label: 'Visit Us',
    location_url: '',
  },
  shipping: { fee: 8500, free_threshold: 80000, currency: 'EGP', express_available: true, estimated_days: '2-4 أيام عمل' },
  payment_methods: { cash_on_delivery: true, card: false, instapay: false, vodafone_cash: false },
  discounts: [
    { code: 'WELCOME10', percent: 10, min_spend: 30000, active: true },
    { code: 'STUDIO20', percent: 20, min_spend: 100000, active: true }
  ],
  whatsapp: {
    enabled: true,
    provider: 'direct_link',
    support_phone: '01000000000',
    webhook_url: '',
    api_token: '',
    instance_id: '',
    welcome_message: 'Hello, I would like to ask about your products.',
    auto_confirm: true,
  }
}

const settings = ref<StoreSettings>(structuredClone(defaultSettings))
const newDiscount = ref({ code: '', percent: 10, min_spend: 50000, active: true })

// Administrative customer data is never restored from browser storage.
try { sessionStorage.removeItem('studioactive_admin_bundle') } catch {}

// Categories Editor State
const emptyCategory = (parent_slug: string | null = null): Category => ({ slug: '', name: '', parent_slug, type_slug: null })
const category = ref<Category>(emptyCategory())
const editingCategory = ref(false)
const typeForm = ref<ProductType>({ slug: '', name: '' })

// Products Editor State
const product = ref<Product>()
const changed = ref<string[]>([])
const originalStock = ref<Stock[]>([])

// Filters & Searches
const searchProducts = ref('')
const filterVisibility = ref('')
const filterCategory = ref('')
const searchOrders = ref('')
const filterOrderStatus = ref('')
const searchCustomers = ref('')
const expandedOrders = ref<Record<string, boolean>>({})

// Computed
const categoryList = computed(() => categoryRows(categories.value))
const eligibleParents = computed(() => {
  const blocked = categoryBranch(categories.value, category.value.slug)
  return categoryList.value.filter(({ category: item }) => !blocked.has(item.slug))
})
const categoryLabel = (slug: string) => categoryPath(categories.value, slug).map(item => item.name).join(' ← ')

const shownProducts = computed(() =>
  products.value.filter(item => {
    const matchName = item.name.toLowerCase().includes(searchProducts.value.trim().toLowerCase())
    const matchVis = !filterVisibility.value || item.published === (filterVisibility.value === 'published')
    const matchCat = !filterCategory.value || item.categoryId === filterCategory.value
    return matchName && matchVis && matchCat
  })
)

const filteredOrders = computed(() =>
  orders.value.filter(order => {
    const query = searchOrders.value.trim().toLowerCase()
    const matchQuery = !query ||
      order.id.toLowerCase().includes(query) ||
      (order.customer_name && order.customer_name.toLowerCase().includes(query)) ||
      (order.customer_phone && order.customer_phone.includes(query)) ||
      (order.customer_address && order.customer_address.toLowerCase().includes(query))
    const matchStatus = !filterOrderStatus.value || order.status === filterOrderStatus.value
    return matchQuery && matchStatus
  })
)

const filteredCustomers = computed(() =>
  customers.value.filter(c => {
    const query = searchCustomers.value.trim().toLowerCase()
    return !query ||
      c.name.toLowerCase().includes(query) ||
      c.phone.includes(query) ||
      c.governorate.toLowerCase().includes(query)
  })
)

const inventoryMetrics = computed(() => {
  const published = products.value.filter(p => p.published)
  const drafts = products.value.filter(p => !p.published)
  const variants = products.value.flatMap(p => p.variants)
  const lowStock = variants.filter(v => v.stock > 0 && v.stock <= 2)
  const outOfStock = variants.filter(v => v.stock === 0)
  const totalRevenue = orders.value.reduce((sum, o) => sum + (o.status === 'delivered' ? o.total : 0), 0)
  const processingCount = orders.value.filter(o => o.status === 'processing').length

  const categoryCounts = categories.value.map(cat => ({
    ...cat,
    count: published.filter(p => p.categoryId === cat.slug).length,
  })).filter(c => c.count > 0).sort((a, b) => b.count - a.count).slice(0, 6)
  const maxCategoryCount = Math.max(1, ...categoryCounts.map(c => c.count))

  return {
    published: published.length,
    drafts: drafts.length,
    stockUnits: variants.reduce((total, v) => total + v.stock, 0),
    lowStock: lowStock.length,
    outOfStock: outOfStock.length,
    totalRevenue: analytics.value?.revenue ?? totalRevenue,
    processingCount: analytics.value?.processing ?? processingCount,
    categoryCounts,
    maxCategoryCount,
  }
})

// HTTP Request Utility with CSRF & Credentials
async function request(path: string, data?: object, method = data ? 'POST' : 'GET') {
  const body = await staffRequest(path, {
    method,
    headers: data ? { 'Content-Type': 'application/json' } : {},
    body: data ? JSON.stringify(data) : undefined,
  })
  if (body?.csrf) { csrf = body.csrf; auth.csrfToken = body.csrf }
  return body
}

async function run(action: () => Promise<void>) {
  if (busy.value) return
  busy.value = true
  error.value = notice.value = ''
  try {
    await action()
  } catch (failure) {
    error.value = failure instanceof Error ? failure.message : 'حدث خطأ غير متوقع.'
    ui.showToast(error.value, 'error')
  } finally {
    busy.value = false
  }
}

// Data loaders
async function load() {
  const data = await request('catalog')
  categories.value = data.categories || []
  productTypes.value = data.productTypes || []
  products.value = data.products || []
}

async function loadBundle() {
  try {
    const data = await request('bundle')
    csrf = data.session.csrf
    signedIn.value = data.session.signedIn
    staffRole.value = data.session.role || ''

    if (data.session.signedIn) {
      categories.value = data.catalog?.categories || []
      productTypes.value = data.catalog?.productTypes || []
      products.value = data.catalog?.products || []
      orders.value = data.orders || []
      analytics.value = data.analytics || null
      whatsappQueue.value = data.whatsappQueue || []

      if (Array.isArray(data.settings) && data.settings.length) {
        for (const item of data.settings) {
          if (item.key === 'shipping' && item.value) settings.value.shipping = item.value
          if (item.key === 'payment_methods' && item.value) settings.value.payment_methods = item.value
          if (item.key === 'discounts' && item.value) settings.value.discounts = item.value
          if (item.key === 'whatsapp' && item.value) settings.value.whatsapp = { ...defaultSettings.whatsapp, ...item.value }
          if (item.key === 'storefront' && item.value) settings.value.storefront = { ...defaultSettings.storefront, ...item.value }
        }
      }


    }
    ready.value = true
    return data.session.signedIn
  } catch {
    return false
  }
}

async function loadSection() {
  if (!signedIn.value) return
  try {
    if (props.section === 'products') openEditor()
    if (props.section === 'orders' || props.section === 'dashboard') {
      const [ord, wa] = await Promise.all([
        request('orders?page=' + orderPage.value),
        request('whatsapp-queue')
      ])
      orders.value = ord
      whatsappQueue.value = wa
    }
    if (props.section === 'customers') {
      customers.value = await request('customers?page=' + customerPage.value)
    }
    if (props.section === 'settings' && staffRole.value === 'admin') {
      const values = await request('settings')
      if (Array.isArray(values) && values.length) {
        for (const item of values) {
          if (item.key === 'shipping' && item.value) settings.value.shipping = item.value
          if (item.key === 'payment_methods' && item.value) settings.value.payment_methods = item.value
          if (item.key === 'discounts' && item.value) settings.value.discounts = item.value
          if (item.key === 'whatsapp' && item.value) settings.value.whatsapp = { ...defaultSettings.whatsapp, ...item.value }
          if (item.key === 'storefront' && item.value) settings.value.storefront = { ...defaultSettings.storefront, ...item.value }
        }
      }
    }
    if (props.section === 'audit' && staffRole.value === 'admin') {
      auditEvents.value = await request('audit')
    }
  } catch (failure) {
    error.value = failure instanceof Error ? failure.message : 'تعذر تحميل بيانات القسم.'
  }
}

onMounted(async () => {
  await run(async () => {
    const isOk = await loadBundle()
    if (!isOk) {
      await router.replace('/login')
    } else {
      openEditor()
      if (props.section === 'customers' || props.section === 'audit') {
        void loadSection()
      }
    }
  })
  ready.value = true
})

watch(() => [props.section, props.productId, props.initialCategory], () => {
  if (!ready.value) return // ⚡ Prevent double execution on initial mount
  openEditor()
  void loadSection()
})

// Product Editor actions
function openEditor() {
  if (props.section !== 'products') return
  if (props.productId === 'new') edit()
  else {
    const item = products.value.find(p => p.id === props.productId)
    product.value = undefined
    if (item) edit(item)
  }
}

function edit(item?: Product) {
  product.value = item ? { ...item, variants: item.variants.map(v => ({ ...v })) } : {
    id: '',
    name: '',
    categoryId: categories.value.some(c => c.slug === props.initialCategory) ? props.initialCategory : '',
    description: '',
    price: 0,
    published: false,
    variants: [],
  }
  originalStock.value = item?.variants ?? []
  changed.value = []
}

function cancelProduct() {
  router.push('/admin/products')
}

function saveProduct(item: Product, original: Stock[]) {
  return run(async () => {
    await request('products', {
      ...item,
      id: item.id || null,
      originalVariants: original.map(({ sku, color, size, stock }) => ({ sku, color, size, stock })),
    })
    useCatalogStore().invalidateFreshness()
    editorRef.value?.clearDraft()
    await load()
    product.value = undefined
    router.push('/admin/products')
    ui.showToast('تم حفظ المنتج بنجاح!', 'success')
  })
}

function togglePublish(item: Product) {
  return run(async () => {
    const res = await request(`products/${item.id}/toggle-publish`, {}, 'POST')
    item.published = res.published
    useCatalogStore().invalidateFreshness()
    ui.showToast(item.published ? 'تم نشر المنتج في المتجر' : 'تم تحويل المنتج إلى مسودة', 'info')
  })
}

function deleteProduct(item: Product) {
  if (!confirm(`هل أنت متأكد من حذف المنتج "${item.name}" نهائياً من قاعدة البيانات؟`)) return
  return run(async () => {
    await request(`products/${item.id}`, {}, 'DELETE')
    useCatalogStore().invalidateFreshness()
    await load()
    ui.showToast('تم حذف المنتج نهائياً', 'success')
  })
}

// Order Status Update
function updateOrderStatus(order: any, newStatus: string) {
  return run(async () => {
    await request(`orders/${order.id}/status`, { status: newStatus }, 'PUT')
    order.status = newStatus
    await loadBundle()
    ui.showToast(`تم تحديث حالة الطلب #${order.id.slice(0, 8)} إلى: ${statusLabel(newStatus)}`, 'success')
  })
}

function toggleOrderExpand(id: string) {
  expandedOrders.value[id] = !expandedOrders.value[id]
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    processing: 'قيد التجهيز',
    shipped: 'تم الشحن',
    delivered: 'تم التوصيل',
    returned: 'Returned / مرتجع',
    cancelled: 'ملغي',
  }
  return map[status] || status
}

function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    processing: 'status-processing',
    shipped: 'status-shipped',
    delivered: 'status-delivered',
    cancelled: 'status-cancelled',
  }
  return map[status] || ''
}

// Categories Actions
function startCategory(item?: Category, parent: string | null = null) {
  category.value = item ? { ...item } : emptyCategory(parent)
  editingCategory.value = Boolean(item)
}

function saveCategory() {
  return run(async () => {
    if (!editingCategory.value && categories.value.some(c => c.slug === category.value.slug)) {
      throw new Error('الرابط المختصر مستخدم بالفعل. اختر رابطاً مختلفاً.')
    }
    if (category.value.parent_slug && categoryBranch(categories.value, category.value.slug).has(category.value.parent_slug)) {
      throw new Error('لا يمكن نقل التصنيف داخل نفسه أو داخل أحد فروعه.')
    }
    await request('categories', { ...category.value, editing: editingCategory.value })
    await load()
    startCategory()
    ui.showToast('تم حفظ التصنيف بنجاح', 'success')
  })
}

function saveType() {
  return run(async () => {
    await request('product-types', typeForm.value)
    await load()
    typeForm.value = { slug: '', name: '' }
    ui.showToast('تم حفظ نوع المنتج', 'success')
  })
}

// WhatsApp Direct Messaging & Queue Helpers
function getWhatsAppOrderUrl(order: any): string {
  const cleanPhone = (order.customer_phone || '').replace(/\D/g, '')
  const phone = cleanPhone.startsWith('01') ? '2' + cleanPhone : cleanPhone
  const shortId = (order.id || '').slice(0, 8).toUpperCase()
  const total = (order.total / 100).toLocaleString('ar-EG')
  
  let msg = `⚡ *STUDIO ACTIVE · تأكيد الطلب* ⚡\n\n`
  msg += `أهلاً *${order.customer_name || 'عميلنا العزيز'}*! 👋\n`
  msg += `تم استلام طلبك بنجاح وجاري تجهيزه ✅\n\n`
  msg += `📋 *تفاصيل الطلب:*\n`
  msg += `▸ رقم الطلب: *#${shortId}*\n`
  msg += `▸ الإجمالي: *${total} ج.م* (الدفع عند الاستلام 💵)\n`
  msg += `▸ التوصيل إلى: ${order.customer_address || ''}\n\n`
  msg += `🚚 التوصيل خلال 24-48 ساعة عمل.\n`
  msg += `هل تؤكد استلام الشحنة عند وصول المندوب؟ برجاء الرد بـ (نعم أؤكد) 💬\n`
  msg += `شكراً لاختيارك *Studio Active*! ✨`
  
  const digits = phone.replace(/\\D/g, '')
  let internationalPhone = digits
  if (digits.startsWith('01') && digits.length === 11) internationalPhone = '2' + digits
  else if (digits.startsWith('0020')) internationalPhone = digits.slice(2)
  return `https://wa.me/${internationalPhone}?text=${encodeURIComponent(msg)}`
}

async function markQueueItemSent(item: any) {
  try {
    await request(`whatsapp-queue/${item.id}/mark-sent`, {}, 'PUT')
    item.manually_sent = 1
    ui.showToast('تم تعليم رسالة الواتساب كمرسلة ✅', 'success')
  } catch (err) {
    ui.showToast('تعذر تحديث حالة الإرسال', 'error')
  }
}

function openAndMarkSent(item: any) {
  if (item.admin_send_url) {
    window.open(item.admin_send_url, '_blank')
  }
  void markQueueItemSent(item)
}

async function notifyCustomerStatus(order: any, status: string) {
  return run(async () => {
    const res = await request('whatsapp-notify-status', { order_id: order.id, status }, 'POST')
    if (res.admin_send_url) {
      window.open(res.admin_send_url, '_blank')
    }
    whatsappQueue.value = await request('whatsapp-queue')
    ui.showToast(`تم تجهيز رسالة التحديث (${statusLabel(status)}) لفتحها في واتساب!`, 'success')
  })
}

function openWhatsAppUrl(url: string) {
  if (url) window.open(url, '_blank')
}

// Settings Actions
function saveStoreSettings() {
  return run(async () => {
    await request('settings/shipping', { value: settings.value.shipping }, 'PUT')
    await request('settings/payment_methods', { value: settings.value.payment_methods }, 'PUT')
    await request('settings/discounts', { value: settings.value.discounts }, 'PUT')
    await request('settings/whatsapp', { value: settings.value.whatsapp }, 'PUT')
    await request('settings/storefront', { value: settings.value.storefront }, 'PUT')
    useCatalogStore().invalidateFreshness()
    try { sessionStorage.removeItem('studioactive_catalog_cache') } catch {}
    await useCatalogStore().load(true)
    ui.showToast('تم حفظ إعدادات المتجر ورسائل واتساب بنجاح!', 'success')
  })
}

function addDiscount() {
  if (!newDiscount.value.code.trim()) return
  settings.value.discounts.push({
    code: newDiscount.value.code.toUpperCase().trim(),
    percent: Number(newDiscount.value.percent),
    min_spend: Number(newDiscount.value.min_spend),
    active: true,
  })
  newDiscount.value.code = ''
}

function removeDiscount(index: number) {
  settings.value.discounts.splice(index, 1)
}

async function logout() {
  await auth.logout()
  await router.replace('/shop')
}
</script>

<template>
  <nav v-if="section === 'orders' || section === 'customers'" aria-label="Results pages" class="admin-pagination">
    <button type="button" @click="section === 'orders' ? orderPage = Math.max(1, orderPage - 1) : customerPage = Math.max(1, customerPage - 1); loadSection()">Previous</button>
    <span>{{ section === 'orders' ? orderPage : customerPage }}</span>
    <button type="button" @click="section === 'orders' ? orderPage++ : customerPage++; loadSection()">Next</button>
  </nav>
  <main class="admin-shell" :dir="locale.isRTL ? 'rtl' : 'ltr'">
    <!-- Top-level Sidebar (Always Rendered Instantly 0ms) -->
    <aside class="admin-sidebar">
      <div class="sidebar-header">
        <router-link class="admin-brand" to="/admin/dashboard">
          STUDIO <span class="lime-text">ACTIVE</span>
          <small class="brand-sub">CONTROL CENTER</small>
        </router-link>
      </div>

      <div class="sidebar-nav">
        <div class="sidebar-label">WORKSPACE</div>
        <router-link to="/admin/dashboard" class="sidebar-link">
          <span class="nav-icon">▦</span>
          <span>لوحة التحكم</span>
        </router-link>
        <router-link to="/admin/products" class="sidebar-link">
          <span class="nav-icon">▤</span>
          <span>المنتجات والمخزون</span>
          <span v-if="products.length" class="counter-pill">{{ products.length }}</span>
        </router-link>
        <router-link to="/admin/categories" class="sidebar-link">
          <span class="nav-icon">⌘</span>
          <span>التصنيفات</span>
        </router-link>
        <router-link to="/admin/orders" class="sidebar-link">
          <span class="nav-icon">▣</span>
          <span>الطلبات</span>
          <span v-if="inventoryMetrics.processingCount" class="badge-alert">{{ inventoryMetrics.processingCount }}</span>
        </router-link>
        <router-link to="/admin/customers" class="sidebar-link">
          <span class="nav-icon">♙</span>
          <span>العملاء</span>
        </router-link>

        <template v-if="staffRole === 'admin'">
          <div class="sidebar-label">ADMINISTRATION</div>
          <router-link to="/admin/settings" class="sidebar-link">
            <span class="nav-icon">⚙</span>
            <span>إعدادات المتجر</span>
          </router-link>
          <router-link to="/admin/audit" class="sidebar-link">
            <span class="nav-icon">≡</span>
            <span>سجل النشاط</span>
          </router-link>
        </template>
      </div>

      <div class="sidebar-footer">
        <router-link to="/shop" class="sidebar-action-btn view-shop">
          <span>↗ عرض المتجر</span>
        </router-link>
        <button type="button" class="sidebar-action-btn logout-btn" :disabled="busy" @click="logout">
          <span>⤴ تسجيل الخروج</span>
        </button>
      </div>
    </aside>

    <!-- Main Admin Workspace -->
    <section class="admin-workspace">
      <!-- Topbar Header (Always Rendered Instantly 0ms) -->
      <header class="workspace-topbar">
        <div class="topbar-breadcrumb">
          <span class="site-tag">Studio Active</span>
          <span class="sep">/</span>
          <b class="active-sec">{{ section.toUpperCase() }}</b>
        </div>
        <div class="topbar-user">
          <span class="role-badge">{{ staffRole === 'admin' ? 'SYSTEM ADMIN' : 'STAFF MANAGER' }}</span>
          <span class="user-email">{{ auth.user?.email || 'admin@studioactive.com' }}</span>
        </div>
      </header>

      <!-- Content Views (Skeletons / Real Data - No Fullpage Loader Spinner) -->
      <div class="workspace-content">
        <!-- 1. DASHBOARD OVERVIEW -->
        <template v-if="section === 'dashboard'">
          <section class="admin-dashboard">
            <header class="dashboard-header">
              <div>
                <p class="dashboard-sub">STUDIO ACTIVE · PERFORMANCE OVERVIEW</p>
                <h1>لوحة التحكم والمؤشرات</h1>
              </div>
              <router-link class="btn-primary-lime" to="/admin/products/new">
                ＋ إضافة منتج جديد
              </router-link>
            </header>

            <!-- Metrics Cards -->
            <div class="kpi-grid">
              <div class="kpi-card">
                <span class="kpi-label">إجمالي المبيعات</span>
                <strong v-if="ready || products.length" class="kpi-value">{{ (inventoryMetrics.totalRevenue / 100).toLocaleString('ar-EG') }} ج.م</strong>
                <div v-else class="skeleton-shimmer h-metric"></div>
                <span class="kpi-hint">من الطلبات النشطة</span>
              </div>
              <div class="kpi-card">
                <span class="kpi-label">طلبات قيد التجهيز</span>
                <strong v-if="ready || products.length" class="kpi-value lime-val">{{ inventoryMetrics.processingCount }}</strong>
                <div v-else class="skeleton-shimmer h-metric"></div>
                <span class="kpi-hint">تحتاج تعبئة وشحن</span>
              </div>
              <div class="kpi-card">
                <span class="kpi-label">المنتجات المنشورة</span>
                <strong v-if="ready || products.length" class="kpi-value">{{ inventoryMetrics.published }}</strong>
                <div v-else class="skeleton-shimmer h-metric"></div>
                <span class="kpi-hint">{{ inventoryMetrics.drafts }} مسودة</span>
              </div>
              <div class="kpi-card">
                <span class="kpi-label">وحدات المخزون</span>
                <strong v-if="ready || products.length" class="kpi-value">{{ inventoryMetrics.stockUnits.toLocaleString('ar-EG') }}</strong>
                <div v-else class="skeleton-shimmer h-metric"></div>
                <span class="kpi-hint" :class="{ 'warning-text': inventoryMetrics.lowStock > 0 }">
                  {{ inventoryMetrics.lowStock }} منخفض · {{ inventoryMetrics.outOfStock }} نفد
                </span>
              </div>
            </div>

            <!-- Dashboard Split Panels -->
            <div class="dashboard-split">
              <!-- Recent Orders -->
              <div class="dash-panel">
                <div class="dash-panel-head">
                  <h3>أحدث الطلبات الواردة</h3>
                  <router-link to="/admin/orders" class="link-btn">عرض الكل ←</router-link>
                </div>
                <div v-if="!orders.length" class="empty-state-box">
                  <p>لا توجد طلبات مسجلة حتى الآن.</p>
                </div>
                <div v-else class="dash-orders-list">
                  <div v-for="order in orders.slice(0, 5)" :key="order.id" class="dash-order-row">
                    <div>
                      <strong>#{{ order.id.slice(0, 8) }}</strong>
                      <span class="cust-name">· {{ order.customer_name }}</span>
                      <small class="time-stamp">{{ order.created_at }}</small>
                    </div>
                    <div class="order-right">
                      <span :class="['badge-status', statusBadgeClass(order.status)]">{{ statusLabel(order.status) }}</span>
                      <b class="price-val">{{ (order.total / 100).toLocaleString('ar-EG') }} ج.م</b>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Inventory & Category Distribution -->
              <div class="dash-panel">
                <div class="dash-panel-head">
                  <h3>المنتجات حسب التصنيف</h3>
                  <router-link to="/admin/categories" class="link-btn">إدارة التصنيفات ←</router-link>
                </div>
                <div class="category-bars">
                  <div v-for="item in inventoryMetrics.categoryCounts" :key="item.slug" class="cat-bar-item">
                    <div class="cat-bar-labels">
                      <span>{{ item.name }}</span>
                      <b>{{ item.count }} منتج</b>
                    </div>
                    <div class="bar-bg">
                      <div class="bar-fill" :style="{ width: (item.count / inventoryMetrics.maxCategoryCount * 100) + '%' }"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </template>

        <!-- 2. PRODUCTS & INVENTORY -->
        <template v-else-if="section === 'products'">
          <template v-if="productId">
            <div class="editor-shell">
              <router-link class="btn-back" to="/admin/products">← العودة لقائمة المنتجات</router-link>
              <h1 class="page-title">{{ productId === 'new' ? 'إضافة منتج رياضي جديد' : 'تعديل بيانات المنتج' }}</h1>
              <ProductEditor
                ref="editorRef"
                :draft-key="editorDraftKey"
                v-if="product"
                :key="product.id + ':' + productId"
                :initial="product"
                :categories="categories"
                :demo="false"
                :csrf="csrf"
                :busy="busy"
                @save="saveProduct"
                @cancel="cancelProduct"
              />
            </div>
          </template>
          <template v-else>
            <div class="section-topbar">
              <div>
                <h1>المنتجات والمخزون</h1>
                <p class="section-desc">إدارة الكتالوج، الأسعار، المقاسات، وحالة النشر في المتجر.</p>
              </div>
              <router-link class="btn-primary-lime" to="/admin/products/new">
                ＋ أضف منتج جديد
              </router-link>
            </div>

            <!-- Filters Bar -->
            <div class="filters-bar">
              <input v-model="searchProducts" type="search" placeholder="ابحث باسم المنتج…" class="search-input" />
              <select v-model="filterCategory" class="filter-select">
                <option value="">كل التصنيفات</option>
                <option v-for="cat in categories" :key="cat.slug" :value="cat.slug">{{ cat.name }}</option>
              </select>
              <select v-model="filterVisibility" class="filter-select">
                <option value="">كل الحالات</option>
                <option value="published">منشور في المتجر</option>
                <option value="draft">مسودة</option>
              </select>
            </div>

            <!-- Products Table -->
            <div class="table-container">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>المنتج</th>
                    <th>التصنيف</th>
                    <th>السعر</th>
                    <th>إجمالي المخزون</th>
                    <th>الحالة</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!shownProducts.length">
                    <td colspan="6" class="text-center py-4">لا توجد منتجات مطابقة للبحث.</td>
                  </tr>
                  <tr v-for="item in shownProducts" :key="item.id">
                    <td>
                      <div class="product-info-cell">
                        <div class="prod-thumb">👕</div>
                        <div>
                          <strong>{{ item.name }}</strong>
                          <small class="sku-hint">{{ item.id }}</small>
                        </div>
                      </div>
                    </td>
                    <td>{{ item.categoryId ? categoryLabel(item.categoryId) : '—' }}</td>
                    <td><strong>{{ (item.price / 100).toLocaleString('ar-EG') }} ج.م</strong></td>
                    <td>
                      <span :class="['stock-badge', item.variants.reduce((s, v) => s + v.stock, 0) > 0 ? 'in-stock' : 'out-stock']">
                        {{ item.variants.reduce((s, v) => s + v.stock, 0) }} قطعة
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        :class="['toggle-pub-btn', item.published ? 'is-pub' : 'is-draft']"
                        :disabled="busy"
                        @click="togglePublish(item)"
                      >
                        {{ item.published ? '✓ منشور' : '○ مسودة' }}
                      </button>
                    </td>
                    <td>
                      <div class="row-actions">
                        <router-link :to="'/admin/products/' + item.id" class="btn-action edit">تعديل</router-link>
                        <button
                          v-if="staffRole === 'admin'"
                          type="button"
                          class="btn-action delete"
                          :disabled="busy"
                          @click="deleteProduct(item)"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </template>

        <!-- 3. ORDERS MANAGEMENT -->
        <template v-else-if="section === 'orders'">
          <div class="section-topbar">
            <div>
              <h1>إدارة الطلبات والشحن</h1>
              <p class="section-desc">متابعة شحنات العملاء، أرقام الهواتف، وتغيير حالات الطلب.</p>
            </div>
          </div>

          <!-- Order Filters -->
          <div class="filters-bar">
            <input v-model="searchOrders" type="search" placeholder="ابحث برقم الطلب، اسم العميل، أو الهاتف…" class="search-input" />
            <select v-model="filterOrderStatus" class="filter-select">
              <option value="">جميع الحالات</option>
              <option value="processing">قيد التجهيز</option>
              <option value="shipped">تم الشحن</option>
              <option value="delivered">تم التوصيل</option>
              <option value="cancelled">ملغي</option>
                    <option value="returned">Returned / مرتجع</option>
            </select>
          </div>

          <!-- WhatsApp Pending Confirmations Queue -->
          <div v-if="whatsappQueue.length" class="whatsapp-queue-card">
            <div class="queue-head">
              <div class="head-left">
                <span class="icon-pulse">⚡</span>
                <div>
                  <h3>إشعارات وتأكيدات واتساب الصادرة للعملاء</h3>
                  <p class="queue-sub">الرسائل المجهزة من النظام لتأكيد الطلبات مع العملاء من رقم المتجر ومتابعة الرد.</p>
                </div>
              </div>
              <span class="queue-count-badge">
                {{ whatsappQueue.filter(q => !q.manually_sent && !q.auto_sent).length }} طلبات تنتظر التأكيد
              </span>
            </div>

            <div class="queue-items-scroller">
              <div
                v-for="qItem in whatsappQueue.slice(0, 6)"
                :key="qItem.id"
                class="queue-item-row"
                :class="{ sent: qItem.manually_sent || qItem.auto_sent }"
              >
                <div class="qitem-info">
                  <strong class="qitem-name">{{ qItem.customer_name }} (#{{ qItem.order_id.slice(0, 8) }})</strong>
                  <span class="qitem-phone" dir="ltr">{{ qItem.customer_phone }}</span>
                </div>
                <div class="qitem-status-col">
                  <span v-if="qItem.auto_sent" class="status-tag auto">تم الإرسال تلقائياً ✓</span>
                  <span v-else-if="qItem.manually_sent" class="status-tag sent">تم الإرسال يدوياً ✓</span>
                  <span v-else class="status-tag pending">بانتظار الإرسال للعميل</span>
                </div>
                <div class="qitem-actions">
                  <button
                    type="button"
                    class="btn-wa-send"
                    @click="openAndMarkSent(qItem)"
                  >
                    <span>📱 إرسال للعميل</span>
                  </button>
                  <button
                    v-if="!qItem.manually_sent && !qItem.auto_sent"
                    type="button"
                    class="btn-wa-mark"
                    title="تعليم كمرسل"
                    @click="markQueueItemSent(qItem)"
                  >
                    ✓ تم
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Orders Cards Skeletons when loading fresh without cache -->
          <div v-if="!ready && !orders.length" class="orders-grid">
            <div v-for="n in 3" :key="n" class="order-manage-card skeleton-card">
              <div class="skeleton-shimmer h-title"></div>
              <div class="skeleton-shimmer h-line"></div>
              <div class="skeleton-shimmer h-line w-half"></div>
            </div>
          </div>

          <div v-else-if="!filteredOrders.length" class="empty-state-box">
            <p>لا توجد طلبات مطابقة للمعايير الحالية.</p>
          </div>

          <!-- Orders Cards -->
          <div v-else class="orders-grid">
            <div v-for="order in filteredOrders" :key="order.id" class="order-manage-card">
              <div class="order-head">
                <div>
                  <span class="order-num">#{{ order.id.slice(0, 8) }}</span>
                  <span class="order-time">{{ order.created_at }}</span>
                </div>
                <div class="order-status-control">
                  <select
                    :value="order.status"
                    class="status-select"
                    :class="statusBadgeClass(order.status)"
                    :disabled="busy"
                    @change="updateOrderStatus(order, ($event.target as HTMLSelectElement).value)"
                  >
                    <option value="processing">قيد التجهيز</option>
                    <option value="shipped">تم الشحن</option>
                    <option value="delivered">تم التوصيل</option>
                    <option value="cancelled">ملغي</option>
                    <option value="returned">Returned / مرتجع</option>
                  </select>
                </div>
              </div>

              <div class="order-body">
                <div class="cust-info">
                  <p><strong>👤 العميل:</strong> {{ order.customer_name }}</p>
                  <p>
                    <strong>📞 الهاتف:</strong>
                    <a :href="'tel:' + order.customer_phone" class="phone-link" dir="ltr">{{ order.customer_phone }}</a>
                    <a
                      v-if="order.customer_phone"
                      :href="getWhatsAppOrderUrl(order)"
                      target="_blank"
                      class="whatsapp-pill"
                      title="مراسلة وتأكيد فوري عبر واتساب"
                    >
                      واتساب 💬
                    </a>
                  </p>
                  <p><strong>📍 العنوان:</strong> {{ order.customer_address }}</p>
                </div>

                <!-- Order WhatsApp Actions Bar -->
                <div class="order-wa-actions-bar">
                  <button
                    type="button"
                    class="wa-action-chip confirm"
                    @click="openWhatsAppUrl(getWhatsAppOrderUrl(order))"
                  >
                    💬 إرسال رسالة تأكيد للعميل
                  </button>
                  <button
                    v-if="order.status === 'processing'"
                    type="button"
                    class="wa-action-chip ship"
                    @click="notifyCustomerStatus(order, 'shipped')"
                  >
                    🚚 إشعار بالشحن
                  </button>
                  <button
                    v-if="order.status === 'shipped'"
                    type="button"
                    class="wa-action-chip deliver"
                    @click="notifyCustomerStatus(order, 'delivered')"
                  >
                    ✅ إشعار بالتوصيل
                  </button>
                </div>

                <div class="order-total-bar">
                  <span>الإجمالي شامل الشحن:</span>
                  <strong>{{ (order.total / 100).toLocaleString('ar-EG') }} ج.م</strong>
                </div>
              </div>

              <!-- Collapsible items lines -->
              <div class="order-footer">
                <button type="button" class="btn-toggle-items" @click="toggleOrderExpand(order.id)">
                  {{ expandedOrders[order.id] ? '▲ إخفاء تفاصيل المنتجات' : `▼ تفاصيل المنتجات (${order.items_count} قطع)` }}
                </button>
                <div v-if="expandedOrders[order.id]" class="items-expanded-list">
                  <div v-for="(line, idx) in order.lines" :key="idx" class="item-line">
                    <span class="sku-name">{{ line.sku }}</span>
                    <span class="qty-badge">{{ line.quantity }}x</span>
                    <span class="price-line">{{ ((line.price * line.quantity) / 100).toLocaleString('ar-EG') }} ج.م</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 4. CUSTOMERS DIRECTORY -->
        <template v-else-if="section === 'customers'">
          <div class="section-topbar">
            <div>
              <h1>دليل العملاء</h1>
              <p class="section-desc">سجل العملاء المستخرج من الطلبات الفعلية مع إحصائيات الشراء والمحافظات.</p>
            </div>
          </div>

          <div class="filters-bar">
            <input v-model="searchCustomers" type="search" placeholder="ابحث باسم العميل، الهاتف، أو المحافظة…" class="search-input" />
          </div>

          <div v-if="!filteredCustomers.length" class="empty-state-box">
            <p>لا يوجد عملاء مسجلين حتى الآن.</p>
          </div>

          <div v-else class="table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>العميل</th>
                  <th>الهاتف</th>
                  <th>المحافظة والعنوان</th>
                  <th>عدد الطلبات</th>
                  <th>إجمالي المشتريات</th>
                  <th>آخر طلب</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="cust in filteredCustomers" :key="cust.phone">
                  <td>
                    <div class="product-info-cell">
                      <div class="cust-avatar">👤</div>
                      <strong>{{ cust.name }}</strong>
                    </div>
                  </td>
                  <td>
                    <a :href="'tel:' + cust.phone" dir="ltr" class="phone-link">{{ cust.phone }}</a>
                  </td>
                  <td>
                    <span class="gov-badge">{{ cust.governorate }}</span>
                    <small class="d-block text-muted">{{ cust.address }}</small>
                  </td>
                  <td><strong>{{ cust.orders_count }} طلب</strong></td>
                  <td><strong class="lime-text">{{ (cust.total_spent / 100).toLocaleString('ar-EG') }} ج.م</strong></td>
                  <td><small>{{ cust.last_order_date }}</small></td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <!-- 5. CATEGORIES HIERARCHY -->
        <template v-else-if="section === 'categories'">
          <div class="section-topbar">
            <div>
              <h1>هيكلية وأقسام المتجر</h1>
              <p class="section-desc">بناء الشجرة الهرمية للأقسام والأنواع العامة لعرض المنتجات في القوائم.</p>
            </div>
            <button type="button" class="btn-primary-lime" @click="startCategory()">
              ＋ تصنيف رئيسي جديد
            </button>
          </div>

          <div class="taxonomy-layout">
            <div class="taxonomy-tree-card">
              <div v-for="{ category: item, path } in categoryList" :key="item.slug" class="taxonomy-item-row" :style="{ '--depth': Math.min(path.length - 1, 6) }">
                <div class="cat-details">
                  <strong>{{ item.name }}</strong>
                  <small class="slug-path">{{ path.map(node => node.name).join(' ← ') }}</small>
                  <span v-if="item.type_slug" class="type-pill">النوع: {{ productTypes.find(t => t.slug === item.type_slug)?.name }}</span>
                </div>
                <div class="cat-actions">
                  <button type="button" class="btn-action edit" @click="startCategory(item)">تعديل</button>
                  <button type="button" class="btn-action sub" @click="startCategory(undefined, item.slug)">＋ فرع</button>
                  <router-link :to="'/admin/products/new/' + item.slug" class="btn-action add-prod">＋ منتج</router-link>
                </div>
              </div>
            </div>

            <!-- Category Form -->
            <div class="taxonomy-forms-col">
              <form class="admin-card-form" @submit.prevent="saveCategory">
                <h3>{{ editingCategory ? 'تعديل التصنيف' : category.parent_slug ? 'إضافة تصنيف فرعي' : 'إضافة تصنيف رئيسي' }}</h3>
                <label>
                  اسم التصنيف بالعربية
                  <input v-model.trim="category.name" maxlength="120" required placeholder="مثال: أحذية جري" />
                </label>
                <label>
                  الرابط المختصر (Slug)
                  <input v-model.trim="category.slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" maxlength="80" dir="ltr" required :readonly="editingCategory" placeholder="running-shoes" />
                </label>
                <label>
                  القسم الرئيسي التابع له
                  <select v-model="category.parent_slug">
                    <option :value="null">-- تصنيف رئيسي أعلى --</option>
                    <option v-for="{ category: item, path } in eligibleParents" :key="item.slug" :value="item.slug">
                      {{ path.map(node => node.name).join(' ← ') }}
                    </option>
                  </select>
                </label>
                <label>
                  النوع العام للمنتج
                  <select v-model="category.type_slug">
                    <option :value="null">بدون نوع عام</option>
                    <option v-for="t in productTypes" :key="t.slug" :value="t.slug">{{ t.name }}</option>
                  </select>
                </label>
                <button class="btn-primary-lime wide" :disabled="busy">حفظ التصنيف</button>
              </form>

              <!-- Product Type Form -->
              <form class="admin-card-form mt-4" @submit.prevent="saveType">
                <h3>إضافة نوع منتج عام</h3>
                <p class="form-hint">يستخدم لربط أقسام مختلفة تشترك بنفس الفئة (مثل التيشيرتات في رجالي وحريمي).</p>
                <label>
                  اسم النوع
                  <input v-model.trim="typeForm.name" maxlength="120" required placeholder="مثال: تيشيرتات" />
                </label>
                <label>
                  رابط النوع (Slug)
                  <input v-model.trim="typeForm.slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" maxlength="80" dir="ltr" required placeholder="t-shirts" />
                </label>
                <button class="btn-secondary wide" :disabled="busy">حفظ النوع العام</button>
              </form>
            </div>
          </div>
        </template>

        <!-- 6. STORE SETTINGS -->
        <template v-else-if="section === 'settings'">
          <div v-if="staffRole !== 'admin'" class="empty-state-box">
            <p>قسم الإعدادات مقصور على حسابات الأدمن (Admin) فقط.</p>
          </div>
          <template v-else>
            <div class="section-topbar">
              <div>
                <h1>إعدادات المتجر العامة</h1>
                <p class="section-desc">التحكم في تكاليف الشحن، بوابات الدفع الإلكتروني، وكوبونات الخصم.</p>
              </div>
              <button class="btn-primary-lime" :disabled="busy" @click="saveStoreSettings">
                💾 حفظ كافة التغييرات
              </button>
            </div>

            <div class="settings-grid">
              <!-- Storefront Header Card -->
              <div class="settings-card col-span-2">
                <h3>🎨 الشريط العلوي ومكان المتجر</h3>
                <div class="settings-grid-sub">
                  <label>
                    النص الظاهر أعلى الصفحة
                    <input v-model="settings.storefront.announcement_text" type="text" maxlength="300" dir="ltr" />
                    <small class="hint-text">يظهر في الشريط البرتقالي العلوي على الصفحة الرئيسية.</small>
                  </label>
                  <label>
                    نص زر زيارة المتجر
                    <input v-model="settings.storefront.visit_label" type="text" maxlength="80" />
                  </label>
                  <label>
                    رابط موقع أو خرائط المتجر
                    <input v-model="settings.storefront.location_url" type="url" placeholder="https://maps.google.com/..." dir="ltr" />
                    <small class="hint-text">عند الضغط على Visit Us أو زر الزائر، سيفتح هذا الرابط مباشرة في نافذة جديدة.</small>
                  </label>
                </div>
              </div>

              <!-- Shipping Card -->
              <div class="settings-card">
                <h3>🚚 الشحن والتوصيل</h3>
                <label>
                  رسوم الشحن الثابتة (بالجنيه)
                  <input v-model.number="settings.shipping.fee" type="number" step="500" min="0" />
                  <small class="hint-text">تظهر كـ {{ (settings.shipping.fee / 100).toLocaleString('ar-EG') }} ج.م للعميل</small>
                </label>
                <label>
                  حد الشحن المجاني (بالجنيه)
                  <input v-model.number="settings.shipping.free_threshold" type="number" step="10000" min="0" />
                  <small class="hint-text">شحن مجاني للطلبات فوق {{ (settings.shipping.free_threshold / 100).toLocaleString('ar-EG') }} ج.م</small>
                </label>
                <label>
                  مدة التوصيل التقديرية
                  <input v-model="settings.shipping.estimated_days" type="text" />
                </label>
                <label class="toggle-checkbox-row">
                  <input v-model="settings.shipping.express_available" type="checkbox" />
                  <span>تفعيل خدمة الشحن السريع للمحافظات الرئيسية</span>
                </label>
              </div>

              <!-- Payment Methods Card -->
              <div class="settings-card">
                <h3>💳 بوابات وطرق الدفع</h3>
                <p class="hint-text">حدد الطرق التي يمكن للعملاء اختيارها في صفحة إتمام الطلب (Checkout):</p>
                <label class="toggle-checkbox-row">
                  <input v-model="settings.payment_methods.cash_on_delivery" type="checkbox" />
                  <div>
                    <strong>الدفع عند الاستلام (Cash on Delivery)</strong>
                    <small class="d-block text-muted">السماح بالدفع نقداً لمندوب الشحن</small>
                  </div>
                </label>
                <label class="toggle-checkbox-row">
                  <input v-model="settings.payment_methods.card" type="checkbox" />
                  <div>
                    <strong>البطاقات الائتمانية (Visa / MasterCard)</strong>
                    <small class="d-block text-muted">الدفع الفوري أونلاين</small>
                  </div>
                </label>
                <label class="toggle-checkbox-row">
                  <input v-model="settings.payment_methods.instapay" type="checkbox" />
                  <div>
                    <strong>إنستاباي (InstaPay)</strong>
                    <small class="d-block text-muted">التحويل اللحظي عبر الشبكة القومية</small>
                  </div>
                </label>
                <label class="toggle-checkbox-row">
                  <input v-model="settings.payment_methods.vodafone_cash" type="checkbox" />
                  <div>
                    <strong>محافظ إلكترونية (فودافون كاش / إتصالات كاش)</strong>
                    <small class="d-block text-muted">التحويل عبر المحافظ الذكية</small>
                  </div>
                </label>
              </div>

              <!-- Discounts Card -->
              <div class="settings-card col-span-2">
                <h3>🏷️ كوبونات وعروض الخصم النشطة</h3>
                <div class="discounts-table-wrapper">
                  <table class="admin-table">
                    <thead>
                      <tr>
                        <th>كود الكوبون</th>
                        <th>نسبة الخصم</th>
                        <th>الحد الأدنى للطلب</th>
                        <th>الحالة</th>
                        <th>حذف</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(disc, idx) in settings.discounts" :key="idx">
                        <td><b class="coupon-tag">{{ disc.code }}</b></td>
                        <td>{{ disc.percent }}%</td>
                        <td>{{ (disc.min_spend / 100).toLocaleString('ar-EG') }} ج.م</td>
                        <td>
                          <input v-model="disc.active" type="checkbox" />
                          <span>{{ disc.active ? 'نشط' : 'معطل' }}</span>
                        </td>
                        <td>
                          <button type="button" class="btn-action delete" @click="removeDiscount(idx)">حذف</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Add Coupon Sub-form -->
                <div class="add-coupon-row">
                  <input v-model="newDiscount.code" placeholder="كود جديد (مثال: SPORT15)" dir="ltr" />
                  <input v-model.number="newDiscount.percent" type="number" placeholder="النسبة %" min="1" max="90" />
                  <input v-model.number="newDiscount.min_spend" type="number" placeholder="الحد الأدنى (قروش)" min="0" step="5000" />
                  <button type="button" class="btn-secondary" @click="addDiscount">＋ أضف الكوبون</button>
                </div>
              </div>

              <!-- WhatsApp Automation Card -->
              <div class="settings-card col-span-2">
                <div class="settings-card-head">
                  <div class="head-icon-title">
                    <span class="icon-bubble">💬</span>
                    <div>
                      <h3>إشعارات وتأكيدات واتساب التلقائية (WhatsApp Automation)</h3>
                      <p class="hint-text">إرسال إشعار فوري للعميل عبر واتساب عند تسجيل أي طلب جديد في المتجر لتأكيده مباشرة.</p>
                    </div>
                  </div>
                  <span class="badge-active" v-if="settings.whatsapp.enabled">مفعل تلقائياً ✅</span>
                </div>

                <div class="settings-grid-sub">
                  <label class="toggle-checkbox-row">
                    <input v-model="settings.whatsapp.enabled" type="checkbox" />
                    <div>
                      <strong>تفعيل إرسال إشعار التأكيد التلقائي عبر واتساب فور إنشاء أي طلب</strong>
                      <small class="d-block text-muted">إرسال رسالة براندينج رسمية تتضمن رقم الطلب، المنتجات، الإجمالي، وعنوان الشحن تلقائياً للعميل.</small>
                    </div>
                  </label>

                  <div class="form-row-2col">
                    <label>
                      رقم واتساب خدمة العملاء للمتجر
                      <input v-model="settings.whatsapp.support_phone" type="tel" placeholder="01000000000 أو 201000000000" dir="ltr" maxlength="20" />
                      <small class="hint-text">الرقم الذي يستقبل استفسارات وتأكيدات العملاء</small>
                    </label>

                    <label>
                      نص الرسالة عند فتح واتساب
                      <input v-model="settings.whatsapp.welcome_message" type="text" maxlength="300" dir="ltr" />
                      <small class="hint-text">هذه هي الرسالة التي تكتب تلقائياً عند الضغط على أيقونة واتساب العائمة.</small>
                    </label>

                    <label>
                      طريقة الإرسال والتكامل
                      <select v-model="settings.whatsapp.provider">
                        <option value="direct_link">محادثة ورابط مباشر فوري (Direct WhatsApp Link & Webhook)</option>
                        
                        
                        
                      </select>
                      <small class="hint-text">اختر طريقة الربط البرمجي لإرسال الرسائل</small>
                    </label>
                  </div>

                  <div v-if="settings.whatsapp.provider !== 'direct_link'" class="form-row-2col">
                    <label>
                      Webhook / API Endpoint URL
                      <input v-model="settings.whatsapp.webhook_url" type="url" placeholder="https://api.ultramsg.com/instance/messages/chat" dir="ltr" />
                    </label>

                    <label>
                      API Token / Instance Key
                      <input v-model="settings.whatsapp.api_token" type="password" placeholder="••••••••••••••••" dir="ltr" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </template>

        <!-- 7. AUDIT & SECURITY LOG -->
        <template v-else-if="section === 'audit'">
          <div v-if="staffRole !== 'admin'" class="empty-state-box">
            <p>سجل النشاط الإداري متاح لمسؤول النظام فقط.</p>
          </div>
          <template v-else>
            <div class="section-topbar">
              <div>
                <h1>سجل النشاط والرقابة الأمنية (Audit Logs)</h1>
                <p class="section-desc">سجل التغييرات، تعديل المخزون، حالات الطلبات، وتعديل إعدادات المتجر.</p>
              </div>
            </div>

            <div v-if="!auditEvents.length" class="empty-state-box">
              <p>لا توجد سجلات نشاط مسجلة حتى الآن.</p>
            </div>

            <div v-else class="audit-timeline">
              <div v-for="event in auditEvents" :key="event.id" class="audit-card">
                <div class="audit-icon-cell">🛡️</div>
                <div class="audit-main">
                  <div class="audit-header">
                    <span class="audit-event-tag">{{ event.event }}</span>
                    <span class="audit-time">{{ event.created_at }}</span>
                  </div>
                  <p class="audit-details">
                    قام <b>{{ event.actor_email || 'النظام' }}</b> بإجراء على:
                    <code>{{ event.subject_type }} ({{ event.subject_id }})</code>
                  </p>
                  <div v-if="event.metadata" class="audit-metadata">
                    <code>{{ typeof event.metadata === 'string' ? event.metadata : JSON.stringify(event.metadata) }}</code>
                  </div>
                  <small class="ip-address">عنوان IP: {{ event.ip_address || '127.0.0.1' }}</small>
                </div>
              </div>
            </div>
          </template>
        </template>
      </div>
    </section>
  </main>
</template>

<style scoped>
/* Studio Active High-End Athletic Control Center */
.admin-shell {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  min-height: 100vh;
  background: #f8f9f6;
  color: #111;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* Sidebar */
.admin-sidebar {
  background: #0f100d;
  color: #fff;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  padding: 1.5rem 1rem;
  border-inline-end: 1px solid #242620;
}

.admin-brand {
  display: block;
  font-size: 1.25rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  color: #fff;
  text-decoration: none;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #22241d;
}

.lime-text {
  color: #c8ff00;
}

.brand-sub {
  display: block;
  font-size: 0.65rem;
  color: #8c9284;
  letter-spacing: 0.15em;
  margin-top: 0.25rem;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 1.5rem;
  flex: 1;
  overflow-y: auto;
}

.sidebar-label {
  font-size: 0.65rem;
  font-weight: 900;
  color: #656b5f;
  letter-spacing: 0.12em;
  padding: 0.8rem 0.5rem 0.3rem;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.85rem;
  color: #caced5;
  text-decoration: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.15s ease;
}

.sidebar-link:hover {
  background: #1e201a;
  color: #fff;
}

.sidebar-link.router-link-active {
  background: #23271d;
  color: #c8ff00;
  font-weight: 800;
}

.nav-icon {
  font-size: 1.1rem;
}

.counter-pill {
  margin-inline-start: auto;
  font-size: 0.7rem;
  background: #272a22;
  color: #c8ff00;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  font-weight: 700;
}

.badge-alert {
  margin-inline-start: auto;
  font-size: 0.7rem;
  background: #e11d48;
  color: #fff;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  font-weight: 800;
}

.sidebar-footer {
  border-top: 1px solid #22241d;
  padding-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sidebar-action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 0.85rem;
  background: transparent;
  border: 1px solid #2a2e24;
  color: #b5baa8;
  text-decoration: none;
  border-radius: 6px;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.15s;
}

.sidebar-action-btn:hover {
  background: #1f221a;
  color: #fff;
  border-color: #444b3b;
}

.logout-btn:hover {
  color: #f87171;
  border-color: #7f1d1d;
}

/* Workspace & Topbar */
.admin-workspace {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.workspace-topbar {
  height: 60px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
}

.topbar-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.site-tag {
  color: #6b7280;
}

.sep {
  color: #d1d5db;
}

.active-sec {
  color: #111;
  font-weight: 800;
  letter-spacing: 0.05em;
}

.topbar-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.85rem;
}

.role-badge {
  background: #000;
  color: #c8ff00;
  font-size: 0.65rem;
  font-weight: 900;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  letter-spacing: 0.05em;
}

.user-email {
  color: #374151;
  font-weight: 600;
}

.workspace-content {
  padding: 2rem;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

/* Dashboard KPIs */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 1.75rem;
}

.dashboard-sub {
  font-size: 0.75rem;
  font-weight: 900;
  color: #6b7280;
  letter-spacing: 0.08em;
  margin: 0 0 0.25rem;
}

.dashboard-header h1 {
  font-size: 1.85rem;
  font-weight: 900;
  margin: 0;
  letter-spacing: -0.02em;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.kpi-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.kpi-label {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 600;
}

.kpi-value {
  font-size: 1.9rem;
  font-weight: 900;
  color: #111;
  letter-spacing: -0.03em;
}

.lime-val {
  color: #16a34a;
}

.kpi-hint {
  font-size: 0.75rem;
  color: #9ca3af;
}

.warning-text {
  color: #ea580c !important;
  font-weight: 700;
}

/* Dashboard Panels */
.dashboard-split {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 1.5rem;
}

.dash-panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
}

.dash-panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 0.75rem;
}

.dash-panel-head h3 {
  font-size: 1.05rem;
  font-weight: 800;
  margin: 0;
}

.link-btn {
  font-size: 0.8rem;
  color: #111;
  font-weight: 700;
  text-decoration: none;
}

.link-btn:hover {
  text-decoration: underline;
}

.dash-orders-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.dash-order-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #f3f4f6;
}

.cust-name {
  color: #4b5563;
  margin-inline-start: 0.25rem;
}

.time-stamp {
  display: block;
  font-size: 0.7rem;
  color: #9ca3af;
  margin-top: 0.15rem;
}

.order-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.price-val {
  font-size: 0.95rem;
  font-weight: 800;
}

/* Category Bars */
.category-bars {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cat-bar-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.cat-bar-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
}

.bar-bg {
  height: 8px;
  background: #f3f4f6;
  border-radius: 999px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: #000;
  border-radius: 999px;
  transition: width 0.3s ease;
}

/* Buttons & Controls */
.btn-primary-lime {
  background: #c8ff00;
  color: #000;
  border: 1px solid #b5ea00;
  padding: 0.75rem 1.4rem;
  font-weight: 800;
  font-size: 0.85rem;
  border-radius: 6px;
  text-decoration: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.btn-primary-lime:hover {
  background: #bbf000;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #111;
  color: #fff;
  border: none;
  padding: 0.75rem 1.25rem;
  font-weight: 700;
  font-size: 0.85rem;
  border-radius: 6px;
  cursor: pointer;
}

.btn-secondary:hover {
  background: #333;
}

.btn-back {
  display: inline-block;
  margin-bottom: 1rem;
  color: #4b5563;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.85rem;
}

/* Tables */
.section-topbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 1.5rem;
}

.section-topbar h1 {
  font-size: 1.6rem;
  font-weight: 900;
  margin: 0 0 0.3rem;
}

.section-desc {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0;
}

.filters-bar {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 250px;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  font-size: 0.85rem;
}

.filter-select {
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  font-size: 0.85rem;
  min-width: 160px;
}

.table-container {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow-x: auto;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  text-align: start;
  font-size: 0.85rem;
}

.admin-table th {
  background: #f9fafb;
  padding: 1rem;
  font-weight: 800;
  color: #4b5563;
  border-bottom: 1px solid #e5e7eb;
}

.admin-table td {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.admin-table tr:hover {
  background: #fafafa;
}

.product-info-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.prod-thumb,
.cust-avatar {
  width: 36px;
  height: 36px;
  background: #f3f4f6;
  display: grid;
  place-items: center;
  border-radius: 6px;
  font-size: 1.1rem;
}

.sku-hint {
  display: block;
  font-size: 0.7rem;
  color: #9ca3af;
}

.stock-badge {
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.stock-badge.in-stock {
  background: #dcfce7;
  color: #15803d;
}

.stock-badge.out-stock {
  background: #fee2e2;
  color: #b91c1c;
}

.toggle-pub-btn {
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 800;
  cursor: pointer;
  border: none;
}

.toggle-pub-btn.is-pub {
  background: #111;
  color: #c8ff00;
}

.toggle-pub-btn.is-draft {
  background: #f3f4f6;
  color: #6b7280;
}

.row-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  padding: 0.35rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #111;
}

.btn-action.edit:hover {
  background: #000;
  color: #fff;
}

.btn-action.delete {
  color: #dc2626;
  border-color: #fca5a5;
}

.btn-action.delete:hover {
  background: #dc2626;
  color: #fff;
}

/* Orders Cards */
.orders-grid {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.order-manage-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
}

.order-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 0.85rem;
  margin-bottom: 1rem;
}

.order-num {
  font-size: 1.15rem;
  font-weight: 900;
  margin-inline-end: 0.75rem;
}

.order-time {
  font-size: 0.75rem;
  color: #9ca3af;
}

.status-select {
  padding: 0.4rem 0.85rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 800;
  cursor: pointer;
  border: 1px solid #d1d5db;
}

.badge-status,
.status-select {
  font-weight: 800;
}

.status-processing {
  background: #fef3c7;
  color: #b45309;
}

.status-shipped {
  background: #e0f2fe;
  color: #0369a1;
}

.status-delivered {
  background: #dcfce7;
  color: #15803d;
}

.status-cancelled {
  background: #fee2e2;
  color: #b91c1c;
}

.order-body {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1.5rem;
  align-items: center;
}

.cust-info p {
  margin: 0.35rem 0;
  font-size: 0.85rem;
}

.phone-link {
  color: #2563eb;
  font-weight: 700;
  text-decoration: none;
}

.whatsapp-pill {
  background: #25d366;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  text-decoration: none;
  margin-inline-start: 0.5rem;
}

/* WhatsApp Queue Box in Orders */
.whatsapp-queue-card {
  background: #f0fdf4;
  border: 2px solid #86efac;
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.queue-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #bbf7d0;
}

.head-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.icon-pulse {
  font-size: 1.4rem;
  background: #dcfce7;
  padding: 0.35rem 0.6rem;
  border-radius: 8px;
}

.queue-head h3 {
  font-size: 1.05rem;
  font-weight: 900;
  color: #14532d;
  margin: 0;
}

.queue-sub {
  font-size: 0.8rem;
  color: #166534;
  margin: 0.15rem 0 0;
}

.queue-count-badge {
  background: #16a34a;
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
}

.queue-items-scroller {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.queue-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: #ffffff;
  border: 1px solid #dcfce7;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  flex-wrap: wrap;
}

.queue-item-row.sent {
  opacity: 0.65;
  background: #f9fafb;
  border-color: #e5e7eb;
}

.qitem-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.qitem-name {
  font-size: 0.9rem;
  color: #111827;
}

.qitem-phone {
  font-size: 0.75rem;
  color: #4b5563;
  font-family: monospace;
}

.status-tag {
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.status-tag.auto {
  background: #dcfce7;
  color: #15803d;
}

.status-tag.sent {
  background: #e5e7eb;
  color: #374151;
}

.status-tag.pending {
  background: #fef08a;
  color: #854d0e;
}

.qitem-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-wa-send {
  background: #25d366;
  color: #ffffff;
  border: none;
  font-weight: 800;
  font-size: 0.8rem;
  padding: 0.45rem 0.85rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-wa-send:hover {
  background: #16a34a;
}

.btn-wa-mark {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  color: #374151;
  font-size: 0.75rem;
  padding: 0.45rem 0.6rem;
  border-radius: 6px;
  cursor: pointer;
}

.btn-wa-mark:hover {
  background: #e5e7eb;
}

/* Order card WhatsApp actions */
.order-wa-actions-bar {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin: 0.75rem 0;
  padding: 0.6rem;
  background: #f9fafb;
  border-radius: 6px;
}

.wa-action-chip {
  background: #ffffff;
  border: 1px solid #d1d5db;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.35rem 0.65rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.wa-action-chip.confirm {
  background: #f0fdf4;
  border-color: #86efac;
  color: #166534;
}

.wa-action-chip.confirm:hover {
  background: #22c55e;
  color: #ffffff;
}

.wa-action-chip.ship {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #1e40af;
}

.wa-action-chip.ship:hover {
  background: #3b82f6;
  color: #ffffff;
}

.wa-action-chip.deliver {
  background: #faf5ff;
  border-color: #d8b4fe;
  color: #6b21a8;
}

.wa-action-chip.deliver:hover {
  background: #a855f7;
  color: #ffffff;
}

.order-total-bar {
  text-align: end;
}

.order-total-bar span {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
}

.order-total-bar strong {
  font-size: 1.4rem;
  font-weight: 900;
}

.order-footer {
  border-top: 1px solid #f3f4f6;
  margin-top: 1rem;
  padding-top: 0.75rem;
}

.btn-toggle-items {
  background: none;
  border: none;
  font-size: 0.8rem;
  font-weight: 700;
  color: #4b5563;
  cursor: pointer;
  padding: 0;
}

.items-expanded-list {
  margin-top: 0.75rem;
  background: #f9fafb;
  border-radius: 6px;
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item-line {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
}

.sku-name {
  font-weight: 700;
}

.qty-badge {
  background: #e5e7eb;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

/* Taxonomy */
.taxonomy-layout {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 1.5rem;
}

.taxonomy-tree-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.taxonomy-item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #fafafa;
  border: 1px solid #f3f4f6;
  border-radius: 6px;
  margin-inline-start: calc(var(--depth, 0) * 1.5rem);
}

.slug-path {
  display: block;
  font-size: 0.7rem;
  color: #9ca3af;
}

.type-pill {
  display: inline-block;
  background: #e5e7eb;
  font-size: 0.65rem;
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
  margin-top: 0.25rem;
}

.admin-card-form {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
}

.admin-card-form h3 {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  font-weight: 800;
}

.admin-card-form label {
  display: block;
  margin-bottom: 1rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #374151;
}

.admin-card-form input,
.admin-card-form select {
  display: block;
  width: 100%;
  padding: 0.75rem;
  margin-top: 0.35rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.85rem;
}

.wide {
  width: 100%;
}

.form-hint {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0 0 1rem;
}

/* Settings Panels */
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.settings-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.75rem;
}

.settings-card.col-span-2 {
  grid-column: 1 / -1;
}

.settings-card h3 {
  font-size: 1.15rem;
  font-weight: 800;
  margin: 0 0 1.25rem;
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 0.65rem;
}

.settings-card label {
  display: block;
  margin-bottom: 1.25rem;
  font-size: 0.85rem;
  font-weight: 700;
}

.settings-card input[type="text"],
.settings-card input[type="number"],
.settings-card input[type="url"],
.settings-card input[type="password"],
.settings-card select {
  display: block;
  width: 100%;
  padding: 0.75rem;
  margin-top: 0.35rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  background: #fff;
}

.settings-card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
}

.head-icon-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.icon-bubble {
  font-size: 1.5rem;
  background: #f0fdf4;
  padding: 0.5rem;
  border-radius: 8px;
}

.badge-active {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #86efac;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
}

.settings-grid-sub {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-row-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 600px) {
  .form-row-2col {
    grid-template-columns: 1fr;
  }
}

.hint-text {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.toggle-checkbox-row {
  display: flex !important;
  align-items: center;
  gap: 0.85rem;
  padding: 0.75rem;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #f3f4f6;
  cursor: pointer;
}

.toggle-checkbox-row input[type="checkbox"] {
  width: 18px;
  height: 18px;
  margin: 0;
  cursor: pointer;
}

.coupon-tag {
  background: #000;
  color: #c8ff00;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.85rem;
}

.add-coupon-row {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.25rem;
  flex-wrap: wrap;
}

.add-coupon-row input {
  flex: 1;
  min-width: 140px;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

/* Audit Timeline */
.audit-timeline {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.audit-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.25rem;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.audit-icon-cell {
  font-size: 1.4rem;
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 6px;
}

.audit-main {
  flex: 1;
}

.audit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.35rem;
}

.audit-event-tag {
  background: #000;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-family: monospace;
}

.audit-time {
  font-size: 0.75rem;
  color: #9ca3af;
}

.audit-details {
  font-size: 0.85rem;
  margin: 0.35rem 0;
}

.audit-metadata {
  background: #f9fafb;
  padding: 0.5rem;
  border-radius: 4px;
  margin: 0.5rem 0;
  font-size: 0.75rem;
  color: #374151;
}

.ip-address {
  color: #9ca3af;
  font-size: 0.7rem;
}

/* Empty & Loading */
.empty-state-box {
  background: #fff;
  border: 1px dashed #d1d5db;
  padding: 3rem;
  text-align: center;
  border-radius: 8px;
  color: #6b7280;
}

/* Modern Skeleton Shimmer Placeholders */
.skeleton-shimmer {
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
  display: block;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.h-metric {
  height: 2.2rem;
  width: 65%;
  margin: 0.5rem 0;
}

.h-title {
  height: 1.25rem;
  width: 50%;
  margin-bottom: 0.85rem;
}

.h-line {
  height: 0.85rem;
  width: 90%;
  margin-bottom: 0.5rem;
}

.h-row {
  height: 1.75rem;
  width: 100%;
  margin: 0.35rem 0;
}

.w-half {
  width: 45%;
}

.skeleton-card {
  opacity: 0.7;
  border: 1px solid #f3f4f6;
  background: #ffffff;
  pointer-events: none;
}

/* Responsive */
@media (max-width: 992px) {
  .admin-shell {
    grid-template-columns: 1fr;
  }
  .admin-sidebar {
    height: auto;
    position: relative;
  }
  .dashboard-split,
  .taxonomy-layout,
  .settings-grid {
    grid-template-columns: 1fr;
  }
  .settings-card.col-span-2 {
    grid-column: 1;
  }
}
</style>
