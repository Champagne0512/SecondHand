<template>
  <div class="home-view">
    <!-- 全局导航组件 -->
    <GlobalNavigation />

    <!-- 现代化主要内容 -->
    <main class="modern-content">
      <!-- 顶部轮播图区域 -->
      <section class="banner-section">
        <div class="container">
          <div class="banner-carousel">
            <div class="carousel-item active">
              <div class="banner-content">
                <h1 class="banner-title">校园二手交易平台</h1>
                <p class="banner-subtitle">让闲置物品找到新主人，开启绿色循环经济</p>
                <div class="banner-actions">
                  <el-button type="primary" size="large" @click="$router.push('/products')">
                    <el-icon><Search /></el-icon> 浏览商品
                  </el-button>
                  <el-button v-if="!userStore.isLoggedIn" size="large" @click="$router.push('/login')">
                    <el-icon><Rocket /></el-icon> 立即登录
                  </el-button>
                </div>
              </div>
              <div class="banner-image">
                <img src="/src/assets/images/logo2.png" alt="校园二手交易平台" />
              </div>
            </div>
          </div>
          <div class="carousel-indicators">
            <span class="indicator active"></span>
            <span class="indicator"></span>
            <span class="indicator"></span>
          </div>
        </div>
      </section>

      <!-- 优化后的三栏主要内容区域 -->
      <section class="main-content-section">
        <div class="container">
          <!-- 新增特色功能展示区 -->
          <div class="feature-section">
            <div class="feature-grid">
              <div class="feature-item">
                <div class="feature-icon">
                  <el-icon size="48"><ShoppingCart /></el-icon>
                </div>
                <h3 class="feature-title">海量商品</h3>
                <p class="feature-desc">覆盖校园各类二手物品，满足不同需求</p>
              </div>
              <div class="feature-item">
                <div class="feature-icon">
                  <el-icon size="48"><Lock /></el-icon>
                </div>
                <h3 class="feature-title">安全保障</h3>
                <p class="feature-desc">实名认证交易，确保交易安全可靠</p>
              </div>
              <div class="feature-item">
                <div class="feature-icon">
                  <el-icon size="48"><Lightning /></el-icon>
                </div>
                <h3 class="feature-title">快速交易</h3>
                <p class="feature-desc">简单发布流程，快速完成交易</p>
              </div>
              <div class="feature-item">
                <div class="feature-icon">
                  <el-icon size="48"><Robot /></el-icon>
                </div>
                <h3 class="feature-title">AI助手</h3>
                <p class="feature-desc">智能推荐，帮你找到心仪商品</p>
              </div>
            </div>
          </div>

          <div class="three-column-layout">
            <!-- 左侧：常用功能入口 -->
            <aside class="left-sidebar">
              <div class="sidebar-card">
                <h3 class="sidebar-title">常用功能</h3>
                <div class="quick-actions">
                  <div 
                    class="quick-action-item" 
                    v-for="action in quickActions" 
                    :key="action.id"
                    @click="handleQuickAction(action)"
                  >
                    <div class="action-icon">
                      <el-icon :size="28">
                        <component :is="action.icon" />
                      </el-icon>
                    </div>
                    <div class="action-info">
                      <h4>{{ action.title }}</h4>
                      <p>{{ action.description }}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 快捷搜索 -->
              <div class="sidebar-card">
                <h3 class="sidebar-title">快速搜索</h3>
                <div class="search-tags">
                  <span 
                    class="search-tag" 
                    v-for="tag in searchTags" 
                    :key="tag"
                    @click="handleSearchTag(tag)"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
            </aside>

            <!-- 中间：动态更新内容 -->
            <main class="main-content">
              <!-- 热门商品展示 -->
              <div class="content-card">
                <div class="card-header">
                  <h3 class="card-title">热门商品</h3>
                  <el-button type="primary" text @click="$router.push('/products')">
                    查看全部 <el-icon><ArrowRight /></el-icon>
                  </el-button>
                </div>
                <div class="products-grid">
                  <div 
                    class="product-item" 
                    v-for="product in hotProducts" 
                    :key="product.id"
                    @click="$router.push(`/products/${product.id}`)"
                  >
                    <div class="product-image">
                      <img :src="product.image" :alt="product.title" />
                      <div class="product-badge">{{ product.condition }}</div>
                    </div>
                    <div class="product-details">
                      <h4 class="product-title">{{ product.title }}</h4>
                      <p class="product-price">¥{{ product.price }}</p>
                      <div class="product-meta">
                        <span class="product-location">{{ product.location }}</span>
                        <span class="product-time">{{ product.time }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 最新动态 -->
              <div class="content-card">
                <div class="card-header">
                  <h3 class="card-title">最新动态</h3>
                </div>
                <div class="news-list">
                  <div class="news-item" v-for="news in latestNews" :key="news.id">
                    <div class="news-avatar">{{ news.avatar }}</div>
                    <div class="news-content">
                      <p class="news-text">{{ news.text }}</p>
                      <span class="news-time">{{ news.time }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </main>

            <!-- 右侧：通知公告 -->
            <aside class="right-sidebar">
              <div class="sidebar-card">
                <h3 class="sidebar-title">通知公告</h3>
                <div class="notifications">
                  <div 
                    class="notification-item" 
                    v-for="notice in notifications" 
                    :key="notice.id"
                  >
                    <div class="notification-icon">
                      <el-icon><Bell /></el-icon>
                    </div>
                    <div class="notification-content">
                      <h4>{{ notice.title }}</h4>
                      <p>{{ notice.content }}</p>
                      <span class="notification-time">{{ notice.time }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 平台统计 -->
              <div class="sidebar-card">
                <h3 class="sidebar-title">平台统计</h3>
                <div class="stats-grid">
                  <div class="stat-item">
                    <div class="stat-value">{{ stats.totalProducts }}</div>
                    <div class="stat-label">商品总数</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">{{ stats.totalUsers }}</div>
                    <div class="stat-label">注册用户</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">{{ stats.todayTransactions }}</div>
                    <div class="stat-label">今日交易</div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <!-- 底部信息区域 -->
      <footer class="footer-section">
        <div class="container">
          <div class="footer-content">
            <div class="footer-info">
              <h3>校园二手交易平台</h3>
              <p>致力于为校园用户提供安全、便捷的二手交易服务</p>
            </div>
            <div class="footer-links">
              <div class="link-group">
                <h4>快速链接</h4>
                <a @click="$router.push('/products')">浏览商品</a>
                <a @click="$router.push('/about')">关于我们</a>
                <a @click="$router.push('/help')">帮助中心</a>
              </div>
              <div class="link-group">
                <h4>联系我们</h4>
                <span>邮箱: support@campus.com</span>
                <span>电话: 400-123-4567</span>
              </div>
            </div>
          </div>
          <div class="footer-bottom">
            <p>&copy; 2024 校园二手交易平台. 保留所有权利.</p>
          </div>
        </div>
      </footer>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useProductStore } from '@/stores/products'
import GlobalNavigation from '@/components/GlobalNavigation.vue'
import { 
  ShoppingBag, Search, Goods, Plus, User, 
  ChatDotRound, Star, ArrowRight, Collection, 
  Document, Setting, Message, Bell
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const productsStore = useProductStore()

const searchKeyword = ref('')

// 热门商品数据
interface HotProduct {
  id: string | number
  title: string
  price: string
  condition: string
  location: string
  time: string
  image: string
}
const hotProducts = ref<HotProduct[]>([])
const isLoading = ref(false)

// 快速功能入口数据
const quickActions = ref([
  {
    id: 1,
    icon: 'Goods',
    title: '浏览商品',
    description: '发现海量二手商品',
    route: '/products'
  },
  {
    id: 2,
    icon: 'Plus',
    title: '发布商品',
    description: '快速发布闲置物品',
    route: '/products/publish'
  },
  {
    id: 3,
    icon: 'Collection',
    title: '我的收藏',
    description: '查看收藏的商品',
    route: '/profile/favorites'
  },
  {
    id: 4,
    icon: 'Message',
    title: '消息中心',
    description: '查看最新消息',
    route: '/messages'
  }
])

// 搜索标签数据
const searchTags = ref([
  '电子产品', '学习资料', '生活用品', '服装鞋帽', 
  '运动器材', '书籍杂志', '其他'
])

// 最新动态数据
const latestNews = ref([
  {
    id: 1,
    avatar: 'User',
    text: '张三 刚刚发布了 MacBook Pro 2021',
    time: '2分钟前'
  },
  {
    id: 2,
    avatar: 'User',
    text: '李四 购买了 考研英语词汇书',
    time: '5分钟前'
  },
  {
    id: 3,
    avatar: 'User',
    text: '王五 发布了 全新运动鞋',
    time: '10分钟前'
  },
  {
    id: 4,
    avatar: 'User',
    text: '赵六 收藏了 专业相机',
    time: '15分钟前'
  }
])

// 通知公告数据
const notifications = ref([
  {
    id: 1,
    title: '平台维护通知',
    content: '系统将于今晚进行维护，预计1小时',
    time: '今天 14:30'
  },
  {
    id: 2,
    title: '新功能上线',
    content: '新增商品收藏功能，欢迎体验',
    time: '昨天 10:15'
  },
  {
    id: 3,
    title: '交易安全提醒',
    content: '请通过平台进行交易，保障安全',
    time: '前天 16:45'
  }
])

// 平台统计数据
const stats = ref({
  totalProducts: '1,234',
  totalUsers: '5,678',
  todayTransactions: '89'
})

// 获取热门商品数据
const fetchHotProducts = async () => {
  isLoading.value = true
  try {
    // 从商品store获取真实数据
    await productsStore.fetchProducts()
    
    // 获取前6个商品作为热门商品
    const products = productsStore.products.slice(0, 6)
    
    hotProducts.value = products.map(product => ({
      id: product.id,
      title: product.title,
      price: product.price.toString(),
      condition: product.condition,
      location: product.location,
      time: '最近发布',
      image: product.images && product.images.length > 0 
        ? product.images[0] 
        : 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=150&fit=crop&auto=format'
    }))
    
    // 如果没有真实数据，使用备用数据
    if (hotProducts.value.length === 0) {
      hotProducts.value = [
        {
          id: 1,
          title: 'MacBook Pro 2021',
          price: '6800',
          condition: '几乎全新',
          location: '计算机学院',
          time: '2小时前',
          image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200&h=150&fit=crop&auto=format'
        },
        {
          id: 2,
          title: '考研英语词汇书',
          price: '25',
          condition: '轻微使用',
          location: '外国语学院',
          time: '1天前',
          image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=150&fit=crop&auto=format'
        },
        {
          id: 3,
          title: '专业相机',
          price: '1200',
          condition: '九成新',
          location: '艺术学院',
          time: '3小时前',
          image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=200&h=150&fit=crop&auto=format'
        },
        {
          id: 4,
          title: '运动鞋',
          price: '150',
          condition: '全新',
          location: '体育学院',
          time: '5小时前',
          image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=200&h=150&fit=crop&auto=format'
        }
      ]
    }
  } catch (error) {
    console.error('获取热门商品失败:', error)
    // 使用备用数据
    hotProducts.value = [
      {
        id: 1,
        title: 'MacBook Pro 2021',
        price: '6800',
        condition: '几乎全新',
        location: '计算机学院',
        time: '2小时前',
        image: 'https://via.placeholder.com/200x150?text=MacBook'
      },
      {
        id: 2,
        title: '考研英语词汇书',
        price: '25',
        condition: '轻微使用',
        location: '外国语学院',
        time: '1天前',
        image: 'https://via.placeholder.com/200x150?text=英语书'
      },
      {
        id: 3,
        title: '专业相机',
        price: '1200',
        condition: '九成新',
        location: '艺术学院',
        time: '3小时前',
        image: 'https://via.placeholder.com/200x150?text=相机'
      },
      {
        id: 4,
        title: '运动鞋',
        price: '150',
        condition: '全新',
        location: '体育学院',
        time: '5小时前',
        image: 'https://via.placeholder.com/200x150?text=运动鞋'
      }
    ]
  } finally {
    isLoading.value = false
  }
}

// 快速功能点击处理
const handleQuickAction = (action: any) => {
  if (action.route === '/products/publish' && !userStore.isLoggedIn) {
    router.push('/login')
  } else {
    router.push(action.route)
  }
}

// 搜索标签点击处理
const handleSearchTag = (tag: string) => {
  router.push({
    path: '/products',
    query: { keyword: tag }
  })
}

// 页面加载动画
onMounted(async () => {
  // 初始化用户信息
  await userStore.initUser()
  
  // 获取热门商品数据
  await fetchHotProducts()
  
  // 添加页面加载动画效果
  setTimeout(() => {
    document.body.classList.add('page-loaded')
  }, 100)
})
</script>

<style scoped>
/* 现代化设计 - 优化字体和布局 */
.home-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(to bottom, #f8fafc, #e2e8f0);
  animation: fadeInUp 0.8s ease-out;
  position: relative;
  overflow-x: hidden;
  font-size: 16px; /* 增大基础字体大小 */
  line-height: 1.6;
}

.home-view::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 10% 20%, rgba(120, 119, 198, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 90% 80%, rgba(255, 119, 198, 0.05) 0%, transparent 50%);
  animation: float 8s ease-in-out infinite;
}

/* 全局动画定义 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 顶部轮播图区域 - 重新设计 */
.banner-section {
  background: 
    linear-gradient(135deg, 
      rgba(102, 126, 234, 0.95) 0%, 
      rgba(118, 75, 162, 0.95) 50%, 
      rgba(255, 107, 107, 0.85) 100%),
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><defs><radialGradient id="a" cx="0.25" cy="0.25" r="0.35"><stop offset="0%" stop-color="%23ffffff" stop-opacity="0.1"/><stop offset="100%" stop-color="%23ffffff" stop-opacity="0"/></radialGradient><radialGradient id="b" cx="0.75" cy="0.75" r="0.35"><stop offset="0%" stop-color="%23ffffff" stop-opacity="0.08"/><stop offset="100%" stop-color="%23ffffff" stop-opacity="0"/></radialGradient></defs><rect width="1200" height="800" fill="none"/><circle cx="300" cy="200" r="100" fill="url(%23a)"/><circle cx="900" cy="600" r="150" fill="url(%23b)"/></svg>');
  padding: 120px 0;
  position: relative;
  overflow: hidden;
  perspective: 1000px;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.banner-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.05) 50%, transparent 70%);
  animation: 
    float 8s ease-in-out infinite,
    shimmer 12s linear infinite;
}

