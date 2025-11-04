<template>
  <div class="product-detail-view">
    <!-- 主要内容 -->
    <main class="main-content" v-loading="productStore.isLoading">
      <div class="container" v-if="product">
        <!-- 商品详情 -->
        <section class="product-detail">
          <div class="product-gallery">
            <div class="main-image">
              <img :src="getImageUrl(currentImage || product.images[0])" :alt="product.title" />
            </div>
            <div class="thumbnail-list" v-if="product.images.length > 1">
              <div 
                v-for="(image, index) in product.images" 
                :key="index"
                class="thumbnail"
                :class="{ active: currentImage === image }"
                @click="currentImage = image"
              >
                <img :src="getImageUrl(image)" :alt="`${product.title} ${index + 1}`" />
              </div>
            </div>
          </div>

          <div class="product-info">
            <div class="product-header">
              <h1 class="product-title">{{ product.title }}</h1>
              <div class="product-status" :class="product.status">
                {{ getStatusText(product.status) }}
              </div>
            </div>

            <div class="product-price">
              <span class="current-price">¥{{ product.price }}</span>
              <span v-if="product.originalPrice" class="original-price">¥{{ product.originalPrice }}</span>
              <span class="discount" v-if="product.originalPrice">
                {{ Math.round((1 - product.price / product.originalPrice) * 100) }}% OFF
              </span>
            </div>

            <div class="product-meta">
              <div class="meta-item">
                <span class="label">成色:</span>
                <span class="value">{{ product.condition }}</span>
              </div>
              <div class="meta-item">
                <span class="label">位置:</span>
                <span class="value">{{ product.location }}</span>
              </div>
              <div class="meta-item">
                <span class="label">发布时间:</span>
                <span class="value">{{ formatDate(product.createdAt) }}</span>
              </div>
              <div class="meta-item">
                <span class="label">浏览量:</span>
                <span class="value">{{ product.viewCount }}</span>
              </div>
            </div>

            <div class="product-description">
              <h3>商品描述</h3>
              <p>{{ product.description }}</p>
            </div>

            <!-- 卖家信息 -->
            <div class="seller-info">
              <h3>卖家信息</h3>
              <div class="seller-card">
                <div class="seller-avatar">
                  <el-avatar :size="60" :src="product.sellerAvatar" />
                </div>
                <div class="seller-details">
                  <h4>{{ product.sellerName }}</h4>
                  <p class="contact-info">{{ product.contactInfo }}</p>
                  <p class="join-date">加入时间: {{ formatDate(product.createdAt) }}</p>
                </div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="action-buttons">
              <el-button 
                type="primary" 
                size="large" 
                :disabled="product.status !== 'available'"
                @click="handleContactSeller"
              >
                <el-icon><ChatDotRound /></el-icon>
                联系卖家
              </el-button>
              <el-button 
                type="success" 
                size="large" 
                :disabled="product.status !== 'available'"
                @click="handleAddToCart"
                :loading="cartStore.isLoading"
              >
                <el-icon><ShoppingCart /></el-icon>
                加入购物车
              </el-button>
              <el-button 
                size="large" 
                @click="handleAddToFavorites"
                :type="userStore.isFavorited(product.id) ? 'warning' : 'default'"
                :loading="userStore.isLoading"
              >
                <el-icon>
                  <Star :class="{ 'is-favorited': userStore.isFavorited(product.id) }" />
                </el-icon>
                {{ userStore.isFavorited(product.id) ? '已收藏' : '收藏' }}
              </el-button>
              <el-button size="large" @click="handleShare">
                <el-icon><Share /></el-icon>
                分享
              </el-button>
            </div>
          </div>
        </section>

        <!-- 相关商品 -->
        <section class="related-products" v-if="relatedProducts.length > 0">
          <h2 class="section-title">相关商品</h2>
          <div class="related-grid">
            <div 
              v-for="relatedProduct in relatedProducts" 
              :key="relatedProduct.id"
              class="related-card"
              @click="$router.push(`/products/${relatedProduct.id}`)"
            >
              <div class="related-image">
                <img :src="relatedProduct.images[0] || '/src/assets/default-product.jpg'" :alt="relatedProduct.title" />
              </div>
              <div class="related-info">
                <h4>{{ relatedProduct.title }}</h4>
                <p class="related-price">¥{{ relatedProduct.price }}</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- 商品不存在 -->
      <div v-else-if="!productStore.isLoading && !product" class="not-found">
        <el-empty description="商品不存在或已被删除" />
        <div class="error-actions">
          <el-button type="primary" @click="$router.push('/products')">返回商品列表</el-button>
          <el-button @click="handleRetry">重新加载</el-button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useProductStore } from '@/stores/products'
