import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

// 推荐系统store
export const useRecommendationStore = defineStore('recommendation', () => {
  // 状态
  const recommendedProducts = ref<any[]>([])
  const trendingProducts = ref<any[]>([])
  const userBehavior = ref({
    viewedProducts: [] as string[],
    favoriteCategories: [] as string[],
    searchHistory: [] as string[]
  })
  const isLoading = ref(false)

  // 计算属性
  const hasRecommendations = computed(() => recommendedProducts.value.length > 0)
  
  const personalizedScore = computed(() => {
    return (product: any) => {
      let score = 0
      
      // 基于浏览历史的推荐分数
      if (userBehavior.value.viewedProducts.includes(product.id)) {
        score -= 10 // 减少已浏览商品的推荐度
      }
      
      // 基于分类偏好的推荐分数
      if (userBehavior.value.favoriteCategories.includes(product.category)) {
        score += 20
      }
      
      // 基于热度的分数
      score += (product.viewCount || 0) * 0.1
      score += (product.likeCount || 0) * 0.5
      
      // 时间衰减因子（越新的商品分数越高）
      const daysSinceCreated = (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      score += Math.max(0, 30 - daysSinceCreated) * 0.5
      
      return score
    }
  })

  // 获取智能推荐商品
  const getSmartRecommendations = async (userId?: string, limit: number = 10) => {
    isLoading.value = true
    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('status', 'available')
        .limit(limit * 2) // 获取更多数据用于筛选

      const { data: products, error } = await query

      if (error) throw error

      if (products && products.length > 0) {
        // 计算每个商品的个性化分数
        const scoredProducts = products.map(product => ({
          ...product,
          recommendationScore: personalizedScore.value(product)
        }))

        // 按分数排序并取前limit个
        scoredProducts.sort((a, b) => b.recommendationScore - a.recommendationScore)
        recommendedProducts.value = scoredProducts.slice(0, limit)
      }
    } catch (error) {
      console.error('获取智能推荐失败:', error)
      recommendedProducts.value = []
    } finally {
      isLoading.value = false
    }
  }

  // 获取热门商品
  const getTrendingProducts = async (limit: number = 10) => {
    isLoading.value = true
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'available')
        .order('view_count', { ascending: false })
        .limit(limit)

      if (error) throw error

      trendingProducts.value = products || []
    } catch (error) {
      console.error('获取热门商品失败:', error)
      trendingProducts.value = []
    } finally {
      isLoading.value = false
    }
  }

  // 记录用户行为
  const recordUserBehavior = (type: 'view' | 'favorite' | 'search', data: any) => {
    switch (type) {
      case 'view':
        if (!userBehavior.value.viewedProducts.includes(data.productId)) {
          userBehavior.value.viewedProducts.push(data.productId)
          // 限制历史记录长度
          if (userBehavior.value.viewedProducts.length > 50) {
            userBehavior.value.viewedProducts.shift()
          }
        }
        break
        
      case 'favorite':
        // 从商品分类更新用户偏好
        if (data.category && !userBehavior.value.favoriteCategories.includes(data.category)) {
          userBehavior.value.favoriteCategories.push(data.category)
          // 限制分类数量
          if (userBehavior.value.favoriteCategories.length > 10) {
            userBehavior.value.favoriteCategories.shift()
          }
        }
        break
        
      case 'search':
        if (data.keyword && !userBehavior.value.searchHistory.includes(data.keyword)) {
          userBehavior.value.searchHistory.push(data.keyword)
          // 限制搜索历史长度
          if (userBehavior.value.searchHistory.length > 20) {
            userBehavior.value.searchHistory.shift()
          }
        }
        break
    }
    
    // 保存到本地存储
    localStorage.setItem('userBehavior', JSON.stringify(userBehavior.value))
  }

  // 从本地存储加载用户行为
  const loadUserBehavior = () => {
    try {
      const saved = localStorage.getItem('userBehavior')
      if (saved) {
        userBehavior.value = JSON.parse(saved)
      }
    } catch (error) {
      console.error('加载用户行为失败:', error)
    }
  }

  // 获取相似商品推荐
  const getSimilarProducts = async (productId: string, limit: number = 6) => {
    try {
      // 首先获取目标商品的信息
      const { data: targetProduct, error: targetError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (targetError || !targetProduct) throw new Error('商品不存在')

      // 获取同类别的其他商品
      const { data: similarProducts, error: similarError } = await supabase
        .from('products')
        .select('*')
        .eq('category', targetProduct.category)
        .eq('status', 'available')
        .neq('id', productId) // 排除当前商品
        .limit(limit)

      if (similarError) throw similarError

      return similarProducts || []
    } catch (error) {
      console.error('获取相似商品失败:', error)
      return []
    }
  }

  // 获取猜你喜欢的商品
  const getGuessYouLike = async (limit: number = 8) => {
    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('status', 'available')

      // 如果用户有偏好分类，优先推荐这些分类的商品
      if (userBehavior.value.favoriteCategories.length > 0) {
        query = query.in('category', userBehavior.value.favoriteCategories)
      }

      // 排除已浏览的商品
      if (userBehavior.value.viewedProducts.length > 0) {
        query = query.not('id', 'in', `(${userBehavior.value.viewedProducts.join(',')})`)
      }

      query = query.order('created_at', { ascending: false }).limit(limit)

      const { data: products, error } = await query

      if (error) throw error

      return products || []
    } catch (error) {
      console.error('获取猜你喜欢失败:', error)
      return []
    }
  }

  // 初始化推荐系统
  const initRecommendation = () => {
    loadUserBehavior()
  }

  return {
    recommendedProducts,
    trendingProducts,
    userBehavior,
    isLoading,
    hasRecommendations,
    getSmartRecommendations,
    getTrendingProducts,
    recordUserBehavior,
    loadUserBehavior,
    getSimilarProducts,
    getGuessYouLike,
    initRecommendation
  }
})