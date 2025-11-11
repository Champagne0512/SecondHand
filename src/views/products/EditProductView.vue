<template>
  <div class="edit-product-view">
    <!-- 主要内容 -->
    <main class="main-content">
      <div class="container" v-loading="isLoading">
        <div class="edit-card">
          <div class="page-header">
            <h1 class="page-title">编辑商品</h1>
            <p class="page-subtitle">修改商品信息，让您的商品更吸引人</p>
          </div>
          
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
                <div v-if="discountInfo.show" class="discount-info">
                  <el-tag type="success" size="small">
                    💰 节省 ¥{{ discountInfo.savings }} ({{ discountInfo.discount }}% off)
                  </el-tag>
                </div>
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
                  :on-preview="handlePictureCardPreview"
                  :before-remove="handleRemoveConfirm"
                  accept="image/*"
                  drag
                >
                  <el-icon><Plus /></el-icon>
                  <div class="upload-text">
                    <div>点击或拖拽上传</div>
                    <div class="upload-tip">最多5张图片</div>
                  </div>
                </el-upload>
                
                <!-- 图片预览对话框 -->
                <el-dialog v-model="dialogVisible" title="图片预览" width="60%">
                  <img w-full :src="dialogImageUrl" alt="Preview Image" style="width: 100%; max-height: 80vh; object-fit: contain;" />
                </el-dialog>
                
                <div class="upload-tips">
                  <p>• 建议上传清晰、真实的商品图片</p>
                  <p>• 第一张图片将作为封面图</p>
                  <p>• 支持 JPG、PNG、GIF 格式，每张不超过 5MB</p>
                  <p>• 图片将自动压缩以优化加载速度</p>
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
                type="danger" 
                size="large" 
                @click="handleDelete"
                :loading="isDeleting"
              >
                删除商品
              </el-button>
              <el-button 
                type="primary" 
                size="large" 
                :loading="isLoading"
                @click="handleUpdate"
              >
                保存修改
              </el-button>
            </section>
          </el-form>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useProductStore } from '@/stores/products'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules, UploadProps, UploadUserFile } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const productStore = useProductStore()

const productFormRef = ref<FormInstance>()
const isLoading = ref(false)
const isDeleting = ref(false)

// 商品ID
const productId = ref('')

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
const productImages = ref<(File | string)[]>([])

// 分类数据
const categories = ref([
  { id: 'electronics', name: '电子产品' },
  { id: 'books', name: '学习资料' },
  { id: 'clothing', name: '服装鞋帽' },
  { id: 'sports', name: '运动器材' },
  { id: 'daily', name: '生活用品' },
  { id: 'others', name: '其他物品' }
])

