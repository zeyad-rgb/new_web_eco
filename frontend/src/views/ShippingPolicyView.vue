<script setup lang="ts">
import { useLocaleStore } from '../stores/locale'
const locale = useLocaleStore()

// Shipping and delivery policy view
</script>

<template>
  <section class="app-page shipping-page" :dir="locale.isRTL ? 'rtl' : 'ltr'">
    <!-- Breadcrumb -->
    <div class="breadcrumb-nav">
      <router-link class="back-link" to="/">← العودة للرئيسية</router-link>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">سياسة الشحن والتوصيل</span>
    </div>

    <!-- 1. Hero Header -->
    <header class="shipping-hero">
      <div class="hero-badge">
        <span class="badge-icon">🚚</span>
        <span>توصيل سريع وآمن لجميع أنحاء مصر</span>
      </div>
      <h1 class="hero-title">الشحن ومناطق التوصيل</h1>
      <p class="hero-subtitle">
        نسعى في <strong>EcoMars</strong> لتقديم أسرع خدمة شحن لملابسك الرياضية مع تغليف احترافي مستدام،
        إمكانية التتبع اللحظي، وحق المعاينة الكاملة عند الاستلام لضمان تجربة تسوق استثنائية.
      </p>

      <!-- Quick Highlights Bar -->
      <div class="hero-highlights">
        <div class="highlight-item">
          <span class="highlight-icon">⚡</span>
          <div>
            <strong>توصيل سريع</strong>
            <span>خلال ٢ - ٤ أيام عمل لمعظم المحافظات</span>
          </div>
        </div>
        <div class="highlight-divider"></div>
        <div class="highlight-item">
          <span class="highlight-icon">🎁</span>
          <div>
            <strong>شحن مجاني</strong>
            <span>لكافة الطلبات بقيمة ١٬٠٠٠ ج.م أو أكثر</span>
          </div>
        </div>
        <div class="highlight-divider"></div>
        <div class="highlight-item">
          <span class="highlight-icon">🛡️</span>
          <div>
            <strong>معاينة قبل الدفع</strong>
            <span>افحص وتأكد من المقاس والجودة براحة تامة</span>
          </div>
        </div>
      </div>
    </header>

    <!-- 2. Styled Info Cards: Shipping Options & Rates -->
    <section class="section-container">
      <div class="section-header">
        <div class="header-tag">باقات الشحن</div>
        <h2>خيارات وتكاليف التوصيل</h2>
        <p>نقدم خيارات شحن متعددة تناسب احتياجاتك وجدولك الزمني بأفضل الأسعار</p>
      </div>

      <div class="rates-grid">
        <!-- Card 1: Free Shipping (Featured) -->
        <div class="rate-card featured-card">
          <div class="card-ribbon">الأكثر توفيراً ⭐</div>
          <div class="card-top">
            <span class="card-emoji">🎁</span>
            <div class="card-headings">
              <h3>الشحن المجاني</h3>
              <p class="card-sub">لكل طلباتك المؤهلة</p>
            </div>
          </div>
          <div class="card-price">
            <span class="price-val">مجاناً</span>
            <span class="price-unit">بدون أي رسوم إضافية</span>
          </div>
          <p class="card-condition">
            متاح تلقائياً للطلبات التي تبلغ قيمتها <strong>١٬٠٠٠ جنيه مصري</strong> أو أكثر.
          </p>
          <ul class="card-features">
            <li>✓ يطبق تلقائياً في السلة بدون الحاجة لكوبون</li>
            <li>✓ يشمل كافة محافظات ومدن جمهورية مصر العربية</li>
            <li>✓ يتضمن إمكانية فحص ومعاينة المنتجات عند الاستلام</li>
          </ul>
        </div>

        <!-- Card 2: Standard Shipping -->
        <div class="rate-card">
          <div class="card-top">
            <span class="card-emoji">📦</span>
            <div class="card-headings">
              <h3>الشحن القياسي</h3>
              <p class="card-sub">تغطية آمنة وشاملة</p>
            </div>
          </div>
          <div class="card-price">
            <span class="price-val">٨٥ <small>ج.م</small></span>
            <span class="price-unit">تكلفة موحدة ثابتة</span>
          </div>
          <p class="card-condition">
            يطبق على الطلبات الأقل من <strong>١٬٠٠٠ جنيه مصري</strong>.
          </p>
          <ul class="card-features">
            <li>✓ تسليم مباشر حتى باب المنزل عبر أفضل شركات الشحن</li>
            <li>✓ إرسال رقم بوليصة التتبع عبر الرسائل النصية</li>
            <li>✓ متاح لجميع محافظات الوجه البحري، الدلتا، والصعيد</li>
          </ul>
        </div>

        <!-- Card 3: Express Shipping -->
        <div class="rate-card express-card">
          <div class="card-badge-inline">خلال ٢٤ - ٤٨ ساعة ⚡</div>
          <div class="card-top">
            <span class="card-emoji">🚀</span>
            <div class="card-headings">
              <h3>الشحن السريع إكسبريس</h3>
              <p class="card-sub">للأوقات الحرجة والمستعجلة</p>
            </div>
          </div>
          <div class="card-price">
            <span class="price-val">١٥٠ <small>ج.م</small></span>
            <span class="price-unit">أولوية تجهيز فورية</span>
          </div>
          <p class="card-condition">
            متاح لجميع الطلبات في نطاق <strong>القاهرة، الجيزة، والإسكندرية</strong>.
          </p>
          <ul class="card-features">
            <li>✓ تسليم استثنائي سريع خلال يوم إلى يومي عمل فقط</li>
            <li>✓ أولوية قصوى في تجهيز وتعبئة طلبك بالمستودع</li>
            <li>✓ تنسيق هاتفي فوري من المندوب لتسليم الشحنة</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- 2 (cont). Delivery Coverage & Timelines by Region -->
    <section class="section-container">
      <div class="section-header">
        <div class="header-tag">نطاق التغطية</div>
        <h2>مواعيد التسليم المقدرة حسب المحافظة</h2>
        <p>نعمل مع شبكة لوجستية معتمدة تغطي أكثر من ٢٧ محافظة مصرية بكل دقة</p>
      </div>

      <div class="zones-grid">
        <!-- Zone 1 -->
        <div class="zone-card">
          <div class="zone-header">
            <span class="zone-icon">🏙️</span>
            <div>
              <h3>القاهرة، الجيزة، والإسكندرية</h3>
              <span class="zone-pill">المدن الكبرى</span>
            </div>
          </div>
          <div class="zone-time">
            <span class="time-label">مدة التسليم المتوقعة:</span>
            <span class="time-highlight">من ٢ إلى ٣ أيام عمل</span>
          </div>
          <p class="zone-desc">
            توصيل يومي متواصل يشمل جميع أحياء ومناطق القاهرة الكبرى (المعادي، التجمع، مدينة نصر، الشيخ زايد، ٦ أكتوبر) ومحافظة الإسكندرية.
          </p>
          <div class="zone-features">
            <span>✓ إمكانية الشحن السريع</span>
            <span>✓ خيارات دفع مرنة عند الاستلام</span>
          </div>
        </div>

        <!-- Zone 2 -->
        <div class="zone-card">
          <div class="zone-header">
            <span class="zone-icon">🌾</span>
            <div>
              <h3>محافظات الوجه البحري والقناة</h3>
              <span class="zone-pill">الدلتا والقناة</span>
            </div>
          </div>
          <div class="zone-time">
            <span class="time-label">مدة التسليم المتوقعة:</span>
            <span class="time-highlight">من ٣ إلى ٤ أيام عمل</span>
          </div>
          <p class="zone-desc">
            يشمل: المنصورة، طنطا، الزقازيق، المحلة، بنها، دمنهور، كفر الشيخ، بورسعيد، السويس، الإسماعيلية، ودمياط وكافة المراكز التابعة.
          </p>
          <div class="zone-features">
            <span>✓ تتبع دوري عبر الـ SMS</span>
            <span>✓ مندوب تسليم محلي معتمد</span>
          </div>
        </div>

        <!-- Zone 3 -->
        <div class="zone-card">
          <div class="zone-header">
            <span class="zone-icon">☀️</span>
            <div>
              <h3>الصعيد والبحر الأحمر ومطروح</h3>
              <span class="zone-pill">المناطق البعيدة</span>
            </div>
          </div>
          <div class="zone-time">
            <span class="time-label">مدة التسليم المتوقعة:</span>
            <span class="time-highlight">من ٤ إلى ٦ أيام عمل</span>
          </div>
          <p class="zone-desc">
            يشمل: الفيوم، بني سويف، المنيا، أسيوط، سوهاج، قنا، الأقصر، أسوان، الغردقة، شرم الشيخ، مرسى مطروح، والواحات.
          </p>
          <div class="zone-features">
            <span>✓ تغليف عالي المتانة ومقاوم للعوامل الجوية</span>
            <span>✓ تأكيد موعد التسليم هاتفياً مسبقاً</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. Step-by-Step Visual Guide -->
    <section class="section-container">
      <div class="section-header">
        <div class="header-tag">كيف نعمل؟</div>
        <h2>رحلة طلبك خطوة بخطوة</h2>
        <p>تجربة شراء شفافة وسلسة من لحظة النقر على زر الطلب وحتى ارتدائك لملابسك الرياضية</p>
      </div>

      <div class="timeline-steps">
        <!-- Step 1 -->
        <div class="timeline-step">
          <div class="step-badge-wrap">
            <div class="step-number">01</div>
            <div class="step-icon-circle">🛒</div>
          </div>
          <div class="step-content">
            <h3>تأكيد الطلب والتجهيز</h3>
            <p>
              يستقبل نظامنا طلبك فوراً، ويقوم فريق المخازن بفحص جودة خامات القطع والمقاسات والتأكد من مطابقتها التامة قبل تغليفها بعناية.
            </p>
            <span class="step-tag">معالجة فورية</span>
          </div>
        </div>

        <!-- Step 2 -->
        <div class="timeline-step">
          <div class="step-badge-wrap">
            <div class="step-number">02</div>
            <div class="step-icon-circle">🏷️</div>
          </div>
          <div class="step-content">
            <h3>إصدار بوليصة الشحن</h3>
            <p>
              يتم إنشاء رمز تتبع فريد للشحنة وتسليم الطرد إلى إحدى شركات الشحن اللوجستية المعتمدة لنقله إلى مركز التوزيع الإقليمي.
            </p>
            <span class="step-tag">بوليصة رسمية</span>
          </div>
        </div>

        <!-- Step 3 -->
        <div class="timeline-step">
          <div class="step-badge-wrap">
            <div class="step-number">03</div>
            <div class="step-icon-circle">📲</div>
          </div>
          <div class="step-content">
            <h3>إشعار التتبع وتنسيق الموعد</h3>
            <p>
              تصلك رسالة نصية (SMS) أو عبر الواتساب برقم التتبع، ثم يتصل بك مندوب الشحن لتأكيد الميعاد المناسب لك وعنوان الاستلام.
            </p>
            <span class="step-tag">تواصل مسبق</span>
          </div>
        </div>

        <!-- Step 4 -->
        <div class="timeline-step">
          <div class="step-badge-wrap">
            <div class="step-number">04</div>
            <div class="step-icon-circle">✨</div>
          </div>
          <div class="step-content">
            <h3>المعاينة والاستلام والدفع</h3>
            <p>
              يحق لك فتح الطرد وفحص المقاسات والجودة بحضور المندوب، ثم الدفع بكل سهولة نقداً عند الاستلام أو عبر الطرق الإلكترونية.
            </p>
            <span class="step-tag">راحة وأمان ١٠٠٪</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. Callout Boxes for Important Notes -->
    <section class="section-container">
      <div class="section-header">
        <div class="header-tag">تنبيهات هامة</div>
        <h2>معلومات يجب معرفتها حول الشحن</h2>
        <p>نحرص على تزويدك بكافة الإرشادات لتجربة تسوق مريحة خالية من أي مفاجآت</p>
      </div>

      <div class="callouts-container">
        <!-- Callout 1: Inspection rights (Success / Green highlight) -->
        <div class="callout-box callout-success">
          <div class="callout-icon">💡</div>
          <div class="callout-body">
            <h4>حق المعاينة الكامل قبل الاستلام والدفع</h4>
            <p>
              ثقتك أولويتنا في <strong>EcoMars</strong>. نتيح لك فحص خامة المنتج والتأكد من المقاس أمام مندوب الشحن قبل سداد قيمة الطلب.
              إذا لم ينل المنتج إعجابك، يمكنك إرجاعه مباشرة مع المندوب مع سداد قيمة مصاريف الشحن فقط.
            </p>
          </div>
        </div>

        <!-- Callout 2: Business Days (Info / Blue highlight) -->
        <div class="callout-box callout-info">
          <div class="callout-icon">⏱️</div>
          <div class="callout-body">
            <h4>مواعيد العمل الرسمية وحساب أيام التوصيل</h4>
            <p>
              أيام العمل الرسمية لعمليات التجهيز والشحن هي من <strong>السبت إلى الخميس</strong> (باستثناء أيام الجمعة والعطلات الرسمية).
              الطلبات المسجلة بعد الساعة <strong>٥:٠٠ مساءً</strong> يبدأ احتساب فترة شحنها بدءاً من صباح يوم العمل التالي.
            </p>
          </div>
        </div>

        <!-- Callout 3: Phone & Address Accuracy (Warning / Amber highlight) -->
        <div class="callout-box callout-warning">
          <div class="callout-icon">📍</div>
          <div class="callout-body">
            <h4>دقة العنوان ورقم الهاتف وسرعة الرد</h4>
            <p>
              لتفادي أي تأخير في استلام طلبك، نرجو التأكد من تسجيل عنوان تفصيلي واضح (اسم الشارع، رقم العمارة، الشقة أو علامة مميزة)
              ورقم هاتف فعال ومتاح للتواصل عبر الواتساب والمكالمات الهاتفية ليتمكن المندوب من الوصول إليك في الموعد المحدد.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 6. Call To Action (CTA at Bottom) -->
    <section class="shipping-cta">
      <div class="cta-inner">
        <div class="cta-icon-badge">🏃‍♂️</div>
        <h2 class="cta-title">جاهز لتجديد ملابسك الرياضية؟</h2>
        <p class="cta-text">
          استكشف تشكيلة أزياء التمارين والستريت وير الأكثر طلباً من EcoMars، واستمتع بشحن مجاني على كافة الطلبات بقيمة ١٬٠٠٠ ج.م أو أكثر.
        </p>

        <div class="cta-buttons">
          <router-link to="/shop" class="cta-btn cta-btn-primary">
            تصفح التشكيلة الآن ←
          </router-link>
          <router-link to="/faq" class="cta-btn cta-btn-secondary">
            الأسئلة الشائعة ❓
          </router-link>
          <router-link to="/returns" class="cta-btn cta-btn-outline">
            سياسة الإرجاع والاستبدال ↩️
          </router-link>
        </div>

        <div class="cta-footer-note">
          <span>💬 هل لديك استفسار بخصوص شحنة جارية؟</span>
          <router-link to="/faq" class="support-link">تواصل مع فريق خدمة العملاء</router-link>
        </div>
      </div>
    </section>
  </section>
