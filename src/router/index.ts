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
    path: '/products/edit/:id',
    name: 'EditProduct',
    component: () => import('@/views/products/EditProductView.vue'),
    meta: { title: '编辑商品', requiresAuth: true }
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
    path: '/cart',
    name: 'Cart',
    component: () => import('@/views/user/CartView.vue'),
    meta: { title: '我的购物车', requiresAuth: true }
  },
  {
    path: '/campus',
    name: 'Campus',
    component: () => import('@/views/campus/CampusView.vue'),
    meta: { title: '校园生活 - 校园二手交易平台' }
  },
  {
    path: '/campus/posts',
    name: 'CampusPosts',
    component: () => import('@/views/campus/CampusPostsView.vue'),
    meta: { title: '校园动态 - 校园二手交易平台' }
  },
  {
    path: '/campus/posts/edit/:id',
    name: 'EditCampusPost',
    component: () => import('@/views/campus/EditCampusPostView.vue'),
    meta: { title: '编辑动态 - 校园二手交易平台', requiresAuth: true }
  },
  {
    path: '/campus/events',
    name: 'CampusEvents',
    component: () => import('@/views/campus/CampusEventsView.vue'),
    meta: { title: '校园活动 - 校园二手交易平台' }
  },
  {
    path: '/campus/lost-found',
    name: 'LostFound',
    component: () => import('@/views/campus/LostFoundView.vue'),
    meta: { title: '失物招领 - 校园二手交易平台' }
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: () => import('@/views/analytics/AnalyticsView.vue'),
    meta: { title: '数据分析 - 校园二手交易平台' }
  },
  {
    path: '/ai-assistant',
    name: 'AIAssistant',
    component: () => import('@/views/ai/AIAssistantSimpleView.vue'),
    meta: { title: 'DeepSeek AI智能助手 - 校园二手交易平台' }
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('@/views/admin/AdminLogin.vue'),
    meta: { 
      title: '管理员登录 - 校园二手交易平台'
    }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/admin/AdminDashboard.vue'),
    meta: { 
      title: '管理员后台 - 校园二手交易平台',
      requiresAuth: true,
      requiresAdmin: true
    }
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
        console.log('路由守卫：用户未登录，跳转到登录页')
        next('/login')
        return
      }
      
      // 用户已有会话，允许访问
      console.log('路由守卫：用户已登录，允许访问', to.path)
      
      // 检查是否需要管理员权限
      if (to.meta.requiresAdmin) {
        try {
          // 导入管理员API
          const { AdminAPI } = await import('@/api/admin')
          const hasAdminPermission = await AdminAPI.checkAdminPermission()
          
          if (!hasAdminPermission) {
            // 没有管理员权限，跳转到首页并显示提示
            console.log('路由守卫：用户没有管理员权限')
            next({
              path: '/',
              query: { 
                redirect: to.fullPath,
                message: '您没有访问管理员后台的权限'
              }
            })
            return
          }
          
          console.log('路由守卫：用户有管理员权限，允许访问管理员后台')
          
        } catch (error) {
          console.error('验证管理员权限失败:', error)
          next({
            path: '/',
            query: { 
              redirect: to.fullPath,
              message: '权限验证失败'
            }
          })
          return
        }
      }
      
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