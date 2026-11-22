<script setup lang="ts">
import { useLocaleStore } from '../stores/locale'
const locale = useLocaleStore()

// Terms and Conditions View
</script>

<template>
  <section class="app-page terms-page" :dir="locale.isRTL ? 'rtl' : 'ltr'">
    <!-- Breadcrumb -->
    <div class="breadcrumb-nav">
      <router-link class="back-link" to="/">← العودة للرئيسية</router-link>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">الشروط والأحكام</span>
    </div>

    <!-- Hero Header -->
    <header class="terms-hero">
      <div class="hero-badge">
        <span class="badge-icon">⚖️</span>
        <span>اتفاقية الاستخدام والخدمة</span>
      </div>
      <h1 class="hero-title">الشروط والأحكام العامة</h1>
      <p class="hero-subtitle">
        مرحباً بك في <strong>Studio Active / EcoMars</strong>. يرجى قراءة هذه الشروط والأحكام بعناية قبل استخدام موقعنا أو شراء منتجاتنا الرياضية. استخدامك للموقع يمثل موافقتك الكاملة عليها.
      </p>

      <div class="hero-highlights">
        <div class="highlight-item">
          <span class="highlight-icon">📜</span>
          <div>
            <strong>شفافية تامة</strong>
            <span>حقوقك وواجباتك موضحة بكل وضوح</span>
          </div>
        </div>
        <div class="highlight-divider"></div>
        <div class="highlight-item">
          <span class="highlight-icon">🛡️</span>
          <div>
            <strong>متوافق مع القانون المصري</strong>
            <span>وفقاً لقانون حماية المستهلك رقم ١٨١ لسنة ٢٠١٨</span>
          </div>
        </div>
        <div class="highlight-divider"></div>
        <div class="highlight-item">
          <span class="highlight-icon">🔒</span>
          <div>
            <strong>حماية المعاملات</strong>
            <span>دفع آمن وبيانات مشفرة بنسبة ١٠٠٪</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Content Sections -->
    <main class="terms-content">
      <!-- Section 1 -->
      <article class="terms-card">
        <div class="card-num">١</div>
        <div class="card-body">
          <h2>أهلية الاستخدام وإنشاء الحساب</h2>
          <p>
            باستخدامك لموقع Studio Active، فإنك تقر بأنك تبلغ من العمر ١٨ عاماً على الأقل أو تتصفح تحت إشراف ولي الأمر. يلتزم المستخدم بتقديم بيانات صحيحة ودقيقة عند إنشاء الحساب (الاسم، البريد الإلكتروني، ورقم الهاتف المحمول). أنت مسؤول بالكامل عن الحفاظ على سرية بيانات حسابك وكلمة المرور الخاصة بك.
          </p>
        </div>
      </article>

      <!-- Section 2 -->
      <article class="terms-card">
        <div class="card-num">٢</div>
        <div class="card-body">
          <h2>الطلبات والتسعير وتوافر المخزون</h2>
          <p>
            جميع الأسعار المعروضة على المتجر بالجنيه المصري (EGP) وتشمل كافة الضرائب المطبقة. نحتفظ بالحق في تعديل الأسعار أو تصحيح أي أخطاء مطبعية غير مقصودة في أي وقت. يتم تأكيد الطلب بعد مراجعة بيانات الشحن والتأكد من توافر المقاس واللون في المخزون. في حال نفاد أي منتج مطلوب، يتم التواصل فوراً مع العميل لتوفير بديل أو إلغاء الطلب دون أي رسوم.
          </p>
        </div>
      </article>

      <!-- Section 3 -->
      <article class="terms-card">
        <div class="card-num">٣</div>
        <div class="card-body">
          <h2>طرق الدفع والشحن والمعاينة</h2>
          <p>
            نوفر خيارات دفع متعددة تشمل الدفع نقداً عند الاستلام (COD)، البطاقات البنكية (Visa / Mastercard / Meeza)، وتطبيقات الدفع اللحظي مثل InstaPay ومحافظ الهواتف الذكية. يحق للعميل معاينة المنتجات والتأكد من سلامتها ومطابقة المقاس قبل استلام الشحنة من مندوب التوصيل.
          </p>
        </div>
      </article>

      <!-- Section 4 -->
      <article class="terms-card">
        <div class="card-num">٤</div>
        <div class="card-body">
          <h2>سياسة الإرجاع والاستبدال</h2>
          <p>
            يحق لك استرجاع أو استبدال أي قطعة خلال ١٤ يوماً من تاريخ الاستلام، شريطة أن تكون بحالتها الأصلية غير مستخدمة ومرفق بها التكت (Hangtag) والغلاف الأصلي. للمزيد من التفاصيل يرجى مراجعة
            <router-link to="/returns"><strong>صفحة سياسة الإرجاع والاستبدال</strong></router-link>.
          </p>
        </div>
      </article>

      <!-- Section 5 -->
      <article class="terms-card">
        <div class="card-num">٥</div>
        <div class="card-body">
          <h2>حقوق الملكية الفكرية والعلامة التجارية</h2>
          <p>
            كافة المحتويات المنشورة على هذا الموقع، بما في ذلك التصاميم، الصور الرياضية، الشعارات، النصوص، البرمجيات، والأيقونات، هي ملكية حصرية لـ Studio Active / EcoMars، ومحمية بموجب قوانين الملكية الفكرية المعمول بها محلياً ودولياً. يحظر تماماً نسخ أو إعادة إنتاج أي جزء دون إذن كتابي مسبق.
          </p>
        </div>
      </article>

      <!-- Section 6 -->
      <article class="terms-card">
        <div class="card-num">٦</div>
        <div class="card-body">
          <h2>القانون الساري والاختصاص القضائي</h2>
          <p>
            تخضع هذه الشروط والأحكام وتفسر وفقاً لقوانين جمهورية مصر العربية، وتختص المحاكم المصرية بالفصل في أي نزاع قد ينشأ عن استخدام هذا الموقع أو المعاملات التجارية المرتبطة به.
          </p>
        </div>
      </article>
    </main>

    <!-- Support Callout Box -->
    <div class="support-callout">
      <div class="support-icon">💬</div>
      <div class="support-text">
        <h3>لديك أي استفسار حول الشروط والأحكام؟</h3>
        <p>فريق خدمة عملاء Studio Active متاح يومياً من ٩ صباحاً حتى ١٠ مساءً لمساعدتك.</p>
      </div>
      <router-link to="/faq" class="primary support-btn">
        تواصل معنا / الأسئلة الشائعة ←
      </router-link>
    </div>
  </section>
</template>

<style scoped>
.terms-page {
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

.terms-hero {
  text-align: center;
  padding: 3rem 1.5rem;
  background: #111210;
  color: #fff;
  border-radius: 12px;
  margin-bottom: 3rem;
  position: relative;
  overflow: hidden;
}

.terms-hero::before {
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

.terms-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.terms-card {
  display: flex;
  gap: 1.5rem;
  background: #fff;
  border: 1px solid #e2e4dc;
  border-radius: 8px;
  padding: 2rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.terms-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
}

.card-num {
  font-family: Arial, sans-serif;
  font-size: 1.5rem;
  font-weight: 900;
  color: #111;
  background: var(--lime, #d5fb52);
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
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
  margin: 0;
  color: #555;
  line-height: 1.8;
  font-size: 0.95rem;
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
  .terms-card {
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;
  }
}
</style>
