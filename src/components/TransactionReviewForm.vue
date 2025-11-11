<template>
  <div class="review-form">
    <h3>交易评价</h3>
    <form @submit.prevent="submitReview">
      <div class="rating-section">
        <label>评分:</label>
        <div class="star-rating">
          <span 
            v-for="star in 5" 
            :key="star"
            :class="['star', { 'active': star <= rating }]"
            @click="setRating(star)"
          >
            ★
          </span>
        </div>
        <span class="rating-text">{{ ratingText }}</span>
      </div>
      
      <div class="comment-section">
        <label>评价内容:</label>
        <textarea 
          v-model="comment" 
          placeholder="请输入您的评价..."
          maxlength="500"
          rows="4"
        ></textarea>
        <div class="char-count">{{ comment.length }}/500</div>
      </div>
      
      <div class="form-actions">
        <button type="button" @click="cancel" class="cancel-btn">取消</button>
        <button type="submit" :disabled="!canSubmit" class="submit-btn">提交评价</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTransactionStore } from '@/stores/transaction'

const props = defineProps<{
  transactionId: string
  onSuccess?: () => void
  onCancel?: () => void
}>()

const transactionStore = useTransactionStore()

const rating = ref(5)
const comment = ref('')

const ratingText = computed(() => {
  const texts = ['非常差', '差', '一般', '好', '非常好']
  return texts[rating.value - 1] || '未评分'
})

const canSubmit = computed(() => {
  return rating.value > 0 && comment.value.trim().length > 0
})

function setRating(value: number) {
  rating.value = value
}

function cancel() {
  if (props.onCancel) {
    props.onCancel()
  }
}

async function submitReview() {
  if (!canSubmit.value) return

  try {
    await transactionStore.createReview({
      transaction_id: props.transactionId,
      rating: rating.value,
      comment: comment.value.trim()
    })
    
    if (props.onSuccess) {
      props.onSuccess()
    }
  } catch (error) {
    console.error('提交评价失败:', error)
  }
}
</script>

<style scoped>
.review-form {
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  background: white;
}

.rating-section {
  margin-bottom: 20px;
}

.rating-section label {
  display: block;
  margin-bottom: 10px;
  font-weight: bold;
}

.star-rating {
  display: inline-flex;
  margin-right: 10px;
}

.star {
  font-size: 24px;
  color: #ddd;
  cursor: pointer;
  transition: color 0.2s;
}

.star.active {
  color: #ffc107;
}

.star:hover {
  color: #ffc107;
}

.rating-text {
  color: #666;
  font-size: 14px;
}

.comment-section {
  margin-bottom: 20px;
}

.comment-section label {
  display: block;
  margin-bottom: 10px;
  font-weight: bold;
}

.comment-section textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
}

.char-count {
  text-align: right;
  color: #999;
  font-size: 12px;
  margin-top: 5px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.submit-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: #007bff;
  color: white;
  cursor: pointer;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>