</template>

<style scoped>
/* Page Layout */
.shipping-page {
  max-width: 1040px;
  margin: 1.5rem auto 5rem;
  padding: 0 1.5rem;
  color: #1a1d17;
  font-family: "IBM Plex Sans Arabic", Tahoma, Arial, sans-serif;
  line-height: 1.7;
}

/* Breadcrumb Navigation */
.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.88rem;
  color: #666e61;
  margin-bottom: 1.5rem;
}

.back-link {
  color: #1a1d17;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: #5c691b;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.breadcrumb-separator {
  color: #b8bdaf;
}

.breadcrumb-current {
  color: #7b8375;
}

/* 1. Hero Header */
.shipping-hero {
  background: linear-gradient(135deg, #1b201a 0%, #242c22 100%);
  color: #fff;
  border-radius: 16px;
  padding: clamp(2rem, 5vw, 3.5rem);
  margin-bottom: 3rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

.shipping-hero::after {
  content: '';
  position: absolute;
  top: -40%;
  left: -20%;
  width: 450px;
  height: 450px;
  background: radial-gradient(circle, rgba(213, 251, 82, 0.12) 0%, transparent 70%);
  pointer-events: none;
  border-radius: 50%;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(213, 251, 82, 0.15);
  border: 1px solid rgba(213, 251, 82, 0.35);
  color: var(--lime, #d5fb52);
  padding: 0.4rem 0.95rem;
  border-radius: 999px;
  font-size: 0.86rem;
  font-weight: 700;
  margin-bottom: 1.25rem;
}

.badge-icon {
  font-size: 1.15rem;
}

.hero-title {
  font-size: clamp(2.2rem, 5vw, 3.4rem);
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1.15;
  margin: 0 0 1rem;
  color: #ffffff;
}

.hero-subtitle {
  font-size: clamp(1rem, 2vw, 1.15rem);
  line-height: 1.8;
  color: #d1d7cc;
  max-width: 780px;
  margin: 0 0 2rem;
}

.hero-subtitle strong {
  color: var(--lime, #d5fb52);
}

/* Hero Highlights Bar */
.hero-highlights {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  background: rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 1.1rem 1.5rem;
}

.highlight-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex: 1;
}

.highlight-icon {
  font-size: 1.6rem;
  background: rgba(255, 255, 255, 0.1);
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.highlight-item strong {
  display: block;
  font-size: 0.96rem;
  color: #fff;
  margin-bottom: 0.15rem;
}

.highlight-item span {
  display: block;
  font-size: 0.82rem;
  color: #bcc4b6;
  line-height: 1.4;
}

.highlight-divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.15);
  flex-shrink: 0;
}

/* Section Shared Headers */
.section-container {
  margin-bottom: 3.5rem;
}

.section-header {
  text-align: center;
  max-width: 680px;
  margin: 0 auto 2.2rem;
}

.header-tag {
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #5c691b;
  background: #edf5cf;
  padding: 0.25rem 0.8rem;
  border-radius: 999px;
  margin-bottom: 0.5rem;
}

.section-header h2 {
  font-size: clamp(1.6rem, 3.2vw, 2.2rem);
  font-weight: 800;
  color: #121511;
  margin: 0.3rem 0 0.6rem;
  letter-spacing: -0.02em;
}

.section-header p {
  color: #636b5d;
  font-size: 0.98rem;
  margin: 0;
}

/* 2. Styled Info Cards: Shipping Rates Grid */
.rates-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.4rem;
  align-items: stretch;
}

.rate-card {
  background: #ffffff;
  border: 1px solid #dfe3d7;
  border-radius: 14px;
  padding: 1.8rem 1.5rem;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.03);
}

