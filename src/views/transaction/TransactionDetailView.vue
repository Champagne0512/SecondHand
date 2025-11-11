<template>
  <div class="transaction-detail-view">
    <!-- 加载状态 -->
    <div v-if="transactionStore.isLoading" class="loading-overlay">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="!transactionStore.currentTransaction" class="error-state">
      <el-result icon="error" title="交易不存在" :sub-title="errorMessage">
        <template #extra>
          <el-button type="primary" @click="$router.push('/transactions')">
            返回交易列表
          </el-button>
        </template>
      </el-result>
    </div>

    <!-- 交易详情 -->
    <div v-else class="transaction-detail">
      <!-- 页面头部 -->
      <div class="transaction-header">
        <div class="header-content">
          <div class="header-left">
            <el-button type="text" @click="$router.push('/transactions')" class="back-btn">
              <el-icon><ArrowLeft /></el-icon>
              返回交易列表
            </el-button>
            <h1 class="page-title">交易详情</h1>
          </div>
          
          <div class="header-right">
            <el-tag 
              :type="getStatusType(transactionStore.currentTransaction.status)"
              class="status-tag"
              size="large"
            >
              {{ getStatusText(transactionStore.currentTransaction.status) }}
            </el-tag>
            <span class="order-no">订单号: {{ transactionStore.currentTransaction.order_no }}</span>
          </div>
        </div>
      </div>

      <!-- 交易内容 -->
      <div class="transaction-content">
        <!-- 商品信息 -->
        <el-card class="product-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="header-title">商品信息</span>
            </div>
          </template>

          <div class="product-info">
            <div class="product-image">
              <el-image 
                :src="transactionStore.currentTransaction.product_image" 
                :alt="transactionStore.currentTransaction.product_name"
                fit="cover"
                class="image"
              >
                <template #error>
                  <div class="image-error">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
            </div>
            
            <div class="product-details">
              <h3 class="product-name">{{ transactionStore.currentTransaction.product_name }}</h3>
              <p class="product-description">{{ transactionStore.currentTransaction.product_description }}</p>
              
              <div class="price-info">
                <span class="price">¥{{ transactionStore.currentTransaction.product_price.toFixed(2) }}</span>
                <span class="quantity">× {{ transactionStore.currentTransaction.quantity }}</span>
                <span class="total">小计: ¥{{ transactionStore.currentTransaction.total_amount.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 交易信息 -->
        <div class="info-sections">
          <!-- 交易双方 -->
          <el-card class="info-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span class="header-title">交易双方</span>
              </div>
            </template>

            <div class="parties-info">
              <div class="party">
                <span class="party-label">买家:</span>
                <div class="party-details">
                  <el-avatar 
                    :src="transactionStore.currentTransaction.buyer_avatar" 
                    :size="40"
                    class="avatar"
                  />
                  <span class="username">{{ transactionStore.currentTransaction.buyer_username }}</span>
                </div>
              </div>
              
              <div class="party">
                <span class="party-label">卖家:</span>
                <div class="party-details">
                  <el-avatar 
                    :src="transactionStore.currentTransaction.seller_avatar" 
                    :size="40"
                    class="avatar"
                  />
                  <span class="username">{{ transactionStore.currentTransaction.seller_username }}</span>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 交易状态历史 -->
          <el-card class="info-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span class="header-title">状态历史</span>
              </div>
            </template>

            <div class="status-history">
              <el-timeline>
                <el-timeline-item
                  v-for="history in transactionStore.transactionStatusHistory"
                  :key="history.id"
                  :timestamp="formatTime(history.created_at)"
                  :type="getStatusType(history.to_status)"
                >
                  <p>
                    <strong>{{ history.changed_by_username }}</strong> 
                    将状态从 
                    <el-tag size="small" :type="getStatusType(history.from_status)">
                      {{ getStatusText(history.from_status) }}
                    </el-tag>
                    改为
                    <el-tag size="small" :type="getStatusType(history.to_status)">
                      {{ getStatusText(history.to_status) }}
                    </el-tag>
                  </p>
                  <p v-if="history.reason" class="reason">{{ history.reason }}</p>
                </el-timeline-item>
              </el-timeline>
            </div>
          </el-card>

          <!-- 交易消息 -->
          <el-card class="info-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span class="header-title">交易沟通</span>
              </div>
            </template>

            <div class="transaction-messages">
              <div class="messages-list">
                <div 
                  v-for="message in transactionStore.transactionMessages"
                  :key="message.id"
                  :class="['message-item', { 'own-message': isOwnMessage(message) }]"
                >
                  <div class="message-avatar">
                    <el-avatar 
                      :src="message.sender_avatar" 
                      :size="32"
                    />
                  </div>
                  
                  <div class="message-content">
                    <div class="message-header">
                      <span class="sender-name">{{ message.sender_username }}</span>
                      <span class="message-time">{{ formatTime(message.created_at) }}</span>
                    </div>
                    
                    <div class="message-body">
                      <p>{{ message.content }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 发送消息 -->
              <div class="message-input">
                <el-input
                  v-model="newMessage"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入消息内容..."
                  maxlength="500"
                  show-word-limit
                />
                
                <div class="input-actions">
                  <el-button 
                    type="primary" 
                    :disabled="!newMessage.trim()"
                    @click="sendMessage"
                  >
                    发送消息
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button 
            v-if="showActionButton"
            :type="getActionButtonType"
            size="large"
            @click="handleTransactionAction"
          >
            {{ getActionButtonText }}
          </el-button>
          
          <el-button 
            v-if="showContactButton"
            type="default"
            size="large"
            @click="handleContact"
          >
            联系{{ isBuyer ? '卖家' : '买家' }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTransactionStore } from '@/stores/transaction'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { 
  Loading, 
  Picture, 
  ArrowLeft 
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const transactionStore = useTransactionStore()
const userStore = useUserStore()

// 状态
const newMessage = ref('')
const errorMessage = ref('')

// 计算属性
const isBuyer = computed(() => {
  if (!transactionStore.currentTransaction || !userStore.user) return false
  return userStore.user.id === transactionStore.currentTransaction.buyer_id
})

const showActionButton = computed(() => {
  if (!transactionStore.currentTransaction) return false
  
  const status = transactionStore.currentTransaction.status
  
  if (isBuyer.value) {
    return ['pending', 'paid', 'shipped'].includes(status)
  } else {
    return ['paid'].includes(status)
  }
})

const showContactButton = computed(() => {
  return transactionStore.currentTransaction !== null
})

const getActionButtonType = computed(() => {
  if (!transactionStore.currentTransaction) return 'primary'
  
  if (isBuyer.value) {
    if (transactionStore.currentTransaction.status === 'pending') return 'primary'
    if (transactionStore.currentTransaction.status === 'shipped') return 'success'
    return 'primary'
  } else {
    return 'primary'
  }
})

const getActionButtonText = computed(() => {
  if (!transactionStore.currentTransaction) return ''
  
  if (isBuyer.value) {
    switch (transactionStore.currentTransaction.status) {
      case 'pending': return '去付款'
      case 'shipped': return '确认收货'
      default: return '查看'
    }
  } else {
    return '发货'
  }
})

// 生命周期
onMounted(async () => {
  await loadTransactionDetail()
})

watch(() => route.params.id, async (newId) => {
  if (newId) {
    await loadTransactionDetail()
  }
})

// 方法
const loadTransactionDetail = async () => {
  const transactionId = route.params.id as string
  
  if (!transactionId) {
    errorMessage.value = '交易ID不存在'
    return
  }

  try {
    await transactionStore.fetchTransactionDetail(transactionId)
  } catch (error) {
    console.error('加载交易详情失败:', error)
    errorMessage.value = error instanceof Error ? error.message : '加载交易详情失败'
  }
}

const getStatusType = (status: string) => {
  const typeMap: Record<string, any> = {
    'pending': 'warning',
    'paid': 'primary',
    'shipped': 'info',
    'received': 'success',
    'completed': 'success',
    'cancelled': 'danger',
    'refunding': 'warning',
    'refunded': 'info'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    'pending': '待付款',
    'paid': '已付款',
    'shipped': '已发货',
    'received': '已收货',
    'completed': '已完成',
    'cancelled': '已取消',
    'refunding': '退款中',
    'refunded': '已退款'
  }
  return textMap[status] || status
}

const isOwnMessage = (message: any) => {
  return userStore.user?.id === message.sender_id
}

const formatTime = (timeString: string) => {
  return new Date(timeString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const sendMessage = async () => {
  if (!newMessage.value.trim()) return
  
  try {
    await transactionStore.sendTransactionMessage(
      route.params.id as string,
      newMessage.value
    )
    
    newMessage.value = ''
    ElMessage.success('消息发送成功')
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败')
  }
}

const handleTransactionAction = async () => {
  if (!transactionStore.currentTransaction) return
  
  try {
    if (isBuyer.value) {
      switch (transactionStore.currentTransaction.status) {
        case 'pending':
          // 跳转到支付页面
          router.push(`/transaction/${transactionStore.currentTransaction.id}/payment`)
          break
        case 'shipped':
          // 确认收货
          await transactionStore.updateTransactionStatus(
            transactionStore.currentTransaction.id, 
            'received', 
            '买家确认收货'
          )
          break
      }
    } else {
      // 卖家发货
      if (transactionStore.currentTransaction.status === 'paid') {
        await transactionStore.updateTransactionStatus(
          transactionStore.currentTransaction.id, 
          'shipped', 
          '卖家已发货'
        )
      }
    }
  } catch (error) {
    console.error('处理交易操作失败:', error)
  }
}

const handleContact = () => {
  // 这里可以跳转到私信页面或者直接发送消息
  newMessage.value = `你好，我是${isBuyer.value ? '买家' : '卖家'}，关于订单 ${transactionStore.currentTransaction?.order_no} 想和你沟通一下。`
}
</script>

<style scoped>
.transaction-detail-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: calc(100vh - 160px);
}

/* 加载状态 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-icon {
  font-size: 40px;
  color: #409eff;
  margin-bottom: 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 错误状态 */
.error-state {
  text-align: center;
  padding: 80px 20px;
}

/* 页面头部 */
.transaction-header {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  color: #409eff;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-tag {
  font-size: 16px;
  font-weight: 600;
}

.order-no {
  color: #606266;
  font-size: 14px;
}

/* 交易内容 */
.transaction-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 商品信息 */
.product-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.product-info {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.product-image {
  width: 120px;
  height: 120px;
}

.image {
  width: 100%;
  height: 100%;
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
  border-radius: 8px;
  color: #c0c4cc;
}

.product-details {
  flex: 1;
}

.product-name {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #303133;
}

.product-description {
  color: #606266;
  font-size: 14px;
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.price-info {
  display: flex;
  gap: 16px;
  align-items: center;
}

.price {
  font-size: 18px;
  font-weight: 600;
  color: #f56c6c;
}

.quantity {
  color: #909399;
  font-size: 14px;
}

.total {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

/* 信息区块 */
.info-sections {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.info-card {
  border-radius: 12px;
}

/* 交易双方 */
.parties-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.party {
  display: flex;
  align-items: center;
  gap: 12px;
}

.party-label {
  width: 60px;
  font-weight: 500;
  color: #606266;
}

.party-details {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar {
  border: 2px solid #e4e7ed;
}

.username {
  font-weight: 500;
  color: #303133;
}

/* 状态历史 */
.status-history {
  max-height: 300px;
  overflow-y: auto;
}

.reason {
  color: #909399;
  font-size: 14px;
  margin-top: 4px;
  font-style: italic;
}

/* 交易消息 */
.transaction-messages {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.messages-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
}

.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.message-item:last-child {
  margin-bottom: 0;
}

.message-item.own-message {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px;
}

.message-item.own-message .message-content {
  background: #409eff;
  color: white;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.sender-name {
  font-weight: 600;
  font-size: 14px;
}

.message-item.own-message .sender-name {
  color: white;
}

.message-time {
  font-size: 12px;
  color: #909399;
}

.message-item.own-message .message-time {
  color: rgba(255, 255, 255, 0.8);
}

.message-body p {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
}

.message-input {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .transaction-detail-view {
    padding: 10px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .header-right {
    justify-content: space-between;
  }
  
  .product-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .info-sections {
    grid-template-columns: 1fr;
  }
  
  .price-info {
    flex-direction: column;
    gap: 8px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .message-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .message-item.own-message {
    flex-direction: column;
    align-items: flex-end;
  }
}
</style>