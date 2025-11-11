<template>
  <div class="profile-view">
    <!-- 主要内容 -->
    <main class="main-content">
      <div class="container">
        <div class="profile-layout">
          <!-- 侧边栏 -->
          <aside class="sidebar">
            <div class="user-card">
              <div class="user-avatar">
                <el-avatar :size="80" :src="userStore.userInfo?.avatar" />
              </div>
              <div class="user-info">
                <h3>{{ userStore.userInfo?.username }}</h3>
                <p class="user-email">{{ userStore.userInfo?.email }}</p>
                <p class="user-join-date">加入时间: {{ formatDate(userStore.userInfo?.createdAt || '') }}</p>
              </div>
            </div>
            
            <nav class="side-nav">
              <el-menu
                :default-active="activeTab"
                @select="handleMenuSelect"
                class="nav-menu"
              >
                <el-menu-item index="profile">
                  <el-icon><User /></el-icon>
                  <span>个人信息</span>
                </el-menu-item>
                <el-menu-item index="my-products">
                  <el-icon><Goods /></el-icon>
                  <span>我的发布</span>
                </el-menu-item>
                <el-menu-item index="favorites">
                  <el-icon><Star /></el-icon>
                  <span>我的收藏</span>
                </el-menu-item>
                <el-menu-item index="my-posts">
                  <el-icon><ChatDotRound /></el-icon>
                  <span>我的动态</span>
                </el-menu-item>
                <el-menu-item index="messages">
                  <el-icon><Message /></el-icon>
                  <span>消息中心</span>
                </el-menu-item>
                <el-menu-item index="my-transactions">
                  <el-icon><ShoppingBag /></el-icon>
                  <span>我的交易</span>
                </el-menu-item>
                <el-menu-item index="credit">
                  <el-icon><Medal /></el-icon>
                  <span>信用详情</span>
                </el-menu-item>
                
                <!-- 管理员入口 -->
                <el-menu-item v-if="userStore.isAdmin" index="admin" @click="goToAdminPanel">
                  <el-icon><Setting /></el-icon>
                  <span>管理员面板</span>
                </el-menu-item>
              </el-menu>
            </nav>
          </aside>

          <!-- 内容区域 -->
          <div class="content">
            <!-- 个人信息 -->
            <section v-if="activeTab === 'profile'" class="tab-content">
              <h2 class="tab-title">个人信息</h2>
              
              <el-form
                ref="profileFormRef"
                :model="profileForm"
                :rules="profileRules"
                label-width="100px"
                class="profile-form"
              >
                <el-form-item label="用户名" prop="username">
                  <el-input v-model="profileForm.username" />
                </el-form-item>
                
                <el-form-item label="邮箱" prop="email">
                  <el-input v-model="profileForm.email" disabled />
                </el-form-item>
                
                <el-form-item label="手机号" prop="phone">
                  <el-input v-model="profileForm.phone" placeholder="请输入手机号" />
                </el-form-item>
                
                <el-form-item label="头像">
                  <el-upload
                    action="#"
                    :show-file-list="false"
                    :before-upload="beforeAvatarUpload"
                  >
                    <el-avatar :size="100" :src="profileForm.avatar" />
                    <template #tip>
                      <div class="avatar-tip">点击头像更换</div>
                    </template>
                  </el-upload>
                </el-form-item>
                
                <el-form-item>
                  <el-button type="primary" @click="handleSaveProfile">保存修改</el-button>
                  <el-button @click="handleResetForm">重置</el-button>
                </el-form-item>
              </el-form>
            </section>

            <!-- 我的发布 -->
            <section v-else-if="activeTab === 'my-products'" class="tab-content">
              <div class="tab-header">
                <h2 class="tab-title">我的发布</h2>
                <el-button type="primary" @click="$router.push('/products/publish')">
                  <el-icon><Plus /></el-icon>
                  发布新商品
                </el-button>
              </div>
              
              <div v-if="myProducts.length > 0" class="products-list">
                <div 
                  v-for="product in myProducts" 
                  :key="product.id"
                  class="product-item"
                >
                  <div class="product-image" @click="$router.push(`/products/${product.id}`)">
                    <img :src="product.images[0] || '/src/assets/default-product.jpg'" :alt="product.title" />
                    <div class="product-status" :class="product.status">
                      {{ getStatusText(product.status) }}
                    </div>
                  </div>
                  
                  <div class="product-info">
                    <h4 @click="$router.push(`/products/${product.id}`)">{{ product.title }}</h4>
                    <p class="product-price">¥{{ product.price }}</p>
                    <p class="product-time">{{ formatDate(product.createdAt) }}</p>
                  </div>
                  
                  <div class="product-actions">
                    <el-button size="small" @click="handleEditProduct(product)">编辑</el-button>
                    <el-button size="small" type="danger" @click="handleDeleteProduct(product)">删除</el-button>
                  </div>
                </div>
              </div>
              
              <div v-else class="empty-state">
                <el-empty description="暂无发布的商品" />
                <el-button type="primary" @click="$router.push('/products/publish')">
                  去发布第一个商品
                </el-button>
              </div>
            </section>

            <!-- 我的收藏 -->
            <section v-else-if="activeTab === 'favorites'" class="tab-content">
              <h2 class="tab-title">我的收藏</h2>
              
              <div v-if="favoriteProducts.length > 0" class="products-grid">
                <div 
                  v-for="product in favoriteProducts" 
                  :key="product.id"
                  class="product-card"
                  @click="$router.push(`/products/${product.id}`)"
                >
                  <div class="product-image">
                    <img :src="product.images[0] || '/src/assets/default-product.jpg'" :alt="product.title" />
                  </div>
                  <div class="product-info">
                    <h4>{{ product.title }}</h4>
                    <p class="product-price">¥{{ product.price }}</p>
                  </div>
                </div>
              </div>
              
              <div v-else class="empty-state">
                <el-empty description="暂无收藏的商品" />
              </div>
            </section>

            <!-- 我的动态 -->
            <section v-else-if="activeTab === 'my-posts'" class="tab-content">
              <div class="tab-header">
                <h2 class="tab-title">我的动态</h2>
                <el-button type="primary" @click="$router.push('/campus/posts')">
                  <el-icon><Plus /></el-icon>
                  发布新动态
                </el-button>
              </div>
              
              <div v-if="myPosts.length > 0" class="posts-list">
                <div 
                  v-for="post in myPosts" 
                  :key="post.id"
                  class="post-item"
                >
                  <div class="post-content">
                    <div class="post-header">
                      <div class="post-info">
                        <span class="post-type" :class="post.type">
                          {{ getPostTypeLabel(post.type) }}
                        </span>
                        <span class="post-time">{{ formatDate(post.createdAt) }}</span>
                      </div>
                      <div class="post-actions">
                        <el-button size="small" @click="handleEditPost(post)">编辑</el-button>
                        <el-button size="small" type="danger" @click="handleDeletePost(post)">删除</el-button>
                      </div>
                    </div>
                    
                    <p class="post-text">{{ post.content }}</p>
                    
                    <!-- 图片展示 -->
                    <div v-if="post.images && post.images.length > 0" class="post-images">
                      <el-image
                        v-for="(image, index) in post.images"
                        :key="index"
                        :src="image"
                        :preview-src-list="post.images"
                        :initial-index="index"
                        fit="cover"
                        class="post-image"
                      />
                    </div>
                    
                    <!-- 互动信息 -->
                    <div class="post-stats">
                      <span class="likes">❤️ {{ post.likes }} 点赞</span>
                      <span class="comments">💬 {{ post.comments }} 评论</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div v-else class="empty-state">
                <el-empty description="暂无发布的动态" />
                <el-button type="primary" @click="$router.push('/campus/posts')">
                  去发布第一条动态
                </el-button>
              </div>
            </section>

            <!-- 消息中心 -->
            <section v-else-if="activeTab === 'messages'" class="tab-content">
              <div class="tab-header">
                <h2 class="tab-title">消息中心</h2>
                <el-button @click="$router.push('/messages')">查看全部消息</el-button>
              </div>
              
              <div class="messages-preview">
                <p>您有 {{ unreadCount }} 条未读消息</p>
                <el-button type="primary" @click="$router.push('/messages')">
                  查看消息详情
                </el-button>
              </div>
            </section>

            <!-- 我的交易 -->
            <section v-else-if="activeTab === 'my-transactions'" class="tab-content">
              <div class="tab-header">
                <h2 class="tab-title">我的交易</h2>
                <el-button type="primary" @click="$router.push('/transactions')">
                  查看全部交易
                </el-button>
              </div>
              
              <!-- 交易统计 -->
              <div class="transaction-stats">
                <div class="stat-card">
                  <div class="stat-icon pending">
                    <el-icon><Clock /></el-icon>
                  </div>
                  <div class="stat-content">
                    <span class="stat-value">{{ pendingTransactions.length }}</span>
                    <span class="stat-label">待处理</span>
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon active">
                    <el-icon><TrendCharts /></el-icon>
                  </div>
                  <div class="stat-content">
                    <span class="stat-value">{{ activeTransactions.length }}</span>
                    <span class="stat-label">进行中</span>
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon completed">
                    <el-icon><CircleCheck /></el-icon>
                  </div>
                  <div class="stat-content">
                    <span class="stat-value">{{ completedTransactions.length }}</span>
                    <span class="stat-label">已完成</span>
                  </div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon total">
                    <el-icon><Document /></el-icon>
                  </div>
                  <div class="stat-content">
                    <span class="stat-value">{{ totalTransactions }}</span>
                    <span class="stat-label">总交易</span>
                  </div>
                </div>
              </div>
              
              <!-- 交易列表 -->
              <div v-if="recentTransactions.length > 0" class="transactions-preview">
                <h3 class="preview-title">最近交易</h3>
                <div class="transactions-list">
                  <div 
                    v-for="transaction in recentTransactions" 
                    :key="transaction.id"
                    class="transaction-item"
                    @click="viewTransactionDetail(transaction.id)"
                  >
                    <div class="transaction-image">
                      <el-image 
                        :src="transaction.product_image" 
                        :alt="transaction.product_name"
                        fit="cover"
                        class="product-image"
                      >
                        <template #error>
                          <div class="image-error">
                            <el-icon><Picture /></el-icon>
                          </div>
                        </template>
                      </el-image>
                    </div>
                    
                    <div class="transaction-info">
                      <h4 class="product-name">{{ transaction.product_name }}</h4>
                      <p class="transaction-meta">
                        <span class="order-no">订单号: {{ transaction.order_no }}</span>
                        <span class="amount">¥{{ transaction.total_amount.toFixed(2) }}</span>
                      </p>
                      <p class="counterparty">
                        {{ isBuyer(transaction) ? '卖家' : '买家' }}: 
                        {{ isBuyer(transaction) ? transaction.seller_username : transaction.buyer_username }}
                      </p>
                      <p class="create-time">{{ formatTime(transaction.created_at) }}</p>
                    </div>
                    
                    <div class="transaction-status">
                      <el-tag 
                        :type="getTransactionStatusType(transaction.status)"
                        class="status-tag"
                      >
                        {{ getTransactionStatusText(transaction.status) }}
                      </el-tag>
                      <el-button 
                        v-if="showTransactionAction(transaction)"
                        :type="getTransactionActionType(transaction)"
                        size="small"
                        @click.stop="handleTransactionAction(transaction)"
                      >
                        {{ getTransactionActionText(transaction) }}
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div v-else class="empty-state">
                <el-empty description="暂无交易记录" />
                <el-button type="primary" @click="$router.push('/products')">
                  去逛逛商品
                </el-button>
              </div>
            </section>

            <!-- 信用详情 -->
            <section v-else-if="activeTab === 'credit'" class="tab-content">
              <div class="tab-header">
                <h2 class="tab-title">信用详情</h2>
                <el-button type="primary" @click="$router.push('/credit')">
                  查看详细信用报告
                </el-button>
              </div>
              
              <div class="credit-overview">
                <div class="credit-score-card">
                  <div class="score-display">
                    <div class="score-circle">
                      <span class="score-value">{{ creditScore || 100 }}</span>
                      <span class="score-label">信用分</span>
                    </div>
                  </div>
                  <div class="score-info">
                    <h3>信用等级: {{ getCreditLevel(creditScore || 100) }}</h3>
                    <p>交易评价: {{ positiveReviews || 0 }} 好评 / {{ totalReviews || 0 }} 总评价</p>
                    <p>好评率: {{ getPositiveRate() }}%</p>
                  </div>
                </div>
                
                <div class="credit-stats">
                  <div class="stat-item">
                    <span class="stat-label">完成交易</span>
                    <span class="stat-value">{{ completedTransactionsCount || 0 }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">好评率</span>
                    <span class="stat-value">{{ getPositiveRate() }}%</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">响应速度</span>
                    <span class="stat-value">{{ responseSpeed || '良好' }}</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useProductStore } from '@/stores/products'
