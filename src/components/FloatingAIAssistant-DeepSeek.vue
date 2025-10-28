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
            <h3>DeepSeek助手</h3>
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
          <div class="input-container">
            <textarea
              v-model="userInput"
              placeholder="输入技术问题..."
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
              <span>➤</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'

// 状态管理
const isExpanded = ref(false)
const isMinimized = ref(false)
const isLoading = ref(false)
const isTyping = ref(false)
const hasNotification = ref(false)
const userInput = ref('')
const messages = ref([
  {
    id: 1,
    type: 'ai',
    content: '你好！我是DeepSeek驱动的专业网站技术助手，有什么技术问题可以帮助你解决？',
    timestamp: new Date()
  }
])

// 计算属性
const statusText = computed(() => {
  if (isLoading.value) return 'DeepSeek思考中...'
  return 'DeepSeek在线'
})

const statusClass = computed(() => ({
  'status-online': !isLoading.value,
  'status-thinking': isLoading.value
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

const sendMessage = async () => {
  if (!canSend.value) return
  
  const message = userInput.value.trim()
  addMessage(message, 'user')
  userInput.value = ''
  
  isLoading.value = true
  isTyping.value = true
  
  try {
    console.log('🚀 直接调用DeepSeek API:', message)
    
    // 直接调用DeepSeek API，绕过工作流
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-98e0a077fdbe422585855c3b10f03986'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是DeepSeek驱动的专业网站技术助手，具备丰富的开发和运维经验。

请根据用户的问题提供：
1. 具体的解决方案和详细步骤
2. 可执行的代码示例
3. 性能优化建议
4. 安全注意事项
5. 替代方案对比

回答要专业、深入、实用，充分发挥DeepSeek的分析能力。`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.8,
        max_tokens: 2000,
        top_p: 0.95
      })
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API错误: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('📥 DeepSeek回复:', data)
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      // ✅ 收到真实的DeepSeek回复！
      console.log('✅ 收到DeepSeek AI回复:', data.choices[0].message.content.substring(0, 100) + '...')
      addMessage(data.choices[0].message.content, 'ai')
    } else if (data.error) {
      throw new Error(data.error.message || 'DeepSeek API返回错误')
    } else {
      throw new Error('DeepSeek API返回格式错误')
    }
    
  } catch (error) {
    console.error('❌ DeepSeek API调用失败:', error)
    addMessage(`抱歉，AI服务暂时不可用：${error.message}`, 'ai')
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

onMounted(() => {
  // 模拟通知
  setTimeout(() => {
    if (!isExpanded.value) {
      hasNotification.value = true
    }
  }, 5000)
})
</script>

<style scoped>
.floating-ai-assistant {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 9999;
  pointer-events: none;
}

.floating-ai-assistant * {
  pointer-events: auto;
}

.ai-float-button {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  box-shadow: 0 4px 20px rgba(30, 60, 114, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;
}

.ai-float-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 30px rgba(30, 60, 114, 0.6);
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
  height: 500px;
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
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
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

.messages-container {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 350px;
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
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
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
  background: #1e3c72;
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
  border-color: #1e3c72;
}

.send-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
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
  box-shadow: 0 4px 12px rgba(30, 60, 114, 0.4);
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
    height: 450px;
    right: -20px;
  }
}
</style>