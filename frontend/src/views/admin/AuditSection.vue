<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAdminStore } from '../../stores/admin'

const admin = useAdminStore()
const { auditEvents, staffRole } = storeToRefs(admin)
</script>

<template>
<div v-if="staffRole !== 'admin'" class="empty-state-box">
  <p>سجل النشاط الإداري متاح لمسؤول النظام فقط.</p>
</div>
<template v-else>
  <div class="section-topbar">
    <div>
      <h1>سجل النشاط والرقابة الأمنية (Audit Logs)</h1>
      <p class="section-desc">سجل التغييرات، تعديل المخزون، حالات الطلبات، وتعديل إعدادات المتجر.</p>
    </div>
  </div>

  <div v-if="!auditEvents.length" class="empty-state-box">
    <p>لا توجد سجلات نشاط مسجلة حتى الآن.</p>
  </div>

  <div v-else class="audit-timeline">
    <div v-for="event in auditEvents" :key="event.id" class="audit-card">
      <div class="audit-icon-cell">🛡️</div>
      <div class="audit-main">
        <div class="audit-header">
          <span class="audit-event-tag">{{ event.event }}</span>
          <span class="audit-time">{{ event.created_at }}</span>
        </div>
        <p class="audit-details">
          قام <b>{{ event.actor_email || 'النظام' }}</b> بإجراء على:
          <code>{{ event.subject_type }} ({{ event.subject_id }})</code>
        </p>
        <div v-if="event.metadata" class="audit-metadata">
          <code>{{ typeof event.metadata === 'string' ? event.metadata : JSON.stringify(event.metadata) }}</code>
        </div>
        <small class="ip-address">عنوان IP: {{ event.ip_address || '127.0.0.1' }}</small>
      </div>
    </div>
  </div>
</template>
</template>