import { useCampusStore } from '@/stores/campus'
import { useTransactionStore } from '@/stores/transaction'
import { supabaseProductApi } from '@/api/supabase'
import { supabase } from '@/lib/supabase'

import { 
  ShoppingBag, User, Goods, Star, 
  ChatDotRound, Plus, Message, Medal, Setting,
  Clock, TrendCharts, CircleCheck, Document, Picture
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules, UploadProps } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const productStore = useProductStore()
const campusStore = useCampusStore()
const transactionStore = useTransactionStore()

const activeTab = ref('profile')
const profileFormRef = ref<FormInstance>()

// 个人信息表单
const profileForm = reactive({
  username: '',
  email: '',
  phone: '',
  avatar: ''
})

// 表单验证规则
const profileRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 1, max: 20, message: '用户名长度在 1 到 20 个字符', trigger: 'blur' }
  ]
}

// 我的商品
const myProducts = computed(() => {
  if (!userStore.userInfo) return []
  return productStore.products.filter(p => p.sellerId === userStore.userInfo!.id)
})

// 我的动态
const myPosts = computed(() => {
  if (!userStore.userInfo) return []
  return campusStore.campusPosts.filter(post => post.userId === userStore.userInfo!.id)
})

// 获取我的商品
const fetchMyProducts = async () => {
  try {
    const result = await supabaseProductApi.getMyProducts()
    if (result) {
      // 转换数据格式
      const transformedProducts = result.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        price: item.price,
        originalPrice: item.original_price,
        category: item.category,
        images: item.images,
        condition: item.condition,
        sellerId: item.seller_id,
        sellerName: userStore.userInfo?.username || '我',
        sellerAvatar: userStore.userInfo?.avatar_url,
        status: item.status,
        location: item.location,
        contactInfo: item.contact_info,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        viewCount: item.view_count || 0,
        likeCount: item.like_count || 0
      }))
      
      // 更新到store中
      productStore.products = transformedProducts
    }
  } catch (error) {
    console.error('获取我的商品失败:', error)
    ElMessage.error('获取商品列表失败')
  }
}

