<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAdminStore } from '../../stores/admin'

const admin = useAdminStore()
const { busy, customers, customerPage, customersTotal, customerPages, searchCustomers } = storeToRefs(admin)
const goToPage = admin.goToPage

const filteredCustomers = computed(() =>
  customers.value.filter((customer) => {
    const query = searchCustomers.value.trim().toLowerCase()
    return !query
      || customer.name.toLowerCase().includes(query)
      || customer.phone.includes(query)
      || customer.governorate.toLowerCase().includes(query)
  })
)
</script>

<template>
<div class="section-topbar">
  <div>
    <h1>دليل العملاء</h1>
    <p class="section-desc">سجل العملاء المستخرج من الطلبات الفعلية مع إحصائيات الشراء والمحافظات.</p>
  </div>
</div>

<div class="filters-bar">
  <input v-model="searchCustomers" type="search" placeholder="ابحث باسم العميل، الهاتف، أو المحافظة…" class="search-input" />
</div>

<div v-if="!filteredCustomers.length" class="empty-state-box">
  <p>لا يوجد عملاء مسجلين حتى الآن.</p>
</div>

<div v-else class="table-container">
  <table class="admin-table">
    <thead>
      <tr>
        <th>العميل</th>
        <th>الهاتف</th>
        <th>المحافظة والعنوان</th>
        <th>عدد الطلبات</th>
        <th>إجمالي المشتريات</th>
        <th>آخر طلب</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="cust in filteredCustomers" :key="cust.phone">
        <td>
          <div class="product-info-cell">
            <div class="cust-avatar">👤</div>
            <strong>{{ cust.name }}</strong>
          </div>
        </td>
        <td>
          <a :href="'tel:' + cust.phone" dir="ltr" class="phone-link">{{ cust.phone }}</a>
        </td>
        <td>
          <span class="gov-badge">{{ cust.governorate }}</span>
          <small class="d-block text-muted">{{ cust.address }}</small>
        </td>
        <td><strong>{{ cust.orders_count }} طلب</strong></td>
        <td><strong class="lime-text">{{ (cust.total_spent / 100).toLocaleString('ar-EG') }} ج.م</strong></td>
        <td><small>{{ cust.last_order_date }}</small></td>
      </tr>
    </tbody>
  </table>
</div>
<nav v-if="customerPages > 1" aria-label="صفحات النتائج" class="admin-pagination">
  <button type="button" class="btn-action" :disabled="busy || customerPage <= 1" @click="goToPage('customers', customerPage - 1)">السابق</button>
  <span>صفحة {{ customerPage }} من {{ customerPages }}<template v-if="customersTotal !== null"> · {{ customersTotal }} إجمالي</template></span>
  <button type="button" class="btn-action" :disabled="busy || customerPage >= customerPages" @click="goToPage('customers', customerPage + 1)">التالي</button>
</nav>
</template>
