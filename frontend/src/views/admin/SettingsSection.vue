<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAdminStore } from '../../stores/admin'
import { useCatalogStore } from '../../stores/catalog'
import { useUIStore } from '../../stores/ui'

const admin = useAdminStore()
const ui = useUIStore()
const { busy, settings, settingsLoaded, staffRole } = storeToRefs(admin)
const newDiscount = ref({ code: '', percent: 10, min_spend: 50000, active: true })

function addDiscount() {
  if (!newDiscount.value.code.trim()) return
  settings.value.discounts.push({
    code: newDiscount.value.code.toUpperCase().trim(),
    percent: Number(newDiscount.value.percent),
    min_spend: Number(newDiscount.value.min_spend),
    active: true,
  })
  newDiscount.value.code = ''
}

function removeDiscount(index: number) {
  settings.value.discounts.splice(index, 1)
}

function saveStoreSettings() {
  return admin.run(async () => {
    // Never write defaults over the store's real configuration (ADM-01).
    if (!settingsLoaded.value) throw new Error('لم يتم تحميل الإعدادات الحالية بعد. أعد تحميل الصفحة قبل الحفظ.')
    for (const key of ['shipping', 'payment_methods', 'discounts', 'whatsapp', 'storefront'] as const) {
      await admin.request(`settings/${key}`, { value: settings.value[key] }, 'PUT')
    }
    const catalog = useCatalogStore()
    catalog.invalidateFreshness()
    try { sessionStorage.removeItem('studioactive_catalog_cache') } catch {}
    await catalog.load(true)
    ui.showToast('تم حفظ إعدادات المتجر ورسائل واتساب بنجاح!', 'success')
  })
}
</script>

<template>
<div v-if="staffRole !== 'admin'" class="empty-state-box">
  <p>قسم الإعدادات مقصور على حسابات الأدمن (Admin) فقط.</p>
