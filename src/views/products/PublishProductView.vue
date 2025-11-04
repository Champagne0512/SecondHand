<template>
  <div class="publish-product-view">
    <!-- 全局导航组件 -->
    <GlobalNavigation />

    <!-- 主要内容 -->
    <main class="main-content">
      <div class="container" v-loading="userStore.isLoading">
        <!-- 快速发布模板 -->
        <div class="quick-templates" v-if="!productForm.title && !productForm.description">
          <h3 class="templates-title">快速发布模板</h3>
          <div class="template-grid">
            <div 
              v-for="template in quickTemplates" 
              :key="template.name"
              class="template-card"
              @click="applyTemplate(template)"
            >
              <div class="template-icon">
                <el-icon size="32">
                  <component :is="template.icon" />
                </el-icon>
              </div>
              <div class="template-name">{{ template.name }}</div>
              <div class="template-desc">一键应用常用设置</div>
            </div>
          </div>
        </div>
        
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
import { ref, reactive, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useProductStore } from '@/stores/products'
import GlobalNavigation from '@/components/GlobalNavigation.vue'
import { ShoppingBag, Plus, Delete, ZoomIn, Iphone, Notebook, Basketball } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
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

// 快速发布模板
const quickTemplates = [
  {
    name: '电子产品',
    icon: Iphone,
    category: 'electronics',
    condition: '轻微使用',
    description: '功能完好，无维修记录，配件齐全。'
  },
  {
    name: '教材书籍',
    icon: Notebook,
    category: 'books',
    condition: '轻微使用',
    description: '保存完好，无严重涂写，适合学习使用。'
  },
  {
    name: '服装鞋帽',
    icon: ShoppingBag,
    category: 'clothing',
    condition: '轻微使用',
    description: '款式时尚，保存完好，无明显磨损。'
  },
  {
    name: '运动器材',
    icon: Basketball,
    category: 'sports',
    condition: '明显使用',
    description: '功能正常，适合运动使用，有使用痕迹。'
  }
]

// 应用快速模板
const applyTemplate = (template: typeof quickTemplates[0]) => {
  ElMessageBox.confirm(
    `确定要应用「${template.name}」模板吗？这将自动填写部分表单信息。`,
    '应用模板',
    {
      confirmButtonText: '应用',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    productForm.category = template.category
    productForm.condition = template.condition
    if (!productForm.description) {
      productForm.description = template.description
    }
    ElMessage.success(`已应用${template.name}模板`)
  }).catch(() => {
    // 用户取消
  })
}

// 表单验证规则
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

// 监听价格变化
watch([() => productForm.price, () => productForm.originalPrice], ([newPrice, newOriginalPrice]) => {
  if (newOriginalPrice && newPrice && newOriginalPrice <= newPrice) {
    ElMessage.warning('售价应该低于原价，否则折扣功能没有意义哦')
  }
})

// 压缩图片函数
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
    console.log('图片上传处理:', uploadFile)
    
    if (!uploadFile.raw) {
      console.warn('上传文件没有raw属性')
      return
    }

    // 验证文件
    if (!validateImageFile(uploadFile.raw)) {
      // 移除无效文件
      const index = imageList.value.findIndex(file => file.uid === uploadFile.uid)
      if (index !== -1) {
        imageList.value.splice(index, 1)
      }
      return
    }

    // 压缩图片
    console.log('开始压缩图片...')
    const compressedDataUrl = await compressImage(uploadFile.raw)
    console.log('图片压缩完成')

    // 更新上传文件的URL为压缩后的版本
    uploadFile.url = compressedDataUrl
    
    // 更新文件列表
    imageList.value = uploadFiles.map(file => {
      if (file.uid === uploadFile.uid) {
        return { ...file, url: compressedDataUrl }
      }
      return file
    })
    
    // 更新产品图片数组 - 这里需要同时保存原始文件和压缩后的数据URL
    productImages.value = imageList.value.map(file => {
      // 保存原始文件用于上传到Supabase
      return file.raw as File
    })
    
    console.log('图片处理完成，当前图片数量:', productImages.value.length)
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
  console.log('移除图片:', uploadFile.name)
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

