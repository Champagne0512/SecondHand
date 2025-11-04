<template>
  <div class="home-view">
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

      <!-- 优化后的主要内容区域 - 两栏布局 -->
      <section class="main-content-section">
        <div class="container">
          <div class="two-column-layout">
            <!-- 左侧：核心功能区域 -->
            <main class="main-content">
              <!-- 智能搜索栏 -->
              <div class="search-section">
                <div class="search-card">
                  <h3 class="search-title">快速找到心仪商品</h3>
                  <div class="search-input-group">
                    <el-input
                      v-model="searchKeyword"
                      placeholder="搜索商品、用户或关键词..."
                      size="large"
                      @keyup.enter="handleSearch"
                    >
                      <template #append>
                        <el-button type="primary" @click="handleSearch">
                          <el-icon><Search /></el-icon>
                          搜索
                        </el-button>
                      </template>
                    </el-input>
                  </div>
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
              </div>

              <!-- 热门商品展示 -->
              <div class="content-card">
                <div class="card-header">
                  <h3 class="card-title">🔥 热门商品</h3>
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
                      <div class="product-overlay">
                        <el-button type="primary" size="small" @click.stop="handleQuickAddToCart(product)">
                          <el-icon><ShoppingBag /></el-icon>
                          加入购物车
                        </el-button>
                      </div>
                    </div>
                    <div class="product-details">
                      <h4 class="product-title">{{ product.title }}</h4>
                      <p class="product-price">¥{{ product.price }}</p>
                      <div class="product-meta">
                        <span class="product-location">{{ product.location }}</span>
                        <span class="product-time">{{ product.time }}</span>
                      </div>
                      <div class="product-actions">
                        <el-button size="small" text @click.stop="handleLikeProduct(product)">
                          <el-icon><Star /></el-icon>
                          收藏
                        </el-button>
                        <el-button size="small" text @click.stop="handleShareProduct(product)">
                          <el-icon><Share /></el-icon>
                          分享
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 实时动态 -->
              <div class="content-card">
                <div class="card-header">
                  <h3 class="card-title">📢 实时动态</h3>
                  <el-button type="primary" text @click="refreshNews">
                    <el-icon><Refresh /></el-icon>
                    刷新
                  </el-button>
                </div>
                <div class="dynamic-list">
                  <div class="dynamic-item" v-for="item in dynamicItems" :key="item.id">
                    <div class="dynamic-avatar">
                      <el-avatar :size="40" :src="item.avatar" />
                    </div>
                    <div class="dynamic-content">
                      <p class="dynamic-text">
                        <span class="dynamic-user">{{ item.user }}</span>
                        {{ item.action }}
                        <span class="dynamic-target" @click="handleDynamicClick(item)">{{ item.target }}</span>
                      </p>
                      <div class="dynamic-meta">
                        <span class="dynamic-time">{{ item.time }}</span>
                        <div class="dynamic-actions">
                          <el-button size="mini" text @click="handleLikeDynamic(item)">
                            <el-icon><Star /></el-icon>
                            {{ item.likes }}
                          </el-button>
                          <el-button size="mini" text @click="handleCommentDynamic(item)">
                            <el-icon><ChatDotRound /></el-icon>
                            {{ item.comments }}
                          </el-button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </main>

            <!-- 右侧：智能侧边栏 -->
            <aside class="smart-sidebar">
              <!-- 个性化推荐 -->
              <div class="sidebar-card">
                <h3 class="sidebar-title">🎯 为你推荐</h3>
                <div class="recommendation-list">
                  <div 
                    class="recommendation-item" 
                    v-for="rec in recommendations" 
                    :key="rec.id"
                    @click="$router.push(`/products/${rec.id}`)"
                  >
                    <div class="rec-image">
                      <img :src="rec.image" :alt="rec.title" />
                    </div>
                    <div class="rec-info">
                      <h4>{{ rec.title }}</h4>
                      <p class="rec-price">¥{{ rec.price }}</p>
                      <div class="rec-match">
                        <el-progress :percentage="rec.matchRate" :show-text="false" />
                        <span class="match-text">{{ rec.matchRate }}%匹配</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 快捷操作 -->
              <div class="sidebar-card">
                <h3 class="sidebar-title">⚡ 快捷操作</h3>
                <div class="quick-actions-grid">
                  <div 
                    class="quick-action" 
                    v-for="action in smartActions" 
                    :key="action.id"
                    @click="handleSmartAction(action)"
                  >
                    <div class="action-icon">
                      <el-icon :size="24">
                        <component :is="action.icon" />
                      </el-icon>
                    </div>
                    <span class="action-label">{{ action.label }}</span>
                  </div>
                </div>
              </div>

              <!-- 平台统计 -->
              <div class="sidebar-card">
                <h3 class="sidebar-title">📊 平台数据</h3>
                <div class="stats-cards">
                  <div class="stat-card" v-for="stat in realStats" :key="stat.id">
                    <div class="stat-icon">
                      <el-icon :size="20">
                        <component :is="stat.icon" />
                      </el-icon>
                    </div>
                    <div class="stat-content">
                      <div class="stat-value">{{ stat.value }}</div>
                      <div class="stat-label">{{ stat.label }}</div>
                      <div class="stat-trend" :class="{ 'trend-up': stat.trend > 0, 'trend-down': stat.trend < 0 }">
                        <el-icon v-if="stat.trend > 0"><Top /></el-icon>
                        <el-icon v-if="stat.trend < 0"><Bottom /></el-icon>
                        {{ Math.abs(stat.trend) }}%
                      </div>
                    </div>
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

