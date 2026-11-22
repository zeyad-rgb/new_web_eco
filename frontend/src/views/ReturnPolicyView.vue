<script setup lang="ts">
import { useLocaleStore } from '../stores/locale'
const locale = useLocaleStore()

// Return and exchange policy view
</script>

<template>
  <div class="return-policy-page" :dir="locale.isRTL ? 'rtl' : 'ltr'">
    <div class="container">
      <!-- Breadcrumb & Back Link -->
      <nav class="breadcrumb-nav" aria-label="مسار التنقل">
        <router-link class="back-link" to="/">
          <span class="back-arrow" aria-hidden="true">→</span>
          العودة للرئيسية
        </router-link>
        <span class="breadcrumb-separator" aria-hidden="true">/</span>
        <span class="breadcrumb-current">سياسة الإرجاع والاستبدال</span>
      </nav>

      <!-- 1. Hero Header -->
      <header class="hero-header">
        <div class="hero-icon-wrapper" aria-hidden="true">
          <span class="hero-icon">↩️</span>
        </div>
        <div class="hero-badge">ضمان الرضا ١٠٠٪</div>
        <h1 class="hero-title">سياسة الإرجاع والاستبدال</h1>
        <p class="hero-subtitle">
          في <strong>EcoMars / Studio Active</strong> نسعى دائماً لتقديم أفضل تجربة تسوق رياضية.
          إذا لم يكن المقاس أو المنتج ملائماً لتطلعاتك بنسبة ١٠٠٪، نضمن لك إرجاعاً واستبدالاً مريحاً وسريعاً خلال ١٤ يوماً.
        </p>

        <!-- Quick Trust Badges -->
        <div class="hero-highlights">
          <div class="highlight-chip">
            <span class="chip-icon">⏱️</span>
            <span>١٤ يوماً فترة استبدال وإرجاع</span>
          </div>
          <div class="highlight-chip">
            <span class="chip-icon">✨</span>
            <span>معاينة وفحص المنتج قبل الاستلام</span>
          </div>
          <div class="highlight-chip">
            <span class="chip-icon">🚚</span>
            <span>استلام المرتجع من باب منزلك</span>
          </div>
          <div class="highlight-chip">
            <span class="chip-icon">⚡</span>
            <span>استرداد فوري عبر إنستاباي والمحافظ</span>
          </div>
        </div>
      </header>

      <!-- 4. Important Callout: Inspection before paying -->
      <aside class="callout callout-highlight" aria-label="ميزة المعاينة قبل الاستلام">
        <div class="callout-icon" aria-hidden="true">✨</div>
        <div class="callout-content">
          <h2 class="callout-title">ميزة المعاينة قبل الاستلام (افحص قبل الدفع)</h2>
          <p>
            حرصاً منا على راحتك وثقتك، نتيح لك <strong>فتح ومعاينة الشحنة والتأكد من المقاس وجودة الخامات</strong> أمام مندوب شركة الشحن مباشرة قبل دفع أي مبالغ. إذا لم تكن القطعة كما تمنيت، يمكنك إرجاعها فوراً مع المندوب ودفع قيمة التوصيل فقط!
          </p>
        </div>
      </aside>

      <!-- 3. Step-by-Step Visual Return Process -->
      <section class="process-section" aria-labelledby="process-heading">
        <div class="section-header">
          <span class="section-tag">إجراءات سهلة وبسيطة</span>
          <h2 id="process-heading" class="section-title">خطوات طلب الإرجاع أو الاستبدال</h2>
          <p class="section-desc">أربع خطوات مباشرة تضمن إتمام طلبك بأعلى درجات السرعة والمرونة</p>
        </div>

        <div class="steps-grid">
          <!-- Step 1 -->
          <article class="step-card">
            <div class="step-top">
              <span class="step-number">01</span>
              <span class="step-icon" aria-hidden="true">📝</span>
            </div>
            <h3 class="step-title">تقديم الطلب</h3>
            <p class="step-desc">
              تواصل مع فريق الدعم برقم الطلب واسم القطعة، وحدد ما إذا كنت ترغب في استبدال المقاس أو استرجاع المبلغ.
            </p>
          </article>

          <!-- Step 2 -->
          <article class="step-card">
            <div class="step-top">
              <span class="step-number">02</span>
              <span class="step-icon" aria-hidden="true">📦</span>
            </div>
            <h3 class="step-title">تجهيز الشحنة</h3>
            <p class="step-desc">
              ضع المنتج في غلافه الأصلي مع التأكد من وجود كروت السعر الأصلية والباركود (Tags) غير منزوعة.
            </p>
          </article>

          <!-- Step 3 -->
          <article class="step-card">
            <div class="step-top">
              <span class="step-number">03</span>
              <span class="step-icon" aria-hidden="true">🚚</span>
            </div>
            <h3 class="step-title">استلام المندوب</h3>
            <p class="step-desc">
              سيقوم مندوب شركة الشحن بزيارتك خلال يومين إلى ٣ أيام عمل لاستلام الشحنة من باب منزلك بكل راحة.
            </p>
          </article>

          <!-- Step 4 -->
          <article class="step-card">
            <div class="step-top">
              <span class="step-number">04</span>
              <span class="step-icon" aria-hidden="true">💸</span>
            </div>
            <h3 class="step-title">الفحص والتحويل</h3>
            <p class="step-desc">
              بمجرد وصول المنتج لمخازننا وفحصه، نرسل لك المقاس البديل فوراً أو نقوم بتحويل مستحقاتك دون تأخير.
            </p>
          </article>
        </div>
      </section>

      <!-- 2. Styled Info Cards Instead of Plain Text -->
      <section class="policy-cards-section" aria-labelledby="policy-cards-heading">
        <div class="section-header">
          <span class="section-tag">الشروط والأحكام بالتفصيل</span>
          <h2 id="policy-cards-heading" class="section-title">بنود سياسة الإرجاع والاستبدال</h2>
          <p class="section-desc">تعرف على كافة التفاصيل لضمان قبول طلبك بسلاسة</p>
        </div>

        <div class="cards-grid">
          <!-- Card 1 -->
          <article class="info-card">
            <header class="card-header">
              <div class="card-icon-bubble" aria-hidden="true">⏱️</div>
              <div>
                <h3 class="card-title">فترة الإرجاع والاستبدال</h3>
                <span class="card-badge badge-green">١٤ يوماً كاملة</span>
              </div>
            </header>
            <div class="card-body">
              <ul class="card-list">
                <li>
                  <span class="list-bullet" aria-hidden="true">✓</span>
                  <div>
                    <strong>١٤ يوماً من تاريخ الاستلام:</strong>
                    يحق للعميل طلب إرجاع أو استبدال المقاس أو الموديل خلال أسبوعين كاملين من استلام الطلب.
                  </div>
                </li>
                <li>
                  <span class="list-bullet" aria-hidden="true">✓</span>
                  <div>
                    <strong>ضمان عيوب الصناعة (٣٠ يوماً):</strong>
                    في حال اكتشاف أي عيب مصنعي في الخياطة أو النسيج، يتم الاستبدال مجاناً حتى ٣٠ يوماً.
                  </div>
                </li>
                <li>
                  <span class="list-bullet" aria-hidden="true">✓</span>
                  <div>
                    <strong>استبدال فوري للمقاس:</strong>
                    إذا كان المقاس كبيراً أو صغيراً، يمكنك حجز المقاس البديل فور التواصل مع خدمة العملاء.
                  </div>
                </li>
              </ul>
            </div>
          </article>

          <!-- Card 2 -->
          <article class="info-card">
            <header class="card-header">
              <div class="card-icon-bubble" aria-hidden="true">🏷️</div>
              <div>
                <h3 class="card-title">شروط قبول المرتجعات</h3>
                <span class="card-badge badge-blue">معايير الحالة الأصلية</span>
              </div>
            </header>
            <div class="card-body">
              <ul class="card-list">
                <li>
                  <span class="list-bullet" aria-hidden="true">✓</span>
                  <div>
                    <strong>الحالة الأصلية للمنتج:</strong>
                    يجب أن يكون المنتج غير ملبوس، غير مغسول، ونظيفاً تماماً وخالياً من أي روائح عطرية أو بقع.
                  </div>
                </li>
                <li>
                  <span class="list-bullet" aria-hidden="true">✓</span>
                  <div>
                    <strong>بطاقات السعر والباركود (Tags):</strong>
                    يجب أن تظل جميع البطاقات الأصلية مرفقة بالقطعة وفي مكانها الأصلي دون قص أو نزع.
                  </div>
                </li>
                <li>
                  <span class="list-bullet" aria-hidden="true">✓</span>
                  <div>
                    <strong>التغليف وإثبات الشراء:</strong>
                    يشترط وجود التغليف الخاص بالمنتج وإبراز رقم الطلب الإلكتروني أو الفاتورة المرسلة.
                  </div>
                </li>
              </ul>
            </div>
          </article>

          <!-- Card 3 -->
          <article class="info-card">
            <header class="card-header">
              <div class="card-icon-bubble" aria-hidden="true">💳</div>
              <div>
                <h3 class="card-title">طرق استرداد الأموال</h3>
                <span class="card-badge badge-purple">خيارات دفع مرنة</span>
              </div>
            </header>
            <div class="card-body">
              <ul class="card-list">
                <li>
                  <span class="list-bullet" aria-hidden="true">✓</span>
                  <div>
                    <strong>المحافظ الإلكترونية وإنستاباي:</strong>
                    يتم تحويل المبلغ خلال ٢٤ إلى ٤٨ ساعة عمل فقط من فحص المنتج عبر (InstaPay أو Vodafone Cash).
                  </div>
                </li>
                <li>
                  <span class="list-bullet" aria-hidden="true">✓</span>
                  <div>
                    <strong>البطاقات البنكية (فيزا / ماستركارد):</strong>
                    يتم رد المبلغ لنفس البطاقة المستخدمة خلال ٥-١٠ أيام عمل وفقاً لسياسة البنك المصدر.
                  </div>
                </li>
                <li>
                  <span class="list-bullet" aria-hidden="true">✓</span>
                  <div>
                    <strong>رصيد المتجر الإلكتروني:</strong>
                    يمكنك اختيار تحويل المبلغ لكوبون رصيد فوري في حسابك لاستخدامه في أي طلب قادم بدون انتظار.
                  </div>
                </li>
              </ul>
            </div>
          </article>

          <!-- Card 4 -->
          <article class="info-card">
            <header class="card-header">
              <div class="card-icon-bubble" aria-hidden="true">🚫</div>
              <div>
                <h3 class="card-title">المنتجات المستثناة من الإرجاع</h3>
                <span class="card-badge badge-amber">لدواعي الصحة والسلامة</span>
              </div>
            </header>
            <div class="card-body">
              <ul class="card-list">
                <li>
                  <span class="list-bullet warning" aria-hidden="true">✕</span>
                  <div>
                    <strong>الملابس الداخلية والجوارب:</strong>
                    لا يمكن إرجاعها أو استبدالها بعد فتح التغليف التزاماً بمعايير النظافة والصحة العامة.
                  </div>
                </li>
                <li>
                  <span class="list-bullet warning" aria-hidden="true">✕</span>
                  <div>
                    <strong>المنتجات المغسولة أو المعدلة:</strong>
                    أي قطعة تم غسلها أو تقصيرها أو إجراء أي تعديل يدوي عليها تسقط عنها صلاحية الإرجاع.
                  </div>
                </li>
                <li>
                  <span class="list-bullet warning" aria-hidden="true">✕</span>
                  <div>
                    <strong>سوء الاستخدام أو التلف الناتج:</strong>
                    القطع التي تعرضت لتمزق ناتج عن احتكاك حاد أو غسيل مخالف لإرشادات العناية الموضحة بالملصق.
                  </div>
                </li>
              </ul>
            </div>
          </article>
        </div>
      </section>

      <!-- 4. Callout Boxes for Important Notes -->
      <section class="callouts-section" aria-label="تنبيهات ومعلومات هامة">
        <!-- Callout: Shipping Fees -->
        <aside class="callout callout-warning">
          <div class="callout-icon" aria-hidden="true">🚚</div>
          <div class="callout-content">
            <h3 class="callout-title">كيف يتم احتساب مصاريف الشحن عند الإرجاع والاستبدال؟</h3>
            <p>
              <strong>في حال وجود عيب صناعة أو استلام منتج غير مطابق:</strong> يتحمل متجر EcoMars كافة تكاليف الشحن ذهاباً وإياباً دون تحميلك أي قرش إضافي.
            </p>
            <p class="callout-subtext">
              <strong>في حال كان الإرجاع أو الاستبدال لرغبة العميل (تغيير رأي أو مقاس):</strong> يتحمل العميل تكلفة الشحن الرمزية فقط لتوصيل واستلام الشحنة (٨٥ جنيهاً مصرياً)، ويكون تبديل القطعة مجانياً.
            </p>
          </div>
        </aside>

        <!-- Callout: Size Advice Tip -->
        <aside class="callout callout-tip">
          <div class="callout-icon" aria-hidden="true">💡</div>
          <div class="callout-content">
            <h3 class="callout-title">نصيحة لتوفير وقتك واختيار المقاس المثالي من المرة الأولى</h3>
            <p>
              لتجنب الحاجة للاستبدال، ننصحك بالاطلاع على <strong>جدول المقاسات الدقيق</strong> المتوفر بصفحة كل منتج. كما يمكنك دائماً مراسلة فريق خدمة العملاء عبر الواتساب لتزويدك بالمقاس الأنسب بناءً على وزنك وطولك وطبيعة تدريبك الرياضي.
            </p>
          </div>
        </aside>
      </section>

      <!-- 6. Bottom CTA Section -->
      <section class="cta-banner" aria-labelledby="cta-heading">
        <div class="cta-content">
          <div class="cta-tag">دعم العملاء على مدار الساعة</div>
          <h2 id="cta-heading" class="cta-title">هل لديك أي استفسار أو ترغب في بدء طلب إرجاع؟</h2>
          <p class="cta-text">
            فريق خدمة عملاء EcoMars متواجد طوال أيام الأسبوع من الساعة ٩ صباحاً وحتى ١٠ مساءً لمساعدتك في كل ما تحتاجه وتسهيل إجراءات استبدالك بكل رحابة صدر.
          </p>
          <div class="cta-actions">
            <router-link to="/shop" class="btn btn-primary">
              <span>تسوق التشكيلة الجديدة</span>
              <span class="btn-arrow" aria-hidden="true">←</span>
            </router-link>
            <router-link to="/faq" class="btn btn-secondary">
              <span>الأسئلة الشائعة (FAQ)</span>
            </router-link>
            <router-link to="/shipping" class="btn btn-ghost">
              <span>سياسة الشحن والتوصيل</span>
            </router-link>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* ==========================================================================
   ReturnPolicyView Scoped Styles
   Theme Variables & Clean Layout
   ========================================================================== */

