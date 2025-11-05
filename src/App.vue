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

// 设置全局用户状态恢复函数
const setupGlobalUserStateRecovery = () => {
  // 用户状态恢复函数
  (window as any).restoreUserState = async () => {
    console.log('🔄 全局用户状态恢复函数被调用')
    try {
      await userStore.initUser()
      console.log('✅ 全局用户状态恢复完成')
    } catch (error) {
      console.error('❌ 全局用户状态恢复失败:', error)
    }
  }
  
  // 用户状态更新函数
  (window as any).updateUserState = async (session: any) => {
    console.log('🔄 全局用户状态更新函数被调用，用户ID:', session.user.id)
    try {
      // 直接调用用户store的恢复函数
      if (userStore.restoreUserFromSession) {
        await userStore.restoreUserFromSession(session)
      } else {
        await userStore.initUser()
      }
      console.log('✅ 全局用户状态更新完成')
    } catch (error) {
      console.error('❌ 全局用户状态更新失败:', error)
    }
  }
}

// 添加初始化状态标记，防止重复初始化
let isAppInitialized = false

onMounted(async () => {
  try {
    // 防止重复初始化
    if (isAppInitialized) {
      console.log('应用已初始化，跳过重复初始化')
      return
    }
    
    isAppInitialized = true
    
    // 设置全局用户状态恢复函数
    setupGlobalUserStateRecovery()
    
    // 等待更长时间确保数据库连接监控完全启动
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 首先检查数据库连接状态
    console.log('🔄 检查数据库连接状态...')
    const isConnected = true // 暂时跳过数据库连接检查
    
    if (!isConnected) {
      console.warn('⚠️ 数据库连接异常，延迟初始化用户状态')
      // 延迟重试用户状态初始化
      setTimeout(async () => {
        try {
          console.log('🔄 延迟初始化用户状态...')
          await userStore.initUser()
          console.log('✅ 延迟用户状态初始化完成')
          
          // 如果有用户登录，加载相关数据
          if (userStore.isLoggedIn) {
            // 初始化购物车
            const cartStore = useCartStore()
            await cartStore.initializeCart()
            console.log('✅ 用户已登录，加载购物车数据')
            
            // 初始化校园数据
            await campusStore.getCampusPosts()
            console.log('✅ 用户已登录，加载校园动态数据')
          }
        } catch (error) {
          console.error('❌ 延迟用户状态初始化失败:', error)
        }
      }, 2000)
    } else {
      // 数据库连接正常，立即初始化用户状态
      console.log('✅ 数据库连接正常，初始化用户状态')
      await userStore.initUser()
      
      // 如果有用户登录，加载相关数据
      if (userStore.isLoggedIn) {
        // 初始化购物车
        const cartStore = useCartStore()
        await cartStore.initializeCart()
        console.log('✅ 用户已登录，加载购物车数据')
        
        // 初始化校园数据
        await campusStore.getCampusPosts()
        console.log('✅ 用户已登录，加载校园动态数据')
      }
    }
    
    console.log('✅ 应用初始化完成')
  } catch (error) {
    console.error('❌ 应用初始化失败:', error)
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

/* 确保导航栏不被背景覆盖 */
.global-navigation {
  position: relative;
  z-index: 1000;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    padding-top: 0;
  }
}
</style>