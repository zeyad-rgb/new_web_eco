<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const unit = ref<'cm' | 'in'>('cm')
const activeTab = ref<'tops' | 'bottoms'>('tops')

const topsSizes = [
  { size: 'M', chestCm: '94 - 102', waistCm: '80 - 88', chestIn: '37 - 40', waistIn: '31 - 34' },
  { size: 'L', chestCm: '102 - 110', waistCm: '88 - 96', chestIn: '40 - 43', waistIn: '34 - 38' },
  { size: 'XL', chestCm: '110 - 118', waistCm: '96 - 104', chestIn: '43 - 46', waistIn: '38 - 41' },
  { size: '2XL', chestCm: '118 - 128', waistCm: '104 - 114', chestIn: '46 - 50', waistIn: '41 - 45' },
  { size: '3XL', chestCm: '128 - 138', waistCm: '114 - 124', chestIn: '50 - 54', waistIn: '45 - 49' },
]

const bottomsSizes = [
  { size: 'M', waistCm: '80 - 88', hipsCm: '94 - 102', waistIn: '31 - 34', hipsIn: '37 - 40' },
  { size: 'L', waistCm: '88 - 96', hipsCm: '102 - 110', waistIn: '34 - 38', hipsIn: '40 - 43' },
  { size: 'XL', waistCm: '96 - 104', hipsCm: '110 - 118', waistIn: '38 - 41', hipsIn: '43 - 46' },
  { size: '2XL', waistCm: '104 - 114', hipsCm: '118 - 128', waistIn: '41 - 45', hipsIn: '46 - 50' },
  { size: '3XL', waistCm: '114 - 124', hipsCm: '128 - 138', waistIn: '45 - 49', hipsIn: '50 - 54' },
]
</script>

<template>
  <div v-if="open" class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-window" role="dialog" aria-modal="true" aria-label="دليل المقاسات">
      <div class="modal-header">
        <h3>دليل المقاسات الرسمي</h3>
        <button type="button" class="close-btn" aria-label="إغلاق" @click="emit('close')">
          ✕
        </button>
      </div>

      <div class="modal-body">
        <!-- Controls -->
        <div class="modal-controls">
          <div class="tab-buttons">
            <button
              type="button"
              :class="{ active: activeTab === 'tops' }"
              @click="activeTab = 'tops'"
            >
              الملابس العلوية (تيشيرتات / سترات)
            </button>
            <button
              type="button"
              :class="{ active: activeTab === 'bottoms' }"
              @click="activeTab = 'bottoms'"
            >
              الملابس السفلية (شورتات / بناطيل)
            </button>
          </div>

          <div class="unit-toggle">
            <button
              type="button"
              :class="{ active: unit === 'cm' }"
              @click="unit = 'cm'"
            >
              سم
            </button>
            <button
              type="button"
              :class="{ active: unit === 'in' }"
              @click="unit = 'in'"
            >
              بوصة
            </button>
          </div>
        </div>

        <!-- Sizing Table -->
        <div class="table-wrap">
          <table v-if="activeTab === 'tops'" class="size-table">
            <thead>
              <tr>
                <th>المقاس</th>
                <th>محيط الصدر ({{ unit === 'cm' ? 'سم' : 'بوصة' }})</th>
                <th>محيط الخصر ({{ unit === 'cm' ? 'سم' : 'بوصة' }})</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in topsSizes" :key="row.size">
                <td><strong>{{ row.size }}</strong></td>
                <td>{{ unit === 'cm' ? row.chestCm : row.chestIn }}</td>
                <td>{{ unit === 'cm' ? row.waistCm : row.waistIn }}</td>
              </tr>
            </tbody>
          </table>

          <table v-else class="size-table">
            <thead>
              <tr>
                <th>المقاس</th>
                <th>محيط الخصر ({{ unit === 'cm' ? 'سم' : 'بوصة' }})</th>
                <th>محيط الورك ({{ unit === 'cm' ? 'سم' : 'بوصة' }})</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in bottomsSizes" :key="row.size">
                <td><strong>{{ row.size }}</strong></td>
                <td>{{ unit === 'cm' ? row.waistCm : row.waistIn }}</td>
                <td>{{ unit === 'cm' ? row.hipsCm : row.hipsIn }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Fit Guidance (Adidas Style) -->
        <div class="fit-tip">
          <div class="tip-icon">💡</div>
          <div class="tip-content">
            <strong>نصيحة المقاس المثالي:</strong>
            <p>
              إذا كنت بين مقاسين، ننصح باختيار <strong>المقاس الأصغر</strong> لقصّة رياضية محكمة على الجسم، أو <strong>المقاس الأكبر</strong> لقصّة مريحة وفضفاضة أثناء التمارين.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  max-width: 650px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  animation: popIn 0.2s ease-out;
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
  font-size: 1.2rem;
  font-weight: 700;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #555;
}

.close-btn:hover {
  color: #000;
}

.modal-body {
  padding: 1.5rem;
}

.modal-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.tab-buttons {
  display: flex;
  gap: 0.4rem;
}

.tab-buttons button {
  background: #f4f5f0;
  border: 1px solid #ddd;
  padding: 0.5rem 0.85rem;
  font-size: 0.85rem;
  cursor: pointer;
  border-radius: 4px;
}

.tab-buttons button.active {
  background: #111;
  color: #fff;
  border-color: #111;
}

.unit-toggle {
  display: flex;
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
}

.unit-toggle button {
  background: #fff;
  border: none;
  padding: 0.4rem 0.75rem;
  font-size: 0.8rem;
  cursor: pointer;
}

.unit-toggle button.active {
  background: #111;
  color: #fff;
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid #eee;
  border-radius: 6px;
  margin-bottom: 1.5rem;
}

.size-table {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
  font-size: 0.9rem;
}

.size-table th {
  background: #f8f9f6;
  padding: 0.75rem;
  font-weight: 700;
  border-bottom: 1px solid #e2e4dc;
}

.size-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
}

.size-table tr:last-child td {
  border-bottom: none;
}

.fit-tip {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  background: #f7f9f4;
  border: 1px solid #e1e7db;
  padding: 1rem;
  border-radius: 6px;
}

.tip-icon {
  font-size: 1.4rem;
}

.tip-content strong {
  display: block;
  font-size: 0.9rem;
  margin-bottom: 0.2rem;
  color: #1a2218;
}

.tip-content p {
  margin: 0;
  font-size: 0.84rem;
  color: #555;
  line-height: 1.5;
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
