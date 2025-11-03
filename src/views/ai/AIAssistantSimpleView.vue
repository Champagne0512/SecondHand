<template>
  <div class="ai-assistant-simple-view">
    <!-- 全局导航 -->
    <GlobalNavigation />
    
    <!-- 错误边界 -->
    <ErrorBoundary>
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-content">
          <h1>🤖 AI智能助手</h1>
        <p>智能化的校园二手交易体验，让AI为您保驾护航</p>
        <div class="ai-status">
          <el-icon><CircleCheck /></el-icon>
          <span>AI助手已激活</span>
        </div>
        </div>
      </div>

      <!-- AI状态指示 -->
      <div class="ai-status-bar">
        <el-alert
        title="🤖 内置AI智能助手"
        type="success"
        description="AI助手已准备就绪，为您提供智能化的二手交易服务"
        show-icon
        :closable="false"
      />
      </div>

    <!-- 功能区域 -->
    <div class="main-content">
      <!-- AI对话区域 -->
      <div class="chat-section">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>💬 AI智能对话</span>
              <el-tag type="success">在线</el-tag>
            </div>
          </template>
          
          <div class="chat-container">
            <div class="chat-messages" ref="messagesContainer">
              <div 
                v-for="message in messages" 
                :key="message.id"
                class="message"
                :class="message.type"
              >
                <div class="message-avatar">
                  <span>{{ message.type === 'user' ? '👤' : '🤖' }}</span>
                </div>
                <div class="message-content">
                  <div class="message-bubble">{{ message.content }}</div>
                  <div class="message-time">{{ formatTime(message.timestamp) }}</div>
                </div>
              </div>
              
              <div v-if="isLoading" class="loading-indicator">
                <el-icon class="loading"><Loading /></el-icon>
                <span>AI正在思考...</span>
              </div>
            </div>
            
            <div class="chat-input-area">
              <div class="input-container">
                <el-input
                  v-model="userInput"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入您的问题，AI将为您提供帮助..."
                  @keydown.enter.prevent="handleEnter"
                  class="message-input"
                />
                <el-button 
                  type="primary" 
                  @click="sendMessage"
                  :loading="isLoading"
                  :disabled="!userInput.trim()"
                  class="send-button"
                >
                  <el-icon><Position /></el-icon>
                  发送
                </el-button>
              </div>
              
              <div class="quick-actions">
                <el-button
                  v-for="prompt in quickPrompts"
                  :key="prompt"
                  size="small"
                  @click="useQuickPrompt(prompt)"
                  class="quick-prompt-btn"
                >
                  {{ prompt }}
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 快速功能区域 -->
      <div class="features-section">
        <el-row :gutter="20">
          <!-- 商品描述生成 -->
          <el-col :xs="24" :sm="12" :md="12" :lg="12">
            <el-card class="feature-card">
              <template #header>
                <div class="card-header">
                  <span>✍️ 商品描述生成</span>
                  <el-icon><Edit /></el-icon>
                </div>
              </template>
              
              <el-form :model="descriptionForm" label-width="100px" class="feature-form">
                <el-form-item label="商品名称">
                  <el-input v-model="descriptionForm.name" placeholder="如：iPhone 12" />
                </el-form-item>
                
                <el-form-item label="商品分类">
                  <el-select v-model="descriptionForm.category" placeholder="选择分类">
                    <el-option label="电子产品" value="electronics" />
                    <el-option label="图书教材" value="books" />
                    <el-option label="生活用品" value="daily" />
                    <el-option label="运动器材" value="sports" />
                    <el-option label="服装鞋帽" value="clothing" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="成色">
                  <el-select v-model="descriptionForm.condition" placeholder="选择成色">
                    <el-option label="全新" value="全新" />
                    <el-option label="九成新" value="九成新" />
                    <el-option label="八成新" value="八成新" />
                    <el-option label="七成新" value="七成新" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="原价">
                  <el-input-number v-model="descriptionForm.originalPrice" :min="0" :step="100" />
                </el-form-item>
              </el-form>
              
              <div class="feature-actions">
                <el-button 
                  type="primary" 
                  @click="generateDescription"
                  :loading="isGeneratingDesc"
                  :disabled="!descriptionForm.name || !descriptionForm.category"
                >
                  生成描述
                </el-button>
              </div>
              
              <div v-if="generatedDescription" class="result-area">
                <el-divider>生成的描述</el-divider>
                <el-input
                  v-model="generatedDescription"
                  type="textarea"
                  :rows="6"
                  readonly
                  class="result-textarea"
                />
                <div class="result-actions">
                  <el-button size="small" @click="copyText(generatedDescription)">
                    <el-icon><CopyDocument /></el-icon>
                    复制
                  </el-button>
                </div>
              </div>
            </el-card>
          </el-col>

          <!-- 价格分析 -->
          <el-col :xs="24" :sm="12" :md="12" :lg="12">
            <el-card class="feature-card">
              <template #header>
                <div class="card-header">
                  <span>💰 价格分析</span>
                  <el-icon><DataAnalysis /></el-icon>
                </div>
              </template>
              
              <el-form :model="priceForm" label-width="100px" class="feature-form">
                <el-form-item label="商品分类">
                  <el-select v-model="priceForm.category" placeholder="选择分类">
                    <el-option label="电子产品" value="electronics" />
                    <el-option label="图书教材" value="books" />
                    <el-option label="生活用品" value="daily" />
                    <el-option label="运动器材" value="sports" />
                    <el-option label="服装鞋帽" value="clothing" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="成色">
                  <el-select v-model="priceForm.condition" placeholder="选择成色">
                    <el-option label="全新" value="全新" />
                    <el-option label="九成新" value="九成新" />
                    <el-option label="八成新" value="八成新" />
                    <el-option label="七成新" value="七成新" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="原价">
                  <el-input-number v-model="priceForm.originalPrice" :min="0" :step="100" />
                </el-form-item>
                
                <el-form-item label="使用时间">
                  <el-input-number v-model="priceForm.usageMonths" :min="0" :max="60" />
                  <span style="margin-left: 8px;">个月</span>
                </el-form-item>
              </el-form>
              
              <div class="feature-actions">
                <el-button 
                  type="warning" 
                  @click="analyzePrice"
                  :loading="isAnalyzingPrice"
                  :disabled="!priceForm.category || !priceForm.originalPrice"
                >
                  分析价格
                </el-button>
              </div>
              
              <div v-if="priceAnalysis" class="result-area">
                <el-divider>价格分析结果</el-divider>
                <el-input
                  v-model="priceAnalysis"
                  type="textarea"
                  :rows="6"
                  readonly
                  class="result-textarea"
                />
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 悬浮AI助手 -->
      <FloatingAIAssistant />
    </ErrorBoundary>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  CircleCheck, 
  Position, 
  CopyDocument, 
  Edit, 
  DataAnalysis,
  Loading,
  Warning
} from '@element-plus/icons-vue'
import GlobalNavigation from '@/components/GlobalNavigation.vue'
import FloatingAIAssistant from '@/components/FloatingAIAssistant.vue'
import ErrorBoundary from '@/components/ErrorBoundary.vue'
import FloatingAIAssistantEnhanced from '@/components/FloatingAIAssistantEnhanced.vue'
import { useAIAssistantEnhancedStore } from '@/stores/ai-assistant-enhanced'

