<template>
  <div class="credit-detail-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1 class="page-title">信用详情</h1>
      <p class="page-subtitle">查看您的信用评分、交易记录和评价信息</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="6" animated />
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <el-result icon="error" title="加载失败" :sub-title="error">
        <template #extra>
          <el-button type="primary" @click="fetchCreditData">重新加载</el-button>
        </template>
      </el-result>
    </div>

    <!-- 主要内容 -->
    <div v-else-if="userCredit" class="main-content">
      <!-- 信用概览卡片 -->
      <el-card class="credit-overview-card">
        <div class="overview-content">
          <!-- 信用分数和等级 -->
          <div class="score-section">
            <div class="score-display">
              <div class="score-circle" :style="{ borderColor: creditLevelInfo?.color }">
                <span class="score-number">{{ userCredit.overall_score.toFixed(1) }}</span>
                <span class="score-label">综合信用分</span>
              </div>
              <div class="level-info">
                <div class="level-badge" :style="{ backgroundColor: creditLevelInfo?.color }">
                  {{ creditLevelInfo?.label }}
                </div>
                <p class="level-description">{{ creditLevelInfo?.description }}</p>
              </div>
            </div>
          </div>

          <!-- 信用指标 -->
          <div class="metrics-section">
            <el-row :gutter="20">
              <el-col :span="6">
                <div class="metric-item">
                  <div class="metric-value">{{ userCredit.total_transactions }}</div>
                  <div class="metric-label">总交易数</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="metric-item">
                  <div class="metric-value">{{ successRate.toFixed(1) }}%</div>
                  <div class="metric-label">交易成功率</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="metric-item">
                  <div class="metric-value">{{ userCredit.positive_reviews }}</div>
                  <div class="metric-label">好评数</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="metric-item">
                  <div class="metric-value">{{ positiveRate.toFixed(1) }}%</div>
                  <div class="metric-label">好评率</div>
                </div>
              </el-col>
            </el-row>
          </div>
        </div>
      </el-card>

      <!-- 详细信用信息 -->
      <el-row :gutter="20" class="detail-sections">
        <!-- 基础信用分 -->
        <el-col :span="8">
          <el-card class="detail-card">
            <template #header>
              <span class="card-title">基础信用分</span>
            </template>
            <div class="detail-content">
              <div class="score-breakdown">
                <div class="score-item">
                  <span class="score-name">基础分</span>
                  <span class="score-value">{{ userCredit.base_score.toFixed(1) }}</span>
                </div>
                <div class="score-item">
                  <span class="score-name">动态分</span>
                  <span class="score-value">{{ userCredit.dynamic_score.toFixed(1) }}</span>
                </div>
                <div class="score-item total">
                  <span class="score-name">综合分</span>
                  <span class="score-value">{{ userCredit.overall_score.toFixed(1) }}</span>
                </div>
              </div>
              <el-progress 
                :percentage="userCredit.overall_score" 
                :color="creditLevelInfo?.color"
                :show-text="false"
                class="score-progress"
              />
            </div>
          </el-card>
        </el-col>

        <!-- 活跃度指标 -->
        <el-col :span="8">
          <el-card class="detail-card">
            <template #header>
              <span class="card-title">活跃度指标</span>
            </template>
            <div class="detail-content">
              <div class="activity-metrics">
                <div class="activity-item">
                  <span class="activity-name">活跃度</span>
                  <el-progress 
                    :percentage="userCredit.activity_score" 
                    :color="userCredit.activity_score >= 60 ? '#52c41a' : '#faad14'"
                  />
                </div>
                <div class="activity-item">
                  <span class="activity-name">响应率</span>
                  <el-progress 
                    :percentage="userCredit.response_rate" 
                    :color="userCredit.response_rate >= 80 ? '#52c41a' : '#faad14'"
                  />
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 信用等级说明 -->
        <el-col :span="8">
          <el-card class="detail-card">
            <template #header>
              <span class="card-title">信用等级说明</span>
            </template>
            <div class="detail-content">
              <div class="level-explanation">
                <div 
                  v-for="level in CREDIT_LEVELS" 
                  :key="level.level"
                  class="level-item"
                  :class="{ active: level.level === userCredit.credit_level }"
                >
                  <span class="level-badge-small" :style="{ backgroundColor: level.color }">
                    {{ level.level }}
                  </span>
                  <span class="level-name">{{ level.label }}</span>
                  <span class="level-range">{{ level.minScore }}-{{ level.maxScore }}分</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 评价记录 -->
      <el-card class="reviews-card">
        <template #header>
          <div class="reviews-header">
            <span class="card-title">评价记录</span>
            <el-button type="primary" text @click="fetchReviews">刷新</el-button>
          </div>
        </template>
        
        <el-tabs v-model="activeReviewTab">
          <!-- 收到的评价 -->
          <el-tab-pane label="收到的评价" name="received">
            <div v-if="receivedReviews.length === 0" class="empty-state">
              <el-empty description="暂无收到的评价" />
            </div>
            <div v-else class="reviews-list">
              <div 
                v-for="review in receivedReviews" 
                :key="review.id"
                class="review-item"
              >
                <div class="review-header">
                  <el-rate 
                    v-model="review.rating" 
                    disabled 
                    size="small" 
                  />
                  <span class="review-date">{{ formatDate(review.created_at) }}</span>
                </div>
                <div class="review-content">
                  <p class="review-comment" v-if="review.comment">{{ review.comment }}</p>
                  <div class="review-dimensions" v-if="review.communication_score">
                    <span>沟通: {{ review.communication_score }}分</span>
                    <span>商品: {{ review.product_accuracy_score }}分</span>
                    <span>发货: {{ review.delivery_speed_score }}分</span>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 给出的评价 -->
          <el-tab-pane label="给出的评价" name="given">
            <div v-if="userReviews.length === 0" class="empty-state">
              <el-empty description="暂无给出的评价" />
            </div>
            <div v-else class="reviews-list">
              <div 
                v-for="review in userReviews" 
                :key="review.id"
                class="review-item"
              >
                <div class="review-header">
                  <el-rate 
                    v-model="review.rating" 
                    disabled 
                    size="small" 
                  />
                  <span class="review-date">{{ formatDate(review.created_at) }}</span>
                </div>
                <div class="review-content">
                  <p class="review-comment" v-if="review.comment">{{ review.comment }}</p>
                  <div class="review-dimensions" v-if="review.communication_score">
                    <span>沟通: {{ review.communication_score }}分</span>
                    <span>商品: {{ review.product_accuracy_score }}分</span>
                    <span>发货: {{ review.delivery_speed_score }}分</span>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </div>

    <!-- 无信用记录 -->
    <div v-else class="no-data">
      <el-result icon="info" title="暂无信用记录">
        <template #extra>
          <el-button type="primary" @click="fetchCreditData">初始化信用记录</el-button>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useCreditStore } from '@/stores/credit';
