<template>
  <div class="home-view">
    <!-- 全局导航组件 -->
    <GlobalNavigation />

    <!-- 现代化主要内容 -->
    <main class="modern-content">
      <!-- 英雄区域 -->
      <section class="hero-section">
        <div class="hero-background">
          <div class="floating-elements">
            <div class="floating-element element-1"></div>
            <div class="floating-element element-2"></div>
            <div class="floating-element element-3"></div>
          </div>
        </div>
        <div class="container">
          <div class="hero-content">
            <h1 class="hero-title animate-fade-in-up">
              <span class="title-gradient">校园二手交易平台</span>
            </h1>
            <p class="hero-subtitle animate-fade-in-up" style="animation-delay: 0.2s">
              让闲置物品找到新主人，开启绿色循环经济
            </p>
            <div class="hero-actions animate-fade-in-up" style="animation-delay: 0.4s">
              <el-button 
                type="primary" 
                size="large" 
                class="hero-btn primary-btn"
                @click="$router.push('/products')"
              >
                <span class="btn-icon">🔍</span>
                浏览商品
              </el-button>
              <el-button 
                v-if="!userStore.isLoggedIn" 
                size="large" 
                class="hero-btn secondary-btn"
                @click="$router.push('/login')"
              >
                <span class="btn-icon">🚀</span>
                立即登录
              </el-button>
            </div>
          </div>
        </div>
      </section>

      <!-- 功能模块展示 -->
      <section class="modules-section">
        <div class="container">
          <h2 class="section-title">平台特色功能</h2>
          <div class="modules-grid">
            <div 
              class="module-card" 
              v-for="module in modules" 
              :key="module.id"
              @click="handleModuleClick(module)"
            >
              <div class="module-icon">
                <el-icon :size="48">
                  <component :is="module.icon" />
                </el-icon>
              </div>
              <h3>{{ module.title }}</h3>
              <p>{{ module.description }}</p>
              <div class="module-action">
                <span class="action-text">{{ module.actionText }}</span>
                <el-icon><ArrowRight /></el-icon>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 热门商品预览 -->
      <section class="hot-products-section">
        <div class="container">
          <div class="section-header">
            <h2 class="section-title">热门商品</h2>
            <el-button type="primary" text @click="$router.push('/products')">
              查看全部
              <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div class="products-preview">
            <div class="product-card" v-for="product in hotProducts" :key="product.id">
              <div class="product-image">
                <img :src="product.image" :alt="product.title" />
                <div class="product-badge">{{ product.condition }}</div>
              </div>
              <div class="product-info">
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
      </section>
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
  ChatDotRound, Star, ArrowRight 
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const productsStore = useProductStore()

const searchKeyword = ref('')
const hotProducts = ref([])
const isLoading = ref(false)

// 功能模块数据
const modules = ref([
  {
    id: 1,
    icon: 'Goods',
    title: '商品市场',
    description: '海量二手商品，涵盖学习用品、电子产品、生活用品等',
    actionText: '浏览商品',
    route: '/products'
  },
  {
    id: 2,
    icon: 'Plus',
    title: '发布商品',
    description: '简单三步发布闲置物品，轻松开启交易之旅',
    actionText: '立即发布',
    route: '/products/publish'
  },
  {
    id: 3,
    icon: 'User',
    title: '个人中心',
    description: '管理个人信息、发布记录、收藏商品和消息通知',
    actionText: '查看详情',
    route: '/profile'
  },
  {
    id: 4,
    icon: 'ChatDotRound',
    title: '消息中心',
    description: '实时沟通交流，买卖双方即时联系，交易更便捷',
    actionText: '查看消息',
    route: '/messages'
  }
])

