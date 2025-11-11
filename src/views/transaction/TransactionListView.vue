<template>
  <div class="transaction-list-view">
    <!-- 页面头部 -->
    <div class="transaction-header">
      <div class="header-content">
        <h1 class="page-title">
          <el-icon><Document /></el-icon>
          我的交易
        </h1>
        <div class="header-stats">
          <span class="transaction-count">{{ transactionStore.totalTransactions }} 笔交易</span>
          <span class="active-count">{{ transactionStore.activeTransactions.length }} 笔进行中</span>
        </div>
      </div>
    </div>

    <!-- 交易筛选 -->
    <div class="transaction-filters">
      <el-radio-group v-model="activeTab" @change="handleTabChange">
        <el-radio-button label="all">全部交易</el-radio-button>
        <el-radio-button label="pending">待处理</el-radio-button>
        <el-radio-button label="active">进行中</el-radio-button>
        <el-radio-button label="completed">已完成</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 交易内容 -->
    <div class="transaction-content">
      <!-- 空状态 -->
      <div v-if="filteredTransactions.length === 0" class="empty-transactions">
        <div class="empty-icon">
          <el-icon><Document /></el-icon>
        </div>
        <h3>暂无交易记录</h3>
        <p>快去逛逛，发现心仪的商品吧！</p>
        <el-button type="primary" size="large" @click="$router.push('/products')">
          去逛逛
        </el-button>
      </div>

      <!-- 交易列表 -->
      <div v-else class="transactions-list">
        <div 
          v-for="transaction in filteredTransactions" 
          :key="transaction.id"
          class="transaction-card"
          @click="viewTransactionDetail(transaction.id)"
        >
          <div class="transaction-info">
            <div class="transaction-image">
              <el-image 
                :src="transaction.product_image" 
                :alt="transaction.product_name"
                fit="cover"
                class="product-image"
              >
                <template #error>
                  <div class="image-error">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
            </div>
            
            <div class="transaction-details">
              <h4 class="product-name">{{ transaction.product_name }}</h4>
              <p class="product-description">{{ transaction.product_description }}</p>
              
              <div class="transaction-meta">
                <span class="order-no">订单号: {{ transaction.order_no }}</span>
                <span class="quantity">数量: {{ transaction.quantity }}</span>
                <span class="amount">¥{{ transaction.total_amount.toFixed(2) }}</span>
              </div>
              
              <div class="transaction-parties">
                <span class="counterparty">
                  {{ isBuyer(transaction) ? '卖家' : '买家' }}: 
                  {{ isBuyer(transaction) ? transaction.seller_username : transaction.buyer_username }}
                </span>
                <span class="create-time">{{ formatTime(transaction.created_at) }}</span>
              </div>
            </div>
          </div>
          
          <div class="transaction-status">
            <el-tag 
              :type="getStatusType(transaction.status)"
              class="status-tag"
            >
              {{ getStatusText(transaction.status) }}
            </el-tag>
            
            <div class="status-actions">
              <el-button 
                v-if="showActionButton(transaction)"
                :type="getActionButtonType(transaction)"
                size="small"
                @click.stop="handleTransactionAction(transaction)"
              >
                {{ getActionButtonText(transaction) }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="transactionStore.isLoading" class="loading-overlay">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTransactionStore } from '@/stores/transaction'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { 
  Document, 
  Picture, 
  Loading 
} from '@element-plus/icons-vue'

const router = useRouter()
const transactionStore = useTransactionStore()
const userStore = useUserStore()

// 状态
const activeTab = ref('all')

// 计算属性
const filteredTransactions = computed(() => {
  switch (activeTab.value) {
    case 'pending':
      return transactionStore.pendingTransactions
    case 'active':
      return transactionStore.activeTransactions
    case 'completed':
      return transactionStore.completedTransactions
    default:
      return transactionStore.transactions
  }
})

// 生命周期
onMounted(async () => {
  await transactionStore.fetchTransactions()
})

// 方法
const isBuyer = (transaction: any) => {
  return userStore.user?.id === transaction.buyer_id
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

const showActionButton = (transaction: any) => {
  const isBuyerTransaction = isBuyer(transaction)
  
  if (isBuyerTransaction) {
    return ['pending', 'paid', 'shipped'].includes(transaction.status)
  } else {
    return ['paid'].includes(transaction.status)
  }
}

const getActionButtonType = (transaction: any) => {
  const isBuyerTransaction = isBuyer(transaction)
  
  if (isBuyerTransaction) {
    if (transaction.status === 'pending') return 'primary'
    if (transaction.status === 'shipped') return 'success'
    return 'primary'
  } else {
    return 'primary'
  }
}

const getActionButtonText = (transaction: any) => {
  const isBuyerTransaction = isBuyer(transaction)
  
  if (isBuyerTransaction) {
    switch (transaction.status) {
      case 'pending': return '去付款'
      case 'shipped': return '确认收货'
      default: return '查看'
    }
  } else {
    return '发货'
  }
}

const handleTabChange = () => {
  // 切换标签时自动刷新数据
  transactionStore.fetchTransactions()
}

const viewTransactionDetail = (transactionId: string) => {
  router.push(`/transaction/${transactionId}`)
}

const handleTransactionAction = async (transaction: any) => {
  const isBuyerTransaction = isBuyer(transaction)
  
  try {
    if (isBuyerTransaction) {
      switch (transaction.status) {
        case 'pending':
          // 跳转到支付页面
          router.push(`/transaction/${transaction.id}/payment`)
          break
        case 'shipped':
          // 确认收货
          await transactionStore.updateTransactionStatus(transaction.id, 'received', '买家确认收货')
          break
      }
    } else {
      // 卖家发货
      if (transaction.status === 'paid') {
        await transactionStore.updateTransactionStatus(transaction.id, 'shipped', '卖家已发货')
      }
    }
  } catch (error) {
    console.error('处理交易操作失败:', error)
  }
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
</script>

<style scoped>
.transaction-list-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: calc(100vh - 160px);
}

/* 页面头部 */
.transaction-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 30px;
  color: white;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.transaction-count, .active-count {
  font-size: 16px;
  font-weight: 600;
}

/* 筛选栏 */
.transaction-filters {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 空状态 */
.empty-transactions {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 80px;
  color: #dcdfe6;
  margin-bottom: 20px;
}

.empty-transactions h3 {
  font-size: 24px;
  color: #606266;
  margin-bottom: 12px;
}

.empty-transactions p {
  color: #909399;
  margin-bottom: 30px;
}

/* 交易列表 */
.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.transaction-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.transaction-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.transaction-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.transaction-image {
  width: 80px;
  height: 80px;
}

.product-image {
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

.transaction-details {
  flex: 1;
}

.product-name {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #303133;
}

.product-description {
  color: #606266;
  font-size: 14px;
  margin: 0 0 12px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.transaction-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #909399;
}

.transaction-parties {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #909399;
}

.transaction-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.status-tag {
  font-size: 14px;
  font-weight: 600;
}

.status-actions {
  display: flex;
  gap: 8px;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .transaction-list-view {
    padding: 10px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .header-stats {
    align-items: center;
  }
  
  .transaction-card {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .transaction-status {
    align-items: stretch;
    flex-direction: row;
    justify-content: space-between;
  }
  
  .transaction-meta {
    flex-wrap: wrap;
  }
  
  .transaction-parties {
    flex-direction: column;
    gap: 8px;
  }
}
</style>