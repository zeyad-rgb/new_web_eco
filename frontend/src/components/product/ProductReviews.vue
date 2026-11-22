<script setup lang="ts">
import { ref } from 'vue'
import { useUIStore } from '../../stores/ui'

const ui = useUIStore()

interface ReviewItem {
  id: string
  author: string
  rating: number
  date: string
  verified: boolean
  title: string
  comment: string
  fitFeedback: 'ضيق' | 'مظبوط' | 'واسع'
  helpfulCount: number
}

const reviews = ref<ReviewItem[]>([
  {
    id: '1',
    author: 'كريم محمود',
    rating: 5,
    date: 'منذ ٣ أيام',
    verified: true,
    title: 'خامة قطنية ممتازة ومريحة جداً في الجيم',
    comment:
      'التيشيرت خفيف ومريح في التمرين الشديد ومبيحتفظش بالعرق. المقاس مظبوط تماماً والتوصيل كان في خلال ٤٨ ساعة فقط.',
    fitFeedback: 'مظبوط',
    helpfulCount: 14,
  },
  {
    id: '2',
    author: 'عمر عادل',
    rating: 5,
    date: 'منذ أسبوع',
    verified: true,
    title: 'جودة تضاهي البراندات العالمية',
    comment:
      'بصراحة اتفاجئت من جودة التقفيل والخياطة. غسلته مرتين ومفيش أي انكماش أو بهتان في اللون الأسود. أنصح بيه بشدة.',
    fitFeedback: 'مظبوط',
    helpfulCount: 9,
  },
  {
    id: '3',
    author: 'أحمد سعيد',
    rating: 4,
    date: 'منذ أسبوعين',
    verified: true,
    title: 'ممتاز ولكن خذ مقاسك بدقة',
    comment:
      'المنتج رائع وخامته تستاهل كل قرش، لو بتحب القصة الفضفاضة الـ Oversized ممكن تاخد مقاس أكبر درجة.',
    fitFeedback: 'ضيق',
    helpfulCount: 5,
  },
])

// Filter / Sort
const selectedRatingFilter = ref<number | null>(null)
const writeModalOpen = ref(false)

// New review form
const newAuthor = ref('')
const newRating = ref(5)
const newTitle = ref('')
const newComment = ref('')
const newFit = ref<'ضيق' | 'مظبوط' | 'واسع'>('مظبوط')
const reviewSubmitted = ref(false)

function submitReview() {
  if (!newAuthor.value || !newTitle.value || !newComment.value) return

  reviews.value.unshift({
    id: crypto.randomUUID(),
    author: newAuthor.value,
    rating: newRating.value,
    date: 'اليوم',
    verified: true,
    title: newTitle.value,
    comment: newComment.value,
    fitFeedback: newFit.value,
    helpfulCount: 1,
  })

  ui.showToast('شكراً لمشاركتك! تم نشر تقييمك بنجاح', 'success', '⭐')
  reviewSubmitted.value = true
  setTimeout(() => {
    writeModalOpen.value = false
    reviewSubmitted.value = false
    newAuthor.value = ''
    newTitle.value = ''
    newComment.value = ''
  }, 1800)
}

function voteHelpful(review: ReviewItem) {
  review.helpfulCount++
  ui.showToast('شكراً لمساعدتك في إفادة المتسوقين الرياضيين!', 'info', '👍', 2000)
}
</script>