.banner-section::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  animation: shimmer 6s linear infinite;
}

.banner-carousel {
  position: relative;
  z-index: 2;
}

.carousel-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 80px;
  animation: fadeInUp 1s ease-out 0.2s both;
}

.banner-content {
  flex: 1;
  color: white;
  position: relative;
  z-index: 3;
}

.banner-title {
  font-size: 6rem; /* 增大主标题字体 */
  font-weight: 900;
  margin-bottom: 30px;
  line-height: 1.1;
  color: #ffffff; /* 改为纯白色 */
  text-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.4),
    0 8px 30px rgba(0, 0, 0, 0.3),
    0 12px 40px rgba(0, 0, 0, 0.2);
  letter-spacing: -0.03em;
  position: relative;
  transform-style: preserve-3d;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  text-align: center;
  max-width: 100%;
  animation: 
    slideInLeft 1s ease-out 0.3s both,
    textGlow 2s ease-in-out infinite 0.5s;
}

@keyframes textGlow {
  0%, 100% { 
    text-shadow: 
      0 2px 4px rgba(0, 0, 0, 0.3),
      0 4px 20px rgba(0, 0, 0, 0.2),
      0 8px 30px rgba(0, 0, 0, 0.15);
  }
  50% { 
    text-shadow: 
      0 2px 8px rgba(0, 0, 0, 0.4),
      0 6px 30px rgba(0, 0, 0, 0.25),
      0 12px 40px rgba(0, 0, 0, 0.2),
      0 0 20px rgba(255, 255, 255, 0.3);
  }
}

