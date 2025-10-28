import { defineStore } from 'pinia'
import { ref } from 'vue'

// AI助手store
export const useAIAssistantStore = defineStore('aiAssistant', () => {
  const isGenerating = ref(false)
  const generatedContent = ref('')
  const aiSuggestions = ref<string[]>([])

  // 商品描述模板库
  const descriptionTemplates = {
    electronics: [
      '【九成新】{brand} {model}，{condition}，功能完好，{features}。因{reason}转让，价格实惠，支持当面验货。',
      '【高性价比】{brand} {model}，{usage}，保养良好，{performance}。适合{targetUser}，{warranty}。',
      '【急售】{brand} {model}，{condition}，{accessories}。{advantages}，价格可小刀，欢迎咨询！'
    ],
    books: [
      '【正版图书】《{title}》，{author}著，{condition}。内容{contentQuality}，适合{targetAudience}。{notes}',
      '【学习资料】{subject}相关书籍，{condition}，{contentDescription}。对{examType}有帮助，{extras}。',
      '【经典收藏】《{title}》，{edition}，{condition}。{specialFeatures}，{sentimentalValue}。'
    ],
    daily: [
      '【生活用品】{itemName}，{condition}，{functionality}。{usageDescription}，{reasonForSelling}。',
      '【实用好物】{itemName}，{features}，{advantages}。适合{usageScenario}，{priceReason}。',
      '【闲置转让】{itemName}，{condition}，{purchaseTime}。{qualityDescription}，{contactInfo}。'
    ],
    sports: [
      '【运动装备】{itemName}，{condition}，{performance}。适合{sportType}，{userLevel}。{accessories}。',
      '【健身好物】{itemName}，{usageFrequency}，{maintenance}。{functionalDescription}，{suitableCrowd}。',
      '【运动必备】{itemName}，{brandQuality}，{wearCondition}。{sportAdvantages}，{reasonForTransfer}。'
    ],
    clothing: [
      '【时尚单品】{itemName}，{size}，{color}，{condition}。{styleDescription}，{suitableOccasion}。',
      '【品质服装】{itemName}，{material}，{workmanship}。{wearingExperience}，{matchingSuggestions}。',
      '【换季清仓】{itemName}，{purchaseChannel}，{authenticity}。{conditionDescription}，{priceAdvantage}。'
    ]
  }

  // 智能关键词库
  const smartKeywords = {
    condition: ['全新', '九成新', '八成新', '轻微使用', '保养良好', '无损坏'],
    features: ['功能齐全', '性能稳定', '使用方便', '外观精美', '品质优良', '性价比高'],
    advantages: ['价格实惠', '质量可靠', '转手急售', '支持验货', '包邮送货', '售后保障'],
    urgency: ['急售', '低价转让', '限时优惠', '先到先得', '错过可惜', '诚心交易']
  }

  // 生成商品描述
  const generateProductDescription = async (productInfo: {
    category: string
    brand?: string
    model?: string
    condition: string
    usage?: string
    features?: string[]
    reason?: string
    targetPrice?: number
    originalPrice?: number
    [key: string]: any
  }) => {
    isGenerating.value = true
    try {
      // 模拟AI生成过程（实际项目中可以调用真实的AI API）
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // 根据商品类别选择合适的模板
      const category = productInfo.category || 'daily'
      const templates = descriptionTemplates[category as keyof typeof descriptionTemplates] || descriptionTemplates.daily
      
      // 随机选择一个模板
      const template = templates[Math.floor(Math.random() * templates.length)]
      
      // 填充模板变量
      let description = template
      
      // 替换基本变量
      description = description.replace(/{brand}/g, productInfo.brand || '品牌')
      description = description.replace(/{model}/g, productInfo.model || '型号')
      description = description.replace(/{condition}/g, productInfo.condition || '良好')
      description = description.replace(/{reason}/g, productInfo.reason || '闲置转让')
      
      // 添加智能关键词
      const randomCondition = smartKeywords.condition[Math.floor(Math.random() * smartKeywords.condition.length)]
      const randomFeature = smartKeywords.features[Math.floor(Math.random() * smartKeywords.features.length)]
      const randomAdvantage = smartKeywords.advantages[Math.floor(Math.random() * smartKeywords.advantages.length)]
      
      description = description.replace(/{usage}/g, productInfo.usage || randomCondition)
      description = description.replace(/{features}/g, (productInfo.features || [randomFeature]).join('、'))
      description = description.replace(/{performance}/g, randomFeature)
      description = description.replace(/{advantages}/g, randomAdvantage)
      
      // 添加价格信息
      if (productInfo.targetPrice && productInfo.originalPrice) {
        const discount = Math.round((productInfo.targetPrice / productInfo.originalPrice) * 100)
        description += `原价${productInfo.originalPrice}元，现仅需${productInfo.targetPrice}元，相当于${discount}折！`
      }
      
      // 添加交易信息
      description += '\n\n【交易说明】\n'
      description += '• 支持当面交易，可现场验货\n'
      description += '• 诚心购买可适当小刀\n'
      description += '• 交易地点可协商，优先考虑校内\n'
      description += '• 如有疑问欢迎随时咨询'
      
      generatedContent.value = description
      
      // 生成相关建议
      generateSuggestions(productInfo)
      
      return description
    } catch (error) {
      console.error('AI生成商品描述失败:', error)
      throw new Error('生成失败，请稍后重试')
    } finally {
      isGenerating.value = false
    }
  }

  // 生成建议
  const generateSuggestions = (productInfo: any) => {
    const suggestions = []
    
    // 价格建议
    if (productInfo.originalPrice && !productInfo.targetPrice) {
      const suggestedPrice = Math.round(productInfo.originalPrice * 0.7)
      suggestions.push(`建议售价：${suggestedPrice}元（约为原价的7折）`)
    }
    
    // 分类建议
    if (!productInfo.category) {
      suggestions.push('请选择商品分类，有助于提高曝光率')
    }
    
    // 图片建议
    suggestions.push('建议上传清晰的商品图片，多角度展示商品细节')
    
    // 描述建议
    if (!productInfo.features || productInfo.features.length === 0) {
      suggestions.push('添加商品特色描述，让买家更了解商品优势')
    }
    
    // 交易建议
    suggestions.push('建议选择安全的交易地点，如学校公共场所')
    
    aiSuggestions.value = suggestions
  }

  // 优化商品标题
  const optimizeProductTitle = (title: string, category: string) => {
    const optimizations = []
    
    // 添加关键词
    if (!title.includes('校园')) {
      optimizations.push('校园')
    }
    
    if (!title.includes('二手')) {
      optimizations.push('二手')
    }
    
    // 根据分类添加关键词
    const categoryKeywords = {
      electronics: ['电子产品', '数码'],
      books: ['教材', '书籍', '学习资料'],
      daily: ['日用品', '生活用品'],
      sports: ['运动', '健身', '体育用品'],
      clothing: ['服装', '穿搭', '时尚']
    }
    
    const keywords = categoryKeywords[category as keyof typeof categoryKeywords] || []
    keywords.forEach(keyword => {
      if (!title.includes(keyword)) {
        optimizations.push(keyword)
      }
    })
    
    // 添加吸引力词汇
    const attractiveWords = ['优质', '实惠', '急售', '精品']
    const randomWord = attractiveWords[Math.floor(Math.random() * attractiveWords.length)]
    if (!title.includes(randomWord)) {
      optimizations.push(randomWord)
    }
    
    return optimizations.length > 0 ? `${randomWord}${title} ${optimizations.slice(1).join('')}` : title
  }

  // 魔术链接登录
  const loginWithMagicLink = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: window.location.origin,
          shouldCreateUser: false // 不自动创建新用户
        }
      })
      
      if (error) throw error
      
      return { success: true, message: '登录链接已发送到您的邮箱' }
    } catch (error: any) {
      console.error('魔术链接登录失败:', error)
      return { 
        success: false, 
        message: error.message || '发送登录链接失败' 
      }
    }
  }

  // 智能客服对话
  const smartCustomerService = async (question: string, context?: any) => {
    const responses = {
      '价格': '价格可以商量，诚心购买可以适当优惠。',
      '新旧': '商品成色如描述所示，支持当面验货。',
      '交易': '支持校内当面交易，安全便捷。',
      '包邮': '小件商品可以包邮，大件商品建议当面交易。',
      '退换': '当面验收后不支持退换，请仔细检查。',
      '保修': '二手商品无保修，但保证描述属实。'
    }
    
    // 简单的关键词匹配
    for (const [keyword, response] of Object.entries(responses)) {
      if (question.includes(keyword)) {
        return response
      }
    }
    
    // 默认回复
    return '感谢您的咨询！我会尽快回复您的问题。如有紧急情况，也可以通过联系方式直接联系我。'
  }

  // 清除生成的内容
  const clearGeneratedContent = () => {
    generatedContent.value = ''
    aiSuggestions.value = []
    isGenerating.value = false
  }

  return {
    isGenerating,
    generatedContent,
    aiSuggestions,
    generateProductDescription,
    optimizeProductTitle,
    loginWithMagicLink,
    smartCustomerService,
    clearGeneratedContent
  }
})