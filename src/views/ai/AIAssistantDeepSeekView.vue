<template>
  <div class="ai-assistant-deepseek-view">
    <!-- 全局导航 -->
    <GlobalNavigation />
    
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1>🤖 DeepSeek AI智能助手</h1>
        <p>基于DeepSeek AI的校园二手交易智能服务</p>
        <div class="ai-status">
          <el-icon><CircleCheck /></el-icon>
          <span>DeepSeek AI已激活</span>
        </div>
      </div>
    </div>

    <!-- AI状态指示 -->
    <div class="ai-status-bar">
      <el-alert
        title="🤖 内置AI智能助手"
        type="success"
        description="正在使用DeepSeek AI为您提供智能服务，无需任何配置"
        show-icon
        :closable="false"
      />
    </div>

    <!-- 功能标签页 -->
    <div class="ai-tabs-container">
      <el-tabs v-model="activeTab" class="ai-tabs">
        <!-- AI对话 -->
        <el-tab-pane label="💬 AI对话" name="chat">
          <div class="tab-content">
            <AIChatInterface />
          </div>
        </el-tab-pane>

        <!-- 商品描述生成 -->
        <el-tab-pane label="✍️ 商品描述" name="description">
          <div class="tab-content">
            <ProductDescriptionGenerator />
          </div>
        </el-tab-pane>

        <!-- 价格分析 -->
        <el-tab-pane label="💰 价格分析" name="price">
          <div class="tab-content">
            <PriceAnalysisTool />
          </div>
        </el-tab-pane>

        <!-- 安全检测 -->
        <el-tab-pane label="🛡️ 安全检测" name="safety">
          <div class="tab-content">
            <SafetyChecker />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 悬浮AI助手 -->
    <FloatingAIAssistant />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheck } from '@element-plus/icons-vue'
import GlobalNavigation from '@/components/GlobalNavigation.vue'
import FloatingAIAssistant from '@/components/FloatingAIAssistant.vue'
import { useAIAssistantEnhancedStore } from '@/stores/ai-assistant-enhanced'

const aiStore = useAIAssistantEnhancedStore()

// 当前激活的标签页
const activeTab = ref('chat')

// 生命周期
onMounted(() => {
  // 内置AI模式，自动初始化DeepSeek
  aiStore.configureAI()
  ElMessage.success('🤖 DeepSeek AI助手已准备就绪！')
})

// 子组件定义（内联组件以保持文件结构简洁）
const AIChatInterface = {
  template: `
    <div class="ai-chat-interface">
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
          <div v-if="isTyping" class="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
        
        <div class="chat-input-area">
          <el-input
            v-model="userInput"
            type="textarea"
            :rows="3"
            placeholder="请输入您的问题，DeepSeek AI将为您提供帮助..."
            @keydown.enter.prevent="sendMessage"
            class="chat-input"
          />
          <el-button 
            type="primary" 
            @click="sendMessage"
            :loading="isLoading"
            :disabled="!userInput.trim()"
            class="send-btn"
          >
            发送消息
          </el-button>
        </div>
        
        <div class="quick-prompts">
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
  `,
  setup() {
    const { ref, computed, nextTick } = Vue
    const { ElMessage } = ElementPlus
    const aiStore = useAIAssistantEnhancedStore()
    
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
    const isTyping = ref(false)

    const quickPrompts = [
      '如何发布商品？',
      '价格怎么定？',
      '交易安全吗？',
      '帮我写个商品描述',
      '检查这个价格是否合理',
      '有什么热门商品推荐？'
    ]

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
      isTyping.value = true
      
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
        isTyping.value = false
        nextTick(() => {
          const container = document.querySelector('.chat-messages')
          if (container) container.scrollTop = container.scrollHeight
        })
      }
    }

    const useQuickPrompt = (prompt: string) => {
      userInput.value = prompt
      sendMessage()
    }

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }

    return {
      userInput,
      messages,
      isLoading,
      isTyping,
      quickPrompts,
      sendMessage,
      useQuickPrompt,
      formatTime
    }
  }
}