.banner-subtitle {
  font-size: 2.2rem; /* 增大副标题字体 */
  margin-bottom: 50px;
  opacity: 0.95;
  color: #ffffff; /* 改为纯白色 */
  animation: slideInLeft 1s ease-out 0.5s both;
  text-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.5),
    0 6px 20px rgba(0, 0, 0, 0.4);
  line-height: 1.7;
  font-weight: 500;
  letter-spacing: 0.03em;
  position: relative;
  transform-style: preserve-3d;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 800px;
  text-align: center;
  margin-left: auto;
  margin-right: auto;
}

.banner-actions {
  display: flex;
  gap: 24px;
  animation: slideInLeft 1s ease-out 0.7s both;
  position: relative;
  z-index: 3;
}

.banner-actions .el-button {
  transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  border-radius: 20px;
  font-weight: 700;
  letter-spacing: 0.03em;
  position: relative;
  overflow: hidden;
  transform-style: preserve-3d;
  perspective: 1000px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  font-size: 1.3rem; /* 增大按钮字体 */
  padding: 20px 40px;
  min-width: 160px;
  height: auto;
}

.banner-actions .el-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  transition: left 0.8s ease;
  z-index: 1;
}

.banner-actions .el-button::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.1) 0%, 
    rgba(255, 255, 255, 0.2) 50%, 
    rgba(255, 255, 255, 0.1) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.banner-actions .el-button:hover {
  transform: translateY(-6px) scale(1.08) rotateX(8deg) rotateY(3deg);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.4),
    0 0 30px rgba(255, 255, 255, 0.6),
    0 0 60px rgba(102, 126, 234, 0.4);
  animation: buttonGlow 2s ease-in-out infinite;
  border-color: rgba(255, 255, 255, 0.6);
}

