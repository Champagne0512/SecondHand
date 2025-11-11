<template>
  <div class="transactions-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>我的交易</h1>
      <p>管理您的购买和销售记录</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards" v-if="transactionStats">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <div class="stat-card">
            <div class="stat-icon pending">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ transactionStats.pendingTransactions }}</div>
              <div class="stat-label">待处理</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <div class="stat-card">
            <div class="stat-icon completed">
              <el-icon><Check /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ transactionStats.completedTransactions }}</div>
              <div class="stat-label">已完成</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <div class="stat-card">
            <div class="stat-icon total">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ transactionStats.totalTransactions }}</div>
              <div class="stat-label">总交易</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <div class="stat-card">
            <div class="stat-icon rating">
              <el-icon><Star /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ transactionStats.averageRating.toFixed(1) }}</div>
              <div class="stat-label">平均评分</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 筛选和标签页 -->
    <div class="filter-section">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="全部交易" name="all">
          <template #label>
            <span>全部交易 <el-tag size="small">{{ transactions.length }}</el-tag></span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="待处理" name="pending">
          <template #label>
            <span>待处理 <el-tag type="warning" size="small">{{ pendingTransactions.length }}</el-tag></span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="已完成" name="completed">
          <template #label>
            <span>已完成 <el-tag type="success" size="small">{{ completedTransactions.length }}</el-tag></span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="已取消" name="cancelled">
          <template #label>
            <span>已取消 <el-tag type="info" size="small">{{ cancelledTransactions.length }}</el-tag></span>
          </template>
        </el-tab-pane>
      </el-tabs>

      <!-- 高级筛选 -->
      <div class="advanced-filter">
        <el-form :inline="true" :model="filterForm" class="filter-form">
          <el-form-item label="交易类型">
            <el-select v-model="filterForm.type" placeholder="全部类型" clearable style="width: 120px">
              <el-option label="我买入的" value="buy" />
              <el-option label="我卖出的" value="sell" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width: 120px">
              <el-option label="待付款" value="pending" />
              <el-option label="已付款" value="paid" />
              <el-option label="已发货" value="shipped" />
              <el-option label="已收货" value="received" />
              <el-option label="已完成" value="completed" />
              <el-option label="已取消" value="cancelled" />
            </el-select>
          </el-form-item>
          <el-form-item label="日期范围">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 240px"
            />
          </el-form-item>
          <el-form-item label="关键词">
            <el-input
              v-model="filterForm.keyword"
              placeholder="商品名称或订单号"
              clearable
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch" :icon="Search">搜索</el-button>
            <el-button @click="handleReset" :icon="Refresh">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 交易列表 -->
    <div class="transactions-list">
      <!-- 调试信息面板 -->
      <div v-if="showDebugInfo" class="debug-panel">
        <el-alert
          title="调试信息"
          type="info"
          :closable="true"
          @close="showDebugInfo = false"
        >
          <div class="debug-content">
            <p><strong>当前用户ID:</strong> {{ currentUserId }}</p>
            <p><strong>交易总数:</strong> {{ transactions.length }}</p>
            <p><strong>筛选后交易数:</strong> {{ filteredTransactions.length }}</p>
            <p><strong>加载状态:</strong> {{ loading ? '加载中' : '已完成' }}</p>
            <p v-if="error"><strong>错误信息:</strong> {{ error }}</p>
            <el-button size="small" @click="refreshData">刷新数据</el-button>
            <el-button size="small" @click="checkDataIntegrity">检查数据完整性</el-button>
          </div>
        </el-alert>
      </div>
      
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="3" animated />
      </div>
      
      <div v-else-if="filteredTransactions.length === 0" class="empty-container">
        <el-empty description="暂无交易记录">
          <template #description>
            <div class="empty-description">
              <p>暂无交易记录</p>
              <p v-if="error" class="error-hint">{{ error }}</p>
              <el-button size="small" @click="showDebugInfo = true">显示调试信息</el-button>
            </div>
          </template>
          <el-button type="primary" @click="$router.push('/products')">去购物</el-button>
        </el-empty>
      </div>
      
      <div v-else class="transaction-cards">
        <div v-for="transaction in filteredTransactions" :key="transaction.id" class="transaction-card">
          <!-- 交易头部 -->
          <div class="transaction-header">
            <div class="order-info">
              <span class="order-no">订单号：{{ transaction.id }}</span>
              <span class="created-at">{{ formatDate(transaction.created_at) }}</span>
            </div>
            <div class="transaction-status">
              <el-tag :type="getStatusType(transaction.status)" effect="plain">
                {{ getStatusText(transaction.status) }}
              </el-tag>
            </div>
          </div>

          <!-- 交易内容 -->
          <div class="transaction-content" @click="goToDetail(transaction.id)">
            <div class="product-info">
              <el-image
                :src="getProductImage(transaction)"
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
                <h3 class="product-name">{{ transaction.product_name }}</h3>
                <p class="product-price">¥{{ transaction.product_price }}</p>
                <p class="quantity">数量：{{ transaction.quantity }}</p>
              </div>
            </div>
            
            <div class="transaction-info">
              <div class="buyer-seller">
                <template v-if="isBuyer(transaction)">
                  <span class="label">卖家：</span>
                  <span class="value">{{ getSellerName(transaction) }}</span>
                </template>
                <template v-else>
                  <span class="label">买家：</span>
                  <span class="value">{{ getBuyerName(transaction) }}</span>
                </template>
              </div>
              <div class="total-amount">
                <span class="label">总金额：</span>
                <span class="amount">¥{{ transaction.total_amount }}</span>
              </div>
            </div>
          </div>

          <!-- 交易操作 -->
          <div class="transaction-actions">
            <el-button 
              type="primary" 
              size="small" 
              @click="goToDetail(transaction.id)"
            >
              查看详情
            </el-button>
            
            <template v-if="transaction.status === 'pending' && isBuyer(transaction)">
              <el-button 
                type="success" 
                size="small"
                @click="handlePayment(transaction)"
              >
                立即付款
              </el-button>
              <el-button 
                size="small"
                @click="handleCancel(transaction)"
              >
                取消订单
              </el-button>
            </template>
            
            <template v-if="transaction.status === 'paid' && isSeller(transaction)">
              <el-button 
                type="primary" 
                size="small"
                @click="handleShip(transaction)"
              >
                发货
              </el-button>
            </template>
            
            <template v-if="transaction.status === 'shipped' && isBuyer(transaction)">
              <el-button 
                type="success" 
                size="small"
                @click="handleConfirmReceipt(transaction)"
              >
                确认收货
              </el-button>
            </template>
            
            <template v-if="transaction.status === 'received' && isBuyer(transaction)">
              <el-button 
                type="success" 
                size="small"
                @click="handleComplete(transaction)"
              >
                完成交易
              </el-button>
            </template>
            
            <template v-if="transaction.canReview && transaction.status === 'completed'">
              <el-button 
                type="warning" 
                size="small"
                @click="handleReview(transaction)"
              >
                评价
              </el-button>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-container" v-if="total > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useTransactionStore } from '@/stores/transaction'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Clock, 
  Check, 
  Document, 
  Star, 
  Search, 
  Refresh, 
  Picture 
} from '@element-plus/icons-vue'
import type { Transaction } from '@/types/transaction'