// 获取我的动态
const fetchMyPosts = async () => {
  try {
    await campusStore.getCampusPosts(50) // 获取更多动态以便筛选
  } catch (error) {
    console.error('获取动态失败:', error)
    ElMessage.error('获取动态列表失败')
  }
}

// 收藏商品（模拟数据）
const favoriteProducts = computed(() => {
  return productStore.products.slice(0, 3) // 模拟收藏
})

// 未读消息数（模拟数据）
const unreadCount = ref(3)

// 信用相关数据
const creditScore = ref(100)
const positiveReviews = ref(0)
const totalReviews = ref(0)
const completedTransactionsCount = ref(0)
const responseSpeed = ref('良好')

// 交易相关计算属性
const pendingTransactions = computed(() => transactionStore.pendingTransactions)
const activeTransactions = computed(() => transactionStore.activeTransactions)
const completedTransactions = computed(() => transactionStore.completedTransactions)
const totalTransactions = computed(() => transactionStore.totalTransactions)
const recentTransactions = computed(() => transactionStore.transactions.slice(0, 5))

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    available: '在售',
    sold: '已售',
    reserved: '预定中'
  }
  return statusMap[status] || '未知'
}

// 获取动态类型标签
const getPostTypeLabel = (type: string) => {
  const labelMap: Record<string, string> = {
    text: '文字',
    image: '图片',
    trade: '交易',
    event: '活动',
    help: '求助'
  }
  return labelMap[type] || type
}

