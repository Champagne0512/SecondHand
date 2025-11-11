<template>
  <div class="ai-config-panel">
    <el-card class="config-card">
      <template #header>
        <div class="card-header">
          <span>🤖 AI助手配置</span>
          <el-tag :type="configStatusType">{{ configStatusText }}</el-tag>
        </div>
      </template>

      <el-form :model="configForm" label-width="120px" class="config-form">
        <!-- AI服务提供商 -->
        <el-form-item label="AI提供商">
          <el-select v-model="configForm.provider" placeholder="选择AI服务提供商">
            <el-option label="OpenAI" value="openai" />
            <el-option label="Claude" value="claude" />
            <el-option label="本地API" value="local" />
            <el-option label="模拟模式" value="mock" />
          </el-select>
        </el-form-item>

        <!-- API模型选择 -->
        <el-form-item label="模型选择">
          <el-select v-model="configForm.model" placeholder="选择AI模型">
            <el-option-group 
              v-for="group in modelOptions[configForm.provider]" 
              :key="group.label" 
              :label="group.label"
            >
              <el-option
                v-for="model in group.options"
                :key="model.value"
                :label="model.label"
                :value="model.value"
              />
            </el-option-group>
          </el-select>
        </el-form-item>

        <!-- API密钥 -->
        <el-form-item label="API密钥" v-if="configForm.provider !== 'mock'">
          <el-input
            v-model="configForm.apiKey"
            type="password"
            placeholder="输入您的API密钥"
            show-password
          >
            <template #prepend>
              <el-icon><Key /></el-icon>
            </template>
          </el-input>
          <div class="input-tip">
            <el-alert
              v-if="configForm.provider === 'openai'"
              title="获取OpenAI API密钥"
              type="info"
              :closable="false"
              show-icon
            >
              访问 <a href="https://platform.openai.com/api-keys" target="_blank">OpenAI平台</a> 获取您的API密钥
            </el-alert>
            <el-alert
              v-else-if="configForm.provider === 'claude'"
              title="获取Claude API密钥"
              type="info"
              :closable="false"
              show-icon
            >
              访问 <a href="https://console.anthropic.com/" target="_blank">Anthropic控制台</a> 获取API密钥
            </el-alert>
          </div>
        </el-form-item>

        <!-- API地址 -->
        <el-form-item label="API地址" v-if="configForm.provider === 'local'">
          <el-input
            v-model="configForm.endpoint"
            placeholder="http://localhost:8080/api/chat"
          >
            <template #prepend>
              <el-icon><Link /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!-- 高级设置 -->
        <el-divider>高级设置</el-divider>

        <el-form-item label="最大令牌数">
          <el-slider
            v-model="configForm.maxTokens"
            :min="100"
            :max="2000"
            :step="100"
            show-input
          />
          <div class="slider-tip">控制AI回复的最大长度</div>
        </el-form-item>

        <el-form-item label="创意程度">
          <el-slider
            v-model="configForm.temperature"
            :min="0"
            :max="1"
            :step="0.1"
            show-input
          />
          <div class="slider-tip">值越高回复越有创意，越低越保守</div>
        </el-form-item>

        <el-form-item label="语言偏好">
          <el-radio-group v-model="configForm.language">
            <el-radio label="zh-CN">简体中文</el-radio>
            <el-radio label="zh-TW">繁體中文</el-radio>
            <el-radio label="en-US">English</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 功能开关 -->
        <el-divider>功能开关</el-divider>

        <el-form-item label="智能推荐">
          <el-switch v-model="configForm.enableRecommendations" />
        </el-form-item>

        <el-form-item label="安全检测">
          <el-switch v-model="configForm.enableSafetyCheck" />
        </el-form-item>

        <el-form-item label="语音输入">
          <el-switch v-model="configForm.enableVoiceInput" />
        </el-form-item>

        <!-- 测试功能 -->
        <el-divider>功能测试</el-divider>

        <el-form-item label="测试连接">
          <el-button 
            type="primary" 
            @click="testConnection"
            :loading="isTesting"
            :disabled="!canTest"
          >
            <el-icon><Connection /></el-icon>
            测试连接
          </el-button>
          <el-button @click="testAIResponse" :disabled="!isConfigured">
            测试AI回复
          </el-button>
        </el-form-item>

        <!-- 测试结果 -->
        <el-form-item v-if="testResult" label="测试结果">
          <el-alert
            :title="testResult.title"
            :type="testResult.type"
            :description="testResult.message"
            show-icon
            :closable="false"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="card-footer">
          <el-button @click="resetConfig">重置</el-button>
          <el-button type="primary" @click="saveConfig" :loading="isSaving">
            保存配置
          </el-button>
        </div>
      </template>
    </el-card>

    <!-- 使用说明 -->
    <el-card class="help-card">
      <template #header>
        <span>📖 使用说明</span>
      </template>
      
      <el-collapse v-model="activeHelp">
        <el-collapse-item title="如何获取API密钥" name="api-key">
          <div class="help-content">
            <h4>OpenAI API密钥获取步骤：</h4>
            <ol>
              <li>访问 <a href="https://platform.openai.com" target="_blank">OpenAI Platform</a></li>
              <li>注册或登录您的OpenAI账号</li>
              <li>点击左侧菜单的"API Keys"</li>
              <li>点击"Create new secret key"按钮</li>
              <li>复制生成的密钥并妥善保存</li>
            </ol>
            
            <h4>注意事项：</h4>
            <ul>
              <li>新用户通常有免费试用额度</li>
              <li>使用后需要绑定支付方式</li>
              <li>请妥善保管您的API密钥</li>
            </ul>
          </div>
        </el-collapse-item>

        <el-collapse-item title="模型选择建议" name="model-selection">
          <div class="help-content">
            <h4>不同模型的特点：</h4>
            <ul>
              <li><strong>GPT-3.5 Turbo:</strong> 速度快，成本低，适合日常使用</li>
              <li><strong>GPT-4:</strong> 能力强，推理准确，适合复杂任务</li>
              <li><strong>GPT-4 Turbo:</strong> 性价比高，支持长文本</li>
            </ul>
            
            <h4>推荐配置：</h4>
            <ul>
              <li>普通对话：GPT-3.5 Turbo</li>
              <li>复杂分析：GPT-4</li>
              <li>长文本处理：GPT-4 Turbo</li>
            </ul>
          </div>
        </el-collapse-item>

        <el-collapse-item title="参数调优指南" name="parameter-tuning">
          <div class="help-content">
            <h4>参数说明：</h4>
            <ul>
              <li><strong>最大令牌数：</strong>控制回复长度，一般500-1000足够</li>
              <li><strong>创意程度：</strong>0.1-0.3适合事实性回答，0.7-0.9适合创意内容</li>
            </ul>
            
            <h4>场景推荐：</h4>
            <ul>
              <li>商品描述生成：创意程度0.7，令牌数800</li>
              <li>价格分析：创意程度0.3，令牌数600</li>
              <li>安全检测：创意程度0.2，令牌数500</li>
            </ul>
          </div>
        </el-collapse-item>

        <el-collapse-item title="常见问题" name="faq">
          <div class="help-content">
            <h4>Q: 配置完成后AI助手没有反应？</h4>
            <p>A: 请检查以下几点：
              <br>• API密钥是否正确
              <br>• 网络连接是否正常
              <br>• 测试连接是否成功
            </p>
            
            <h4>Q: AI回复很慢或超时？</h4>
            <p>A: 可能原因：
              <br>• 网络延迟较高
              <br>• 选择了较大的模型
              <br>• API服务繁忙
            </p>
            
            <h4>Q: 如何降低使用成本？</h4>
            <p>A: 建议：
              <br>• 选择GPT-3.5 Turbo模型
              <br>• 适当降低最大令牌数
              <br>• 使用模拟模式测试
            </p>
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Key, Link, Connection } from '@element-plus/icons-vue'
import { useAIAssistantEnhancedStore } from '@/stores/ai-assistant-enhanced'