<template>
  <section class="reviews-section" aria-label="تقييمات وآراء العملاء">
    <div class="reviews-header">
      <div>
        <h2>تقييمات وآراء العملاء</h2>
        <div class="stars-summary">
          <span class="stars-val">★★★★★</span>
          <strong>٤.٨ من ٥</strong>
          <span>(بناءً على ٢٨ تقييم معتمد)</span>
        </div>
      </div>

      <button type="button" class="write-review-btn" @click="writeModalOpen = true">
        ✍️ أضف تقييمك وتجربتك
      </button>
    </div>

    <!-- Rating Breakdown & Fit Meters (Adidas Style) -->
    <div class="breakdown-grid">
      <!-- Ratings Histogram -->
      <div class="histogram-card">
        <h4>توزيع النجوم</h4>
        <div class="histo-row">
          <span>٥ نجوم</span>
          <div class="bar-track"><div class="bar-fill" style="width: 85%"></div></div>
          <span class="count-val">٨٥٪</span>
        </div>
        <div class="histo-row">
          <span>٤ نجوم</span>
          <div class="bar-track"><div class="bar-fill" style="width: 12%"></div></div>
          <span class="count-val">١٢٪</span>
        </div>
        <div class="histo-row">
          <span>٣ نجوم</span>
          <div class="bar-track"><div class="bar-fill" style="width: 3%"></div></div>
          <span class="count-val">٣٪</span>
        </div>
        <div class="histo-row">
          <span>نجمتان</span>
          <div class="bar-track"><div class="bar-fill" style="width: 0%"></div></div>
          <span class="count-val">٠٪</span>
        </div>
        <div class="histo-row">
          <span>نجمة واحدة</span>
          <div class="bar-track"><div class="bar-fill" style="width: 0%"></div></div>
          <span class="count-val">٠٪</span>
        </div>
      </div>

      <!-- Fit Feedback Indicators -->
      <div class="fit-indicators-card">
        <h4>تجارب المقاس والراحة</h4>
        <div class="meter-group">
          <div class="meter-label">
            <span>مدى دقة المقاس:</span>
            <strong>مظبوط تماماً (True to Size)</strong>
          </div>
          <div class="fit-bar">
            <span class="segment">ضيق (٨٪)</span>
            <span class="segment highlighted">مظبوط (٨٨٪)</span>
            <span class="segment">واسع (٤٪)</span>
          </div>
        </div>

        <div class="meter-group">
          <div class="meter-label">
            <span>مستوى الراحة أثناء التمرين:</span>
            <strong>٩٦٪ ينصحون به</strong>
          </div>
          <div class="fit-bar simple">
            <div class="fit-bar-fill" style="width: 96%"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Review Cards List -->
    <div class="reviews-list">
      <article v-for="item in reviews" :key="item.id" class="review-card">
        <div class="review-meta-top">
          <div class="author-block">
            <strong>{{ item.author }}</strong>
            <span v-if="item.verified" class="verified-tag">✓ مشتري معتمد</span>
          </div>
          <span class="review-date">{{ item.date }}</span>
        </div>

        <div class="review-stars-row">
          <span class="review-stars">
            {{ '★'.repeat(item.rating) + '☆'.repeat(5 - item.rating) }}
          </span>
          <span class="fit-tag">المقاس: {{ item.fitFeedback }}</span>
        </div>

        <h4 class="review-title">{{ item.title }}</h4>
        <p class="review-comment">{{ item.comment }}</p>

        <div class="review-footer">
          <span>هل كان هذا التقييم مفيداً لك؟</span>
          <button type="button" class="helpful-btn" @click="voteHelpful(item)">
            👍 مفيد ({{ item.helpfulCount }})
          </button>
        </div>
      </article>
    </div>

    <!-- Write Review Modal -->
    <div v-if="writeModalOpen" class="modal-backdrop" @click.self="writeModalOpen = false">
      <div class="modal-window" role="dialog" aria-modal="true" aria-label="كتابة تقييم">
        <div class="modal-header">
          <h3>كتابة تقييم للمنتج</h3>
          <button type="button" class="close-btn" @click="writeModalOpen = false">✕</button>
        </div>

        <div class="modal-body">
          <div v-if="reviewSubmitted" class="success-box">
            ✓ شكراً لمشاركتك! تم نشر تقييمك بنجاح.
          </div>

          <form v-else class="review-form" @submit.prevent="submitReview">
            <label>
              اسمك المستعار *
              <input v-model.trim="newAuthor" required placeholder="مثال: أحمد ع." />
            </label>

            <label>
              تقييمك بالنجوم
              <select v-model.number="newRating">
                <option :value="5">★★★★★ (ممتاز - ٥ نجوم)</option>
                <option :value="4">★★★★☆ (جيد جداً - ٤ نجوم)</option>
                <option :value="3">★★★☆☆ (متوسط - ٣ نجوم)</option>
                <option :value="2">★★☆☆☆ (أقل من المتوقع - نجمتان)</option>
                <option :value="1">★☆☆☆☆ (ضعيف - نجمة واحدة)</option>
              </select>
            </label>

            <label>
              رأيك في مقاس القطعة
              <select v-model="newFit">
                <option value="مظبوط">مظبوط تماماً مع المقاس المعتاد</option>
                <option value="ضيق">أصغر قليلاً من المقاس المعتاد</option>
                <option value="واسع">أكبر وأوسع من المقاس المعتاد</option>
              </select>
            </label>

            <label>
              عنوان التقييم *
              <input v-model.trim="newTitle" required placeholder="مثال: خامة رائعة وقصة مريحة" />
            </label>

            <label>
              تفاصيل تجربتك مع المنتج *
              <textarea
                v-model.trim="newComment"
                rows="4"
                required
                placeholder="اكتب عن الخامة، مقاسها، راحتها أثناء التمارين…"
              ></textarea>
            </label>

            <button type="submit" class="primary wide submit-rev-btn">
              نشر التقييم الآن
            </button>
          </form>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.reviews-section {
  max-width: 1440px;
  margin: 4rem auto 0;
  padding-top: 2.5rem;
  border-top: 1px solid #e1e3dd;
}