.return-policy-page {
  direction: rtl;
  text-align: right;
  min-height: 100vh;
  padding: 2rem 1.5rem 5rem;
  background-color: var(--paper, #fafaf8);
  color: var(--ink, #111210);
  font-family: "IBM Plex Sans Arabic", Tahoma, Arial, sans-serif;
  line-height: 1.7;
}

.container {
  max-width: 1080px;
  margin: 0 auto;
}

/* --------------------------------------------------------------------------
   Breadcrumb Navigation
   -------------------------------------------------------------------------- */
.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  margin-bottom: 2rem;
  color: #6a6f62;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--ink, #111210);
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s ease, transform 0.2s ease;
}

.back-link:hover {
  color: #4c6310;
  transform: translateX(2px);
}

.back-arrow {
  font-size: 1.1rem;
  line-height: 1;
}

.breadcrumb-separator {
  color: #c2c5bc;
  font-size: 0.85rem;
}

.breadcrumb-current {
  color: #7b8073;
}

/* --------------------------------------------------------------------------
   1. Hero Header
   -------------------------------------------------------------------------- */
.hero-header {
  position: relative;
  background: #ffffff;
  border: 1px solid var(--line, #dbded6);
  border-radius: 20px;
  padding: clamp(2.5rem, 5vw, 4rem) clamp(1.5rem, 4vw, 3.5rem);
  text-align: center;
  box-shadow: 0 4px 20px -4px rgba(0, 0, 0, 0.04);
  margin-bottom: 2.5rem;
  overflow: hidden;
}

.hero-header::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 6px;
  background: linear-gradient(90deg, var(--lime, #d5fb52), #b3dd24, #111210);
}

.hero-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: #f4fae1;
  border: 2px solid #e2f49d;
  margin-bottom: 1.25rem;
  box-shadow: 0 8px 18px -4px rgba(213, 251, 82, 0.4);
}

.hero-icon {
  font-size: 2.25rem;
  line-height: 1;
}

.hero-badge {
  display: inline-block;
  background: #111210;
  color: var(--lime, #d5fb52);
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.35rem 1rem;
  border-radius: 999px;
  letter-spacing: 0.04em;
  margin-bottom: 1rem;
}

.hero-title {
  font-size: clamp(2rem, 4.5vw, 3.2rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.2;
  margin: 0 0 1rem;
  color: var(--ink, #111210);
}

.hero-subtitle {
  max-width: 720px;
  margin: 0 auto 2.2rem;
  font-size: clamp(1rem, 1.8vw, 1.15rem);
  color: #52584c;
  line-height: 1.8;
}

.hero-subtitle strong {
  color: var(--ink, #111210);
}

/* Quick highlight chips */
.hero-highlights {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  padding-top: 1.5rem;
  border-top: 1px solid #edf0ea;
}

.highlight-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #f7f8f4;
  border: 1px solid #e2e5dc;
  padding: 0.55rem 1rem;
  border-radius: 999px;
  font-size: 0.88rem;
  font-weight: 600;
  color: #2b3024;
}

.chip-icon {
  font-size: 1.05rem;
}

/* --------------------------------------------------------------------------
   Section Common Headers
   -------------------------------------------------------------------------- */
.section-header {
  text-align: center;
  margin-bottom: 2.2rem;
}

.section-tag {
  display: inline-block;
  font-size: 0.8rem;
  font-weight: 700;
  color: #637d19;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 0.35rem;
}

.section-title {
  font-size: clamp(1.5rem, 3vw, 2.2rem);
  font-weight: 800;
  margin: 0 0 0.5rem;
  color: var(--ink, #111210);
  letter-spacing: -0.02em;
}

.section-desc {
  font-size: 1rem;
  color: #6a7063;
  margin: 0 auto;
  max-width: 600px;
}

/* --------------------------------------------------------------------------
   3. Step-by-Step Visual Return Process
   -------------------------------------------------------------------------- */
.process-section {
  margin-bottom: 3.5rem;
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
  position: relative;
}

.step-card {
  position: relative;
  background: #ffffff;
  border: 1px solid var(--line, #dbded6);
  border-radius: 16px;
  padding: 1.75rem 1.4rem;
  display: flex;
  flex-direction: column;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.step-card:hover {
  transform: translateY(-4px);
  border-color: #2b3024;
  box-shadow: 0 12px 28px -6px rgba(0, 0, 0, 0.08);
}

.step-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.2rem;
}

.step-number {
  font-family: Arial, sans-serif;
  font-weight: 900;
  font-size: 1.25rem;
  background: #111210;
  color: var(--lime, #d5fb52);
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.step-icon {
  font-size: 1.8rem;
  opacity: 0.95;
}

.step-title {
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0 0 0.65rem;
  color: var(--ink, #111210);
}

.step-desc {
  font-size: 0.92rem;
  color: #555b4e;
  line-height: 1.65;
  margin: 0;
  flex-grow: 1;
}

/* --------------------------------------------------------------------------
   2. Styled Info Cards
   -------------------------------------------------------------------------- */
.policy-cards-section {
  margin-bottom: 3.5rem;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.info-card {
  background: #ffffff;
  border: 1px solid var(--line, #dbded6);
  border-radius: 16px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.info-card:hover {
  border-color: #c7cbc0;
  box-shadow: 0 10px 24px -6px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid #edf0ea;
  margin-bottom: 1.4rem;
}

.card-icon-bubble {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: #f5f6f1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  flex-shrink: 0;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
  color: var(--ink, #111210);
}

.card-badge {
  display: inline-block;
  font-size: 0.76rem;
  font-weight: 700;
  padding: 0.15rem 0.65rem;
  border-radius: 6px;
}

.badge-green {
  background: #e9f8d3;
  color: #3b5a04;
}

.badge-blue {
  background: #e3f2fd;
  color: #0d47a1;
}

.badge-purple {
  background: #f3e5f5;
  color: #6a1b9a;
}

.badge-amber {
  background: #fff3e0;
  color: #b75e00;
}

.card-body {
  flex-grow: 1;
}

.card-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.card-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  font-size: 0.94rem;
  line-height: 1.7;
  color: #4a5042;
}

.card-list li strong {
  color: var(--ink, #111210);
  display: inline;
  margin-inline-end: 0.3rem;
}

.list-bullet {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #eef8d5;
  color: #3f6004;
  font-size: 0.78rem;
  font-weight: 800;
  flex-shrink: 0;
  margin-top: 0.2rem;
}

.list-bullet.warning {
  background: #fde8e8;
  color: #c5221f;
}

/* --------------------------------------------------------------------------
   4. Callout Boxes for Important Notes
   -------------------------------------------------------------------------- */
.callouts-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 3.5rem;
}

.callout {
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  padding: 1.6rem 1.8rem;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid var(--line, #dbded6);
  border-right-width: 6px;
  line-height: 1.75;
}

.callout-icon {
  font-size: 1.85rem;
  line-height: 1;
  flex-shrink: 0;
  margin-top: 0.15rem;
}

.callout-content {
  flex-grow: 1;
}

.callout-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 0.45rem;
  color: var(--ink, #111210);
}

.callout p {
  margin: 0;
  font-size: 0.95rem;
  color: #494e41;
}

.callout p + p {
  margin-top: 0.65rem;
}

.callout-subtext {
  font-size: 0.92rem;
  color: #5c6253;
}

/* Highlight variant */
.callout-highlight {
  background: #fbfcfa;
  border-color: #d1e899;
  border-right-color: #799a16;
  box-shadow: 0 4px 16px -4px rgba(121, 154, 22, 0.12);
  margin-bottom: 3rem;
}

.callout-highlight .callout-title {
  color: #2b3d04;
}

/* Warning variant */
.callout-warning {
  background: #fefcf9;
  border-color: #f1ddbe;
  border-right-color: #d97706;
}

.callout-warning .callout-title {
  color: #92400e;
}

/* Tip variant */
.callout-tip {
  background: #f7fafc;
  border-color: #cfe1f3;
  border-right-color: #2563eb;
}

.callout-tip .callout-title {
  color: #1e40af;
}

/* --------------------------------------------------------------------------
   6. CTA (Call To Action) Section
   -------------------------------------------------------------------------- */
.cta-banner {
  background: #111210;
  color: #ffffff;
  border-radius: 20px;
  padding: clamp(2.5rem, 5vw, 3.8rem) clamp(1.5rem, 4vw, 3rem);
  text-align: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 16px 36px -10px rgba(0, 0, 0, 0.25);
}

.cta-banner::before {
  content: '';
  position: absolute;
  top: -50px;
  right: -50px;
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, rgba(213, 251, 82, 0.16) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

.cta-banner::after {
  content: '';
  position: absolute;
  bottom: -60px;
  left: -60px;
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(213, 251, 82, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

.cta-content {
  position: relative;
  z-index: 1;
  max-width: 740px;
  margin: 0 auto;
}

.cta-tag {
  display: inline-block;
  background: rgba(213, 251, 82, 0.15);
  color: var(--lime, #d5fb52);
  border: 1px solid rgba(213, 251, 82, 0.3);
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.35rem 0.95rem;
  border-radius: 999px;
  margin-bottom: 1.25rem;
}

.cta-title {
  font-size: clamp(1.75rem, 3.5vw, 2.5rem);
  font-weight: 800;
  color: #ffffff;
  line-height: 1.3;
  margin: 0 0 1rem;
  letter-spacing: -0.02em;
}

.cta-text {
  font-size: clamp(0.95rem, 1.6vw, 1.05rem);
  color: #b7bcae;
  line-height: 1.8;
  margin: 0 auto 2.2rem;
  max-width: 620px;
}

.cta-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.85rem 1.65rem;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.22s ease;
  white-space: nowrap;
}

.btn-primary {
  background: var(--lime, #d5fb52);
  color: #111210;
  border: 1px solid var(--lime, #d5fb52);
  box-shadow: 0 6px 16px -2px rgba(213, 251, 82, 0.35);
}

.btn-primary:hover {
  background: #c2ec38;
  border-color: #c2ec38;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px -2px rgba(213, 251, 82, 0.45);
}

.btn-arrow {
  font-size: 1.15rem;
  line-height: 1;
  transition: transform 0.2s ease;
}

.btn-primary:hover .btn-arrow {
  transform: translateX(-4px);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.16);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
}

.btn-ghost {
  background: transparent;
  color: #d1d4cb;
  border: 1px solid transparent;
}

.btn-ghost:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
}

/* --------------------------------------------------------------------------
   Responsive Breakpoints
   -------------------------------------------------------------------------- */
@media (max-width: 960px) {
  .steps-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .cards-grid {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
}

@media (max-width: 640px) {
  .return-policy-page {
    padding: 1.25rem 1rem 4rem;
  }

  .hero-header {
    border-radius: 16px;
    padding: 2.2rem 1.2rem;
  }

  .hero-highlights {
    flex-direction: column;
    align-items: stretch;
  }

  .highlight-chip {
    justify-content: center;
  }

  .steps-grid {
    grid-template-columns: 1fr;
  }

  .info-card {
    padding: 1.5rem 1.25rem;
  }

  .callout {
    flex-direction: column;
    gap: 0.75rem;
    padding: 1.25rem;
  }

  .cta-banner {
    border-radius: 16px;
    padding: 2.2rem 1.25rem;
  }

  .cta-actions {
    flex-direction: column;
    width: 100%;
  }

  .btn {
    width: 100%;
  }
}
</style>