const router = useRouter()
const route = useRoute()
const transactionStore = useTransactionStore()

// Reactive state
const activeTab = ref('all')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const dateRange = ref([])
const showDebugInfo = ref(false)

const filterForm = ref({
  type: '',
  status: '',
  keyword: ''
})

const allowedTabs = ['all', 'pending', 'completed', 'cancelled'] as const

function syncFiltersWithRoute() {
  const routeType = route.query.type
  if (routeType === 'buy' || routeType === 'sell') {
    filterForm.value.type = routeType
  } else if (!routeType) {
    filterForm.value.type = ''
  }

  const routeTab = route.query.tab
  if (
    typeof routeTab === 'string' &&
    allowedTabs.includes(routeTab as (typeof allowedTabs)[number])
  ) {
    activeTab.value = routeTab as (typeof allowedTabs)[number]
  } else if (!routeTab) {
    activeTab.value = 'all'
  }
}

watch(
  () => route.query,
  () => {
    syncFiltersWithRoute()
  },
  { immediate: true }
)

watch(
  () => filterForm.value.type,
  (newType) => {
    const currentQueryType = typeof route.query.type === 'string' ? route.query.type : undefined
    if ((newType || '') === (currentQueryType || '')) {
      return
    }

    const nextQuery = { ...route.query }
    if (newType) {
      nextQuery.type = newType
    } else {
      delete nextQuery.type
    }

    router.replace({
      path: route.path,
      query: nextQuery
    })
  }
)