.rate-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.07);
  border-color: #bcc3af;
}

/* Featured / Free Shipping Card */
.rate-card.featured-card {
  border: 2px solid #5c691b;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdf5 100%);
  box-shadow: 0 8px 24px rgba(92, 105, 27, 0.12);
}

.card-ribbon {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #1e251b;
  color: var(--lime, #d5fb52);
  padding: 0.25rem 1rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  white-space: nowrap;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
}

.card-badge-inline {
  display: inline-block;
  align-self: flex-start;
  background: #fdf5e6;
  border: 1px solid #fedfa8;
  color: #a45e00;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.65rem;
  border-radius: 6px;
  margin-bottom: 0.8rem;
}

.card-top {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  margin-bottom: 1.2rem;
}

.card-emoji {
  font-size: 2rem;
  width: 52px;
  height: 52px;
  background: #f4f6ef;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.featured-card .card-emoji {
  background: #eef7cb;
}

.card-headings h3 {
  font-size: 1.15rem;
  font-weight: 800;
  color: #141712;
  margin: 0;
}

.card-sub {
  font-size: 0.82rem;
  color: #6c7566;
  margin: 0.15rem 0 0;
}

.card-price {
  background: #fafaf7;
  border: 1px solid #ebeee4;
  border-radius: 10px;
  padding: 0.85rem 1rem;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 1.1rem;
}

.price-val {
  font-size: 1.65rem;
  font-weight: 900;
  color: #11140f;
  line-height: 1;
}

.price-val small {
  font-size: 0.85rem;
  font-weight: 700;
  color: #555d50;
  margin-inline-start: 0.2rem;
}

.price-unit {
  font-size: 0.78rem;
  color: #727a6c;
  font-weight: 600;
}

.card-condition {
  font-size: 0.88rem;
  color: #434a3e;
  margin: 0 0 1.2rem;
  line-height: 1.5;
}

.card-condition strong {
  color: #121511;
}

.card-features {
  list-style: none;
  padding: 0;
  margin: auto 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  border-top: 1px dashed #e2e5dc;
  padding-top: 1.1rem;
}

.card-features li {
  font-size: 0.85rem;
  color: #495244;
  line-height: 1.5;
}

/* Delivery Zones Grid */
.zones-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.4rem;
}

