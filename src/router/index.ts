import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { supabase } from '@/lib/supabase'

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: '首页 - 校园二手交易平台' }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { title: '注册' }
  },
  {
    path: '/products',
    name: 'Products',
    component: () => import('@/views/products/ProductListView.vue'),
    meta: { title: '商品列表' }
  },
  {
    path: '/products/:id',
    name: 'ProductDetail',
    component: () => import('@/views/products/ProductDetailView.vue'),
    meta: { title: '商品详情' }
  },
  {
    path: '/products/publish',
    name: 'PublishProduct',
    component: () => import('@/views/products/PublishProductView.vue'),
    meta: { title: '发布商品', requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/user/ProfileView.vue'),
    meta: { title: '个人中心', requiresAuth: true }
  },
  {
    path: '/messages',
    name: 'Messages',
    component: () => import('@/views/messages/MessageListView.vue'),
    meta: { title: '消息中心', requiresAuth: true }
  },
  {
    path: '/favorites',
    name: 'Favorites',
    component: () => import('@/views/user/FavoritesView.vue'),
    meta: { title: '我的收藏', requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: '页面未找到' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫 - 权限验证
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title as string
  }

  // 检查是否需要登录
  if (to.meta.requiresAuth) {
    try {
      // 使用Supabase检查当前会话
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // 没有会话，跳转到登录页
        next('/login')
        return
      }
      
      // 用户已有会话，允许访问 - 用户状态初始化由App.vue处理
      // 避免在这里使用useUserStore防止循环依赖
    } catch (error) {
      console.error('验证登录状态失败:', error)
      // 验证失败，也跳转到登录页
      next('/login')
      return
    }
  }

  next()
})

export default router