// 获取信用等级
const getCreditLevel = (score: number) => {
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 70) return '一般'
  if (score >= 60) return '及格'
  return '较差'
}

// 计算好评率
const getPositiveRate = () => {
  if (totalReviews.value === 0) return 100
  return Math.round((positiveReviews.value / totalReviews.value) * 100)
}

// 获取信用数据
const fetchCreditData = async () => {
  try {
    // 模拟获取信用数据
    // 实际项目中应该调用API获取真实数据
    creditScore.value = 95
    positiveReviews.value = 12
    totalReviews.value = 13
    completedTransactions.value = 15
    responseSpeed.value = '良好'
  } catch (error) {
    console.error('获取信用数据失败:', error)
  }
}

// 获取我的交易数据
const fetchMyTransactions = async () => {
  try {
    await transactionStore.fetchTransactions()
  } catch (error) {
    console.error('获取交易数据失败:', error)
    ElMessage.error('获取交易列表失败')
  }
}

// 交易相关方法
const isBuyer = (transaction: any) => {
  return userStore.user?.id === transaction.buyer_id
}

const getTransactionStatusType = (status: string) => {
  const typeMap: Record<string, any> = {
    'pending': 'warning',
    'paid': 'primary',
    'shipped': 'info',
    'received': 'success',
    'completed': 'success',
    'cancelled': 'danger',
    'refunding': 'warning',
    'refunded': 'info'
  }
  return typeMap[status] || 'info'
}

const getTransactionStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    'pending': '待付款',
    'paid': '已付款',
    'shipped': '已发货',
    'received': '已收货',
    'completed': '已完成',
    'cancelled': '已取消',
    'refunding': '退款中',
    'refunded': '已退款'
  }
  return textMap[status] || status
}

const showTransactionAction = (transaction: any) => {
  const isBuyerTransaction = isBuyer(transaction)
  
  if (isBuyerTransaction) {
    return ['pending', 'paid', 'shipped'].includes(transaction.status)
  } else {
    return ['paid'].includes(transaction.status)
  }
}

const getTransactionActionType = (transaction: any) => {
  const isBuyerTransaction = isBuyer(transaction)
  
  if (isBuyerTransaction) {
    if (transaction.status === 'pending') return 'primary'
    if (transaction.status === 'shipped') return 'success'
    return 'primary'
  } else {
    return 'primary'
  }
}

const getTransactionActionText = (transaction: any) => {
  const isBuyerTransaction = isBuyer(transaction)
  
  if (isBuyerTransaction) {
    switch (transaction.status) {
      case 'pending': return '去付款'
      case 'shipped': return '确认收货'
      default: return '查看'
    }
  } else {
    return '发货'
  }
}

const viewTransactionDetail = (transactionId: string) => {
  router.push(`/transaction/${transactionId}`)
}

const handleTransactionAction = async (transaction: any) => {
  const isBuyerTransaction = isBuyer(transaction)
  
  try {
    if (isBuyerTransaction) {
      switch (transaction.status) {
        case 'pending':
          // 跳转到支付页面
          router.push(`/transaction/${transaction.id}/payment`)
          break
        case 'shipped':
          // 确认收货
          await transactionStore.updateTransactionStatus(transaction.id, 'received', '买家确认收货')
          break
      }
    } else {
      // 卖家发货
      if (transaction.status === 'paid') {
        await transactionStore.updateTransactionStatus(transaction.id, 'shipped', '卖家已发货')
      }
    }
  } catch (error) {
    console.error('处理交易操作失败:', error)
  }
}

