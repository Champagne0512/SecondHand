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

        <!-- 主导航菜单 -->
        <nav class="main-menu">
          <el-menu 
            :default-active="activeMenu" 
            mode="horizontal" 
            class="nav-menu"
            @select="handleMenuSelect"
          >
            <el-menu-item index="/">
              <el-icon><House /></el-icon>
              首页
            </el-menu-item>
            <el-menu-item index="/products">
              <el-icon><Goods /></el-icon>
              商品市场
            </el-menu-item>
            <el-sub-menu index="user">
              <template #title>
                <el-icon><User /></el-icon>
                个人中心
              </template>
              <el-menu-item index="/profile">个人信息</el-menu-item>
              <el-menu-item index="/messages">消息中心</el-menu-item>
              <el-menu-item index="/favorites">我的收藏</el-menu-item>
            </el-sub-menu>
          </el-menu>
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
            <template v-if="userStore.isLoggedIn">
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
                  <el-avatar :size="32" :src="userStore.userInfo?.avatar" />
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
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { 
  ShoppingBag, House, Goods, Plus, User, Search, 
  ChatDotRound, SwitchButton 
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const searchKeyword = ref('')

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

// 菜单选择处理
const handleMenuSelect = (index: string) => {
  router.push(index)
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
const handleUserCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'messages':
      router.push('/messages')
      break
    case 'logout':
      userStore.logout()
      router.push('/')
      break
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
  z-index: 1000;
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
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

/* Logo区域 */
.logo-section {
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.logo-section:hover {
  transform: scale(1.05);
}

.logo-icon {
  background: linear-gradient(45deg, #409eff, #67c23a);
  padding: 8px;
  border-radius: 8px;
  margin-right: 8px;
  color: white;
  font-size: 20px;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 主导航菜单 */
.main-menu {
  flex: 1;
  display: flex;
  justify-content: center;
}

.nav-menu {
  border: none;
  background: transparent;
}

.nav-menu .el-menu-item,
.nav-menu .el-sub-menu__title {
  height: 64px;
  line-height: 64px;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
  font-weight: 500;
  color: #606266;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.nav-menu .el-menu-item:hover,
.nav-menu .el-sub-menu__title:hover {
  background: rgba(64, 158, 255, 0.1);
  border-bottom-color: #409eff;
  color: #409eff;
}

.nav-menu .el-menu-item.is-active,
.nav-menu .el-sub-menu.is-active .el-sub-menu__title {
  background: rgba(64, 158, 255, 0.1);
  border-bottom-color: #409eff;
  color: #409eff;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
    height: auto;
    padding: 12px 20px;
    gap: 12px;
  }

  .main-menu {
    order: 2;
    width: 100%;
  }

  .nav-menu {
    width: 100%;
  }

  .nav-menu .el-menu-item,
  .nav-menu .el-sub-menu__title {
    height: 48px;
    line-height: 48px;
    font-size: 14px;
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
}
</style>