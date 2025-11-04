import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAIAssistantEnhancedStore } from './ai-assistant-enhanced'

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

  // 商品价格评估 - 使用工作流AI助手
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
      // 使用工作流AI助手进行价格分析
      const aiStore = useAIAssistantEnhancedStore()
      
      // 构建价格分析提示词，包含品牌信息
      const prompt = `请分析以下商品的价格合理性：

商品信息：
- 分类：${productData.category}
- 成色：${productData.condition}
- 使用时间：${productData.usageTime || 0}个月
- 原价：${productData.originalPrice || 0}元
- 品牌：${productData.brand || '未指定'}
- 特色：${productData.features?.join(', ') || '未指定'}

请基于校园二手交易市场数据，提供：
1. 建议售价范围（考虑品牌因素）
2. 价格影响因素分析（特别关注品牌影响）
3. 市场竞争力评估
4. 成交建议

请用数据和市场逻辑支撑您的分析，特别关注品牌对价格的影响。`

      // 调用工作流AI助手
      const response = await aiStore.sendMessage(prompt, {
        userIntent: 'price_analysis',
        productInfo: productData
      })

      // 解析AI回复，提取关键信息
      const aiResponse = response.content
      
      // 从AI回复中提取价格信息
      const priceMatch = aiResponse.match(/建议售价[：:]\s*¥?(\d+)/) || 
                        aiResponse.match(/价格[：:]\s*¥?(\d+)/)
      
      const suggestedPrice = priceMatch ? parseInt(priceMatch[1]) : 
        (productData.originalPrice ? Math.round(productData.originalPrice * 0.7) : 0)

      // 提取价格区间
      const rangeMatch = aiResponse.match(/¥?(\d+)\s*-\s*¥?(\d+)/)
      const priceRange = rangeMatch ? 
        { min: parseInt(rangeMatch[1]), max: parseInt(rangeMatch[2]) } :
        { min: Math.round(suggestedPrice * 0.8), max: Math.round(suggestedPrice * 1.2) }

      // 提取影响因素
      const factors = []
      if (productData.brand && productData.brand.trim() !== '') {
        factors.push('品牌溢价影响价格')
      }
      if (productData.condition !== '全新') {
        factors.push('商品成色影响价格')
      }
      if (productData.usageTime && productData.usageTime > 0) {
        factors.push('使用时间影响价格')
      }
      if (factors.length === 0) {
        factors.push('市场价格波动影响')
      }

      // 基于品牌调整置信度
      let confidence = 75
      if (productData.brand && productData.brand.trim() !== '') {
        const premiumBrands = ['苹果', 'apple', 'iphone', 'macbook', '华为', 'huawei', '三星', 'samsung', '索尼', 'sony']
        const brandLower = productData.brand.toLowerCase()
        if (premiumBrands.some(brand => brandLower.includes(brand))) {
          confidence = 85  // 知名品牌数据更可靠
        }
      }

      const result = {
        suggestedPrice,
        priceRange,
        confidence,
        factors,
        marketData: {
          similarProductsCount: 0,
          averageMarketPrice: suggestedPrice,
          priceRange
        },
        aiAnalysis: aiResponse  // 保留完整的AI分析内容
      }
      
      priceEvaluation.value = result
      return result
    } catch (error) {
      console.error('价格评估失败:', error)
      // 备用方案：使用算法分析
      const result = {
        suggestedPrice: productData.originalPrice ? Math.round(productData.originalPrice * 0.7) : 0,
        priceRange: { min: 0, max: 0 },
        confidence: 0,
        factors: ['评估失败，使用备用算法'],
        marketData: {
          similarProductsCount: 0,
          averageMarketPrice: 0,
          priceRange: { min: 0, max: 0 }
        }
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