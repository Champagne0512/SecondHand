<template>
  <div class="modern-product-list-view">
    <!-- 现代化主要内容 -->
    <main class="modern-main-content">
      <div class="container">
        <!-- 现代化搜索栏 -->
        <section class="modern-search-section">
          <div class="search-container">
            <div class="search-input-wrapper">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索商品名称、描述或卖家..."
                size="large"
                @keyup.enter="handleSearch"
                class="modern-search-input"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
                <template #append>
                  <el-button type="primary" @click="handleSearch" class="search-btn">
                    搜索
                  </el-button>
                </template>
              </el-input>
            </div>
            
            <div class="quick-filters">
              <el-button 
                v-for="filter in quickFilters" 
                :key="filter.label"
                :type="activeQuickFilter === filter.label ? 'primary' : 'default'"
                size="small"
                @click="handleQuickFilter(filter)"
                class="quick-filter-btn"
              >
                {{ filter.label }}
              </el-button>
            </div>
          </div>
        </section>

        <!-- 现代化筛选栏 -->
        <section class="modern-filter-section">
          <div class="filter-header">
            <h3 class="filter-title">商品筛选</h3>
            <div class="filter-actions">
              <el-button type="info" size="small" @click="handleClearFilter" class="clear-btn">
                <el-icon><Refresh /></el-icon>
                清除筛选
              </el-button>
              <el-button type="primary" size="small" @click="toggleAdvancedFilter" class="advanced-btn">
                <el-icon><Filter /></el-icon>
                {{ showAdvancedFilter ? '收起' : '高级筛选' }}
              </el-button>
            </div>
          </div>
          
          <div class="filter-grid">
            <div class="filter-group">
              <label class="filter-label">分类</label>
              <el-select v-model="filter.category" placeholder="全部分类" @change="handleFilterChange" class="modern-select">
                <el-option label="全部分类" value="" />
                <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
              </el-select>
            </div>
            
            <div class="filter-group">
              <label class="filter-label">价格区间</label>
              <div class="price-range">
                <el-input-number v-model="filter.minPrice" placeholder="最低价" :min="0" @change="handleFilterChange" class="price-input" />
                <span class="price-separator">-</span>
                <el-input-number v-model="filter.maxPrice" placeholder="最高价" :min="0" @change="handleFilterChange" class="price-input" />
              </div>
            </div>
            
            <div class="filter-group">
              <label class="filter-label">成色</label>
              <el-select v-model="filter.condition" placeholder="全部成色" @change="handleFilterChange" class="modern-select">
                <el-option label="全部成色" value="" />
                <el-option label="全新" value="全新" />
                <el-option label="几乎全新" value="几乎全新" />
                <el-option label="轻微使用" value="轻微使用" />
                <el-option label="明显使用" value="明显使用" />
              </el-select>
            </div>
            
            <div class="filter-group">
              <label class="filter-label">排序</label>
              <el-select v-model="filter.sortBy" @change="handleFilterChange" class="modern-select">
                <el-option label="最新发布" value="date_desc" />
                <el-option label="价格从低到高" value="price_asc" />
                <el-option label="价格从高到低" value="price_desc" />
                <el-option label="人气最高" value="popular" />
                <el-option label="距离最近" value="distance" />
              </el-select>
            </div>
          </div>

          <!-- 高级筛选 -->
          <div v-if="showAdvancedFilter" class="advanced-filter-section">
            <div class="advanced-filter-grid">
              <div class="filter-group">
                <label class="filter-label">交易方式</label>
                <el-select v-model="filter.tradeType" placeholder="全部方式" @change="handleFilterChange" class="modern-select">
                  <el-option label="全部方式" value="" />
                  <el-option label="面交" value="face_to_face" />
                  <el-option label="快递" value="express" />
                  <el-option label="自提" value="pickup" />
                </el-select>
              </div>
              
              <div class="filter-group">
                <label class="filter-label">商品状态</label>
                <el-select v-model="filter.status" placeholder="全部状态" @change="handleFilterChange" class="modern-select">
                  <el-option label="全部状态" value="" />
                  <el-option label="可交易" value="available" />
                  <el-option label="已预订" value="reserved" />
                  <el-option label="已售出" value="sold" />
                </el-select>
              </div>
              
              <div class="filter-group">
                <label class="filter-label">发布时间</label>
                <el-select v-model="filter.timeRange" placeholder="全部时间" @change="handleFilterChange" class="modern-select">
                  <el-option label="全部时间" value="" />
                  <el-option label="今天" value="today" />
                  <el-option label="最近3天" value="3days" />
                  <el-option label="最近7天" value="7days" />
                  <el-option label="最近30天" value="30days" />
                </el-select>
              </div>
              
              <div class="filter-group">
                <label class="filter-label">卖家信誉</label>
                <el-select v-model="filter.sellerRating" placeholder="全部信誉" @change="handleFilterChange" class="modern-select">
                  <el-option label="全部信誉" value="" />
                  <el-option label="高信誉" value="high" />
                  <el-option label="中等信誉" value="medium" />
                  <el-option label="新卖家" value="new" />
                </el-select>
              </div>
            </div>
          </div>
        </section>

        <!-- 现代化商品列表 -->
        <section class="modern-products-section">
          <div class="section-header">
            <h2 class="section-title">发现好物</h2>
            <span class="product-count">共 {{ productStore.filteredProducts.length }} 件商品</span>
          </div>
          
          <div v-loading="productStore.isLoading" class="modern-products-grid">
            <div 
              v-for="product in productStore.filteredProducts" 
              :key="product.id"
              class="modern-product-card"
              @click="$router.push(`/products/${product.id}`)"
            >
              <div class="product-image-container">
                <div class="product-image">
                  <img :src="product.images[0] || '/src/assets/default-product.jpg'" :alt="product.title" />
                  <div class="image-overlay">
                    <el-button type="primary" size="small" class="view-details-btn">查看详情</el-button>
                    <el-button 
                      type="success" 
                      size="small" 
                      class="add-to-cart-btn"
                      @click.stop="handleAddToCart(product)"
                      :disabled="product.status !== 'available'"
                    >
                      <el-icon><ShoppingCart /></el-icon>
                      加入购物车
                    </el-button>
                  </div>
                </div>
                <div class="product-status" :class="product.status">
                  {{ getStatusText(product.status) }}
                </div>
                <div class="product-badges">
                  <span class="condition-badge">{{ product.condition }}</span>
                </div>
              </div>
              
              <div class="product-content">
                <h3 class="product-title">{{ product.title }}</h3>
                <p class="product-description">{{ product.description }}</p>
                
                <div class="product-price-section">
                  <div class="price-info">
                    <span class="current-price">¥{{ product.price }}</span>
                    <span v-if="product.originalPrice" class="original-price">¥{{ product.originalPrice }}</span>
                  </div>
                  <div class="discount-badge" v-if="product.originalPrice && product.originalPrice > product.price">
                    {{ Math.round((1 - product.price / product.originalPrice) * 100) }}% OFF
                  </div>
                </div>
                
                <div class="product-meta">
                  <div class="seller-info">
                    <el-avatar :size="24" :src="product.sellerAvatar" />
                    <span>{{ product.sellerName }}</span>
                  </div>
                  <div class="product-stats">
                    <span class="create-time">{{ formatTime(product.createdAt) }}</span>
                    <div class="interaction-stats">
                      <span class="view-count"><el-icon><View /></el-icon> {{ product.viewCount }}</span>
                      <span class="like-count"><el-icon><Star /></el-icon> {{ product.likeCount }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="productStore.filteredProducts.length === 0" class="empty-state">
            <div class="modern-empty-state">
              <el-icon><Search /></el-icon>
              <h3>暂无商品</h3>
              <p>尝试调整筛选条件或发布新商品</p>
              <el-button type="primary" @click="handleClearFilter">清除筛选</el-button>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useProductStore } from '@/stores/products'

