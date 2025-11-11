import type {
  Transaction,
  TransactionDetail,
  CreateTransactionRequest,
  UpdateTransactionStatusRequest,
  CreateTransactionReviewRequest,
  TransactionFilter,
  TransactionStats,
  TransactionStatusHistory
} from '@/types/transaction'
import { supabase } from '@/lib/supabase'

// 交易相关API
export const transactionApi = {
  // 获取交易列表
  getTransactions: async (params?: TransactionFilter & { page?: number; limit?: number }) => {
    try {
      // 首先检查当前用户的会话状态
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('用户未登录')
      
      // 获取用户ID
      const userId = user.id
      
      // 验证用户数据完整性
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('id', userId)
        .single()
      
      if (!userProfile) {
        console.warn('用户profile数据缺失，可能导致交易显示异常')
      }
      
      // 使用基础查询，避免复杂的LEFT JOIN导致数据丢失
      let query = supabase
        .from('transactions')
        .select(`
          *,
          buyer:buyer_id(username, avatar_url),
          seller:seller_id(username, avatar_url),
          product:product_id(images, category, condition)
        `)
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      // 应用筛选条件
      if (params?.status) {
        query = query.eq('status', params.status)
      }
      
      if (params?.keyword) {
        query = query.or(`product_name.ilike.%${params.keyword}%,order_no.ilike.%${params.keyword}%`)
      }

      // 添加分页支持
      if (params?.page && params?.limit) {
        const start = (params.page - 1) * params.limit
        query = query.range(start, start + params.limit - 1)
      }

      const { data, error } = await query
      
      if (error) {
        console.error('获取交易列表失败:', error)
        // 如果是权限相关的错误，提供更具体的错误信息
        if (error.code === '42501') {
          throw new Error('您没有查看交易的权限，请联系管理员')
        }
        throw error
      }
      
      console.log('交易查询结果:', {
        totalCount: data?.length || 0,
        userId: userId,
        queryParams: params
      })
      
      // 数据转换和验证
      const transactions = (data || []).map((item: any) => {
        return {
          ...item,
          buyer_username: item.buyer?.username || '未知买家',
          buyer_avatar: item.buyer?.avatar_url,
          seller_username: item.seller?.username || '未知卖家',
          seller_avatar: item.seller?.avatar_url,
          product_images: item.product?.images,
          product_category: item.product?.category,
          product_condition: item.product?.condition
        }
      })
      
      return { data: transactions }
    } catch (error) {
      console.error('获取交易列表失败:', error)
      throw error
    }
  },

  // 获取交易详情
  getTransaction: async (id: string) => {
    try {
      // 首先检查当前用户的会话状态
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('用户未登录')
      
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          buyer:buyer_id(username, avatar_url),
          seller:seller_id(username, avatar_url),
          product:product_id(images, category, condition)
        `)
        .eq('id', id)
        .single()
      
      if (error) throw error
      
      if (!data) throw new Error('交易不存在')
      
      // 验证用户是否有权限查看此交易
      if (data.buyer_id !== user.id && data.seller_id !== user.id) {
        throw new Error('无权查看此交易')
      }
      
      // 数据转换和验证
      const transaction = {
        ...data,
        buyer_username: data.buyer?.username || '未知买家',
        buyer_avatar: data.buyer?.avatar_url,
        seller_username: data.seller?.username || '未知卖家',
        seller_avatar: data.seller?.avatar_url,
        product_images: data.product?.images,
        product_category: data.product?.category,
        product_condition: data.product?.condition
      }
      
      return { data: transaction }
    } catch (error) {
      console.error('获取交易详情失败:', error)
      throw error
    }
  },

  // 创建交易
  createTransaction: async (data: CreateTransactionRequest) => {
    try {
      // 首先获取商品信息
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', data.product_id)
        .single()
      
      if (productError) throw productError
      
      // 获取当前用户信息
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('用户未登录')
      
      // 生成订单号
      const orderNo = 'TXN' + Date.now().toString() + Math.random().toString(36).substr(2, 6).toUpperCase()
      
      // 创建交易记录
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          order_no: orderNo,
          buyer_id: user.id,
          seller_id: productData.seller_id,
          product_id: data.product_id,
          product_name: productData.title,
          product_price: productData.price,
          product_image: productData.images?.[0],
          product_description: productData.description,
          quantity: data.quantity,
          total_amount: productData.price * data.quantity,
          notes: data.notes,
          shipping_address: data.shipping_address,
          status: 'pending'
        })
        .select()
        .single()
      
      if (transactionError) {
        // 如果是订单号冲突，重试一次
        if (transactionError.code === '23505' && transactionError.details?.includes('order_no')) {
          const retryOrderNo = 'TXN' + Date.now().toString() + Math.random().toString(36).substr(2, 6).toUpperCase()
          const { data: retryData, error: retryError } = await supabase
            .from('transactions')
            .insert({
              order_no: retryOrderNo,
              buyer_id: user.id,
              seller_id: productData.seller_id,
              product_id: data.product_id,
              product_name: productData.title,
              product_price: productData.price,
              product_image: productData.images?.[0],
              product_description: productData.description,
              quantity: data.quantity,
              total_amount: productData.price * data.quantity,
              notes: data.notes,
              shipping_address: data.shipping_address,
              status: 'pending'
            })
            .select()
            .single()
          
          if (retryError) throw retryError
          return { data: retryData }
        }
        throw transactionError
      }
      
      return { data: transactionData }
    } catch (error) {
      console.error('创建交易失败:', error)
      throw error
    }
  },

  // 从购物车创建交易
  createTransactionFromCart: async (productIds: string[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('用户未登录')
      
      const { data, error } = await supabase.rpc('create_transaction_from_cart', {
        cart_user_id: user.id,
        cart_product_ids: productIds
      })
      
      if (error) throw error
      
      return { data }
    } catch (error) {
      console.error('从购物车创建交易失败:', error)
      throw error
    }
  },

  // 更新交易状态
  updateTransactionStatus: async (id: string, data: UpdateTransactionStatusRequest) => {
    try {
      const { data: transactionData, error } = await supabase
        .from('transactions')
        .update({
          status: data.status,
          notes: data.notes
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      return { data: transactionData }
    } catch (error) {
      console.error('更新交易状态失败:', error)
      throw error
    }
  },

  // 取消交易
  cancelTransaction: async (id: string, reason?: string) => {
    try {
      const { data: transactionData, error } = await supabase
        .from('transactions')
        .update({
          status: 'cancelled',
          notes: reason ? `取消原因: ${reason}` : '用户取消'
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      return { data: transactionData }
    } catch (error) {
      console.error('取消交易失败:', error)
      throw error
    }
  },

  // 确认收货
  confirmReceipt: async (id: string) => {
    try {
      const { data: transactionData, error } = await supabase
        .from('transactions')
        .update({
          status: 'received',
          notes: '买家确认收货'
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      return { data: transactionData }
    } catch (error) {
      console.error('确认收货失败:', error)
      throw error
    }
  },

  // 获取我的买入交易
  getMyPurchases: async (params?: { status?: string; page?: number; limit?: number }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('用户未登录')
      
      let query = supabase
        .from('transaction_details')
        .select('*')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })

      if (params?.status) {
        query = query.eq('status', params.status)
      }

      const { data, error } = await query
      
      if (error) throw error
      
      return { data: data || [] }
    } catch (error) {
      console.error('获取买入交易失败:', error)
      throw error
    }
  },

  // 获取我的卖出交易
  getMySales: async (params?: { status?: string; page?: number; limit?: number }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('用户未登录')
      
      let query = supabase
        .from('transaction_details')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })

      if (params?.status) {
        query = query.eq('status', params.status)
      }

      const { data, error } = await query
      
      if (error) throw error
      
      return { data: data || [] }
    } catch (error) {
      console.error('获取卖出交易失败:', error)
      throw error
    }
  },

  // 获取交易统计
  getTransactionStats: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('用户未登录')
      
      // 获取用户的所有交易
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      
      if (error) throw error
      
      const stats: TransactionStats = {
        totalTransactions: transactions?.length || 0,
        completedTransactions: transactions?.filter(t => t.status === 'completed').length || 0,
        totalAmount: transactions?.filter(t => t.status === 'completed').reduce((sum, t) => sum + parseFloat(t.total_amount), 0) || 0,
        averageRating: 4.5, // 暂时固定值
        pendingTransactions: transactions?.filter(t => ['pending', 'paid', 'shipped'].includes(t.status)).length || 0
      }
      
      return { data: stats }
    } catch (error) {
      console.error('获取交易统计失败:', error)
      throw error
    }
  },

  // 创建交易评价
  createTransactionReview: async (data: CreateTransactionReviewRequest) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('用户未登录')
      
      // 检查用户是否有权限评价
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', data.transactionId)
        .single()
      
      if (transactionError) throw transactionError
      
      // 确定评价者类型
      const reviewerType = transaction.buyer_id === user.id ? 'buyer' : 'seller'
      
      const { data: reviewData, error } = await supabase
        .from('transaction_reviews')
        .insert({
          transaction_id: data.transactionId,
          reviewer_id: user.id,
          reviewer_type: reviewerType,
          rating: data.rating,
          content: data.content,
          images: data.images
        })
        .select()
        .single()
      
      if (error) throw error
      
      return { data: reviewData }
    } catch (error) {
      console.error('创建交易评价失败:', error)
      throw error
    }
  },

  // 获取交易评价
  getTransactionReviews: async (transactionId: string) => {
    try {
      const { data, error } = await supabase
        .from('transaction_reviews')
        .select('*')
        .eq('transaction_id', transactionId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      return { data: data || [] }
    } catch (error) {
      console.error('获取交易评价失败:', error)
      throw error
    }
  },

  // 获取交易状态历史
  getTransactionStatusHistory: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('transaction_status_history')
        .select('*')
        .eq('transaction_id', id)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      
      return { data: data || [] }
    } catch (error) {
      console.error('获取交易状态历史失败:', error)
      throw error
    }
  },

  // 检查是否可以评价交易
  canReviewTransaction: async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { data: { canReview: false } }
      
      // 检查交易是否已完成
      const { data: transaction, error } = await supabase
        .from('transactions')
        .select('status, buyer_id, seller_id')
        .eq('id', id)
        .single()
      
      if (error || transaction.status !== 'completed') {
        return { data: { canReview: false } }
      }
      
      // 检查是否已经评价过
      const { data: existingReview } = await supabase
        .from('transaction_reviews')
        .select('id')
        .eq('transaction_id', id)
        .eq('reviewer_id', user.id)
        .single()
      
      return { data: { canReview: !existingReview } }
    } catch (error) {
      console.error('检查评价权限失败:', error)
      return { data: { canReview: false } }
    }
  }
}

export default transactionApi