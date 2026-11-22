<script setup lang="ts">
import { useLocaleStore } from '../stores/locale'
const locale = useLocaleStore()

// EcoMars · Studio Active - About Us View
</script>

<template>
  <div class="about-view" :dir="locale.isRTL ? 'rtl' : 'ltr'">
    <!-- 1. Cinematic Hero Banner (Dark) -->
    <header class="hero-banner">
      <div class="hero-backdrop" aria-hidden="true">
        <div class="hero-glow"></div>
        <div class="hero-grid-pattern"></div>
      </div>

      <div class="hero-container">
        <div class="hero-top-bar">
          <router-link class="hero-back-link" to="/">
            <span class="arrow" aria-hidden="true">←</span>
            <span>الرئيسية</span>
          </router-link>
          <span class="hero-badge">EST. 2024 · STUDIO ACTIVE</span>
        </div>

        <div class="hero-content">
          <div class="hero-stripes" aria-hidden="true">
            <span class="stripe"></span>
            <span class="stripe"></span>
            <span class="stripe"></span>
          </div>

          <h1 class="brand-title">
            <span class="brand-name">EcoMars</span>
            <span class="brand-divider">·</span>
            <span class="brand-sub">Studio Active</span>
          </h1>

          <p class="brand-tagline">
            الملابس الرياضية التي تلهمك للحركة والأداء الأفضل كل يوم.
          </p>

          <div class="hero-features-chips">
            <span class="chip">أداء رياضي متطور</span>
            <span class="chip-dot" aria-hidden="true">•</span>
            <span class="chip">قصات ستريت وير عصرية</span>
            <span class="chip-dot" aria-hidden="true">•</span>
            <span class="chip">خامات مستدامة تدوم طويلاً</span>
          </div>
        </div>
      </div>
    </header>

    <!-- 2. Story Section (Light) -->
    <section class="story-section">
      <div class="section-container">
        <div class="story-grid">
          <div class="story-main">
            <div class="section-kicker">
              <span class="kicker-line" aria-hidden="true"></span>
              <span>قصتنا وهويتنا</span>
            </div>
            <h2 class="section-heading">عن EcoMars · Studio Active</h2>
            <div class="story-text">
              <p class="lead-text">
                تأسست علامة <strong>EcoMars / Studio Active</strong> لتكون الجسر بين شغف الرياضة العالي وأناقة الستريت وير العصرية. نحن نؤمن بأن كل رياضي ومحب للحركة يستحق ملابس تمنحه أقصى درجات الراحة والمرونة دون التنازل عن المظهر العالمي الجذاب.
              </p>
              <p>
                انطلقت رحلتنا من شغف حقيقي بتطوير أزياء رياضية تناسب وتيرة الحياة المتسارعة في مصر والشرق الأوسط. كل تصميم نطلقه يمر بمراحل دقيقة من التجربة والاختبار على أيدي رياضيين لضمان مقاومة أصعب التمارين والتكيف بسلاسة مع نمط الحياة اليومي.
              </p>
            </div>
          </div>

          <div class="story-stats-column">
            <div class="stat-box">
              <div class="stat-num">١٠٠٪</div>
              <div class="stat-label">خامات رياضية متطورة</div>
              <p class="stat-desc">أنسجة ناعمة، مرنة، وسريعة الجفاف تقاوم التعرق طوال اليوم.</p>
            </div>
            <div class="stat-box">
              <div class="stat-num">١٤</div>
              <div class="stat-label">يوماً إرجاع واستبدال مجاني</div>
              <p class="stat-desc">تسوق بثقة تامة مع سهولة التبديل الفوري بدون تعقيد.</p>
            </div>
            <div class="stat-box">
              <div class="stat-num">٢٤/٧</div>
              <div class="stat-label">دعم ومجتمع رياضي متكامل</div>
              <p class="stat-desc">فريق جاهز لخدمتك لمساعدتك على اختيار المقاس والتشكيلة المناسبة.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. Vision Section (Dark) -->
    <section class="vision-section">
      <div class="section-container">
        <div class="vision-card">
          <div class="vision-header">
            <span class="vision-pill">VISION & MISSION</span>
            <div class="vision-accent-stripes" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>

          <h2 class="vision-title">رؤيتنا:</h2>

          <blockquote class="vision-quote">
            "إعادة تعريف معايير صناعة الملابس الرياضية في الشرق الأوسط من خلال استخدام أحدث تقنيات النسيج المقاوم للتعرق، الخياطة المتينة، والقصات الهندسية التي تناسب كافة الأجسام وتدوم طويلاً."
          </blockquote>

          <div class="vision-footer">
            <div class="vision-author">
              <span class="author-name">مختبر تصميم EcoMars</span>
              <span class="author-role">القاهرة · مصممة للحركة والتميز الرياضي</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. Values Section (Light) -->
    <section class="values-section">
      <div class="section-container">
        <div class="section-header-center">
          <div class="section-kicker center">
            <span class="kicker-line" aria-hidden="true"></span>
            <span>مبادئنا الأساسية</span>
            <span class="kicker-line" aria-hidden="true"></span>
          </div>
          <h2 class="section-heading">قيمنا</h2>
          <p class="section-subtitle">
            نرتكز على أربع ركائز جوهرية تشكل هوية كل قطعة نبتكرها وتحدد علاقتنا بمجتمعنا الرياضي.
          </p>
        </div>

        <div class="values-grid">
          <!-- Card 1: Innovation -->
          <div class="value-card">
            <div class="value-card-top">
              <div class="value-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </div>
              <span class="value-tag">Innovation</span>
            </div>
            <h3 class="value-card-title">الابتكار الرياضي</h3>
            <p class="value-card-text">
              نبحث باستمرار عن تقنيات النسيج الذكي المقاوم للتعرق والقصات الحركية ثلاثية الأبعاد التي تمنح الرياضي أقصى مرونة بدون أي إعاقة للحركة.
            </p>
          </div>

          <!-- Card 2: Quality -->
          <div class="value-card">
            <div class="value-card-top">
              <div class="value-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
              </div>
              <span class="value-tag">Quality</span>
            </div>
            <h3 class="value-card-title">الجودة أولاً</h3>
            <p class="value-card-text">
              <strong>الجودة أولاً:</strong> لا مساومة على جودة الأقمشة ومتانة الخامات. نعتمد خياطة مقواة وأصباغاً عالية الثبات تدوم لسنوات حتى مع الاستخدام المتكرر.
            </p>
          </div>

          <!-- Card 3: Sustainability -->
          <div class="value-card">
            <div class="value-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path>
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path>
              </svg>
            </div>
            <div class="value-tag-wrap">
              <span class="value-tag">Sustainability</span>
            </div>
            <h3 class="value-card-title">التصميم المستدام</h3>
            <p class="value-card-text">
              <strong>التصميم المستدام:</strong> خامات صديقة للبيئة وتغليف مستدام. نختار خامات معاد تدويرها وأكياس شحن قابلة للتحلل، التزاماً منا بحماية مستقبل كوكبنا.
            </p>
          </div>

          <!-- Card 4: Community -->
          <div class="value-card">
            <div class="value-card-top">
              <div class="value-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <span class="value-tag">Community</span>
            </div>
            <h3 class="value-card-title">العميل في القلب</h3>
            <p class="value-card-text">
              <strong>العميل في القلب:</strong> تجربة شراء سلسة، دعم فني دائم، وإرجاع فوري بدون تعقيد. نبني مجتمعاً رياضياً متكاملاً يتشارك الشغف ويحتفي بكل خطوة إنجاز.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 5. CTA Section (Dark) -->
    <section class="cta-section">
      <div class="cta-backdrop" aria-hidden="true">
        <div class="cta-glow"></div>
        <div class="cta-grid-lines"></div>
      </div>

      <div class="section-container">
        <div class="cta-box">
          <span class="cta-badge">JOIN THE MOVEMENT</span>
          <h2 class="cta-title">ابدأ رحلتك الرياضية الآن</h2>
          <p class="cta-description">
            اكتشف أحدث تشكيلات الملابس الرياضية المصممة لتدعم أداءك اليومي في التمرين وتمنحك إطلالة ستريت وير عالمية لا تضاهى.
          </p>

          <div class="cta-buttons">
            <router-link to="/shop" class="primary cta-btn-primary">
              <span>تسوّق التشكيلة الرياضية الآن</span>
              <span class="arrow-icon" aria-hidden="true">←</span>
            </router-link>
            <router-link to="/discover" class="cta-btn-secondary">
              تصفح التشكيلات والحملات
            </router-link>
          </div>

          <div class="cta-trust-items">
            <div class="trust-pill">
              <span class="dot"></span>
              <span>شحن سريع لجميع المحافظات</span>
            </div>
            <div class="trust-pill">
              <span class="dot"></span>
              <span>إرجاع واستبدال مجاني ١٤ يوم</span>
            </div>
            <div class="trust-pill">
              <span class="dot"></span>
              <span>دفع عند الاستلام وبطاقات بنكية</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.about-view {
  width: 100%;
  overflow-x: hidden;
  background-color: #fafaf8;
  color: #191c17;
  font-family: inherit;
}

