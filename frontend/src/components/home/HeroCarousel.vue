<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useLocaleStore } from '../../stores/locale'

const locale = useLocaleStore()

interface Slide {
  id: string
  subtitle: string
  title: string
  desc: string
  ctaText: string
  ctaLink: string
  secondaryCtaText?: string
  secondaryCtaLink?: string
  badge?: string
  bgPosition?: string
}

const slides = computed<Slide[]>(() => {
  if (locale.locale === 'en') {
    return [
      {
        id: 'training',
        subtitle: 'STUDIO ACTIVE / PERFORMANCE LAB',
        title: 'BUILT TO\nPERFORM.',
        desc: 'Engineered with moisture-wicking tech and four-way stretch fabrics for high-intensity training.',
        ctaText: 'SHOP TRAINING',
        ctaLink: '/shop?collection=training',
        secondaryCtaText: 'ALL PRODUCTS',
        secondaryCtaLink: '/shop',
        badge: 'NEW DROP',
        bgPosition: 'left top',
      },
      {
        id: 'everyday',
        subtitle: 'ECO MARS / ESSENTIALS',
        title: 'LIMITLESS\nMOTION.',
        desc: 'Everyday athletic essentials blending sports recovery comfort with modern street aesthetics.',
        ctaText: 'SHOP ESSENTIALS',
        ctaLink: '/shop?collection=everyday',
        secondaryCtaText: 'NEW ARRIVALS',
        secondaryCtaLink: '/shop?collection=latest',
        badge: 'BESTSELLER',
        bgPosition: 'right bottom',
      },
      {
        id: 'latest',
        subtitle: 'SUMMER ACTIVEWEAR 2026',
        title: 'PUSH YOUR\nLIMITS.',
        desc: 'Ultra-breathable tees, training shorts and joggers built for maximum heat and endurance.',
        ctaText: 'EXPLORE COLLECTION',
        ctaLink: '/shop',
        secondaryCtaText: 'VIEW OFFERS',
        secondaryCtaLink: '/shop?sort=asc',
        badge: 'FEATURED',
        bgPosition: 'left bottom',
      },
    ]
  }

  return [
    {
      id: 'training',
      subtitle: 'STUDIO ACTIVE / TRAINING COLLECTION',
      title: 'جاهز\nللحركة.',
      desc: 'تشكيلة رياضية مصممة بأعلى معايير التهوية والمرونة لتمنحك أداءً استثنائياً في كل تمرين.',
      ctaText: 'تسوّق تشكيلة التمرين',
      ctaLink: '/shop?collection=training',
      secondaryCtaText: 'اكتشف التصنيفات',
      secondaryCtaLink: '/discover',
      badge: 'إصدار جديد',
      bgPosition: 'left top',
    },
    {
      id: 'everyday',
      subtitle: 'ECO MARS / EVERYDAY ESSENTIALS',
      title: 'أناقة\nيومية.',
      desc: 'الأساسيات اليومية التي تجمع بين راحة الأقمشة الرياضية وأناقة مظهر الشارع العصري.',
      ctaText: 'تسوّق الأساسيات',
      ctaLink: '/shop?collection=everyday',
      secondaryCtaText: 'وصل حديثاً',
      secondaryCtaLink: '/shop?collection=latest',
      badge: 'الأكثر طلباً',
      bgPosition: 'right bottom',
    },
    {
      id: 'latest',
      subtitle: 'SUMMER RUNNING / NEW ARRIVALS',
      title: 'تخطى\nحدودك.',
      desc: 'أحدث الشورتات والتيشيرتات خفيفة الوزن المصممة خصيصاً للجري والأنشطة عالية الكثافة.',
      ctaText: 'تصفح كل المنتجات',
      ctaLink: '/shop',
      secondaryCtaText: 'شاهد العروض',
      secondaryCtaLink: '/shop?sort=asc',
      badge: 'تخفيضات حصرية',
      bgPosition: 'left bottom',
    },
  ]
})

const currentIndex = ref(0)
let timer: any = null

function nextSlide() {
  currentIndex.value = (currentIndex.value + 1) % slides.value.length
}

function prevSlide() {
  currentIndex.value = (currentIndex.value - 1 + slides.value.length) % slides.value.length
}

function goToSlide(index: number) {
  currentIndex.value = index
  resetTimer()
}

function startTimer() {
  timer = setInterval(nextSlide, 6000)
}

function resetTimer() {
  if (timer) clearInterval(timer)
  startTimer()
}

onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <section class="hero-carousel" aria-label="العروض الرئيسية">
    <div
      v-for="(slide, index) in slides"
      :key="slide.id"
      class="hero-slide"
      :class="{ active: currentIndex === index }"
      :style="{ '--bg-pos': slide.bgPosition || 'center' }"
    >
      <div class="hero-photo" aria-hidden="true"></div>
      
      <div class="hero-copy">
        <div class="slide-badge-wrap">
          <span v-if="slide.badge" class="hero-tag">{{ slide.badge }}</span>
          <p lang="en" class="hero-subtitle">{{ slide.subtitle }}</p>
        </div>

        <h1 class="hero-title">{{ slide.title }}</h1>
        <p class="hero-desc">{{ slide.desc }}</p>

        <div class="hero-actions">
          <router-link class="primary cta-btn" :to="slide.ctaLink">
            {{ slide.ctaText }} <span aria-hidden="true">↖</span>
          </router-link>
          <router-link
            v-if="slide.secondaryCtaText && slide.secondaryCtaLink"
            class="subtle-link secondary-cta"
            :to="slide.secondaryCtaLink"
          >
            {{ slide.secondaryCtaText }}
          </router-link>
        </div>
      </div>
    </div>

    <!-- Carousel Controls -->
    <div class="carousel-nav">
      <button
        type="button"
        class="carousel-arrow"
        aria-label="الشريحة السابقة"
        @click="prevSlide(); resetTimer()"
      >
        →
      </button>
      
      <div class="carousel-dots">
        <button
          v-for="(_, index) in slides"
          :key="index"
          type="button"
          class="dot-indicator"
          :class="{ active: currentIndex === index }"
          :aria-label="'الانتقال للشريحة ' + (index + 1)"
          @click="goToSlide(index)"
        ></button>
      </div>

      <button
        type="button"
        class="carousel-arrow"
        aria-label="الشريحة التالية"
        @click="nextSlide(); resetTimer()"
      >
        ←
      </button>
    </div>
  </section>
</template>

<style scoped>
.hero-carousel {
  position: relative;
  overflow: hidden;
  min-height: clamp(480px, 55vw, 720px);
  background: #151814;
  color: #fff;
}

.hero-slide {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: 1fr 1.08fr;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.6s ease-in-out;
}

.hero-slide.active {
  opacity: 1;
  pointer-events: auto;
  z-index: 2;
}

.hero-photo {
  position: relative;
  grid-row: 1;
  grid-column: 2;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #262923;
}

.hero-photo::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: var(--campaign, url('/campaign.jpg'));
  background-size: 200% 200%;
  background-position: var(--bg-pos, left top);
  transition: transform 6s ease-out;
}

.hero-slide.active .hero-photo::before {
  transform: scale(1.04);
}

.hero-copy {
  grid-row: 1;
  grid-column: 1;
  position: relative;
  z-index: 2;
  padding: clamp(2.5rem, 6vw, 6rem);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.slide-badge-wrap {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.hero-tag {
  background: var(--lime);
  color: #111;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.2rem 0.55rem;
  border-radius: 2px;
  letter-spacing: 0.05em;
}

.hero-subtitle {
  margin: 0;
  font-size: 0.75rem;
  letter-spacing: 0.18em;
  color: #d6fa68;
  font-family: Arial, sans-serif;
}

.hero-title {
  font-size: clamp(3.5rem, 8vw, 7.5rem);
  line-height: 0.98;
  letter-spacing: -0.05em;
  margin: 0.6rem 0 1.25rem;
  white-space: pre-line;
}

.hero-desc {
  font-size: clamp(0.95rem, 1.5vw, 1.15rem);
  color: #cfd2c8;
  line-height: 1.6;
  max-width: 480px;
  margin: 0 0 2rem;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.cta-btn {
  font-size: 0.95rem;
  padding: 0.95rem 1.6rem;
  letter-spacing: 0.03em;
}

.secondary-cta {
  color: #ffffff;
  font-size: 0.95rem;
  text-decoration: underline;
  text-underline-offset: 0.3em;
}

/* Controls */
.carousel-nav {
  position: absolute;
  bottom: 2rem;
  left: clamp(2rem, 6vw, 6rem);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.carousel-arrow {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.carousel-arrow:hover {
  background: var(--lime);
  color: #111;
  border-color: var(--lime);
}

.carousel-dots {
  display: flex;
  gap: 0.5rem;
}

.dot-indicator {
  width: 2rem;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dot-indicator.active {
  background: var(--lime);
  width: 3rem;
}

@media (max-width: 640px) {
  .hero-slide {
    grid-template-columns: 1fr;
    align-items: end;
  }
  .hero-photo {
    grid-column: 1;
    position: absolute;
    inset: 0;
  }
  .hero-photo::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(0deg, #101310 10%, rgba(16, 19, 16, 0.8) 50%, transparent 85%);
  }
  .hero-copy {
    grid-column: 1;
    padding: 2rem 1.25rem 5rem;
  }
  .hero-title {
    font-size: clamp(3rem, 13vw, 4.5rem);
  }
  .carousel-nav {
    bottom: 1.2rem;
    left: 1.25rem;
  }
}
</style>
