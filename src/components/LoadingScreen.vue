<template>
  <div v-if="isLoading" class="loading-screen">
    <!-- 科技感背景 -->
    <div class="loading-background">
      <div class="grid-pattern"></div>
      <div class="glow-effect"></div>
    </div>
    
    <!-- 主要内容 -->
    <div class="loading-content">
      <!-- Logo区域 -->
      <div class="logo-section">
        <div class="logo-container">
          <div class="logo-main">
            <span class="logo-text">Campus</span>
            <span class="logo-highlight">Market</span>
          </div>
          <div class="logo-subtitle">校园二手交易平台</div>
        </div>
      </div>
      
      <!-- 进度条区域 -->
      <div class="progress-section">
        <div class="progress-container">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: progress + '%' }"
            ></div>
          </div>
          <div class="progress-text">
            LOADING - {{ Math.min(progress, 100) }}%
          </div>
        </div>
      </div>
      
      <!-- 加载提示 -->
      <div class="loading-hint">
        <div class="hint-text">正在初始化系统...</div>
        <div class="loading-dots">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isLoading = ref(true)
const progress = ref(0)

// 模拟加载进度
const simulateLoading = () => {
  const interval = setInterval(() => {
    // 随机增加进度，模拟真实加载
    const increment = Math.random() * 15 + 5
    progress.value = Math.min(progress.value + increment, 100)
    
    // 更新提示文本
    updateHintText()
    
    // 加载完成
    if (progress.value >= 100) {
      clearInterval(interval)
      setTimeout(() => {
        isLoading.value = false
      }, 800) // 延迟隐藏，让用户看到100%
    }
  }, 300)
}

// 更新加载提示文本
const updateHintText = () => {
  const hintElement = document.querySelector('.hint-text')
  if (hintElement) {
    if (progress.value < 30) {
      hintElement.textContent = '正在初始化系统...'
    } else if (progress.value < 60) {
      hintElement.textContent = '正在加载资源...'
    } else if (progress.value < 90) {
      hintElement.textContent = '正在准备界面...'
    } else {
      hintElement.textContent = '即将完成...'
    }
  }
}

onMounted(() => {
  simulateLoading()
})

onUnmounted(() => {
  // 清理定时器
  isLoading.value = false
})
</script>

<style scoped>
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.loading-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.grid-pattern {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(30, 144, 255, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(30, 144, 255, 0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: gridMove 20s linear infinite;
}

.glow-effect {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(30, 144, 255, 0.3) 0%, transparent 70%);
  transform: translate(-50%, -50%);
  animation: pulse 3s ease-in-out infinite;
}

.loading-content {
  position: relative;
  z-index: 2;
  text-align: center;
  color: white;
}

.logo-section {
  margin-bottom: 60px;
}

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.logo-main {
  font-size: 4rem;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.logo-text {
  color: #ffffff;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
}

.logo-highlight {
  color: #1e90ff;
  text-shadow: 0 0 30px rgba(30, 144, 255, 0.8);
  animation: glow 2s ease-in-out infinite alternate;
}

.logo-subtitle {
  font-size: 1.2rem;
  color: #b0b0b0;
  letter-spacing: 1px;
}

.progress-section {
  margin-bottom: 40px;
}

.progress-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.progress-bar {
  width: 400px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1e90ff, #00bfff);
  border-radius: 2px;
  transition: width 0.3s ease;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 20px;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
  animation: shimmer 1.5s infinite;
}

.progress-text {
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  color: #1e90ff;
  letter-spacing: 1px;
}

.loading-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.hint-text {
  font-size: 1rem;
  color: #b0b0b0;
  transition: all 0.3s ease;
}

.loading-dots {
  display: flex;
  gap: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  background: #1e90ff;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }
.dot:nth-child(3) { animation-delay: 0s; }

/* 动画定义 */
@keyframes gridMove {
  0% { transform: translate(0, 0); }
  100% { transform: translate(50px, 50px); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.1); }
}

@keyframes glow {
  0% { text-shadow: 0 0 20px rgba(30, 144, 255, 0.5); }
  100% { text-shadow: 0 0 30px rgba(30, 144, 255, 0.8), 0 0 40px rgba(30, 144, 255, 0.6); }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .logo-main {
    font-size: 2.5rem;
  }
  
  .progress-bar {
    width: 300px;
  }
  
  .glow-effect {
    width: 200px;
    height: 200px;
  }
}

@media (max-width: 480px) {
  .logo-main {
    font-size: 2rem;
  }
  
  .progress-bar {
    width: 250px;
  }
}
</style>