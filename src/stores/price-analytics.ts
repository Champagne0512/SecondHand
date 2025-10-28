import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

// 价格分析store
export const usePriceAnalyticsStore = defineStore('priceAnalytics', () => {
  // 价格趋势数据
  const priceHistory = ref<any[]>([])
  const marketTrends = ref<any[]>([])
  const categoryStats = ref<any[]>([])
  const isLoading = ref(false)
  const priceEvaluation = ref<any>(null)

  // 计算属性
  const averagePriceByCategory = computed(() => {
    const stats: Record<string, { avg: number; min: number; max: number; count: number }> = {}
    
    categoryStats.value.forEach(stat => {
      stats[stat.category] = {
        avg: Math.round(stat.avg_price * 100) / 100,
        min: stat.min_price,
        max: stat.max_price,
        count: stat.product_count
      }
    })
    
    return stats
  })

  const priceTrendChartData = computed(() => {
    return priceHistory.value.map(item => ({
      date: item.date,
      price: item.avg_price,
      count: item.product_count
    }))
  })

  // 获取商品价格历史
  const getProductPriceHistory = async (productId: string, days: number = 30) => {
    isLoading.value = true
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('product_price_history')
        .select('*')
        .eq('product_id', productId)
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at', { ascending: true })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('获取商品价格历史失败:', error)
      return []
    } finally {
      isLoading.value = false
    }
  }

  // 获取市场价格趋势
  const getMarketPriceTrends = async (category: string, days: number = 30) => {
    isLoading.value = true
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      let query = supabase
        .from('market_price_trends')
        .select('*')
        .gte('date', startDate.toISOString())
        .order('date', { ascending: true })

      if (category !== 'all') {
        query = query.eq('category', category)
      }

      const { data, error } = await query

      if (error) throw error

      marketTrends.value = data || []
      return data || []
    } catch (error) {
      console.error('获取市场价格趋势失败:', error)
      return []
    } finally {
      isLoading.value = false
    }
  }

  // 获取分类价格统计
  const getCategoryPriceStats = async () => {
    isLoading.value = true
    try {
      const { data, error } = await supabase
        .rpc('get_category_price_statistics')

      if (error) throw error

      categoryStats.value = data || []
      return data || []
    } catch (error) {
      console.error('获取分类价格统计失败:', error)
      return []
    } finally {
      isLoading.value = false
    }
  }

  // 商品价格评估
  const evaluateProductPrice = async (productData: {
    title: string
    category: string
    condition: string
    originalPrice?: number
    usageTime?: number
    brand?: string
    features?: string[]
  }) => {
    try {
      // 获取同类商品的平均价格
      const { data: similarProducts, error } = await supabase
        .from('products')
        .select('price, condition, created_at')
        .eq('category', productData.category)
        .eq('status', 'available')
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())

      if (error) throw error

      if (!similarProducts || similarProducts.length === 0) {
        const result = {
          suggestedPrice: productData.originalPrice ? Math.round(productData.originalPrice * 0.7) : 0,
          priceRange: { min: 0, max: 0 },
          confidence: 0,
          factors: ['无同类商品数据']
        }
        priceEvaluation.value = result
        return result
      }

      // 计算基础价格
      const prices = similarProducts.map(p => p.price)
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length
      
      // 基于商品状况调整价格
      let conditionMultiplier = 1.0
      switch (productData.condition) {
        case '全新':
          conditionMultiplier = 0.95
          break
        case '几乎全新':
          conditionMultiplier = 0.85
          break
        case '轻微使用':
          conditionMultiplier = 0.75
          break
        case '明显使用':
          conditionMultiplier = 0.6
          break
        default:
          conditionMultiplier = 0.7
      }

      // 基于使用时间调整价格
      let usageMultiplier = 1.0
      if (productData.usageTime) {
        if (productData.usageTime <= 3) {
          usageMultiplier = 0.95
        } else if (productData.usageTime <= 12) {
          usageMultiplier = 0.85
        } else if (productData.usageTime <= 24) {
          usageMultiplier = 0.75
        } else {
          usageMultiplier = 0.6
        }
      }

      // 计算建议价格
      const suggestedPrice = Math.round(avgPrice * conditionMultiplier * usageMultiplier)
      
      // 计算价格区间
      const minPrice = Math.round(suggestedPrice * 0.8)
      const maxPrice = Math.round(suggestedPrice * 1.2)

      // 计算置信度
      const priceVariance = calculateVariance(prices)
      const confidence = Math.max(0, Math.min(100, 100 - (priceVariance / avgPrice) * 100))

      // 影响因素
      const factors = []
      if (conditionMultiplier < 0.8) factors.push('商品成色影响价格')
      if (usageMultiplier < 0.8) factors.push('使用时间影响价格')
      if (similarProducts.length < 5) factors.push('同类商品数据较少')
      if (confidence < 70) factors.push('市场价格波动较大')

      const result = {
        suggestedPrice,
        priceRange: { min: minPrice, max: maxPrice },
        confidence: Math.round(confidence),
        factors,
        marketData: {
          similarProductsCount: similarProducts.length,
          averageMarketPrice: Math.round(avgPrice),
          priceRange: {
            min: Math.round(Math.min(...prices)),
            max: Math.round(Math.max(...prices))
          }
        }
      }
      
      priceEvaluation.value = result
      return result
    } catch (error) {
      console.error('价格评估失败:', error)
      const result = {
        suggestedPrice: 0,
        priceRange: { min: 0, max: 0 },
        confidence: 0,
        factors: ['评估失败']
      }
      priceEvaluation.value = result
      return result
    }
  }

  // 计算方差
  const calculateVariance = (values: number[]) => {
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length
    return Math.sqrt(variance)
  }

  // 价格趋势预测
  const predictPriceTrend = async (category: string, days: number = 30) => {
    try {
      // 简化实现，返回模拟数据
      return {
        trend: 'up' as const,
        confidence: 75,
        prediction: '价格呈上涨趋势，建议尽快购买',
        priceChange: 5.2,
        currentAvgPrice: 1280
      }
    } catch (error) {
      console.error('价格趋势预测失败:', error)
      return {
        trend: 'stable' as const,
        confidence: 0,
        prediction: '预测失败'
      }
    }
  }

  // 获取最佳交易时机
  const getBestDealTiming = async (category: string) => {
    try {
      // 简化实现，返回模拟数据
      return {
        bestMonth: '3月',
        reasoning: '3月通常是购买电子产品的最佳时机，平均价格比9月低15%',
        confidence: 80,
        priceDifference: 200
      }
    } catch (error) {
      console.error('获取最佳交易时机失败:', error)
      return {
        bestMonth: '分析失败',
        reasoning: '数据不足，无法分析',
        confidence: 0
      }
    }
  }

  return {
    priceHistory,
    marketTrends,
    categoryStats,
    isLoading,
    priceEvaluation,
    averagePriceByCategory,
    priceTrendChartData,
    getProductPriceHistory,
    getMarketPriceTrends,
    getCategoryPriceStats,
    evaluateProductPrice,
    predictPriceTrend,
    getBestDealTiming
  }
})