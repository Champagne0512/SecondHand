<template>
  <div class="ai-assistant-view">
    <!-- 全局导航 -->
    <GlobalNavigation />
    
    <!-- 页面头部 -->
    <div class="ai-header">
      <div class="header-content">
        <h1>🤖 AI智能助手</h1>
        <p>让AI帮助你更好地使用校园二手交易平台</p>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <el-loading :loading="true" text="AI助手加载中..." />
    </div>

    <!-- 错误状态 -->
    <div v-else-if="hasError" class="error-container">
      <el-result
        icon="error"
        title="页面加载失败"
        :sub-title="errorMessage"
      >
        <template #extra>
          <el-button type="primary" @click="reloadPage">重新加载</el-button>
          <el-button @click="goHome">返回首页</el-button>
        </template>
      </el-result>
    </div>

    <!-- AI功能模块 -->
    <div v-else class="ai-modules">
      <!-- 商品描述生成器 -->
      <div class="ai-module">
        <div class="module-header">
          <h2>✍️ 商品描述生成器</h2>
          <p>AI帮你写出专业、吸引人的商品描述</p>
        </div>
        
        <div class="module-content">
          <el-form :model="productForm" label-width="120px">
            <el-form-item label="商品分类">
              <el-select v-model="productForm.category" placeholder="选择分类">
                <el-option label="电子产品" value="electronics" />
                <el-option label="图书教材" value="books" />
                <el-option label="生活用品" value="daily" />
                <el-option label="运动器材" value="sports" />
                <el-option label="服装鞋帽" value="clothing" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="品牌型号">
              <el-input v-model="productForm.brand" placeholder="如：Apple iPhone 12" />
            </el-form-item>
            
            <el-form-item label="商品成色">
              <el-select v-model="productForm.condition" placeholder="选择成色">
                <el-option label="全新" value="全新" />
                <el-option label="几乎全新" value="几乎全新" />
                <el-option label="轻微使用" value="轻微使用" />
                <el-option label="明显使用" value="明显使用" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="使用时间">
              <el-input-number 
                v-model="productForm.usageTime" 
                :min="0" 
                :max="60"
                :step="1"
                :step-strictly="true"
              />
              <span style="margin-left: 10px; color: #909399;">个月</span>
            </el-form-item>
            
            <el-form-item label="原价">
              <el-input-number 
                v-model="productForm.originalPrice" 
                :min="0" 
                :step="100"
                :precision="2"
              />
              <span style="margin-left: 10px; color: #909399;">元</span>
            </el-form-item>
            
            <el-form-item label="转让原因">
              <el-input 
                v-model="productForm.reason" 
                type="textarea" 
                :rows="2"
                placeholder="如：毕业离校、换新升级、闲置转让等"
              />
            </el-form-item>
            
            <el-form-item label="商品特色">
              <el-select
                v-model="productForm.features"
                multiple
                placeholder="选择商品特色"
                style="width: 100%"
              >
                <el-option label="功能齐全" value="功能齐全" />
                <el-option label="性能稳定" value="性能稳定" />
                <el-option label="外观精美" value="外观精美" />
                <el-option label="品质优良" value="品质优良" />
                <el-option label="性价比高" value="性价比高" />
                <el-option label="保养良好" value="保养良好" />
              </el-select>
            </el-form-item>
          </el-form>
          
          <div class="generate-actions">
            <el-button 
              type="primary" 
              size="large" 
              :loading="aiStore.isGenerating"
              @click="generateDescription"
            >
              生成商品描述
            </el-button>
            
            <el-button 
              v-if="generatedDescription" 
              type="success" 
              size="large"
              @click="copyDescription"
            >
              复制描述
            </el-button>
          </div>
        </div>
        
        <!-- 生成的描述 -->
        <div v-if="generatedDescription" class="generated-content">
          <h3>生成的商品描述：</h3>
          <div class="description-box">
            <pre>{{ generatedDescription }}</pre>
          </div>
        </div>
        
        <!-- AI建议 -->
        <div v-if="aiSuggestions.length > 0" class="ai-suggestions">
          <h3>AI建议：</h3>
          <el-alert
            v-for="(suggestion, index) in aiSuggestions"
            :key="index"
            :title="suggestion"
            type="info"
            :closable="false"
            style="margin-bottom: 10px"
          />
        </div>
      </div>

      <!-- 价格分析工具 -->
      <div class="ai-module">
        <div class="module-header">
          <h2>💰 价格分析工具</h2>
          <p>智能分析同类商品价格，给出合理建议</p>
        </div>
        
        <div class="module-content">
          <el-form :model="priceForm" label-width="120px">
            <el-form-item label="商品分类">
              <el-select v-model="priceForm.category" placeholder="选择分类">
                <el-option label="电子产品" value="electronics" />
                <el-option label="图书教材" value="books" />
                <el-option label="生活用品" value="daily" />
                <el-option label="运动器材" value="sports" />
                <el-option label="服装鞋帽" value="clothing" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="商品品牌">
              <el-input v-model="priceForm.brand" placeholder="输入商品品牌，如：苹果、华为、小米等" />
            </el-form-item>
            
            <el-form-item label="商品成色">
              <el-select v-model="priceForm.condition" placeholder="选择成色">
                <el-option label="全新" value="全新" />
                <el-option label="几乎全新" value="几乎全新" />
                <el-option label="轻微使用" value="轻微使用" />
                <el-option label="明显使用" value="明显使用" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="使用时间">
              <el-input-number 
                v-model="priceForm.usageTime" 
                :min="0" 
                :max="60"
                :step="1"
              />
              <span style="margin-left: 10px; color: #909399;">个月</span>
            </el-form-item>
            
            <el-form-item label="原价">
              <el-input-number 
                v-model="priceForm.originalPrice" 
                :min="0" 
                :step="100"
                :precision="2"
              />
              <span style="margin-left: 10px; color: #909399;">元</span>
            </el-form-item>
          </el-form>
          
          <div class="generate-actions">
            <el-button 
              type="primary" 
              size="large" 
              :loading="priceStore.isLoading"
              @click="evaluatePrice"
            >
              分析价格
            </el-button>
          </div>
        </div>
        
        <!-- 价格分析结果 -->
        <div v-if="priceEvaluation" class="price-analysis-result">
          <h3>价格分析结果：</h3>
          
          <div class="price-result-card">
            <div class="suggested-price">
              <span class="price-label">建议售价</span>
              <span class="price-value">¥{{ priceEvaluation.suggestedPrice }}</span>
            </div>
            
            <div class="price-range">
              <span class="range-label">合理价格区间</span>
              <span class="range-value">
                ¥{{ priceEvaluation.priceRange.min }} - ¥{{ priceEvaluation.priceRange.max }}
              </span>
            </div>
            
            <div class="confidence-score">
              <span class="confidence-label">分析置信度</span>
              <el-progress 
                :percentage="priceEvaluation.confidence" 
                :status="getConfidenceStatus(priceEvaluation.confidence)"
              />
            </div>
          </div>
          
          <div v-if="priceEvaluation.factors.length > 0" class="price-factors">
            <h4>影响因素：</h4>
            <ul>
              <li v-for="factor in priceEvaluation.factors" :key="factor">
                {{ factor }}
              </li>
            </ul>
          </div>
          
          <div v-if="priceEvaluation.marketData" class="market-data">
            <h4>市场数据：</h4>
            <p>同类商品数量：{{ priceEvaluation.marketData.similarProductsCount }}</p>
            <p>市场平均价格：¥{{ priceEvaluation.marketData.averageMarketPrice }}</p>
            <p>市场价格范围：¥{{ priceEvaluation.marketData.priceRange.min }} - ¥{{ priceEvaluation.marketData.priceRange.max }}</p>
          </div>
        </div>
      </div>

      <!-- 智能客服 -->
      <div class="ai-module">
        <div class="module-header">
          <h2>💬 智能客服</h2>
          <p>AI客服随时为您解答问题</p>
        </div>
        
        <div class="chat-container">
          <div class="chat-messages">
            <div 
              v-for="message in chatMessages" 
              :key="message.id"
              class="chat-message"
              :class="message.type"
            >
              <div class="message-content">
                {{ message.content }}
              </div>
              <div class="message-time">
                {{ formatTime(message.timestamp) }}
              </div>
            </div>
          </div>
          
          <div class="chat-input">
            <el-input
              v-model="userInput"
              type="textarea"
              :rows="2"
              placeholder="请输入您的问题..."
              @keyup.enter="sendMessage"
            />
            <el-button 
              type="primary" 
              @click="sendMessage"
              :disabled="!userInput.trim()"
            >
              发送
            </el-button>
          </div>
          
          <div class="quick-questions">
            <span>快速提问：</span>
            <el-button
              v-for="question in quickQuestions"
              :key="question"
              size="small"
              @click="askQuickQuestion(question)"
            >
              {{ question }}
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 悬浮AI助手 -->
  <FloatingAIAssistant />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onErrorCaptured } from 'vue'
