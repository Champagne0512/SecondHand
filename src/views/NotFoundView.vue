<template>
  <div class="not-found-view">
    <div class="not-found-container">
      <div class="not-found-content">
        <div class="error-code">404</div>
        <h1 class="error-title">页面未找到</h1>
        <p class="error-description">抱歉，您访问的页面不存在或已被移除</p>
        
        <div class="action-buttons">
          <el-button type="primary" size="large" @click="handleGoHome">
            <el-icon><HomeFilled /></el-icon>
            返回首页
          </el-button>
          <el-button size="large" @click="handleGoBack">
            <el-icon><ArrowLeft /></el-icon>
            返回上一页
          </el-button>
        </div>
        
        <div class="suggestions">
          <h3>您可能想访问：</h3>
          <ul>
            <li><el-link @click="$router.push('/products')">商品列表</el-link></li>
            <li><el-link @click="$router.push('/profile')">个人中心</el-link></li>
            <li><el-link @click="$router.push('/messages')">消息中心</el-link></li>
          </ul>
        </div>
      </div>
      
      <div class="illustration">
        <el-icon class="illustration-icon"><Search /></el-icon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { HomeFilled, ArrowLeft, Search } from '@element-plus/icons-vue'

const router = useRouter()

const handleGoHome = () => {
  router.push('/')
}

const handleGoBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>

<style scoped>
.not-found-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.not-found-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  max-width: 1000px;
  width: 100%;
  align-items: center;
}

.not-found-content {
  color: white;
}

.error-code {
  font-size: 120px;
  font-weight: bold;
  margin-bottom: 20px;
  opacity: 0.9;
}

.error-title {
  font-size: 36px;
  margin-bottom: 16px;
  font-weight: 600;
}

.error-description {
  font-size: 18px;
  margin-bottom: 40px;
  opacity: 0.9;
  line-height: 1.6;
}

.action-buttons {
  display: flex;
  gap: 16px;
  margin-bottom: 40px;
}

.action-buttons .el-button {
  padding: 12px 24px;
  font-size: 16px;
}

.suggestions h3 {
  font-size: 18px;
  margin-bottom: 16px;
  opacity: 0.9;
}

.suggestions ul {
  list-style: none;
  padding: 0;
}

.suggestions li {
  margin-bottom: 8px;
}

.suggestions .el-link {
  color: white;
  font-size: 16px;
}

.suggestions .el-link:hover {
  opacity: 0.8;
}

.illustration {
  display: flex;
  justify-content: center;
  align-items: center;
}

.illustration-icon {
  font-size: 200px;
  color: rgba(255, 255, 255, 0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .not-found-container {
    grid-template-columns: 1fr;
    gap: 40px;
    text-align: center;
  }
  
  .error-code {
    font-size: 80px;
  }
  
  .error-title {
    font-size: 28px;
  }
  
  .error-description {
    font-size: 16px;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .action-buttons .el-button {
    width: 200px;
  }
  
  .illustration-icon {
    font-size: 120px;
  }
}

@media (max-width: 480px) {
  .not-found-container {
    gap: 30px;
  }
  
  .error-code {
    font-size: 60px;
  }
  
  .error-title {
    font-size: 24px;
  }
  
  .action-buttons .el-button {
    width: 100%;
  }
}
</style>