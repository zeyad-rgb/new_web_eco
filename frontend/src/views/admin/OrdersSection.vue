<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAdminStore } from '../../stores/admin'
import { useUIStore } from '../../stores/ui'
import { restocksInventory, statusBadgeClass, statusLabel, statusOptions } from '../../utils/order-status'

const admin = useAdminStore()
const ui = useUIStore()
const {
  busy, ready, orders, orderPage, ordersTotal, orderPages,
  whatsappQueue, searchOrders, filterOrderStatus,
} = storeToRefs(admin)
const goToPage = admin.goToPage

const expandedOrders = ref<Record<string, boolean>>({})
function toggleOrderExpand(id: string) {
  expandedOrders.value[id] = !expandedOrders.value[id]
}

// Status and id search run on the server; this narrows the current page by
// name/phone/address, which are encrypted and cannot be searched server-side.
const filteredOrders = computed(() =>
  orders.value.filter((order) => {
    const query = searchOrders.value.trim().toLowerCase()
    return !query
      || order.id.toLowerCase().includes(query)
      || (order.customer_name && order.customer_name.toLowerCase().includes(query))
      || (order.customer_phone && order.customer_phone.includes(query))
      || (order.customer_address && order.customer_address.toLowerCase().includes(query))
  })
)

let searchTimer: ReturnType<typeof setTimeout> | undefined
watch([filterOrderStatus, searchOrders], () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { orderPage.value = 1; void admin.loadSection('orders') }, 300)
})

function updateOrderStatus(order: any, newStatus: string) {
  return admin.run(async () => {
    if (newStatus === order.status) return
    if (restocksInventory(newStatus)
      && !confirm(`\u062a\u0623\u0643\u064a\u062f \u062a\u063a\u064a\u064a\u0631 \u062d\u0627\u0644\u0629 \u0627\u0644\u0637\u0644\u0628 #${order.id.slice(0, 8)} \u0625\u0644\u0649 "${statusLabel(newStatus)}"\u061f \u0633\u064a\u062a\u0645 \u0625\u0631\u062c\u0627\u0639 \u0627\u0644\u0643\u0645\u064a\u0627\u062a \u0644\u0644\u0645\u062e\u0632\u0648\u0646.`)) return
    await admin.request(`orders/${order.id}/status`, { status: newStatus }, 'PUT')
    order.status = newStatus
    await admin.loadBundle()
    await admin.loadSection('orders')
    ui.showToast(`\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u062d\u0627\u0644\u0629 \u0627\u0644\u0637\u0644\u0628 #${order.id.slice(0, 8)} \u0625\u0644\u0649: ${statusLabel(newStatus)}`, 'success')
  })
}

