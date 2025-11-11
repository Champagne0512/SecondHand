import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useUserStore } from './user'
import { ElMessage } from 'element-plus'

// 地址接口
export interface Address {
  id: string
  user_id: string
  recipient_name: string
  phone: string
  province: string
  city: string
  district: string
  detail_address: string
  is_default: boolean
  created_at: string
  updated_at: string
}

// 支付方式接口
export interface PaymentMethod {
  id: string
  name: string
  description: string
}

// 交易评价接口
export interface TransactionReview {
  id: string
  transaction_id: string
  reviewer_id: string
  reviewed_user_id: string
  rating: number
  comment: string
  created_at: string
  
  // 关联信息
  reviewer_username?: string
  reviewer_avatar?: string
  reviewed_user_username?: string
  reviewed_user_avatar?: string
}

export interface Transaction {
  id: string
  order_no: string
  buyer_id: string
  seller_id: string
  product_id: string
  product_name: string
  product_price: number
  product_image: string
  product_description: string
  quantity: number
  total_amount: number
  status: 'pending' | 'paid' | 'shipped' | 'received' | 'completed' | 'cancelled' | 'refunding' | 'refunded'
  payment_method?: 'cash' | 'wechat' | 'alipay' | 'bank_transfer'
  notes?: string
  shipping_address?: string
  contact_phone?: string
  created_at: string
  updated_at: string
  paid_at?: string
  shipped_at?: string
  received_at?: string
  completed_at?: string
  cancelled_at?: string
  
  // 关联信息
  seller_username?: string
  seller_avatar?: string
  buyer_username?: string
  buyer_avatar?: string
}

export interface TransactionStatusHistory {
  id: string
  transaction_id: string
  from_status: string
  to_status: string
  changed_by: string
  reason?: string
  created_at: string
  
  // 关联信息
  changed_by_username?: string
  changed_by_avatar?: string
}

export interface TransactionMessage {
  id: string
  transaction_id: string
  sender_id: string
  content: string
  message_type: 'text' | 'image' | 'system'
  is_read: boolean
  created_at: string
  
  // 关联信息
  sender_username?: string
  sender_avatar?: string
}