import { useCartStore } from '@/stores/cart'
import { ElMessage } from 'element-plus'

import { 
  ShoppingBag, ChatDotRound, Star, Share, ShoppingCart
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const productStore = useProductStore()
const cartStore = useCartStore()

const currentImage = ref('')

// 获取当前商品
const product = computed(() => productStore.currentProduct)

// 获取相关商品
const relatedProducts = computed(() => {
  if (!product.value) return []
  
  return productStore.products
    .filter(p => p.id !== product.value!.id && p.category === product.value!.category)
    .slice(0, 4)
})

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    available: '在售',
    sold: '已售',
    reserved: '预定中'
  }
  return statusMap[status] || '未知'
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 获取图片URL，处理base64和普通URL
const getImageUrl = (imageUrl: string) => {
  if (!imageUrl) {
    return '/src/assets/default-product.jpg'
  }
  
  // 如果是base64数据URL，直接返回
  if (imageUrl.startsWith('data:')) {
    return imageUrl
  }
  
  // 如果是相对路径，添加基础路径
  if (imageUrl.startsWith('/')) {
    return imageUrl
  }
  
  // 如果是普通URL，直接返回
  return imageUrl
}

// 联系卖家
const handleContactSeller = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后再联系卖家')
    router.push('/login')
    return
  }
  
  if (!product.value) {
    ElMessage.error('商品信息不存在')
    return
  }
  
  try {
    console.log('联系卖家，商品ID:', product.value.id, '卖家ID:', product.value.sellerId)
    
    // 跳转到消息页面，并传递参数
    router.push(`/messages?sellerId=${product.value.sellerId}&productId=${product.value.id}`)
  } catch (error) {
    console.error('联系卖家失败:', error)
    ElMessage.error('操作失败，请重试')
  }
}

// 添加到收藏
const handleAddToFavorites = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后再收藏商品')
    router.push('/login')
    return
  }
  
  if (!product.value) {
    ElMessage.error('商品信息不存在')
    return
  }
  
  try {
    console.log('处理收藏操作，商品ID:', product.value.id)
    
    // 检查是否已收藏
    const isCurrentlyFavorited = userStore.isFavorited(product.value.id)
    console.log('当前收藏状态:', isCurrentlyFavorited)
    
    let result
    if (isCurrentlyFavorited) {
      // 如果已收藏，则取消收藏
      result = await userStore.removeFromFavorites(product.value.id)
      if (result.success) {
        ElMessage.success('已取消收藏')
      }
    } else {
      // 如果未收藏，则添加收藏
      result = await userStore.addToFavorites(product.value.id)
      if (result.success) {
        ElMessage.success('收藏成功')
      } else {
        ElMessage.error(result.message || '收藏失败')
      }
    }
    
    console.log('收藏操作结果:', result)
  } catch (error) {
    console.error('收藏操作失败:', error)
    ElMessage.error('操作失败，请重试')
  }
}

// 加入购物车
const handleAddToCart = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后再添加商品到购物车')
    router.push('/login')
    return
  }
  
  if (!product.value) {
    ElMessage.error('商品信息不存在')
    return
  }
  
  try {
    console.log('添加商品到购物车，商品ID:', product.value.id)
    
    // 调用购物车store的添加方法
    const result = await cartStore.addToCart(product.value.id)
    
    if (result) {
      ElMessage.success('商品已成功添加到购物车')
    } else {
      ElMessage.error('添加失败，请重试')
    }
    
    console.log('添加购物车操作结果:', result)
  } catch (error) {
    console.error('添加购物车失败:', error)
    ElMessage.error('操作失败，请重试')
  }
}

// 加入购物车
// 分享商品
const handleShare = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: product.value?.title,
        text: product.value?.description,
        url: window.location.href
      })
    } catch (error) {
      console.log('分享取消')
    }
  } else {
    // 复制链接到剪贴板
    await navigator.clipboard.writeText(window.location.href)
    ElMessage.success('链接已复制到剪贴板')
  }
}