import { ShoppingBag, Search, Plus, Refresh, Filter, View, Star } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const productStore = useProductStore()

const searchKeyword = ref('')
const showAdvancedFilter = ref(false)
const activeQuickFilter = ref('')

const filter = reactive({
  category: '',
  minPrice: undefined,
  maxPrice: undefined,
  condition: '',
  sortBy: 'date_desc',
  tradeType: '',
  status: '',
  timeRange: '',
  sellerRating: ''
})

const quickFilters = [
  { label: '热门商品', sortBy: 'popular' },
  { label: '最新发布', sortBy: 'date_desc' },
  { label: '价格最低', sortBy: 'price_asc' },
  { label: '高性价比', minPrice: 0, maxPrice: 100 },
  { label: '全新商品', condition: '全新' }
]

const categories = [
  { id: 'electronics', name: '电子产品' },
  { id: 'books', name: '书籍教材' },
  { id: 'clothing', name: '服装鞋帽' },
  { id: 'sports', name: '运动器材' },
  { id: 'daily', name: '生活用品' },
  { id: 'other', name: '其他' }
]

const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push({
      path: '/products',
      query: { keyword: searchKeyword.value.trim() }
    })
  }
}

const handleFilterChange = () => {
  productStore.updateFilter({ ...filter })
}