.zone-card {
  background: #ffffff;
  border: 1px solid #dfe3d7;
  border-radius: 14px;
  padding: 1.6rem;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.03);
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.zone-card:hover {
  transform: translateY(-3px);
  border-color: #bcc3af;
}

.zone-header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 1.1rem;
}

.zone-icon {
  font-size: 1.8rem;
  width: 48px;
  height: 48px;
  background: #f2f5ec;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.zone-header h3 {
  font-size: 1.05rem;
  font-weight: 800;
  color: #151812;
  margin: 0 0 0.2rem;
}

.zone-pill {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  background: #eef2e6;
  color: #515c48;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
}

.zone-time {
  background: #f7f9f2;
  border-right: 3px solid #5c691b;
  padding: 0.65rem 0.9rem;
  border-radius: 0 8px 8px 0;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.time-label {
  font-size: 0.76rem;
  color: #727a6c;
  font-weight: 600;
}

.time-highlight {
  font-size: 1.02rem;
  font-weight: 800;
  color: #20271b;
}

.zone-desc {
  font-size: 0.86rem;
  color: #4b5346;
  line-height: 1.6;
  margin: 0 0 1.2rem;
}

.zone-features {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  border-top: 1px solid #ecf0e5;
  padding-top: 0.9rem;
}

.zone-features span {
  font-size: 0.8rem;
  color: #55604e;
  font-weight: 600;
}

/* 3. Step-by-Step Visual Guide */
.timeline-steps {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1.2rem;
  position: relative;
}

.timeline-step {
  background: #ffffff;
  border: 1px solid #dfe3d7;
  border-radius: 14px;
  padding: 1.6rem 1.25rem;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.timeline-step:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
}

.step-badge-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.2rem;
}

