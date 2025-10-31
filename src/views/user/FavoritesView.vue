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
        <section class="favorites-section" v-loading="isLoading">
          <div class="filters-bar">
            <div class="filter-group">
              <el-select v-model="sortBy" placeholder="排序方式" size="small" @change="loadFavoriteProducts">
                <el-option label="按收藏时间" value="time"></el-option>
                <el-option label="按价格从低到高" value="price-asc"></el-option>
                <el-option label="按价格从高到低" value="price-desc"></el-option>
              </el-select>
            </div>
            <div class="favorites-count">
              共 {{ sortedFavoriteProducts.length }} 件收藏商品
            </div>
          </div>

          <!-- 收藏商品网格 -->
          <div class="favorites-grid" v-if="sortedFavoriteProducts.length > 0">
            <div 
              class="favorite-card" 
              v-for="product in sortedFavoriteProducts" 
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
                    :loading="isLoading"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
                <div class="product-badge">{{ product.condition }}</div>
              </div>
              <div class="favorite-info">
                <h4 class="product-title">{{ product.title }}</h4>
                <p class="product-price">
                  <span class="current-price">¥{{ product.price }}</span>
                  <span v-if="product.originalPrice && product.originalPrice > product.price" class="original-price">
                    ¥{{ product.originalPrice }}
                  </span>
                </p>
                <div class="product-meta">
                  <span class="product-location">📍 {{ product.location }}</span>
                  <span class="favorite-time"><el-icon><Star /></el-icon> 收藏于 {{ formatDate(product.favoriteTime) }}</span>
                </div>
                <div class="product-stats">
                  <span class="view-count"><el-icon><View /></el-icon> {{ product.viewCount }}</span>
                  <span class="like-count"><el-icon><Star /></el-icon> {{ product.likeCount }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div class="empty-state" v-else-if="!isLoading">
            <el-empty description="暂无收藏商品">
              <template #description>
                <p>您还没有收藏任何商品</p>
                <p style="font-size: 14px; color: #909399; margin-top: 8px;">
                  在商品详情页点击 <el-icon><Star /></el-icon> 收藏您感兴趣的商品
                </p>
              </template>
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
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useProductStore } from '@/stores/products'
import { supabase } from '@/lib/supabase'
import GlobalNavigation from '@/components/GlobalNavigation.vue'
import { Delete, Star, View } from '@element-plus/icons-vue'

const userStore = useUserStore()
const productStore = useProductStore()

const sortBy = ref('time')
const isLoading = ref(false)

// 收藏商品列表
const favoriteProducts = ref<any[]>([])

// 计算属性：排序后的收藏商品
const sortedFavoriteProducts = computed(() => {
  const products = [...favoriteProducts.value]
  
  switch (sortBy.value) {
    case 'price-asc':
      return products.sort((a, b) => a.price - b.price)
    case 'price-desc':
      return products.sort((a, b) => b.price - a.price)
    case 'time':
    default:
      return products.sort((a, b) => 
        new Date(b.favoriteTime).getTime() - new Date(a.favoriteTime).getTime()
      )
  }
})

// 从收藏中移除商品
const removeFromFavorites = async (productId: string) => {
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
    
    isLoading.value = true
    const result = await userStore.removeFromFavorites(productId)
    
    if (result.success) {
      // 从本地列表移除
      favoriteProducts.value = favoriteProducts.value.filter(
        product => product.id !== productId
      )
      ElMessage.success('已从收藏中移除')
    } else {
      ElMessage.error(result.message || '移除失败')
    }
  } catch (error) {
    // 用户取消操作
    console.log('用户取消移除收藏')
  } finally {
    isLoading.value = false
  }
}

// 加载收藏商品数据
const loadFavoriteProducts = async () => {
  if (!userStore.user) {
    ElMessage.warning('请先登录')
    return
  }
  
  isLoading.value = true
  try {
    console.log('开始加载收藏商品数据')
    
    // 获取用户收藏的商品ID列表
    const favoriteProductIds = await userStore.fetchFavorites()
    console.log('收藏商品ID列表:', favoriteProductIds)
    
    if (favoriteProductIds.length === 0) {
      favoriteProducts.value = []
      console.log('用户没有收藏任何商品')
      return
    }
    
    // 获取商品详细信息
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select(`
        *,
        profiles!inner(
          username,
          avatar_url
        )
      `)
      .in('id', favoriteProductIds)
      .eq('status', 'available')
      .order('created_at', { ascending: false })

    if (productsError) {
      console.error('获取商品数据失败:', productsError)
      ElMessage.error('获取商品数据失败')
      return
    }

    if (!productsData || productsData.length === 0) {
      favoriteProducts.value = []
      console.log('没有找到收藏的商品数据')
      return
    }

    console.log('获取到收藏商品数据，数量:', productsData.length)

    // 获取收藏时间信息
    const { data: favoritesData, error: favoritesError } = await supabase
      .from('favorites')
      .select('product_id, created_at')
      .eq('user_id', userStore.user.id)
      .in('product_id', favoriteProductIds)
      .order('created_at', { ascending: false })

    if (favoritesError) {
      console.error('获取收藏时间失败:', favoritesError)
    }

    // 创建收藏时间映射
    const favoriteTimeMap = new Map()
    if (favoritesData) {
      favoritesData.forEach(fav => {
        favoriteTimeMap.set(fav.product_id, fav.created_at)
      })
    }

    // 转换数据格式
    favoriteProducts.value = productsData.map(item => {
      const favoriteTime = favoriteTimeMap.get(item.id) || item.created_at
      
      return {
        id: item.id,
        title: item.title,
        price: item.price,
        originalPrice: item.original_price,
        condition: item.condition,
        location: item.location,
        images: item.images || [],
        image: item.images?.[0] || '/src/assets/default-product.jpg',
        status: item.status,
        sellerName: item.profiles?.username || '未知用户',
        sellerAvatar: item.profiles?.avatar_url,
        favoriteTime: favoriteTime,
        createdAt: item.created_at,
        viewCount: item.view_count || 0,
        likeCount: item.like_count || 0
      }
    })
    
    console.log('收藏商品数据转换完成')
  } catch (error) {
    console.error('加载收藏商品失败:', error)
    ElMessage.error('加载收藏商品失败')
  } finally {
    isLoading.value = false
  }
}

// 页面加载
onMounted(async () => {
  console.log('收藏页面加载中...')
  await loadFavoriteProducts()
})

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return '今天'
  } else if (diffDays === 1) {
    return '昨天'
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)}周前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}
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
  min-height: 400px;
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

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 60px 0;
}

/* 商品统计信息 */
.product-stats {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.view-count, .like-count {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 价格显示 */
.product-price {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0;
}

.current-price {
  font-size: 18px;
  font-weight: 700;
  color: #f56c6c;
}

.original-price {
  font-size: 14px;
  color: #909399;
  text-decoration: line-through;
}

/* 位置和时间信息 */
.product-location {
  font-size: 13px;
  color: #606266;
}

.favorite-time {
  font-size: 12px;
  color: #909399;
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