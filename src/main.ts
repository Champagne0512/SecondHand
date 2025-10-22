import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'
import { useUserStore } from '@/stores/user'

const app = createApp(App)

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ElementPlus)

// 初始化用户状态
const userStore = useUserStore()

// 确保在挂载前完成初始化
Promise.resolve().then(async () => {
  try {
    await userStore.initUser()
  } catch (error) {
    console.error('用户初始化失败:', error)
  }
  
  app.mount('#app')
})