const formatTime = (timeString: string) => {
  return new Date(timeString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 菜单选择
const handleMenuSelect = async (index: string) => {
  activeTab.value = index
  
  // 根据选择的标签页加载相应的数据
  if (index === 'my-products') {
    await fetchMyProducts()
  } else if (index === 'my-posts') {
    await fetchMyPosts()
  } else if (index === 'my-transactions') {
    await fetchMyTransactions()
  } else if (index === 'credit') {
    await fetchCreditData()
  }
}

// 头像上传
const beforeAvatarUpload: UploadProps['beforeUpload'] = async (rawFile) => {
  try {
    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(rawFile.type)) {
      ElMessage.error('只支持 JPG、PNG、GIF、WebP 格式的图片')
      return false
    }
    
    // 验证文件大小（5MB）
    const maxSize = 5 * 1024 * 1024
    if (rawFile.size > maxSize) {
      ElMessage.error('图片大小不能超过 5MB')
      return false
    }
    
    // 显示上传中提示
    ElMessage.info('头像上传中...')
    
    // 上传头像到Supabase
    const avatarUrl = await userStore.uploadAvatar(rawFile)
    
    // 更新表单中的头像URL
    profileForm.avatar = avatarUrl
    
    // 立即保存到数据库
    const result = await userStore.updateProfile({
      avatar: avatarUrl
    })
    
    if (result.success) {
      ElMessage.success('头像上传成功')
    } else {
      ElMessage.error(result.message)
    }
    
    return false // 阻止默认上传行为
  } catch (error: any) {
    console.error('头像上传失败:', error)
    ElMessage.error(error.message || '头像上传失败')
    return false
  }
}

// 保存个人信息
const handleSaveProfile = async () => {
  if (!profileFormRef.value) return

  try {
    await profileFormRef.value.validate()
    
    const result = await userStore.updateProfile(profileForm)
    
    if (result.success) {
      ElMessage.success(result.message)
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    console.error('保存个人信息失败:', error)
  }
}

// 重置表单
const handleResetForm = () => {
  Object.assign(profileForm, {
    username: userStore.userInfo?.username || '',
    email: userStore.userInfo?.email || '',
    phone: userStore.userInfo?.phone || '',
    avatar: userStore.userInfo?.avatar || ''
  })
}

// 编辑商品
const handleEditProduct = (product: any) => {
  // 跳转到编辑页面，传递商品ID
  router.push(`/products/edit/${product.id}`)
}

// 删除商品
const handleDeleteProduct = async (product: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除商品 "${product.title}" 吗？此操作不可恢复！`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error',
        confirmButtonClass: 'el-button--danger',
        beforeClose: (action, instance, done) => {
          if (action === 'confirm') {
            instance.confirmButtonLoading = true
            instance.confirmButtonText = '删除中...'
            setTimeout(() => {
              done()
            }, 300)
          } else {
            done()
          }
        }
      }
    )
    
    // 调用删除商品API
    const result = await productStore.deleteProduct(product.id)
    
    if (result.success) {
      ElMessage.success(result.message)
      // 重新加载我的商品列表
      await fetchMyProducts()
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    // 用户取消删除或其他错误
    if (error !== 'cancel') {
      console.error('删除商品失败:', error)
      ElMessage.error('删除商品失败，请重试')
    }
  }
}

// 编辑动态
const handleEditPost = (post: any) => {
  // 跳转到动态编辑页面，传递动态ID
  router.push(`/campus/posts/edit/${post.id}`)
}

// 删除动态
const handleDeletePost = async (post: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除动态 "${post.content.substring(0, 30)}..." 吗？此操作不可恢复！`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error',
        confirmButtonClass: 'el-button--danger',
        beforeClose: (action, instance, done) => {
          if (action === 'confirm') {
            instance.confirmButtonLoading = true
            instance.confirmButtonText = '删除中...'
            setTimeout(() => {
              done()
            }, 300)
          } else {
            done()
          }
        }
      }
    )
    
    // 调用删除动态API
    const { error } = await supabase
      .from('campus_posts')
      .delete()
      .eq('id', post.id)
    
    if (error) {
      throw error
    }
    
    // 从本地列表中移除
    const index = campusStore.campusPosts.findIndex(p => p.id === post.id)
    if (index !== -1) {
      campusStore.campusPosts.splice(index, 1)
    }
    
    ElMessage.success('动态删除成功')
    
    // 重新加载动态数据，确保列表更新
    await fetchMyPosts()
  } catch (error: any) {
    // 用户取消删除或其他错误
    if (error !== 'cancel') {
      console.error('删除动态失败:', error)
      ElMessage.error(error.message || '删除动态失败，请重试')
    }
  }
}