import { CREDIT_LEVELS } from '@/types/credit';

const creditStore = useCreditStore();
const activeReviewTab = ref('received');

// 计算属性
const loading = computed(() => creditStore.loading);
const error = computed(() => creditStore.error);
const userCredit = computed(() => creditStore.userCredit);
const userReviews = computed(() => creditStore.userReviews);
const receivedReviews = computed(() => creditStore.receivedReviews);
const creditLevelInfo = computed(() => creditStore.creditLevelInfo);
const successRate = computed(() => creditStore.successRate);
const positiveRate = computed(() => creditStore.positiveRate);





// 方法
const fetchCreditData = async () => {
  await creditStore.fetchUserCredit();
  await fetchReviews();
};

const fetchReviews = async () => {
  await creditStore.fetchUserReviews();
  await creditStore.fetchReceivedReviews();
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN');
};

// 生命周期
onMounted(() => {
  fetchCreditData();
});
</script>

<style scoped>
.credit-detail-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 14px;
  color: #909399;
}

.loading-container,
.error-container,
.no-data {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.credit-overview-card {
  margin-bottom: 20px;
}

.overview-content {
  padding: 20px 0;
}

.score-section {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 30px;
}

.score-display {
  display: flex;
  align-items: center;
  gap: 40px;
}

.score-circle {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  border: 4px solid;
  border-radius: 50%;
  background: #fafafa;
}

.score-number {
  font-size: 32px;
  font-weight: 700;
  color: #303133;
}

.score-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.level-info {
  text-align: center;
}

.level-badge {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 20px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.level-description {
  font-size: 14px;
  color: #606266;
  margin: 0;
}

.metrics-section {
  margin-top: 20px;
}

.metric-item {
  text-align: center;
  padding: 16px;
}

.metric-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.metric-label {
  font-size: 14px;
  color: #909399;
}

.detail-sections {
  margin-bottom: 20px;
}

.detail-card {
  height: 100%;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.detail-content {
  padding: 8px 0;
}

.score-breakdown {
  margin-bottom: 16px;
}

.score-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 0;
}

.score-item.total {
  border-top: 1px solid #e4e7ed;
  padding-top: 12px;
  margin-top: 12px;
  font-weight: 600;
}

.score-name {
  color: #606266;
}

.score-value {
  font-weight: 600;
  color: #303133;
}

.score-progress {
  margin-top: 8px;
}

.activity-metrics {
  margin-bottom: 16px;
}

.activity-item {
  margin-bottom: 16px;
}

.activity-name {
  display: block;
  margin-bottom: 8px;
  color: #606266;
  font-size: 14px;
}

.level-explanation {
  margin-bottom: 16px;
}

.level-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.3s;
}

.level-item.active {
  background-color: #f5f7fa;
}

.level-badge-small {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: white;
  font-size: 12px;
  font-weight: 600;
  margin-right: 12px;
}

.level-name {
  flex: 1;
  color: #606266;
}

.level-range {
  color: #909399;
  font-size: 12px;
}

.reviews-card {
  margin-bottom: 20px;
}

.reviews-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-state {
  padding: 40px 0;
}

.reviews-list {
  max-height: 400px;
  overflow-y: auto;
}

.review-item {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.review-item:last-child {
  border-bottom: none;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.review-date {
  font-size: 12px;
  color: #909399;
}

.review-comment {
  margin: 8px 0;
  color: #606266;
  line-height: 1.5;
}

.review-dimensions {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

@media (max-width: 768px) {
  .credit-detail-view {
    padding: 16px;
  }
  
  .score-display {
    flex-direction: column;
    gap: 20px;
  }
  
  .detail-sections .el-col {
    margin-bottom: 16px;
  }
}
</style>