// 表单验证规则（与发布页面相同）
const productRules: FormRules = {
  title: [
    { required: true, message: '请输入商品标题', trigger: 'blur' },
    { min: 3, max: 50, message: '标题长度在 3 到 50 个字符', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (!value || value.trim().length < 3) {
          callback(new Error('标题至少需要3个字符'))
        } else if (/^\d+$/.test(value.trim())) {
          callback(new Error('标题不能只有数字'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  description: [
    { required: true, message: '请输入商品描述', trigger: 'blur' },
    { min: 10, max: 500, message: '描述长度在 10 到 500 个字符', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!value || value.trim().length < 10) {
          callback(new Error('商品描述至少需要10个字符'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  category: [
    { required: true, message: '请选择商品分类', trigger: 'change' }
  ],
  condition: [
    { required: true, message: '请选择商品成色', trigger: 'change' }
  ],
  price: [
    { required: true, message: '请输入商品价格', trigger: 'blur' },
    { type: 'number', min: 0, message: '价格不能为负数', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!value || value <= 0) {
          callback(new Error('价格必须大于0'))
        } else if (value > 99999) {
          callback(new Error('价格不能超过99999元'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  location: [
    { required: true, message: '请输入所在位置', trigger: 'blur' },
    { min: 2, max: 50, message: '位置信息长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  contactInfo: [
    { required: true, message: '请输入联系方式', trigger: 'blur' },
    { min: 2, max: 100, message: '联系方式长度在 2 到 100 个字符', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!value || !value.trim()) {
          callback(new Error('请输入有效的联系方式'))
        } else if (!/[一-龥a-zA-Z0-9@.+]/.test(value)) {
          callback(new Error('联系方式格式不正确'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 图片预览相关
const dialogImageUrl = ref('')
const dialogVisible = ref(false)

// 价格计算相关
const discountInfo = computed(() => {
  if (productForm.originalPrice && productForm.price && productForm.originalPrice > productForm.price) {
    const discount = Math.round((1 - productForm.price / productForm.originalPrice) * 100)
    const savings = productForm.originalPrice - productForm.price
    return {
      discount,
      savings: savings.toFixed(2),
      show: true
    }
  }
  return { show: false }
})

// 压缩图片函数（与发布页面相同）
const compressImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas context not available'))
          return
        }

        let { width, height } = img
        
        // 计算缩放比例
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width *= ratio
          height *= ratio
        }

        canvas.width = width
        canvas.height = height

        // 绘制压缩后的图片
        ctx.drawImage(img, 0, 0, width, height)

        // 转换为base64
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedDataUrl)
      }
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

// 验证图片文件
const validateImageFile = (file: File): boolean => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }
  return true
}

// 图片上传处理
const handleImageChange: UploadProps['onChange'] = async (uploadFile, uploadFiles) => {
  try {
    if (!uploadFile.raw) {
      console.warn('上传文件没有raw属性')
      return
    }

    // 验证文件
    if (!validateImageFile(uploadFile.raw)) {
      const index = imageList.value.findIndex(file => file.uid === uploadFile.uid)
      if (index !== -1) {
        imageList.value.splice(index, 1)
      }
      return
    }

    // 压缩图片
    const compressedDataUrl = await compressImage(uploadFile.raw)

    // 更新上传文件的URL为压缩后的版本
    uploadFile.url = compressedDataUrl
    
    // 更新文件列表
    imageList.value = uploadFiles.map(file => {
      if (file.uid === uploadFile.uid) {
        return { ...file, url: compressedDataUrl }
      }
      return file
    })
    
    // 更新产品图片数组
    productImages.value = imageList.value.map(file => {
      return file.raw as File
    })
    
  } catch (error) {
    console.error('图片处理失败:', error)
    ElMessage.error('图片处理失败，请重试')
    
    // 移除处理失败的文件
    const index = imageList.value.findIndex(file => file.uid === uploadFile.uid)
    if (index !== -1) {
      imageList.value.splice(index, 1)
    }
  }
}

const handleImageRemove: UploadProps['onRemove'] = (uploadFile, uploadFiles) => {
  imageList.value = uploadFiles
  productImages.value = uploadFiles.map(file => file.raw as File).filter(Boolean)
}

const handleExceed: UploadProps['onExceed'] = () => {
  ElMessage.warning('最多只能上传5张图片')
}

// 图片预览
const handlePictureCardPreview: UploadProps['onPreview'] = (uploadFile) => {
  dialogImageUrl.value = uploadFile.url!
  dialogVisible.value = true
}

// 删除图片确认
const handleRemoveConfirm = (uploadFile: UploadUserFile) => {
  return ElMessageBox.confirm(
    `确定要删除图片 "${uploadFile.name}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
}

// 加载商品数据
const loadProductData = async () => {
  isLoading.value = true
  try {
    // 从路由参数获取商品ID
    productId.value = route.params.id as string
    
    if (!productId.value) {
      ElMessage.error('商品ID不存在')
      router.push('/profile')
      return
    }

    // 获取商品详情
    await productStore.fetchProductDetail(productId.value)
    
    if (!productStore.currentProduct) {
      ElMessage.error('商品不存在')
      router.push('/profile')
      return
    }

    // 检查权限：只能编辑自己的商品
    if (productStore.currentProduct.sellerId !== userStore.user?.id) {
      ElMessage.error('您无权编辑此商品')
      router.push('/profile')
      return
    }

    // 填充表单数据
    const product = productStore.currentProduct
    Object.assign(productForm, {
      title: product.title,
      description: product.description,
      category: product.category,
      condition: product.condition,
      price: product.price,
      originalPrice: product.originalPrice,
      location: product.location,
      contactInfo: product.contactInfo
    })

    // 填充图片数据
    if (product.images && product.images.length > 0) {
      imageList.value = product.images.map((url: string, index: number) => ({
        name: `image-${index}.jpg`,
        url: url
      }))
      // 清空新上传的图片数组，保留原有图片URL
      productImages.value = []
    }

  } catch (error) {
    console.error('加载商品数据失败:', error)
    ElMessage.error('加载商品数据失败')
    router.push('/profile')
  } finally {
    isLoading.value = false
  }
}

// 更新商品
const handleUpdate = async () => {
  if (!productFormRef.value) return

  try {
    // 表单验证
    const valid = await productFormRef.value.validate()
    if (!valid) {
      ElMessage.error('请完善所有必填信息')
      return
    }

    // 检查是否至少有一张图片（新上传的或原有的）
    if (productImages.value.length === 0 && (!productStore.currentProduct || !productStore.currentProduct.images || productStore.currentProduct.images.length === 0)) {
      ElMessage.warning('请至少上传一张商品图片')
      return
    }

    // 显示确认对话框
    const confirmResult = await ElMessageBox.confirm(
      '确定要保存修改吗？修改后其他用户将看到更新后的商品信息。',
      '保存确认',
      {
        confirmButtonText: '确定保存',
        cancelButtonText: '取消',
        type: 'info',
        distinguishCancelAndClose: true
      }
    ).catch(() => false)

    if (!confirmResult) {
      ElMessage.info('已取消保存')
      return
    }

    isLoading.value = true

    // 准备更新数据
    const updateData = {
      ...productForm,
      // 将图片数据传递给store处理，store会正确处理新旧图片的混合
      images: productImages.value
    }

    // 调用更新商品API
    const result = await productStore.updateProduct(productId.value, updateData)
    
    if (result.success) {
      ElMessage.success(result.message)
      
      // 显示更新成功提示
      await ElMessageBox.alert(
        '✅ 商品信息更新成功！\n\n您的商品信息已经更新，其他用户现在可以看到最新的商品信息。',
        '更新成功',
        {
          confirmButtonText: '查看商品',
          type: 'success',
          center: true,
          showClose: false
        }
      )
      
      // 跳转到商品详情页
      router.push(`/products/${productId.value}`)
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    console.error('更新商品失败:', error)
    ElMessage.error('更新过程中出现错误，请重试')
  } finally {
    isLoading.value = false
  }
}

// 删除商品
const handleDelete = async () => {
  try {
    isDeleting.value = true
    
    await ElMessageBox.confirm(
      `确定要删除商品 "${productForm.title}" 吗？此操作不可恢复！`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    // 调用删除商品API
    const result = await productStore.deleteProduct(productId.value)
    
    if (result.success) {
      ElMessage.success(result.message)
      
      // 显示删除成功提示
      await ElMessageBox.alert(
        '🗑️ 商品删除成功！\n\n您的商品已经从平台中删除，其他用户将无法再看到此商品。',
        '删除成功',
        {
          confirmButtonText: '返回个人中心',
          type: 'success',
          center: true,
          showClose: false
        }
      )
      
      // 跳转到个人中心
      router.push('/profile')
    } else {
      ElMessage.error(result.message)
    }
  } catch {
    // 用户取消删除
  } finally {
    isDeleting.value = false
  }
}

// 取消编辑
const handleCancel = async () => {
  try {
    // 检查是否有未保存的修改
    const hasChanges = imageList.value.length > 0 || 
      productForm.title || 
      productForm.description || 
      productForm.price > 0
    
    if (hasChanges) {
      const result = await ElMessageBox.confirm(
        '您有未保存的修改，确定要放弃吗？',
        '放弃确认',
        {
          confirmButtonText: '确定放弃',
          cancelButtonText: '继续编辑',
          type: 'warning',
          distinguishCancelAndClose: true
        }
      ).catch(() => false)
      
      if (!result) {
        return
      }
    }
    
    router.push('/profile')
  } catch (error) {
    console.error('取消编辑失败:', error)
    router.push('/profile')
  }
}

onMounted(async () => {
  try {
    // 确保用户状态已初始化
    if (!userStore.isLoggedIn) {
      const initialized = await userStore.initUser()
      if (!initialized) {
        ElMessage.warning('请先登录后再编辑商品')
        router.push('/login')
        return
      }
    }
    
    // 加载商品数据
    await loadProductData()
    
  } catch (error) {
    console.error('页面初始化失败:', error)
    ElMessage.error('页面加载失败，请刷新重试')
  }
})
</script>

<style scoped>
.edit-product-view {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 页面头部 */
.page-header {
  text-align: center;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e4e7ed;
}

.page-title {
  font-size: 28px;
  color: #303133;
  margin-bottom: 8px;
  font-weight: 600;
}

.page-subtitle {
  color: #606266;
  font-size: 16px;
  margin: 0;
}

/* 主要内容 */
.main-content {
  padding: 20px 0;
}

.edit-card {
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
  line-height: 1.6;
}

.upload-tips p {
  margin: 2px 0;
}

.contact-tips {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

/* 图片上传区域样式优化 */
:deep(.el-upload--picture-card) {
  background-color: #f8f9fa;
  border: 2px dashed #d9d9d9;
  transition: all 0.3s ease;
}

:deep(.el-upload--picture-card:hover) {
  border-color: #409eff;
  background-color: #f0f7ff;
}

:deep(.el-upload-dragger) {
  padding: 20px;
}

:deep(.el-upload-list--picture-card .el-upload-list__item) {
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

:deep(.el-upload-list--picture-card .el-upload-list__item:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:deep(.el-upload-list--picture-card .el-upload-list__item-thumbnail) {
  object-fit: cover;
  width: 100%;
  height: 100%;
}

/* 图片预览对话框样式 */
:deep(.el-dialog__body) {
  padding: 20px;
  text-align: center;
}

/* 拖拽上传激活状态 */
:deep(.el-upload-dragger.is-dragover) {
  background-color: #f0f7ff;
  border-color: #409eff;
}

/* 折扣信息样式 */
.discount-info {
  margin-top: 8px;
  display: flex;
  align-items: center;
}

:deep(.el-tag) {
  font-weight: 500;
}

/* 操作按钮 */
.form-actions {
  text-align: center;
  margin-top: 40px;
  padding-top: 32px;
  border-top: 1px solid #e4e7ed;
  display: flex;
  justify-content: center;
  gap: 16px;
}

.form-actions .el-button {
  min-width: 120px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .edit-card {
    padding: 24px;
    margin: 0 -20px;
    border-radius: 0;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 12px;
  }
  
  .form-actions .el-button {
    width: 100%;
    margin: 4px 0;
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
  
  .edit-card {
    padding: 20px 16px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .product-form :deep(.el-form-item__label) {
    width: 80px !important;
  }
  
  .product-form :deep(.el-form-item__content) {
    margin-left: 80px !important;
  }
}
</style>