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
                  placeholder="请输入您的问题，DeepSeek AI将为您提供帮助..."
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
    content: '您好！我是基于DeepSeek的AI智能助手，可以帮助您解决校园二手交易平台的各种问题。请问有什么可以帮助您的吗？',
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
    console.error('DeepSeek AI回复失败:', error)
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
    
    ElMessage.success('DeepSeek商品描述生成成功！')
  } catch (error: any) {
    ElMessage.error('DeepSeek生成失败：' + error.message)
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
    
    ElMessage.success('DeepSeek价格分析完成！')
  } catch (error: any) {
    ElMessage.error('DeepSeek分析失败：' + error.message)
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
}

.page-header {
  text-align: center;
  padding: 60px 20px;
  color: white;
  background: rgba(0, 0, 0, 0.1);
}

.header-content h1 {
  font-size: 3rem;
  margin-bottom: 10px;
  font-weight: 700;
}

.header-content p {
  font-size: 1.2rem;
  opacity: 0.9;
  margin-bottom: 20px;
}

.ai-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(46, 213, 115, 0.2);
  color: #2ed573;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid rgba(46, 213, 115, 0.3);
}

.ai-status-bar {
  max-width: 1200px;
  margin: 0 auto 20px;
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
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 500px;
}

.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  max-width: 80%;
}

.message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.message.user .message-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.message-content {
  flex: 1;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
}

.message.ai .message-bubble {
  background: white;
  color: #495057;
  border: 1px solid #e9ecef;
  border-bottom-left-radius: 4px;
}

.message.user .message-bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.message-time {
  font-size: 12px;
  color: #6c757d;
  margin-top: 4px;
}

.message.user .message-time {
  text-align: right;
}

.loading-indicator {
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

.loading {
  animation: spin 1s linear infinite;
}

.chat-input-area {
  padding: 20px;
  background: white;
  border-top: 1px solid #f0f0f0;
}

.input-container {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e9ecef;
  border-radius: 20px;
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

.send-button {
  height: 44px;
  padding: 0 20px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 22px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.send-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.quick-prompt-btn {
  margin: 0;
}

.features-section {
  margin-top: 30px;
}

.feature-card {
  height: 100%;
  margin-bottom: 20px;
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
}

.result-actions {
  margin-top: 10px;
  text-align: right;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .header-content h1 {
    font-size: 2rem;
  }
  
  .input-container {
    flex-direction: column;
  }
  
  .send-button {
    width: 100%;
  }
  
  .quick-actions {
    justify-content: center;
  }
}
</style>