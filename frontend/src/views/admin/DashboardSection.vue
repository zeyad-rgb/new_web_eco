<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAdminStore } from '../../stores/admin'
import { statusBadgeClass, statusLabel } from '../../utils/order-status'

const admin = useAdminStore()
const { orders, ready, products, isAdminRole, inventoryMetrics, restockList } = storeToRefs(admin)
</script>

<template>
<section class="admin-dashboard">
  <header class="dashboard-header">
    <div>
      <p class="dashboard-sub">STUDIO ACTIVE · PERFORMANCE OVERVIEW</p>
      <h1>لوحة التحكم والمؤشرات</h1>
    </div>
    <router-link class="btn-primary-lime" to="/admin/products/new">
      ＋ إضافة منتج جديد
    </router-link>
  </header>

  <!-- Metrics Cards -->
  <div class="kpi-grid">
    <div v-if="isAdminRole" class="kpi-card">
      <span class="kpi-label">إجمالي المبيعات</span>
      <strong v-if="ready || products.length" class="kpi-value">{{ (inventoryMetrics.totalRevenue / 100).toLocaleString('ar-EG') }} ج.م</strong>
      <div v-else class="skeleton-shimmer h-metric"></div>
      <span class="kpi-hint">من الطلبات التي تم توصيلها</span>
    </div>
    <div v-if="isAdminRole" class="kpi-card">
      <span class="kpi-label">طلبات قيد التجهيز</span>
      <strong v-if="ready || products.length" class="kpi-value lime-val">{{ inventoryMetrics.processingCount }}</strong>
      <div v-else class="skeleton-shimmer h-metric"></div>
      <span class="kpi-hint">تحتاج تعبئة وشحن</span>
    </div>
    <div class="kpi-card">
      <span class="kpi-label">المنتجات المنشورة</span>
      <strong v-if="ready || products.length" class="kpi-value">{{ inventoryMetrics.published }}</strong>
      <div v-else class="skeleton-shimmer h-metric"></div>
      <span class="kpi-hint">{{ inventoryMetrics.drafts }} مسودة</span>
    </div>
    <div class="kpi-card">
      <span class="kpi-label">وحدات المخزون</span>
      <strong v-if="ready || products.length" class="kpi-value">{{ inventoryMetrics.stockUnits.toLocaleString('ar-EG') }}</strong>
      <div v-else class="skeleton-shimmer h-metric"></div>
      <span class="kpi-hint" :class="{ 'warning-text': inventoryMetrics.lowStock > 0 }">
        {{ inventoryMetrics.lowStock }} منخفض · {{ inventoryMetrics.outOfStock }} نفد
      </span>
    </div>
  </div>

  <!-- Dashboard Split Panels -->
  <div class="dashboard-split">
    <!-- Recent Orders -->
    <div v-if="isAdminRole" class="dash-panel">
      <div class="dash-panel-head">
        <h3>أحدث الطلبات الواردة</h3>
        <router-link to="/admin/orders" class="link-btn">عرض الكل ←</router-link>
      </div>
      <div v-if="!orders.length" class="empty-state-box">
        <p>لا توجد طلبات مسجلة حتى الآن.</p>
      </div>
      <div v-else class="dash-orders-list">
        <div v-for="order in orders.slice(0, 5)" :key="order.id" class="dash-order-row">
          <div>
            <strong>#{{ order.id.slice(0, 8) }}</strong>
            <span class="cust-name">· {{ order.customer_name }}</span>
            <small class="time-stamp">{{ order.created_at }}</small>
          </div>
          <div class="order-right">
            <span :class="['badge-status', statusBadgeClass(order.status)]">{{ statusLabel(order.status) }}</span>
            <b class="price-val">{{ (order.total / 100).toLocaleString('ar-EG') }} ج.م</b>
          </div>
        </div>
      </div>
    </div>

    <!-- Restock list: variants at or below the low-stock threshold -->
    <div class="dash-panel" data-test="restock-panel">
      <div class="dash-panel-head">
        <h3>تحتاج إعادة تخزين</h3>
        <router-link to="/admin/products" class="link-btn">كل المنتجات ←</router-link>
      </div>
      <div v-if="!restockList.length" class="empty-state-box"><p>كل المقاسات متوفرة بكميات كافية ✅</p></div>
      <div v-else class="dash-orders-list">
        <router-link v-for="item in restockList" :key="item.product.id + item.color + item.size" :to="'/admin/products/' + item.product.id" class="dash-order-row restock-row">
          <div>
            <strong>{{ item.product.name }}</strong>
            <small class="time-stamp">{{ item.color }} · {{ item.size }}</small>
          </div>
          <span :class="['badge-status', item.stock === 0 ? 'status-cancelled' : 'status-processing']">{{ item.stock === 0 ? 'نفد' : 'متبقي ' + item.stock }}</span>
        </router-link>
      </div>
    </div>
    <!-- Inventory & Category Distribution -->
    <div class="dash-panel">
      <div class="dash-panel-head">
        <h3>المنتجات حسب التصنيف</h3>
        <router-link to="/admin/categories" class="link-btn">إدارة التصنيفات ←</router-link>
      </div>
      <div class="category-bars">
        <div v-for="item in inventoryMetrics.categoryCounts" :key="item.slug" class="cat-bar-item">
          <div class="cat-bar-labels">
            <span>{{ item.name }}</span>
            <b>{{ item.count }} منتج</b>
          </div>
          <div class="bar-bg">
            <div class="bar-fill" :style="{ width: (item.count / inventoryMetrics.maxCategoryCount * 100) + '%' }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
</template>