import { 
  ShoppingBag, Search, Goods, Plus, User, 
  ChatDotRound, Star, ArrowRight, Collection, 
  Document, Setting, Message, Bell, MagicStick, School,
  Refresh, Share, Top, Bottom, ShoppingCart
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

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

// 搜索标签数据
const searchTags = ref([
  '电子产品', '学习资料', '生活用品', '服装鞋帽', 
  '运动器材', '书籍杂志', '数码配件', '宿舍神器'
])

// 实时动态数据
const dynamicItems = ref([
  {
    id: 1,
    user: '张三',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop&auto=format',
    action: '发布了',
    target: 'MacBook Pro 2021',
    time: '2分钟前',
    likes: 12,
    comments: 3
  },
  {
    id: 2,
    user: '李四',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&auto=format',
    action: '购买了',
    target: '考研英语词汇书',
    time: '5分钟前',
    likes: 8,
    comments: 2
  },
  {
    id: 3,
    user: '王五',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&auto=format',
    action: '收藏了',
    target: '专业相机',
    time: '10分钟前',
    likes: 15,
    comments: 5
  },
  {
    id: 4,
    user: '赵六',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&auto=format',
    action: '发布了',
    target: '全新运动鞋',
    time: '15分钟前',
    likes: 6,
    comments: 1
  }
])

// 个性化推荐数据
const recommendations = ref([
  {
    id: 101,
    title: 'iPad Air 2022',
    price: '2800',
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=60&h=60&fit=crop&auto=format',
    matchRate: 92
  },
  {
    id: 102,
    title: '机械键盘',
    price: '180',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=60&h=60&fit=crop&auto=format',
    matchRate: 85
  },
  {
    id: 103,
    title: '考研数学资料',
    price: '35',
    image: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=60&h=60&fit=crop&auto=format',
    matchRate: 78
  }
])

// 智能操作数据
const smartActions = ref([
  {
    id: 1,
    icon: 'Plus',
    label: '发布商品',
    route: '/products/publish'
  },
  {
    id: 2,
    icon: 'Collection',
    label: '我的收藏',
    route: '/profile/favorites'
  },
  {
    id: 3,
    icon: 'ShoppingCart',
    label: '购物车',
    route: '/cart'
  },
  {
    id: 4,
    icon: 'Message',
    label: '消息',
    route: '/messages'
  },
  {
    id: 5,
    icon: 'MagicStick',
    label: 'AI助手',
    route: '/ai-assistant'
  },
  {
    id: 6,
    icon: 'School',
    label: '校园服务',
    route: '/campus'
  }
])

// 实时统计数据
const realStats = ref([
  {
    id: 1,
    icon: 'Goods',
    value: '1,234',
    label: '商品总数',
    trend: 12
  },
  {
    id: 2,
    icon: 'User',
    value: '5,678',
    label: '注册用户',
    trend: 8
  },
  {
    id: 3,
    icon: 'ShoppingCart',
    value: '89',
    label: '今日交易',
    trend: 15
  },
  {
    id: 4,
    icon: 'Star',
    value: '2,345',
    label: '收藏总数',
    trend: 6
  }
])

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

// 搜索处理
const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push({
      path: '/products',
      query: { keyword: searchKeyword.value.trim() }
    })
  }
}

// 搜索标签点击处理
const handleSearchTag = (tag: string) => {
  searchKeyword.value = tag
  handleSearch()
}

// 智能操作处理
const handleSmartAction = (action: any) => {
  if (action.route === '/products/publish' && !userStore.isLoggedIn) {
    router.push('/login')
  } else {
    router.push(action.route)
  }
}

// 商品交互方法
const handleQuickAddToCart = (product: any) => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  // 这里可以调用购物车API
  ElMessage.success(`已将 ${product.title} 加入购物车`)
}

const handleLikeProduct = (product: any) => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  // 这里可以调用收藏API
  ElMessage.success(`已收藏 ${product.title}`)
}

const handleShareProduct = (product: any) => {
  // 这里可以实现分享功能
  ElMessage.info(`分享 ${product.title}`)
}

// 动态交互方法
const handleDynamicClick = (item: any) => {
  // 跳转到对应的商品页面
  router.push(`/products/${item.id}`)
}

const handleLikeDynamic = (item: any) => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  // 点赞动态
  item.likes++
  ElMessage.success('点赞成功')
}

const handleCommentDynamic = (item: any) => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  // 跳转到评论页面
  ElMessage.info('跳转到评论页面')
}