export const useTransactionStore = defineStore('transaction', () => {
  const userStore = useUserStore()
  
  // 状态
  const transactions = ref<Transaction[]>([])
  const currentTransaction = ref<Transaction | null>(null)
  const transactionStatusHistory = ref<TransactionStatusHistory[]>([])
  const transactionMessages = ref<TransactionMessage[]>([])
  const isLoading = ref(false)
  
  // 计算属性
  const pendingTransactions = computed(() => 
    transactions.value.filter(t => t.status === 'pending')
  )
  
  const activeTransactions = computed(() => 
    transactions.value.filter(t => ['paid', 'shipped', 'received'].includes(t.status))
  )
  
  const completedTransactions = computed(() => 
    transactions.value.filter(t => ['completed', 'cancelled', 'refunded'].includes(t.status))
  )
  
  const totalTransactions = computed(() => transactions.value.length)
  
  // 获取用户交易列表
  const fetchTransactions = async () => {
    if (!userStore.user) {
      console.log('❌ 用户未登录，跳过获取交易列表')
      transactions.value = []
      return
    }
    
    isLoading.value = true
    try {
      console.log('🔄 开始获取交易数据，用户ID:', userStore.user.id)
      
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          seller:profiles!seller_id(username, avatar_url),
          buyer:profiles!buyer_id(username, avatar_url)
        `)
        .or(`buyer_id.eq.${userStore.user.id},seller_id.eq.${userStore.user.id}`)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('❌ 获取交易数据失败:', error)
        transactions.value = []
        return
      }
      
      // 格式化数据
      transactions.value = (data || []).map(item => ({
        ...item,
        seller_username: item.seller?.username,
        seller_avatar: item.seller?.avatar_url,
        buyer_username: item.buyer?.username,
        buyer_avatar: item.buyer?.avatar_url
      }))
      
      console.log('✅ 交易数据获取成功，交易数量:', transactions.value.length)
    } catch (error) {
      console.error('❌ 获取交易异常:', error)
      transactions.value = []
    } finally {
      isLoading.value = false
    }
  }
  
  // 获取单个交易详情
  const fetchTransactionDetail = async (transactionId: string) => {
    if (!userStore.user) {
      throw new Error('用户未登录')
    }
    
    isLoading.value = true
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          seller:profiles!seller_id(username, avatar_url),
          buyer:profiles!buyer_id(username, avatar_url)
        `)
        .eq('id', transactionId)
        .single()
      
      if (error) throw error
      
      // 检查权限
      if (data.buyer_id !== userStore.user.id && data.seller_id !== userStore.user.id) {
        throw new Error('无权查看此交易')
      }
      
      currentTransaction.value = {
        ...data,
        seller_username: data.seller?.username,
        seller_avatar: data.seller?.avatar_url,
        buyer_username: data.buyer?.username,
        buyer_avatar: data.buyer?.avatar_url
      }
      
      // 同时获取状态历史和消息
      await fetchTransactionStatusHistory(transactionId)
      await fetchTransactionMessages(transactionId)
      
      return currentTransaction.value
    } catch (error) {
      console.error('获取交易详情失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }
  
  // 获取交易状态历史
  const fetchTransactionStatusHistory = async (transactionId: string) => {
    try {
      const { data, error } = await supabase
        .from('transaction_status_history')
        .select(`
          *,
          changed_by_user:profiles!changed_by(username, avatar_url)
        `)
        .eq('transaction_id', transactionId)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      
      transactionStatusHistory.value = (data || []).map(item => ({
        ...item,
        changed_by_username: item.changed_by_user?.username,
        changed_by_avatar: item.changed_by_user?.avatar_url
      }))
    } catch (error) {
      console.error('获取交易状态历史失败:', error)
    }
  }
  
  // 获取交易消息
  const fetchTransactionMessages = async (transactionId: string) => {
    try {
      const { data, error } = await supabase
        .from('transaction_messages')
        .select(`
          *,
          sender:profiles!sender_id(username, avatar_url)
        `)
        .eq('transaction_id', transactionId)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      
      transactionMessages.value = (data || []).map(item => ({
        ...item,
        sender_username: item.sender?.username,
        sender_avatar: item.sender?.avatar_url
      }))
    } catch (error) {
      console.error('获取交易消息失败:', error)
    }
  }
  
  // 创建交易（从购物车结算）
  const createTransactionFromCart = async (productIds: string[]) => {
    if (!userStore.user) {
      throw new Error('用户未登录')
    }
    
    if (!productIds || productIds.length === 0) {
      throw new Error('未选择商品')
    }
    
    isLoading.value = true
    try {
      const { data, error } = await supabase.rpc('create_transaction_from_cart', {
        cart_user_id: userStore.user.id,
        cart_product_ids: productIds
      })
      
      if (error) throw error
      
      if (!data || data.length === 0) {
        throw new Error('创建交易失败')
      }
      
      const result = data[0]
      if (!result.success) {
        throw new Error(result.message || '创建交易失败')
      }
      
      ElMessage.success('交易创建成功')
      
      // 重新获取交易列表
      await fetchTransactions()
      
      return result.transaction_id
    } catch (error) {
      console.error('创建交易失败:', error)
      ElMessage.error(error instanceof Error ? error.message : '创建交易失败')
      throw error
    } finally {
      isLoading.value = false
    }
  }
  
  // 更新交易状态
  const updateTransactionStatus = async (
    transactionId: string, 
    newStatus: Transaction['status'], 
    reason?: string
  ) => {
    if (!userStore.user) {
      throw new Error('用户未登录')
    }
    
    isLoading.value = true
    try {
      const { data, error } = await supabase.rpc('update_transaction_status', {
        p_transaction_id: transactionId,
        p_new_status: newStatus,
        p_changed_by: userStore.user.id,
        p_reason: reason
      })
      
      if (error) throw error
      
      if (!data || data.length === 0) {
        throw new Error('更新交易状态失败')
      }
      
      const result = data[0]
      if (!result.success) {
        throw new Error(result.message || '更新交易状态失败')
      }
      
      ElMessage.success('交易状态更新成功')
      
      // 重新获取交易详情
      await fetchTransactionDetail(transactionId)
      
      return result
    } catch (error) {
      console.error('更新交易状态失败:', error)
      ElMessage.error(error instanceof Error ? error.message : '更新交易状态失败')
      throw error
    } finally {
      isLoading.value = false
    }
  }
  
  // 发送交易消息
  const sendTransactionMessage = async (
    transactionId: string, 
    content: string, 
    messageType: TransactionMessage['message_type'] = 'text'
  ) => {
    if (!userStore.user) {
      throw new Error('用户未登录')
    }
    
    if (!content.trim()) {
      throw new Error('消息内容不能为空')
    }
    
    try {
      const { data, error } = await supabase
        .from('transaction_messages')
        .insert({
          transaction_id: transactionId,
          sender_id: userStore.user.id,
          content: content.trim(),
          message_type: messageType
        })
        .select()
        .single()
      
      if (error) throw error
      
      // 添加到消息列表
      transactionMessages.value.push({
        ...data,
        sender_username: userStore.user?.user_metadata?.username,
        sender_avatar: userStore.user?.user_metadata?.avatar_url
      })
      
      return data
    } catch (error) {
      console.error('发送消息失败:', error)
      throw error
    }
  }
  
  // 标记消息为已读
  const markMessageAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('transaction_messages')
        .update({ is_read: true })
        .eq('id', messageId)
      
      if (error) throw error
      
      // 更新本地状态
      const message = transactionMessages.value.find(m => m.id === messageId)
      if (message) {
        message.is_read = true
      }
    } catch (error) {
      console.error('标记消息为已读失败:', error)
    }
  }
  
  // 创建交易评价
  const createReview = async (reviewData: {
    transaction_id: string
    rating: number
    comment: string
  }) => {
    if (!userStore.user) {
      throw new Error('用户未登录')
    }
    
    if (reviewData.rating < 1 || reviewData.rating > 5) {
      throw new Error('评分必须在1-5之间')
    }
    
    if (!reviewData.comment.trim()) {
      throw new Error('评价内容不能为空')
    }
    
    try {
      const { data, error } = await supabase.rpc('create_transaction_review', {
        p_transaction_id: reviewData.transaction_id,
        p_reviewer_id: userStore.user.id,
        p_rating: reviewData.rating,
        p_comment: reviewData.comment.trim()
      })
      
      if (error) throw error
      
      if (!data || data.length === 0) {
        throw new Error('创建评价失败')
      }
      
      const result = data[0]
      if (!result.success) {
        throw new Error(result.message || '创建评价失败')
      }
      
      ElMessage.success('评价提交成功')
      return result.review_id
    } catch (error) {
      console.error('创建评价失败:', error)
      ElMessage.error(error instanceof Error ? error.message : '创建评价失败')
      throw error
    }
  }
  
  // 获取交易评价
  const fetchTransactionReviews = async (transactionId: string) => {
    try {
      const { data, error } = await supabase
        .from('transaction_reviews')
        .select(`
          *,
          reviewer:profiles!reviewer_id(username, avatar_url),
          reviewed_user:profiles!reviewed_user_id(username, avatar_url)
        `)
        .eq('transaction_id', transactionId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      return data || []
    } catch (error) {
      console.error('获取交易评价失败:', error)
      throw error
    }
  }
  
  // 获取用户的评价统计
  const getUserReviewStats = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('transaction_reviews')
        .select('rating')
        .eq('reviewed_user_id', userId)
      
      if (error) throw error
      
      const reviews = data || []
      const total = reviews.length
      const avgRating = total > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / total 
        : 0
      
      return {
        totalReviews: total,
        averageRating: Math.round(avgRating * 10) / 10,
        ratingDistribution: [1, 2, 3, 4, 5].map(star => ({
          star,
          count: reviews.filter(r => r.rating === star).length
        }))
      }
    } catch (error) {
      console.error('获取用户评价统计失败:', error)
      throw error
    }
  }
  
  // 地址管理方法
  const getUserAddresses = async (): Promise<Address[]> => {
    if (!userStore.user) {
      throw new Error('用户未登录')
    }
    
    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', userStore.user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      return data || []
    } catch (error) {
      console.error('获取用户地址失败:', error)
      throw error
    }
  }

  const createAddress = async (addressData: Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!userStore.user) {
      throw new Error('用户未登录')
    }
    
    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .insert({
          ...addressData,
          user_id: userStore.user.id
        })
        .select()
        .single()
      
      if (error) throw error
      
      ElMessage.success('地址添加成功')
      return data
    } catch (error) {
      console.error('创建地址失败:', error)
      throw error
    }
  }

  const updateAddress = async (addressId: string, addressData: Partial<Address>) => {
    if (!userStore.user) {
      throw new Error('用户未登录')
    }
    
    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .update(addressData)
        .eq('id', addressId)
        .eq('user_id', userStore.user.id)
        .select()
        .single()
      
      if (error) throw error
      
      ElMessage.success('地址更新成功')
      return data
    } catch (error) {
      console.error('更新地址失败:', error)
      throw error
    }
  }

  const deleteAddress = async (addressId: string) => {
    if (!userStore.user) {
      throw new Error('用户未登录')
    }
    
    try {
      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('id', addressId)
        .eq('user_id', userStore.user.id)
      
      if (error) throw error
      
      ElMessage.success('地址删除成功')
    } catch (error) {
      console.error('删除地址失败:', error)
      throw error
    }
  }

  // 清空当前交易数据
  const clearCurrentTransaction = () => {
    currentTransaction.value = null
    transactionStatusHistory.value = []
    transactionMessages.value = []
  }
  
  // 初始化交易模块（用户登录后调用）
  const initializeTransactions = async () => {
    if (userStore.user) {
      await fetchTransactions()
    }
  }
  
  return {
    // 状态
    transactions,
    currentTransaction,
    transactionStatusHistory,
    transactionMessages,
    isLoading,
    
    // 计算属性
    pendingTransactions,
    activeTransactions,
    completedTransactions,
    totalTransactions,
    
    // 方法
    fetchTransactions,
    fetchTransactionDetail,
    fetchTransactionStatusHistory,
    fetchTransactionMessages,
    createTransactionFromCart,
    updateTransactionStatus,
    sendTransactionMessage,
    markMessageAsRead,
    clearCurrentTransaction,
    initializeTransactions,
    
    // 评价方法
    createReview,
    fetchTransactionReviews,
    getUserReviewStats,
    
    // 地址管理方法
    getUserAddresses,
    createAddress,
    updateAddress,
    deleteAddress
  }
})