/** WhatsApp confirmation link built from the order (see ADM-12: should move to the server). */
function getWhatsAppOrderUrl(order: any): string {
  const digits = (order.customer_phone || '').replace(/\D/g, '')
  const phone = digits.startsWith('01') && digits.length === 11 ? '2' + digits
    : digits.startsWith('0020') ? digits.slice(2) : digits
  const shortId = (order.id || '').slice(0, 8).toUpperCase()
  const total = (order.total / 100).toLocaleString('ar-EG')
  const message = [
    '\u26a1 *STUDIO ACTIVE \u00b7 \u062a\u0623\u0643\u064a\u062f \u0627\u0644\u0637\u0644\u0628* \u26a1', '',
    `\u0623\u0647\u0644\u0627\u064b *${order.customer_name || '\u0639\u0645\u064a\u0644\u0646\u0627 \u0627\u0644\u0639\u0632\u064a\u0632'}*! \ud83d\udc4b`,
    '\u062a\u0645 \u0627\u0633\u062a\u0644\u0627\u0645 \u0637\u0644\u0628\u0643 \u0628\u0646\u062c\u0627\u062d \u0648\u062c\u0627\u0631\u064a \u062a\u062c\u0647\u064a\u0632\u0647 \u2705', '',
    '\ud83d\udccb *\u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u0637\u0644\u0628:*',
    `\u25b8 \u0631\u0642\u0645 \u0627\u0644\u0637\u0644\u0628: *#${shortId}*`,
    `\u25b8 \u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a: *${total} \u062c.\u0645* (\u0627\u0644\u062f\u0641\u0639 \u0639\u0646\u062f \u0627\u0644\u0627\u0633\u062a\u0644\u0627\u0645 \ud83d\udcb5)`,
    `\u25b8 \u0627\u0644\u062a\u0648\u0635\u064a\u0644 \u0625\u0644\u0649: ${order.customer_address || ''}`, '',
    '\u0647\u0644 \u062a\u0624\u0643\u062f \u0627\u0633\u062a\u0644\u0627\u0645 \u0627\u0644\u0634\u062d\u0646\u0629 \u0639\u0646\u062f \u0648\u0635\u0648\u0644 \u0627\u0644\u0645\u0646\u062f\u0648\u0628\u061f \u0628\u0631\u062c\u0627\u0621 \u0627\u0644\u0631\u062f \u0628\u0640 (\u0646\u0639\u0645 \u0623\u0624\u0643\u062f) \ud83d\udcac',
    '\u0634\u0643\u0631\u0627\u064b \u0644\u0627\u062e\u062a\u064a\u0627\u0631\u0643 *Studio Active*! \u2728',
  ].join('\n')
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

function openWhatsAppUrl(url: string) {
  if (url) window.open(url, '_blank')
}

async function markQueueItemSent(item: any) {
  try {
    await admin.request(`whatsapp-queue/${item.id}/mark-sent`, {}, 'PUT')
    item.manually_sent = 1
    ui.showToast('\u062a\u0645 \u062a\u0639\u0644\u064a\u0645 \u0631\u0633\u0627\u0644\u0629 \u0627\u0644\u0648\u0627\u062a\u0633\u0627\u0628 \u0643\u0645\u0631\u0633\u0644\u0629 \u2705', 'success')
  } catch {
    ui.showToast('\u062a\u0639\u0630\u0631 \u062a\u062d\u062f\u064a\u062b \u062d\u0627\u0644\u0629 \u0627\u0644\u0625\u0631\u0633\u0627\u0644', 'error')
  }
}

function openAndMarkSent(item: any) {
  if (item.admin_send_url) window.open(item.admin_send_url, '_blank')
  void markQueueItemSent(item)
}

function notifyCustomerStatus(order: any, status: string) {
  return admin.run(async () => {
    const result = await admin.request('whatsapp-notify-status', { order_id: order.id, status }, 'POST')
    if (result.admin_send_url) window.open(result.admin_send_url, '_blank')
    whatsappQueue.value = await admin.request('whatsapp-queue')
    ui.showToast(`\u062a\u0645 \u062a\u062c\u0647\u064a\u0632 \u0631\u0633\u0627\u0644\u0629 \u0627\u0644\u062a\u062d\u062f\u064a\u062b (${statusLabel(status)}) \u0644\u0641\u062a\u062d\u0647\u0627 \u0641\u064a \u0648\u0627\u062a\u0633\u0627\u0628!`, 'success')
  })
}
</script>

<template>
<div class="section-topbar">
  <div>
    <h1>إدارة الطلبات والشحن</h1>
    <p class="section-desc">متابعة شحنات العملاء، أرقام الهواتف، وتغيير حالات الطلب.</p>
  </div>
</div>

<!-- Order Filters -->
<div class="filters-bar">
  <input v-model="searchOrders" type="search" placeholder="ابحث برقم الطلب، اسم العميل، أو الهاتف…" class="search-input" />
  <select v-model="filterOrderStatus" class="filter-select">
    <option value="">جميع الحالات</option>
    <option value="processing">قيد التجهيز</option>
    <option value="shipped">تم الشحن</option>
    <option value="delivered">تم التوصيل</option>
    <option value="cancelled">ملغي</option>
          <option value="returned">Returned / مرتجع</option>
  </select>
</div>

<!-- WhatsApp Pending Confirmations Queue -->
<div v-if="whatsappQueue.length" class="whatsapp-queue-card">
  <div class="queue-head">
    <div class="head-left">
      <span class="icon-pulse">⚡</span>
      <div>
        <h3>إشعارات وتأكيدات واتساب الصادرة للعملاء</h3>
        <p class="queue-sub">الرسائل المجهزة من النظام لتأكيد الطلبات مع العملاء من رقم المتجر ومتابعة الرد.</p>
      </div>
    </div>
    <span class="queue-count-badge">
      {{ whatsappQueue.filter(q => !q.manually_sent && !q.auto_sent).length }} طلبات تنتظر التأكيد
    </span>
  </div>

  <div class="queue-items-scroller">
    <div
      v-for="qItem in whatsappQueue.slice(0, 6)"
      :key="qItem.id"
      class="queue-item-row"
      :class="{ sent: qItem.manually_sent || qItem.auto_sent }"
    >
      <div class="qitem-info">
        <strong class="qitem-name">{{ qItem.customer_name }} (#{{ qItem.order_id.slice(0, 8) }})</strong>
        <span class="qitem-phone" dir="ltr">{{ qItem.customer_phone }}</span>
      </div>
      <div class="qitem-status-col">
        <span v-if="qItem.auto_sent" class="status-tag auto">تم الإرسال تلقائياً ✓</span>
        <span v-else-if="qItem.manually_sent" class="status-tag sent">تم الإرسال يدوياً ✓</span>
        <span v-else class="status-tag pending">بانتظار الإرسال للعميل</span>
      </div>
      <div class="qitem-actions">
        <button
          type="button"
          class="btn-wa-send"
          @click="openAndMarkSent(qItem)"
        >
          <span>📱 إرسال للعميل</span>
        </button>
        <button
          v-if="!qItem.manually_sent && !qItem.auto_sent"
          type="button"
          class="btn-wa-mark"
          title="تعليم كمرسل"
          @click="markQueueItemSent(qItem)"
        >
          ✓ تم
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Orders Cards Skeletons when loading fresh without cache -->
<div v-if="!ready && !orders.length" class="orders-grid">
  <div v-for="n in 3" :key="n" class="order-manage-card skeleton-card">
    <div class="skeleton-shimmer h-title"></div>
    <div class="skeleton-shimmer h-line"></div>
    <div class="skeleton-shimmer h-line w-half"></div>
  </div>
</div>

<div v-else-if="!filteredOrders.length" class="empty-state-box">
  <p>لا توجد طلبات مطابقة للمعايير الحالية.</p>
</div>

<!-- Orders Cards -->
<div v-else class="orders-grid">
  <div v-for="order in filteredOrders" :key="order.id" class="order-manage-card">
    <div class="order-head">
      <div>
        <span class="order-num">#{{ order.id.slice(0, 8) }}</span>
        <span class="order-time">{{ order.created_at }}</span>
      </div>
      <div class="order-status-control">
        <select
          :value="order.status"
          class="status-select"
          :class="statusBadgeClass(order.status)"
          :disabled="busy"
          @change="updateOrderStatus(order, ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="status in statusOptions(order.status)" :key="status" :value="status">{{ statusLabel(status) }}</option>
        </select>
      </div>
    </div>

    <div class="order-body">
      <div class="cust-info">
        <p><strong>👤 العميل:</strong> {{ order.customer_name }}</p>
        <p>
          <strong>📞 الهاتف:</strong>
          <a :href="'tel:' + order.customer_phone" class="phone-link" dir="ltr">{{ order.customer_phone }}</a>
          <a
            v-if="order.customer_phone"
            :href="getWhatsAppOrderUrl(order)"
            target="_blank"
            class="whatsapp-pill"
            title="مراسلة وتأكيد فوري عبر واتساب"
          >
            واتساب 💬
          </a>
        </p>
        <p><strong>📍 العنوان:</strong> {{ order.customer_address }}</p>
      </div>

      <!-- Order WhatsApp Actions Bar -->
      <div class="order-wa-actions-bar">
        <button
          type="button"
          class="wa-action-chip confirm"
          @click="openWhatsAppUrl(getWhatsAppOrderUrl(order))"
        >
          💬 إرسال رسالة تأكيد للعميل
        </button>
        <button
          v-if="order.status === 'processing'"
          type="button"
          class="wa-action-chip ship"
          @click="notifyCustomerStatus(order, 'shipped')"
        >
          🚚 إشعار بالشحن
        </button>
        <button
          v-if="order.status === 'shipped'"
          type="button"
          class="wa-action-chip deliver"
          @click="notifyCustomerStatus(order, 'delivered')"
        >
          ✅ إشعار بالتوصيل
        </button>
      </div>

      <div class="order-total-bar">
        <span>الإجمالي شامل الشحن:</span>
        <strong>{{ (order.total / 100).toLocaleString('ar-EG') }} ج.م</strong>
      </div>
    </div>

    <!-- Collapsible items lines -->
    <div class="order-footer">
      <button type="button" class="btn-toggle-items" @click="toggleOrderExpand(order.id)">
        {{ expandedOrders[order.id] ? '▲ إخفاء تفاصيل المنتجات' : `▼ تفاصيل المنتجات (${order.items_count} قطع)` }}
      </button>
      <div v-if="expandedOrders[order.id]" class="items-expanded-list">
        <div v-for="(line, idx) in order.lines" :key="idx" class="item-line">
          <span class="sku-name">{{ line.sku }}</span>
          <span class="qty-badge">{{ line.quantity }}x</span>
          <span class="price-line">{{ ((line.price * line.quantity) / 100).toLocaleString('ar-EG') }} ج.م</span>
        </div>
      </div>
    </div>
  </div>
</div>
<nav v-if="orderPages > 1" aria-label="صفحات النتائج" class="admin-pagination">
  <button type="button" class="btn-action" :disabled="busy || orderPage <= 1" @click="goToPage('orders', orderPage - 1)">السابق</button>
  <span>صفحة {{ orderPage }} من {{ orderPages }}<template v-if="ordersTotal !== null"> · {{ ordersTotal }} إجمالي</template></span>
  <button type="button" class="btn-action" :disabled="busy || orderPage >= orderPages" @click="goToPage('orders', orderPage + 1)">التالي</button>
</nav>
</template>