// 刷新动态
const refreshNews = () => {
  ElMessage.info('正在刷新动态...')
  // 这里可以调用API获取最新动态
  setTimeout(() => {
    ElMessage.success('动态已刷新')
  }, 1000)
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

/* 两栏主要内容区域 - 重新设计 */
.main-content-section {
  padding: 80px 0;
  background: 
    linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%),
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><defs><radialGradient id="c" cx="0.5" cy="0.2" r="0.4"><stop offset="0%" stop-color="%23667eea" stop-opacity="0.03"/><stop offset="100%" stop-color="%23667eea" stop-opacity="0"/></radialGradient></defs><rect width="1200" height="800" fill="url(%23c)"/></svg>');
  position: relative;
  overflow: hidden;
  font-size: 16px;
}

.two-column-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 32px;
  align-items: start;
}

/* 智能搜索栏 */
.search-section {
  margin-bottom: 32px;
}

.search-card {
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
  text-align: center;
}

.search-title {
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 20px;
  color: #2d3748;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.search-input-group {
  margin-bottom: 20px;
}

.search-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
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

/* 紧凑型特色功能展示区 */
.compact-feature-section {
  margin-bottom: 60px;
  text-align: center;
}

.compact-feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  max-width: 900px;
  margin: 0 auto;
}

.compact-feature-item {
  background: 
    linear-gradient(135deg, 
      rgba(255, 255, 255, 0.95) 0%, 
      rgba(255, 255, 255, 0.98) 100%);
  border-radius: 16px;
  padding: 24px 16px;
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.06),
    0 1px 4px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.compact-feature-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #667eea, #764ba2, #ff6b6b);
  border-radius: 16px 16px 0 0;
}

.compact-feature-item:hover {
  transform: translateY(-4px);
  box-shadow: 
    0 8px 25px rgba(0, 0, 0, 0.1),
    0 4px 12px rgba(102, 126, 234, 0.15);
  border-color: rgba(102, 126, 234, 0.3);
}

.compact-feature-icon {
  font-size: 2rem;
  color: #667eea;
  margin-bottom: 12px;
  display: block;
  transition: all 0.3s ease;
}

.compact-feature-item:hover .compact-feature-icon {
  color: #764ba2;
  transform: scale(1.1);
}

.compact-feature-content h4 {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: #2d3748;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.compact-feature-content p {
  font-size: 0.9rem;
  color: #718096;
  line-height: 1.4;
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
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

/* 商品项增强交互 */
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

.product-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.3s ease;
}

.product-item:hover .product-overlay {
  opacity: 1;
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

.product-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  justify-content: flex-end;
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

/* 实时动态样式 */
.dynamic-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dynamic-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid transparent;
}

.dynamic-item:hover {
  background: #f7fafc;
  border-color: #e2e8f0;
  transform: translateX(4px);
}

.dynamic-avatar {
  flex-shrink: 0;
}

.dynamic-content {
  flex: 1;
}

.dynamic-text {
  font-size: 0.9rem;
  color: #4a5568;
  margin-bottom: 8px;
  line-height: 1.4;
}

.dynamic-user {
  font-weight: 600;
  color: #667eea;
}

.dynamic-target {
  color: #ff6b6b;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}

.dynamic-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dynamic-time {
  font-size: 0.8rem;
  color: #a0aec0;
}

.dynamic-actions {
  display: flex;
  gap: 8px;
}

/* 智能侧边栏样式 */
.smart-sidebar {
  position: sticky;
  top: 120px;
}

.recommendation-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recommendation-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.recommendation-item:hover {
  background: #f7fafc;
  border-color: #e2e8f0;
  transform: translateX(4px);
}

.rec-image {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.rec-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rec-info {
  flex: 1;
}

.rec-info h4 {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 4px;
  color: #2d3748;
}

.rec-price {
  font-size: 0.9rem;
  font-weight: 700;
  color: #ff6b6b;
  margin-bottom: 6px;
}

.rec-match {
  display: flex;
  align-items: center;
  gap: 8px;
}

.match-text {
  font-size: 0.8rem;
  color: #718096;
}

/* 快捷操作网格 */
.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.quick-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  text-align: center;
}

.quick-action:hover {
  background: #f7fafc;
  border-color: #667eea;
  transform: translateY(-2px);
}

.action-icon {
  color: #667eea;
}

.action-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #4a5568;
}

/* 统计卡片 */
.stats-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  background: #f7fafc;
  transition: all 0.3s ease;
}

.stat-card:hover {
  background: #edf2f7;
  transform: translateX(4px);
}

.stat-icon {
  color: #667eea;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 0.8rem;
  color: #718096;
  margin-bottom: 4px;
}

.stat-trend {
  font-size: 0.7rem;
  font-weight: 600;
}

.trend-up {
  color: #48bb78;
}

.trend-down {
  color: #f56565;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .two-column-layout {
    grid-template-columns: 1fr 320px;
    gap: 24px;
  }
}

@media (max-width: 1024px) {
  .two-column-layout {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .smart-sidebar {
    position: static;
  }
  
  .quick-actions-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
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