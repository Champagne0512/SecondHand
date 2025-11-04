<template>
  <div id="app">
    <!-- 全局导航 -->
    <GlobalNavigation v-if="showNavigation" />
    
    <!-- 主要内容区域 -->
    <main class="main-content" :class="{ 'no-nav': !showNavigation }">
      <router-view />
    </main>
    
    <!-- 全局浮动AI助手 -->
    <FloatingAIAssistant />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onErrorCaptured } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useCampusStore } from '@/stores/campus'
import { useCartStore } from '@/stores/cart'
import GlobalNavigation from '@/components/GlobalNavigation.vue'
import FloatingAIAssistant from '@/components/FloatingAIAssistant.vue'

const route = useRoute()
const userStore = useUserStore()
const campusStore = useCampusStore()

// 计算是否显示导航栏
const showNavigation = computed(() => {
  // 在登录、注册和管理员登录页面不显示导航栏
  const hideNavRoutes = ['/login', '/register', '/admin/login']
  return !hideNavRoutes.includes(route.path)
})

// 全局错误处理
onErrorCaptured((error, instance, info) => {
  console.error('全局错误捕获:', error, info)
  // 可以在这里添加错误上报逻辑
  return false // 阻止错误继续向上传播
})

onMounted(async () => {
  try {
    // 初始化用户状态
    await userStore.initUser()
    
    // 如果有用户登录，加载相关数据
    if (userStore.isLoggedIn) {
      // 初始化购物车
      const cartStore = useCartStore()
      await cartStore.initializeCart()
      console.log('用户已登录，加载购物车数据')
    }
  } catch (error) {
    console.error('应用初始化失败:', error)
  }
})
</script>

<style scoped>
#app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.main-content {
  min-height: 100vh;
  transition: all 0.3s ease;
}

.main-content.no-nav {
  padding-top: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    padding-top: 0;
  }
}
</style>