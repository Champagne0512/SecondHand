import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

// 导入路由配置
import routes from './router/index.js'

// 导入store
import { usePoemStore } from './stores/poemStore.js'

// 创建Pinia实例
const pinia = createPinia()

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 创建Vue应用
const app = createApp(App)

// 使用插件
app.use(pinia)
app.use(router)

// 挂载应用
app.mount('#app')

// 初始化认证状态监听
const poemStore = usePoemStore()
poemStore.initAuthListener()