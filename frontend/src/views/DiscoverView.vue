<script setup lang="ts">
import { useCatalogStore } from '../stores/catalog'
import { categoryPath } from '../taxonomy'

const catalog = useCatalogStore()
</script>

<template>
  <div class="discover-view">
    <div class="discover-intro">
      <div>
        <h1>اكتشف</h1>
        <p>اختار حسب نوع القطعة أو شوف مجموعات التمرين واللبس اليومي.</p>
      </div>
      <router-link
        class="primary"
        :to="{ path: '/shop', query: { collection: 'latest' } }"
      >
        شوف الجديد ←
      </router-link>
    </div>

    <section id="categories" class="discovery">
      <div class="section-head">
        <h2>تسوّق حسب التصنيف</h2>
        <router-link to="/shop">
          كل المنتجات <span aria-hidden="true">←</span>
        </router-link>
      </div>
      <div class="discovery-grid">
        <router-link
          v-for="item in catalog.rootCategories"
          :key="item.slug"
          :class="[
            'category-tile',
            catalog.products.find((product) =>
              categoryPath(catalog.categories, product.categoryId).some(
                (node) => node.slug === item.slug
              )
            )?.image,
          ]"
          :to="{ path: '/shop', query: { category: item.slug } }"
        >
          <span>{{ item.name }}</span>
          <span aria-hidden="true">↗</span>
        </router-link>
      </div>
    </section>

    <section id="collections" class="discovery">
      <div class="section-head">
        <h2>المجموعات</h2>
        <router-link :to="{ path: '/shop', query: { collection: 'latest' } }">
          وصل حديثًا <span aria-hidden="true">←</span>
        </router-link>
      </div>
      <div class="discovery-grid">
        <router-link
          v-for="item in catalog.collections"
          :key="item.slug"
          class="collection-tile"
          :to="{ path: '/shop', query: { collection: item.slug } }"
        >
          <span>{{ item.name }}</span>
          <span aria-hidden="true">↗</span>
        </router-link>
      </div>
    </section>

    <section v-if="catalog.productTypes.length" class="discovery">
      <h2>تسوّق حسب نوع المنتج</h2>
      <nav class="category-strip" aria-label="أنواع المنتجات">
        <router-link
          v-for="item in catalog.productTypes"
          :key="item.slug"
          :to="{ path: '/shop', query: { type: item.slug } }"
        >
          {{ item.name }}
        </router-link>
      </nav>
    </section>
  </div>
</template>