import { useAIAssistantStore } from '@/stores/ai-assistant'
import { usePriceAnalyticsStore } from '@/stores/price-analytics'
import { ElMessage } from 'element-plus'
import GlobalNavigation from '@/components/GlobalNavigation.vue'
import FloatingAIAssistant from '@/components/FloatingAIAssistant.vue'

const aiStore = useAIAssistantStore()
const priceStore = usePriceAnalyticsStore()

// 页面状态
const isLoading = ref(false)
const hasError = ref(false)
const errorMessage = ref('')

// 表单数据
const productForm = ref({
  category: '',
  brand: '',
  condition: '',
  usageTime: 0,
  originalPrice: 0,
  reason: '',
  features: []
})

const priceForm = ref({
  category: '',
  brand: '',
  condition: '',
  usageTime: 0,
  originalPrice: 0
})

// 聊天数据
const chatMessages = ref([
  {
    id: 1,
    type: 'ai',
    content: '您好！我是校园二手交易平台的AI助手，有什么可以帮助您的吗？',
    timestamp: new Date()
  }
])
const userInput = ref('')

const quickQuestions = [
  '如何发布商品？',
  '交易安全吗？',
  '价格可以商量吗？',
  '支持退换吗？'
]

// 计算属性
const generatedDescription = computed(() => aiStore.generatedContent)
const aiSuggestions = computed(() => aiStore.aiSuggestions)
const priceEvaluation = computed(() => priceStore.priceEvaluation)