.banner-actions .el-button:hover::before {
  left: 100%;
}

.banner-actions .el-button:hover::after {
  opacity: 1;
}

@keyframes buttonGlow {
  0%, 100% { 
    box-shadow: 
      0 12px 40px rgba(0, 0, 0, 0.4),
      0 0 30px rgba(255, 255, 255, 0.6),
      0 0 60px rgba(102, 126, 234, 0.4);
  }
  50% { 
    box-shadow: 
      0 15px 50px rgba(0, 0, 0, 0.5),
      0 0 40px rgba(255, 255, 255, 0.8),
      0 0 80px rgba(102, 126, 234, 0.6);
  }
}

.banner-image {
  flex: 1;
  text-align: center;
}

.banner-image img {
  max-width: 100%;
  height: auto;
  border-radius: 0;
  box-shadow: none;
  animation: none;
  transition: none;
  position: relative;
  transform-style: preserve-3d;
}

.banner-image img:hover {
  transform: none;
  box-shadow: none;
  animation: none;
  filter: none;
}

.carousel-indicators {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 40px;
}

.indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
}

.indicator.active {
  background: white;
  transform: scale(1.2);
}

/* 三栏主要内容区域 - 重新设计 */
.main-content-section {
  padding: 100px 0;
  background: 
    linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%),
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><defs><radialGradient id="c" cx="0.5" cy="0.2" r="0.4"><stop offset="0%" stop-color="%23667eea" stop-opacity="0.03"/><stop offset="100%" stop-color="%23667eea" stop-opacity="0"/></radialGradient></defs><rect width="1200" height="800" fill="url(%23c)"/></svg>');
  position: relative;
  overflow: hidden;
  font-size: 16px; /* 增大内容区域字体 */
}

