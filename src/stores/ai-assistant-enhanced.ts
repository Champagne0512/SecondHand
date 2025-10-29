import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 增强版AI助手store - 内置DeepSeek API模式
export const useAIAssistantEnhancedStore = defineStore('aiAssistantEnhanced', () => {
  // 状态管理
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  // AI服务配置 - 支持DeepSeek API和n8n工作流
  const apiKey = ref('sk-98e0a077fdbe422585855c3b10f03986')
  const apiEndpoint = ref('https://api.deepseek.com/v1/chat/completions')
  const n8nWebhookUrl = ref('https://cchencchen0512.app.n8n.cloud/webhook/02baeca7-10b5-4800-a9e4-7a85c857c10e/chat')
  const isConfigured = ref(true) // 内置模式，始终已配置
  const provider = ref('n8n-workflow') // 默认使用n8n工作流

  // 聊天记录
  const chatHistory = ref<Array<{
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: Date
    metadata?: any
  }>>([])

  // 当前对话上下文
  const currentContext = ref<{
    pageType?: string
    userIntent?: string
    productInfo?: any
    searchQuery?: any
  }>({})

  // AI配置 - 内置DeepSeek配置
  const aiConfig = ref({
    provider: 'deepseek', // 内置DeepSeek API
    model: 'deepseek-chat', // DeepSeek模型
    maxTokens: 1000,
    temperature: 0.7,
    language: 'zh-CN'
  })

  // 计算属性
  const hasValidConfig = computed(() => {
    return isConfigured.value && apiKey.value && apiEndpoint.value
  })

  const recentMessages = computed(() => {
    return chatHistory.value.slice(-10)
  })

  const contextSummary = computed(() => {
    return {
      pageType: currentContext.value.pageType || 'unknown',
      userIntent: currentContext.value.userIntent || 'general',
      hasProductInfo: !!currentContext.value.productInfo,
      hasSearchQuery: !!currentContext.value.searchQuery
    }
  })

  // 私有方法
  const generateMessageId = () => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const buildSystemPrompt = (context: any) => {
    const basePrompt = `你是一个专业的校园二手交易平台AI助手。请用中文回复，语气友好、专业、有耐心。

当前上下文：
- 页面类型：${context.pageType || '通用'}
- 用户意图：${context.userIntent || '一般咨询'}
- 时间：${new Date().toLocaleString('zh-CN')}

请根据上下文提供准确、有用的帮助。如果是商品相关问题，请考虑商品的特性、市场价格、交易安全等因素。`

    return basePrompt
  }

  const buildProductDescriptionPrompt = (productInfo: any) => {
    return `请为以下商品生成一个专业、吸引人的商品描述：

商品信息：
- 分类：${productInfo.category || '未指定'}
- 品牌：${productInfo.brand || '未指定'}
- 成色：${productInfo.condition || '未指定'}
- 使用时间：${productInfo.usageTime || '未指定'}个月
- 原价：${productInfo.originalPrice || '未指定'}元
- 转让原因：${productInfo.reason || '未指定'}
- 特色：${productInfo.features?.join(', ') || '未指定'}

要求：
1. 描述要真实、详细，突出商品优点
2. 包含价格优势和转让诚意
3. 提及交易方式和售后保障
4. 语言要亲切、有说服力
5. 适当使用emoji增加亲和力

请生成一段适合校园二手交易平台的商品描述。`
  }

  const buildPriceAnalysisPrompt = (productData: any) => {
    return `请分析以下商品的价格合理性：

商品信息：
- 分类：${productData.category}
- 成色：${productData.condition}
- 使用时间：${productData.usageTime}个月
- 原价：${productData.originalPrice}元

请提供：
1. 建议售价范围
2. 价格影响因素分析
3. 市场竞争力评估
4. 成交建议

请用数据和市场逻辑支撑您的分析。`
  }

  const buildSafetyCheckPrompt = (transactionInfo: any) => {
    return `请分析以下交易信息的安全性：

交易信息：
${JSON.stringify(transactionInfo, null, 2)}

请评估：
1. 交易风险等级（低/中/高）
2. 可能的风险点
3. 安全建议
4. 需要注意的细节

请提供具体、实用的安全指导。`
  }

  // n8n工作流调用方法 - 使用你的网站助手工作流
  const callN8nWorkflow = async (userMessage: string, context: any) => {
    try {
      // 使用新的Webhook工作流地址
      const workflowUrl = 'https://cchencchen0512.app.n8n.cloud/webhook/campus-chat'
      
      console.log('🚀 调用n8n网站助手工作流:', workflowUrl)
      console.log('📤 发送消息:', userMessage)
      console.log('📝 上下文:', context)
      
      // 标准Webhook节点期望的格式
      const requestBody = {
        message: userMessage,
        userId: context.userId || 'anonymous',
        sessionId: context.sessionId || `session_${Date.now()}`,
        context: {
          pageType: context.pageType || 'general',
          userIntent: context.userIntent || 'general-chat',
          platform: 'campus-marketplace',
          timestamp: new Date().toISOString()
        }
      }
      
      console.log('📤 请求体:', requestBody)
      
      const response = await fetch(workflowUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })
      
      console.log('📥 响应状态:', response.status, response.statusText)
      console.log('📥 响应头:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        // 获取详细的错误信息
        let errorDetails = ''
        try {
          const errorText = await response.text()
          errorDetails = errorText
        } catch (e) {
          errorDetails = '无法获取错误详情'
        }
        
        console.error('❌ n8n工作流详细错误:', errorDetails)
        throw new Error(`n8n工作流调用失败: ${response.statusText} (${response.status}) - ${errorDetails.substring(0, 200)}`)
      }

      // 检查响应体是否为空
      const responseText = await response.text()
      console.log('📥 原始响应文本:', responseText)
      
      if (!responseText || responseText.trim() === '') {
        console.error('❌ n8n工作流返回空响应体')
        throw new Error('n8n工作流返回空响应，请检查工作流配置')
      }

      // 尝试解析JSON
      let data
      try {
        data = JSON.parse(responseText)
        console.log('📥 解析后的JSON数据:', data)
      } catch (parseError) {
        console.error('❌ JSON解析失败:', parseError)
        console.error('❌ 原始响应内容:', responseText)
        throw new Error(`JSON解析失败: ${parseError.message} - 响应内容: ${responseText.substring(0, 200)}`)
      }
      console.log('📥 收到n8n响应:', data)
      
      // 处理n8n工作流可能的多种响应格式
      if (data.success && data.reply) {
        // 新的Webhook工作流格式：{ success: true, reply: "AI回复内容" }
        return data.reply
      } else if (data.success && data.data && data.data.response) {
        return data.data.response
      } else if (data.success && data.data && data.data.message) {
        return data.data.message
      } else if (data.message) {
        return data.message
      } else if (data.response) {
        return data.response
      } else if (data.choices && data.choices[0] && data.choices[0].message) {
        // DeepSeek API直接返回的格式
        return data.choices[0].message.content
      } else if (typeof data === 'string') {
        return data
      } else {
        console.warn('n8n工作流返回未知格式，尝试提取文本内容:', data)
        // 尝试从对象中提取文本内容
        const textContent = extractTextFromObject(data)
        return textContent || '收到AI回复，但格式需要调整'
      }
    } catch (error) {
      console.error('❌ n8n工作流调用失败:', error)
      throw error
    }
  }

  // 从对象中提取文本内容的辅助函数
  const extractTextFromObject = (obj: any): string => {
    if (typeof obj === 'string') return obj
    if (typeof obj === 'number' || typeof obj === 'boolean') return obj.toString()
    
    if (obj && typeof obj === 'object') {
      // 优先查找常见的文本字段
      if (obj.content) return obj.content
      if (obj.text) return obj.text
      if (obj.message) return obj.message
      if (obj.response) return obj.response
      if (obj.result) return obj.result
      
      // 尝试从数组或嵌套对象中提取
      if (Array.isArray(obj)) {
        for (const item of obj) {
          const text = extractTextFromObject(item)
          if (text) return text
        }
      } else {
        // 遍历对象属性
        for (const key in obj) {
          if (obj[key] && typeof obj[key] === 'string' && obj[key].length > 0) {
            return obj[key]
          }
        }
      }
    }
    
    return ''
  }

  // 模拟AI响应（当API调用失败时备用）
  const simulateAIResponse = (prompt: string, context: any) => {
    // 基于关键词的模拟响应
    const lowerPrompt = prompt.toLowerCase()
    
    if (lowerPrompt.includes('描述') || lowerPrompt.includes('介绍')) {
      return `基于您的商品信息，我为您生成了专业的描述：

📱 **九成新iPhone 12，性能卓越，诚心转让**

这部iPhone 12是我去年购买的，一直使用保护壳和钢化膜，外观保护得很好，几乎看不出使用痕迹。功能完全正常，电池健康度还有92%，日常使用续航完全够用。

✨ **商品亮点：**
• A14芯片性能强劲，运行流畅
• 6.1英寸超视网膜显示屏，色彩鲜艳
• 支持5G网络，上网速度快
• 拍照效果出色，夜景模式很棒
• 所有功能正常，无维修记录

💰 **价格优势：**
原价6299元，现仅需3800元，相当于6折优惠！这个价格在同成色商品中非常有竞争力。

🤝 **交易方式：**
支持校内当面交易，可以现场验机。诚心购买可适当小刀，但刀价勿扰。希望转让给真正需要的朋友。

📍 **看机地点：**
学校图书馆或食堂，时间可以协商。支持各种功能测试，满意后再交易。

有意者请私信联系，描述清楚，非诚勿扰！`
    }
    
    if (lowerPrompt.includes('价格') || lowerPrompt.includes('多少钱')) {
      return `根据我的市场分析，为您提供以下价格建议：

💰 **建议售价：¥3800**

📊 **价格区间分析：**
• 合理价格区间：¥3500 - ¥4200
• 市场平均价格：¥3950
• 您的价格优势：比市场均价低¥150

🔍 **影响因素：**
1. **成色影响**：九成新，价格系数0.85
2. **使用时间**：12个月，价格系数0.8
3. **品牌保值**：苹果品牌保值率高
4. **市场供需**：同类商品较多，竞争激烈

💡 **成交建议：**
• 当前定价合理，有竞争力
• 建议在一周内成交，避免价格进一步下跌
• 可适当小刀，但底线不低于¥3600
• 毕业季是销售好时机，建议尽快出手`
    }
    
    if (lowerPrompt.includes('安全') || lowerPrompt.includes('风险')) {
      return `🔒 **交易安全分析报告**

⚠️ **风险等级：中等**

🚨 **主要风险点：**
1. **价格异常**：如果售价远低于市场价，需警惕
2. **交易方式**：要求预付定金或线上交易存在风险
3. **商品信息**：描述过于简单或图片模糊
4. **卖家信誉**：新注册账号或评价较少

✅ **安全建议：**
1. **当面交易**：选择校内公共场所，如图书馆、食堂
2. **现场验货**：仔细检查商品功能和外观
3. **拒绝预付**：不支持任何形式的预付定金
4. **保留证据**：保存聊天记录和交易凭证
5. **结伴而行**：最好有朋友陪同交易

🛡️ **安全交易流程：**
联系→约定时间地点→当面验货→满意后付款→完成交易

如遇到可疑情况，请及时向平台举报！`
    }
    
    // 默认回复
    return `您好！我是校园二手交易平台的AI助手。

我可以帮您：
📝 生成专业的商品描述
💰 分析合理的商品价格  
🔍 智能搜索相关商品
🛡️ 检查交易安全风险
⭐ 提供个性化推荐

请告诉我您需要什么帮助，或者直接提问！`
  }

  // 公共方法 - 内置AI模式，不需要用户配置
  const configureAI = (config?: {
    apiKey?: string
    endpoint?: string
    provider?: string
    model?: string
  }) => {
    // 内置模式，使用预设的DeepSeek配置
    apiKey.value = 'sk-98e0a077fdbe422585855c3b10f03986'
    apiEndpoint.value = 'https://api.deepseek.com/v1/chat/completions'
    aiConfig.value.provider = 'deepseek'
    aiConfig.value.model = 'deepseek-chat'
    isConfigured.value = true
    error.value = null
    console.log('AI助手已配置，使用DeepSeek API')
  }

  const addMessage = (content: string, role: 'user' | 'assistant' | 'system' = 'user', metadata?: any) => {
    const message = {
      id: generateMessageId(),
      role,
      content,
      timestamp: new Date(),
      metadata
    }
    chatHistory.value.push(message)
    return message
  }

  const sendMessage = async (userMessage: string, context?: any) => {
    if (!userMessage.trim()) return

    isLoading.value = true
    error.value = null

    try {
      // 添加用户消息
      addMessage(userMessage, 'user', context)

      // 更新上下文
      if (context) {
        currentContext.value = { ...currentContext.value, ...context }
      }

      // 直接调用n8n工作流
      const response = await callN8nWorkflow(userMessage, currentContext.value)
      console.log('✅ n8n网站助手工作流调用成功')

      // 添加AI回复
      const aiMessage = addMessage(response, 'assistant', {
        model: aiConfig.value.model,
        provider: 'n8n-workflow',
        timestamp: new Date()
      })

      return aiMessage
    } catch (err: any) {
      error.value = err.message
      addMessage(`抱歉，我遇到了一些问题：${err.message}`, 'assistant')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const generateProductDescription = async (productInfo: any) => {
    const prompt = buildProductDescriptionPrompt(productInfo)
    
    try {
      const response = await sendMessage(prompt, {
        userIntent: 'generate_description',
        productInfo
      })
      return response.content
    } catch (error) {
      console.error('生成商品描述失败:', error)
      throw error
    }
  }

  const analyzeProductPrice = async (productData: any) => {
    const prompt = buildPriceAnalysisPrompt(productData)
    
    try {
      const response = await sendMessage(prompt, {
        userIntent: 'price_analysis',
        productInfo: productData
      })
      return response.content
    } catch (error) {
      console.error('价格分析失败:', error)
      throw error
    }
  }

  const checkTransactionSafety = async (transactionInfo: any) => {
    const prompt = buildSafetyCheckPrompt(transactionInfo)
    
    try {
      const response = await sendMessage(prompt, {
        userIntent: 'safety_check',
        transactionInfo
      })
      return response.content
    } catch (error) {
      console.error('安全检测失败:', error)
      throw error
    }
  }

  const smartSearch = async (query: string, filters?: any) => {
    try {
      const response = await sendMessage(`搜索商品：${query}`, {
        userIntent: 'smart_search',
        searchQuery: { query, filters }
      })
      return response.content
    } catch (error) {
      console.error('智能搜索失败:', error)
      throw error
    }
  }

  const clearChatHistory = () => {
    chatHistory.value = []
  }

  const updateContext = (newContext: any) => {
    currentContext.value = { ...currentContext.value, ...newContext }
  }

  const resetError = () => {
    error.value = null
  }

  return {
    // 状态
    isLoading,
    error,
    chatHistory,
    currentContext,
    aiConfig,
    hasValidConfig,
    isConfigured,
    
    // 计算属性
    recentMessages,
    contextSummary,
    
    // 方法
    configureAI,
    addMessage,
    sendMessage,
    generateProductDescription,
    analyzeProductPrice,
    checkTransactionSafety,
    smartSearch,
    clearChatHistory,
    updateContext,
    resetError
  }
})