const ProductDescriptionGenerator = {
  template: `
    <div class="product-description-generator">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>✍️ DeepSeek AI商品描述生成器</span>
            <el-tag type="success">DeepSeek AI</el-tag>
          </div>
        </template>
        
        <el-form :model="form" label-width="120px">
          <el-form-item label="商品分类">
            <el-select v-model="form.category" placeholder="选择分类">
              <el-option label="电子产品" value="electronics" />
              <el-option label="图书教材" value="books" />
              <el-option label="生活用品" value="daily" />
              <el-option label="运动器材" value="sports" />
              <el-option label="服装鞋帽" value="clothing" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="品牌型号">
            <el-input v-model="form.brand" placeholder="如：Apple iPhone 12" />
          </el-form-item>
          
          <el-form-item label="商品成色">
            <el-select v-model="form.condition" placeholder="选择成色">
              <el-option label="全新" value="全新" />
              <el-option label="几乎全新" value="几乎全新" />
              <el-option label="轻微使用" value="轻微使用" />
              <el-option label="明显使用" value="明显使用" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="使用时间">
            <el-input-number v-model="form.usageTime" :min="0" :max="60" />
            <span style="margin-left: 10px; color: #909399;">个月</span>
          </el-form-item>
          
          <el-form-item label="原价">
            <el-input-number v-model="form.originalPrice" :min="0" :step="100" />
            <span style="margin-left: 10px; color: #909399;">元</span>
          </el-form-item>
          
          <el-form-item label="转让原因">
            <el-input v-model="form.reason" type="textarea" :rows="2" placeholder="如：毕业离校、换新升级、闲置转让等" />
          </el-form-item>
          
          <el-form-item label="商品特色">
            <el-select v-model="form.features" multiple placeholder="选择商品特色">
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
            :loading="isGenerating"
            @click="generateDescription"
          >
            🚀 DeepSeek生成描述
          </el-button>
          
          <el-button 
            v-if="generatedDescription" 
            type="success" 
            size="large"
            @click="copyDescription"
          >
            📋 复制描述
          </el-button>
        </div>
        
        <div v-if="generatedDescription" class="generated-content">
          <h4>🎯 DeepSeek生成的商品描述：</h4>
          <el-input
            v-model="generatedDescription"
            type="textarea"
            :rows="10"
            readonly
            class="description-output"
          />
        </div>
      </el-card>
    </div>
  `,
  setup() {
    const { ref } = Vue
    const { ElMessage } = ElementPlus
    const aiStore = useAIAssistantEnhancedStore()
    
    const form = ref({
      category: '',
      brand: '',
      condition: '',
      usageTime: 0,
      originalPrice: 0,
      reason: '',
      features: []
    })
    
    const generatedDescription = ref('')
    const isGenerating = ref(false)
    
    const generateDescription = async () => {
      if (!form.value.category) {
        ElMessage.warning('请选择商品分类')
        return
      }
      
      isGenerating.value = true
      try {
        // 构建DeepSeek提示词
        const prompt = `请为以下商品生成一个专业、吸引人的商品描述：

商品信息：
- 分类：${form.value.category}
- 品牌：${form.value.brand || '未指定'}
- 成色：${form.value.condition}
- 使用时间：${form.value.usageTime}个月
- 原价：${form.value.originalPrice}元
- 转让原因：${form.value.reason || '未指定'}
- 特色：${form.value.features.join(', ') || '未指定'}

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
        isGenerating.value = false
      }
    }
    
    const copyDescription = () => {
      navigator.clipboard.writeText(generatedDescription.value).then(() => {
        ElMessage.success('描述已复制到剪贴板')
      }).catch(() => {
        ElMessage.error('复制失败')
      })
    }
    
    return {
      form,
      generatedDescription,
      isGenerating,
      generateDescription,
      copyDescription
    }
  }
}

const PriceAnalysisTool = {
  template: `
    <div class="price-analysis-tool">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>💰 DeepSeek AI价格分析工具</span>
            <el-tag type="warning">DeepSeek市场分析</el-tag>
          </div>
        </template>
        
        <el-form :model="form" label-width="120px">
          <el-form-item label="商品分类">
            <el-select v-model="form.category" placeholder="选择分类">
              <el-option label="电子产品" value="electronics" />
              <el-option label="图书教材" value="books" />
              <el-option label="生活用品" value="daily" />
              <el-option label="运动器材" value="sports" />
              <el-option label="服装鞋帽" value="clothing" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="商品成色">
            <el-select v-model="form.condition" placeholder="选择成色">
              <el-option label="全新" value="全新" />
              <el-option label="几乎全新" value="几乎全新" />
              <el-option label="轻微使用" value="轻微使用" />
              <el-option label="明显使用" value="明显使用" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="使用时间">
            <el-input-number v-model="form.usageTime" :min="0" :max="60" />
            <span style="margin-left: 10px; color: #909399;">个月</span>
          </el-form-item>
          
          <el-form-item label="原价">
            <el-input-number v-model="form.originalPrice" :min="0" :step="100" />
            <span style="margin-left: 10px; color: #909399;">元</span>
          </el-form-item>
          
          <el-form-item label="期望售价">
            <el-input-number v-model="form.targetPrice" :min="0" :step="100" />
            <span style="margin-left: 10px; color: #909399;">元</span>
          </el-form-item>
        </el-form>
        
        <div class="analyze-actions">
          <el-button 
            type="primary" 
            size="large" 
            :loading="isAnalyzing"
            @click="analyzePrice"
          >
            🔍 DeepSeek分析价格
          </el-button>
        </div>
        
        <div v-if="priceAnalysis" class="analysis-result">
          <h4>📊 DeepSeek价格分析报告：</h4>
          <div class="result-content">
            <el-input
              v-model="priceAnalysis"
              type="textarea"
              :rows="12"
              readonly
              class="analysis-output"
            />
          </div>
        </div>
      </el-card>
    </div>
  `,
  setup() {
    const { ref } = Vue
    const { ElMessage } = ElementPlus
    const aiStore = useAIAssistantEnhancedStore()
    
    const form = ref({
      category: '',
      condition: '',
      usageTime: 0,
      originalPrice: 0,
      targetPrice: 0
    })
    
    const priceAnalysis = ref('')
    const isAnalyzing = ref(false)
    
    const analyzePrice = async () => {
      if (!form.value.category) {
        ElMessage.warning('请选择商品分类')
        return
      }
      
      isAnalyzing.value = true
      try {
        const prompt = `请分析以下商品的价格合理性：

商品信息：
- 分类：${form.value.category}
- 成色：${form.value.condition}
- 使用时间：${form.value.usageTime}个月
- 原价：${form.value.originalPrice}元
- 期望售价：${form.value.targetPrice}元

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
        isAnalyzing.value = false
      }
    }
    
    return {
      form,
      priceAnalysis,
      isAnalyzing,
      analyzePrice
    }
  }
}

