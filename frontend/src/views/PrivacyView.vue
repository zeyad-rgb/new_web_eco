<script setup lang="ts">
import { useLocaleStore } from '../stores/locale'
const locale = useLocaleStore()

// Privacy Policy View
</script>

<template>
  <section class="app-page privacy-page" :dir="locale.isRTL ? 'rtl' : 'ltr'">
    <!-- Breadcrumb -->
    <div class="breadcrumb-nav">
      <router-link class="back-link" to="/">← العودة للرئيسية</router-link>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">سياسة الخصوصية</span>
    </div>

    <!-- Hero Header -->
    <header class="privacy-hero">
      <div class="hero-badge">
        <span class="badge-icon">🛡️</span>
        <span>أمان وخصوصية بياناتك أولويتنا</span>
      </div>
      <h1 class="hero-title">سياسة الخصوصية وسرية المعلومات</h1>
      <p class="hero-subtitle">
        نلتزم في <strong>Studio Active / EcoMars</strong> بأعلى معايير حماية بيانات عملائنا. نوضح هنا كيفية جمع، استخدام، وحماية بياناتك الشخصية بكل شفافية وأمان.
      </p>

      <div class="hero-highlights">
        <div class="highlight-item">
          <span class="highlight-icon">🔒</span>
          <div>
            <strong>تشفير متقدم</strong>
            <span>حماية البيانات بتشفير 256-bit عالي الأمان</span>
          </div>
        </div>
        <div class="highlight-divider"></div>
        <div class="highlight-item">
          <span class="highlight-icon">🚫</span>
          <div>
            <strong>لا بيع للبيانات</strong>
            <span>لا نشارك بياناتك مع أي طرف ثالث لأغراض دعائية</span>
          </div>
        </div>
        <div class="highlight-divider"></div>
        <div class="highlight-item">
          <span class="highlight-icon">👤</span>
          <div>
            <strong>تحكم كامل</strong>
            <span>حق التعديل أو الحذف لبياناتك في أي وقت</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Content Sections -->
    <main class="privacy-content">
      <!-- Section 1 -->
      <article class="privacy-card">
        <div class="card-icon">📋</div>
        <div class="card-body">
          <h2>المعلومات التي نقوم بجمعها</h2>
          <p>
            عند تسجيلك في الموقع أو إتمام طلب شراء، نجمع المعلومات الضرورية لتقديم الخدمة:
          </p>
          <ul>
            <li><strong>البيانات الشخصية:</strong> الاسم بالكامل، رقم الهاتف المحمول، وعنوان البريد الإلكتروني.</li>
            <li><strong>بيانات التوصيل:</strong> المحافظة، المدينة، اسم الشارع، رقم العقار، وأي علامات مميزة لتسهيل وصول المندوب.</li>
            <li><strong>سجل الطلبات:</strong> المنتجات والمقاسات المفضلة، وسجل المعاملات السابقة لتحسين التوصيات وتجميع نقاط المكافآت.</li>
          </ul>
        </div>
      </article>

      <!-- Section 2 -->
      <article class="privacy-card">
        <div class="card-icon">💳</div>
        <div class="card-body">
          <h2>أمان وسرية بيانات الدفع</h2>
          <p>
            <strong>نحن لا نقوم بتخزين أي بيانات حساسة للبطاقات الائتمانية</strong> على خوادمنا. تتم كافة عمليات الدفع الإلكتروني عبر بوابات دفع بنكية معتمدة ومرخصة من البنك المركزي المصري (مثل Fawry / Paymob) باستخدام أعلى بروتوكولات الأمان (PCI-DSS compliant).
          </p>
        </div>
      </article>

      <!-- Section 3 -->
      <article class="privacy-card">
        <div class="card-icon">🚚</div>
        <div class="card-body">
          <h2>مشاركة البيانات مع شركاء الشحن</h2>
          <p>
            تقتصر مشاركة بياناتك (الاسم، رقم الهاتف، وعنوان التسليم فقط) مع شركات الشحن والتوصيل الرسمية المعتمدة لدينا لغرض تسليم الشحنة والتواصل معك لتحديد موعد التسليم. ويلتزم شركاء الشحن بعدم استخدام بياناتك لأي غرض آخر.
          </p>
        </div>
      </article>

      <!-- Section 4 -->
      <article class="privacy-card">
        <div class="card-icon">🍪</div>
        <div class="card-body">
          <h2>ملفات تعريف الارتباط (Cookies) وتجربة التصفح</h2>
          <p>
            نستخدم ملفات تعريف الارتباط وتقنيات التخزين المحلي (Local Storage) لحفظ حالة سلة التسوق الخاصة بك، تفضيل الوضع الليلي/النهاري، وتسجيل الدخول التلقائي، وتذكر المنتجات في قائمة المفضلة لديك لتقديم تجربة تسوق سلسة وسريعة.
          </p>
        </div>
      </article>

      <!-- Section 5 -->
      <article class="privacy-card">
        <div class="card-icon">⚙️</div>
        <div class="card-body">
          <h2>حقوقك وخياراتك في إدارة بياناتك</h2>
          <p>
            يحق لك في أي وقت الدخول إلى <router-link to="/profile">صفحة حسابك</router-link> لتعديل بياناتك، أو طلب حذف حسابك نهائياً من قاعدة بياناتنا عبر التواصل مع خدمة العملاء. كما يمكنك إلغاء الاشتراك في الرسائل الترويجية بضغطة زر واحدة.
          </p>
        </div>
      </article>
    </main>

    <!-- Support Callout Box -->
    <div class="support-callout">
      <div class="support-icon">📧</div>
      <div class="support-text">
        <h3>هل لديك استفسار يخص خصوصية بياناتك؟</h3>
        <p>تواصل مع مسؤول حماية البيانات عبر البريد الإلكتروني: <strong>privacy@ecomars-active.com</strong></p>
      </div>
      <router-link to="/faq" class="primary support-btn">
        مركز المساعدة ←
      </router-link>
    </div>
  </section>