.reviews-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.reviews-header h2 {
  margin: 0 0 0.4rem;
  font-size: clamp(1.5rem, 3vw, 2rem);
}

.stars-summary {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  font-size: 0.95rem;
}

.stars-val {
  color: #111;
  font-size: 1.2rem;
  letter-spacing: 0.1em;
}

.write-review-btn {
  background: #111210;
  color: #fff;
  border: 1px solid #111210;
  padding: 0.75rem 1.4rem;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.write-review-btn:hover {
  background: var(--lime);
  color: #111;
  border-color: var(--lime);
}

/* Breakdown Grid */
.breakdown-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2.5rem;
  background: #fff;
  border: 1px solid #e5e7e0;
  border-radius: 8px;
  padding: 1.75rem;
}

.histogram-card h4,
.fit-indicators-card h4 {
  margin: 0 0 1rem;
  font-size: 1rem;
  font-weight: 700;
}

.histo-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
}

.histo-row span:first-child {
  width: 55px;
}

.bar-track {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 999px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: #111;
}

.count-val {
  width: 35px;
  text-align: end;
  color: #666;
}

.meter-group {
  margin-bottom: 1.25rem;
}

.meter-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.86rem;
  margin-bottom: 0.45rem;
}

.fit-bar {
  display: flex;
  height: 26px;
  background: #f4f5f0;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #e1e3dd;
}

.fit-bar .segment {
  flex: 1;
  display: grid;
  place-items: center;
  font-size: 0.75rem;
  color: #666;
  border-inline-end: 1px solid #e1e3dd;
}

.fit-bar .segment:last-child {
  border-inline-end: none;
}

.fit-bar .segment.highlighted {
  background: #111210;
  color: #fff;
  font-weight: 700;
}

.fit-bar.simple {
  height: 8px;
  background: #f0f0f0;
  border: none;
  border-radius: 999px;
}

.fit-bar-fill {
  height: 100%;
  background: #2e7d32;
  border-radius: 999px;
}

/* Reviews List */
.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.review-card {
  background: #fff;
  border: 1px solid #e5e7e0;
  border-radius: 8px;
  padding: 1.5rem;
}

.review-meta-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.author-block {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.author-block strong {
  font-size: 0.95rem;
}

.verified-tag {
  background: #e8f5e9;
  color: #2e7d32;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 2px;
}

.review-date {
  font-size: 0.8rem;
  color: #888;
}

.review-stars-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 0.6rem;
}

.review-stars {
  color: #111;
  font-size: 1.1rem;
}

.fit-tag {
  background: #f5f6f2;
  padding: 0.2rem 0.55rem;
  border-radius: 3px;
  font-size: 0.78rem;
  color: #555;
}

.review-title {
  margin: 0 0 0.4rem;
  font-size: 1.05rem;
  font-weight: 700;
}

.review-comment {
  margin: 0 0 1rem;
  color: #444;
  line-height: 1.6;
  font-size: 0.92rem;
}

.review-footer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.82rem;
  color: #777;
  border-top: 1px solid #f2f2f2;
  padding-top: 0.75rem;
}

.helpful-btn {
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.25rem 0.6rem;
  font-size: 0.8rem;
  cursor: pointer;
  color: #333;
}

.helpful-btn:hover {
  border-color: #111;
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(17, 18, 16, 0.65);
  backdrop-filter: blur(4px);
  z-index: 120;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

.modal-window {
  width: 100%;
  max-width: 540px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.15rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
}

.modal-body {
  padding: 1.5rem;
}

.review-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.review-form label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.88rem;
  font-weight: 600;
}

.review-form input,
.review-form select,
.review-form textarea {
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.95rem;
  font-family: inherit;
}

.submit-rev-btn {
  min-height: 3rem;
  margin-top: 0.5rem;
}

.success-box {
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
  padding: 1.5rem;
  text-align: center;
  border-radius: 6px;
  font-weight: 700;
}

@media (max-width: 768px) {
  .breakdown-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
</style>
