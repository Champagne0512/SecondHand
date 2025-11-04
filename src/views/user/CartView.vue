<template>
  <div class="cart-view">
    <!-- 页面头部 -->
    <div class="cart-header">
      <div class="header-content">
        <h1 class="page-title">
          <el-icon><ShoppingCart /></el-icon>
          我的购物车
        </h1>
        <div class="header-stats">
          <span class="item-count">{{ cartStore.totalItems }} 件商品</span>
          <span class="total-amount">总计: ¥{{ cartStore.totalAmount.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <!-- 购物车内容 -->
    <div class="cart-content">
      <!-- 空购物车状态 -->
      <div v-if="cartStore.isEmpty" class="empty-cart">
        <div class="empty-icon">
          <el-icon><ShoppingCart /></el-icon>
        </div>
        <h3>购物车空空如也</h3>
        <p>快去逛逛，发现心仪的商品吧！</p>
        <el-button type="primary" size="large" @click="$router.push('/')">
          去逛逛
        </el-button>
      </div>

      <!-- 购物车商品列表 -->
      <div v-else class="cart-items">
        <!-- 操作工具栏 -->
        <div class="cart-toolbar">
          <div class="toolbar-left">
            <el-checkbox 
              v-model="selectAll" 
              @change="handleSelectAll"
              :indeterminate="isIndeterminate"
            >
              全选
            </el-checkbox>
          </div>
          <div class="toolbar-right">
            <el-button 
              type="danger" 
              size="small" 
              :disabled="selectedItems.length === 0"
              @click="handleBatchRemove"
            >
              批量删除
            </el-button>
            <el-button 
              type="primary" 
              size="small" 
              @click="handleClearCart"
            >
              清空购物车
            </el-button>
          </div>
        </div>

        <!-- 商品列表 -->
        <div class="items-list">
          <div 
            v-for="item in cartStore.cartItems" 
            :key="item.id"
            class="cart-item"
          >
            <div class="item-select">
              <el-checkbox 
                v-model="selectedItems" 
                :label="item.product_id"
              />
            </div>
            
            <div class="item-image">
              <el-image 
                :src="item.images[0]" 
                :alt="item.title"
                fit="cover"
                class="product-image"
                @click="$router.push(`/product/${item.product_id}`)"
              >
                <template #error>
                  <div class="image-error">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
            </div>
            
            <div class="item-info">
              <h4 class="item-title" @click="$router.push(`/product/${item.product_id}`)">
                {{ item.title }}
              </h4>
              <p class="item-description">{{ item.description }}</p>
              <div class="item-meta">
                <span class="condition">{{ item.condition }}</span>
                <span class="location">{{ item.location }}</span>
                <span class="seller">卖家: {{ item.seller_username }}</span>
              </div>
            </div>
            
            <div class="item-price">
              <div class="current-price">¥{{ item.price.toFixed(2) }}</div>
              <div v-if="item.original_price" class="original-price">
                ¥{{ item.original_price.toFixed(2) }}
              </div>
            </div>
            
            <div class="item-quantity">
              <el-input-number
                v-model="item.quantity"
                :min="1"
                :max="99"
                size="small"
                @change="(val) => handleQuantityChange(item.product_id, val)"
              />
            </div>
            
            <div class="item-subtotal">
              <div class="subtotal">¥{{ item.subtotal.toFixed(2) }}</div>
            </div>
            
            <div class="item-actions">
              <el-button 
                type="danger" 
                size="small" 
                link
                @click="handleRemoveItem(item.product_id)"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>

        <!-- 结算栏 -->
        <div class="cart-footer">
          <div class="footer-left">
            <el-checkbox 
              v-model="selectAll" 
              @change="handleSelectAll"
              :indeterminate="isIndeterminate"
            >
              全选 ({{ selectedItems.length }})
            </el-checkbox>
            <el-button 
              type="danger" 
              size="small" 
              :disabled="selectedItems.length === 0"
              @click="handleBatchRemove"
            >
              删除选中
            </el-button>
          </div>
          
          <div class="footer-right">
            <div class="total-info">
              <span class="selected-count">已选 {{ selectedItems.length }} 件商品</span>
              <span class="selected-amount">
                合计: ¥{{ selectedAmount.toFixed(2) }}
              </span>
            </div>
            <el-button 
              type="primary" 
              size="large" 
              :disabled="selectedItems.length === 0"
              @click="handleCheckout"
              class="checkout-btn"
            >
              立即结算
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="cartStore.isLoading" class="loading-overlay">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ShoppingCart, 
  Picture, 
  Loading 
} from '@element-plus/icons-vue'

const router = useRouter()
const cartStore = useCartStore()

// 选中的商品ID列表
const selectedItems = ref<string[]>([])

// 计算属性
const selectAll = computed({
  get: () => selectedItems.value.length === cartStore.cartItems.length && cartStore.cartItems.length > 0,
  set: (value) => {
    if (value) {
      selectedItems.value = cartStore.cartItems.map(item => item.product_id)
    } else {
      selectedItems.value = []
    }
  }
})

const isIndeterminate = computed(() => 
  selectedItems.value.length > 0 && selectedItems.value.length < cartStore.cartItems.length
)

const selectedAmount = computed(() => {
  return cartStore.cartItems
    .filter(item => selectedItems.value.includes(item.product_id))
    .reduce((total, item) => total + item.subtotal, 0)
})

// 生命周期
onMounted(async () => {
  await cartStore.fetchCartItems()
})

// 事件处理
const handleSelectAll = (value: boolean) => {
  if (value) {
    selectedItems.value = cartStore.cartItems.map(item => item.product_id)
  } else {
    selectedItems.value = []
  }
}

const handleQuantityChange = async (productId: string, quantity: number) => {
  await cartStore.updateCartItem(productId, quantity)
}

const handleRemoveItem = async (productId: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这个商品吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await cartStore.removeFromCart(productId)
    
    // 从选中列表中移除
    const index = selectedItems.value.indexOf(productId)
    if (index > -1) {
      selectedItems.value.splice(index, 1)
    }
  } catch (error) {
    // 用户取消删除
  }
}