const aiStore = useAIAssistantEnhancedStore()

// 表单数据
const configForm = reactive({
  provider: 'openai',
  model: 'gpt-3.5-turbo',
  apiKey: '',
  endpoint: 'https://api.openai.com/v1/chat/completions',
  maxTokens: 1000,
  temperature: 0.7,
  language: 'zh-CN',
  enableRecommendations: true,
  enableSafetyCheck: true,
  enableVoiceInput: true
})

// 状态
const isTesting = ref(false)
const isSaving = ref(false)
const testResult = ref<any>(null)
const activeHelp = ref(['api-key'])

// 模型选项
const modelOptions = {
  openai: [
    {
      label: 'GPT-3.5系列',
      options: [
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (推荐)' },
        { value: 'gpt-3.5-turbo-16k', label: 'GPT-3.5 Turbo 16K' }
      ]
    },
    {
      label: 'GPT-4系列',
      options: [
        { value: 'gpt-4', label: 'GPT-4' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
        { value: 'gpt-4-turbo-preview', label: 'GPT-4 Turbo Preview' }
      ]
    }
  ],
  claude: [
    {
      label: 'Claude系列',
      options: [
        { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
        { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
        { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' }
      ]
    }
  ],
  local: [
    {
      label: '本地模型',
      options: [
        { value: 'local-model', label: '本地模型' }
      ]
    }
  ],
  mock: [
    {
      label: '模拟模式',
      options: [
        { value: 'mock', label: '模拟AI回复' }
      ]
    }
  ]
}

// 计算属性
const configStatusType = computed(() => {
  return aiStore.isConfigured ? 'success' : 'warning'
})

const configStatusText = computed(() => {
  return aiStore.isConfigured ? '已配置' : '未配置'
})

const canTest = computed(() => {
  return configForm.provider === 'mock' || 
         (configForm.apiKey && configForm.endpoint)
})

const isConfigured = computed(() => {
  return aiStore.isConfigured
})

// 方法
const testConnection = async () => {
  isTesting.value = true
  testResult.value = null

  try {
    if (configForm.provider === 'mock') {
      // 模拟模式测试
      await new Promise(resolve => setTimeout(resolve, 1000))
      testResult.value = {
        title: '连接成功',
        type: 'success',
        message: '模拟模式工作正常，AI助手可以使用'
      }
    } else {
      // 真实API测试
      aiStore.configureAI({
        apiKey: configForm.apiKey,
        endpoint: configForm.endpoint,
        provider: configForm.provider,
        model: configForm.model
      })

      const response = await aiStore.sendMessage('你好，这是一个连接测试。')
      testResult.value = {
        title: '连接成功',
        type: 'success',
        message: 'API连接正常，AI服务可以使用'
      }
    }
  } catch (error: any) {
    testResult.value = {
      title: '连接失败',
      type: 'error',
      message: error.message || '无法连接到AI服务，请检查配置'
    }
  } finally {
    isTesting.value = false
  }
}

const testAIResponse = async () => {
  try {
    const response = await aiStore.sendMessage('请介绍一下你自己，以及你能提供什么帮助？')
    ElMessage.success('AI回复测试成功！')
  } catch (error: any) {
    ElMessage.error('AI回复测试失败：' + error.message)
  }
}

const saveConfig = async () => {
  isSaving.value = true
  
  try {
    if (configForm.provider === 'mock') {
      // 模拟模式不需要真实API密钥
      aiStore.configureAI({
        apiKey: 'mock-key',
        endpoint: 'mock-endpoint',
        provider: 'mock',
        model: 'mock'
      })
    } else {
      // 验证必填字段
      if (!configForm.apiKey) {
        throw new Error('请输入API密钥')
      }
      if (!configForm.endpoint) {
        throw new Error('请输入API地址')
      }

      // 配置AI
      aiStore.configureAI({
        apiKey: configForm.apiKey,
        endpoint: configForm.endpoint,
        provider: configForm.provider,
        model: configForm.model
      })
    }

    // 更新其他配置
    aiStore.aiConfig.maxTokens = configForm.maxTokens
    aiStore.aiConfig.temperature = configForm.temperature
    aiStore.aiConfig.language = configForm.language
    aiStore.aiConfig.model = configForm.model

    // 保存到本地存储
    const configToSave = {
      provider: configForm.provider,
      model: configForm.model,
      endpoint: configForm.endpoint,
      maxTokens: configForm.maxTokens,
      temperature: configForm.temperature,
      language: configForm.language,
      enableRecommendations: configForm.enableRecommendations,
      enableSafetyCheck: configForm.enableSafetyCheck,
      enableVoiceInput: configForm.enableVoiceInput
    }
    
    localStorage.setItem('ai-config', JSON.stringify(configToSave))

    ElMessage.success('配置保存成功！')
  } catch (error: any) {
    ElMessage.error('配置保存失败：' + error.message)
  } finally {
    isSaving.value = false
  }
}

const resetConfig = () => {
  configForm.provider = 'openai'
  configForm.model = 'gpt-3.5-turbo'
  configForm.apiKey = ''
  configForm.endpoint = 'https://api.openai.com/v1/chat/completions'
  configForm.maxTokens = 1000
  configForm.temperature = 0.7
  configForm.language = 'zh-CN'
  configForm.enableRecommendations = true
  configForm.enableSafetyCheck = true
  configForm.enableVoiceInput = true
  
  testResult.value = null
  
  // 清除本地存储
  localStorage.removeItem('ai-config')
  
  ElMessage.info('配置已重置')
}

// 加载保存的配置
const loadSavedConfig = () => {
  try {
    const saved = localStorage.getItem('ai-config')
    if (saved) {
      const savedConfig = JSON.parse(saved)
      Object.assign(configForm, savedConfig)
    }
  } catch (error) {
    console.error('加载保存的配置失败:', error)
  }
}

// 生命周期
onMounted(() => {
  loadSavedConfig()
})
</script>

<style scoped>
.ai-config-panel {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.config-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.config-form {
  max-width: 600px;
}

.input-tip {
  margin-top: 8px;
}

.slider-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.help-card {
  margin-top: 20px;
}

.help-content {
  padding: 16px 0;
}

.help-content h4 {
  color: #303133;
  margin: 16px 0 8px 0;
}

.help-content ol, .help-content ul {
  margin: 8px 0;
  padding-left: 20px;
}

.help-content li {
  margin-bottom: 6px;
  line-height: 1.6;
}

.help-content a {
  color: #409eff;
  text-decoration: none;
}

.help-content a:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .ai-config-panel {
    padding: 10px;
  }
  
  .config-form {
    max-width: 100%;
  }
}
</style>