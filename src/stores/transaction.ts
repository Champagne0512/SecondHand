import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  Transaction, 
  TransactionDetail, 
  TransactionFilter, 
  TransactionStats,
  TransactionStatusHistory,
  CreateTransactionRequest,
  UpdateTransactionStatusRequest,
  CreateTransactionReviewRequest
} from '@/types/transaction'
import { transactionApi } from '@/api/transaction'
import { ElMessage } from 'element-plus'
import { supabase } from '@/lib/supabase'

export const useTransactionStore = defineStore('transaction', () => {
  // 状态
  const transactions = ref<Transaction[]>([])
  const currentTransaction = ref<TransactionDetail | null>(null)
  const transactionStats = ref<TransactionStats | null>(null)
  const statusHistory = ref<TransactionStatusHistory[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentUserId = ref<string>('')

  // 计算属性
  const pendingTransactions = computed(() => 
    transactions.value.filter(t => t.status === 'pending' || t.status === 'paid' || t.status === 'shipped')
  )

  const completedTransactions = computed(() => 
    transactions.value.filter(t => t.status === 'completed')
  )

  const cancelledTransactions = computed(() => 
    transactions.value.filter(t => t.status === 'cancelled')
  )

  const purchases = computed(() => 
    transactions.value.filter(t => t.buyer_id === currentUserId.value)
  )

  const sales = computed(() => 
    transactions.value.filter(t => t.seller_id === currentUserId.value)
  )

  // 辅助函数
  async function getCurrentUserId(): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      return user?.id || ''
    } catch (error) {
      console.error('获取当前用户ID失败:', error)
      return ''
    }
  }

  // 生成订单号
  function generateOrderNo(): string {
    const prefix = 'T' + new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const suffix = Math.random().toString().slice(2, 8)
    return prefix + suffix
  }

  // 操作函数
  async function fetchTransactions(filter?: TransactionFilter & { page?: number; limit?: number }) {
    loading.value = true
    error.value = null
    try {
      // 获取当前用户ID
      const userId = await getCurrentUserId()
      currentUserId.value = userId
      
      console.log('开始获取交易列表:', {
        userId,
        filter,
        timestamp: new Date().toISOString()
      })
      
      const response = await transactionApi.getTransactions(filter)
      
      console.log('交易列表获取结果:', {
        count: response.data.length,
        firstTransaction: response.data[0],
        lastTransaction: response.data[response.data.length - 1]
      })
      
      transactions.value = response.data
      return response.data
    } catch (err: any) {
      error.value = err.message || '获取交易列表失败'
      console.error('获取交易列表失败详情:', {
        error: err,
        message: err.message,
        code: err.code,
        details: err.details
      })
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchTransactionDetail(id: string) {
    loading.value = true
    error.value = null
    try {
      console.log('开始获取交易详情:', {
        transactionId: id,
        currentUserId: currentUserId.value,
        timestamp: new Date().toISOString()
      })
      
      const response = await transactionApi.getTransaction(id)
      
      console.log('交易详情获取结果:', {
        transactionId: id,
        hasData: !!response.data,
        transactionStatus: response.data?.status,
        buyerId: response.data?.buyer_id,
        sellerId: response.data?.seller_id
      })
      
      currentTransaction.value = response.data
      return response.data
    } catch (err: any) {
      error.value = err.message || '获取交易详情失败'
      console.error('获取交易详情失败详情:', {
        transactionId: id,
        error: err,
        message: err.message,
        code: err.code,
        details: err.details
      })
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createTransaction(data: CreateTransactionRequest) {
    loading.value = true
    error.value = null
    try {
      const response = await transactionApi.createTransaction(data)
      transactions.value.unshift(response.data)
      ElMessage.success('交易创建成功')
      return response.data
    } catch (err: any) {
      error.value = err.message || '创建交易失败'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function checkoutCartItems(productIds: string[]) {
    if (!productIds || productIds.length === 0) {
      return {
        results: [],
        successCount: 0,
        failed: []
      }
    }

    loading.value = true
    error.value = null
    try {
      const response = await transactionApi.createTransactionFromCart(productIds)
      const resultRows = Array.isArray(response.data) ? response.data : []
      const successRows = resultRows.filter((item: any) => item?.success)
      const failedRows = resultRows.filter((item: any) => item && item.success === false)

      return {
        results: resultRows,
        successCount: successRows.length,
        failed: failedRows
      }
    } catch (err: any) {
      error.value = err.message || '购物车结算失败'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateTransactionStatus(id: string, data: UpdateTransactionStatusRequest) {
    loading.value = true
    error.value = null
    try {
      const response = await transactionApi.updateTransactionStatus(id, data)
      
      // 更新本地数据
      const index = transactions.value.findIndex(t => t.id === id)
      if (index !== -1) {
        transactions.value[index] = { ...transactions.value[index], ...response.data }
      }
      
      if (currentTransaction.value && currentTransaction.value.id === id) {
        currentTransaction.value = { ...currentTransaction.value, ...response.data }
      }
      
      ElMessage.success('交易状态更新成功')
      return response.data
    } catch (err: any) {
      error.value = err.message || '更新交易状态失败'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function cancelTransaction(id: string, reason?: string) {
    loading.value = true
    error.value = null
    try {
      const response = await transactionApi.cancelTransaction(id, reason)
      
      // 更新本地数据
      const index = transactions.value.findIndex(t => t.id === id)
      if (index !== -1) {
        transactions.value[index].status = 'cancelled'
        transactions.value[index].cancelledAt = new Date().toISOString()
      }
      
      if (currentTransaction.value && currentTransaction.value.id === id) {
        currentTransaction.value.status = 'cancelled'
        currentTransaction.value.cancelledAt = new Date().toISOString()
      }
      
      ElMessage.success('交易已取消')
      return response.data
    } catch (err: any) {
      error.value = err.message || '取消交易失败'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function confirmReceipt(id: string) {
    loading.value = true
    error.value = null
    try {
      const response = await transactionApi.confirmReceipt(id)
      
      // 更新本地数据
      const index = transactions.value.findIndex(t => t.id === id)
      if (index !== -1) {
        transactions.value[index].status = 'received'
        transactions.value[index].receivedAt = new Date().toISOString()
      }
      
      if (currentTransaction.value && currentTransaction.value.id === id) {
        currentTransaction.value.status = 'received'
        currentTransaction.value.receivedAt = new Date().toISOString()
      }
      
      ElMessage.success('确认收货成功')
      return response.data
    } catch (err: any) {
      error.value = err.message || '确认收货失败'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchPurchases(filter?: { status?: string }) {
    loading.value = true
    error.value = null
    try {
      const response = await transactionApi.getMyPurchases(filter)
      return response.data
    } catch (err: any) {
      error.value = err.message || '获取购买记录失败'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchSales(filter?: { status?: string }) {
    loading.value = true
    error.value = null
    try {
      const response = await transactionApi.getMySales(filter)
      return response.data
    } catch (err: any) {
      error.value = err.message || '获取销售记录失败'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchTransactionStats() {
    loading.value = true
    error.value = null
    try {
      const response = await transactionApi.getTransactionStats()
      transactionStats.value = response.data
      return response.data
    } catch (err: any) {
      error.value = err.message || '获取交易统计失败'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createTransactionReview(data: CreateTransactionReviewRequest) {
    loading.value = true
    error.value = null
    try {
      const response = await transactionApi.createTransactionReview(data)
      
      // 更新当前交易的评价信息
      if (currentTransaction.value && currentTransaction.value.id === data.transactionId) {
        currentTransaction.value.review = response.data
      }
      
      ElMessage.success('评价提交成功')
      return response.data
    } catch (err: any) {
      error.value = err.message || '提交评价失败'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchTransactionStatusHistory(id: string) {
    loading.value = true
    error.value = null
    try {
      const response = await transactionApi.getTransactionStatusHistory(id)
      statusHistory.value = response.data
      return response.data
    } catch (err: any) {
      error.value = err.message || '获取状态历史失败'
      ElMessage.error(error.value)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function canReviewTransaction(id: string): Promise<boolean> {
    try {
      const response = await transactionApi.canReviewTransaction(id)
      return response.data.canReview
    } catch (err: any) {
      console.error('检查评价权限失败:', err)
      return false
    }
  }

  // 获取交易状态文本
  function getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': '待付款',
      'paid': '已付款',
      'shipped': '已发货',
      'received': '已收货',
      'completed': '已完成',
      'cancelled': '已取消',
      'refunding': '退款中',
      'refunded': '已退款'
    }
    return statusMap[status] || status
  }

  // 获取交易状态类型
  function getStatusType(status: string): string {
    const typeMap: Record<string, string> = {
      'pending': 'warning',
      'paid': 'info',
      'shipped': 'primary',
      'received': 'success',
      'completed': 'success',
      'cancelled': 'danger',
      'refunding': 'warning',
      'refunded': 'info'
    }
    return typeMap[status] || 'info'
  }

  // 重置状态
  function reset() {
    transactions.value = []
    currentTransaction.value = null
    transactionStats.value = null
    statusHistory.value = []
    loading.value = false
    error.value = null
  }

  return {
    // 状态
    transactions,
    currentTransaction,
    transactionStats,
    statusHistory,
    loading,
    error,
    currentUserId,
    
    // 计算属性
    pendingTransactions,
    completedTransactions,
    cancelledTransactions,
    purchases,
    sales,
    
    // 操作函数
    fetchTransactions,
    fetchTransactionDetail,
    createTransaction,
    checkoutCartItems,
    updateTransactionStatus,
    cancelTransaction,
    confirmReceipt,
    fetchPurchases,
    fetchSales,
    fetchTransactionStats,
    createTransactionReview,
    fetchTransactionStatusHistory,
    canReviewTransaction,
    getStatusText,
    getStatusType,
    reset
  }
})
