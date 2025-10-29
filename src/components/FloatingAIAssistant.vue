<template>
  <div class="floating-ai-assistant">
    <!-- 悬浮AI图标 -->
    <div 
      class="ai-float-button"
      :class="{ 'active': isExpanded }"
      @click="toggleAI"
    >
      <div class="ai-icon">
        <span v-if="!isLoading">🤖</span>
        <span v-else class="loading">💭</span>
      </div>
      <div class="notification-dot" v-if="hasNotification"></div>
    </div>

    <!-- AI助手面板 -->
    <div v-if="isExpanded" class="ai-panel" :class="{ 'minimized': isMinimized }">
      <!-- 面板头部 -->
      <div class="panel-header">
        <div class="ai-info">
          <div class="ai-avatar">🤖</div>
          <div class="ai-details">
            <h3>小助手</h3>
            <p :class="statusClass">{{ statusText }}</p>
          </div>
        </div>
        <div class="panel-controls">
          <button @click="toggleMinimize" class="control-btn">
            <span>{{ isMinimized ? '□' : '−' }}</span>
          </button>
          <button @click="closeAI" class="control-btn close">
            <span>×</span>
          </button>
        </div>
      </div>

      <!-- 聊天区域 -->
      <div v-if="!isMinimized" class="chat-area">
        <!-- 快速功能按钮 -->
        <div class="quick-actions">
          <button 
            v-for="action in quickActions" 
            :key="action.id"
            @click="executeQuickAction(action)"
            class="quick-action-btn"
          >
            <span class="action-icon">{{ action.icon }}</span>
            <span class="action-text">{{ action.name }}</span>
          </button>
        </div>

        <!-- 消息列表 -->
        <div class="messages-container" ref="messagesContainer">
          <div 
            v-for="message in messages" 
            :key="message.id"
            class="message"
            :class="message.type"
          >
            <div class="message-bubble">
              <div class="message-content">{{ message.content }}</div>
              <div class="message-time">{{ formatTime(message.timestamp) }}</div>
            </div>
          </div>
          
          <!-- 输入中指示器 -->
          <div v-if="isTyping" class="typing-indicator">
            <div class="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-area">
          <div class="input-toolbar">
            <button @click="toggleVoiceInput" class="toolbar-btn" :class="{ active: isVoiceInput }">
              🎤
            </button>
            <button @click="showImagePicker" class="toolbar-btn">
              📷
            </button>
            <button @click="showQuickActions" class="toolbar-btn">
              ⚡
            </button>
          </div>
          
          <div class="input-container">
            <textarea
              v-model="userInput"
              :placeholder="isVoiceInput ? '点击开始语音输入...' : '输入消息...'"
              @keydown.enter.prevent="sendMessage"
              @input="onInputChange"
              class="message-input"
              rows="1"
              ref="messageInput"
            ></textarea>
            <button 
              @click="sendMessage" 
              :disabled="!canSend"
              class="send-btn"
            >
              <span v-if="!isVoiceInput">➤</span>
              <span v-else>🎤</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useAIAssistantEnhancedStore } from '@/stores/ai-assistant-enhanced'

const aiStore = useAIAssistantEnhancedStore()

// 状态管理
const isExpanded = ref(false)
const isMinimized = ref(false)
const isLoading = ref(false)
const isTyping = ref(false)
const isVoiceInput = ref(false)
const hasNotification = ref(false)
const userInput = ref('')
const messages = ref([
  {
    id: 1,
    type: 'ai',
    content: '你好！我是校园二手交易平台的AI助手，有什么可以帮助你的吗？',
    timestamp: new Date()
  }
])

// 快速操作定义
const quickActions = [
  { id: 'describe', name: '生成描述', icon: '✍️', action: 'generateProductDescription' },
  { id: 'price', name: '价格分析', icon: '💰', action: 'analyzeProductPrice' },
  { id: 'search', name: '智能搜索', icon: '🔍', action: 'smartSearch' },
  { id: 'safety', name: '安全检测', icon: '🛡️', action: 'checkTransactionSafety' },
  { id: 'recommend', name: '个性推荐', icon: '⭐', action: 'getRecommendations' },
  { id: 'help', name: '使用帮助', icon: '❓', action: 'showHelp' }
]

// 计算属性
const statusText = computed(() => {
  if (isLoading.value) return '思考中...'
  if (isTyping.value) return '输入中...'
  return '在线'
})

const statusClass = computed(() => ({
  'status-online': !isLoading.value && !isTyping.value,
  'status-thinking': isLoading.value,
  'status-typing': isTyping.value
}))

const canSend = computed(() => {
  return userInput.value.trim() && !isLoading.value
})

