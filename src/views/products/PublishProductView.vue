<template>
  <div class="publish-product-view">
    <!-- 全局导航组件 -->
    <GlobalNavigation />

    <!-- 主要内容 -->
    <main class="main-content">
      <div class="container">
        <div class="publish-card">
          <el-form
            ref="productFormRef"
            :model="productForm"
            :rules="productRules"
            label-width="120px"
            class="product-form"
          >
            <!-- 商品基本信息 -->
            <section class="form-section">
              <h2 class="section-title">商品基本信息</h2>
              
              <el-form-item label="商品标题" prop="title">
                <el-input
                  v-model="productForm.title"
                  placeholder="请输入商品标题"
                  maxlength="50"
                  show-word-limit
                />
              </el-form-item>

              <el-form-item label="商品描述" prop="description">
                <el-input
                  v-model="productForm.description"
                  type="textarea"
                  :rows="4"
                  placeholder="请详细描述商品信息，包括使用情况、瑕疵等"
                  maxlength="500"
                  show-word-limit
                />
              </el-form-item>

              <el-form-item label="商品分类" prop="category">
                <el-select v-model="productForm.category" placeholder="请选择分类">
                  <el-option 
                    v-for="category in categories" 
                    :key="category.id" 
                    :label="category.name" 
                    :value="category.id"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="商品成色" prop="condition">
                <el-radio-group v-model="productForm.condition">
                  <el-radio label="全新">全新</el-radio>
                  <el-radio label="几乎全新">几乎全新</el-radio>
                  <el-radio label="轻微使用">轻微使用</el-radio>
                  <el-radio label="明显使用">明显使用</el-radio>
                </el-radio-group>
              </el-form-item>
            </section>

            <!-- 价格信息 -->
            <section class="form-section">
              <h2 class="section-title">价格信息</h2>
              
              <el-form-item label="售价" prop="price">
                <el-input-number
                  v-model="productForm.price"
                  :min="0"
                  :precision="2"
                  placeholder="请输入售价"
                />
                <span class="unit">元</span>
              </el-form-item>

              <el-form-item label="原价">
                <el-input-number
                  v-model="productForm.originalPrice"
                  :min="0"
                  :precision="2"
                  placeholder="请输入原价（可选）"
                />
                <span class="unit">元</span>
              </el-form-item>
            </section>

            <!-- 图片上传 -->
            <section class="form-section">
              <h2 class="section-title">商品图片</h2>
              
              <el-form-item label="商品图片" prop="images">
                <el-upload
                  v-model:file-list="imageList"
                  action="#"
                  list-type="picture-card"
                  :auto-upload="false"
                  :limit="5"
                  :on-exceed="handleExceed"
                  :on-change="handleImageChange"
                  :on-remove="handleImageRemove"
                >
                  <el-icon><Plus /></el-icon>
                  <div class="upload-text">
                    <div>点击上传</div>
                    <div class="upload-tip">最多5张图片</div>
                  </div>
                </el-upload>
                <div class="upload-tips">
                  <p>• 建议上传清晰、真实的商品图片</p>
                  <p>• 第一张图片将作为封面图</p>
                  <p>• 支持 JPG、PNG 格式，每张不超过 5MB</p>
                </div>
              </el-form-item>
            </section>

            <!-- 联系信息 -->
            <section class="form-section">
              <h2 class="section-title">联系信息</h2>
              
              <el-form-item label="所在位置" prop="location">
                <el-input
                  v-model="productForm.location"
                  placeholder="例如：计算机学院、图书馆附近等"
                />
              </el-form-item>

              <el-form-item label="联系方式" prop="contactInfo">
                <el-input
                  v-model="productForm.contactInfo"
                  placeholder="例如：微信xxx、电话xxx、QQxxx等"
                />
                <div class="contact-tips">
                  <p>请提供有效的联系方式，方便买家联系您</p>
                </div>
              </el-form-item>
            </section>

            <!-- 操作按钮 -->
            <section class="form-actions">
              <el-button size="large" @click="handleCancel">取消</el-button>
              <el-button 
                type="primary" 
                size="large" 
                :loading="productStore.isLoading"
                @click="handlePublish"
              >
                发布商品
              </el-button>
            </section>
          </el-form>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useProductStore } from '@/stores/products'
import { ShoppingBag, Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules, UploadProps, UploadUserFile } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const productStore = useProductStore()

const productFormRef = ref<FormInstance>()

// 商品表单数据
const productForm = reactive({
  title: '',
  description: '',
  category: '',
  condition: '轻微使用',
  price: 0,
  originalPrice: undefined as number | undefined,
  location: '',
  contactInfo: ''
})

