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
    
    const n8nWebhookUrl = 'http://localhost:5678/webhook/website-assistant'
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        userId: 'website-user-' + Date.now(),
        sessionId: 'session-' + Date.now()
      })
    })

    if (!response.ok) {
      throw new Error(`n8n工作流调用失败: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('📥 收到n8n响应:', data)
    
    if (data.success && data.data && data.data.response) {
      // ✅ 收到真实的AI回复！
      console.log('✅ 收到GPT-4回复:', data.data.response)
      addMessage(data.data.response, 'ai')
    } else {
      // ❌ 没有收到有效回复
      console.error('❌ 未收到有效AI回复:', data)
      throw new Error('AI回复格式错误')
    }
  } catch (error) {
    console.error('❌ AI回复失败:', error)
    // 使用备用回复
    const backupResponse = getBackupResponse(message)
    addMessage(backupResponse, 'ai')
  } finally {
    isLoading.value = false
    isTyping.value = false
  }
}

// 备用回复生成器
const getBackupResponse = (userMessage: string) => {
  const msg = userMessage.toLowerCase()
  
  if (msg.includes('慢') || msg.includes('优化') || msg.includes('性能')) {
    return `🔧 **网站性能优化建议**

根据您提到的问题，我为您提供以下优化方案：

**1. 前端优化**
• 启用浏览器缓存和压缩
• 优化图片大小和格式
• 减少HTTP请求数量
• 使用CDN加速静态资源

**2. 后端优化** 
• 数据库查询优化
• 启用Redis缓存
• 代码性能调优
• 服务器资源配置

**3. 网络优化**
• 使用HTTPS协议
• 启用Gzip压缩
• 优化DNS解析
• 减少重定向

需要我详细解释某个方面吗？`
  }
  
  if (msg.includes('错误') || msg.includes('bug') || msg.includes('问题')) {
    return `🐛 **网站错误排查指南**

我来帮您分析和解决网站错误：

**常见错误类型：**
• 500错误 - 服务器内部错误
• 404错误 - 页面未找到
• 403错误 - 权限不足
• 502错误 - 网关错误

**排查步骤：**
1. 查看浏览器控制台错误信息
2. 检查服务器日志文件
3. 验证数据库连接状态
4. 确认第三方服务正常

**解决方案：**
请告诉我具体的错误信息，我可以提供更精准的帮助。`
  }
  
  if (msg.includes('安全') || msg.includes('漏洞') || msg.includes('攻击')) {
    return `🛡️ **网站安全防护建议**

网站安全非常重要，我为您提供专业建议：

**基础安全措施：**
• 定期更新系统和组件
• 使用强密码和双因子认证
• 启用HTTPS加密传输
• 定期备份数据

**常见威胁防护：**
• SQL注入 - 使用参数化查询
• XSS攻击 - 输入验证和转义
• CSRF攻击 - 使用Token验证
• DDoS攻击 - 启用流量清洗

**监控建议：**
• 设置异常访问告警
• 定期检查访问日志
• 使用Web应用防火墙
• 进行安全漏洞扫描

需要具体的安全配置指导吗？`
  }
  
  // 默认回复
  return `🤖 **网站助手为您服务**

您好！我是专业的网站AI助手，专门提供网站相关的技术支持。

**我能帮您解决：**
• 🔧 网站性能优化和加速
• 🐛 技术问题诊断和修复  
• 🛡️ 安全漏洞检测和防护
• 📊 数据分析和报告解读
• ⚙️ 功能配置和使用指导

**专业技术支持：**
• 前端优化（HTML/CSS/JS）
• 后端调优（数据库/缓存/API）
• 服务器配置（Nginx/Apache）
• 安全防护（防火墙/加密）

请详细描述您遇到的问题，我会提供具体可操作的解决方案！`
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