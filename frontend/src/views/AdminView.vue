<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Admin from '../Admin.vue'
import { useCatalogStore } from '../stores/catalog'

const route = useRoute()
const catalog = useCatalogStore()

const section = computed(() => (route.params.section as string) || 'dashboard')
const productId = computed(() => (route.params.productId as string) || '')
const initialCategory = computed(() => (route.params.initialCategory as string) || '')
</script>

<template>
  <div class="admin-wrapper">
    <Admin
      :demo="false"
      :section="section"
      :product-id="productId"
      :initial-category="initialCategory"
      :demo-categories="catalog.categories"
      :demo-types="catalog.productTypes"
      :demo-products="catalog.managed as any"
    />
  </div>
</template>
