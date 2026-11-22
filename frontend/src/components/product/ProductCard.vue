<script setup lang="ts">
import { computed, ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../../stores/cart'
import { useFavoritesStore } from '../../stores/favorites'
import { useLocaleStore } from '../../stores/locale'
import { formatMoney } from '../../utils/money'
import { getColorHex } from '../../utils/colors'
import type { Product } from '../../types'
const props = defineProps<{ product: Product; badge?: string }>()
const router = useRouter(), cart = useCartStore(), favorites = useFavoritesStore(), locale = useLocaleStore()
const color = ref(props.product.variants[0]?.color || '')
const size = ref('')
const hover = ref(false)
const chooser = ref<HTMLDialogElement>()
const trigger = ref<HTMLButtonElement>()
const colors = computed(() => [...new Set(props.product.variants.map(v => v.color))])
const variants = computed(() => props.product.variants.filter(v => v.color === color.value))
const soldOut = computed(() => !props.product.variants.some(v => v.stock > 0))
const images = computed(() => props.product.colorOptions?.find(c => c.name === color.value)?.images?.filter(Boolean) || props.product.images?.filter(Boolean) || [])
const image = computed(() => images.value[hover.value && images.value.length > 1 ? 1 : 0])
const variant = computed(() => variants.value.find(v => v.size === size.value && v.stock > 0))
const isEnglish = computed(() => locale.locale === 'en')
watch(color, () => { size.value = '' })
function detail() { router.push({path:'/product/'+props.product.id,query:{color:color.value}}) }
async function choose() { size.value = ''; chooser.value?.showModal(); await nextTick(); chooser.value?.querySelector<HTMLButtonElement>('.option-size:not(:disabled)')?.focus() }
function close() { chooser.value?.close(); trigger.value?.focus() }
function add() { if(!variant.value) return; cart.add(variant.value.sku, variant.value.stock); close(); cart.toggleDrawer(true) }
onBeforeUnmount(() => chooser.value?.close())
</script>
<template>
<article class="product-card-adv mavin-card" v-reveal>
 <div class="card-media-stage" @mouseenter="hover = true" @mouseleave="hover = false">
  <button class="product-photo-link" :aria-label="locale.getProductName(product)" @click="detail">
   <img v-if="image" :src="image" :alt="locale.getProductName(product)" loading="lazy" width="600" height="800" />
   <span v-else :class="['photo',product.image]" />
  </button>
  <span v-if="soldOut || badge" class="product-badge">{{ soldOut ? (isEnglish ? 'SOLD OUT' : 'نفدت الكمية') : badge }}</span>
  <button class="product-heart" :aria-label="isEnglish ? 'Toggle wishlist' : 'إضافة أو إزالة من المفضلة'" :aria-pressed="favorites.isFavorite(product.id)" @click="favorites.toggle(product.id)">{{ favorites.isFavorite(product.id) ? '♥' : '♡' }}</button>
  <button ref="trigger" class="product-choose" :disabled="soldOut" @click="choose">{{ soldOut ? (isEnglish ? 'SOLD OUT' : 'نفدت الكمية') : (isEnglish ? 'CHOOSE OPTIONS' : 'اختار المقاس واللون') }} <span>+</span></button>
 </div>
 <div class="product-swatches" aria-label="Product colors"><button v-for="c in colors" :key="c" :aria-label="c" :aria-pressed="color === c" :style="{background:getColorHex(c,product.colorOptions)}" @click="color = c" /></div>
 <router-link class="product-title" :to="{path:'/product/'+product.id,query:{color}}">{{ locale.getProductName(product) }}</router-link>
 <p v-if="product.fit" class="product-fit">{{ locale.getFitName(product.fit) }}</p>
 <strong class="product-price">{{ formatMoney(product.price) }}</strong>
 <dialog ref="chooser" class="product-options-dialog" @click="($event.target === chooser) && close()" @close="trigger?.focus()">
  <div class="option-dialog-body">
   <button class="option-close" :aria-label="isEnglish ? 'Close' : 'إغلاق'" @click="close">×</button>
   <h2>{{ locale.getProductName(product) }}</h2><p>{{ formatMoney(product.price) }}</p>
   <p>{{ isEnglish ? 'Color' : 'اللون' }}: {{ color }}</p>
   <div class="product-swatches"><button v-for="c in colors" :key="c" :aria-label="c" :aria-pressed="color===c" :style="{background:getColorHex(c,product.colorOptions)}" @click="color=c" /></div>
   <p>{{ isEnglish ? 'Select your size' : 'اختار مقاسك' }}</p>
   <div class="option-sizes"><button v-for="v in variants" :key="v.sku" class="option-size" :disabled="v.stock <= 0" :aria-pressed="size===v.size" @click="size=v.size">{{ v.size }}</button></div>
   <button class="option-add" :disabled="!variant" @click="add">{{ isEnglish ? 'ADD TO BAG' : 'أضف للسلة' }}</button>
   <button class="option-detail" @click="close(); detail()">{{ isEnglish ? 'View full details' : 'عرض تفاصيل المنتج' }}</button>
  </div>
 </dialog>
</article>
</template>
<style scoped>
.mavin-card{border:0;background:transparent;color:#111;min-width:0;display:flex;flex-direction:column}.card-media-stage{position:relative;aspect-ratio:3/4;background:#f5f3ef;overflow:hidden}.product-photo-link{display:block;width:100%;height:100%;padding:0;border:0;background:none}.product-photo-link img,.product-photo-link .photo{width:100%;height:100%;object-fit:cover;aspect-ratio:auto}.product-photo-link img{transition:transform .5s}.card-media-stage:hover img{transform:scale(1.025)}.product-heart{position:absolute;right:10px;top:10px;background:white;border:0;width:30px;height:30px;border-radius:50%;font-size:22px}.product-badge{position:absolute;left:8px;top:8px;background:#111;color:white;font-size:9px;padding:6px}.product-choose{position:absolute;bottom:12px;left:12px;right:12px;border:0;background:#fff;color:#111;padding:14px;font-size:10px;font-weight:bold;display:flex;justify-content:space-between;opacity:0;transform:translateY(8px);transition:opacity .25s,transform .25s}.card-media-stage:hover .product-choose,.card-media-stage:focus-within .product-choose{opacity:1;transform:none}.product-swatches{display:flex;gap:8px;flex-wrap:wrap;padding:10px 2px}.product-swatches button{width:18px;height:18px;border:1px solid #ddd;border-radius:50%;padding:0}.product-swatches button[aria-pressed=true]{outline:1px solid #111;outline-offset:3px}.product-title{font-size:12px;line-height:1.5;text-transform:uppercase;margin:4px 0;letter-spacing:.3px}.product-title:hover{text-decoration:underline}.product-fit{color:#888;font-size:12px;margin:1px 0 6px;min-height:15px}.product-price{font-size:12px;margin-bottom:12px}.product-options-dialog{position:fixed;inset:0 0 0 auto;margin:0;width:min(440px,100%);height:100%;max-height:100%;border:0;padding:0;background:white;color:#111}.product-options-dialog::backdrop{background:#0007}.option-dialog-body{padding:60px 25px 25px}.option-dialog-body h2{font-size:22px}.option-close{position:absolute;top:15px;right:20px;border:0;background:none;font-size:30px}.option-sizes{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:25px}.option-size{padding:12px;border:1px solid #ccc;background:white;min-width:46px}.option-size[aria-pressed=true]{background:#111;color:white}.option-size:disabled{text-decoration:line-through}.option-add{width:100%;padding:18px;background:#111;color:white;border:0}.option-detail{display:block;margin:20px auto;background:none;border:0;text-decoration:underline}@media(max-width:767px){.product-choose{opacity:1;transform:none;padding:10px;bottom:8px;left:8px;right:8px;font-size:9px}.product-title{font-size:10px}.product-fit,.product-price{font-size:11px}.product-swatches button{width:16px;height:16px}}
</style>