const handleClearFilter = () => {
  Object.assign(filter, {
    category: '',
    minPrice: undefined,
    maxPrice: undefined,
    condition: '',
    sortBy: 'date_desc',
    tradeType: '',
    status: '',
    timeRange: '',
    sellerRating: ''
  })
  activeQuickFilter.value = ''
  showAdvancedFilter.value = false
  productStore.clearFilter()
}

const handleQuickFilter = (quickFilter: any) => {
  activeQuickFilter.value = quickFilter.label
  
  // 应用快速筛选条件
  Object.assign(filter, {
    category: '',
    minPrice: quickFilter.minPrice || undefined,
    maxPrice: quickFilter.maxPrice || undefined,
    condition: quickFilter.condition || '',
    sortBy: quickFilter.sortBy || 'date_desc',
    tradeType: '',
    status: '',
    timeRange: '',
    sellerRating: ''
  })
  
  productStore.updateFilter({ ...filter })
}

const toggleAdvancedFilter = () => {
  showAdvancedFilter.value = !showAdvancedFilter.value
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    available: '可交易',
    sold: '已售出',
    reserved: '已预订'
  }
  return statusMap[status] || status
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleDateString()
}

onMounted(() => {
  productStore.fetchProducts()
})
</script>

<style scoped>
.modern-product-list-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #f8fafc 50%, #f1f5f9 75%, #e2e8f0 100%);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  position: relative;
}

.modern-product-list-view::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 300px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 0;
  opacity: 0.05;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
}

/* 现代化主要内容 */
.modern-main-content {
  flex: 1;
  padding: 40px 0;
  position: relative;
  z-index: 1;
}

/* 现代化搜索栏 */
.modern-search-section {
  margin-bottom: 32px;
}

.search-container {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.08),
    0 4px 16px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
}

.search-input-wrapper {
  margin-bottom: 20px;
}