// 重新加载商品详情
const handleRetry = async () => {
  const productId = route.params.id as string
  if (productId) {
    await productStore.fetchProductDetail(productId)
    if (product.value && product.value.images.length > 0) {
      currentImage.value = product.value.images[0]
    }
  }
}

onMounted(async () => {
  await userStore.initUser()
  
  const productId = route.params.id as string
  if (productId) {
    await productStore.fetchProductDetail(productId)
    if (product.value && product.value.images.length > 0) {
      currentImage.value = product.value.images[0]
    }
  }
})
</script>

<style scoped>
.product-detail-view {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 头部样式 */
.header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header .container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.logo {
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
  cursor: pointer;
}

.logo .el-icon {
  margin-right: 8px;
}

/* 主要内容 */
.main-content {
  padding: 20px 0;
}

/* 商品详情 */
.product-detail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 40px;
}

/* 商品图库 */
.product-gallery {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.main-image {
  width: 100%;
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f7fa;
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-list {
  display: flex;
  gap: 8px;
  overflow-x: auto;
}

.thumbnail {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.3s;
}

.thumbnail.active {
  border-color: #409eff;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 商品信息 */
.product-info {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: nowrap;
  min-width: 0; /* 允许子元素溢出时被截断 */
}

.product-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0; /* 允许文本溢出时被截断 */
}

.product-status {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.product-status.available {
  background: #f0f9ff;
  color: #409eff;
}

.product-status.sold {
  background: #fef0f0;
  color: #f56c6c;
}

.product-status.reserved {
  background: #fdf6ec;
  color: #e6a23c;
}

.product-price {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.current-price {
  font-size: 32px;
  font-weight: bold;
  color: #f56c6c;
}

.original-price {
  font-size: 18px;
  color: #909399;
  text-decoration: line-through;
}

.discount {
  background: #f56c6c;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
}

.product-meta {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.meta-item {
  display: flex;
  justify-content: space-between;
}

.meta-item .label {
  color: #606266;
  font-weight: 500;
}

.meta-item .value {
  color: #303133;
}

.product-description h3,
.seller-info h3 {
  font-size: 18px;
  color: #303133;
  margin-bottom: 12px;
}

.product-description p {
  color: #606266;
  line-height: 1.6;
}

/* 卖家信息 */
.seller-card {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.seller-details h4 {
  margin: 0 0 8px 0;
  color: #303133;
}

.contact-info {
  color: #409eff;
  font-weight: 500;
  margin-bottom: 8px;
}

.join-date {
  color: #909399;
  font-size: 14px;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
}

.action-buttons .el-button {
  flex: 1;
  min-width: 120px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 500;
}

/* 相关商品 */
.related-products {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 20px;
  color: #303133;
  margin-bottom: 20px;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.related-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.related-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.related-image {
  height: 120px;
  overflow: hidden;
}

.related-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.related-info {
  padding: 12px;
}

.related-info h4 {
  font-size: 14px;
  margin: 0 0 8px 0;
  color: #303133;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.related-price {
  font-size: 16px;
  font-weight: bold;
  color: #f56c6c;
  margin: 0;
}

/* 商品不存在 */
.not-found {
  text-align: center;
  padding: 60px 0;
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
}

/* 收藏按钮样式 */
.is-favorited {
  color: #e6a23c;
  animation: favorite-pulse 0.3s ease;
}

@keyframes favorite-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

@media (max-width: 768px) {
  .product-detail {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 20px;
  }
  
  .main-image {
    height: 300px;
  }
  
  .product-header {
    flex-direction: row;
    align-items: center;
    flex-wrap: nowrap;
    gap: 12px;
    min-width: 0;
  }
  
  .product-title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 18px;
    min-width: 0;
    flex-shrink: 1; /* 允许标题在必要时缩小 */
  }
  
  .product-status {
    font-size: 12px;
    padding: 3px 8px;
    flex-shrink: 0; /* 状态标签不缩小 */
  }
  
  .product-meta {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .related-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .related-grid {
    grid-template-columns: 1fr;
  }
  
  .header .container {
    flex-direction: column;
    height: auto;
    padding: 16px 20px;
    gap: 16px;
  }
}
</style>