// 方法定义
const toggleAI = () => {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value) {
    hasNotification.value = false
    nextTick(() => {
      focusInput()
    })
  }
}

const closeAI = () => {
  isExpanded.value = false
  isMinimized.value = false
}

const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value
}

const toggleVoiceInput = () => {
  isVoiceInput.value = !isVoiceInput.value
  if (isVoiceInput.value) {
    startVoiceRecognition()
  } else {
    stopVoiceRecognition()
  }
}

const showImagePicker = () => {
  addMessage('我拍了张照片，请帮我分析', 'user')
  setTimeout(() => {
    addMessage('我看到您上传了图片，这是电子产品类的商品吗？我可以帮您生成商品描述。', 'ai')
  }, 1000)
}

const showQuickActions = () => {
  addMessage('以下是一些快捷功能，您可以直接点击使用：\n• 生成商品描述\n• 分析商品价格\n• 智能搜索商品\n• 安全交易检测\n• 个性化推荐', 'ai')
}

const executeQuickAction = async (action: any) => {
  addMessage(`正在执行：${action.name}`, 'user')
  isLoading.value = true
  
  try {
    switch (action.action) {
      case 'generateProductDescription':
        await handleGenerateDescription()
        break
      case 'analyzeProductPrice':
        await handleAnalyzePrice()
        break
      case 'smartSearch':
        await handleSmartSearch()
        break
      case 'checkTransactionSafety':
        await handleSafetyCheck()
        break
      case 'getRecommendations':
        await handleGetRecommendations()
        break
      case 'showHelp':
        await handleShowHelp()
        break
    }
  } catch (error) {
    console.error('执行操作失败:', error)
    addMessage('抱歉，执行操作时出现了问题，请稍后重试。', 'ai')
  } finally {
    isLoading.value = false
  }
}

const sendMessage = async () => {
  if (!canSend.value) return
  
  const message = userInput.value.trim()
  addMessage(message, 'user')
  userInput.value = ''
  
  isLoading.value = true
  isTyping.value = true
  
  try {
    // 直接调用n8n网站助手工作流
    console.log('🚀 调用n8n网站助手工作流:', message)
    
    // 使用与AI助手页面相同的n8n工作流URL
    const n8nWebhookUrl = 'https://cchencchen0512.app.n8n.cloud/webhook/campus-chat'
    console.log('📡 工作流URL:', n8nWebhookUrl)
    
    // 构建与AI助手页面相同的请求数据格式
    const requestBody = {
      message: message,
      userId: 'website-user-' + Date.now(),
      sessionId: 'session-' + Date.now(),
      context: {
        pageType: 'floating-assistant',
        userIntent: 'general-chat',
        platform: 'campus-marketplace',
        timestamp: new Date().toISOString()
      }
    }
    console.log('📤 请求数据:', requestBody)
    
    // 添加请求头，确保兼容性
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Campus-Marketplace-Client/1.0'
    }
    
    console.log('📤 请求头:', headers)
    
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody),
      mode: 'cors' // 确保跨域请求
    })

    console.log('📥 响应状态:', response.status, response.statusText)
    console.log('📥 响应头:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      // 尝试获取详细的错误信息
      let errorDetails = ''
      try {
        const errorText = await response.text()
        console.error('❌ 响应错误内容:', errorText)
        
        // 尝试解析为JSON
        try {
          const errorData = JSON.parse(errorText)
          errorDetails = JSON.stringify(errorData, null, 2)
        } catch {
          errorDetails = errorText
        }
      } catch (textError) {
        console.error('❌ 无法读取错误响应:', textError)
        errorDetails = '无法读取错误详情'
      }
      
      throw new Error(`n8n工作流调用失败: ${response.status} ${response.statusText}\n\n错误详情:\n${errorDetails}`)
    }

    // 尝试解析响应
    let data
    try {
      const responseText = await response.text()
      console.log('📥 原始响应文本:', responseText)
      
      // 尝试解析为JSON
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('❌ JSON解析失败:', parseError)
        throw new Error(`响应格式错误: 无法解析为JSON\n原始响应: ${responseText}`)
      }
    } catch (responseError) {
      console.error('❌ 读取响应失败:', responseError)
      throw new Error(`读取响应失败: ${responseError.message}`)
    }
    
    console.log('📥 收到n8n响应:', data)
    
    // 验证响应格式 - 支持数组和对象格式
    if (data) {
      // 如果是数组，取第一个元素
      let responseData = data
      if (Array.isArray(data) && data.length > 0) {
        responseData = data[0]
        console.log('📥 检测到数组格式，使用第一个元素:', responseData)
      }
      
      if (typeof responseData === 'object') {
        if (responseData.success === true && responseData.reply) {
          // ✅ 收到真实的AI回复！
          console.log('✅ 收到AI回复:', responseData.reply)
          addMessage(responseData.reply, 'ai')
        } else if (responseData.success === true && responseData.data && responseData.data.response) {
          // ✅ 兼容旧格式：收到真实的AI回复！
          console.log('✅ 收到AI回复(旧格式):', responseData.data.response)
          addMessage(responseData.data.response, 'ai')
        } else if (responseData.message) {
          // 工作流返回了错误消息
          throw new Error(`工作流错误: ${responseData.message}`)
        } else if (responseData.error) {
          // 工作流返回了错误信息
          throw new Error(`工作流错误: ${JSON.stringify(responseData.error)}`)
        } else {
          // ❌ 响应格式不符合预期
          console.error('❌ 响应格式不符合预期:', responseData)
          throw new Error(`响应格式错误: 期望 {success: true, reply: string}, 实际: ${JSON.stringify(responseData)}`)
        }
      } else {
        throw new Error(`无效的响应格式: 期望JSON对象或数组, 实际: ${typeof responseData}`)
      }
    } else {
      throw new Error('响应数据为空')
    }
  } catch (error) {
    console.error('❌ AI回复失败:', error)
    console.error('❌ 错误详情:', error.message)
    console.error('❌ 错误堆栈:', error.stack)
    
    // 显示具体的错误信息给用户
    const errorMessage = `🚨 AI助手连接失败\n\n错误详情：${error.message}\n\n请检查：\n• n8n工作流是否正常运行\n• 网络连接是否稳定\n• 工作流URL是否正确\n\n正在使用备用回复...`
    addMessage(errorMessage, 'ai')
    
    // 使用备用回复
    const backupResponse = getBackupResponse(message)
    setTimeout(() => {
      addMessage(backupResponse, 'ai')
    }, 2000)
  } finally {
    isLoading.value = false
    isTyping.value = false
  }
}