// 跳转到管理员面板
const goToAdminPanel = () => {
  router.push('/admin')
}

onMounted(async () => {
  try {
    // 确保用户状态已初始化
    const initialized = await userStore.initUser()
    
    if (!initialized) {
      console.warn('用户状态初始化失败，跳转到登录页')
      ElMessage.warning('请先登录')
      router.push('/login')
      return
    }
    
    // 检查用户是否已登录
    if (!userStore.isLoggedIn || !userStore.userInfo) {
      console.warn('用户未登录，跳转到登录页')
      ElMessage.warning('请先登录')
      router.push('/login')
      return
    }
    
    console.log('用户状态初始化成功，用户信息:', userStore.userInfo)
    
    // 根据当前标签页加载不同的数据
    if (activeTab.value === 'my-products') {
      await fetchMyProducts()
    } else if (activeTab.value === 'my-posts') {
      await fetchMyPosts()
    } else {
      await productStore.fetchProducts()
    }
    
    // 初始化表单数据
    if (userStore.userInfo) {
      Object.assign(profileForm, {
        username: userStore.userInfo.username,
        email: userStore.userInfo.email,
        phone: userStore.userInfo.phone || '',
        avatar: userStore.userInfo.avatar || ''
      })
      console.log('表单数据初始化完成')
    }
  } catch (error) {
    console.error('个人中心页面初始化失败:', error)
    ElMessage.error('页面加载失败，请刷新重试')
  }
})
</script>

<style scoped>
.profile-view {
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

.page-title h1 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

/* 主要内容 */
.main-content {
  padding: 20px 0;
}

.profile-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
}

/* 侧边栏 */
.sidebar {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: fit-content;
}

.user-card {
  text-align: center;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e4e7ed;
}

.user-avatar {
  margin-bottom: 16px;
}

.user-info h3 {
  margin: 0 0 8px 0;
  color: #303133;
}

.user-email {
  color: #606266;
  margin-bottom: 8px;
}

.user-join-date {
  color: #909399;
  font-size: 12px;
}

.nav-menu {
  border: none;
}

.nav-menu .el-menu-item {
  height: 48px;
  line-height: 48px;
  margin-bottom: 4px;
  border-radius: 4px;
}

.nav-menu .el-menu-item.is-active {
  background-color: #ecf5ff;
  color: #409eff;
}

/* 内容区域 */
.content {
  background: white;
  border-radius: 8px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tab-title {
  font-size: 20px;
  color: #303133;
  margin-bottom: 24px;
  font-weight: 600;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

/* 个人信息表单 */
.profile-form {
  max-width: 500px;
}

.avatar-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  text-align: center;
}

/* 我的发布 */
.products-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.product-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s;
}

.product-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.product-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-status {
  position: absolute;
  top: 4px;
  right: 4px;
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 10px;
  font-weight: 500;
}

.product-status.available {
  background: #f0f9ff;
  color: #409eff;
}

.product-info {
  flex: 1;
}

.product-info h4 {
  margin: 0 0 8px 0;
  color: #303133;
  cursor: pointer;
}