const aiStore = useAIAssistantEnhancedStore()

// 聊天相关
const userInput = ref('')
const messages = ref([
  {
    id: '1',
    type: 'ai',
    content: '您好！我是AI智能助手，可以帮助您解决校园二手交易平台的各种问题。请问有什么可以帮助您的吗？',
    timestamp: new Date()
  }
])
const isLoading = ref(false)

// 快速提示
const quickPrompts = [
  '如何发布商品？',
  '价格怎么定？',
  '交易安全吗？',
  '帮我写个商品描述',
  '检查这个价格是否合理',
  '有什么热门商品推荐？'
]

// 商品描述表单
const descriptionForm = ref({
  name: '',
  category: '',
  condition: '',
  originalPrice: 0
})

// 价格分析表单
const priceForm = ref({
  category: '',
  condition: '',
  originalPrice: 0,
  usageMonths: 0
})

// 结果
const generatedDescription = ref('')
const priceAnalysis = ref('')
const isGeneratingDesc = ref(false)
const isAnalyzingPrice = ref(false)

// 生命周期
  onMounted(() => {
    // 内置AI模式，自动初始化
    aiStore.configureAI()
    ElMessage.success('🤖 AI助手已准备就绪！')
  })

// 方法
const sendMessage = async () => {
  if (!userInput.value.trim()) return
  
  const message = userInput.value.trim()
  messages.value.push({
    id: Date.now().toString(),
    type: 'user',
    content: message,
    timestamp: new Date()
  })
  
  userInput.value = ''
  isLoading.value = true
  
  try {
    const response = await aiStore.sendMessage(message)
    
    messages.value.push({
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: response.content,
      timestamp: new Date()
    })
  } catch (error: any) {
    console.error('AI回复失败:', error)
    ElMessage.error('AI回复失败：' + error.message)
    messages.value.push({
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: '抱歉，我遇到了一些问题，请稍后重试。',
      timestamp: new Date()
    })
  } finally {
    isLoading.value = false
  }
}

