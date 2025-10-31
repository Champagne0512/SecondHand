<template>
  <div class="floating-ai-assistant">
    <!-- 悬浮AI图标 -->
    <div 
      class="ai-float-button"
      :class="{ 'active': isExpanded }"
      @click="toggleAI"
      title="点击打开AI助手"
    >
      <div class="ai-icon">
        <span v-if="!isLoading">🤖</span>
        <span v-else class="loading">💭</span>
      </div>
      <div class="pulse-ring" v-if="isExpanded"></div>
      <div class="notification-dot" v-if="hasNotification"></div>
    </div>

    <!-- AI助手面板 -->
    <div v-if="isExpanded" class="ai-panel" :class="{ 'minimized': isMinimized }">
      <!-- 面板头部 -->
      <div class="panel-header">
        <div class="ai-info">
          <div class="ai-avatar">🤖</div>
          <div class="ai-details">
            <h3>AI助手</h3>
            <p :class="statusClass">{{ statusText }}</p>
          </div>
        </div>
        <div class="panel-controls">
          <button @click="toggleMinimize" class="control-btn" title="最小化">
            <span>{{ isMinimized ? '□' : '−' }}</span>
          </button>
          <button @click="closeAI" class="control-btn close" title="关闭">
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
            :title="action.name"
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
            <span class="typing-text">AI正在思考...</span>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-area">
          <div class="input-toolbar">
            <button @click="toggleVoiceInput" class="toolbar-btn" :class="{ active: isVoiceInput }" title="语音输入">
              🎤
            </button>
            <button @click="showImagePicker" class="toolbar-btn" title="图片识别">
              📷
            </button>
            <button @click="showQuickActions" class="toolbar-btn" title="快捷功能">
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
              :title="isVoiceInput ? '开始录音' : '发送消息'"
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
import { ElMessage } from 'element-plus'
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
    content: '你好！我是AI智能助手，有什么可以帮助你的吗？',
    timestamp: new Date()
  }
])

// 快速操作定义
const quickActions = [
  { id: 'describe', name: '生成描述', icon: '✍️', action: 'generateDescription' },
  { id: 'price', name: '价格分析', icon: '💰', action: 'analyzePrice' },
  { id: 'search', name: '智能搜索', icon: '🔍', action: 'smartSearch' },
  { id: 'safety', name: '安全检测', icon: '🛡️', action: 'safetyCheck' },
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
      case 'generateDescription':
        await handleGenerateDescription()
        break
      case 'analyzePrice':
        await handleAnalyzePrice()
        break
      case 'smartSearch':
        await handleSmartSearch()
        break
      case 'safetyCheck':
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
  try {
    console.log('🚀 调用n8n网站助手工作流:', message)
    
    // 使用修复后的工作流URL
    const n8nWebhookUrl = 'https://cchencchen0512.app.n8n.cloud/webhook/02baeca7-10b5-4800-a9e4-7a85c857c10e/website-assistant'
    console.log('📡 工作流URL:', n8nWebhookUrl)
    
    // 构建请求数据 - 严格按照n8n工作流期望的格式
    const requestBody = {
      message: message,
      userId: 'website-user-' + Date.now(),
      sessionId: 'session-' + Date.now()
    }
    console.log('📤 请求数据:', requestBody)
    
    // 设置请求头
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
    console.log('📤 请求头:', headers)
    
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    })

    console.log('📥 响应状态:', response.status, response.statusText)
    console.log('📥 响应头:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ 响应错误内容:', errorText)
      throw new Error(`n8n工作流调用失败: ${response.status} ${response.statusText}\n${errorText}`)
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
    
    if (data.success && data.reply) {
      // ✅ 收到真实的AI回复！
      console.log('✅ 收到AI回复:', data.reply)
      addMessage(data.reply, 'ai')
    } else {
      // ❌ 没有收到有效回复
      console.error('❌ 未收到有效AI回复:', data)
      throw new Error(`AI回复格式错误: ${JSON.stringify(data)}`)
    }
    
  } catch (error: any) {
    console.error('❌ AI回复失败:', error)
    console.error('❌ 错误详情:', error.message)
    console.error('❌ 错误堆栈:', error.stack)
    ElMessage.error('AI回复失败：' + error.message)
    
    // 显示具体的错误信息给用户
    const errorMessage = `🚨 AI助手暂时无法连接\n\n错误详情：${error.message}\n\n正在使用备用回复...`
    addMessage(errorMessage, 'ai')
    
    // 使用备用回复
    const backupResponse = getBackupResponse(message)
    setTimeout(() => {
      addMessage(backupResponse, 'ai')
    }, 1000)
  } finally {
    isLoading.value = false
    isTyping.value = false
  }
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

