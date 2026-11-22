import type { Directive } from 'vue'
const observers = new WeakMap<HTMLElement, IntersectionObserver>()
export const reveal: Directive<HTMLElement> = {
 mounted(el) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return
  el.classList.add('reveal-pending')
  // Fail open: if the observer never fires (print, screenshot, odd viewport),
  // the content must still become visible rather than stay at opacity 0.
  const failsafe = setTimeout(() => {
    el.classList.remove('reveal-pending')
    observers.get(el)?.disconnect()
    observers.delete(el)
  }, 1200)
  const observer = new IntersectionObserver(entries => {
   if (entries.some(entry => entry.isIntersecting)) {
    clearTimeout(failsafe)
    el.classList.remove('reveal-pending')
    el.classList.add('reveal-visible')
    observer.disconnect()
    observers.delete(el)
   }
  }, { threshold: 0.06, rootMargin: '0px 0px 30px 0px' })
  observers.set(el, observer)
  observer.observe(el)
 },
 beforeUnmount(el) { observers.get(el)?.disconnect(); observers.delete(el) }
}

