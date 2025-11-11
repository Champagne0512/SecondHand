<template>
  <div class="transaction-create-view">
    <div class="container">
      <div class="header">
        <h1>创建交易</h1>
        <el-button @click="$router.back()" type="primary" text>
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
      </div>

      <div class="content" v-loading="isLoading">
        <!-- 商品信息 -->
        <div class="product-section" v-if="product">
          <h2>商品信息</h2>
          <div class="product-card">
            <div class="product-image">
              <img :src="getImageUrl(product.images[0])" :alt="product.title" />
            </div>
            <div class="product-details">
              <h3>{{ product.title }}</h3>
              <p class="price">¥{{ product.price }}</p>
              <p class="seller">卖家: {{ product.sellerName }}</p>
              <p class="condition">成色: {{ product.condition }}</p>
            </div>
          </div>
        </div>

        <!-- 交易信息 -->
        <div class="transaction-section">
          <h2>交易信息</h2>
          <el-form :model="transactionForm" :rules="rules" ref="formRef" label-width="120px">
            <el-form-item label="购买数量" prop="quantity">
              <el-input-number 
                v-model="transactionForm.quantity" 
                :min="1" 
                :max="product?.quantity || 1"
                controls-position="right"
              />
              <span class="quantity-hint">库存: {{ product?.quantity || 1 }}件</span>
            </el-form-item>

            <el-form-item label="总金额">
              <span class="total-amount">¥{{ totalAmount }}</span>
            </el-form-item>

            <el-form-item label="收货地址" prop="address">
              <el-input 
                v-model="transactionForm.address" 
                placeholder="请输入收货地址"
                type="textarea"
                :rows="3"
              />
            </el-form-item>

            <el-form-item label="联系电话" prop="phone">
              <el-input 
                v-model="transactionForm.phone" 
                placeholder="请输入联系电话"
              />
            </el-form-item>

            <el-form-item label="备注信息" prop="notes">
              <el-input 
                v-model="transactionForm.notes" 
                placeholder="请输入备注信息（可选）"
                type="textarea"
                :rows="2"
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" size="large" @click="handleCreateTransaction" :loading="isCreating">
                确认创建交易
              </el-button>
              <el-button @click="$router.back()" size="large">取消</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useProductStore } from '@/stores/products'
import { useTransactionStore } from '@/stores/transaction'
import { getCurrentUserId } from '@/utils/auth'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()
const transactionStore = useTransactionStore()

const formRef = ref<FormInstance>()
const isLoading = ref(false)
const isCreating = ref(false)
const product = ref<any>(null)

// 交易表单
const transactionForm = ref({
  quantity: 1,
  address: '',
  phone: '',
  notes: ''
})

// 表单验证规则
const rules: FormRules = {
  quantity: [
    { required: true, message: '请输入购买数量', trigger: 'blur' },
    { type: 'number', min: 1, message: '数量不能小于1', trigger: 'blur' }
  ],
  address: [
    { required: true, message: '请输入收货地址', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ]
}

// 计算总金额
const totalAmount = computed(() => {
  if (!product.value) return 0
  return product.value.price * transactionForm.value.quantity
})

// 获取图片URL
const getImageUrl = (imageUrl: string) => {
  if (!imageUrl) {
    return '/src/assets/default-product.jpg'
  }
  
  if (imageUrl.startsWith('data:')) {
    return imageUrl
  }
  
  if (imageUrl.startsWith('/')) {
    return imageUrl
  }
  
  return imageUrl
}

// 创建交易
const handleCreateTransaction = async () => {
  if (!formRef.value) return
  
  try {
    const valid = await formRef.value.validate()
    if (!valid) return
    
    if (!product.value) {
      ElMessage.error('商品信息不存在')
      return
    }
    
    // 检查是否是卖家自己
    const currentUserId = await getCurrentUserId()
    if (product.value.sellerId === currentUserId) {
      ElMessage.warning('不能购买自己的商品')
      return
    }
    
    isCreating.value = true
    
    // 创建交易数据
    const transactionData = {
      product_id: product.value.id,
      quantity: transactionForm.value.quantity,
      notes: transactionForm.value.notes,
      shipping_address: transactionForm.value.address
    }
    
    console.log('创建交易数据:', transactionData)
    
    // 调用API创建交易
    const transaction = await transactionStore.createTransaction(transactionData)
    
    if (transaction) {
      ElMessage.success('交易创建成功')
      // 跳转到支付页面
      router.push({
        path: `/transactions/${transaction.id}/payment`
      })
    } else {
      ElMessage.error('交易创建失败')
    }
    
  } catch (error: any) {
    console.error('创建交易失败:', error)
    
    if (error.message && error.message.includes('invalid input syntax for type uuid')) {
      ElMessage.error('用户ID格式错误，请重新登录')
    } else {
      ElMessage.error('交易创建失败，请重试')
    }
  } finally {
    isCreating.value = false
  }
}

// 加载商品信息
const loadProduct = async () => {
  const productId = route.query.productId as string
  if (!productId) {
    ElMessage.error('商品ID不存在')
    router.back()
    return
  }
  
  try {
    isLoading.value = true
    
    // 获取商品详情
    await productStore.fetchProductDetail(productId)
    product.value = productStore.currentProduct
    
    if (!product.value) {
      ElMessage.error('商品不存在')
      router.back()
      return
    }
    
    // 检查商品状态
    if (product.value.status !== 'available') {
      ElMessage.warning('该商品当前不可购买')
      router.back()
      return
    }
    
    // 设置默认数量
    const quantity = parseInt(route.query.quantity as string) || 1
    transactionForm.value.quantity = Math.min(quantity, product.value.quantity || 1)
    
  } catch (error) {
    console.error('加载商品信息失败:', error)
    ElMessage.error('加载商品信息失败')
    router.back()
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadProduct()
})
</script>

<style scoped>
.transaction-create-view {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 20px 0;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header h1 {
  margin: 0;
  color: #303133;
  font-size: 24px;
}

.content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.product-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.product-section h2 {
  margin-bottom: 20px;
  color: #303133;
  font-size: 18px;
}

.product-card {
  display: flex;
  gap: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.product-image {
  width: 120px;
  height: 120px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-details {
  flex: 1;
}

.product-details h3 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 16px;
}

.price {
  font-size: 20px;
  font-weight: bold;
  color: #f56c6c;
  margin: 10px 0;
}

.seller, .condition {
  color: #606266;
  margin: 5px 0;
}

.transaction-section h2 {
  margin-bottom: 20px;
  color: #303133;
  font-size: 18px;
}

.quantity-hint {
  margin-left: 10px;
  color: #909399;
  font-size: 14px;
}

.total-amount {
  font-size: 24px;
  font-weight: bold;
  color: #f56c6c;
}

.el-form {
  max-width: 600px;
}

.el-form-item {
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .container {
    padding: 0 15px;
  }
  
  .header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .product-card {
    flex-direction: column;
    text-align: center;
  }
  
  .product-image {
    width: 100%;
    height: 200px;
  }
}
</style>