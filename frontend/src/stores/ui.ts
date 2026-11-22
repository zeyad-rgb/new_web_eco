import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'info' | 'error' | 'warning'
  icon?: string
}

export const useUIStore = defineStore('ui', () => {
  const toasts = ref<Toast[]>([])
  const isSearchOpen = ref(false)
  const isMobileMenuOpen = ref(false)
  const theme = ref<'light' | 'dark'>('light')

  function initTheme() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ecomars_theme') as 'light' | 'dark' | null
      const initial = saved || 'light'
      setTheme(initial)
    }
  }

  function setTheme(newTheme: 'light' | 'dark') {
    theme.value = newTheme
    if (typeof window !== 'undefined') {
      localStorage.setItem('ecomars_theme', newTheme)
      document.documentElement.setAttribute('data-theme', newTheme)
    }
  }

  function toggleTheme() {
    const next = theme.value === 'dark' ? 'light' : 'dark'
    setTheme(next)
    showToast(
      next === 'dark' ? 'تم تفعيل الوضع الليلي' : 'تم تفعيل الوضع النهاري',
      'info',
      next === 'dark' ? '🌙' : '☀️',
      2500
    )
  }

  function showToast(
    message: string,
    type: 'success' | 'info' | 'error' | 'warning' = 'success',
    iconOrDuration?: string | number,
    maybeDuration = 3500
  ) {
    const id = (Date.now() + Math.random()).toString(36)
    
    let icon =
      type === 'success' ? '✓' :
      type === 'error' ? '✕' :
      type === 'warning' ? '⚠' : 'ℹ'
    
    let duration = maybeDuration

    if (typeof iconOrDuration === 'string') {
      icon = iconOrDuration
    } else if (typeof iconOrDuration === 'number') {
      duration = iconOrDuration
    }

    const toast: Toast = { id, message, type, icon }
    toasts.value.push(toast)

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }

  function removeToast(id: string) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  function openSearch() {
    isSearchOpen.value = true
  }

  function closeSearch() {
    isSearchOpen.value = false
  }

  function toggleSearch() {
    isSearchOpen.value = !isSearchOpen.value
  }

  function openMobileMenu() {
    isMobileMenuOpen.value = true
  }

  function closeMobileMenu() {
    isMobileMenuOpen.value = false
  }

  function toggleMobileMenu() {
    isMobileMenuOpen.value = !isMobileMenuOpen.value
  }

  return {
    toasts,
    isSearchOpen,
    isMobileMenuOpen,
    showToast,
    removeToast,
    openSearch,
    closeSearch,
    toggleSearch,
    openMobileMenu,
    closeMobileMenu,
    toggleMobileMenu,
    theme,
    initTheme,
    setTheme,
    toggleTheme,
  }
})