/* Common Section Layout */
.section-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 clamp(1.25rem, 4vw, 3rem);
}

.section-kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #5c6b24;
  margin-bottom: 0.8rem;
}

.section-kicker.center {
  justify-content: center;
}

.kicker-line {
  display: inline-block;
  width: 28px;
  height: 2px;
  background-color: var(--lime, #d5fb52);
}

.section-heading {
  font-size: clamp(1.8rem, 3.5vw, 2.75rem);
  font-weight: 800;
  line-height: 1.2;
  color: #111210;
  margin: 0 0 1rem;
  letter-spacing: -0.02em;
}

/* ==========================================================================
   1. Hero Banner (Cinematic Dark)
   ========================================================================== */
.hero-banner {
  position: relative;
  background-color: #111310;
  color: #f7f8f2;
  padding: clamp(3rem, 7vw, 6.5rem) 0 clamp(4rem, 8vw, 7.5rem);
  border-bottom: 3px solid var(--lime, #d5fb52);
  overflow: hidden;
}

.hero-backdrop {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.hero-glow {
  position: absolute;
  top: -20%;
  right: 15%;
  width: 550px;
  height: 550px;
  background: radial-gradient(circle, rgba(213, 251, 82, 0.16) 0%, rgba(213, 251, 82, 0) 70%);
  filter: blur(40px);
}

.hero-grid-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
}

.hero-container {
  position: relative;
  z-index: 2;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 clamp(1.25rem, 4vw, 3rem);
}

.hero-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.hero-back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #d1d4c9;
  padding: 0.45rem 0.9rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 4px;
  transition: all 0.2s ease;
}

.hero-back-link:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
  border-color: var(--lime, #d5fb52);
  transform: translateX(3px);
}

.hero-badge {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  color: var(--lime, #d5fb52);
  background: rgba(213, 251, 82, 0.08);
  border: 1px solid rgba(213, 251, 82, 0.28);
  padding: 0.35rem 0.75rem;
  border-radius: 2px;
}

.hero-content {
  max-width: 900px;
}

.hero-stripes {
  display: flex;
  gap: 6px;
  margin-bottom: 1.25rem;
}

.hero-stripes .stripe {
  width: 24px;
  height: 4px;
  background: var(--lime, #d5fb52);
  transform: skewX(-20deg);
}

.hero-stripes .stripe:nth-child(2) {
  opacity: 0.65;
  width: 18px;
}

.hero-stripes .stripe:nth-child(3) {
  opacity: 0.35;
  width: 12px;
}

.brand-title {
  font-size: clamp(2.6rem, 6.5vw, 5.2rem);
  font-weight: 900;
  line-height: 1.05;
  letter-spacing: -0.04em;
  margin: 0 0 1.5rem;
  color: #ffffff;
}

.brand-name {
  color: var(--lime, #d5fb52);
}

.brand-divider {
  margin: 0 0.4rem;
  color: rgba(255, 255, 255, 0.35);
  font-weight: 300;
}

.brand-sub {
  color: #ffffff;
}

.brand-tagline {
  font-size: clamp(1.15rem, 2.5vw, 1.6rem);
  font-weight: 600;
  line-height: 1.6;
  color: #dcdfd5;
  margin: 0 0 2rem;
  max-width: 780px;
  border-right: 4px solid var(--lime, #d5fb52);
  padding-right: 1.2rem;
}

.hero-features-chips {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.65rem 0.9rem;
  color: #a4a99d;
  font-size: 0.88rem;
  font-weight: 500;
}

.chip-dot {
  color: var(--lime, #d5fb52);
  font-size: 0.9rem;
}

/* ==========================================================================
   2. Story Section (Light)
   ========================================================================== */
.story-section {
  background-color: #fafaf8;
  padding: clamp(3.5rem, 6vw, 6rem) 0;
  border-bottom: 1px solid #e5e7df;
}

.story-grid {
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  gap: clamp(2rem, 5vw, 4.5rem);
  align-items: start;
}

.story-text {
  color: #3b3f36;
  font-size: 1.05rem;
  line-height: 1.85;
}

.story-text p {
  margin-bottom: 1.35rem;
}

.lead-text {
  font-size: 1.18rem;
  line-height: 1.85;
  color: #161814;
  font-weight: 500;
  background: #ffffff;
  padding: 1.5rem;
  border-right: 3px solid #111210;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  margin-bottom: 1.5rem;
}

.lead-text strong {
  color: #000;
}

.story-stats-column {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.stat-box {
  background: #ffffff;
  border: 1px solid #e1e3dd;
  border-radius: 8px;
  padding: 1.6rem 1.8rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.stat-box:hover {
  transform: translateY(-2px);
  border-color: #c0c4b6;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
}

.stat-num {
  font-size: 2.2rem;
  font-weight: 900;
  color: #1a1e16;
  line-height: 1;
  margin-bottom: 0.4rem;
  font-feature-settings: "tnum";
}

.stat-label {
  font-size: 1rem;
  font-weight: 700;
  color: #2b3026;
  margin-bottom: 0.35rem;
}

.stat-desc {
  font-size: 0.85rem;
  color: #63685e;
  line-height: 1.6;
  margin: 0;
}

/* ==========================================================================
   3. Vision Section (Dark Accent)
   ========================================================================== */
.vision-section {
  background-color: #161915;
  color: #ffffff;
  padding: clamp(3.5rem, 6vw, 6rem) 0;
  position: relative;
  border-bottom: 1px solid #282d25;
}

.vision-card {
  background: linear-gradient(135deg, #1f231d 0%, #171a15 100%);
  border: 1px solid rgba(213, 251, 82, 0.25);
  border-radius: 12px;
  padding: clamp(2rem, 5vw, 3.8rem);
  position: relative;
  overflow: hidden;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
}

.vision-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.vision-pill {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  color: var(--lime, #d5fb52);
  background: rgba(213, 251, 82, 0.12);
  padding: 0.3rem 0.75rem;
  border-radius: 3px;
}

.vision-accent-stripes {
  display: flex;
  gap: 5px;
}

.vision-accent-stripes span {
  width: 16px;
  height: 3px;
  background: var(--lime, #d5fb52);
  transform: skewX(-20deg);
}

.vision-title {
  font-size: clamp(1.4rem, 2.5vw, 1.85rem);
  font-weight: 800;
  color: var(--lime, #d5fb52);
  margin: 0 0 1rem;
}

.vision-quote {
  font-size: clamp(1.15rem, 2.2vw, 1.6rem);
  font-weight: 600;
  line-height: 1.8;
  color: #f2f4ec;
  margin: 0 0 2rem;
  padding-right: 1.25rem;
  border-right: 4px solid var(--lime, #d5fb52);
}

.vision-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.vision-author {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
}

.author-role {
  font-size: 0.82rem;
  color: #9ba092;
  margin-top: 0.2rem;
}

/* ==========================================================================
   4. Values Section (Light Alternating)
   ========================================================================== */
.values-section {
  background-color: #f2f3ec;
  padding: clamp(3.5rem, 6vw, 6.5rem) 0;
  border-bottom: 1px solid #e1e3da;
}

.section-header-center {
  text-align: center;
  max-width: 680px;
  margin: 0 auto 3rem;
}

.section-subtitle {
  font-size: 1.05rem;
  color: #555b4e;
  line-height: 1.7;
  margin: 0;
}

.values-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.value-card {
  background: #ffffff;
  border: 1px solid #dfe1d7;
  border-radius: 10px;
  padding: 2rem 1.6rem;
  display: flex;
  flex-direction: column;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}

.value-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: transparent;
  transition: background 0.25s ease;
}

.value-card:hover {
  transform: translateY(-5px);
  border-color: #cad0bf;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.07);
}

.value-card:hover::before {
  background: var(--lime, #d5fb52);
}

.value-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.value-icon {
  width: 50px;
  height: 50px;
  background: #191c17;
  color: var(--lime, #d5fb52);
  border-radius: 8px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  transition: transform 0.25s ease;
}

.value-card:hover .value-icon {
  transform: scale(1.08);
}

.value-icon svg {
  width: 26px;
  height: 26px;
}

.value-tag {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #737c68;
  background: #f1f2ec;
  padding: 0.3rem 0.55rem;
  border-radius: 3px;
}

.value-tag-wrap {
  margin-bottom: 0.75rem;
}

.value-card-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #161814;
  margin: 0 0 0.75rem;
}

.value-card-text {
  font-size: 0.92rem;
  color: #4f5548;
  line-height: 1.7;
  margin: 0;
}

.value-card-text strong {
  color: #1a1e16;
}

/* ==========================================================================
   5. Call to Action (CTA) Section (Dark Cinematic)
   ========================================================================== */
.cta-section {
  position: relative;
  background-color: #0f110e;
  color: #ffffff;
  padding: clamp(4rem, 7vw, 6.5rem) 0;
  overflow: hidden;
}

.cta-backdrop {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.cta-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 700px;
  height: 400px;
  background: radial-gradient(circle, rgba(213, 251, 82, 0.12) 0%, rgba(213, 251, 82, 0) 70%);
  filter: blur(50px);
}

.cta-grid-lines {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 36px 36px;
}

.cta-box {
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 820px;
  margin: 0 auto;
}

.cta-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.2em;
  color: var(--lime, #d5fb52);
  background: rgba(213, 251, 82, 0.08);
  border: 1px solid rgba(213, 251, 82, 0.25);
  padding: 0.35rem 0.85rem;
  border-radius: 2px;
  margin-bottom: 1.25rem;
}

.cta-title {
  font-size: clamp(2.2rem, 5vw, 3.6rem);
  font-weight: 900;
  color: #ffffff;
  line-height: 1.15;
  margin: 0 0 1.25rem;
  letter-spacing: -0.02em;
}

.cta-description {
  font-size: clamp(1rem, 2vw, 1.25rem);
  line-height: 1.7;
  color: #b8bcb1;
  max-width: 650px;
  margin: 0 auto 2.5rem;
}

.cta-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 2.8rem;
}

.cta-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  background: var(--lime, #d5fb52);
  color: #111310;
  font-weight: 800;
  font-size: 1.05rem;
  padding: 1.05rem 2.2rem;
  border: none;
  border-radius: 4px;
  transition: all 0.2s ease;
  box-shadow: 0 8px 24px rgba(213, 251, 82, 0.25);
}

.cta-btn-primary:hover {
  background: #c7ee3e;
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(213, 251, 82, 0.35);
}

.arrow-icon {
  font-size: 1.2rem;
  line-height: 1;
  transition: transform 0.2s ease;
}

.cta-btn-primary:hover .arrow-icon {
  transform: translateX(-4px);
}

.cta-btn-secondary {
  display: inline-flex;
  align-items: center;
  background: transparent;
  color: #e5e8de;
  border: 1px solid rgba(255, 255, 255, 0.25);
  padding: 1.05rem 1.8rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.cta-btn-secondary:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: #ffffff;
  color: #ffffff;
}

.cta-trust-items {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 2rem;
  color: #8c9284;
  font-size: 0.88rem;
}

.trust-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.trust-pill .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--lime, #d5fb52);
}

/* ==========================================================================
   Responsive Adaptations
   ========================================================================== */
@media (max-width: 1024px) {
  .values-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 820px) {
  .story-grid {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }
}

@media (max-width: 640px) {
  .values-grid {
    grid-template-columns: 1fr;
  }

  .hero-top-bar {
    margin-bottom: 1.8rem;
  }

  .cta-buttons {
    flex-direction: column;
    width: 100%;
  }

  .cta-btn-primary,
  .cta-btn-secondary {
    width: 100%;
    justify-content: center;
  }

  .cta-trust-items {
    flex-direction: column;
    gap: 0.75rem;
    align-items: flex-start;
    padding-inline-start: 1rem;
  }
}
</style>