// 备用回复生成器 - 基于校园二手交易场景
const getBackupResponse = (userMessage: string) => {
  const msg = userMessage.toLowerCase()
  
  if (msg.includes('价格') || msg.includes('多少钱') || msg.includes('贵不贵')) {
    return `📊 **价格咨询助手**

我来帮您分析商品价格！请告诉我：

**商品信息：**
• 商品类型（手机、电脑、书籍等）
• 品牌型号
• 成色新旧
• 原价大概多少

**我能提供：**
• 市场价格对比
• 合理价格区间
• 成色折价建议
• 学生专享优惠参考

**小贴士：**
九成新的电子产品通常比原价便宜20-40%哦！`
  }
  
  if (msg.includes('描述') || msg.includes('怎么写') || msg.includes('介绍')) {
    return `✍️ **商品描述生成器**

我来帮您写吸引人的商品描述！

**告诉我：**
• 商品基本信息
• 使用情况和成色
• 转让原因
• 特色亮点

**描述模板：**
1. 开头：成色+品牌+型号
2. 中间：使用情况+功能状态
3. 亮点：性价比+转让原因
4. 结尾：交易方式+联系方式

**示例：**
"九成新iPhone 12，功能完好..."`
  }
  
  if (msg.includes('安全') || msg.includes('骗子') || msg.includes('风险')) {
    return `🛡️ **交易安全指南**

**重要提醒：**安全第一！

**当面交易：**
• 选择图书馆、食堂等公共场所
• 白天交易，避免单独前往
• 仔细检查商品功能
• 确认无误后再付款

**支付安全：**
• 避免提前转账
• 使用微信/支付宝可追溯支付
• 保留聊天记录和转账凭证

**警惕信号：**
• 价格异常低廉
• 拒绝当面交易
• 催促快速付款
• 信息描述模糊

有问题随时问我！`
  }
  
  if (msg.includes('搜索') || msg.includes('找') || msg.includes('推荐')) {
    return `🔍 **智能搜索助手**

我来帮您找到心仪的商品！

**搜索技巧：**
• 使用具体关键词：品牌+型号
• 按分类浏览：电子产品、书籍、生活用品
• 设置价格区间筛选
• 按成色排序：全新→九成新→八成新

**热门分类：**
📱 电子产品：手机、电脑、耳机
📚 教材书籍：专业课、考研资料
🏃 运动器材：健身器材、球类用品
👕 服装鞋帽：品牌服饰、运动鞋

告诉我您想找什么，我来推荐！`
  }
  
  if (msg.includes('登录') || msg.includes('注册') || msg.includes('账户')) {
    return `👤 **账户问题解答**

**登录问题：**
• 检查邮箱和密码是否正确
• 清除浏览器缓存重试
• 使用验证码登录
• 联系客服重置密码

**注册问题：**
• 使用学校邮箱注册
• 完善个人信息提高信誉
• 上传学生证认证
• 绑定手机号增强安全

**账户安全：**
• 定期修改密码
• 开启双重验证
• 不共享账户信息
• 及时更新联系方式

需要具体帮助请告诉我！`
  }
  
  // 默认回复 - 校园二手交易专业版
  return `🤖 **校园二手交易AI助手**

您好！我是您的专属交易助手，为您提供：

**💡 我能帮您：**
• 🔍 智能商品搜索和推荐
• 💰 价格分析和评估
• ✍️ 商品描述优化
• 🛡️ 交易安全指导
• 📋 账户问题解答

**🔥 热门服务：**
• 生成吸引人的商品描述
• 分析商品合理价格
• 搜索性价比高的商品
• 提供交易安全建议
• 推荐个性化商品

**💬 直接提问：**
• "帮我找一台笔记本电脑"
• "这个商品多少钱合适"
• "怎么写商品描述"
• "交易时需要注意什么"

我是您的校园交易好帮手，随时为您服务！`
}

