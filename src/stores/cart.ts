import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useUserStore } from './user'
import { ElMessage } from 'element-plus'

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  quantity: number
  created_at: string
  updated_at: string
  title: string
  description: string
  price: number
  original_price?: number
  category: string
  images: string[]
  condition: string
  seller_id: string
  status: string
  location: string
  contact_info: string
  view_count: number
  like_count: number
  seller_username: string
  seller_avatar?: string
  subtotal: number
}

export const useCartStore = defineStore('cart', () => {
  const userStore = useUserStore()
  
  // 状态
  const cartItems = ref<CartItem[]>([])
  const isLoading = ref(false)
  
  // 计算属性
  const totalItems = computed(() => {
    return cartItems.value.reduce((total, item) => total + item.quantity, 0)
  })
  
  const totalAmount = computed(() => {
    return cartItems.value.reduce((total, item) => total + item.subtotal, 0)
  })
  
  const isEmpty = computed(() => cartItems.value.length === 0)
  
  // 获取购物车商品数量（用于导航栏显示）
  const cartItemCount = computed(() => {
    return cartItems.value.reduce((count, item) => count + item.quantity, 0)
  })
  
  // 获取购物车列表
  const fetchCartItems = async () => {
    if (!userStore.user) {
      console.log('❌ 用户未登录，跳过获取购物车')
      cartItems.value = []
      return
    }
    
    isLoading.value = true
    try {
      console.log('🔄 开始获取购物车数据，用户ID:', userStore.user.id)
      
      // 首先检查数据库连接
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        console.warn('⚠️ 数据库会话无效，跳过获取购物车')
        cartItems.value = []
        return
      }
      
      const { data, error } = await supabase
        .from('shopping_cart_details')
        .select('*')
        .eq('user_id', userStore.user.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('❌ 获取购物车数据库错误:', error)
        // 如果数据库错误，返回空数组而不是抛出错误
        cartItems.value = []
        return
      }
      
      cartItems.value = data || []
      console.log('✅ 购物车数据获取成功，商品数量:', cartItems.value.length)
    } catch (error) {
      console.error('❌ 获取购物车异常:', error)
      // 异常情况下也返回空数组
      cartItems.value = []
    } finally {
      isLoading.value = false
    }
  }
  
  // 添加商品到购物车
  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!userStore.user) {
      ElMessage.warning('请先登录')
      return false
    }
    
    if (quantity <= 0) {
      ElMessage.warning('商品数量必须大于0')
      return false
    }
    
    isLoading.value = true
    try {
      // 使用数据库函数添加商品
      const { data, error } = await supabase.rpc('update_cart_item', {
        p_user_id: userStore.user.id,
        p_product_id: productId,
        p_quantity: quantity
      })
      
      if (error) {
        if (error.message.includes('不能购买自己的商品')) {
          ElMessage.warning('不能购买自己的商品')
          return false
        }
        if (error.message.includes('商品不存在或已下架')) {
          ElMessage.warning('商品不存在或已下架')
          return false
        }
        throw error
      }
      
      // 重新获取购物车列表
      await fetchCartItems()
      
      ElMessage.success('已添加到购物车')
      return true
    } catch (error) {
      console.error('添加购物车失败:', error)
      ElMessage.error('添加购物车失败')
      return false
    } finally {
      isLoading.value = false
    }
  }
  
  // 更新购物车商品数量
  const updateCartItem = async (productId: string, quantity: number) => {
    if (!userStore.user) return false
    
    if (quantity <= 0) {
      // 如果数量为0或负数，则删除商品
      return await removeFromCart(productId)
    }
    
    isLoading.value = true
    try {
      const { data, error } = await supabase.rpc('update_cart_item', {
        p_user_id: userStore.user.id,
        p_product_id: productId,
        p_quantity: quantity
      })
      
      if (error) throw error
      
      // 重新获取购物车列表
      await fetchCartItems()
      
      ElMessage.success('购物车已更新')
      return true
    } catch (error) {
      console.error('更新购物车失败:', error)
      ElMessage.error('更新购物车失败')
      return false
    } finally {
      isLoading.value = false
    }
  }
  
  // 从购物车移除商品
  const removeFromCart = async (productId: string) => {
    if (!userStore.user) return false
    
    isLoading.value = true
    try {
      const { data, error } = await supabase.rpc('remove_cart_item', {
        p_user_id: userStore.user.id,
        p_product_id: productId
      })
      
      if (error) throw error
      
      // 重新获取购物车列表
      await fetchCartItems()
      
      ElMessage.success('已从购物车移除')
      return true
    } catch (error) {
      console.error('移除购物车商品失败:', error)
      ElMessage.error('移除购物车商品失败')
      return false
    } finally {
      isLoading.value = false
    }
  }
  
  // 清空购物车
  const clearCart = async () => {
    if (!userStore.user) return false
    
    isLoading.value = true
    try {
      const { data, error } = await supabase.rpc('clear_user_cart', {
        p_user_id: userStore.user.id
      })
      
      if (error) throw error
      
      // 清空本地状态
      cartItems.value = []
      
      ElMessage.success('购物车已清空')
      return true
    } catch (error) {
      console.error('清空购物车失败:', error)
      ElMessage.error('清空购物车失败')
      return false
    } finally {
      isLoading.value = false
    }
  }
  
  // 检查商品是否在购物车中
  const isInCart = (productId: string) => {
    return cartItems.value.some(item => item.product_id === productId)
  }
  
  // 获取购物车中某个商品的数量
  const getCartItemQuantity = (productId: string) => {
    const item = cartItems.value.find(item => item.product_id === productId)
    return item ? item.quantity : 0
  }
  
  // 获取购物车总金额
  const getCartTotalAmount = async () => {
    if (!userStore.user) return 0
    
    try {
      const { data, error } = await supabase.rpc('get_cart_total_amount', {
        p_user_id: userStore.user.id
      })
      
      if (error) throw error
      
      return data || 0
    } catch (error) {
      console.error('获取购物车总金额失败:', error)
      return 0
    }
  }
  
  // 获取购物车商品数量（用于导航栏显示）
  // 注意：已使用 cartItemCount 计算属性替代此异步方法
  
  // 批量删除购物车商品
  const batchRemoveFromCart = async (productIds: string[]) => {
    if (!userStore.user) return false
    
    isLoading.value = true
    try {
      // 逐个删除商品
      const promises = productIds.map(productId => 
        supabase.rpc('remove_cart_item', {
          p_user_id: userStore.user!.id,
          p_product_id: productId
        })
      )
      
      await Promise.all(promises)
      
      // 重新获取购物车列表
      await fetchCartItems()
      
      ElMessage.success(`已移除 ${productIds.length} 件商品`)
      return true
    } catch (error) {
      console.error('批量删除购物车商品失败:', error)
      ElMessage.error('批量删除失败')
      return false
    } finally {
      isLoading.value = false
    }
  }
  
  // 初始化购物车（用户登录后调用）
  const initializeCart = async () => {
    if (userStore.user) {
      await fetchCartItems()
    }
  }
  
  return {
    // 状态
    cartItems,
    isLoading,
    
    // 计算属性
    totalItems,
    totalAmount,
    isEmpty,
    cartItemCount,
    
    // 方法
    fetchCartItems,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    isInCart,
    getCartItemQuantity,
    getCartTotalAmount,
    batchRemoveFromCart,
    initializeCart
  }
})