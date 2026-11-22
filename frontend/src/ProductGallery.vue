<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ColorOption } from './product-options'

const props = defineProps<{
  name: string
  colorOptions?: ColorOption[]
  selectedColor?: string
  image?: string
  images?: string[]
  demo?: boolean
  detail?: boolean
  favorite?: boolean
}>()

const emit = defineEmits<{ open: [color?: string]; favorite: [] }>()

const index = ref(0)
const zoomDialog = ref<HTMLDialogElement>()
const isZooming = ref(false)
const zoomOrigin = ref('center center')

let swiped = false

function openFrame() {
  if (swiped) {
    swiped = false
    return
  }
  if (props.detail) {
    zoomDialog.value?.showModal()
  } else {
    emit('open', currentColor.value)
  }
}

function handleMouseMove(e: MouseEvent) {
  if (!props.detail) return
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const x = ((e.clientX - rect.left) / rect.width) * 100
  const y = ((e.clientY - rect.top) / rect.height) * 100
  zoomOrigin.value = `${x}% ${y}%`
  isZooming.value = true
}

function handleMouseLeave() {
  isZooming.value = false
}

let touchStart = 0
function touchEnd(event: TouchEvent) {
  swiped = Math.abs(touchStart - event.changedTouches[0].clientX) > 45
  const delta = touchStart - event.changedTouches[0].clientX
  if (Math.abs(delta) > 45 && count.value > 1) {
    index.value = (index.value + (delta > 0 ? 1 : count.value - 1)) % count.value
  }
}

const cardColor = ref('')
const currentColor = computed(
  () => props.selectedColor ?? (cardColor.value || props.colorOptions?.[0]?.name)
)

const actualImages = computed(() => {
  if (props.colorOptions?.length) {
    return props.colorOptions.find((option) => option.name === currentColor.value)?.images ?? []
  }
  return (props.images ?? []).filter(Boolean)
})

const count = computed(
  () => actualImages.value.length || (props.demo && props.image && !props.colorOptions?.length ? 2 : 1)
)

watch(
  () => [props.name, props.images, currentColor.value],
  () => {
    index.value = 0
  }
)

const frameLabel = (position: number) =>
  actualImages.value.length
    ? 'صورة ' + (position + 1)
    : position
    ? 'تفاصيل الخامة'
    : 'الصورة الرئيسية'
</script>

<template>
  <div class="card-gallery" :class="{ 'card-gallery-detail': detail }">
    <div class="gallery-stage">
      <component
        :is="'button'"
        class="gallery-frame"
        :class="{ 'zoom-enabled': detail }"
        type="button"
        :aria-label="detail ? 'تكبير الصورة' : 'تفاصيل ' + name"
        @click="openFrame"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
        @touchstart.passive="swiped = false; touchStart = $event.touches[0].clientX"
        @touchend="touchEnd"
      >
        <img
          v-if="actualImages[index]"
          :src="actualImages[index]"
          :alt="name + ' · ' + frameLabel(index)"
          loading="lazy"
          :style="{
            transformOrigin: zoomOrigin,
            transform: detail && isZooming ? 'scale(1.8)' : 'scale(1)',
          }"
        />
        <span
          v-else-if="image && !colorOptions?.length"
          :class="['photo', image, { 'photo-detail': index > 0 }]"
          role="img"
          :aria-label="name + ' · ' + frameLabel(index)"
        ></span>
        <span v-else class="gallery-placeholder">الصورة غير متاحة</span>
      </component>

      <button
        v-if="!detail"
        class="save-product"
        type="button"
        :aria-pressed="favorite"
        :aria-label="(favorite ? 'إزالة من المفضلة: ' : 'حفظ في المفضلة: ') + name"
        @click="emit('favorite')"
      >
        <span aria-hidden="true">{{ favorite ? '♥' : '♡' }}</span>
      </button>
    </div>

    <div v-if="!detail && colorOptions?.length" class="swatches gallery-color-options">
      <button
        v-for="option in colorOptions"
        :key="option.id"
        type="button"
        class="dot"
        :style="{ background: option.hex }"
        :aria-label="'لون ' + option.name"
        :aria-pressed="currentColor === option.name"
        @mouseenter="cardColor = option.name"
        @focus="cardColor = option.name"
        @click="cardColor = option.name"
      ></button>
    </div>

    <!-- Lightbox Modal -->
    <dialog
      v-if="detail"
      ref="zoomDialog"
      class="gallery-lightbox"
      aria-label="عرض مكبّر للمنتج"
      @click.self="zoomDialog?.close()"
    >
      <button
        type="button"
        autofocus
        class="lightbox-close"
        aria-label="إغلاق الصورة"
        @click="zoomDialog?.close()"
      >
        &#215;
      </button>
      <div class="lightbox-img-wrap">
        <img v-if="actualImages[index]" :src="actualImages[index]" :alt="name" />
        <span v-else-if="image" :class="['photo', image]" role="img" :aria-label="name"></span>
        <p v-else>الصورة غير متاحة</p>
      </div>
    </dialog>

    <!-- Thumbnails -->
    <div v-if="count > 1" class="gallery-thumbs" aria-label="صور المنتج">
      <button
        v-for="position in count"
        :key="position"
        type="button"
        :aria-label="frameLabel(position - 1)"
        :aria-pressed="index === position - 1"
        @mouseenter="index = position - 1"
        @focus="index = position - 1"
        @click="index = position - 1"
      >
        <img
          v-if="actualImages[position - 1]"
          :src="actualImages[position - 1]"
          alt=""
          loading="lazy"
        />
        <span v-else :class="['photo', image, { 'photo-detail': position > 1 }]"></span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.zoom-enabled {
  cursor: zoom-in;
  overflow: hidden;
}

.gallery-frame img {
  transition: transform 0.15s ease-out;
  will-change: transform;
}

.gallery-lightbox {
  padding: 0;
  border: none;
  background: transparent;
  max-width: 90vw;
  max-height: 90vh;
}

.gallery-lightbox::backdrop {
  background: rgba(17, 18, 16, 0.85);
  backdrop-filter: blur(8px);
}

.lightbox-close {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: #fff;
  border: none;
  font-size: 1.8rem;
  width: 2.8rem;
  height: 2.8rem;
  border-radius: 50%;
  cursor: pointer;
  z-index: 10;
  display: grid;
  place-items: center;
}

.lightbox-img-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
}

.lightbox-img-wrap img {
  max-width: 85vw;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 6px;
}
</style>