// Computed state
const {
  transactions,
  loading,
  transactionStats,
  pendingTransactions,
  completedTransactions,
  cancelledTransactions,
  currentUserId,
  error
} = storeToRefs(transactionStore)

const { getStatusText, getStatusType } = transactionStore

const filteredTransactions = computed(() => {
  let result = transactions.value

  // 根据标签页筛选
  if (activeTab.value === 'pending') {
    result = pendingTransactions.value
  } else if (activeTab.value === 'completed') {
    result = completedTransactions.value
  } else if (activeTab.value === 'cancelled') {
    result = cancelledTransactions.value
  }

  // 根据表单筛选
  if (filterForm.value.type === 'buy' && currentUserId.value) {
    result = result.filter(t => t.buyer_id === currentUserId.value)
  } else if (filterForm.value.type === 'sell' && currentUserId.value) {
    result = result.filter(t => t.seller_id === currentUserId.value)
  }

  if (filterForm.value.status) {
    result = result.filter(t => t.status === filterForm.value.status)
  }

  if (filterForm.value.keyword) {
    const keyword = filterForm.value.keyword.toLowerCase()
    result = result.filter(t => 
      t.product_name.toLowerCase().includes(keyword) ||
      t.id.toLowerCase().includes(keyword)
    )
  }

  if (dateRange.value && dateRange.value.length === 2) {
    const startDate = new Date(dateRange.value[0])
    const endDate = new Date(dateRange.value[1])
    result = result.filter(t => {
      const createdAt = new Date(t.created_at)
      return createdAt >= startDate && createdAt <= endDate
    })
  }

  // 分页
  total.value = result.length
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  
  return result.slice(start, end)
})

// 生命周期
onMounted(async () => {
  await loadData()
})

// 方法
async function loadData() {
  try {
    // 添加分页参数，避免一次性加载过多数据
    await transactionStore.fetchTransactions({
      page: 1,
      limit: 20 // 每页20条数据
    })
    await transactionStore.fetchTransactionStats()
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

async function refreshData() {
  try {
    await transactionStore.fetchTransactions({
      page: currentPage.value,
      limit: pageSize.value
    })
    ElMessage.success('数据已刷新')
  } catch (error) {
    console.error('刷新数据失败:', error)
    ElMessage.error('刷新数据失败')
  }
}

async function checkDataIntegrity() {
  try {
    // 这里可以添加调用后端API来检查数据完整性
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // 可以调用数据库函数来检查数据完整性
      ElMessage.info('数据完整性检查功能开发中...')
    }
  } catch (error) {
    console.error('数据完整性检查失败:', error)
    ElMessage.error('数据完整性检查失败')
  }
}

function handleTabChange(tabName: string) {
  currentPage.value = 1
  router.replace({
    path: route.path,
    query: {
      ...route.query,
      tab: tabName
    }
  })
}

async function handleSearch() {
  currentPage.value = 1
}

function handleReset() {
  filterForm.value = {
    type: '',
    status: '',
    keyword: ''
  }
  dateRange.value = []
  currentPage.value = 1
}

function handleSizeChange(val: number) {
  pageSize.value = val
  currentPage.value = 1
}

function handleCurrentChange(val: number) {
  currentPage.value = val
}

function goToDetail(id: string) {
  router.push(`/transactions/${id}`)
}

function handlePayment(transaction: Transaction) {
  router.push(`/transactions/${transaction.id}/payment`)
}

async function handleCancel(transaction: Transaction) {
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

    await transactionStore.cancelTransaction(transaction.id, '用户主动取消')
    ElMessage.success('订单已取消')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消订单失败:', error)
    }
  }
}

function handleShip(transaction: Transaction) {
  router.push(`/transactions/${transaction.id}/ship`)
}

async function handleConfirmReceipt(transaction: Transaction) {
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

    await transactionStore.confirmReceipt(transaction.id)
    ElMessage.success('确认收货成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('确认收货失败:', error)
    }
  }
}