// 图片上传相关
const imageList = ref<UploadUserFile[]>([])
const productImages = ref<File[]>([])

// 分类数据
const categories = ref([
  { id: 'electronics', name: '电子产品' },
  { id: 'books', name: '学习资料' },
  { id: 'clothing', name: '服装鞋帽' },
  { id: 'sports', name: '运动器材' },
  { id: 'daily', name: '生活用品' },
  { id: 'others', name: '其他物品' }
])

// 表单验证规则
const productRules: FormRules = {
  title: [
    { required: true, message: '请输入商品标题', trigger: 'blur' },
    { min: 3, max: 50, message: '标题长度在 3 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入商品描述', trigger: 'blur' },
    { min: 10, max: 500, message: '描述长度在 10 到 500 个字符', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择商品分类', trigger: 'change' }
  ],
  condition: [
    { required: true, message: '请选择商品成色', trigger: 'change' }
  ],
  price: [
    { required: true, message: '请输入商品价格', trigger: 'blur' },
    { type: 'number', min: 0, message: '价格不能为负数', trigger: 'blur' }
  ],
  location: [
    { required: true, message: '请输入所在位置', trigger: 'blur' }
  ],
  contactInfo: [
    { required: true, message: '请输入联系方式', trigger: 'blur' }
  ]
}

// 图片上传处理
const handleImageChange: UploadProps['onChange'] = (uploadFile, uploadFiles) => {
  imageList.value = uploadFiles
  productImages.value = uploadFiles.map(file => file.raw as File)
}

const handleImageRemove: UploadProps['onRemove'] = (uploadFile, uploadFiles) => {
  imageList.value = uploadFiles
  productImages.value = uploadFiles.map(file => file.raw as File)
}

const handleExceed: UploadProps['onExceed'] = () => {
  ElMessage.warning('最多只能上传5张图片')
}

// 发布商品
const handlePublish = async () => {
  if (!productFormRef.value) return

  try {
    await productFormRef.value.validate()
    
    // 检查是否上传了图片
    if (productImages.value.length === 0) {
      ElMessage.warning('请至少上传一张商品图片')
      return
    }
    
    const formData = {
      ...productForm,
      images: productImages.value
    }
    
    const result = await productStore.publishProduct(formData)
    
    if (result.success) {
      ElMessage.success(result.message)
      router.push(`/products/${result.product.id}`)
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    console.error('发布商品失败:', error)
  }
}

// 取消发布
const handleCancel = () => {
  router.push('/products')
}

onMounted(async () => {
  await userStore.initUser()
  
  // 如果用户未登录，跳转到登录页
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后再发布商品')
    router.push('/login')
  }
})
</script>

<style scoped>
.publish-product-view {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.container {
  max-width: 800px;
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

.page-title h1 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

/* 主要内容 */
.main-content {
  padding: 20px 0;
}

.publish-card {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 表单部分 */
.form-section {
  margin-bottom: 40px;
  padding-bottom: 32px;
  border-bottom: 1px solid #e4e7ed;
}

.form-section:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
}

.section-title {
  font-size: 18px;
  color: #303133;
  margin-bottom: 24px;
  font-weight: 600;
}

/* 单位样式 */
.unit {
  margin-left: 8px;
  color: #606266;
}

/* 上传组件样式 */
.upload-text {
  text-align: center;
  color: #606266;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.upload-tips {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.upload-tips p {
  margin: 2px 0;
}

.contact-tips {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

/* 操作按钮 */
.form-actions {
  text-align: center;
  margin-top: 40px;
  padding-top: 32px;
  border-top: 1px solid #e4e7ed;
}

.form-actions .el-button {
  min-width: 120px;
  margin: 0 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .publish-card {
    padding: 24px;
    margin: 0 -20px;
    border-radius: 0;
  }
  
  .header .container {
    flex-direction: column;
    height: auto;
    padding: 16px 20px;
    gap: 16px;
  }
  
  .page-title {
    order: -1;
  }
  
  .product-form :deep(.el-form-item__label) {
    width: 100px !important;
  }
  
  .product-form :deep(.el-form-item__content) {
    margin-left: 100px !important;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 0 16px;
  }
  
  .publish-card {
    padding: 20px 16px;
  }
  
  .product-form :deep(.el-form-item__label) {
    width: 80px !important;
  }
  
  .product-form :deep(.el-form-item__content) {
    margin-left: 80px !important;
  }
  
  .form-actions .el-button {
    width: 100%;
    margin: 8px 0;
  }
}
</style>