<template>
  <!-- 全局导航组件 -->
  <div class="global-navigation">
    <!-- 主导航栏 -->
    <header class="main-navbar">
      <div class="nav-container">
        <!-- Logo区域 -->
        <div class="logo-section" @click="$router.push('/')">
          <div class="logo-icon">
            <el-icon><ShoppingBag /></el-icon>
          </div>
          <span class="logo-text">校园二手交易</span>
        </div>

        <!-- 主导航菜单 - 重新设计为直观的图标导航 -->
        <nav class="main-menu">
          <div class="nav-menu-grid">
            <div 
              class="nav-item" 
              :class="{ active: activeMenu === '/' }"
              @click="$router.push('/')"
            >
              <div class="nav-icon">
                <el-icon><House /></el-icon>
              </div>
              <span class="nav-label">首页</span>
            </div>
            
            <div 
              class="nav-item" 
              :class="{ active: activeMenu === '/products' }"
              @click="$router.push('/products')"
            >
              <div class="nav-icon">
                <el-icon><Goods /></el-icon>
              </div>
              <span class="nav-label">商品市场</span>
            </div>
            
            <div 
              class="nav-item" 
              :class="{ active: activeMenu === '/campus' }"
              @click="$router.push('/campus')"
            >
              <div class="nav-icon">
                <el-icon><School /></el-icon>
              </div>
              <span class="nav-label">校园生活</span>
            </div>
            
            <div 
              class="nav-item" 
              :class="{ active: activeMenu === '/transactions' }"
              @click="$router.push('/transactions')"
            >
              <div class="nav-icon">
                <el-icon><Document /></el-icon>
              </div>
              <span class="nav-label">我的交易</span>
            </div>
            
            <div 
              class="nav-item" 
              :class="{ active: activeMenu === '/ai-assistant' }"
              @click="$router.push('/ai-assistant')"
            >
              <div class="nav-icon">
                <el-icon><Cpu /></el-icon>
              </div>
              <span class="nav-label">AI助手</span>
            </div>
            
            <!-- 个人中心直接显示主要功能入口 -->
            <div 
              class="nav-item" 
              :class="{ active: activeMenu === 'user' }"
              @click="handleUserNavigation"
            >
              <div class="nav-icon">
                <el-icon><User /></el-icon>
              </div>
              <span class="nav-label">个人中心</span>
            </div>
          </div>
        </nav>

        <!-- 搜索和用户操作区域 -->
        <div class="nav-actions">
          <!-- 搜索框 -->
          <div class="search-box">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索商品..."
              size="small"
              @keyup.enter="handleSearch"
              class="nav-search"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>

          <!-- 用户操作 -->
          <div class="user-actions">
            <!-- 用户状态加载守卫 -->
            <template v-if="userStore.isLoading">
              <div class="loading-state">
                <el-icon class="loading-icon"><Loading /></el-icon>
                <span class="loading-text">加载中...</span>
              </div>
            </template>
            <template v-else-if="userStore.isLoggedIn">
              <!-- 购物车入口 -->
              <div class="cart-icon-container" @click="$router.push('/cart')">
                <el-badge :value="cartItemCount" :max="99" class="cart-badge">
                  <el-icon class="cart-icon">
                    <ShoppingCart />
                  </el-icon>
                </el-badge>
                <span class="cart-label">购物车</span>
              </div>
              
              <el-button 
                type="primary" 
                size="small" 
                class="publish-btn"
                @click="$router.push('/products/publish')"
              >
                <el-icon><Plus /></el-icon>
                发布商品
              </el-button>
              <el-dropdown @command="handleUserCommand">
                <span class="user-dropdown">
                  <el-avatar :size="32" :src="userStore.userInfo?.avatar" shape="circle" />
                  <span class="username">{{ userStore.userInfo?.username }}</span>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="profile">
                      <el-icon><User /></el-icon>
                      个人中心
                    </el-dropdown-item>
                    <el-dropdown-item command="messages">
                      <el-icon><ChatDotRound /></el-icon>
                      消息中心
                    </el-dropdown-item>
                    <el-dropdown-item 
                      v-if="userStore.isAdmin" 
                      command="admin"
                      divided
                    >
                      <el-icon><Setting /></el-icon>
                      管理员面板
                    </el-dropdown-item>
                    <el-dropdown-item divided command="logout">
                      <el-icon><SwitchButton /></el-icon>
                      退出登录
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
            <template v-else>
              <el-button 
                type="primary" 
                size="small" 
                @click="$router.push('/login')"
                class="login-btn"
              >
                <el-icon><User /></el-icon>
                登录/注册
              </el-button>
            </template>
          </div>
        </div>
      </div>
    </header>

    <!-- 面包屑导航 -->
    <nav class="breadcrumb-nav" v-if="showBreadcrumb">
      <div class="breadcrumb-container">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item 
            v-for="(item, index) in breadcrumbItems" 
            :key="index"
            :to="item.path ? { path: item.path } : undefined"
          >
            {{ item.title }}
          </el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'