// 获取热门商品数据
const fetchHotProducts = async () => {
  isLoading.value = true
  try {
    // 从商品store获取真实数据
    await productsStore.fetchProducts()
    
    // 获取前4个商品作为热门商品
    const products = productsStore.products.slice(0, 4)
    
    hotProducts.value = products.map(product => ({
      id: product.id,
      title: product.title,
      price: product.price.toString(),
      condition: product.condition,
      location: product.location,
      time: '最近发布',
      image: product.images && product.images.length > 0 
        ? product.images[0] 
        : 'https://via.placeholder.com/200x150?text=商品图片'
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

// 模块点击处理
const handleModuleClick = (module: any) => {
  if (module.route === '/products/publish' && !userStore.isLoggedIn) {
    router.push('/login')
  } else {
    router.push(module.route)
  }
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
/* 现代化设计 */
.home-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(to bottom, #f8fafc, #e2e8f0);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 现代化导航栏 */
.modern-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
  transition: all 0.3s ease;
}

.modern-header .container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80px;
}

.logo-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.logo-container:hover {
  transform: scale(1.05);
}

.logo-icon {
  background: linear-gradient(45deg, #667eea, #764ba2);
  padding: 12px;
  border-radius: 12px;
  margin-right: 12px;
  color: white;
  font-size: 24px;
}

.logo-text {
  font-size: 24px;
  font-weight: 800;
  background: linear-gradient(45deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.search-container {
  flex: 1;
  max-width: 500px;
  margin: 0 40px;
}

.search-wrapper {
  position: relative;
}

.modern-search {
  border-radius: 25px;
  border: 2px solid transparent;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
}

.modern-search:hover {
  border-color: #667eea;
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.2);
}

.modern-search:focus-within {
  border-color: #667eea;
  box-shadow: 0 0 30px rgba(102, 126, 234, 0.3);
}

.actions-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.gradient-btn {
  background: linear-gradient(45deg, #667eea, #764ba2);
  border: none;
  border-radius: 25px;
  padding: 12px 24px;
  font-weight: 600;
  color: white;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.gradient-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.gradient-btn:hover::before {
  left: 100%;
}

.gradient-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
}

.publish-btn {
  background: linear-gradient(45deg, #f093fb, #f5576c);
}

.publish-btn:hover {
  box-shadow: 0 10px 25px rgba(245, 87, 108, 0.4);
}

/* 英雄区域 */
.hero-section {
  position: relative;
  min-height: 70vh;
  display: flex;
  align-items: center;
  background: linear-gradient(45deg, #667eea, #764ba2);
  overflow: hidden;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.floating-elements {
  position: absolute;
  width: 100%;
  height: 100%;
}

.floating-element {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.element-1 {
  width: 100px;
  height: 100px;
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.element-2 {
  width: 150px;
  height: 150px;
  top: 60%;
  right: 15%;
  animation-delay: 2s;
}

.element-3 {
  width: 80px;
  height: 80px;
  bottom: 30%;
  left: 20%;
  animation-delay: 4s;
}

.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
  color: white;
}

.hero-title {
  font-size: 4rem;
  font-weight: 800;
  margin-bottom: 24px;
  line-height: 1.1;
}

.gradient-text {
  background: linear-gradient(45deg, #f093fb, #f5576c);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: 1.5rem;
  margin-bottom: 40px;
  opacity: 0.9;
}

.hero-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.hero-btn {
  padding: 16px 32px;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 50px;
  transition: all 0.3s ease;
}

.primary-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  backdrop-filter: blur(10px);
}

.primary-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-3px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.secondary-btn {
  background: transparent;
  border: 2px solid white;
  color: white;
}

.secondary-btn:hover {
  background: white;
  color: #667eea;
  transform: translateY(-3px);
}

/* 动画效果 */
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.8s ease-out;
}

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

/* 功能模块展示区域 */
.modules-section {
  padding: 80px 0;
  background: linear-gradient(to bottom, #f8fafc, #ffffff);
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 60px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  position: relative;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 4px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  border-radius: 2px;
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
  margin-top: 40px;
}

.module-card {
  background: white;
  border-radius: 20px;
  padding: 40px 30px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  transition: all 0.4s ease;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
}

.module-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.1), transparent);
  transition: left 0.6s ease;
}

.module-card:hover::before {
  left: 100%;
}

.module-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 50px rgba(102, 126, 234, 0.15);
  border-color: rgba(102, 126, 234, 0.3);
}

.module-icon {
  margin-bottom: 20px;
  color: #667eea;
  transition: all 0.3s ease;
}

.module-card:hover .module-icon {
  transform: scale(1.1);
  color: #764ba2;
}

.module-card h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 15px;
  color: #2d3748;
}

.module-card p {
  color: #718096;
  line-height: 1.6;
  margin-bottom: 20px;
  font-size: 0.95rem;
}

.module-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #667eea;
  font-weight: 600;
  transition: all 0.3s ease;
}

.module-card:hover .module-action {
  color: #764ba2;
  transform: translateX(5px);
}

/* 热门商品预览区域 */
.hot-products-section {
  padding: 80px 0;
  background: linear-gradient(to bottom, #ffffff, #f8fafc);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.products-preview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
}

.product-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
  transition: all 0.4s ease;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.product-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 15px 40px rgba(102, 126, 234, 0.15);
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
  transition: transform 0.4s ease;
}

.product-card:hover .product-image img {
  transform: scale(1.05);
}

.product-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: linear-gradient(45deg, #f093fb, #f5576c);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.product-info {
  padding: 20px;
}

.product-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: #2d3748;
  line-height: 1.3;
}

.product-price {
  font-size: 1.3rem;
  font-weight: 800;
  color: #f5576c;
  margin-bottom: 12px;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: #718096;
}

.product-location {
  display: flex;
  align-items: center;
  gap: 4px;
}

.product-time {
  color: #a0aec0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-subtitle {
    font-size: 1.2rem;
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }
  
  /* 功能模块响应式 */
  .modules-grid {
    grid-template-columns: 1fr;
  }
  
  /* 热门商品响应式 */
  .products-preview {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .section-title {
    font-size: 2rem;
  }
  
  .modules-section,
  .hot-products-section {
    padding: 60px 0;
  }
}
</style>