async function handleComplete(transaction: Transaction) {
  try {
    await transactionStore.updateTransactionStatus(transaction.id, {
      status: 'completed',
      notes: '买家确认完成交易'
    })
    ElMessage.success('交易已完成')
  } catch (error) {
    console.error('完成交易失败:', error)
  }
}

function handleReview(transaction: Transaction) {
  router.push(`/transactions/${transaction.id}/review`)
}

// 辅助函数
function getCurrentUserId(): string {
  return currentUserId.value
}

function isBuyer(transaction: Transaction): boolean {
  return transaction.buyer_id === transactionStore.currentUserId
}

function isSeller(transaction: Transaction): boolean {
  return transaction.seller_id === transactionStore.currentUserId
}

function getSellerName(transaction: Transaction): string {
  return transaction.seller_username || '卖家'
}

function getBuyerName(transaction: Transaction): string {
  return transaction.buyer_username || '买家'
}

function getProductImage(transaction: Transaction): string {
  return transaction.product_image || ''
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.transactions-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 30px;
  text-align: center;
}

.page-header h1 {
  font-size: 28px;
  color: #303133;
  margin-bottom: 10px;
}

.page-header p {
  color: #909399;
  font-size: 14px;
}

/* 统计卡片 */
.stats-cards {
  margin-bottom: 30px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
}

.stat-icon.pending {
  background: #e6a23c;
}

.stat-icon.completed {
  background: #67c23a;
}

.stat-icon.total {
  background: #409eff;
}

.stat-icon.rating {
  background: #f56c6c;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

/* 筛选区域 */
.filter-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.advanced-filter {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

/* 交易列表 */
.transactions-list {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.transaction-cards {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.transaction-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
}

.transaction-card:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.transaction-header {
  background: #f5f7fa;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e4e7ed;
}

.order-info {
  display: flex;
  gap: 20px;
  align-items: center;
}

.order-no {
  font-weight: 500;
  color: #606266;
}

.created-at {
  color: #909399;
  font-size: 14px;
}

.transaction-content {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.3s;
}

.transaction-content:hover {
  background-color: #f5f7fa;
}

.product-info {
  display: flex;
  gap: 15px;
  align-items: center;
  flex: 1;
}

.product-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
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
  font-size: 24px;
}

.product-details {
  flex: 1;
}

.product-name {
  font-size: 16px;
  color: #303133;
  margin-bottom: 8px;
  font-weight: 500;
}

.product-price {
  color: #f56c6c;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 5px;
}

.quantity {
  color: #909399;
  font-size: 14px;
}

.transaction-info {
  text-align: right;
}

.buyer-seller {
  margin-bottom: 10px;
  font-size: 14px;
}

.buyer-seller .label {
  color: #909399;
}

.buyer-seller .value {
  color: #606266;
  font-weight: 500;
}

.total-amount .label {
  color: #909399;
  font-size: 14px;
}

.total-amount .amount {
  color: #f56c6c;
  font-size: 18px;
  font-weight: bold;
}

.transaction-actions {
  background: #f5f7fa;
  padding: 15px 20px;
  border-top: 1px solid #e4e7ed;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

/* 加载和空状态 */
.loading-container {
  padding: 40px;
  text-align: center;
}

.empty-container {
  padding: 60px 0;
}

/* 分页 */
.pagination-container {
  margin-top: 20px;
  text-align: center;
}

  /* 响应式设计 */
  @media (max-width: 768px) {
    .transactions-container {
      padding: 15px;
    }
    
    .page-header h1 {
      font-size: 24px;
    }
    
    .filter-form {
      flex-direction: column;
    }
    
    .transaction-content {
      flex-direction: column;
      align-items: flex-start;
      gap: 15px;
    }
    
    .transaction-info {
      text-align: left;
      width: 100%;
    }
    
    .transaction-actions {
      flex-wrap: wrap;
    }
  }
  
  /* 调试面板样式 */
  .debug-panel {
    margin-bottom: 20px;
  }
  
  .debug-content {
    padding: 10px 0;
  }
  
  .debug-content p {
    margin: 5px 0;
    font-size: 14px;
  }
  
  .debug-content .error-hint {
    color: #f56c6c;
    font-weight: bold;
  }
  
  .empty-description {
    text-align: center;
  }
  
  .error-hint {
    color: #f56c6c;
    font-size: 14px;
    margin-top: 10px;
  }
</style>
