<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { staffRequest } from './api/staff'
import type { Category } from './taxonomy'
import { categoryPath, categoryRows } from './taxonomy'
import type { EditableProduct, ColorOption, ProductStock } from './product-options'

const props = defineProps<{ draftKey: string; initial: EditableProduct; categories: Category[]; collections?: { slug: string; name: string }[]; demo: boolean; csrf: string; busy: boolean }>()
const emit = defineEmits<{ save: [product: EditableProduct, original: ProductStock[]]; cancel: [] }>()
const product = ref<EditableProduct>(structuredClone(JSON.parse(JSON.stringify(props.initial))))
const colors = ref<ColorOption[]>(props.initial.colorOptions?.length
  ? structuredClone(JSON.parse(JSON.stringify(props.initial.colorOptions)))
  : [...new Set(props.initial.variants.map(item => item.color))].map(name => ({
    id: crypto.randomUUID(), name, hex: ({ 'أسود': '#191a1d', 'أبيض': '#ffffff', 'رمادي': '#909093' } as Record<string,string>)[name] ?? '#607d8b', images: [],
  })))
const sizes = ref<string[]>(props.initial.sizeOptions ?? [...new Set(props.initial.variants.map(item => item.size))])
const quantities = ref<Record<string, number>>({})
for (const color of colors.value) for (const variant of props.initial.variants.filter(item => item.color === color.name)) quantities.value[color.id + ':' + variant.size] = variant.stock
const colorName = ref('')
const colorHex = ref('#222222')
const sizeName = ref('')
// Marketing fields stored in catalog_products.details and shown on the storefront.
const selectedCollections = ref<string[]>([...(props.initial.collections ?? [])])
const FIT_OPTIONS = ['', 'Slim', 'Regular', 'Relaxed', 'Oversized']
function toggleCollection(slug: string) {
  const index = selectedCollections.value.indexOf(slug)
  if (index === -1) selectedCollections.value.push(slug)
  else selectedCollections.value.splice(index, 1)
}
const error = ref('')
const uploading = ref(false)
const progress = ref('')
const uploadMaxBytes = ref(10 * 1024 * 1024)
const uploadLimitLabel = computed(() => (uploadMaxBytes.value / 1024 / 1024).toFixed(1) + ' MB')
onMounted(async () => {
  if (props.demo) return
  try {
    const limits = await staffRequest('media/limits')
    uploadMaxBytes.value = limits.maxBytes
    if (!limits.imageProcessingAvailable) error.value = 'Image uploads require PHP GD with WebP support.'
  } catch (failure) { error.value = failure instanceof Error ? failure.message : 'Cannot check image upload settings.' }
})
const draftNotice = ref('')
const originalVariants = ref<ProductStock[]>(JSON.parse(JSON.stringify(props.initial.variants)))
let saved = false
try {
  const raw = sessionStorage.getItem(props.draftKey)
  if (raw) {
    const draft = JSON.parse(raw)
    if (draft.version === 1 && Date.now() - draft.savedAt < 7 * 86400000 && draft.product?.id === props.initial.id && Array.isArray(draft.colors) && Array.isArray(draft.sizes) && Array.isArray(draft.originalVariants)) {
      product.value = draft.product
      colors.value = draft.colors
      sizes.value = draft.sizes
      quantities.value = draft.quantities || {}
      selectedCollections.value = draft.collections || selectedCollections.value
      originalVariants.value = draft.originalVariants
      draftNotice.value = 'Draft restored, including uploaded images. Review before saving.'
    }
  }
} catch { draftNotice.value = 'Draft could not be restored. Please review the product.' }
watch([product, colors, sizes, quantities, selectedCollections], () => {
  if (saved) return
  try {
    sessionStorage.setItem(props.draftKey, JSON.stringify({ version: 1, savedAt: Date.now(), product: product.value, colors: colors.value, sizes: sizes.value, quantities: quantities.value, collections: selectedCollections.value, originalVariants: originalVariants.value }))
    if (!draftNotice.value.startsWith('Draft restored')) draftNotice.value = 'Draft saved on this tab.'
  } catch { draftNotice.value = 'Draft could not be saved on this device. Keep this page open until saving.' }
}, { deep: true, flush: 'sync' })
function clearDraft() {
  saved = true
  try { sessionStorage.removeItem(props.draftKey) } catch {}
}
function discardDraft() {
  if (!window.confirm('Discard unsaved changes and reload the saved product?')) return
  clearDraft()
  window.location.reload()
}
defineExpose({ clearDraft })
function beforeUnload(event: BeforeUnloadEvent) {
  if (uploading.value || props.busy) { event.preventDefault(); event.returnValue = '' }
}
onMounted(() => window.addEventListener('beforeunload', beforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))
const pathOptions = computed(() => categoryRows(props.categories))
const mediaCount = computed(() => colors.value.reduce((count, color) => count + color.images.length, 0))
const combinations = computed(() => colors.value.length * sizes.value.length)
function addColor() {
  const name = colorName.value.trim()
  if (!name || colors.value.some(color => color.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
    error.value = 'اكتب اسم لون جديد وغير مكرر.'; return
  }
  colors.value.push({ id: crypto.randomUUID(), name, hex: colorHex.value, images: [] })
  colorName.value = ''; error.value = ''
}
function addSize() {
  const value = sizeName.value.trim()
  if (value && !sizes.value.includes(value)) sizes.value.push(value)
  sizeName.value = ''
}
function moveColor(index: number, delta: number) {
  const target = index + delta
  if (target < 0 || target >= colors.value.length) return
  const [color] = colors.value.splice(index, 1)
  colors.value.splice(target, 0, color)
}
function move(color: ColorOption, index: number, delta: number) {
  const target = index + delta
  if (target < 0 || target >= color.images.length) return
  const [image] = color.images.splice(index, 1)
  color.images.splice(target, 0, image)
}
async function upload(color: ColorOption, files: File[]) {
  if (uploading.value || props.busy || !files.length) return
  if (mediaCount.value + files.length > 250) { error.value = 'أقصى عدد صور للمنتج 250 صورة.'; return }
  if (files.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > uploadMaxBytes.value)) {
    error.value = 'Use JPG, PNG or WebP. Current server limit: ' + uploadLimitLabel.value + ' per image.'; return
  }
  uploading.value = true; error.value = ''
  try {
    for (const [index, file] of files.entries()) {
      progress.value = 'رفع ' + (index + 1) + ' من ' + files.length
      if (props.demo) {
        const url = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result))
          reader.onerror = () => reject(new Error('تعذّر قراءة الصورة.'))
          reader.readAsDataURL(file)
        })
        color.images.push(url)
      } else {
        const data = new FormData(); data.append('image', file)
        const body = await staffRequest('media', { method: 'POST', body: data })
        if (!body.url) throw new Error( 'فشل رفع الصورة.')
        color.images.push(body.url)
      }
    }
  } catch (failure) { error.value = failure instanceof Error ? failure.message : 'فشل رفع الصور.' }
  finally { uploading.value = false; progress.value = '' }
}
function chooseFiles(color: ColorOption, event: Event) {
  const input = event.target as HTMLInputElement
  void upload(color, Array.from(input.files ?? []))
  input.value = ''
}
function save() {
  if (uploading.value || props.busy) return
  error.value = ''
  const missing: string[] = []
  if (!product.value.name.trim()) missing.push('product name')
  if (!product.value.categoryId) missing.push('category')
  if (!Number.isInteger(product.value.price) || product.value.price < 1 || product.value.price > 100000000) missing.push('valid price')
  if (!colors.value.length) missing.push('at least one color')
  if (!sizes.value.length) missing.push('at least one size')
  if (missing.length) { error.value = 'Complete the required fields: ' + missing.join(', ') + '.'; return }
  if (!colors.value.length || !sizes.value.length || combinations.value > 500) {
    error.value = 'أضف لون ومقاس على الأقل، بحد أقصى 500 تركيبة.'; return
  }
  const variants: ProductStock[] = colors.value.flatMap(color => sizes.value.map(size => {
    const old = props.initial.variants.find(item => item.colorId === color.id && item.size === size)
      ?? props.initial.variants.find(item => item.color === color.name && item.size === size)
    return { sku: old?.sku, colorId: color.id, color: color.name, size, stock: quantities.value[color.id + ':' + size] ?? 0 }
  }))
  if (variants.some(item => !Number.isInteger(item.stock) || item.stock < 0 || item.stock > 1000000)) { error.value = 'راجع كميات المخزون.'; return }
  emit('save', {
    ...product.value,
    label: (product.value.label ?? '').trim(),
    fit: product.value.fit ?? '',
    collections: [...selectedCollections.value],
    colorOptions: colors.value, sizeOptions: sizes.value, variants,
  }, originalVariants.value)
}
</script>