</template>

<style scoped>
.privacy-page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 2.5rem clamp(1rem, 5vw, 4rem);
}

.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.88rem;
  margin-bottom: 2rem;
}

.back-link {
  color: #555;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.15s ease;
}

.back-link:hover {
  color: #111;
}

.breadcrumb-separator {
  color: #aaa;
}

.breadcrumb-current {
  color: #111;
  font-weight: 600;
}

.privacy-hero {
  text-align: center;
  padding: 3rem 1.5rem;
  background: #111210;
  color: #fff;
  border-radius: 12px;
  margin-bottom: 3rem;
  position: relative;
  overflow: hidden;
}

.privacy-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 0%, rgba(213, 251, 82, 0.15) 0%, transparent 70%);
  pointer-events: none;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--lime, #d5fb52);
  margin-bottom: 1.25rem;
}

.hero-title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 900;
  margin: 0 0 1rem;
  letter-spacing: -0.03em;
}

.hero-subtitle {
  color: #b5b8ad;
  max-width: 680px;
  margin: 0 auto 2.5rem;
  font-size: 1rem;
  line-height: 1.7;
}

.hero-subtitle strong {
  color: #fff;
}

.hero-highlights {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.25rem 2rem;
  border-radius: 8px;
  flex-wrap: wrap;
}

.highlight-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-align: start;
}

.highlight-icon {
  font-size: 1.5rem;
}

.highlight-item strong {
  display: block;
  font-size: 0.95rem;
  color: #fff;
}

.highlight-item span {
  font-size: 0.82rem;
  color: #999;
}

.highlight-divider {
  width: 1px;
  height: 36px;
  background: rgba(255, 255, 255, 0.15);
}

.privacy-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.privacy-card {
  display: flex;
  gap: 1.5rem;
  background: #fff;
  border: 1px solid #e2e4dc;
  border-radius: 8px;
  padding: 2rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.privacy-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
}

.card-icon {
  font-size: 2rem;
  background: #f0f2ea;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 8px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.card-body h2 {
  margin: 0 0 0.75rem;
  font-size: 1.25rem;
  font-weight: 800;
  color: #111;
}

.card-body p {
  margin: 0 0 0.75rem;
  color: #555;
  line-height: 1.8;
  font-size: 0.95rem;
}

.card-body ul {
  margin: 0;
  padding-inline-start: 1.25rem;
  color: #555;
  line-height: 1.8;
  font-size: 0.92rem;
}

.card-body li {
  margin-bottom: 0.4rem;
}

.card-body a {
  color: #111;
  text-decoration: underline;
}

.support-callout {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  background: #f4f6ee;
  border: 1px solid #dce0d0;
  padding: 2rem;
  border-radius: 8px;
  flex-wrap: wrap;
}

.support-icon {
  font-size: 2.2rem;
}

.support-text {
  flex: 1;
}

.support-text h3 {
  margin: 0 0 0.35rem;
  font-size: 1.2rem;
}

.support-text p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.support-btn {
  padding: 0.85rem 1.75rem;
  font-weight: 700;
  border-radius: 4px;
  text-decoration: none;
}

@media (max-width: 768px) {
  .highlight-divider {
    display: none;
  }
  .privacy-card {
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;
  }
}
</style>
