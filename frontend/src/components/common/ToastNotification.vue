<script setup lang="ts">
import { useUIStore } from '../../stores/ui'

const ui = useUIStore()
</script>

<template>
  <div class="toast-container" aria-live="polite" aria-atomic="true">
    <transition-group name="toast">
      <div
        v-for="t in ui.toasts"
        :key="t.id"
        class="toast-item"
        :class="t.type || 'success'"
        @click="ui.removeToast(t.id)"
      >
        <span class="toast-icon">{{ t.icon }}</span>
        <span class="toast-text">{{ t.message }}</span>
        <button type="button" class="toast-close" aria-label="إغلاق">✕</button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 2rem;
  left: 2rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  pointer-events: none;
}

.toast-item {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #111210;
  color: #fff;
  padding: 0.85rem 1.25rem;
  border-radius: 6px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  cursor: pointer;
  min-width: 260px;
  max-width: 400px;
  font-family: inherit;
  transition: transform 0.15s ease;
}

.toast-item:hover {
  transform: translateY(-2px);
}

.toast-item.success {
  border-right: 4px solid var(--lime);
}

.toast-item.error {
  border-right: 4px solid #e53935;
}

.toast-item.warning {
  border-right: 4px solid #fbc02d;
}

.toast-item.info {
  border-right: 4px solid #0288d1;
}

.toast-icon {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--lime);
}

.toast-item.error .toast-icon {
  color: #e53935;
}

.toast-item.warning .toast-icon {
  color: #fbc02d;
}

.toast-item.info .toast-icon {
  color: #0288d1;
}

.toast-text {
  flex: 1;
  font-size: 0.9rem;
  line-height: 1.4;
}

.toast-close {
  background: none;
  border: none;
  color: #888;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0 0.25rem;
  transition: color 0.15s ease;
}

.toast-close:hover {
  color: #fff;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-40px);
}

@media (max-width: 600px) {
  .toast-container {
    bottom: 5rem; /* Above mobile bottom bar */
    left: 1rem;
    right: 1rem;
  }
  .toast-item {
    max-width: none;
    width: 100%;
  }
}
</style>