<template>
  <form class="product-editor" novalidate @submit.prevent="save">
    <div class="editor-main">
      <div v-if="error" role="alert" class="editor-card editor-error"><strong>Unable to complete the request</strong><p>{{ error }}</p></div>
      <div v-if="draftNotice" role="status" class="editor-card"><p>{{ draftNotice }}</p><button type="button" :disabled="busy || uploading" @click="discardDraft">Discard draft</button></div>
      <section class="editor-card"><h2>تفاصيل المنتج</h2>
        <label>اسم المنتج<input v-model.trim="product.name" required maxlength="120"></label>
        <label>الوصف<textarea v-model="product.description" maxlength="1500" rows="4"></textarea></label>
      </section>
      <section class="editor-card"><h2>خيارات المنتج</h2>
        <p>أضف الألوان والمقاسات الخاصة بالموديل. كل لون ومقاس له رصيد مستقل.</p>
        <fieldset :disabled="uploading || busy"><legend>الألوان</legend>
          <div class="option-entry"><input v-model="colorName" placeholder="اسم اللون، مثل كحلي" aria-label="اسم اللون" maxlength="60" @keydown.enter.prevent="addColor">
            <input v-model="colorHex" type="color" aria-label="درجة اللون"><button type="button" @click="addColor">أضف اللون</button></div>
          <div class="option-chips"><span v-for="(color,index) in colors" :key="color.id"><i :style="{background:color.hex}"></i>{{ color.name }}
            <button type="button" :aria-label="'قدّم اللون ' + color.name" :disabled="index===0" @click="moveColor(index,-1)">↑</button><button type="button" :aria-label="'أخّر اللون ' + color.name" :disabled="index===colors.length-1" @click="moveColor(index,1)">↓</button><button type="button" :aria-label="'إزالة اللون ' + color.name" @click="colors.splice(index,1)">×</button></span></div>
        </fieldset>
        <fieldset :disabled="uploading || busy"><legend>المقاسات</legend>
          <div class="option-entry"><input v-model="sizeName" placeholder="مثل M أو 42 أو One Size" aria-label="مقاس جديد" maxlength="40" @keydown.enter.prevent="addSize"><button type="button" @click="addSize">أضف المقاس</button></div>
          <div class="option-chips"><span v-for="(size,index) in sizes" :key="size">{{ size }}<button type="button" :aria-label="'إزالة المقاس ' + size" @click="sizes.splice(index,1)">×</button></span></div>
        </fieldset>
        <p>{{ combinations }} تركيبة · {{ mediaCount }} صورة</p>
      </section>
      <section class="editor-card"><h2>صور الموديل حسب اللون</h2><p>أول صورة في كل لون هي صورته الرئيسية. أول لون هو اللون الرئيسي للمنتج.</p>
        <p v-if="!colors.length">أضف لونًا لرفع صوره.</p>
        <article v-for="color in colors" :key="color.id" class="color-media">
          <h3><i class="dot" :style="{background:color.hex}"></i>{{ color.name }} <small>({{ color.images.length }} صورة)</small></h3>
          <p>JPG / PNG / WebP · Maximum {{ uploadLimitLabel }} per image. Upload completes before product saving.</p>
          <div class="upload-zone" @dragover.prevent @drop.prevent="upload(color, Array.from($event.dataTransfer?.files ?? []))">
            <label>رفع صور {{ color.name }}<input type="file" accept="image/jpeg,image/png,image/webp" multiple :disabled="uploading || busy" @change="chooseFiles(color,$event)"></label>
            <span>اختار صور متعددة أو اسحبها هنا</span>
          </div>
          <div class="media-grid">
            <figure v-for="(url,index) in color.images" :key="url + index"><img :src="url" :alt="color.name + ' ' + (index+1)" loading="lazy">
              <figcaption>{{ index === 0 ? 'الرئيسية' : index+1 }}</figcaption>
              <div><button type="button" :disabled="index===0 || uploading || busy" aria-label="قدّم الصورة" @click="move(color,index,-1)">↑</button>
                <button type="button" :disabled="index===color.images.length-1 || uploading || busy" aria-label="أخّر الصورة" @click="move(color,index,1)">↓</button>
                <button type="button" :disabled="uploading || busy" aria-label="احذف الصورة" @click="color.images.splice(index,1)">×</button></div>
            </figure>
          </div>
        </article>
      </section>
      <section class="editor-card"><h2>المتغيرات والمخزون</h2>
        <p v-if="!combinations">اختار ألوان المنتج ومقاساته لتكوين المتغيرات.</p>
        <div v-else class="variant-table"><table><thead><tr><th>اللون</th><th v-for="size in sizes" :key="size">{{ size }}</th></tr></thead>
          <tbody><tr v-for="color in colors" :key="color.id"><th>{{ color.name }}</th><td v-for="size in sizes" :key="size">
            <input v-model.number="quantities[color.id + ':' + size]" type="number" min="0" max="1000000" step="1" :placeholder="'0'" :aria-label="color.name + ' · ' + size" :disabled="uploading || busy"></td></tr></tbody></table></div>
        <p v-if="initial.id">إزالة لون أو مقاس بتشيل متغيراته من العرض عند الحفظ.</p>
      </section>
    </div>
    <aside class="editor-side">
      <section class="editor-card"><h2>النشر</h2><label>حالة المنتج<select v-model="product.published" :disabled="busy"><option :value="false">مسودة</option><option :value="true">منشور</option></select></label></section>
      <section class="editor-card"><h2>التنظيم والسعر</h2>
        <label>التصنيف<select v-model="product.categoryId" required :disabled="busy"><option value="">اختار التصنيف</option><option v-for="{category,path} in pathOptions" :key="category.slug" :value="category.slug">{{ path.map(item => item.name).join(' ← ') }}</option></select></label>
        <label>السعر بالجنيه<input :value="product.price / 100" @input="product.price = Math.round(Number(($event.target as HTMLInputElement).value) * 100)" required type="number" min="0.01" max="1000000" step="0.01" :disabled="busy"></label>
      </section>
      <section class="editor-card"><h2>العرض في المتجر</h2>
        <label>شارة المنتج (Badge)
          <input v-model.trim="product.label" maxlength="40" placeholder="مثال: وصل حديثاً" :disabled="busy">
          <small>تظهر على كارت المنتج في المتجر. اتركها فارغة بدون شارة.</small>
        </label>
        <label>القَصّة (Fit)
          <select v-model="product.fit" :disabled="busy">
            <option v-for="option in FIT_OPTIONS" :key="option" :value="option">{{ option || 'بدون تحديد' }}</option>
          </select>
        </label>
        <fieldset v-if="collections?.length" :disabled="busy" class="collections-field">
          <legend>المجموعات</legend>
          <label v-for="group in collections" :key="group.slug" class="collection-check">
            <input type="checkbox" :value="group.slug" :checked="selectedCollections.includes(group.slug)" @change="toggleCollection(group.slug)">
            <span>{{ group.name }}</span>
          </label>
        </fieldset>
      </section>
      <p v-if="progress" role="status">{{ progress }}</p>
      <button class="primary wide" :disabled="busy || uploading">احفظ المنتج</button><button type="button" :disabled="busy || uploading" @click="emit('cancel')">إلغاء</button>
    </aside>
  </form>
</template>