</div>
<template v-else>
  <div class="section-topbar">
    <div>
      <h1>إعدادات المتجر العامة</h1>
      <p class="section-desc">التحكم في تكاليف الشحن، بوابات الدفع الإلكتروني، وكوبونات الخصم.</p>
    </div>
    <button class="btn-primary-lime" :disabled="busy || !settingsLoaded" @click="saveStoreSettings">
      {{ settingsLoaded ? '💾 حفظ كافة التغييرات' : 'جاري تحميل الإعدادات…' }}
    </button>
  </div>

  <div class="settings-grid">
    <!-- Storefront Header Card -->
    <div class="settings-card col-span-2">
      <h3>🎨 الشريط العلوي ومكان المتجر</h3>
      <div class="settings-grid-sub">
        <label>
          النص الظاهر أعلى الصفحة
          <input v-model="settings.storefront.announcement_text" type="text" maxlength="300" dir="ltr" />
          <small class="hint-text">يظهر في الشريط البرتقالي العلوي على الصفحة الرئيسية.</small>
        </label>
        <label>
          نص زر زيارة المتجر
          <input v-model="settings.storefront.visit_label" type="text" maxlength="80" />
        </label>
        <label>
          رابط موقع أو خرائط المتجر
          <input v-model="settings.storefront.location_url" type="url" placeholder="https://maps.google.com/..." dir="ltr" />
          <small class="hint-text">عند الضغط على Visit Us أو زر الزائر، سيفتح هذا الرابط مباشرة في نافذة جديدة.</small>
        </label>
      </div>
    </div>

    <!-- Shipping Card -->
    <div class="settings-card">
      <h3>🚚 الشحن والتوصيل</h3>
      <label>
        رسوم الشحن الثابتة (بالجنيه)
        <input v-model.number="settings.shipping.fee" type="number" step="500" min="0" />
        <small class="hint-text">تظهر كـ {{ (settings.shipping.fee / 100).toLocaleString('ar-EG') }} ج.م للعميل</small>
      </label>
      <label>
        حد الشحن المجاني (بالجنيه)
        <input v-model.number="settings.shipping.free_threshold" type="number" step="10000" min="0" />
        <small class="hint-text">شحن مجاني للطلبات فوق {{ (settings.shipping.free_threshold / 100).toLocaleString('ar-EG') }} ج.م</small>
      </label>
      <label>
        مدة التوصيل التقديرية
        <input v-model="settings.shipping.estimated_days" type="text" />
      </label>
      <label class="toggle-checkbox-row">
        <input v-model="settings.shipping.express_available" type="checkbox" />
        <span>تفعيل خدمة الشحن السريع للمحافظات الرئيسية</span>
      </label>
    </div>

    <!-- Payment Methods Card -->
    <div class="settings-card">
      <h3>💳 بوابات وطرق الدفع</h3>
      <p class="hint-text">حدد الطرق التي يمكن للعملاء اختيارها في صفحة إتمام الطلب (Checkout):</p>
      <label class="toggle-checkbox-row">
        <input v-model="settings.payment_methods.cash_on_delivery" type="checkbox" />
        <div>
          <strong>الدفع عند الاستلام (Cash on Delivery)</strong>
          <small class="d-block text-muted">السماح بالدفع نقداً لمندوب الشحن</small>
        </div>
      </label>
      <label class="toggle-checkbox-row">
        <input v-model="settings.payment_methods.card" type="checkbox" />
        <div>
          <strong>البطاقات الائتمانية (Visa / MasterCard)</strong>
          <small class="d-block text-muted">الدفع الفوري أونلاين</small>
        </div>
      </label>
      <label class="toggle-checkbox-row">
        <input v-model="settings.payment_methods.instapay" type="checkbox" />
        <div>
          <strong>إنستاباي (InstaPay)</strong>
          <small class="d-block text-muted">التحويل اللحظي عبر الشبكة القومية</small>
        </div>
      </label>
      <label class="toggle-checkbox-row">
        <input v-model="settings.payment_methods.vodafone_cash" type="checkbox" />
        <div>
          <strong>محافظ إلكترونية (فودافون كاش / إتصالات كاش)</strong>
          <small class="d-block text-muted">التحويل عبر المحافظ الذكية</small>
        </div>
      </label>
    </div>

    <!-- Discounts Card -->
    <div class="settings-card col-span-2">
      <h3>🏷️ كوبونات وعروض الخصم النشطة</h3>
      <div class="discounts-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>كود الكوبون</th>
              <th>نسبة الخصم</th>
              <th>الحد الأدنى للطلب</th>
              <th>الحالة</th>
              <th>حذف</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(disc, idx) in settings.discounts" :key="idx">
              <td><b class="coupon-tag">{{ disc.code }}</b></td>
              <td>{{ disc.percent }}%</td>
              <td>{{ (disc.min_spend / 100).toLocaleString('ar-EG') }} ج.م</td>
              <td>
                <input v-model="disc.active" type="checkbox" />
                <span>{{ disc.active ? 'نشط' : 'معطل' }}</span>
              </td>
              <td>
                <button type="button" class="btn-action delete" @click="removeDiscount(idx)">حذف</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Add Coupon Sub-form -->
      <div class="add-coupon-row">
        <input v-model="newDiscount.code" placeholder="كود جديد (مثال: SPORT15)" dir="ltr" />
        <input v-model.number="newDiscount.percent" type="number" placeholder="النسبة %" min="1" max="90" />
        <input v-model.number="newDiscount.min_spend" type="number" placeholder="الحد الأدنى (قروش)" min="0" step="5000" />
        <button type="button" class="btn-secondary" @click="addDiscount">＋ أضف الكوبون</button>
      </div>
    </div>

    <!-- WhatsApp Automation Card -->
    <div class="settings-card col-span-2">
      <div class="settings-card-head">
        <div class="head-icon-title">
          <span class="icon-bubble">💬</span>
          <div>
            <h3>إشعارات وتأكيدات واتساب التلقائية (WhatsApp Automation)</h3>
            <p class="hint-text">إرسال إشعار فوري للعميل عبر واتساب عند تسجيل أي طلب جديد في المتجر لتأكيده مباشرة.</p>
          </div>
        </div>
        <span class="badge-active" v-if="settings.whatsapp.enabled">مفعل تلقائياً ✅</span>
      </div>

      <div class="settings-grid-sub">
        <label class="toggle-checkbox-row">
          <input v-model="settings.whatsapp.enabled" type="checkbox" />
          <div>
            <strong>تفعيل إرسال إشعار التأكيد التلقائي عبر واتساب فور إنشاء أي طلب</strong>
            <small class="d-block text-muted">إرسال رسالة براندينج رسمية تتضمن رقم الطلب، المنتجات، الإجمالي، وعنوان الشحن تلقائياً للعميل.</small>
          </div>
        </label>

        <div class="form-row-2col">
          <label>
            رقم واتساب خدمة العملاء للمتجر
            <input v-model="settings.whatsapp.support_phone" type="tel" placeholder="01000000000 أو 201000000000" dir="ltr" maxlength="20" />
            <small class="hint-text">الرقم الذي يستقبل استفسارات وتأكيدات العملاء</small>
          </label>

          <label>
            نص الرسالة عند فتح واتساب
            <input v-model="settings.whatsapp.welcome_message" type="text" maxlength="300" dir="ltr" />
            <small class="hint-text">هذه هي الرسالة التي تكتب تلقائياً عند الضغط على أيقونة واتساب العائمة.</small>
          </label>

          <label>
            طريقة الإرسال والتكامل
            <select v-model="settings.whatsapp.provider">
              <option value="direct_link">محادثة ورابط مباشر فوري (Direct WhatsApp Link & Webhook)</option>
              
              
              
            </select>
            <small class="hint-text">اختر طريقة الربط البرمجي لإرسال الرسائل</small>
          </label>
        </div>

        <div v-if="settings.whatsapp.provider !== 'direct_link'" class="form-row-2col">
          <label>
            Webhook / API Endpoint URL
            <input v-model="settings.whatsapp.webhook_url" type="url" placeholder="https://api.ultramsg.com/instance/messages/chat" dir="ltr" />
          </label>

          <label>
            API Token / Instance Key
            <input v-model="settings.whatsapp.api_token" type="password" placeholder="••••••••••••••••" dir="ltr" />
          </label>
        </div>
      </div>
    </div>
  </div>
</template>
</template>
