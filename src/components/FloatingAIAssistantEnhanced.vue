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
              <div 
                class="message-content"
                v-if="message.isFormatted"
                v-html="message.content"
              ></div>
              <div 
                class="message-content"
                v-else
              >{{ message.content }}</div>
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
interface Message {
  id: number
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  isFormatted?: boolean
}

const messages = ref<Message[]>([
  {
    id: 1,
    type: 'ai',
    content: '你好！我是AI智能助手，有什么可以帮助你的吗？',
    timestamp: new Date(),
    isFormatted: true
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

const formatAIMessage = (content: string): string => {
  // 自动格式化AI回复内容
  let formatted = content
  
  // 1. 处理标题和强调
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>')
  
  // 2. 处理代码块
  formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>')
  
  // 3. 处理列表
  formatted = formatted.replace(/^\s*[-•]\s+(.+)$/gm, '<li>$1</li>')
  formatted = formatted.replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>')
  
  // 4. 处理引用块
  formatted = formatted.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>')
  
  // 5. 处理段落和换行
  formatted = formatted.replace(/\n\n+/g, '</div><div class=\"section\">')
  formatted = formatted.replace(/\n/g, '<br>')
  
  // 6. 添加特殊样式类
  if (formatted.includes('🚨') || formatted.includes('错误') || formatted.includes('失败')) {
    formatted = `<div class=\"warning-box\">${formatted}</div>`
  } else if (formatted.includes('✅') || formatted.includes('成功') || formatted.includes('完成')) {
    formatted = `<div class=\"success-box\">${formatted}</div>`
  } else if (formatted.includes('💡') || formatted.includes('提示') || formatted.includes('建议')) {
    formatted = `<div class=\"info-box\">${formatted}</div>`
  }
  
  // 7. 包装最终内容
  if (!formatted.includes('<div class=\"section\">')) {
    formatted = `<div class=\"section\">${formatted}</div>`
  }
  
  return formatted
}

const addMessage = (content: string, type: 'user' | 'ai') => {
  const newMessage = {
    id: Date.now(),
    type,
    content: type === 'ai' ? formatAIMessage(content) : content,
    timestamp: new Date(),
    isFormatted: type === 'ai'
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
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.ai-float-button:hover {
  transform: scale(1.15);
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.6);
  border-color: rgba(255, 255, 255, 0.3);
}

.ai-float-button.active {
  transform: scale(0.85);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
}

.ai-float-button.pulsing {
  animation: gentle-pulse 2s infinite;
}

.ai-icon {
  font-size: 28px;
  animation: gentle-bounce 3s infinite;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
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
  animation: gentle-pulse 1.5s infinite;
}

.notification-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 14px;
  height: 14px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff4757 100%);
  border-radius: 50%;
  animation: gentle-pulse 2s infinite;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(255, 71, 87, 0.4);
}

.ai-panel {
  position: absolute;
  bottom: 80px;
  right: 0;
  width: 400px;
  height: 650px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.ai-panel.minimized {
  height: 60px;
}

.panel-header {
  padding: 20px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  backdrop-filter: blur(10px);
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
  background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%);
}

.quick-actions {
  padding: 16px 20px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}

.quick-action-btn {
  padding: 12px 8px;
  border: 1px solid rgba(102, 126, 234, 0.2);
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 12px;
  backdrop-filter: blur(10px);
}

.quick-action-btn:hover {
  background: rgba(102, 126, 234, 0.1);
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
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
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
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
  max-width: 85%;
  padding: 16px 20px;
  border-radius: 20px;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.message.user .message-bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom-right-radius: 6px;
}

.message.ai .message-bubble {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  color: #2c3e50;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-bottom-left-radius: 6px;
}

.message-bubble:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.message-content {
  font-size: 14px;
  line-height: 1.6;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.message.ai .message-content {
  font-family: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', 'Liberation Mono', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.7;
}

.message.ai .message-content strong {
  font-weight: 600;
  color: #2c3e50;
}

.message.ai .message-content em {
  font-style: italic;
  color: #7f8c8d;
}

.message.ai .message-content ul,
.message.ai .message-content ol {
  margin: 8px 0;
  padding-left: 20px;
}

.message.ai .message-content li {
  margin: 4px 0;
  line-height: 1.5;
}

.message.ai .message-content code {
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: #e74c3c;
  border: 1px solid #e9ecef;
}

.message.ai .message-content blockquote {
  border-left: 4px solid #667eea;
  padding-left: 12px;
  margin: 8px 0;
  color: #7f8c8d;
  font-style: italic;
}

.message.ai .message-content .highlight {
  background: linear-gradient(120deg, #667eea20 0%, #764ba220 100%);
  padding: 8px 12px;
  border-radius: 8px;
  margin: 8px 0;
  border-left: 3px solid #667eea;
}

.message.ai .message-content .section {
  margin: 12px 0;
  padding: 8px 0;
  border-bottom: 1px solid #f1f3f4;
}

.message.ai .message-content .section:last-child {
  border-bottom: none;
}

/* 增强的AI回复格式化 */
.message.ai .message-content {
  font-family: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', 'Liberation Mono', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.7;
  letter-spacing: 0.01em;
}

.message.ai .message-content strong {
  font-weight: 600;
  color: #2c3e50;
  background: linear-gradient(120deg, #667eea10 0%, #764ba210 100%);
  padding: 2px 4px;
  border-radius: 3px;
}

.message.ai .message-content em {
  font-style: italic;
  color: #7f8c8d;
  background: #f8f9fa;
  padding: 1px 3px;
  border-radius: 2px;
}

.message.ai .message-content ul,
.message.ai .message-content ol {
  margin: 8px 0;
  padding-left: 20px;
}

.message.ai .message-content li {
  margin: 4px 0;
  line-height: 1.5;
  position: relative;
}

.message.ai .message-content li:before {
  content: '•';
  color: #667eea;
  font-weight: bold;
  position: absolute;
  left: -15px;
}

.message.ai .message-content ol li:before {
  content: counter(item) '.';
  counter-increment: item;
}

.message.ai .message-content code {
  background: #f1f3f4;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: #e74c3c;
  border: 1px solid #e9ecef;
  font-family: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', 'Liberation Mono', 'Courier New', monospace;
}

.message.ai .message-content pre {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid #667eea;
  margin: 8px 0;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.4;
}

.message.ai .message-content pre code {
  background: none;
  border: none;
  padding: 0;
  color: #495057;
}

.message.ai .message-content blockquote {
  border-left: 4px solid #667eea;
  padding-left: 12px;
  margin: 8px 0;
  color: #7f8c8d;
  font-style: italic;
  background: linear-gradient(120deg, #667eea05 0%, #764ba205 100%);
  padding: 8px 12px;
  border-radius: 0 8px 8px 0;
}

.message.ai .message-content .highlight {
  background: linear-gradient(120deg, #667eea20 0%, #764ba220 100%);
  padding: 8px 12px;
  border-radius: 8px;
  margin: 8px 0;
  border-left: 3px solid #667eea;
}

.message.ai .message-content .section {
  margin: 12px 0;
  padding: 8px 0;
  border-bottom: 1px solid #f1f3f4;
}

.message.ai .message-content .section:last-child {
  border-bottom: none;
}

.message.ai .message-content .info-box {
  background: #e3f2fd;
  border: 1px solid #bbdefb;
  border-left: 4px solid #2196f3;
  padding: 12px;
  border-radius: 8px;
  margin: 8px 0;
}

.message.ai .message-content .warning-box {
  background: #fff3e0;
  border: 1px solid #ffcc80;
  border-left: 4px solid #ff9800;
  padding: 12px;
  border-radius: 8px;
  margin: 8px 0;
}

.message.ai .message-content .success-box {
  background: #e8f5e8;
  border: 1px solid #c8e6c9;
  border-left: 4px solid #4caf50;
  padding: 12px;
  border-radius: 8px;
  margin: 8px 0;
}

.message.ai .message-content .table {
  width: 100%;
  border-collapse: collapse;
  margin: 8px 0;
  font-size: 12px;
}

.message.ai .message-content .table th,
.message.ai .message-content .table td {
  border: 1px solid #e9ecef;
  padding: 8px 12px;
  text-align: left;
}

.message.ai .message-content .table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #495057;
}

.message.ai .message-content .table tr:nth-child(even) {
  background: #fafbfc;
}

/* 响应式优化 */
@media (max-width: 768px) {
  .message.ai .message-content {
    font-size: 12px;
    line-height: 1.6;
  }
  
  .message.ai .message-content pre {
    font-size: 11px;
    padding: 8px;
  }
  
  .message.ai .message-content .table {
    font-size: 11px;
  }
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
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.3);
}

.input-toolbar {
  padding: 12px 16px;
  display: flex;
  gap: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.toolbar-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

.toolbar-btn:hover {
  background: rgba(102, 126, 234, 0.1);
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.toolbar-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.input-container {
  padding: 16px 20px;
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  padding: 16px 20px;
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 24px;
  resize: none;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  max-height: 120px;
  outline: none;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
}

.message-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  background: white;
}

.send-btn {
  width: 48px;
  height: 48px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.15);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.5);
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: scale(0.95);
}

@keyframes gentle-bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0) scale(1);
  }
  40% {
    transform: translateY(-8px) scale(1.05);
  }
  60% {
    transform: translateY(-4px) scale(1.02);
  }
}

@keyframes gentle-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.08);
    opacity: 0.8;
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
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes typingDot {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-8px);
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