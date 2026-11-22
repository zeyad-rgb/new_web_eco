<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AdminLayout from './admin/AdminLayout.vue'

const route = useRoute()

const section = computed(() => (route.params.section as string) || 'dashboard')
const productId = computed(() => (route.params.productId as string) || '')
const initialCategory = computed(() => (route.params.initialCategory as string) || '')
</script>

<template>
  <div class="admin-wrapper">
    <AdminLayout
      :section="section"
      :product-id="productId"
      :initial-category="initialCategory"
    />
  </div>
</template>
