<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import ProductEditor from '../../ProductEditor.vue'
import { useAdminStore } from '../../stores/admin'
import { useAuthStore } from '../../stores/auth'
import { useUIStore } from '../../stores/ui'
import { categoryPath } from '../../taxonomy'
import type { EditableProduct, ProductStock } from '../../product-options'

const props = defineProps<{ productId: string; initialCategory: string }>()

const admin = useAdminStore()
const auth = useAuthStore()
const ui = useUIStore()
const router = useRouter()
const { busy, categories, collections, products, staffRole } = storeToRefs(admin)

const editorRef = ref<InstanceType<typeof ProductEditor>>()
const product = ref<EditableProduct>()
const originalStock = ref<ProductStock[]>([])

const csrf = computed(() => admin.csrfToken())
const editorDraftKey = computed(() =>
  'studioactive_product_draft_v1:' + (auth.user?.email || '') + ':' + (props.productId || 'new') + ':' + props.initialCategory
)
const categoryLabel = (slug: string) => categoryPath(categories.value, slug).map((item) => item.name).join(' \u2190 ')

// Product list filters (client-side: the whole catalog is already loaded).
const searchProducts = ref('')
const filterVisibility = ref('')
const filterCategory = ref('')
const shownProducts = computed(() =>
  products.value.filter((item) => {
    const matchName = item.name.toLowerCase().includes(searchProducts.value.trim().toLowerCase())
    const matchVisibility = !filterVisibility.value || item.published === (filterVisibility.value === 'published')
    const matchCategory = !filterCategory.value || item.categoryId === filterCategory.value
    return matchName && matchVisibility && matchCategory
  })
)

function edit(item?: EditableProduct) {
  product.value = item
    ? { ...item, collections: [...(item.collections ?? [])], variants: item.variants.map((v) => ({ ...v })) }
    : {
      id: '', name: '',
      categoryId: categories.value.some((c) => c.slug === props.initialCategory) ? props.initialCategory : '',
      description: '', price: 0, published: false, variants: [],
    }
  originalStock.value = item?.variants ?? []
}

/** Opens the editor for the id in the route, or a blank product for "new". */
function openEditor() {
  if (!props.productId) { product.value = undefined; return }
  if (props.productId === 'new') { edit(); return }
  const item = products.value.find((p) => p.id === props.productId)
  product.value = undefined
  if (item) edit(item)
}
watch([() => props.productId, () => props.initialCategory, products], openEditor, { immediate: true })

function cancelProduct() {
  void router.push('/admin/products')
}

function saveProduct(item: EditableProduct, original: ProductStock[]) {
  return admin.run(async () => {
    await admin.request('products', {
      ...item,
      id: item.id || null,
      originalVariants: original.map(({ sku, color, size, stock }) => ({ sku, color, size, stock })),
    })
    admin.invalidateStorefront()
    editorRef.value?.clearDraft()
    await admin.loadCatalog()
    product.value = undefined
    void router.push('/admin/products')
    ui.showToast('\u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u0645\u0646\u062a\u062c \u0628\u0646\u062c\u0627\u062d!', 'success')
  })
}

function togglePublish(item: EditableProduct) {
  return admin.run(async () => {
    const result = await admin.request(`products/${item.id}/toggle-publish`, {}, 'POST')
    item.published = result.published
    admin.invalidateStorefront()
    ui.showToast(item.published ? '\u062a\u0645 \u0646\u0634\u0631 \u0627\u0644\u0645\u0646\u062a\u062c \u0641\u064a \u0627\u0644\u0645\u062a\u062c\u0631' : '\u062a\u0645 \u062a\u062d\u0648\u064a\u0644 \u0627\u0644\u0645\u0646\u062a\u062c \u0625\u0644\u0649 \u0645\u0633\u0648\u062f\u0629', 'info')
  })
}

function deleteProduct(item: EditableProduct) {
  if (!confirm(`\u0647\u0644 \u0623\u0646\u062a \u0645\u062a\u0623\u0643\u062f \u0645\u0646 \u062d\u0630\u0641 \u0627\u0644\u0645\u0646\u062a\u062c "${item.name}" \u0646\u0647\u0627\u0626\u064a\u0627\u064b \u0645\u0646 \u0642\u0627\u0639\u062f\u0629 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a\u061f`)) return
  return admin.run(async () => {
    await admin.request(`products/${item.id}`, {}, 'DELETE')
    admin.invalidateStorefront()
    await admin.loadCatalog()
    ui.showToast('\u062a\u0645 \u062d\u0630\u0641 \u0627\u0644\u0645\u0646\u062a\u062c \u0646\u0647\u0627\u0626\u064a\u0627\u064b', 'success')
  })
}
</script>

<template>
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
      :collections="collections"
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