const addMessage = (content: string, type: 'user' | 'ai') => {
  const newMessage = {
    id: Date.now(),
    type,
    content,
    timestamp: new Date()
  }
  messages.value.push(newMessage)
  scrollToBottom()
}

// 移除本地意图识别逻辑，直接调用AI服务

const handleGenerateDescription = async () => {
  try {
    const response = await aiStore.generateProductDescription({
      category: 'electronics',
      brand: 'iPhone',
      model: '12',
      condition: '九成新',
      usageTime: 12,
      originalPrice: 6299,
      reason: '闲置转让',
      features: ['功能齐全', '外观精美', '性能稳定']
    })
    addMessage(response, 'ai')
  } catch (error) {
    console.error('生成描述失败:', error)
    addMessage('我可以帮您生成商品描述。比如：\n• 商品类型（手机、电脑、书籍等）\n• 品牌和型号\n• 成色和使用时长\n• 为什么要转让', 'ai')
  }
}

const handleAnalyzePrice = async () => {
  try {
    const response = await aiStore.analyzeProductPrice({
      category: 'electronics',
      condition: '九成新',
      usageTime: 12,
      originalPrice: 6299
    })
    addMessage(response, 'ai')
  } catch (error) {
    console.error('价格分析失败:', error)
    addMessage('我可以帮您分析商品价格。请提供商品信息，我会基于市场数据给出合理的价格建议，包括：\n• 建议售价\n• 市场价格区间\n• 影响价格的因素', 'ai')
  }
}

const handleSmartSearch = async () => {
  addMessage('智能搜索功能可以帮助您：\n• 按关键词搜索商品\n• 按价格区间筛选\n• 按成色和品牌筛选\n• 推荐相似商品\n\n请告诉我您想找什么商品？', 'ai')
}

const handleSafetyCheck = async () => {
  try {
    const response = await aiStore.checkTransactionSafety({
      price: 3800,
      location: '校内',
      paymentMethod: '当面交易',
      sellerInfo: '学生认证用户'
    })
    addMessage(response, 'ai')
  } catch (error) {
    console.error('安全检测失败:', error)
    addMessage('安全检测功能可以：\n• 分析交易风险\n• 识别可疑用户\n• 提供安全建议\n• 检查商品信息真实性\n\n请提供需要检测的信息。', 'ai')
  }
}

const handleGetRecommendations = async () => {
  addMessage('基于您的浏览历史和偏好，我为您推荐：\n• 热门电子产品\n• 优质图书教材\n• 实用生活用品\n• 性价比高的运动器材\n\n您对哪类商品感兴趣？', 'ai')
}

const handleShowHelp = async () => {
  addMessage('我可以帮您：\n\n📝 **商品相关**\n• 生成商品描述\n• 分析合理价格\n• 推荐商品分类\n\n🔍 **搜索相关**\n• 智能商品搜索\n• 价格趋势分析\n• 个性化推荐\n\n🛡️ **安全相关**\n• 交易安全建议\n• 风险识别提醒\n• 纠纷处理指导\n\n💬 **直接提问**\n您也可以直接问我任何问题！', 'ai')
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const scrollToBottom = () => {
  nextTick(() => {
    const container = document.querySelector('.messages-container')
    if (container) {
      container.scrollTop = container.scrollHeight
      // 确保滚动到底部，使用平滑滚动
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      })
    }
  })
}