const handleBatchRemove = async () => {
  if (selectedItems.value.length === 0) {
    ElMessage.warning('请选择要删除的商品')
    return
  }
  
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedItems.value.length} 件商品吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await cartStore.batchRemoveFromCart(selectedItems.value)
    selectedItems.value = []
  } catch (error) {
    // 用户取消删除
  }
}

const handleClearCart = async () => {
  try {
    await ElMessageBox.confirm('确定要清空购物车吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await cartStore.clearCart()
    selectedItems.value = []
  } catch (error) {
    // 用户取消清空
  }
}

const handleCheckout = () => {
  if (selectedItems.value.length === 0) {
    ElMessage.warning('请选择要结算的商品')
    return
  }
  
  // 这里可以跳转到结算页面
  ElMessage.info('结算功能开发中...')
  // router.push('/checkout')
}
</script>

<style scoped>
.cart-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: calc(100vh - 160px);
}

/* 页面头部 */
.cart-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 30px;
  color: white;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.item-count, .total-amount {
  font-size: 16px;
  font-weight: 600;
}

/* 空购物车状态 */
.empty-cart {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 80px;
  color: #dcdfe6;
  margin-bottom: 20px;
}

.empty-cart h3 {
  font-size: 24px;
  color: #606266;
  margin-bottom: 12px;
}

.empty-cart p {
  color: #909399;
  margin-bottom: 30px;
}

/* 购物车商品列表 */
.cart-items {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 操作工具栏 */
.cart-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
  background: #f8f9fa;
}

.toolbar-left, .toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 商品列表 */
.items-list {
  padding: 0;
}

.cart-item {
  display: flex;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
  transition: background-color 0.3s;
}

.cart-item:hover {
  background-color: #f8f9fa;
}

.cart-item:last-child {
  border-bottom: none;
}

.item-select {
  width: 60px;
  display: flex;
  justify-content: center;
}

.item-image {
  width: 100px;
  height: 100px;
  margin-right: 20px;
}

.product-image {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.3s;
}

.product-image:hover {
  transform: scale(1.05);
}

.image-error {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 8px;
  color: #c0c4cc;
}

.item-info {
  flex: 1;
  margin-right: 20px;
}

.item-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
  cursor: pointer;
  transition: color 0.3s;
}

.item-title:hover {
  color: #409eff;
}

.item-description {
  color: #606266;
  font-size: 14px;
  margin: 0 0 12px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.condition, .location, .seller {
  padding: 2px 8px;
  background: #f5f7fa;
  border-radius: 4px;
}

.item-price {
  width: 120px;
  text-align: center;
  margin-right: 20px;
}

.current-price {
  font-size: 18px;
  font-weight: 600;
  color: #f56c6c;
}

.original-price {
  font-size: 14px;
  color: #c0c4cc;
  text-decoration: line-through;
}

.item-quantity {
  width: 120px;
  margin-right: 20px;
}

.item-subtotal {
  width: 100px;
  text-align: center;
  margin-right: 20px;
}

.subtotal {
  font-size: 16px;
  font-weight: 600;
  color: #f56c6c;
}

.item-actions {
  width: 80px;
  text-align: center;
}

/* 结算栏 */
.cart-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-top: 1px solid #ebeef5;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.total-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.selected-count {
  font-size: 14px;
  color: #606266;
}

.selected-amount {
  font-size: 20px;
  font-weight: 600;
  color: #f56c6c;
}

.checkout-btn {
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 600;
}

/* 加载状态 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-icon {
  font-size: 40px;
  color: #409eff;
  margin-bottom: 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .cart-view {
    padding: 10px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .header-stats {
    align-items: center;
  }
  
  .cart-item {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .item-select {
    order: 1;
  }
  
  .item-image {
    order: 2;
  }
  
  .item-info {
    order: 3;
    flex: 100%;
    margin-right: 0;
  }
  
  .item-price {
    order: 4;
  }
  
  .item-quantity {
    order: 5;
  }
  
  .item-subtotal {
    order: 6;
  }
  
  .item-actions {
    order: 7;
  }
  
  .cart-footer {
    flex-direction: column;
    gap: 16px;
  }
  
  .footer-right {
    flex-direction: column;
    gap: 12px;
  }
}
</style>