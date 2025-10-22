<template>
  <div class="modern-product-list-view">
    <!-- 全局导航组件 -->
    <GlobalNavigation />

    <!-- 现代化主要内容 -->
    <main class="modern-main-content">
      <div class="container">
        <!-- 现代化筛选栏 -->
        <section class="modern-filter-section">
          <div class="filter-header">
            <h3 class="filter-title">商品筛选</h3>
            <el-button type="info" size="small" @click="handleClearFilter" class="clear-btn">
              <el-icon><Refresh /></el-icon>
              清除筛选
            </el-button>
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
              </el-select>
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
                      <span class="view-count">👁️ {{ product.viewCount }}</span>
                      <span class="like-count">❤️ {{ product.likeCount }}</span>
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
import GlobalNavigation from '@/components/GlobalNavigation.vue'
import { ShoppingBag, Search, Plus, Refresh } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const productStore = useProductStore()

const searchKeyword = ref('')

const filter = reactive({
  category: '',
  minPrice: undefined,
  maxPrice: undefined,
  condition: '',
  sortBy: 'date_desc'
})

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
    sortBy: 'date_desc'
  })
  productStore.clearFilter()
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
  background: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
}

/* 现代化筛选栏 */
.modern-filter-section {
  background: white;
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 40px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
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
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 32px;
}

.modern-product-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid #f7fafc;
}

.modern-product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  border-color: #e2e8f0;
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