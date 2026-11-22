<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <section class="not-found-page" aria-labelledby="not-found-title">
    <div class="not-found-container">
      <div class="glitch-code" aria-hidden="true">
        <span>4</span>
        <span class="lime-digit">0</span>
        <span>4</span>
      </div>

      <div class="not-found-badge">خارج نطاق الملعب</div>

      <h1 id="not-found-title">الصفحة التي تبحث عنها غير متوفرة</h1>
      
      <p class="not-found-desc">
        يبدو أن الرابط الذي اتبعته قد تم نقله أو حذفه، أو أنك أدخلت عنواناً غير صحيح.
        لا تتوقف عن الحركة، تابع جولتك في التشكيلة الرياضية الآن!
      </p>

      <div class="action-buttons">
        <router-link to="/" class="primary cta-btn">
          العودة للرئيسية 🏠
        </router-link>
        <router-link to="/shop" class="secondary cta-btn">
          تصفح كل المنتجات 👟
        </router-link>
      </div>

      <div class="quick-links">
        <span class="quick-label">روابط سريعة قد تهمك:</span>
        <div class="quick-tags">
          <router-link :to="{ path: '/shop', query: { collection: 'latest' } }" class="quick-tag">
            🔥 وصل حديثاً
          </router-link>
          <router-link :to="{ path: '/shop', query: { collection: 'bestsellers' } }" class="quick-tag">
            ⭐ الأكثر مبيعاً
          </router-link>
          <router-link to="/profile" class="quick-tag">
            📦 تتبع شحنتك
          </router-link>
          <router-link to="/faq" class="quick-tag">
            ❓ الأسئلة الشائعة
          </router-link>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.not-found-page {
  min-height: 75vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 1.5rem;
  background: linear-gradient(180deg, #f8f9f6 0%, #edf0ea 100%);
  text-align: center;
}

.not-found-container {
  max-width: 600px;
  animation: fade-in 0.5s ease both;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.glitch-code {
  font-family: Arial, sans-serif;
  font-size: clamp(6rem, 15vw, 10rem);
  font-weight: 900;
  line-height: 0.9;
  letter-spacing: -0.06em;
  color: #111210;
  display: flex;
  justify-content: center;
  user-select: none;
  margin-bottom: 1rem;
}

.lime-digit {
  color: var(--lime, #d5fb52);
  text-shadow: 0 4px 20px rgba(213, 251, 82, 0.4);
  transform: translateY(-4px);
  display: inline-block;
}

.not-found-badge {
  display: inline-block;
  background: #111210;
  color: #fff;
  font-size: 0.82rem;
  font-weight: 800;
  padding: 0.35rem 1rem;
  border-radius: 999px;
  letter-spacing: 0.05em;
  margin-bottom: 1.5rem;
  text-transform: uppercase;
}

h1 {
  font-size: clamp(1.5rem, 3.5vw, 2.2rem);
  font-weight: 800;
  margin: 0 0 1rem;
  color: #111;
  letter-spacing: -0.02em;
}

.not-found-desc {
  color: #666;
  font-size: 1rem;
  line-height: 1.7;
  margin: 0 auto 2.5rem;
  max-width: 480px;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 3rem;
}

.cta-btn {
  min-height: 3.25rem;
  padding: 0 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 4px;
}

.quick-links {
  border-top: 1px solid #e2e4dc;
  padding-top: 2rem;
}

.quick-label {
  display: block;
  font-size: 0.85rem;
  color: #777;
  margin-bottom: 0.85rem;
}

.quick-tags {
  display: flex;
  justify-content: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.quick-tag {
  background: #fff;
  border: 1px solid #d5d8cd;
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
  transition: all 0.2s ease;
  text-decoration: none;
}

.quick-tag:hover {
  border-color: #111;
  background: #111;
  color: #fff;
  transform: translateY(-2px);
}
</style>
