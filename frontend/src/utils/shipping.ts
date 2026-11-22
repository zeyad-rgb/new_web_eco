import { computed } from 'vue'
import { useCatalogStore } from '../stores/catalog'
import { useLocaleStore } from '../stores/locale'
import { formatMoney } from './money'

/**
 * Free-shipping promise text built from the store's real shipping setting
 * (the same value CheckoutPricing uses on the server). Returns '' when the
 * store has no free-shipping threshold, so callers can hide the line.
 */
export function useFreeShippingText() {
  const catalog = useCatalogStore()
  const locale = useLocaleStore()
  return computed(() => {
    const threshold = Number(catalog.shippingSettings?.free_threshold || 0)
    if (threshold <= 0) return ''
    const amount = formatMoney(threshold)
    return locale.locale === 'en' ? `Free shipping on orders over ${amount}` : `شحن مجاني للطلبات فوق ${amount}`
  })
}
