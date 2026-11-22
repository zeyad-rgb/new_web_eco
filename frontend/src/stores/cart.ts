import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CartLine, CartItemResolved, Product, Variant } from '../types'

export const useCartStore = defineStore(
  'cart',
  () => {
    const items = ref<CartLine[]>([])
    const isDrawerOpen = ref(false)

    const count = computed(() => items.value.reduce((sum, line) => sum + line.quantity, 0))

    function getResolvedLines(products: Product[]): CartItemResolved[] {
      return items.value.flatMap((line) => {
        const product = products.find((item) =>
          item.variants.some((variant) => variant.sku === line.sku)
        )
        const variant = product?.variants.find((item) => item.sku === line.sku)
        return product && variant ? [{ ...line, product, variant }] : []
      })
    }

    function subtotal(products: Product[]) {
      return getResolvedLines(products).reduce(
        (sum, line) => sum + line.quantity * line.product.price,
        0
      )
    }

    function remainingStock(variant?: Variant): number {
      if (!variant) return 0
      const currentQty = items.value.find((line) => line.sku === variant.sku)?.quantity ?? 0
      return Math.min(10, variant.stock) - currentQty
    }

    function adjust(sku: string, delta: number, currentStock = 10) {
      const line = items.value.find((item) => item.sku === sku)
      if (delta > 0) {
        const currentQty = line?.quantity ?? 0
        if (currentQty >= Math.min(10, currentStock)) return
      }

      if (!line) {
        if (delta > 0) items.value.push({ sku, quantity: 1 })
      } else {
        line.quantity += delta
      }
      items.value = items.value.filter((item) => item.quantity > 0)
    }

    function add(sku: string, currentStock = 10) {
      adjust(sku, 1, currentStock)
    }

    function remove(sku: string) {
      items.value = items.value.filter((item) => item.sku !== sku)
    }

    function clear() {
      items.value = []
    }

    function toggleDrawer(open?: boolean) {
      isDrawerOpen.value = open !== undefined ? open : !isDrawerOpen.value
    }

    return {
      items,
      isDrawerOpen,
      count,
      getResolvedLines,
      subtotal,
      remainingStock,
      adjust,
      add,
      remove,
      clear,
      toggleDrawer,
    }
  },
  {
    persist: {
      key: 'ecomars_cart',
      pick: ['items'],
    },
  }
)