.modern-search-input {
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.modern-search-input:hover {
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.search-btn {
  border-radius: 0 12px 12px 0 !important;
  height: 40px;
  font-weight: 600;
}

.quick-filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.quick-filter-btn {
  border-radius: 20px !important;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.quick-filter-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 现代化筛选栏 */
.modern-filter-section {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%);
  border-radius: 24px;
  padding: 40px;
  margin-bottom: 48px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 
    0 16px 50px rgba(0, 0, 0, 0.1),
    0 8px 25px rgba(102, 126, 234, 0.08),
    0 4px 16px rgba(0, 0, 0, 0.04);
  backdrop-filter: blur(15px);
  position: relative;
  overflow: hidden;
  transition: all 0.4s ease;
}

.modern-filter-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: linear-gradient(90deg, #667eea, #764ba2, #ff6b6b, #f093fb);
  border-radius: 24px 24px 0 0;
  animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.filter-title {
  font-size: 24px;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}

.clear-btn {
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-label {
  font-weight: 500;
  color: #4a5568;
  font-size: 14px;
}

.price-range {
  display: flex;
  align-items: center;
  gap: 12px;
}

.price-input {
  flex: 1;
}

.price-separator {
  color: #a0aec0;
  font-weight: 500;
}

.modern-select {
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.modern-select:hover {
  border-color: #4299e1;
}

/* 现代化商品列表 */
.modern-products-section {
  margin-bottom: 48px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.section-title {
  font-size: 32px;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
  background: linear-gradient(135deg, #4299e1, #3182ce);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.product-count {
  color: #718096;
  font-size: 16px;
  font-weight: 500;
}

.modern-products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 28px;
}

.modern-product-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.98) 100%);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.06),
    0 2px 8px rgba(0, 0, 0, 0.03);
  transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  position: relative;
}

.modern-product-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2, #ff6b6b);
  border-radius: 20px 20px 0 0;
  z-index: 2;
}

.modern-product-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 
    0 16px 50px rgba(0, 0, 0, 0.12),
    0 8px 25px rgba(102, 126, 234, 0.2),
    0 0 20px rgba(102, 126, 234, 0.1);
  border-color: rgba(102, 126, 234, 0.3);
}

.product-image-container {
  position: relative;
  overflow: hidden;
}

.product-image {
  position: relative;
  height: 260px;
  overflow: hidden;
  background: #f7fafc;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.modern-product-card:hover .product-image img {
  transform: scale(1.05);
  filter: brightness(1.02);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.modern-product-card:hover .image-overlay {
  opacity: 1;
}

.view-details-btn {
  background: white;
  color: #4299e1;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  padding: 8px 16px;
  font-size: 14px;
}

.product-status {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  z-index: 2;
}

.product-status.available {
  background: #48bb78;
  color: white;
}

.product-status.sold {
  background: #f56565;
  color: white;
}

.product-status.reserved {
  background: #ed8936;
  color: white;
}

.product-badges {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 2;
}

.condition-badge {
  background: rgba(255, 255, 255, 0.95);
  color: #4a5568;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.product-content {
  padding: 24px;
}

.product-title {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 12px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-description {
  color: #718096;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 20px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-price-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.price-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-price {
  font-size: 24px;
  font-weight: 700;
  color: #2d3748;
}

.original-price {
  font-size: 16px;
  color: #a0aec0;
  text-decoration: line-through;
}

.discount-badge {
  background: linear-gradient(135deg, #f56565, #ed8936);
  color: white;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
}

.seller-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.seller-info span {
  font-size: 14px;
  color: #4a5568;
  font-weight: 500;
}

.product-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.create-time {
  font-size: 12px;
  color: #a0aec0;
}

.interaction-stats {
  display: flex;
  gap: 8px;
}

.view-count, .like-count {
  font-size: 12px;
  color: #a0aec0;
}

/* 空状态 */
.empty-state {
  grid-column: 1 / -1;
}

.modern-empty-state {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
}

.modern-empty-state .el-icon {
  font-size: 64px;
  color: #cbd5e0;
  margin-bottom: 16px;
}

.modern-empty-state h3 {
  font-size: 20px;
  color: #4a5568;
  margin-bottom: 8px;
}

.modern-empty-state p {
  color: #718096;
  margin-bottom: 24px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding: 0 16px;
  }
  
  .modern-main-content {
    padding: 24px 0;
  }
  
  .modern-filter-section {
    padding: 24px;
    margin-bottom: 32px;
  }
  
  .filter-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .modern-products-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 24px;
  }
  
  .product-price-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .product-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .product-stats {
    align-items: flex-start;
  }
}
</style>