import { ElMessage } from 'element-plus'
import { 
  ShoppingBag, House, Goods, Plus, User, Search, 
  ChatDotRound, SwitchButton, School, Cpu, Setting,
  ShoppingCart, Loading
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()

const searchKeyword = ref('')

// 使用计算属性监听用户状态变化
const userInfo = computed(() => userStore.userInfo)
const isLoggedIn = computed(() => userStore.isLoggedIn)
const isLoading = computed(() => userStore.isLoading)

// 监听用户状态变化，确保组件能及时响应
watch([userInfo, isLoggedIn], () => {
  console.log('🔄 用户状态变化，重新渲染导航栏')
  console.log('🔄 当前用户信息:', userInfo.value)
  console.log('🔄 登录状态:', isLoggedIn.value)
}, { immediate: true })

// 组件挂载时确保用户状态已初始化
onMounted(async () => {
  try {
    console.log('🔄 GlobalNavigation组件挂载，检查用户状态...')
    
    // 如果用户信息为空但localStorage中有用户数据，尝试重新初始化
    if (!userStore.userInfo) {
      console.log('🔄 用户信息为空，尝试从localStorage恢复状态...')
      const savedUser = localStorage.getItem('campus-marketplace-user')
      if (savedUser) {
        console.log('🔄 检测到localStorage中的用户数据，尝试恢复...')
        await userStore.initUser()
      }
    }
    
    console.log('✅ GlobalNavigation用户状态检查完成')
  } catch (error) {
    console.error('❌ GlobalNavigation用户状态检查失败:', error)
  }
})

// 计算购物车商品数量
const cartItemCount = computed(() => {
  if (!userStore.isLoggedIn) return 0
  return cartStore.cartItems.reduce((total, item) => total + item.quantity, 0)
})

// 计算当前激活的菜单项
const activeMenu = computed(() => {
  const path = route.path
  if (path === '/') return '/'
  if (path.startsWith('/products')) return '/products'
  if (path.startsWith('/profile') || path.startsWith('/messages')) return 'user'
  return path
})

// 计算面包屑显示状态
const showBreadcrumb = computed(() => {
  return route.path !== '/'
})

  // 计算面包屑项
  const breadcrumbItems = computed(() => {
    const items: Array<{ title: string; path?: string }> = []
    const path = route.path
    const meta = route.meta as any

    if (path.startsWith('/products')) {
      if (path === '/products') {
        items.push({ title: '商品市场' })
      } else if (path === '/products/publish') {
        items.push({ title: '商品市场', path: '/products' })
        items.push({ title: '发布商品' })
      } else if (path.includes('/products/')) {
        items.push({ title: '商品市场', path: '/products' })
        items.push({ title: '商品详情' })
      }
    } else if (path.startsWith('/campus')) {
      if (path === '/campus') {
        items.push({ title: '校园生活' })
      } else if (path === '/campus/posts') {
        items.push({ title: '校园生活', path: '/campus' })
        items.push({ title: '校园动态' })
      } else if (path === '/campus/events') {
        items.push({ title: '校园生活', path: '/campus' })
        items.push({ title: '校园活动' })
      } else if (path === '/campus/lost-found') {
        items.push({ title: '校园生活', path: '/campus' })
        items.push({ title: '失物招领' })
      }
    } else if (path.startsWith('/ai-assistant')) {
      items.push({ title: 'AI助手' })
    } else if (path.startsWith('/analytics')) {
      items.push({ title: '数据分析' })
    } else if (path.startsWith('/profile')) {
      items.push({ title: '个人中心' })
    } else if (path.startsWith('/messages')) {
      items.push({ title: '消息中心' })
    } else if (path.startsWith('/favorites')) {
      items.push({ title: '个人中心', path: '/profile' })
      items.push({ title: '我的收藏' })
    }

    // 添加页面标题
    if (meta?.title && path !== '/') {
      const lastItem = items[items.length - 1]
      if (!lastItem || lastItem.title !== meta.title) {
        items.push({ title: meta.title })
      }
    }

    return items
  })

// 用户导航处理
const handleUserNavigation = async () => {
  try {
    // 确保用户状态已初始化
    if (!userStore.userInfo) {
      console.log('用户状态未初始化，尝试初始化...')
      const initialized = await userStore.initUser()
      if (!initialized) {
        console.log('用户状态初始化失败，跳转到登录页')
        router.push('/login')
        return
      }
    }
    
    // 检查用户是否已登录
    if (userStore.isLoggedIn && userStore.userInfo) {
      console.log('用户已登录，跳转到个人中心')
      router.push('/profile')
    } else {
      console.log('用户未登录，跳转到登录页面')
      router.push('/login')
    }
  } catch (error) {
    console.error('用户导航处理失败:', error)
    // 出错时默认跳转到登录页
    router.push('/login')
  }
}

// 搜索处理
const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push({
      path: '/products',
      query: { keyword: searchKeyword.value.trim() }
    })
  }
}