.step-number {
  font-size: 0.85rem;
  font-weight: 900;
  color: #5c691b;
  background: #edf5cf;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 0.05em;
}

.step-icon-circle {
  font-size: 1.5rem;
  width: 44px;
  height: 44px;
  background: #f7f8f4;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-content h3 {
  font-size: 1.05rem;
  font-weight: 800;
  color: #171a13;
  margin: 0 0 0.6rem;
  line-height: 1.4;
}

.step-content p {
  font-size: 0.85rem;
  color: #50594b;
  line-height: 1.65;
  margin: 0 0 1.2rem;
}

.step-tag {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  background: #f0f3eb;
  color: #4b5444;
  padding: 0.2rem 0.65rem;
  border-radius: 6px;
  margin-top: auto;
}

/* 4. Callout Boxes for Important Notes */
.callouts-container {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.callout-box {
  display: flex;
  gap: 1.2rem;
  align-items: flex-start;
  padding: 1.35rem 1.6rem;
  border-radius: 12px;
  border: 1px solid;
  transition: transform 0.2s ease;
}

.callout-box:hover {
  transform: translateX(-3px);
}

.callout-icon {
  font-size: 1.8rem;
  line-height: 1;
  flex-shrink: 0;
  margin-top: 0.15rem;
}

.callout-body h4 {
  font-size: 1.05rem;
  font-weight: 800;
  margin: 0 0 0.4rem;
}

.callout-body p {
  font-size: 0.9rem;
  line-height: 1.7;
  margin: 0;
}

/* Callout Variant: Success (Inspection) */
.callout-success {
  background: #f9fcf3;
  border-color: #d1e6a8;
  color: #2b3917;
}

.callout-success h4 {
  color: #2b4510;
}

.callout-success p {
  color: #3b4e24;
}

/* Callout Variant: Info (Business hours) */
.callout-info {
  background: #f3f8fd;
  border-color: #cbe0f5;
  color: #143555;
}

.callout-info h4 {
  color: #123759;
}

.callout-info p {
  color: #234668;
}

/* Callout Variant: Warning (Address accuracy) */
.callout-warning {
  background: #fdfaf3;
  border-color: #f7e6c0;
  color: #553e12;
}

.callout-warning h4 {
  color: #5c430e;
}

.callout-warning p {
  color: #634b17;
}

/* 6. Call To Action (CTA at Bottom) */
.shipping-cta {
  background: #151814;
  color: #ffffff;
  border-radius: 16px;
  padding: clamp(2.5rem, 5vw, 3.8rem) clamp(1.5rem, 4vw, 3rem);
  text-align: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid #282f25;
}

.shipping-cta::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #a7cb30, var(--lime, #d5fb52), #a7cb30);
}