const focusInput = () => {
  const input = document.querySelector('.message-input') as HTMLTextAreaElement
  if (input) {
    input.focus()
  }
}

const onInputChange = () => {
  // 自动调整输入框高度
  const input = document.querySelector('.message-input') as HTMLTextAreaElement
  if (input) {
    input.style.height = 'auto'
    input.style.height = input.scrollHeight + 'px'
  }
}

// 语音识别相关（模拟）
let recognition: any = null

const startVoiceRecognition = () => {
  // 模拟语音识别
  userInput.value = '正在听取语音输入...'
  setTimeout(() => {
    userInput.value = '这是语音输入的测试内容'
  }, 2000)
}

const stopVoiceRecognition = () => {
  if (recognition) {
    recognition.stop()
  }
}

// 生命周期
onMounted(() => {
  // 初始化AI配置
  aiStore.configureAI()
  
  // 模拟通知
  setTimeout(() => {
    if (!isExpanded.value) {
      hasNotification.value = true
    }
  }, 5000)
  
  // 监听键盘事件
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isExpanded.value) {
      closeAI()
    }
  })
})

onUnmounted(() => {
  stopVoiceRecognition()
})
</script>

<style scoped>
.floating-ai-assistant {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 9999; /* 确保在最上层 */
  pointer-events: none; /* 允许点击穿透到下面的元素 */
}

.floating-ai-assistant * {
  pointer-events: auto; /* 组件内部元素可以接收事件 */
}

.ai-float-button {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;
}

.ai-float-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 30px rgba(102, 126, 234, 0.6);
}

.ai-float-button.active {
  transform: scale(0.9);
}

.ai-icon {
  font-size: 24px;
  animation: bounce 2s infinite;
}

.loading {
  animation: pulse 1s infinite;
}

.notification-dot {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 12px;
  height: 12px;
  background: #ff4757;
  border-radius: 50%;
  animation: pulse 1s infinite;
}

.ai-panel {
  position: absolute;
  bottom: 80px;
  right: 0;
  width: 380px;
  height: 600px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

.ai-panel.minimized {
  height: 60px;
}

.panel-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ai-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.ai-details h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.ai-details p {
  margin: 0;
  font-size: 12px;
  opacity: 0.8;
}

.status-online { color: #2ed573; }
.status-thinking { color: #ffa502; }
.status-typing { color: #70a1ff; }

.panel-controls {
  display: flex;
  gap: 8px;
}

.control-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.control-btn.close:hover {
  background: #ff4757;
}

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

.quick-actions {
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  background: white;
  border-bottom: 1px solid #e9ecef;
}

.quick-action-btn {
  padding: 8px 4px;
  border: 1px solid #e9ecef;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
  font-size: 12px;
}

.quick-action-btn:hover {
  background: #f8f9fa;
  border-color: #667eea;
  transform: translateY(-1px);
}

.action-icon {
  font-size: 16px;
}

.action-text {
  font-size: 10px;
  color: #495057;
}

.messages-container {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 300px;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.message {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.message.user {
  justify-content: flex-end;
}

.message.ai {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 18px;
  position: relative;
}

.message.user .message-bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.message.ai .message-bubble {
  background: white;
  color: #495057;
  border: 1px solid #e9ecef;
  border-bottom-left-radius: 4px;
}

.message-content {
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
}

.message-time {
  font-size: 10px;
  opacity: 0.7;
  margin-top: 4px;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 18px;
  border-bottom-left-radius: 4px;
  width: fit-content;
}

.typing-dots {
  display: flex;
  gap: 4px;
}

.typing-dots span {
  width: 8px;
  height: 8px;
  background: #667eea;
  border-radius: 50%;
  animation: typingDot 1.4s infinite;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

.input-area {
  background: white;
  border-top: 1px solid #e9ecef;
}

.input-toolbar {
  padding: 8px 12px;
  display: flex;
  gap: 12px;
  border-bottom: 1px solid #f8f9fa;
}

.toolbar-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s ease;
}

.toolbar-btn:hover {
  background: #f8f9fa;
}

.toolbar-btn.active {
  background: #667eea;
  color: white;
}

.input-container {
  padding: 12px;
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e9ecef;
  border-radius: 24px;
  resize: none;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.4;
  max-height: 100px;
  outline: none;
  transition: border-color 0.2s ease;
}

.message-input:focus {
  border-color: #667eea;
}

.send-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s ease;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes typingDot {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

@media (max-width: 768px) {
  .floating-ai-assistant {
    bottom: 20px;
    right: 20px;
  }
  
  .ai-panel {
    width: 320px;
    height: 500px;
    right: -20px;
  }
  
  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>