/* 特色功能展示区 */
.feature-section {
  margin-bottom: 80px;
  text-align: center;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 32px;
  margin-top: 40px;
}

.feature-item {
  background: 
    linear-gradient(135deg, 
      rgba(255, 255, 255, 0.95) 0%, 
      rgba(255, 255, 255, 0.98) 100%);
  border-radius: 20px;
  padding: 40px 24px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  overflow: hidden;
}

.feature-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2, #ff6b6b);
  border-radius: 20px 20px 0 0;
}

.feature-item:hover {
  transform: translateY(-8px);
  box-shadow: 
    0 16px 50px rgba(0, 0, 0, 0.12),
    0 8px 25px rgba(102, 126, 234, 0.2);
}

.feature-icon {
  font-size: 3.5rem;
  margin-bottom: 20px;
  display: block;
}

.feature-title {
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 16px;
  color: #1a202c;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.feature-desc {
  font-size: 1.1rem;
  color: #718096;
  line-height: 1.6;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 特色功能展示区 */
.feature-section {
  margin-bottom: 80px;
  text-align: center;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 32px;
  margin-top: 40px;
}

.feature-item {
  background: 
    linear-gradient(135deg, 
      rgba(255, 255, 255, 0.95) 0%, 
      rgba(255, 255, 255, 0.98) 100%);
  border-radius: 20px;
  padding: 40px 24px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  overflow: hidden;
}

.feature-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2, #ff6b6b);
  border-radius: 20px 20px 0 0;
}

