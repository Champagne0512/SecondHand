<template>
  <div class="transaction-detail-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-page-header @back="goBack" content="交易详情" />
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- 交易详情内容 -->
    <div v-else-if="transaction" class="transaction-detail">
      <!-- 交易状态进度条 -->
      <div class="status-progress-section">
        <h3>交易状态</h3>
        <div class="status-progress">
          <el-steps :active="getCurrentStep" align-center finish-status="success">
            <el-step title="提交订单" :description="formatDateTime(transaction.created_at)" />
            <el-step title="付款" :description="transaction.paid_at ? formatDateTime(transaction.paid_at) : '等待付款'" />
            <el-step title="发货" :description="transaction.shipped_at ? formatDateTime(transaction.shipped_at) : '等待发货'" />
            <el-step title="收货" :description="transaction.received_at ? formatDateTime(transaction.received_at) : '等待收货'" />
            <el-step title="完成" :description="transaction.completed_at ? formatDateTime(transaction.completed_at) : '等待完成'" />
          </el-steps>
        </div>
        
        <!-- 当前状态操作 -->
        <div class="current-actions" v-if="showActionButtons">
          <el-alert
            v-if="transaction.status === 'pending' && isBuyer"
            title="请在24小时内完成付款，否则订单将自动取消"
            type="warning"
            :closable="false"
            class="action-alert"
          />
          
          <el-alert
            v-if="transaction.status === 'paid' && isSeller"
            title="买家已付款，请尽快发货"
            type="info"
            :closable="false"
            class="action-alert"
          />
          
          <el-alert
            v-if="transaction.status === 'shipped' && isBuyer"
            title="卖家已发货，收到商品后请及时确认收货"
            type="info"
            :closable="false"
            class="action-alert"
          />

          <div class="action-buttons">
            <template v-if="transaction.status === 'pending' && isBuyer">
              <el-button type="success" size="large" @click="handlePayment">
                <el-icon><Wallet /></el-icon>
                立即付款
              </el-button>
              <el-button size="large" @click="handleCancel">
                <el-icon><Close /></el-icon>
                取消订单
              </el-button>
            </template>
            
            <template v-if="transaction.status === 'paid' && isSeller">
              <el-button type="primary" size="large" @click="handleShip">
                <el-icon><Box /></el-icon>
                发货
              </el-button>
            </template>
            
            <template v-if="transaction.status === 'shipped' && isBuyer">
              <el-button type="success" size="large" @click="handleConfirmReceipt">
                <el-icon><CircleCheck /></el-icon>
                确认收货
              </el-button>
              <el-button size="large" @click="handleApplyRefund">
                <el-icon><Warning /></el-icon>
                申请退款
              </el-button>
            </template>
            
            <template v-if="transaction.status === 'received' && isBuyer">
              <el-button type="success" size="large" @click="handleComplete">
                <el-icon><CircleCheck /></el-icon>
                完成交易
              </el-button>
            </template>
          </div>
        </div>
      </div>

      <!-- 订单信息 -->
      <div class="info-section">
        <h3>订单信息</h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ transaction.id }}</el-descriptions-item>
          <el-descriptions-item label="交易状态">
            <el-tag :type="getStatusType(transaction.status)" effect="dark">
              {{ getStatusText(transaction.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(transaction.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="支付方式">
            {{ getPaymentMethodText(transaction.paymentMethod) }}
          </el-descriptions-item>
          <el-descriptions-item label="付款时间" v-if="transaction.paid_at">
            {{ formatDateTime(transaction.paid_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="发货时间" v-if="transaction.shipped_at">
            {{ formatDateTime(transaction.shipped_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="收货时间" v-if="transaction.received_at">
            {{ formatDateTime(transaction.received_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="完成时间" v-if="transaction.completed_at">
            {{ formatDateTime(transaction.completed_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="取消时间" v-if="transaction.cancelled_at">
            {{ formatDateTime(transaction.cancelled_at) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 商品信息 -->
      <div class="product-section">
        <h3>商品信息</h3>
        <el-card>
          <div class="product-info">
            <el-image
              :src="getProductImage()"
              fit="cover"
              class="product-image"
            >
              <template #error>
                <div class="image-error">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
            <div class="product-details">
              <h4>{{ transaction.product_name }}</h4>
              <p class="product-price">¥{{ transaction.product_price }}</p>
              <p class="product-quantity">数量: {{ transaction.quantity }}</p>
              <p class="product-total">小计: ¥{{ (transaction.product_price * transaction.quantity).toFixed(2) }}</p>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 交易双方信息 -->
      <div class="parties-section">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12">
            <div class="party-card">
              <h4>买家信息</h4>
              <div class="party-info">
                <div class="avatar">
                  <el-avatar :size="60" :src="getBuyerAvatar()">
                    {{ getBuyerName()?.charAt(0) }}
                  </el-avatar>
                </div>
                <div class="info">
                  <p class="name">{{ getBuyerName() }}</p>
                  <p class="contact">
                    <el-icon><Phone /></el-icon>
                    请联系买家获取联系方式
                  </p>
                  <p class="contact">
                    <el-icon><Message /></el-icon>
                    通过平台消息联系买家
                  </p>
                </div>
              </div>
            </div>
          </el-col>
          
          <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12">
            <div class="party-card">
              <h4>卖家信息</h4>
              <div class="party-info">
                <div class="avatar">
                  <el-avatar :size="60" :src="getSellerAvatar()">
                    {{ getSellerName()?.charAt(0) }}
                  </el-avatar>
                </div>
                <div class="info">
                  <p class="name">{{ getSellerName() }}</p>
                  <p class="contact">
                    <el-icon><Phone /></el-icon>
                    请联系卖家获取联系方式
                  </p>
                  <p class="contact">
                    <el-icon><Message /></el-icon>
                    通过平台消息联系卖家
                  </p>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 金额信息 -->
      <div class="amount-section">
        <h3>金额信息</h3>
        <el-card>
          <div class="amount-details">
            <div class="amount-item">
              <span class="label">商品价格:</span>
              <span class="value">¥{{ transaction.product_price }}</span>
            </div>
            <div class="amount-item">
              <span class="label">购买数量:</span>
              <span class="value">× {{ transaction.quantity }}</span>
            </div>
            <div class="amount-item total">
              <span class="label">总金额:</span>
              <span class="value">¥{{ transaction.total_amount }}</span>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 状态变更历史 -->
      <div class="history-section" v-if="statusHistory.length > 0">
        <h3>状态变更历史</h3>
        <el-timeline>
          <el-timeline-item
            v-for="(item, index) in statusHistory"
            :key="item.id"
            :type="getHistoryItemType(item)"
            :timestamp="formatDateTime(item.created_at)"
            placement="top"
          >
            <el-card>
              <p>状态从 <el-tag size="small">{{ getStatusText(item.old_status) }}</el-tag> 
                 变更为 <el-tag size="small" :type="getStatusType(item.new_status)">{{ getStatusText(item.new_status) }}</el-tag></p>
              <p v-if="item.notes" class="history-notes">{{ item.notes }}</p>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>

      <!-- 交易评价 -->
      <div class="review-section" v-if="transaction.review || transaction.status === 'completed'">
        <h3>交易评价</h3>
        <div v-if="transaction.review" class="review-content">
          <el-card>
            <div class="review-header">
              <div class="reviewer-info">
                <el-avatar :size="40" :src="getReviewerAvatar()">
                  {{ getReviewerName()?.charAt(0) }}
                </el-avatar>
                <div class="reviewer-details">
                  <p class="name">{{ getReviewerName() }}</p>
                  <p class="type">{{ transaction.review.reviewerType === 'buyer' ? '买家' : '卖家' }}评价</p>
                </div>
              </div>
              <div class="review-rating">
                <el-rate
                  v-model="transaction.review.rating"
                  disabled
                  show-score
                  text-color="#ff9900"
                />
              </div>
            </div>
            <div class="review-content-text">
              <p>{{ transaction.review.content }}</p>
            </div>
            <div class="review-images" v-if="transaction.review.images && transaction.review.images.length > 0">
              <el-image
                v-for="(image, index) in transaction.review.images"
                :key="index"
                :src="image"
                :preview-src-list="transaction.review.images"
                fit="cover"
                class="review-image"
              />
            </div>
            <div class="review-time">
              <el-icon><Clock /></el-icon>
              {{ formatDateTime(transaction.review.created_at) }}
            </div>
          </el-card>
        </div>
        
        <div v-else-if="canReview" class="review-actions">
          <el-alert
            title="交易已完成，您可以对此次交易进行评价"
            type="info"
            :closable="false"
            class="review-alert"
          />
          <el-button type="primary" size="large" @click="handleReview">
            <el-icon><Edit /></el-icon>
            去评价
          </el-button>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons-bottom" v-if="showActionButtons">
      <el-button @click="goBack">返回</el-button>
      <template v-if="transaction.status === 'pending' && isBuyer">
        <el-button type="success" @click="handlePayment">立即付款</el-button>
        <el-button @click="handleCancel">取消订单</el-button>
      </template>
      <template v-else-if="transaction.status === 'shipped' && isBuyer">
        <el-button type="success" @click="handleConfirmReceipt">确认收货</el-button>
        <el-button @click="handleApplyRefund">申请退款</el-button>
      </template>
      <template v-else-if="transaction.status === 'received' && isBuyer">
        <el-button type="success" @click="handleComplete">完成交易</el-button>
      </template>
      <template v-else-if="transaction.status === 'completed' && canReview">
        <el-button type="warning" @click="handleReview">去评价</el-button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useTransactionStore } from '@/stores/transaction'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Wallet,
  Close,
  Box,
  CircleCheck,
  Warning,
  Picture,
  Phone,
  Message,
  Clock,
  Edit
} from '@element-plus/icons-vue'
import type { TransactionDetail } from '@/types/transaction'

const route = useRoute()
const router = useRouter()
const transactionStore = useTransactionStore()

// 响应式数据
const transactionId = computed(() => route.params.id as string)
const loading = ref(false)

// 计算属性
const { currentTransaction, statusHistory, loading: storeLoading } = storeToRefs(transactionStore)
const { getStatusText, getStatusType } = transactionStore

const transaction = computed(() => currentTransaction.value)
const currentUserId = ref('')

// 加载当前用户ID
onMounted(async () => {
  currentUserId.value = await getCurrentUserId()
  await loadTransactionDetail()
})

const isBuyer = computed(() => {
  return transaction.value?.buyer_id === currentUserId.value
})
const isSeller = computed(() => {
  return transaction.value?.seller_id === currentUserId.value
})

const showActionButtons = computed(() => {
  if (!transaction.value) return false
  const status = transaction.value.status
  return ['pending', 'paid', 'shipped', 'received', 'completed'].includes(status)
})

const canReview = computed(() => {
  if (!transaction.value) return false
  return transaction.value.canReview && transaction.value.status === 'completed'
})

const getCurrentStep = computed(() => {
  if (!transaction.value) return 0
  const status = transaction.value.status
  const stepMap: Record<string, number> = {
    'pending': 0,
    'paid': 2,
    'shipped': 3,
    'received': 4,
    'completed': 5,
    'cancelled': 0,
    'refunding': 0,
    'refunded': 0
  }
  return stepMap[status] || 0
})

// 生命周期
onMounted(async () => {
  await loadTransactionDetail()
})

// 方法
async function loadTransactionDetail() {
  try {
    loading.value = true
    await transactionStore.fetchTransactionDetail(transactionId.value)
    await transactionStore.fetchTransactionStatusHistory(transactionId.value)
  } catch (error) {
    console.error('加载交易详情失败:', error)
    ElMessage.error('加载交易详情失败')
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.back()
}

function goToPayment() {
  router.push(`/transactions/${transactionId.value}/payment`)
}

function goToReview() {
  router.push(`/transactions/${transactionId.value}/review`)
}

async function handlePayment() {
  goToPayment()
}

async function handleCancel() {
  try {
    await ElMessageBox.confirm(
      '确定要取消这个订单吗？取消后无法恢复。',
      '确认取消',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await transactionStore.cancelTransaction(transactionId.value, '用户主动取消')
    ElMessage.success('订单已取消')
    await loadTransactionDetail()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消订单失败:', error)
    }
  }
}

function handleShip() {
  ElMessageBox.prompt('请输入物流信息', '发货确认', {
    confirmButtonText: '确认发货',
    cancelButtonText: '取消',
    inputPlaceholder: '请输入快递公司及单号',
    inputPattern: /^.+$/,
    inputErrorMessage: '请输入物流信息'
  }).then(async ({ value }) => {
    try {
      await transactionStore.updateTransactionStatus(transactionId.value, {
        status: 'shipped',
        notes: `已发货: ${value}`
      })
      ElMessage.success('发货成功')
      await loadTransactionDetail()
    } catch (error) {
      console.error('发货失败:', error)
      ElMessage.error('发货失败')
    }
  }).catch(() => {
    // 用户取消
  })
}

async function handleConfirmReceipt() {
  try {
    await ElMessageBox.confirm(
      '请确认您已经收到商品，确认收货后将无法撤销。',
      '确认收货',
      {
        confirmButtonText: '确定收货',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await transactionStore.confirmReceipt(transactionId.value)
    ElMessage.success('确认收货成功')
    await loadTransactionDetail()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('确认收货失败:', error)
    }
  }
}

function handleApplyRefund() {
  ElMessageBox.prompt('请输入退款原因', '申请退款', {
    confirmButtonText: '提交申请',
    cancelButtonText: '取消',
    inputPlaceholder: '请详细说明退款原因',
    inputPattern: /^.{10,}$/,
    inputErrorMessage: '退款原因至少需要10个字符'
  }).then(async ({ value }) => {
    try {
      await transactionStore.updateTransactionStatus(transactionId.value, {
        status: 'refunding',
        notes: `申请退款: ${value}`
      })
      ElMessage.success('退款申请已提交')
      await loadTransactionDetail()
    } catch (error) {
      console.error('申请退款失败:', error)
      ElMessage.error('申请退款失败')
    }
  }).catch(() => {
    // 用户取消
  })
}

async function handleComplete() {
  try {
    await transactionStore.updateTransactionStatus(transactionId.value, {
      status: 'completed',
      notes: '买家确认完成交易'
    })
    ElMessage.success('交易已完成')
    await loadTransactionDetail()
  } catch (error) {
    console.error('完成交易失败:', error)
    ElMessage.error('完成交易失败')
  }
}

function handleReview() {
  goToReview()
}

// 辅助函数
async function getCurrentUserId(): Promise<string> {
  try {
    const { getCurrentUserId } = await import('@/utils/auth')
    return await getCurrentUserId()
  } catch (error) {
    console.error('获取用户ID失败:', error)
    return ''
  }
}

function formatDateTime(dateString: string): string {
  if (!dateString) return '暂无'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getPaymentMethodText(method?: string): string {
  if (!method) return '未选择'
  const methodMap: Record<string, string> = {
    'cash': '现金交易',
    'wechat': '微信支付',
    'alipay': '支付宝',
    'bank_transfer': '银行转账'
  }
  return methodMap[method] || method
}

function getProductImage(): string {
  // 这里应该从商品信息中获取，暂时返回空字符串
  return ''
}

function getBuyerName(): string {
  return transaction.value?.buyer_username || '买家'
}

function getSellerName(): string {
  return transaction.value?.seller_username || '卖家'
}

function getBuyerAvatar(): string {
  return transaction.value?.buyer_avatar || ''
}

function getSellerAvatar(): string {
  return transaction.value?.seller_avatar || ''
}

function getReviewerName(): string {
  if (!transaction.value?.review) return ''
  return transaction.value.review.reviewerType === 'buyer' 
    ? getBuyerName() 
    : getSellerName()
}

function getReviewerAvatar(): string {
  if (!transaction.value?.review) return ''
  return transaction.value.review.reviewerType === 'buyer' 
    ? getBuyerAvatar() 
    : getSellerAvatar()
}

function getHistoryItemType(item: any): string {
  const statusTypeMap: Record<string, string> = {
    'pending': 'info',
    'paid': 'primary',
    'shipped': 'primary',
    'received': 'success',
    'completed': 'success',
    'cancelled': 'danger',
    'refunding': 'warning',
    'refunded': 'info'
  }
  return statusTypeMap[item.newStatus] || 'info'
}
</script>

<style scoped>
.transaction-detail-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;
}

.loading-container {
  padding: 40px;
  text-align: center;
}

/* 状态进度区域 */
.status-progress-section {
  background: #fff;
  border-radius: 8px;
  padding: 30px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.status-progress-section h3 {
  margin-bottom: 30px;
  color: #303133;
  font-size: 18px;
}

.status-progress {
  margin-bottom: 30px;
}

.current-actions {
  border-top: 1px solid #e4e7ed;
  padding-top: 20px;
}

.action-alert {
  margin-bottom: 15px;
}

.action-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

/* 信息区域 */
.info-section,
.product-section,
.parties-section,
.amount-section,
.history-section,
.review-section {
  background: #fff;
  border-radius: 8px;
  padding: 30px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.info-section h3,
.product-section h3,
.parties-section h3,
.amount-section h3,
.history-section h3,
.review-section h3 {
  margin-bottom: 20px;
  color: #303133;
  font-size: 18px;
}

/* 商品信息 */
.product-info {
  display: flex;
  gap: 20px;
  align-items: center;
}

.product-image {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  object-fit: cover;
}

.image-error {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #c0c4cc;
  font-size: 32px;
}

.product-details {
  flex: 1;
}

.product-details h4 {
  font-size: 18px;
  color: #303133;
  margin-bottom: 10px;
}

.product-price {
  color: #f56c6c;
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 8px;
}

.product-quantity {
  color: #606266;
  margin-bottom: 8px;
}

.product-total {
  color: #f56c6c;
  font-size: 18px;
  font-weight: bold;
}

/* 交易双方信息 */
.party-card {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
  height: 100%;
}

.party-card h4 {
  margin-bottom: 15px;
  color: #303133;
  font-size: 16px;
}

.party-info {
  display: flex;
  gap: 15px;
  align-items: center;
}

.avatar {
  flex-shrink: 0;
}

.info {
  flex: 1;
}

.name {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
}

.contact {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #909399;
  font-size: 14px;
  margin-bottom: 5px;
}

/* 金额信息 */
.amount-details {
  padding: 20px;
}

.amount-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-size: 16px;
}

.amount-item:last-child {
  margin-bottom: 0;
}

.amount-item .label {
  color: #606266;
}

.amount-item .value {
  color: #303133;
  font-weight: 500;
}

.amount-item.total .value {
  color: #f56c6c;
  font-size: 20px;
  font-weight: bold;
}

/* 评价内容 */
.review-content {
  margin-top: 20px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.reviewer-info {
  display: flex;
  gap: 12px;
  align-items: center;
}

.reviewer-details .name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.reviewer-details .type {
  color: #909399;
  font-size: 14px;
}

.review-content-text {
  margin-bottom: 15px;
  line-height: 1.6;
  color: #606266;
}

.review-images {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 15px;
}

.review-image {
  width: 100px;
  height: 100px;
  border-radius: 4px;
  object-fit: cover;
  cursor: pointer;
}

.review-time {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #909399;
  font-size: 14px;
}

.review-actions {
  margin-top: 20px;
  text-align: center;
}

.review-alert {
  margin-bottom: 20px;
}

/* 底部操作按钮 */
.action-buttons-bottom {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 15px;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .transaction-detail-container {
    padding: 15px;
  }
  
  .status-progress-section,
  .info-section,
  .product-section,
  .parties-section,
  .amount-section,
  .history-section,
  .review-section {
    padding: 20px;
  }
  
  .product-info {
    flex-direction: column;
    text-align: center;
  }
  
  .party-info {
    flex-direction: column;
    text-align: center;
  }
  
  .action-buttons,
  .action-buttons-bottom {
    flex-direction: column;
  }
  
  .review-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
}
</style>