// 发布商品
const handlePublish = async () => {
  if (!productFormRef.value) return

  console.log('开始发布商品流程')
  
  try {
    // 表单验证
    const valid = await productFormRef.value.validate()
    if (!valid) {
      ElMessage.error('请完善所有必填信息')
      return
    }
    
    console.log('表单验证通过')
    
    // 检查是否上传了图片
    if (productImages.value.length === 0) {
      ElMessage.warning('请至少上传一张商品图片')
      return
    }
    
    console.log('图片检查通过，数量:', productImages.value.length)
    
    // 显示确认对话框
    const confirmResult = await ElMessageBox.confirm(
      '确定要发布这个商品吗？发布后其他用户将可以看到您的商品信息。',
      '发布确认',
      {
        confirmButtonText: '确定发布',
        cancelButtonText: '取消',
        type: 'info',
        distinguishCancelAndClose: true
      }
    ).catch(() => {
      console.log('用户取消发布')
      return false
    })
    
    if (!confirmResult) {
      ElMessage.info('已取消发布')
      return
    }
    
    console.log('用户确认发布')
    
    // 准备表单数据
    const formData = {
      ...productForm,
      images: productImages.value
    }
    
    console.log('开始调用发布API')
    
    // 发布商品
    const result = await productStore.publishProduct(formData)
    
    console.log('发布结果:', result)
    
    if (result.success) {
      ElMessage.success({
        message: result.message || '商品发布成功！',
        duration: 3000
      })
      
      // 清空表单
      resetForm()
      
      // 显示发布成功提示
      await ElMessageBox.alert(
        '🎉 商品发布成功！\n\n您的商品已经上架，其他用户现在可以看到并联系您。\n\n小提示：\n• 保持联系方式畅通\n• 及时回复买家消息\n• 可以分享到社交平台增加曝光',
        '发布成功',
        {
          confirmButtonText: '查看商品',
          type: 'success',
          center: true,
          showClose: false
        }
      )
      
      // 跳转到商品详情页
      console.log('跳转到商品详情页:', result.product.id)
      router.push(`/products/${result.product.id}`)
    } else {
      ElMessage.error({
        message: result.message || '商品发布失败',
        duration: 5000
      })
    }
  } catch (error) {
    console.error('发布商品失败:', error)
    ElMessage.error({
      message: '发布过程中出现错误，请重试',
      duration: 5000
    })
  }
}

// 重置表单
const resetForm = () => {
  if (productFormRef.value) {
    productFormRef.value.resetFields()
  }
  
  // 重置表单数据
  Object.assign(productForm, {
    title: '',
    description: '',
    category: '',
    condition: '轻微使用',
    price: 0,
    originalPrice: undefined,
    location: '',
    contactInfo: ''
  })
  
  // 清空图片
  imageList.value = []
  productImages.value = []
  
  // 清除本地存储的草稿
  localStorage.removeItem('productDraft')
}

// 保存草稿
const saveDraft = () => {
  const draft = {
    form: { ...productForm },
    images: imageList.value.map(file => ({
      name: file.name,
      url: file.url
    })),
    timestamp: new Date().toISOString()
  }
  
  localStorage.setItem('productDraft', JSON.stringify(draft))
  ElMessage.success('草稿已自动保存')
}

// 加载草稿
const loadDraft = () => {
  try {
    const draftStr = localStorage.getItem('productDraft')
    if (draftStr) {
      const draft = JSON.parse(draftStr)
      
      // 恢复表单数据
      if (draft.form) {
        Object.assign(productForm, draft.form)
      }
      
      // 恢复图片列表（注意：图片文件需要重新上传）
      if (draft.images && draft.images.length > 0) {
        ElMessage.info('检测到草稿，但图片需要重新上传')
      }
      
      ElMessage.success('草稿已恢复')
    }
  } catch (error) {
    console.error('加载草稿失败:', error)
  }
}

// 取消发布
const handleCancel = async () => {
  try {
    // 检查是否有未保存的内容
    const hasContent = productForm.title || productForm.description || productImages.value.length > 0
    
    if (hasContent) {
      const result = await ElMessageBox.confirm(
        '您有未发布的内容，确定要放弃吗？系统会自动保存为草稿。',
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
      
      // 自动保存草稿
      saveDraft()
    }
    
    router.push('/products')
  } catch (error) {
    console.error('取消发布失败:', error)
    router.push('/products')
  }
}

onMounted(async () => {
  console.log('发布商品页面开始初始化')
  try {
    // 确保用户状态已初始化
    if (!userStore.isLoggedIn) {
      console.log('用户未登录，尝试初始化用户状态')
      // 尝试初始化用户状态
      const initialized = await userStore.initUser()
      console.log('用户状态初始化结果:', initialized)
      if (!initialized) {
        ElMessage.warning('请先登录后再发布商品')
        router.push('/login')
        return
      }
    }
    
    // 加载草稿
    loadDraft()
    
    console.log('发布商品页面初始化完成')
    
    // 设置自动保存草稿（每30秒）
    const autoSaveInterval = setInterval(() => {
      const hasContent = productForm.title || productForm.description || productImages.value.length > 0
      if (hasContent) {
        saveDraft()
      }
    }, 30000)
    
    // 页面卸载时清除定时器
    const cleanup = () => {
      clearInterval(autoSaveInterval)
    }
    
    // 监听页面卸载事件
    window.addEventListener('beforeunload', cleanup)
    
    // 组件卸载时清理
    onUnmounted(() => {
      cleanup()
      window.removeEventListener('beforeunload', cleanup)
    })
    
  } catch (error) {
    console.error('页面初始化失败:', error)
    ElMessage.error('页面加载失败，请刷新重试')
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

/* 快速模板样式 */
.quick-templates {
  margin-bottom: 20px;
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.templates-title {
  font-size: 18px;
  color: #303133;
  margin-bottom: 16px;
  font-weight: 600;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.template-card {
  background: #f8f9fa;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.template-card:hover {
  border-color: #409eff;
  background: #f0f7ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.template-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s;
}

.template-card:hover::before {
  left: 100%;
}

.template-icon {
  font-size: 32px;
  margin-bottom: 8px;
  display: block;
}

.template-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.template-desc {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
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