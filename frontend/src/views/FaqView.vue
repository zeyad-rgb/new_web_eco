<script setup lang="ts">
import { useLocaleStore } from '../stores/locale'
const locale = useLocaleStore()

import { ref, computed } from 'vue'

interface FaqItem {
  id: number
  q: string
  a: string
  category: string
}

const searchQuery = ref('')
const openId = ref<number | null>(1)

const faqs: FaqItem[] = [
  {
    id: 1,
    q: 'كم يستغرق توصيل الطلب؟',
    a: 'يستغرق الشحن القياسي من ٢ إلى ٤ أيام عمل لمعظم المحافظات، ولدينا خيار الشحن السريع خلال ٢٤-٤٨ ساعة للقاهرة والجيزة.',
    category: 'الشحن والتوصيل',
  },
  {
    id: 2,
    q: 'هل يمكنني معاينة المنتجات قبل الاستلام؟',
    a: 'نعم بكل تأكيد! يمكنك فحص ومعاينة مقاس وجودة المنتجات أمام مندوب الشحن قبل دفع قيمة الطلب.',
    category: 'الاستلام والمعاينة',
  },
  {
    id: 3,
    q: 'ما هي سياسة الإرجاع والاستبدال؟',
    a: 'نوفر إرجاع واستبدال مجاني خلال ١٤ يوماً من تاريخ الاستلام، بشرط أن تكون المنتجات بحالتها الأصلية غير مستخدمة ومع بطاقات السعر الأصلية.',
    category: 'الإرجاع والتبديل',
  },
  {
    id: 4,
    q: 'كيف أعرف مقاسي المناسب؟',
    a: 'نوفر دليل مقاسات تفصيلي في صفحة كل منتج يشمل محيط الصدر والخصر والأرداف بالسنتيمتر والبوصة لمساعدتك على اختيار المقاس المثالي.',
    category: 'المقاسات والجودة',
  },
  {
    id: 5,
    q: 'ما هي طرق الدفع المتاحة؟',
    a: 'يمكنك الدفع نقداً عند الاستلام (COD)، أو الدفع ببطاقات الائتمان والخصم المباشر (فيزا وماستركارد)، أو عبر تطبيق إنستاباي ومنافذ فوري.',
    category: 'طرق الدفع',
  },
]

const filteredFaqs = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return faqs
  return faqs.filter(
    (item) =>
      item.q.toLowerCase().includes(query) ||
      item.a.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
  )
})

function toggle(id: number) {
  openId.value = openId.value === id ? null : id
}

function clearSearch() {
  searchQuery.value = ''
}
</script>

