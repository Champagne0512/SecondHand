<template>
  <div class="favorites-view">
    <!-- 全局导航组件 -->
    <GlobalNavigation />

    <!-- 主要内容 -->
    <main class="favorites-content">
      <div class="container">
        <!-- 页面标题 -->
        <div class="page-header">
          <h1 class="page-title">我的收藏</h1>
          <p class="page-subtitle">管理您收藏的商品，随时查看心仪物品</p>
        </div>

        <!-- 收藏商品列表 -->
        <section class="favorites-section">
          <div class="filters-bar">
            <div class="filter-group">
              <el-select v-model="sortBy" placeholder="排序方式" size="small">
                <el-option label="按收藏时间" value="time"></el-option>
                <el-option label="按价格从低到高" value="price-asc"></el-option>
                <el-option label="按价格从高到低" value="price-desc"></el-option>
              </el-select>
            </div>
            <div class="favorites-count">
              共 {{ favoriteProducts.length }} 件收藏商品
            </div>
          </div>

          <!-- 收藏商品网格 -->
          <div class="favorites-grid" v-if="favoriteProducts.length > 0">
            <div 
              class="favorite-card" 
              v-for="product in favoriteProducts" 
              :key="product.id"
              @click="$router.push(`/products/${product.id}`)"
            >
              <div class="favorite-image">
                <img :src="product.image" :alt="product.title" />
                <div class="favorite-actions">
                  <el-button 
                    type="danger" 
                    size="small" 
                    circle
                    @click.stop="removeFromFavorites(product.id)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
                <div class="product-badge">{{ product.condition }}</div>
              </div>
              <div class="favorite-info">
                <h4 class="product-title">{{ product.title }}</h4>
                <p class="product-price">¥{{ product.price }}</p>
                <div class="product-meta">
                  <span class="product-location">{{ product.location }}</span>
                  <span class="favorite-time">收藏于 {{ product.favoriteTime }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div class="empty-state" v-else>
            <el-empty description="暂无收藏商品">
              <el-button type="primary" @click="$router.push('/products')">
                去逛逛商品
              </el-button>
            </el-empty>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import GlobalNavigation from '@/components/GlobalNavigation.vue'
import { Delete } from '@element-plus/icons-vue'

const sortBy = ref('time')

// 模拟收藏商品数据
const favoriteProducts = ref([
  {
    id: 1,
    title: 'MacBook Pro 2021',
    price: '6800',
    condition: '几乎全新',
    location: '计算机学院',
    image: 'https://via.placeholder.com/300x200?text=MacBook',
    favoriteTime: '2024-01-15'
  },
  {
    id: 2,
    title: 'AirPods Pro 2代',
    price: '1200',
    condition: '几乎全新',
    location: '电子信息学院',
    image: 'https://via.placeholder.com/300x200?text=AirPods',
    favoriteTime: '2024-01-10'
  },
  {
    id: 3,
    title: 'Java编程思想',
    price: '35',
    condition: '明显使用',
    location: '软件学院',
    image: 'https://via.placeholder.com/300x200?text=Java书',
    favoriteTime: '2024-01-08'
  }
])

// 从收藏中移除商品
const removeFromFavorites = async (productId: number) => {
  try {
    await ElMessageBox.confirm(
      '确定要从收藏中移除这个商品吗？',
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    favoriteProducts.value = favoriteProducts.value.filter(
      product => product.id !== productId
    )
    
    ElMessage.success('已从收藏中移除')
  } catch (error) {
    // 用户取消操作
  }
}

// 页面加载
onMounted(() => {
  // 可以在这里加载真实的收藏数据
})
</script>

<style scoped>
.favorites-view {
  min-height: 100vh;
  background: linear-gradient(to bottom, #f8fafc, #ffffff);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 页面标题 */
.page-header {
  text-align: center;
  padding: 60px 0 40px;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 16px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-subtitle {
  font-size: 1.1rem;
  color: #718096;
  max-width: 500px;
  margin: 0 auto;
}

/* 收藏区域 */
.favorites-section {
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  margin-bottom: 60px;
}

/* 筛选栏 */
.filters-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
}

.favorites-count {
  font-weight: 600;
  color: #667eea;
}

/* 收藏商品网格 */
.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 30px;
}

.favorite-card {
  background: #f8fafc;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid transparent;
}

.favorite-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(102, 126, 234, 0.15);
  border-color: rgba(102, 126, 234, 0.3);
}

.favorite-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.favorite-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.favorite-card:hover .favorite-image img {
  transform: scale(1.05);
}

.favorite-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.favorite-card:hover .favorite-actions {
  opacity: 1;
}

.product-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: linear-gradient(45deg, #f093fb, #f5576c);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.favorite-info {
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

.favorite-time {
  color: #a0aec0;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .favorites-section {
    padding: 20px;
    margin: 0 -20px;
    border-radius: 0;
  }
  
  .filters-bar {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .favorites-grid {
    grid-template-columns: 1fr;
  }
  
  .page-title {
    font-size: 2rem;
  }
}
</style>