const handleEnter = (event: KeyboardEvent) => {
  if (!event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

const useQuickPrompt = (prompt: string) => {
  userInput.value = prompt
  sendMessage()
}

const generateDescription = async () => {
  if (!descriptionForm.value.name || !descriptionForm.value.category) {
    ElMessage.warning('请填写商品名称和分类')
    return
  }
  
  isGeneratingDesc.value = true
  try {
    const prompt = `请为以下商品生成一个专业、吸引人的商品描述：

商品信息：
- 名称：${descriptionForm.value.name}
- 分类：${descriptionForm.value.category}
- 成色：${descriptionForm.value.condition}
- 原价：${descriptionForm.value.originalPrice}元

要求：
1. 描述要真实、详细，突出商品优点
2. 包含价格优势和转让诚意
3. 提及交易方式和售后保障
4. 语言要亲切、有说服力
5. 适当使用emoji增加亲和力

请生成一段适合校园二手交易平台的商品描述。`
    
    const response = await aiStore.sendMessage(prompt)
    generatedDescription.value = response.content
    
    ElMessage.success('商品描述生成成功！')
  } catch (error: any) {
    ElMessage.error('生成失败：' + error.message)
  } finally {
    isGeneratingDesc.value = false
  }
}

const analyzePrice = async () => {
  if (!priceForm.value.category || !priceForm.value.originalPrice) {
    ElMessage.warning('请选择商品分类并填写原价')
    return
  }
  
  isAnalyzingPrice.value = true
  try {
    const prompt = `请分析以下商品的价格合理性：

商品信息：
- 分类：${priceForm.value.category}
- 成色：${priceForm.value.condition}
- 使用时间：${priceForm.value.usageMonths}个月
- 原价：${priceForm.value.originalPrice}元

请提供：
1. 建议售价范围
2. 价格影响因素分析
3. 市场竞争力评估
4. 成交建议

请用数据和市场逻辑支撑您的分析。`
    
    const response = await aiStore.sendMessage(prompt)
    priceAnalysis.value = response.content
    
    ElMessage.success('价格分析完成！')
  } catch (error: any) {
    ElMessage.error('分析失败：' + error.message)
  } finally {
    isAnalyzingPrice.value = false
  }
}

const copyText = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.ai-assistant-simple-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  animation: fadeInUp 0.8s ease-out;
}

.page-header {
  text-align: center;
  padding: 80px 20px 60px;
  color: white;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.page-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  pointer-events: none;
}

.header-content {
  position: relative;
  z-index: 2;
}

.header-content h1 {
  font-size: 3.5rem;
  margin-bottom: 16px;
  font-weight: 800;
  background: linear-gradient(135deg, #fff 0%, #f0f4ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.header-content p {
  font-size: 1.3rem;
  opacity: 0.95;
  margin-bottom: 32px;
  font-weight: 300;
  letter-spacing: 0.5px;
}

.ai-status {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  background: linear-gradient(135deg, rgba(46, 213, 115, 0.2) 0%, rgba(46, 213, 115, 0.1) 100%);
  color: #2ed573;
  border-radius: 25px;
  font-size: 15px;
  font-weight: 600;
  border: 1px solid rgba(46, 213, 115, 0.3);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(46, 213, 115, 0.2);
  transition: all 0.3s ease;
}

.ai-status:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(46, 213, 115, 0.3);
}

.ai-status-bar {
  max-width: 1200px;
  margin: 0 auto 30px;
  padding: 0 20px;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 40px;
}

.chat-section {
  margin-bottom: 30px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f8f9fa 0%, #f0f4ff 100%);
  border-bottom: 1px solid rgba(102, 126, 234, 0.1);
}

.card-header span {
  font-size: 18px;
  font-weight: 700;
  color: #2d3748;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 500px;
  background: linear-gradient(135deg, #f8f9fa 0%, #f0f4ff 100%);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.05);
}

.chat-messages {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  scroll-behavior: smooth;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.3);
  border-radius: 3px;
}

.message {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  max-width: 85%;
  animation: messageSlideIn 0.3s ease-out;
}

.message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.message-avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.message.user .message-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.message-content {
  flex: 1;
}

.message-bubble {
  padding: 16px 20px;
  border-radius: 20px;
  font-size: 15px;
  line-height: 1.6;
  word-wrap: break-word;
  position: relative;
  transition: all 0.3s ease;
}

.message.ai .message-bubble {
  background: rgba(255, 255, 255, 0.9);
  color: #2d3748;
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-bottom-left-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
}

.message.user .message-bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom-right-radius: 8px;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
}