const SafetyChecker = {
  template: `
    <div class="safety-checker">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>🛡️ DeepSeek AI交易安全检测</span>
            <el-tag type="danger">DeepSeek风险识别</el-tag>
          </div>
        </template>
        
        <el-form :model="form" label-width="120px">
          <el-form-item label="交易方式">
            <el-select v-model="form.transactionMethod" placeholder="选择交易方式">
              <el-option label="当面交易" value="face_to_face" />
              <el-option label="线上交易" value="online" />
              <el-option label="快递邮寄" value="shipping" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="交易地点">
            <el-input v-model="form.location" placeholder="如：学校图书馆、食堂等" />
          </el-form-item>
          
          <el-form-item label="付款方式">
            <el-select v-model="form.paymentMethod" placeholder="选择付款方式">
              <el-option label="现金" value="cash" />
              <el-option label="微信转账" value="wechat" />
              <el-option label="支付宝" value="alipay" />
              <el-option label="银行转账" value="bank" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="价格差异">
            <el-input-number v-model="form.priceDifference" :min="0" />
            <span style="margin-left: 10px; color: #909399;">%</span>
            <div class="input-tip">与市场价的差异百分比</div>
          </el-form-item>
          
          <el-form-item label="卖家信誉">
            <el-rate v-model="form.sellerRating" :max="5" show-text />
          </el-form-item>
          
          <el-form-item label="其他信息">
            <el-input 
              v-model="form.otherInfo" 
              type="textarea" 
              :rows="3" 
              placeholder="请输入其他需要注意的信息，如：卖家要求预付定金、商品描述过于简单等"
            />
          </el-form-item>
        </el-form>
        
        <div class="check-actions">
          <el-button 
            type="danger" 
            size="large" 
            :loading="isChecking"
            @click="checkSafety"
          >
            🔍 DeepSeek安全检测
          </el-button>
        </div>
        
        <div v-if="safetyReport" class="safety-result">
          <h4>🚨 DeepSeek安全检测报告：</h4>
          <div class="result-content">
            <el-input
              v-model="safetyReport"
              type="textarea"
              :rows="15"
              readonly
              class="safety-output"
            />
          </div>
        </div>
      </el-card>
    </div>
  `,
  setup() {
    const { ref } = Vue
    const { ElMessage } = ElementPlus
    const aiStore = useAIAssistantEnhancedStore()
    
    const form = ref({
      transactionMethod: '',
      location: '',
      paymentMethod: '',
      priceDifference: 0,
      sellerRating: 0,
      otherInfo: ''
    })
    
    const safetyReport = ref('')
    const isChecking = ref(false)
    
    const checkSafety = async () => {
      if (!form.value.transactionMethod) {
        ElMessage.warning('请选择交易方式')
        return
      }
      
      isChecking.value = true
      try {
        const prompt = `请分析以下交易信息的安全性：

交易信息：
- 交易方式：${form.value.transactionMethod === 'face_to_face' ? '当面交易' : form.value.transactionMethod === 'online' ? '线上交易' : '快递邮寄'}
- 交易地点：${form.value.location || '未指定'}
- 付款方式：${form.value.paymentMethod || '未指定'}
- 价格差异：比市场价${form.value.priceDifference > 0 ? '高' : '低'}${Math.abs(form.value.priceDifference)}%
- 卖家信誉：${form.value.sellerRating}/5星
- 其他信息：${form.value.otherInfo || '无'}

请评估：
1. 交易风险等级（低/中/高）
2. 可能的风险点
3. 安全建议
4. 需要注意的细节

请提供具体、实用的安全指导。`
        
        const response = await aiStore.sendMessage(prompt)
        safetyReport.value = response.content
        
        ElMessage.success('DeepSeek安全检测完成！')
      } catch (error: any) {
        ElMessage.error('DeepSeek检测失败：' + error.message)
      } finally {
        isChecking.value = false
      }
    }
    
    return {
      form,
      safetyReport,
      isChecking,
      checkSafety
    }
  }
}
</script>