<template>
  <div class="faq-page">
    <!-- Hero Header -->
    <header class="faq-hero">
      <div class="hero-container">
        <router-link class="back-link" to="/">
          <span class="back-arrow" aria-hidden="true">→</span>
          <span>العودة للرئيسية</span>
        </router-link>

        <div class="hero-badge">
          <span class="badge-dot"></span>
          <span>مركز الدعم والمساعدة</span>
        </div>

        <h1 class="hero-title">الأسئلة الشائعة (FAQ)</h1>
        <p class="hero-subtitle">
          إليك إجابات وافية على أكثر الأسئلة شيوعاً حول منتجاتنا الرياضية، أوقات التوصيل، سياسات الإرجاع، وطرق الدفع.
        </p>

        <!-- Search Bar -->
        <div class="faq-search-wrapper">
          <div class="search-input-group">
            <span class="search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input
              v-model="searchQuery"
              type="text"
              class="faq-search-input"
              placeholder="ابحث في الأسئلة (مثل: الشحن، الاستبدال، المقاس، الدفع)..."
              aria-label="ابحث في الأسئلة الشائعة"
            />
            <button
              v-if="searchQuery"
              type="button"
              class="clear-btn"
              title="مسح البحث"
              aria-label="مسح البحث"
              @click="clearSearch"
            >
              ✕
            </button>
          </div>

          <div v-if="searchQuery" class="search-meta">
            <span>
              نتائج البحث عن "<strong>{{ searchQuery }}</strong>": 
              {{ filteredFaqs.length }} {{ filteredFaqs.length === 1 ? 'سؤال متوفر' : 'أسئلة متوفرة' }}
            </span>
          </div>
        </div>
      </div>
    </header>

    <!-- Main FAQ Content -->
    <main class="faq-main-content">
      <div class="faq-container">
        <!-- FAQ Accordion List -->
        <div v-if="filteredFaqs.length > 0" class="faq-accordion-list" role="region" aria-label="قائمة الأسئلة الشائعة">
          <article
            v-for="item in filteredFaqs"
            :key="item.id"
            :class="['faq-card', { 'is-open': openId === item.id }]"
          >
            <button
              type="button"
              class="faq-question-btn"
              :aria-expanded="openId === item.id"
              :aria-controls="`faq-answer-${item.id}`"
              @click="toggle(item.id)"
            >
              <div class="faq-q-left">
                <span class="faq-icon" aria-hidden="true">💬</span>
                <span class="faq-q-text">{{ item.q }}</span>
              </div>
              <span class="faq-toggle-indicator" aria-hidden="true">
                <svg
                  class="chevron-icon"
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </button>

            <!-- Smooth Transition Accordion Content (max-height + overflow: hidden) -->
            <div
              :id="`faq-answer-${item.id}`"
              class="faq-answer-collapse"
              :class="{ 'is-expanded': openId === item.id }"
            >
              <div class="faq-answer-inner">
                <p>{{ item.a }}</p>
                <span class="faq-category-tag">{{ item.category }}</span>
              </div>
            </div>
          </article>
        </div>

        <!-- No Results State -->
        <div v-else class="no-results-box">
          <div class="no-results-icon" aria-hidden="true">🔍</div>
          <h3>لم نجد نتائج مطابقة لبحثك</h3>
          <p>لم يتم العثور على أي سؤال يطابق "{{ searchQuery }}". جرّب استخدام كلمات بحث أخرى أو تواصل معنا مباشرة.</p>
          <button type="button" class="reset-search-btn" @click="clearSearch">
            عرض كافة الأسئلة
          </button>
        </div>

        <!-- CTA Section: "لم تجد إجابتك؟ تواصل معنا" -->
        <section class="faq-cta-card" aria-labelledby="cta-heading">
          <div class="cta-inner">
            <div class="cta-header-block">
              <span class="cta-badge-icon" aria-hidden="true">🤝</span>
              <div class="cta-headings">
                <h2 id="cta-heading" class="cta-title">لم تجد إجابتك؟ تواصل معنا</h2>
                <p class="cta-desc">
                  فريق خدمة عملاء <strong>Studio Active</strong> جاهز لمساعدتك والرد على كافة استفساراتك حول المقاسات، الطلبات، والتوصيل.
                </p>
              </div>
            </div>

            <div class="cta-buttons-group">
              <a
                href="https://wa.me/201000000000?text=مرحباً%20Studio%20Active،%20لدي%20استفسار%20بخصوص%20المنتجات"
                target="_blank"
                rel="noopener noreferrer"
                class="cta-action-btn cta-whatsapp"
              >
                <svg class="cta-svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.074-2.128-.521-1.834-.759-3.003-2.628-3.095-2.75-.088-.124-.736-.98-.736-1.868 0-.888.467-1.326.633-1.505.17-.179.37-.224.494-.224.122 0 .247.002.354.007.113.005.263-.043.412.316.155.372.531 1.295.578 1.389.046.094.077.204.015.328-.061.124-.092.202-.184.31-.092.108-.194.241-.277.324-.093.093-.19.195-.082.381.108.186.48 1.792 1.031 2.283.71.632 1.309.828 1.495.92.186.093.295.077.404-.047.108-.124.464-.541.588-.727.124-.186.247-.155.418-.093.17.062 1.082.51 1.267.603.186.093.309.139.355.217.046.078.046.45-.098.855z"/>
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.982-1.39A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2a8.163 8.163 0 01-4.32-1.229l-.31-.191-2.96.826.837-2.884-.207-.33A8.165 8.165 0 013.8 12c0-4.521 3.679-8.2 8.2-8.2 4.521 0 8.2 3.679 8.2 8.2 0 4.521-3.679 8.2-8.2 8.2z"/>
                </svg>
                <span>محادثة واتساب مباشرة</span>
              </a>

              <a
                href="tel:01000000000"
                class="cta-action-btn cta-phone"
              >
                <svg class="cta-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <span>اتصل بنا: 01000000000</span>
              </a>
            </div>

            <div class="cta-footer-note">
              <span>🕒 خدمة العملاء متاحة يومياً من ٩:٠٠ صباحاً إلى ١٠:٠٠ مساءً</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Page Layout */