// 错误捕获
onErrorCaptured((error, instance, info) => {
  console.error('AI助手页面错误:', error, info)
  hasError.value = true
  errorMessage.value = error instanceof Error ? error.message : '页面加载失败'
  ElMessage.error('页面加载出错：' + errorMessage.value)
  return false // 阻止错误继续向上传播
})

// 生命周期
onMounted(async () => {
  try {
    isLoading.value = true
    // 初始化价格分析数据
    await priceStore.getCategoryPriceStats()
    ElMessage.success('AI助手已准备就绪！')
  } catch (error) {
    console.error('AI助手页面初始化失败:', error)
    hasError.value = true
    errorMessage.value = error instanceof Error ? error.message : '初始化失败'
    ElMessage.error('AI助手初始化失败：' + errorMessage.value)
  } finally {
    isLoading.value = false
  }
})

// 方法
const generateDescription = async () => {
  if (!productForm.value.category) {
    ElMessage.warning('请选择商品分类')
    return
  }
  
  try {
    await aiStore.generateProductDescription(productForm.value)
    ElMessage.success('商品描述生成成功！')
  } catch (error) {
    ElMessage.error('生成失败，请稍后重试')
  }
}

const copyDescription = () => {
  navigator.clipboard.writeText(generatedDescription.value).then(() => {
    ElMessage.success('描述已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

const evaluatePrice = async () => {
  if (!priceForm.value.category) {
    ElMessage.warning('请选择商品分类')
    return
  }
  
  try {
    const result = await priceStore.evaluateProductPrice(priceForm.value)
    if (result) {
      ElMessage.success('价格分析完成！')
    }
  } catch (error) {
    ElMessage.error('分析失败，请稍后重试')
  }
}

const getConfidenceStatus = (confidence: number) => {
  if (confidence >= 80) return 'success'
  if (confidence >= 60) return 'warning'
  return 'exception'
}

const sendMessage = async () => {
  if (!userInput.value.trim()) return
  
  // 添加用户消息
  chatMessages.value.push({
    id: Date.now(),
    type: 'user',
    content: userInput.value,
    timestamp: new Date()
  })
  
  const userMessage = userInput.value
  userInput.value = ''
  
  // 模拟AI回复
  setTimeout(async () => {
    const aiResponse = await aiStore.smartCustomerService(userMessage)
    chatMessages.value.push({
      id: Date.now() + 1,
      type: 'ai',
      content: aiResponse,
      timestamp: new Date()
    })
  }, 1000)
}

const askQuickQuestion = (question: string) => {
  chatMessages.value.push({
    id: Date.now(),
    type: 'user',
    content: question,
    timestamp: new Date()
  })
  
  setTimeout(async () => {
    const aiResponse = await aiStore.smartCustomerService(question)
    chatMessages.value.push({
      id: Date.now() + 1,
      type: 'ai',
      content: aiResponse,
      timestamp: new Date()
    })
  }, 500)
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const reloadPage = () => {
  window.location.reload()
}

const goHome = () => {
  window.location.href = '/'
}
</script>

<style scoped>
.ai-assistant-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 0;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 40px;
}

.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 40px;
}

.ai-header {
  text-align: center;
  padding: 60px 20px;
  color: white;
}

.header-content h1 {
  font-size: 3rem;
  margin-bottom: 10px;
  font-weight: 700;
}

.header-content p {
  font-size: 1.2rem;
  opacity: 0.9;
}

.ai-modules {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.ai-module {
  background: white;
  border-radius: 16px;
  padding: 40px;
  margin-bottom: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.module-header {
  text-align: center;
  margin-bottom: 30px;
}

.module-header h2 {
  color: #303133;
  font-size: 2rem;
  margin-bottom: 10px;
}

.module-header p {
  color: #909399;
  font-size: 1.1rem;
}

.module-content {
  max-width: 800px;
  margin: 0 auto;
}

.generate-actions {
  text-align: center;
  margin-top: 30px;
}

.generate-actions .el-button {
  margin: 0 10px;
  min-width: 140px;
}

.generated-content {
  margin-top: 30px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.generated-content h3 {
  color: #303133;
  margin-bottom: 15px;
}

.description-box {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.description-box pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
  line-height: 1.6;
  color: #606266;
}

.ai-suggestions {
  margin-top: 20px;
}

.ai-suggestions h3 {
  color: #303133;
  margin-bottom: 15px;
}

.price-analysis-result {
  margin-top: 30px;
}

.price-analysis-result h3 {
  color: #303133;
  margin-bottom: 20px;
}

.price-result-card {
  background: #f5f7fa;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 20px;
}

.suggested-price {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.price-label {
  font-size: 1.1rem;
  color: #606266;
}

.price-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #409eff;
}

.price-range {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.range-label {
  font-size: 1rem;
  color: #606266;
}

.range-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: #67c23a;
}

.confidence-score {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.confidence-label {
  font-size: 1rem;
  color: #606266;
}

.price-factors {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.price-factors h4 {
  color: #303133;
  margin-bottom: 15px;
}

.price-factors ul {
  margin: 0;
  padding-left: 20px;
}

.price-factors li {
  color: #606266;
  margin-bottom: 8px;
  line-height: 1.5;
}

.market-data {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.market-data h4 {
  color: #303133;
  margin-bottom: 15px;
}

.market-data p {
  color: #606266;
  margin-bottom: 8px;
  line-height: 1.5;
}

.chat-container {
  background: white;
  border-radius: 12px;
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.chat-messages {
  height: 400px;
  overflow-y: auto;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.chat-message {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
}

.chat-message.user {
  align-items: flex-end;
}

.chat-message.ai {
  align-items: flex-start;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.5;
}

.chat-message.user .message-content {
  background: #409eff;
  color: white;
  border-bottom-right-radius: 4px;
}

.chat-message.ai .message-content {
  background: white;
  color: #303133;
  border: 1px solid #e4e7ed;
  border-bottom-left-radius: 4px;
}

.message-time {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.chat-input {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.chat-input .el-textarea {
  flex: 1;
}

.quick-questions {
  text-align: center;
  margin-top: 15px;
}

.quick-questions span {
  color: #606266;
  margin-right: 10px;
}

.quick-questions .el-button {
  margin: 0 5px 5px 0;
}

@media (max-width: 768px) {
  .header-content h1 {
    font-size: 2rem;
  }
  
  .ai-module {
    padding: 20px;
    margin: 0 10px 20px;
  }
  
  .module-header h2 {
    font-size: 1.5rem;
  }
  
  .chat-messages {
    height: 300px;
    padding: 15px;
  }
  
  .chat-input {
    flex-direction: column;
  }
}
</style>