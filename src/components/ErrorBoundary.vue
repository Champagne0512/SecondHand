<template>
  <div class="error-boundary">
    <slot v-if="!hasError"></slot>
    <div v-else class="error-fallback">
      <div class="error-content">
        <el-icon class="error-icon"><Warning /></el-icon>
        <h3>页面加载出错</h3>
        <p>{{ errorMessage }}</p>
        <el-button type="primary" @click="resetError">
          重新加载
        </el-button>
        <el-button @click="goHome">
          返回首页
        </el-button>
      </div>
      
      <div class="error-details" v-if="showDetails">
        <el-divider />
        <h4>错误详情</h4>
        <pre>{{ errorDetails }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Warning } from '@element-plus/icons-vue'

const router = useRouter()

const hasError = ref(false)
const error = ref<Error | null>(null)
const errorInfo = ref<string>('')
const showDetails = ref(false)

const errorMessage = computed(() => {
  if (error.value) {
    return error.value.message || '发生未知错误'
  }
  return '页面加载时发生错误'
})

const errorDetails = computed(() => {
  if (error.value) {
    return `${error.value.name}: ${error.value.message}\n\n${error.value.stack || ''}\n\n组件信息: ${errorInfo.value}`
  }
  return '无详细错误信息'
})

const resetError = () => {
  hasError.value = false
  error.value = null
  errorInfo.value = ''
  // 重新加载当前路由
  router.go(0)
}

const goHome = () => {
  router.push('/')
}

// 捕获子组件错误
onErrorCaptured((err, instance, info) => {
  console.error('🚨 ErrorBoundary捕获到错误:', err)
  console.error('错误信息:', info)
  console.error('错误实例:', instance)
  
  hasError.value = true
  error.value = err
  errorInfo.value = info
  
  // 显示错误消息
  ElMessage.error({
    message: `页面加载失败: ${err.message}`,
    duration: 5000,
    showClose: true
  })
  
  // 阻止错误继续向上传播
  return false
})
</script>

<style scoped>
.error-boundary {
  width: 100%;
  height: 100%;
}

.error-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 40px 20px;
  text-align: center;
}

.error-content {
  max-width: 500px;
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.error-icon {
  font-size: 48px;
  color: #f56c6c;
  margin-bottom: 20px;
}

.error-content h3 {
  color: #303133;
  margin: 0 0 16px 0;
  font-size: 24px;
}

.error-content p {
  color: #606266;
  margin: 0 0 24px 0;
  font-size: 16px;
  line-height: 1.6;
}

.error-details {
  margin-top: 30px;
  text-align: left;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
}

.error-details h4 {
  color: #303133;
  margin: 0 0 12px 0;
  font-size: 16px;
}

.error-details pre {
  background: #303133;
  color: #67c23a;
  padding: 16px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.5;
  overflow-x: auto;
  margin: 0;
}
</style>