.faq-page {
  direction: rtl;
  min-height: 100vh;
  background-color: var(--paper, #fafaf8);
  color: var(--ink, #111210);
  font-family: inherit;
}

/* Hero Header */
.faq-hero {
  background: linear-gradient(180deg, #161814 0%, #20241e 100%);
  color: #f7f8f1;
  padding: 3.5rem 1.5rem 4rem;
  position: relative;
  border-bottom: 3px solid var(--lime, #d5fb52);
}

.hero-container {
  max-width: 860px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.back-link {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: #c5cac0;
  font-size: 0.92rem;
  text-decoration: none;
  margin-bottom: 1.5rem;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
}

.back-link:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.12);
  transform: translateX(3px);
}

.back-arrow {
  font-size: 1.1rem;
  line-height: 1;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(213, 251, 82, 0.12);
  color: var(--lime, #d5fb52);
  padding: 0.35rem 0.95rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  margin-bottom: 1rem;
  border: 1px solid rgba(213, 251, 82, 0.25);
}

.badge-dot {
  width: 7px;
  height: 7px;
  background-color: var(--lime, #d5fb52);
  border-radius: 50%;
  box-shadow: 0 0 8px var(--lime, #d5fb52);
}

.hero-title {
  font-size: clamp(2.2rem, 5vw, 3.4rem);
  font-weight: 900;
  line-height: 1.15;
  margin: 0 0 1rem;
  letter-spacing: -0.02em;
  color: #ffffff;
}

.hero-subtitle {
  font-size: clamp(1rem, 2vw, 1.2rem);
  line-height: 1.7;
  color: #b8bdab;
  max-width: 660px;
  margin: 0 0 2.25rem;
}

/* Search Box */
.faq-search-wrapper {
  width: 100%;
  max-width: 660px;
}

.search-input-group {
  position: relative;
  display: flex;
  align-items: center;
  background: #ffffff;
  border-radius: 12px;
  padding: 0.35rem 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
  border: 2px solid transparent;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-input-group:focus-within {
  border-color: var(--lime, #d5fb52);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
}

.search-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #73786d;
  padding-inline-start: 0.85rem;
  pointer-events: none;
}

.faq-search-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 0.9rem 0.85rem;
  font-size: 1.05rem;
  color: #161814;
  background: transparent;
  font-family: inherit;
}

.faq-search-input::placeholder {
  color: #8c9186;
  font-size: 0.98rem;
}

.clear-btn {
  background: #e6e8df;
  color: #494e44;
  border: none;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 0.85rem;
  cursor: pointer;
  margin-inline-end: 0.35rem;
  transition: all 0.2s ease;
}

.clear-btn:hover {
  background: #161814;
  color: #ffffff;
}

.search-meta {
  margin-top: 0.85rem;
  font-size: 0.9rem;
  color: #cfd4c8;
}

.search-meta strong {
  color: var(--lime, #d5fb52);
}

/* Main Content */
.faq-main-content {
  padding: 3rem 1.5rem 5rem;
}

.faq-container {
  max-width: 860px;
  margin: 0 auto;
}

/* Accordion List */
.faq-accordion-list {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.faq-card {
  background: #ffffff;
  border: 1px solid #e1e4dc;
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.faq-card:hover {
  border-color: #cbd0c3;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
}

.faq-card.is-open {
  border-color: #161814;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
}

/* Accordion Trigger Button & Typography */
.faq-question-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  padding: 1.35rem 1.6rem;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: start;
  font-family: inherit;
  transition: background-color 0.2s ease;
}

.faq-card.is-open .faq-question-btn {
  background-color: #fafbf8;
}

.faq-q-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.faq-icon {
  font-size: 1.35rem;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 10px;
  background: #f1f3eb;
  flex-shrink: 0;
  transition: transform 0.2s ease, background 0.2s ease;
}

.faq-card:hover .faq-icon {
  transform: scale(1.05);
}

.faq-card.is-open .faq-icon {
  background: var(--lime, #d5fb52);
}

.faq-q-text {
  font-size: 1.18rem;
  font-weight: 700;
  color: #161814;
  line-height: 1.45;
}

.faq-toggle-indicator {
  display: grid;
  place-items: center;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 50%;
  background: #f2f4ec;
  color: #43483e;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.faq-card.is-open .faq-toggle-indicator {
  background: #161814;
  color: #ffffff;
}

.chevron-icon {
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.faq-card.is-open .chevron-icon {
  transform: rotate(180deg);
}

/* Smooth Accordion Transition: max-height + overflow: hidden */
.faq-answer-collapse {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.38s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;
  opacity: 0;
}

.faq-answer-collapse.is-expanded {
  max-height: 500px;
  opacity: 1;
}

.faq-answer-inner {
  padding: 0.2rem 1.6rem 1.6rem;
  padding-inline-start: 5.1rem;
  color: #4a5045;
  border-top: 1px solid #f1f3ea;
  margin-top: 0.25rem;
  padding-top: 1.15rem;
}

.faq-answer-inner p {
  margin: 0 0 1rem;
  font-size: 1.05rem;
  line-height: 1.8;
}

.faq-category-tag {
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 600;
  color: #6a7063;
  background: #f3f5ee;
  border: 1px solid #e3e6dc;
  padding: 0.2rem 0.65rem;
  border-radius: 4px;
}

/* No Results State */
.no-results-box {
  background: #ffffff;
  border: 1px dashed #ced2c6;
  border-radius: 12px;
  padding: 3.5rem 2rem;
  text-align: center;
  color: #555a50;
}

.no-results-icon {
  font-size: 2.75rem;
  margin-bottom: 1rem;
}

.no-results-box h3 {
  font-size: 1.35rem;
  margin: 0 0 0.5rem;
  color: #161814;
}

.no-results-box p {
  font-size: 1rem;
  max-width: 480px;
  margin: 0 auto 1.5rem;
  line-height: 1.6;
}

.reset-search-btn {
  background: #161814;
  color: #ffffff;
  border: none;
  padding: 0.75rem 1.6rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-search-btn:hover {
  background: #2b3027;
  transform: translateY(-1px);
}

/* CTA Section: لم تجد إجابتك؟ تواصل معنا */
.faq-cta-card {
  margin-top: 3.5rem;
  background: #161814;
  color: #f7f8f2;
  border-radius: 16px;
  border: 1px solid #282c24;
  overflow: hidden;
  position: relative;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
}

.faq-cta-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--lime, #d5fb52), #9dc426);
}

.cta-inner {
  padding: 2.5rem clamp(1.5rem, 4vw, 3rem);
}

.cta-header-block {
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.cta-badge-icon {
  font-size: 2rem;
  line-height: 1;
  display: grid;
  place-items: center;
  width: 3.5rem;
  height: 3.5rem;
  background: rgba(213, 251, 82, 0.12);
  border: 1px solid rgba(213, 251, 82, 0.25);
  border-radius: 12px;
  flex-shrink: 0;
}

.cta-title {
  font-size: clamp(1.4rem, 3vw, 1.85rem);
  font-weight: 800;
  margin: 0 0 0.5rem;
  color: #ffffff;
}

.cta-desc {
  font-size: 1rem;
  color: #aeb3a5;
  line-height: 1.65;
  margin: 0;
  max-width: 620px;
}

.cta-desc strong {
  color: var(--lime, #d5fb52);
}

.cta-buttons-group {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.cta-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  padding: 0.95rem 1.6rem;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.25s ease;
  cursor: pointer;
}

.cta-whatsapp {
  background: #25d366;
  color: #ffffff;
  border: 1px solid #20ba5a;
}

.cta-whatsapp:hover {
  background: #1ebe5d;
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(37, 211, 102, 0.35);
}

.cta-phone {
  background: rgba(255, 255, 255, 0.08);
  color: #f7f8f1;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.cta-phone:hover {
  background: rgba(255, 255, 255, 0.16);
  border-color: rgba(255, 255, 255, 0.35);
  transform: translateY(-2px);
}

.cta-svg {
  flex-shrink: 0;
}

.cta-footer-note {
  border-top: 1px solid #252822;
  padding-top: 1.2rem;
  font-size: 0.88rem;
  color: #8c9184;
}

/* Responsive Adjustments */
@media (max-width: 680px) {
  .faq-hero {
    padding: 2.5rem 1.25rem 3rem;
  }

  .faq-main-content {
    padding: 2rem 1rem 4rem;
  }

  .faq-question-btn {
    padding: 1.15rem 1.2rem;
    gap: 0.75rem;
  }

  .faq-q-left {
    gap: 0.75rem;
  }

  .faq-icon {
    width: 2.2rem;
    height: 2.2rem;
    font-size: 1.15rem;
  }

  .faq-q-text {
    font-size: 1.05rem;
  }

  .faq-answer-inner {
    padding: 0.2rem 1.2rem 1.35rem;
    padding-inline-start: 1.2rem;
  }

  .cta-inner {
    padding: 1.75rem 1.25rem;
  }

  .cta-header-block {
    flex-direction: column;
    gap: 1rem;
  }

  .cta-buttons-group {
    flex-direction: column;
  }

  .cta-action-btn {
    width: 100%;
  }
}
</style>