.feature-item:hover {
  transform: translateY(-8px);
  box-shadow: 
    0 16px 50px rgba(0, 0, 0, 0.12),
    0 8px 25px rgba(102, 126, 234, 0.2);
}

.feature-icon {
  font-size: 3.5rem;
  margin-bottom: 20px;
  display: block;
}

.feature-title {
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 16px;
  color: #1a202c;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.feature-desc {
  font-size: 1.1rem;
  color: #718096;
  line-height: 1.6;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.main-content-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 10% 10%, rgba(102, 126, 234, 0.02) 0%, transparent 50%),
    radial-gradient(circle at 90% 90%, rgba(255, 107, 107, 0.02) 0%, transparent 50%);
  animation: float 10s ease-in-out infinite;
}

.three-column-layout {
  display: grid;
  grid-template-columns: 300px 1fr 340px;
  gap: 40px;
  align-items: start;
  position: relative;
  z-index: 2;
}

/* 侧边栏样式 - 重新设计 */
.left-sidebar,
.right-sidebar {
  position: sticky;
  top: 120px;
}

.sidebar-card {
  background: 
    linear-gradient(135deg, 
      rgba(255, 255, 255, 0.95) 0%, 
      rgba(255, 255, 255, 0.98) 100%);
  border-radius: 20px;
  padding: 28px;
  margin-bottom: 28px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  overflow: hidden;
}

.sidebar-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2, #ff6b6b);
  border-radius: 20px 20px 0 0;
}

.sidebar-card:hover {
  transform: translateY(-4px);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.12),
    0 4px 16px rgba(0, 0, 0, 0.06);
}

.sidebar-title {
  font-size: 1.3rem;
  font-weight: 800;
  margin-bottom: 24px;
  color: #1a202c;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  position: relative;
  padding-bottom: 12px;
}

.sidebar-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 40px;
  height: 3px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px;
}

/* 快速功能入口 */
.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.quick-action-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.quick-action-item:hover {
  background: #f7fafc;
  border-color: #667eea;
  transform: translateX(4px);
}

.action-icon {
  color: #667eea;
  flex-shrink: 0;
}

.action-info h4 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 4px;
  color: #2d3748;
}

.action-info p {
  font-size: 0.85rem;
  color: #718096;
}

/* 搜索标签 */
.search-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.search-tag {
  background: #f7fafc;
  color: #4a5568;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.search-tag:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
}

/* 主要内容区域 - 重新设计 */
.main-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.content-card {
  background: 
    linear-gradient(135deg, 
      rgba(255, 255, 255, 0.95) 0%, 
      rgba(255, 255, 255, 0.98) 100%);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  overflow: hidden;
}

.content-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2, #ff6b6b);
  border-radius: 20px 20px 0 0;
}

.content-card:hover {
  transform: translateY(-4px);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.12),
    0 4px 16px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  position: relative;
}

.card-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1a202c;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  position: relative;
  padding-bottom: 8px;
}

.card-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 40px;
  height: 3px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px;
}

/* 商品网格 - 优化布局 */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
  max-height: 500px; /* 限制最大高度，更加紧凑 */
  overflow-y: auto; /* 添加滚动条 */
  padding-right: 8px; /* 为滚动条留出空间 */
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
}

/* 自定义滚动条样式 */
.products-grid::-webkit-scrollbar {
  width: 4px;
}

.products-grid::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.products-grid::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.products-grid::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.product-item {
  background: 
    linear-gradient(135deg, 
      rgba(255, 255, 255, 0.95) 0%, 
      rgba(255, 255, 255, 0.98) 100%);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.06),
    0 2px 8px rgba(0, 0, 0, 0.03);
  position: relative;
  backdrop-filter: blur(10px);
}

.product-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2, #ff6b6b);
  border-radius: 16px 16px 0 0;
  z-index: 2;
}

.product-item:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 
    0 16px 50px rgba(0, 0, 0, 0.12),
    0 8px 25px rgba(102, 126, 234, 0.2),
    0 0 20px rgba(102, 126, 234, 0.1);
  border-color: rgba(102, 126, 234, 0.3);
}

.product-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  filter: brightness(0.95);
}

