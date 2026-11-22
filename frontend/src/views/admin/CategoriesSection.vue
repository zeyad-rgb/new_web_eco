<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAdminStore } from '../../stores/admin'
import { useUIStore } from '../../stores/ui'
import { categoryBranch, categoryPath, categoryRows, type Category, type ProductType } from '../../taxonomy'

const admin = useAdminStore()
const ui = useUIStore()
const router = useRouter()
const { busy, categories, products, productTypes } = storeToRefs(admin)

const emptyCategory = (parent_slug: string | null = null): Category => ({ slug: '', name: '', parent_slug, type_slug: null })
const category = ref<Category>(emptyCategory())
const editingCategory = ref(false)
const typeForm = ref<ProductType>({ slug: '', name: '' })

const categoryList = computed(() => categoryRows(categories.value))
const eligibleParents = computed(() => {
  const blocked = categoryBranch(categories.value, category.value.slug)
  return categoryList.value.filter(({ category: item }) => !blocked.has(item.slug))
})
const categoryLabel = (slug: string) => categoryPath(categories.value, slug).map((item) => item.name).join(' ← ')

function startCategory(item?: Category, parent: string | null = null) {
  category.value = item ? { ...item } : emptyCategory(parent)
  editingCategory.value = Boolean(item)
}

function saveCategory() {
  return admin.run(async () => {
    if (!editingCategory.value && categories.value.some((item) => item.slug === category.value.slug)) {
      throw new Error('الرابط المختصر مستخدم بالفعل. اختر رابطاً مختلفاً.')
    }
    if (category.value.parent_slug && categoryBranch(categories.value, category.value.slug).has(category.value.parent_slug)) {
      throw new Error('لا يمكن نقل التصنيف داخل نفسه أو داخل أحد فروعه.')
    }
    await admin.request('categories', { ...category.value, editing: editingCategory.value })
    await admin.loadCatalog()
    startCategory()
    ui.showToast('تم حفظ التصنيف بنجاح', 'success')
  })
}

function saveType() {
  return admin.run(async () => {
    await admin.request('product-types', typeForm.value)
    await admin.loadCatalog()
    typeForm.value = { slug: '', name: '' }
    ui.showToast('تم حفظ نوع المنتج', 'success')
  })
}

/** The categories list links to the product editor filtered by category. */
function edit() {
  void router.push('/admin/products/new')
}
</script>

<template>
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