// 用户操作处理
const handleUserCommand = async (command: string) => {
  try {
    // 确保用户状态已初始化
    if (!userStore.userInfo) {
      console.log('用户状态未初始化，尝试初始化...')
      const initialized = await userStore.initUser()
      if (!initialized) {
        ElMessage.warning('请先登录')
        router.push('/login')
        return
      }
    }
    
    switch (command) {
      case 'profile':
        router.push('/profile')
        break
      case 'messages':
        router.push('/messages')
        break
      case 'admin':
        // 检查管理员权限
        if (userStore.isAdmin) {
          router.push('/admin')
        } else {
          ElMessage.warning('您没有管理员权限')
        }
        break
      case 'logout':
        await userStore.logout()
        router.push('/')
        break
    }
  } catch (error) {
    console.error('用户操作处理失败:', error)
    ElMessage.error('操作失败，请重试')
  }
}

// 监听路由变化
watch(() => route.path, () => {
  // 重置搜索关键词
  searchKeyword.value = ''
})
</script>

<style scoped>
.global-navigation {
  position: sticky;
  top: 0;
  z-index: 9999;
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

/* 主导航栏样式 */
.main-navbar {
  background: white;
  border-bottom: 1px solid #e8e8e8;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
  position: relative;
}

/* Logo区域 - 重新设计 */
.logo-section {
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
}

.logo-section:hover {
  transform: scale(1.08);
}



.logo-icon {
  background: linear-gradient(135deg, #667eea, #764ba2, #ff6b6b);
  padding: 10px;
  border-radius: 12px;
  margin-right: 12px;
  color: white;
  font-size: 24px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  transition: all 0.4s ease;
}

.logo-section:hover .logo-icon {
  transform: rotate(15deg);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.logo-text {
  font-size: 28px; /* 增大导航栏Logo字体 */
  font-weight: 900;
  background: linear-gradient(135deg, #667eea, #764ba2, #ff6b6b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  letter-spacing: -0.03em;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  white-space: nowrap; /* 防止文字换行 */
  min-width: 180px; /* 确保有足够的最小宽度 */
}

/* 主导航菜单 - 优化为更协调的设计 */
.main-menu {
  flex: 1;
  display: flex;
  justify-content: center;
}

.nav-menu-grid {
  display: flex;
  align-items: center;
  gap: 2px;
  background: transparent;
  border-radius: 12px;
  padding: 4px;
  position: relative;
}

.nav-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 85px;
  position: relative;
  background: transparent;
  border: none;
  gap: 6px;
}

.nav-item:hover {
  background: rgba(102, 126, 234, 0.06);
  transform: translateY(-1px);
}

.nav-item.active {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background: #667eea;
  border-radius: 1px;
}

.nav-icon {
  font-size: 18px;
  color: #606266;
  transition: all 0.3s ease;
}

.nav-item:hover .nav-icon,
.nav-item.active .nav-icon {
  color: #667eea;
  transform: scale(1.05);
}

.nav-label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  transition: all 0.3s ease;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  letter-spacing: 0.01em;
  white-space: nowrap;
}

.nav-item:hover .nav-label,
.nav-item.active .nav-label {
  color: #667eea;
  font-weight: 600;
}

/* 导航操作区域 */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-box {
  width: 200px;
}

.nav-search {
  border-radius: 20px;
}

.nav-search :deep(.el-input__wrapper) {
  border-radius: 20px;
  border: 1px solid #dcdfe6;
}

.nav-search :deep(.el-input__wrapper:hover) {
  border-color: #409eff;
}

.nav-search :deep(.el-input__wrapper.is-focus) {
  border-color: #409eff;
  box-shadow: 0 0 0 1px #409eff;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 购物车图标样式 */
.cart-icon-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 10px 14px;
  border-radius: 12px;
  transition: all 0.3s ease;
  min-width: 65px;
  height: 60px;
  justify-content: center;
}

.cart-icon-container:hover {
  background: rgba(102, 126, 234, 0.1);
  transform: translateY(-1px);
}

.cart-badge {
  position: relative;
}

.cart-icon {
  font-size: 26px;
  color: #606266;
  transition: all 0.3s ease;
  margin-bottom: 2px;
}

.cart-icon-container:hover .cart-icon {
  color: #667eea;
  transform: scale(1.1);
}

.cart-label {
  font-size: 12px;
  color: #606266;
  margin-top: 2px;
  font-weight: 500;
  transition: all 0.3s ease;
  line-height: 1.2;
}

.cart-icon-container:hover .cart-label {
  color: #667eea;
}

/* 购物车图标样式 */
.cart-icon-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 10px 14px;
  border-radius: 12px;
  transition: all 0.3s ease;
  min-width: 65px;
  height: 60px;
  justify-content: center;
}

.cart-icon-container:hover {
  background: rgba(102, 126, 234, 0.1);
  transform: translateY(-1px);
}

.cart-badge {
  position: relative;
}

.cart-icon {
  font-size: 26px;
  color: #606266;
  transition: all 0.3s ease;
  margin-bottom: 2px;
}

.cart-icon-container:hover .cart-icon {
  color: #667eea;
  transform: scale(1.1);
}

.cart-label {
  font-size: 12px;
  color: #606266;
  margin-top: 2px;
  font-weight: 500;
  transition: all 0.3s ease;
  line-height: 1.2;
}

.cart-icon-container:hover .cart-label {
  color: #667eea;
}

.publish-btn {
  background: linear-gradient(45deg, #67c23a, #85ce61);
  border: none;
  border-radius: 20px;
  color: white;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.publish-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
}

.login-btn {
  background: linear-gradient(45deg, #409eff, #66b1ff);
  border: none;
  border-radius: 20px;
  color: white;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 20px;
  transition: background 0.3s ease;
}

.user-dropdown:hover {
  background: rgba(0, 0, 0, 0.05);
}

.username {
  font-weight: 500;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
  min-width: 0;
}

/* 加载状态样式 */
.loading-state {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 14px;
  font-weight: 500;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 面包屑导航 */
.breadcrumb-nav {
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  padding: 12px 0;
}

.breadcrumb-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.breadcrumb-nav :deep(.el-breadcrumb) {
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.breadcrumb-nav :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #409eff;
  font-weight: 500;
}

/* 响应式设计 - 优化为更协调的布局 */
@media (max-width: 1200px) {
  .nav-container {
    padding: 0 16px;
  }
  
  .nav-item {
    padding: 10px 16px;
    min-width: 75px;
  }
  
  .nav-icon {
    font-size: 16px;
  }
  
  .nav-label {
    font-size: 11px;
  }
}

@media (max-width: 1024px) {
  .nav-item {
    padding: 10px 14px;
    min-width: 70px;
  }
  
  .logo-text {
    font-size: 24px;
    min-width: 140px;
  }
  
  .logo-icon {
    padding: 8px;
    font-size: 20px;
  }
}

@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
    height: auto;
    padding: 12px 16px;
    gap: 16px;
  }

  .main-menu {
    order: 2;
    width: 100%;
  }

  .nav-menu-grid {
    width: 100%;
    justify-content: space-between;
    gap: 1px;
    padding: 6px;
    background: rgba(248, 249, 250, 0.8);
    border-radius: 10px;
  }

  .nav-item {
    flex: 1;
    min-width: auto;
    padding: 10px 8px;
    flex-direction: row;
    gap: 4px;
  }

  .nav-icon {
    font-size: 16px;
  }

  .nav-label {
    font-size: 12px;
    line-height: 1.2;
  }

  .nav-actions {
    order: 1;
    width: 100%;
    justify-content: space-between;
  }

  .search-box {
    flex: 1;
    max-width: 200px;
  }

  .user-dropdown .username {
    display: none;
  }
  
  .logo-text {
    font-size: 22px;
    min-width: 130px;
  }
  
  .logo-icon {
    padding: 6px;
    font-size: 18px;
  }
  

}

@media (max-width: 480px) {
  .nav-container {
    padding: 10px 12px;
    gap: 14px;
  }
  
  .nav-menu-grid {
    padding: 4px;
  }
  
  .nav-item {
    padding: 8px 6px;
    flex-direction: row;
    gap: 3px;
  }
  
  .nav-icon {
    font-size: 14px;
  }
  
  .nav-label {
    font-size: 11px;
  }
  
  .logo-text {
    font-size: 20px;
    min-width: 120px;
  }
  
  .search-box {
    max-width: 160px;
  }
  
  .publish-btn,
  .login-btn {
    font-size: 12px;
    padding: 6px 12px;
  }
}
</style>