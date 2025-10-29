<template>
  <div id="app">
    <LoadingScreen v-if="showLoading" />
    <div v-show="!showLoading">
      <router-view />
      <FloatingAIAssistant />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRouter, useRoute } from 'vue-router'
import FloatingAIAssistant from '@/components/FloatingAIAssistant.vue'
import LoadingScreen from '@/components/LoadingScreen.vue'

const showLoading = ref(true)

// 应用根组件
const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

onMounted(async () => {
  // 初始化用户状态
  console.log('App.vue: 初始化用户状态...')
  const initSuccess = await userStore.initUser()
  console.log('App.vue: 用户状态初始化结果:', initSuccess)
  
  // 延迟隐藏加载屏幕，确保加载动画完整播放
  setTimeout(() => {
    showLoading.value = false
  }, 2000)
  
  // 如果当前页面需要认证且用户未登录，跳转到登录页
  if (route.meta.requiresAuth && !userStore.isLoggedIn) {
    console.log('App.vue: 当前页面需要认证，用户未登录，跳转到登录页')
    router.push('/login')
  }
})

// 监听路由变化，确保认证状态
watch(route, async (newRoute) => {
  if (newRoute.meta.requiresAuth && !userStore.isLoggedIn) {
    console.log('App.vue: 路由变化，页面需要认证，用户未登录，跳转到登录页')
    router.push('/login')
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: 'Inter', 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
  font-size: 16px; /* 增大全局字体大小 */
  line-height: 1.6;
}

body {
  background-color: #f5f7fa;
}
</style>