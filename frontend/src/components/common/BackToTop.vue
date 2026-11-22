<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const isVisible = ref(false)
const progress = ref(0)

const RADIUS = 20
const CIRCUMFERENCE = +(2 * Math.PI * RADIUS).toFixed(2)

const strokeDasharray = computed(() => {
  const dash = (progress.value * CIRCUMFERENCE).toFixed(2)
  return `${dash} ${CIRCUMFERENCE}`
})

function checkScroll() {
  const scrollY = window.scrollY || document.documentElement.scrollTop || 0
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight

  isVisible.value = scrollY > 300

  if (maxScroll > 0) {
    progress.value = Math.min(1, Math.max(0, scrollY / maxScroll))
  } else {
    progress.value = 0
  }
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

onMounted(() => {
  checkScroll()
  window.addEventListener('scroll', checkScroll, { passive: true })
  window.addEventListener('resize', checkScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', checkScroll)
  window.removeEventListener('resize', checkScroll)
})
</script>

<template>
  <Transition name="fade-scale">
    <button
      v-show="isVisible"
      type="button"
      class="back-to-top-btn"
      aria-label="الرجوع إلى أعلى الصفحة"
      title="الرجوع إلى أعلى الصفحة"
      @click="scrollToTop"
    >
      <svg class="progress-ring" viewBox="0 0 48 48" aria-hidden="true">
        <circle
          class="progress-ring-track"
          cx="24"
          cy="24"
          r="20"
          stroke-width="3"
          fill="none"
        />
        <circle
          class="progress-ring-circle"
          cx="24"
          cy="24"
          r="20"
          stroke-width="3"
          stroke-linecap="round"
          fill="none"
          :stroke-dasharray="strokeDasharray"
        />
      </svg>
      <svg
        class="arrow-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M12 19V5" />
        <path d="M5 12l7-7 7 7" />
      </svg>
    </button>
  </Transition>
</template>

<style scoped>
.back-to-top-btn {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 90;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--ink, #111210);
  color: #ffffff;
  border: none;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transform: scale(1);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18), 0 8px 24px rgba(0, 0, 0, 0.12);
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1),
              background-color 0.2s ease,
              color 0.2s ease;
}

.back-to-top-btn:hover {
  transform: scale(1.08);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.26),
              0 16px 36px rgba(0, 0, 0, 0.2),
              0 0 16px rgba(213, 251, 82, 0.25);
}

.back-to-top-btn:active {
  transform: scale(0.96);
}

.back-to-top-btn:focus-visible {
  outline: 2px solid var(--lime, #d5fb52);
  outline-offset: 3px;
}

/* Progress ring overlay */
.progress-ring {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
  transform-origin: center;
  pointer-events: none;
}

.progress-ring-track {
  stroke: rgba(255, 255, 255, 0.14);
}

.progress-ring-circle {
  stroke: var(--lime, #d5fb52);
  transition: stroke-dasharray 0.15s ease-out;
}

/* Arrow Icon */
.arrow-icon {
  width: 20px;
  height: 20px;
  z-index: 1;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
              color 0.2s ease;
}

.back-to-top-btn:hover .arrow-icon {
  transform: translateY(-2px);
  color: var(--lime, #d5fb52);
}

/* Vue Transition: Smooth scale + fade entrance & exit */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-scale-enter-from {
  opacity: 0;
  transform: scale(0.65);
}

.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.65) !important;
}

.fade-scale-enter-to,
.fade-scale-leave-from {
  opacity: 1;
  transform: scale(1);
}

/* Mobile: Position above mobile bottom nav */
@media (max-width: 768px) {
  .back-to-top-btn {
    bottom: 5.5rem;
    right: 1.25rem;
    width: 44px;
    height: 44px;
  }

  .arrow-icon {
    width: 18px;
    height: 18px;
  }
}
</style>