.product-info h4:hover {
  color: #409eff;
}

.product-price {
  font-size: 16px;
  font-weight: bold;
  color: #f56c6c;
  margin: 0 0 4px 0;
}

.product-time {
  color: #909399;
  font-size: 12px;
  margin: 0;
}

.product-actions {
  display: flex;
  gap: 8px;
}

/* 收藏商品网格 */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.product-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.product-card .product-image {
  width: 100%;
  height: 120px;
}

.product-card .product-info {
  padding: 12px;
}

.product-card h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 我的动态样式 */
.posts-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.post-item {
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 20px;
  background: #fff;
  transition: all 0.3s ease;
}

.post-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.post-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.post-type {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.post-type.text {
  background: #e6f7ff;
  color: #1890ff;
}

.post-type.image {
  background: #f6ffed;
  color: #52c41a;
}

.post-type.trade {
  background: #fff7e6;
  color: #fa8c16;
}

.post-type.event {
  background: #f9f0ff;
  color: #722ed1;
}

.post-type.help {
  background: #fff2f0;
  color: #f5222d;
}

.post-time {
  color: #909399;
  font-size: 12px;
}

.post-actions {
  display: flex;
  gap: 8px;
}

.post-text {
  color: #303133;
  line-height: 1.6;
  margin-bottom: 16px;
  font-size: 14px;
}

.post-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
  margin-bottom: 16px;
}

.post-image {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 6px;
  cursor: pointer;
}

.post-stats {
  display: flex;
  gap: 16px;
  color: #909399;
  font-size: 12px;
}

/* 消息预览 */
.messages-preview {
  text-align: center;
  padding: 40px 0;
}

.messages-preview p {
  margin-bottom: 16px;
  color: #606266;
}

/* 信用详情样式 */
.credit-overview {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.credit-score-card {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.score-display {
  display: flex;
  align-items: center;
  justify-content: center;
}

.score-circle {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.score-value {
  font-size: 36px;
  font-weight: bold;
  line-height: 1;
}

.score-label {
  font-size: 14px;
  opacity: 0.9;
  margin-top: 4px;
}

.score-info h3 {
  margin: 0 0 12px 0;
  font-size: 20px;
}

.score-info p {
  margin: 8px 0;
  opacity: 0.9;
}

.credit-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.stat-label {
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #495057;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-layout {
    grid-template-columns: 1fr;
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
  
  .product-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .product-actions {
    align-self: flex-end;
  }
  
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .content {
    padding: 20px 16px;
  }
  
  .products-grid {
    grid-template-columns: 1fr;
  }
  
  .tab-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}

/* 交易相关样式 */
.transaction-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin-right: 16px;
  font-size: 24px;
}

.stat-icon.pending {
  background: #fff7e6;
  color: #fa8c16;
}

.stat-icon.active {
  background: #e6f7ff;
  color: #1890ff;
}

.stat-icon.completed {
  background: #f6ffed;
  color: #52c41a;
}

.stat-icon.total {
  background: #f9f0ff;
  color: #722ed1;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-top: 4px;
}

.transactions-preview {
  margin-top: 24px;
}

.preview-title {
  font-size: 18px;
  color: #303133;
  margin-bottom: 16px;
  font-weight: 600;
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.transaction-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.transaction-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.transaction-image {
  width: 60px;
  height: 60px;
  margin-right: 16px;
}

.transaction-image .product-image {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  object-fit: cover;
}

.image-error {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 6px;
  color: #c0c4cc;
}

.transaction-info {
  flex: 1;
}

.transaction-info .product-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.transaction-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.transaction-meta .amount {
  font-weight: 600;
  color: #f56c6c;
}

.counterparty, .create-time {
  font-size: 13px;
  color: #909399;
  margin: 4px 0;
}

.transaction-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.status-tag {
  font-size: 12px;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .transaction-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .transaction-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .transaction-status {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .transaction-stats {
    grid-template-columns: 1fr;
  }
  
  .transaction-meta {
    flex-direction: column;
    gap: 4px;
  }
}
</style>