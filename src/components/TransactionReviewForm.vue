<template>
  <div class="transaction-review-form">
    <el-card class="review-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">交易评价</span>
          <el-button v-if="showClose" type="text" @click="$emit('close')" class="close-btn">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </template>

      <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px">
        <!-- 总体评分 -->
        <el-form-item label="总体评分" prop="rating">
          <el-rate
            v-model="formData.rating"
            :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
            show-text
            :texts="['很差', '较差', '一般', '良好', '优秀']"
          />
        </el-form-item>

        <!-- 评价维度 -->
        <el-form-item label="沟通态度" prop="communication_score">
          <el-rate
            v-model="formData.communication_score"
            :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
            show-text
            :texts="['很差', '较差', '一般', '良好', '优秀']"
          />
        </el-form-item>

        <el-form-item label="商品描述" prop="product_accuracy_score">
          <el-rate
            v-model="formData.product_accuracy_score"
            :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
            show-text
            :texts="['很差', '较差', '一般', '良好', '优秀']"
          />
        </el-form-item>

        <el-form-item label="发货速度" prop="delivery_speed_score">
          <el-rate
            v-model="formData.delivery_speed_score"
            :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
            show-text
            :texts="['很差', '较差', '一般', '良好', '优秀']"
          />
        </el-form-item>

        <!-- 评价内容 -->
        <el-form-item label="评价内容" prop="comment">
          <el-input
            v-model="formData.comment"
            type="textarea"
            :rows="4"
            placeholder="请输入您的评价内容（选填）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <!-- 提交按钮 -->
        <el-form-item>
          <div class="form-actions">
            <el-button @click="handleCancel">取消</el-button>
            <el-button 
              type="primary" 
              :loading="loading"
              @click="handleSubmit"
            >
              提交评价
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { Close } from '@element-plus/icons-vue';
import { useCreditStore } from '@/stores/credit';
import type { ReviewFormData } from '@/types/credit';

interface Props {
  transactionId: string;
  productId: string;
  reviewedUserId: string;
  reviewType: 'buyer_to_seller' | 'seller_to_buyer';
  showClose?: boolean;
}

interface Emits {
  (e: 'success'): void;
  (e: 'close'): void;
  (e: 'cancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
  showClose: true
});

const emit = defineEmits<Emits>();

const creditStore = useCreditStore();
const formRef = ref<FormInstance>();
const loading = ref(false);

const formData = reactive<ReviewFormData>({
  rating: 5,
  comment: '',
  communication_score: 5,
  product_accuracy_score: 5,
  delivery_speed_score: 5
});

const rules: FormRules = {
  rating: [
    { required: true, message: '请选择总体评分', trigger: 'change' }
  ],
  communication_score: [
    { required: true, message: '请选择沟通态度评分', trigger: 'change' }
  ],
  product_accuracy_score: [
    { required: true, message: '请选择商品描述评分', trigger: 'change' }
  ],
  delivery_speed_score: [
    { required: true, message: '请选择发货速度评分', trigger: 'change' }
  ]
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    const valid = await formRef.value.validate();
    if (!valid) return;

    loading.value = true;

    await creditStore.submitReview(
      props.transactionId,
      props.productId,
      props.reviewedUserId,
      formData,
      props.reviewType
    );

    ElMessage.success('评价提交成功！');
    emit('success');
    
    // 重置表单
    formRef.value.resetFields();
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '提交评价失败';
    ElMessage.error(errorMessage);
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  emit('cancel');
  if (props.showClose) {
    emit('close');
  }
};

// 初始化表单
onMounted(() => {
  // 可以在这里添加一些初始化逻辑
});
</script>

<style scoped>
.transaction-review-form {
  max-width: 600px;
  margin: 0 auto;
}

.review-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.close-btn {
  padding: 0;
  color: #909399;
}

.close-btn:hover {
  color: #606266;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  width: 100%;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-rate) {
  display: inline-flex;
  align-items: center;
}

:deep(.el-rate__text) {
  margin-left: 12px;
  color: #606266;
  font-size: 14px;
}
</style>