<style scoped>
.ai-assistant-deepseek-view {
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

.ai-tabs-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.ai-tabs {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.tab-content {
  padding: 30px;
  min-height: 600px;
}

/* AI聊天界面样式 */
.ai-chat-interface {
  height: 600px;
  display: flex;
  flex-direction: column;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
  border-radius: 12px;
  overflow: hidden;
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

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #667eea;
  border-radius: 50%;
  animation: typingDot 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

.chat-input-area {
  padding: 20px;
  background: white;
  border-top: 1px solid #e9ecef;
}

.chat-input {
  margin-bottom: 12px;
}

.send-btn {
  width: 100%;
}

.quick-prompts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.quick-prompt-btn {
  margin: 0;
}

/* 商品描述生成器样式 */
.product-description-generator {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.generate-actions {
  text-align: center;
  margin-top: 30px;
}

.generated-content {
  margin-top: 30px;
}

.generated-content h4 {
  margin-bottom: 16px;
  color: #303133;
}

.description-output {
  font-family: inherit;
  line-height: 1.6;
}

/* 价格分析工具样式 */
.price-analysis-tool {
  max-width: 800px;
  margin: 0 auto;
}

.analyze-actions {
  text-align: center;
  margin-top: 30px;
}

.analysis-result {
  margin-top: 30px;
}

.analysis-result h4 {
  margin-bottom: 16px;
  color: #303133;
}

.analysis-output {
  font-family: inherit;
  line-height: 1.6;
}

/* 安全检测样式 */
.safety-checker {
  max-width: 800px;
  margin: 0 auto;
}

.check-actions {
  text-align: center;
  margin-top: 30px;
}

.safety-result {
  margin-top: 30px;
}

.safety-result h4 {
  margin-bottom: 16px;
  color: #303133;
}

.safety-output {
  font-family: inherit;
  line-height: 1.6;
}

.input-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
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
  .header-content h1 {
    font-size: 2rem;
  }
  
  .tab-content {
    padding: 20px;
  }
  
  .message {
    max-width: 90%;
  }
  
  .quick-prompts {
    justify-content: center;
  }
}
</style>