.product-item:hover .product-image img {
  transform: scale(1.1);
  filter: brightness(1.02);
}

.product-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  animation: pulse 2s ease-in-out infinite;
}

.product-details {
  padding: 20px;
}

.product-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 12px;
  color: #1a202c;
  line-height: 1.4;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #2d3748, #4a5568);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.product-price {
  font-size: 1.3rem;
  font-weight: 800;
  color: #ff6b6b;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: #718096;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 最新动态 */
.news-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.news-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.news-item:hover {
  background: #f7fafc;
}

.news-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #667eea;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.news-content {
  flex: 1;
}

.news-text {
  font-size: 0.9rem;
  color: #4a5568;
  margin-bottom: 4px;
}

.news-time {
  font-size: 0.8rem;
  color: #a0aec0;
}

/* 通知公告 */
.notifications {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
  animation: fadeInUp 0.6s ease-out 1.2s both;
  transform-style: preserve-3d;
}

.notification-item:hover {
  background: #f7fafc;
  border-left-color: #667eea;
  transform: translateX(5px) scale(1.02);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  animation: pulse 0.5s ease-in-out;
}

.notification-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.notification-content h4 {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 4px;
  color: #2d3748;
}

.notification-content p {
  font-size: 0.85rem;
  color: #718096;
  margin-bottom: 4px;
}

.notification-time {
  font-size: 0.8rem;
  color: #a0aec0;
}

/* 平台统计 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #f7fafc;
  border-radius: 8px;
  animation: fadeInUp 0.6s ease-out 1.4s both;
  transition: all 0.3s ease;
  transform-style: preserve-3d;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #667eea;
  margin-bottom: 4px;
  transition: all 0.3s ease;
}

.stat-item:hover .stat-value {
  transform: scale(1.1);
  color: #764ba2;
  animation: pulse 1s ease-in-out;
}

.stat-label {
  font-size: 0.8rem;
  color: #718096;
}

/* 底部信息区域 - 重新设计 */
.footer-section {
  background: 
    linear-gradient(135deg, #1a202c 0%, #2d3748 50%, #4a5568 100%);
  color: white;
  padding: 60px 0 30px;
  position: relative;
  overflow: hidden;
}

.footer-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 107, 107, 0.08) 0%, transparent 50%);
  animation: float 12s ease-in-out infinite;
}

.footer-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  margin-bottom: 40px;
  position: relative;
  z-index: 2;
}

.footer-info h3 {
  font-size: 1.8rem;
  font-weight: 800;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #ffffff, #a0aec0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.footer-info p {
  color: #cbd5e0;
  line-height: 1.7;
  font-size: 1.1rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.footer-links {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
}

.link-group h4 {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 20px;
  color: #ffffff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  position: relative;
  padding-bottom: 8px;
}

.link-group h4::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 30px;
  height: 2px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 1px;
}

.link-group a {
  display: block;
  color: #cbd5e0;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 4px 0;
}

.link-group a:hover {
  color: #667eea;
  transform: translateX(8px);
}

.link-group span {
  display: block;
  color: #cbd5e0;
  margin-bottom: 12px;
  font-size: 1rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 30px;
  text-align: center;
  color: #a0aec0;
  font-size: 1rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  position: relative;
  z-index: 2;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .three-column-layout {
    grid-template-columns: 250px 1fr 280px;
    gap: 20px;
  }
}

@media (max-width: 1024px) {
  .three-column-layout {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .left-sidebar,
  .right-sidebar {
    position: static;
  }
  
  .sidebar-card {
    margin-bottom: 16px;
  }
}

@media (max-width: 768px) {
  .banner-title {
    font-size: 2.5rem;
  }
  
  .banner-subtitle {
    font-size: 1.1rem;
  }
  
  .banner-actions {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .carousel-item {
    flex-direction: column;
    gap: 30px;
  }
  
  .products-grid {
    grid-template-columns: 1fr;
  }
  
  .footer-content {
    grid-template-columns: 1fr;
    gap: 30px;
  }
  
  .footer-links {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .container {
    padding: 0 16px;
  }
  
  .banner-section {
    padding: 40px 0;
  }
  
  .main-content-section {
    padding: 40px 0;
  }
  
  .sidebar-card,
  .content-card {
    padding: 20px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>