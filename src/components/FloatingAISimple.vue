<template>
  <div class="floating-ai-simple">
    <!-- 悬浮按钮 -->
    <div 
      class="ai-float-btn"
      :class="{ active: isOpen }"
      @click="toggleChat"
      title="点击打开AI助手"
    >
      <div class="ai-icon">
        <span v-if="!isThinking">🤖</span>
        <span v-else class="thinking">💭</span>
      </div>
      <div class="notification-dot" v-if="hasNotification"></div>
    </div>

    <!-- 聊天面板 -->
    <div v-if="isOpen" class="chat-panel" @click.stop>
      <!-- 面板头部 -->
      <div class="panel-header">
        <div class="title-section">
          <span class="title">AI助手</span>
          <span class="subtitle">智能对话</span>
        </div>
        <div class="header-actions">
          <el-button 
            text 
            size="small" 
            @click="minimizeChat" 
            :icon="Minus"
            circle
          />
          <el-button 
            text 
            size="small" 
            @click="closeChat" 
            :icon="Close"
            circle
          />
        </div>
      </div>

      <!-- 消息区域 -->
      <div class="messages-area" ref="messagesContainer">
        <div 
          v-for="message in messages" 
          :key="message.id"
          class="message"
          :class="message.type"
        >
          <div class="message-content">
            <div class="message-bubble">{{ message.content }}</div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>
        
        <!-- 输入中指示器 -->
        <div v-if="isThinking" class="thinking-indicator">
          <span class="thinking-dots">
            <span></span>
            <span></span>
            <span></span>
          </span>
          <span class="thinking-text">AI正在思考...</span>
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="quick-actions">
        <el-button
          v-for="action in quickActions"
          :key="action.id"
          size="small"
          @click="quickAction(action)"
          class="quick-btn"
        >
          {{ action.name }}
        </el-button>
      </div>

      <!-- 输入区域 -->
      <div class="input-area">
        <el-input
          v-model="userInput"
          type="textarea"
          :rows="2"
          placeholder="输入消息，按Enter发送..."
          @keydown.enter.prevent="sendMessage"
          class="message-input"
          :disabled="isThinking"
        />
        <div class="input-actions">
          <el-button 
            type="primary" 
            @click="sendMessage"
            :loading="isThinking"
            :disabled="!userInput.trim()"
            size="small"
          >
            发送
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Minus, Close } from '@element-plus/icons-vue'
import { useAIAssistantEnhancedStore } from '@/stores/ai-assistant-enhanced'

const aiStore = useAIAssistantEnhancedStore()

// 状态管理
const isOpen = ref(false)
const isMinimized = ref(false)
const isThinking = ref(false)
const hasNotification = ref(false)
const userInput = ref('')
const messagesContainer = ref<HTMLElement>()

// 消息列表
const messages = ref([
  {
    id: '1',
    type: 'ai',
    content: '你好！我是AI智能助手，有什么可以帮助你的吗？',
    timestamp: new Date()
  }
])

// 快捷操作
const quickActions = [
  { id: 'describe', name: '📝 商品描述' },
  { id: 'price', name: '💰 价格分析' },
  { id: 'safety', name: '🛡️ 安全检测' },
  { id: 'help', name: '❓ 使用帮助' }
]

// 计算属性
const canSend = computed(() => {
  return userInput.value.trim() && !isThinking.value
})

// 方法
const toggleChat = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    hasNotification.value = false
    isMinimized.value = false
    nextTick(() => {
      scrollToBottom()
    })
  }
}

const closeChat = () => {
  isOpen.value = false
  isMinimized.value = false
}

const minimizeChat = () => {
  isMinimized.value = !isMinimized.value
}

const sendMessage = async () => {
  if (!canSend.value) return
  
  const message = userInput.value.trim()
  addMessage(message, 'user')
  userInput.value = ''
  
  isThinking.value = true
  
  try {
    // 使用AI Store发送消息
    const response = await aiStore.sendMessage(message)
    addMessage(response.content, 'ai')
  } catch (error: any) {
    console.error('AI助手回复失败:', error)
    ElMessage.error('AI回复失败，请稍后重试')
    addMessage('抱歉，我遇到了一些问题，请稍后重试。', 'ai')
  } finally {
    isThinking.value = false
  }
}

const quickAction = (action: any) => {
  const prompts = {
    describe: '请帮我生成一个商品描述，我需要出售一部九成新的iPhone 12',
    price: '请帮我分析一下iPhone 12的合理售价，原价6299元，使用了8个月',
    safety: '请告诉我二手交易时需要注意哪些安全事项',
    help: '请介绍一下你能提供哪些帮助功能'
  }
  
  userInput.value = prompts[action.id as keyof typeof prompts] || '请帮我'
  sendMessage()
}

const addMessage = (content: string, type: 'user' | 'ai') => {
  const newMessage = {
    id: Date.now().toString(),
    type,
    content,
    timestamp: new Date()
  }
  messages.value.push(newMessage)
  scrollToBottom()
}

const scrollToBottom = () => {
  nextTick(() => {
    const container = messagesContainer.value
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  })
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 生命周期
onMounted(() => {
  // 初始化AI
  aiStore.configureAI()
  
  // 延迟显示欢迎通知
  setTimeout(() => {
    if (!isOpen.value) {
      hasNotification.value = true
    }
  }, 2000)
  
  // 监听ESC键关闭
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen.value) {
      closeChat()
    }
  })
})
</script>

<style scoped>
.floating-ai-simple {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
}

.ai-float-btn {
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

.ai-float-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 30px rgba(102, 126, 234, 0.6);
}

.ai-float-btn.active {
  transform: scale(0.9);
}

.ai-icon {
  font-size: 24px;
  animation: bounce 2s infinite;
}

.thinking {
  animation: pulse 1s infinite;
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

.chat-panel {
  position: absolute;
  bottom: 80px;
  right: 0;
  width: 350px;
  height: 500px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s ease;
  border: 1px solid #e9ecef;
}

.panel-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.subtitle {
  font-size: 12px;
  opacity: 0.8;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.messages-area {
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

.message-content {
  flex: 1;
}

.message-bubble {
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
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

.message-time {
  font-size: 10px;
  color: #6c757d;
  margin-top: 4px;
}

.message.user .message-time {
  text-align: right;
}

.thinking-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  border-bottom-left-radius: 4px;
  width: fit-content;
  color: #6c757d;
  font-size: 13px;
}

.thinking-dots {
  display: flex;
  gap: 3px;
}

.thinking-dots span {
  width: 6px;
  height: 6px;
  background: #667eea;
  border-radius: 50%;
  animation: typingDot 1.4s infinite;
}

.thinking-text {
  font-size: 11px;
  color: #6c757d;
}

.quick-actions {
  padding: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  background: white;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}

.quick-btn {
  margin: 0;
  font-size: 12px;
  padding: 6px 12px;
}

.input-area {
  padding: 12px;
  background: white;
  border-top: 1px solid #f0f0f0;
}

.message-input {
  margin-bottom: 8px;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
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
    transform: translateY(-8px);
  }
}

@media (max-width: 768px) {
  .chat-panel {
    width: 320px;
    height: 450px;
    right: -20px;
  }
  
  .ai-float-btn {
    bottom: 20px;
    right: 20px;
  }
  
  .quick-actions {
    gap: 6px;
  }
  
  .quick-btn {
    font-size: 11px;
    padding: 4px 8px;
  }
}
</style>