const recognizeIntent = async (message: string) => {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('价格') || lowerMessage.includes('多少钱') || lowerMessage.includes('贵不贵')) {
    return { type: 'price_question', data: { message } }
  }
  
  if (lowerMessage.includes('描述') || lowerMessage.includes('怎么写') || lowerMessage.includes('介绍')) {
    return { type: 'description_request', data: { message } }
  }
  
  if (lowerMessage.includes('安全') || lowerMessage.includes('骗子') || lowerMessage.includes('风险')) {
    return { type: 'safety_concern', data: { message } }
  }
  
  if (lowerMessage.includes('搜索') || lowerMessage.includes('找') || lowerMessage.includes('有没有')) {
    return { type: 'search_request', data: { message } }
  }
  
  return { type: 'general', data: { message } }
}

const handlePriceQuestion = async (data: any) => {
  return '我可以帮您分析商品价格。请告诉我您想了解的商品类型、成色和大致的原价，我会基于市场数据给出合理的价格建议。'
}

const handleDescriptionRequest = async (data: any) => {
  return '我可以帮您生成专业的商品描述。请提供商品的基本信息，如品牌、型号、成色、使用时长等，我会为您写一段吸引人的描述。'
}

const handleSafetyConcern = async (data: any) => {
  return '交易安全很重要！我建议您：1) 选择校内公共场所交易 2) 当面验货后再付款 3) 避免提前转账 4) 保留聊天记录。需要我帮您分析具体的交易风险吗？'
}

const handleSearchRequest = async (data: any) => {
  return '我可以帮您智能搜索商品。请告诉我您想找什么类型的商品、预算范围、品牌偏好等，我会为您推荐最合适的商品。'
}

const handleGenerateDescription = async () => {
  addMessage('我可以帮您生成商品描述。请告诉我您的商品信息，比如：\n• 商品类型（手机、电脑、书籍等）\n• 品牌和型号\n• 成色和使用时长\n• 为什么要转让', 'ai')
}

const handleAnalyzePrice = async () => {
  addMessage('我可以帮您分析商品价格。请提供商品信息，我会基于市场数据给出合理的价格建议，包括：\n• 建议售价\n• 市场价格区间\n• 影响价格的因素', 'ai')
}

const handleSmartSearch = async () => {
  addMessage('智能搜索功能可以帮助您：\n• 按关键词搜索商品\n• 按价格区间筛选\n• 按成色和品牌筛选\n• 推荐相似商品\n\n请告诉我您想找什么商品？', 'ai')
}

const handleSafetyCheck = async () => {
  addMessage('安全检测功能可以：\n• 分析交易风险\n• 识别可疑用户\n• 提供安全建议\n• 检查商品信息真实性\n\n请提供需要检测的信息。', 'ai')
}

const handleGetRecommendations = async () => {
  addMessage('基于您的浏览历史和偏好，我为您推荐：\n• 热门电子产品\n• 优质图书教材\n• 实用生活用品\n• 性价比高的运动器材\n\n您对哪类商品感兴趣？', 'ai')
}