.cta-inner {
  max-width: 680px;
  margin: 0 auto;
}

.cta-icon-badge {
  font-size: 2.2rem;
  margin-bottom: 0.75rem;
}

.cta-title {
  font-size: clamp(1.8rem, 4vw, 2.4rem);
  font-weight: 900;
  letter-spacing: -0.02em;
  margin: 0 0 0.8rem;
  color: #ffffff;
}

.cta-text {
  font-size: 1rem;
  color: #c8cec3;
  line-height: 1.7;
  margin: 0 0 2rem;
}

.cta-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  flex-wrap: wrap;
  margin-bottom: 1.8rem;
}

.cta-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.85rem 1.6rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s ease;
  min-height: 48px;
}

.cta-btn-primary {
  background: var(--lime, #d5fb52);
  color: #121510;
  box-shadow: 0 4px 14px rgba(213, 251, 82, 0.3);
}

.cta-btn-primary:hover {
  background: #c3ea3e;
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(213, 251, 82, 0.4);
}

.cta-btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.cta-btn-secondary:hover {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.35);
  transform: translateY(-2px);
}

.cta-btn-outline {
  background: transparent;
  color: #b5beb0;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.cta-btn-outline:hover {
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-2px);
}

.cta-footer-note {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #9ea797;
  padding-top: 1.2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.support-link {
  color: var(--lime, #d5fb52);
  text-decoration: underline;
  text-underline-offset: 3px;
  font-weight: 600;
}

.support-link:hover {
  color: #ffffff;
}

/* Responsive Breakpoints */
@media (max-width: 960px) {
  .rates-grid,
  .zones-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .timeline-steps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .hero-highlights {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .highlight-divider {
    width: 100%;
    height: 1px;
  }

  .rates-grid,
  .zones-grid {
    grid-template-columns: 1fr;
  }

  .timeline-steps {
    grid-template-columns: 1fr;
  }

  .cta-buttons {
    flex-direction: column;
    width: 100%;
  }

  .cta-btn {
    width: 100%;
  }

  .cta-footer-note {
    flex-direction: column;
    gap: 0.3rem;
  }
}

@media (max-width: 480px) {
  .shipping-page {
    padding: 0 1rem;
    margin-top: 1rem;
  }

  .shipping-hero {
    padding: 1.6rem 1.2rem;
    border-radius: 12px;
  }

  .rate-card,
  .zone-card,
  .timeline-step {
    padding: 1.25rem 1rem;
  }

  .callout-box {
    padding: 1rem 1.1rem;
    gap: 0.8rem;
  }
}
</style>
