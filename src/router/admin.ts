import { createRouter, createWebHistory } from 'vue-router'
import { AdminAPI } from '@/api/admin'

// 管理员路由配置
const adminRoutes = [
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('@/views/admin/AdminDashboard.vue'),
    meta: {
      title: '管理员后台',
      requiresAdmin: true
    }
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: () => import('@/views/admin/AdminDashboard.vue'),
    meta: {
      title: '用户管理',
      requiresAdmin: true
    }
  },
  {
    path: '/admin/products',
    name: 'AdminProducts',
    component: () => import('@/views/admin/AdminDashboard.vue'),
    meta: {
      title: '商品管理',
      requiresAdmin: true
    }
  },
  {
    path: '/admin/content',
    name: 'AdminContent',
    component: () => import('@/views/admin/AdminDashboard.vue'),
    meta: {
      title: '内容审核',
      requiresAdmin: true
    }
  },
  {
    path: '/admin/reports',
    name: 'AdminReports',
    component: () => import('@/views/admin/AdminDashboard.vue'),
    meta: {
      title: '举报处理',
      requiresAdmin: true
    }
  },
  {
    path: '/admin/settings',
    name: 'AdminSettings',
    component: () => import('@/views/admin/AdminDashboard.vue'),
    meta: {
      title: '系统设置',
      requiresAdmin: true
    }
  }
]

// 创建管理员路由实例
const adminRouter = createRouter({
  history: createWebHistory(),
  routes: adminRoutes
})

// 管理员权限守卫
adminRouter.beforeEach(async (to, from, next) => {
  // 检查路由是否需要管理员权限
  if (to.meta.requiresAdmin) {
    const hasPermission = await AdminAPI.checkAdminPermission()
    
    if (!hasPermission) {
      // 如果没有管理员权限，重定向到首页并显示提示
      next({
        path: '/',
        query: { 
          redirect: to.fullPath,
          message: '您没有访问管理员后台的权限'
        }
      })
      return
    }
  }
  
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 校园二手交易平台`
  }
  
  next()
})

export default adminRouter