const handleShowHelp = async () => {
  addMessage('我可以帮您：\n\n📝 **商品相关**\n• 生成商品描述\n• 分析合理价格\n• 推荐商品分类\n\n🔍 **搜索相关**\n• 智能商品搜索\n• 价格趋势分析\n• 个性化推荐\n\n🛡️ **安全相关**\n• 交易安全建议\n• 风险识别提醒\n• 纠纷处理指导\n\n💬 **直接提问**
您也可以直接问我任何问题！', 'ai')
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const scrollToBottom = () => {
  nextTick(() => {
    const container = document.querySelector('.messages-container')
    if (container) {
      container.scrollTop = container.scrollHeight
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
  const input = document.querySelector('.message-input') as HTMLTextAreaElement
  if (input) {
    input.style.height = 'auto'
    input.style.height = input.scrollHeight + 'px'
  }
}

// 语音识别相关（模拟）
const startVoiceRecognition = () => {
  userInput.value = '正在听取语音输入...'
  setTimeout(() => {
    userInput.value = '这是语音输入的测试内容'
  }, 2000)
}

const stopVoiceRecognition = () => {
  // 模拟停止语音识别
  if (userInput.value === '正在听取语音输入...') {
    userInput.value = ''
  }
}

// 生命周期
onMounted(() => {
  // 模拟初始通知
  setTimeout(() => {
    if (!isExpanded.value) {
      hasNotification.value = true
    }
  }, 3000)
  
  // 监听ESC键关闭
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isExpanded.value) {
      closeAI()
    }
  })
  
  // 监听点击外部关闭
  document.addEventListener('click', (e) => {
    if (isExpanded.value && !e.target.closest('.floating-ai-assistant')) {
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
  z-index: 1000;
  pointer-events: none;
}

.floating-ai-assistant > * {
  pointer-events: auto;
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

.pulse-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid #667eea;
  animation: pulse-ring 2s infinite;
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
  border: 1px solid #e9ecef;
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
}

.message {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  max-width: 85%;
}

.message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-bubble {
  max-width: 100%;
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
  gap: 8px;
  padding: 12px 16px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 18px;
  border-bottom-left-radius: 4px;
  width: fit-content;
  color: #6c757d;
  font-size: 14px;
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

.typing-text {
  font-size: 12px;
  color: #6c757d;
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

@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
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
  .ai-panel {
    width: 320px;
    height: 500px;
    right: -20px;
  }
  
  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .ai-float-button {
    bottom: 20px;
    right: 20px;
  }
  
  .input-container {
    flex-direction: column;
  }
  
  .send-btn {
    width: 100%;
  }
}
<template>
  <div class="floating-ai-assistant">
    <!-- 悬浮AI图标 -->
    <div 
      class="ai-float-button"
      :class="{ 'active': isExpanded }"
      @click="toggleAI"
      title="点击打开AI助手"
    >
      <div class="ai-icon">
        <span v-if="!isLoading">🤖</span>
        <span v-else class="loading">💭</span>
      </div>
      <div class="pulse-ring" v-if="isExpanded"></div>
      <div class="notification-dot" v-if="hasNotification"></div>
    </div>

    <!-- AI助手面板 -->
    <div v-if="isExpanded" class="ai-panel" :class="{ 'minimized': isMinimized }">
      <!-- 面板头部 -->
      <div class="panel-header">
        <div class="ai-info">
          <div class="ai-avatar">🤖</div>
          <div class="ai-details">
            <h3>AI助手</h3>
            <p :class="statusClass">{{ statusText }}</p>
          </div>
        </div>
        <div class="panel-controls">
          <button @click="toggleMinimize" class="control-btn" title="最小化">
            <span>{{ isMinimized ? '□' : '−' }}</span>
          </button>
          <button @click="closeAI" class="control-btn close" title="关闭">
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
            :title="action.name"
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
            <span class="typing-text">AI正在思考...</span>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-area">
          <div class="input-toolbar">
            <button @click="toggleVoiceInput" class="toolbar-btn" :class="{ active: isVoiceInput }" title="语音输入">
              🎤
            </button>
            <button @click="showImagePicker" class="toolbar-btn" title="图片识别">
              📷
            </button>
            <button @click="showQuickActions" class="toolbar-btn" title="快捷功能">
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
              :title="isVoiceInput ? '开始录音' : '发送消息'"
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
import { ElMessage } from 'element-plus'
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
    content: '你好！我是AI智能助手，有什么可以帮助你的吗？',
    timestamp: new Date()
  }
])

// 快速操作定义
const quickActions = [
  { id: 'describe', name: '生成描述', icon: '✍️', action: 'generateDescription' },
  { id: 'price', name: '价格分析', icon: '💰', action: 'analyzePrice' },
  { id: 'search', name: '智能搜索', icon: '🔍', action: 'smartSearch' },
  { id: 'safety', name: '安全检测', icon: '🛡️', action: 'safetyCheck' },
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
      case 'generateDescription':
        await handleGenerateDescription()
        break
      case 'analyzePrice':
        await handleAnalyzePrice()
        break
      case 'smartSearch':
        await handleSmartSearch()
        break
      case 'safetyCheck':
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
  try {
    console.log('🚀 调用n8n网站助手工作流:', message)
    
    // 使用修复后的工作流URL
    const n8nWebhookUrl = 'https://cchencchen0512.app.n8n.cloud/webhook/02baeca7-10b5-4800-a9e4-7a85c857c10e/website-assistant'
    console.log('📡 工作流URL:', n8nWebhookUrl)
    
    // 构建请求数据 - 严格按照n8n工作流期望的格式
    const requestBody = {
      message: message,
      userId: 'website-user-' + Date.now(),
      sessionId: 'session-' + Date.now()
    }
    console.log('📤 请求数据:', requestBody)
    
    // 设置请求头
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
    console.log('📤 请求头:', headers)
    
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    })

    console.log('📥 响应状态:', response.status, response.statusText)
    console.log('📥 响应头:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ 响应错误内容:', errorText)
      throw new Error(`n8n工作流调用失败: ${response.status} ${response.statusText}\n${errorText}`)
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
    
    if (data.success && data.reply) {
      // ✅ 收到真实的AI回复！
      console.log('✅ 收到AI回复:', data.reply)
      addMessage(data.reply, 'ai')
    } else {
      // ❌ 没有收到有效回复
      console.error('❌ 未收到有效AI回复:', data)
      throw new Error(`AI回复格式错误: ${JSON.stringify(data)}`)
    }
    
  } catch (error: any) {
    console.error('❌ AI回复失败:', error)
    console.error('❌ 错误详情:', error.message)
    console.error('❌ 错误堆栈:', error.stack)
    ElMessage.error('AI回复失败：' + error.message)
    
    // 显示具体的错误信息给用户
    const errorMessage = `🚨 AI助手暂时无法连接\n\n错误详情：${error.message}\n\n正在使用备用回复...`
    addMessage(errorMessage, 'ai')
    
    // 使用备用回复
    const backupResponse = getBackupResponse(message)
    setTimeout(() => {
      addMessage(backupResponse, 'ai')
    }, 1000)
  } finally {
    isLoading.value = false
    isTyping.value = false
  }
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

const recognizeIntent = async (message: string) => {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('价格') || lowerMessage.includes('多少钱') || lowerMessage.includes('贵不贵')) {
    return { type: 'price_question', data: { message } }
  }
  
  if (lowerMessage.includes('描述') || lowerMessage.includes('怎么写') || lowerMessage.includes('介绍')) {
    return { type: 'description_request', data: { message } }
  }
  
  if (lowerMessage.includes('安全') || lowerMessage.includes('骗子') || lowerMessage.includes('风险')) {
    return { type: 'safety_concern', data: { message } }
  }
  
  if (lowerMessage.includes('搜索') || lowerMessage.includes('找') || lowerMessage.includes('有没有')) {
    return { type: 'search_request', data: { message } }
  }
  
  return { type: 'general', data: { message } }
}

const handlePriceQuestion = async (data: any) => {
  return '我可以帮您分析商品价格。请告诉我您想了解的商品类型、成色和大致的原价，我会基于市场数据给出合理的价格建议。'
}

const handleDescriptionRequest = async (data: any) => {
  return '我可以帮您生成专业的商品描述。请提供商品的基本信息，如品牌、型号、成色、使用时长等，我会为您写一段吸引人的描述。'
}

const handleSafetyConcern = async (data: any) => {
  return '交易安全很重要！我建议您：1) 选择校内公共场所交易 2) 当面验货后再付款 3) 避免提前转账 4) 保留聊天记录。需要我帮您分析具体的交易风险吗？'
}

const handleSearchRequest = async (data: any) => {
  return '我可以帮您智能搜索商品。请告诉我您想找什么类型的商品、预算范围、品牌偏好等，我会为您推荐最合适的商品。'
}

const handleGenerateDescription = async () => {
  addMessage('我可以帮您生成商品描述。请告诉我您的商品信息，比如：\n• 商品类型（手机、电脑、书籍等）\n• 品牌和型号\n• 成色和使用时长\n• 为什么要转让', 'ai')
}

const handleAnalyzePrice = async () => {
  addMessage('我可以帮您分析商品价格。请提供商品信息，我会基于市场数据给出合理的价格建议，包括：\n• 建议售价\n• 市场价格区间\n• 影响价格的因素', 'ai')
}

const handleSmartSearch = async () => {
  addMessage('智能搜索功能可以帮助您：\n• 按关键词搜索商品\n• 按价格区间筛选\n• 按成色和品牌筛选\n• 推荐相似商品\n\n请告诉我您想找什么商品？', 'ai')
}

const handleSafetyCheck = async () => {
  addMessage('安全检测功能可以：\n• 分析交易风险\n• 识别可疑用户\n• 提供安全建议\n• 检查商品信息真实性\n\n请提供需要检测的信息。', 'ai')
}

const handleGetRecommendations = async () => {
  addMessage('基于您的浏览历史和偏好，我为您推荐：\n• 热门电子产品\n• 优质图书教材\n• 实用生活用品\n• 性价比高的运动器材\n\n您对哪类商品感兴趣？', 'ai')
}

const handleShowHelp = async () => {
  addMessage('我可以帮您：\n\n📝 **商品相关**\n• 生成商品描述\n• 分析合理价格\n• 推荐商品分类\n\n🔍 **搜索相关**\n• 智能商品搜索\n• 价格趋势分析\n• 个性化推荐\n\n🛡️ **安全相关**\n• 交易安全建议\n• 风险识别提醒\n• 纠纷处理指导\n\n💬 **直接提问**
您也可以直接问我任何问题！', 'ai')
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const scrollToBottom = () => {
  nextTick(() => {
    const container = document.querySelector('.messages-container')
    if (container) {
      container.scrollTop = container.scrollHeight
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
  const input = document.querySelector('.message-input') as HTMLTextAreaElement
  if (input) {
    input.style.height = 'auto'
    input.style.height = input.scrollHeight + 'px'
  }
}

// 语音识别相关（模拟）
const startVoiceRecognition = () => {
  userInput.value = '正在听取语音输入...'
  setTimeout(() => {
    userInput.value = '这是语音输入的测试内容'
  }, 2000)
}

const stopVoiceRecognition = () => {
  // 模拟停止语音识别
  if (userInput.value === '正在听取语音输入...') {
    userInput.value = ''
  }
}

// 生命周期
onMounted(() => {
  // 模拟初始通知
  setTimeout(() => {
    if (!isExpanded.value) {
      hasNotification.value = true
    }
  }, 3000)
  
  // 监听ESC键关闭
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isExpanded.value) {
      closeAI()
    }
  })
  
  // 监听点击外部关闭
  document.addEventListener('click', (e) => {
    if (isExpanded.value && !e.target.closest('.floating-ai-assistant')) {
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
  z-index: 1000;
  pointer-events: none;
}

.floating-ai-assistant > * {
  pointer-events: auto;
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

.pulse-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid #667eea;
  animation: pulse-ring 2s infinite;
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
  border: 1px solid #e9ecef;
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
}

.message {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  max-width: 85%;
}

.message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-bubble {
  max-width: 100%;
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
  gap: 8px;
  padding: 12px 16px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 18px;
  border-bottom-left-radius: 4px;
  width: fit-content;
  color: #6c757d;
  font-size: 14px;
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

.typing-text {
  font-size: 12px;
  color: #6c757d;
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

@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
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
  .ai-panel {
    width: 320px;
    height: 500px;
    right: -20px;
  }
  
  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .ai-float-button {
    bottom: 20px;
    right: 20px;
  }
  
  .input-container {
    flex-direction: column;
  }
  
  .send-btn {
    width: 100%;
  }
}
</style>