.message-bubble:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.message-time {
  font-size: 12px;
  color: #718096;
  margin-top: 6px;
  font-weight: 500;
}

.message.user .message-time {
  text-align: right;
  color: rgba(255, 255, 255, 0.8);
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  border-bottom-left-radius: 8px;
  width: fit-content;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.loading {
  animation: spin 1s linear infinite;
}

.chat-input-area {
  padding: 24px;
  background: rgba(255, 255, 255, 0.95);
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(20px);
}

.input-container {
  display: flex;
  gap: 16px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  padding: 16px;
  border: 2px solid rgba(102, 126, 234, 0.1);
  border-radius: 16px;
  resize: none;
  font-family: inherit;
  font-size: 15px;
  line-height: 1.4;
  max-height: 120px;
  outline: none;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.9);
}

.message-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.send-button {
  height: 48px;
  padding: 0 24px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.send-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
}

.quick-prompt-btn {
  margin: 0;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(102, 126, 234, 0.2);
  color: #667eea;
  transition: all 0.3s ease;
}

.quick-prompt-btn:hover {
  background: #667eea;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.features-section {
  margin-top: 30px;
}

.feature-card {
  height: 100%;
  margin-bottom: 20px;
  border-radius: 20px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
}

.feature-form {
  margin-bottom: 20px;
}

.feature-actions {
  text-align: center;
  margin-bottom: 20px;
}

.result-area {
  margin-top: 20px;
}

.result-textarea {
  font-family: inherit;
  line-height: 1.6;
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.result-textarea :deep(.el-textarea__inner) {
  background: rgba(255, 255, 255, 0.8);
  border: none;
  font-size: 14px;
  line-height: 1.6;
}

.result-actions {
  margin-top: 10px;
  text-align: right;
}

/* 动画效果 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 表单元素优化 */
:deep(.el-form-item__label) {
  font-weight: 600;
  color: #2d3748;
  font-size: 14px;
}

:deep(.el-input__inner),
:deep(.el-textarea__inner),
:deep(.el-select .el-input__inner) {
  border-radius: 12px;
  border: 2px solid rgba(102, 126, 234, 0.1);
  padding: 12px 16px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.9);
}

:deep(.el-input__inner:focus),
:deep(.el-textarea__inner:focus),
:deep(.el-select .el-input__inner:focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

:deep(.el-button) {
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

:deep(.el-button--primary:hover:not(:disabled)) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content h1 {
    font-size: 2.5rem;
  }
  
  .header-content p {
    font-size: 1.1rem;
  }
  
  .input-container {
    flex-direction: column;
  }
  
  .send-button {
    width: 100%;
  }
  
  .quick-actions {
    justify-content: center;
    gap: 8px;
  }
  
  .message {
    max-width: 95%;
    gap: 12px;
  }
  
  .message-avatar {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
  
  .message-bubble {
    padding: 12px 16px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .header-content h1 {
    font-size: 2rem;
  }
  
  .page-header {
    padding: 60px 20px 40px;
  }
  
  .main-content {
    padding: 0 16px 30px;
  }
  
  .message {
    max-width: 100%;
  }
  
  .message-bubble {
    font-size: 13px;
    padding: 10px 14px;
  }
}
</style>