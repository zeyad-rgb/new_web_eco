import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useFavoritesStore = defineStore(
  'favorites',
  () => {
    const items = ref<string[]>([])

    const count = computed(() => items.value.length)

    function isFavorite(productId: string) {
      return items.value.includes(productId)
    }

    function toggle(productId: string) {
      if (items.value.includes(productId)) {
        items.value = items.value.filter((id) => id !== productId)
      } else {
        items.value.push(productId)
      }
    }

    return {
      items,
      count,
      isFavorite,
      toggle,
    }
  },
  {
    persist: {
      key: 'ecomars_favorites',
    },
  }
)
