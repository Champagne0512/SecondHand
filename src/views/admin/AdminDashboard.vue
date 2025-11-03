<template>
  <div class="admin-dashboard">
    <!-- 管理员导航栏 -->
    <div class="admin-navbar">
      <div class="nav-container">
        <div class="nav-brand">
          <el-icon><Setting /></el-icon>
          <span>管理员后台</span>
        </div>
        <div class="nav-menu">
          <el-menu 
            :default-active="activeTab" 
            mode="horizontal" 
            @select="handleTabSelect"
            class="admin-menu"
          >
            <el-menu-item index="dashboard">
              <el-icon><DataBoard /></el-icon>
              数据概览
            </el-menu-item>
            <el-menu-item index="users">
              <el-icon><User /></el-icon>
              用户管理
            </el-menu-item>
            <el-menu-item index="products">
              <el-icon><Goods /></el-icon>
              商品管理
            </el-menu-item>
            <el-menu-item index="content">
              <el-icon><Document /></el-icon>
              内容审核
            </el-menu-item>
            <el-menu-item index="reports">
              <el-icon><Warning /></el-icon>
              举报处理
            </el-menu-item>
            <el-menu-item index="settings">
              <el-icon><Setting /></el-icon>
              系统设置
            </el-menu-item>
          </el-menu>
        </div>
        <div class="nav-actions">
          <el-dropdown @command="handleAdminCommand">
            <span class="admin-dropdown">
              <el-avatar :size="32" :src="currentAdmin?.avatar" />
              <span class="admin-name">{{ currentAdmin?.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人信息
                </el-dropdown-item>
                <el-dropdown-item command="logs">
                  <el-icon><Document /></el-icon>
                  操作日志
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="admin-content">
      <!-- 数据概览 -->
      <div v-if="activeTab === 'dashboard'" class="dashboard-tab">
        <div class="stats-cards">
          <el-row :gutter="20">
            <el-col :xs="24" :sm="12" :md="6">
              <div class="stat-card">
                <div class="stat-icon users">
                  <el-icon><User /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ stats.totalUsers }}</div>
                  <div class="stat-label">总用户数</div>
                </div>
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6">
              <div class="stat-card">
                <div class="stat-icon products">
                  <el-icon><Goods /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ stats.totalProducts }}</div>
                  <div class="stat-label">商品总数</div>
                </div>
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6">
              <div class="stat-card">
                <div class="stat-icon posts">
                  <el-icon><Document /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ stats.totalPosts }}</div>
                  <div class="stat-label">动态总数</div>
                </div>
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6">
              <div class="stat-card">
                <div class="stat-icon pending">
                  <el-icon><Clock /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ stats.pendingReviews }}</div>
                  <div class="stat-label">待审核内容</div>
                </div>
              </div>
            </el-col>
          </el-row>
          
          <!-- 今日数据统计 -->
          <el-row :gutter="20" style="margin-top: 20px;">
            <el-col :xs="24" :sm="8" :md="4">
              <div class="stat-card today">
                <div class="stat-icon today-users">
                  <el-icon><UserFilled /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ stats.todayUsers || 0 }}</div>
                  <div class="stat-label">今日新增用户</div>
                </div>
              </div>
            </el-col>
            <el-col :xs="24" :sm="8" :md="4">
              <div class="stat-card today">
                <div class="stat-icon today-products">
                  <el-icon><GoodsFilled /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ stats.todayProducts || 0 }}</div>
                  <div class="stat-label">今日新增商品</div>
                </div>
              </div>
            </el-col>
            <el-col :xs="24" :sm="8" :md="4">
              <div class="stat-card today">
                <div class="stat-icon today-posts">
                  <el-icon><DocumentAdd /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ stats.todayPosts || 0 }}</div>
                  <div class="stat-label">今日新增动态</div>
                </div>
              </div>
            </el-col>
          </el-row>
          
          <!-- 今日数据统计 -->
          <el-row :gutter="20" style="margin-top: 20px;">
            <el-col :xs="24" :sm="8" :md="4">
              <div class="stat-card today">
                <div class="stat-icon today-users">
                  <el-icon><UserFilled /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ stats.todayUsers || 0 }}</div>
                  <div class="stat-label">今日新增用户</div>
                </div>
              </div>
            </el-col>
            <el-col :xs="24" :sm="8" :md="4">
              <div class="stat-card today">
                <div class="stat-icon today-products">
                  <el-icon><GoodsFilled /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ stats.todayProducts || 0 }}</div>
                  <div class="stat-label">今日新增商品</div>
                </div>
              </div>
            </el-col>
            <el-col :xs="24" :sm="8" :md="4">
              <div class="stat-card today">
                <div class="stat-icon today-posts">
                  <el-icon><DocumentAdd /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ stats.todayPosts || 0 }}</div>
                  <div class="stat-label">今日新增动态</div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 图表区域 -->
        <div class="charts-section">
          <el-row :gutter="20">
            <el-col :xs="24" :lg="12">
              <div class="chart-card">
                <div class="chart-header">
                  <h3>用户增长趋势</h3>
                </div>
                <div class="chart-container">
                  <div v-if="loading" class="loading-chart">
                    <el-loading :loading="true" text="加载中..." />
                  </div>
                  <div v-else class="chart-placeholder">
                    <el-empty description="图表组件开发中" />
                  </div>
                </div>
              </div>
            </el-col>
            <el-col :xs="24" :lg="12">
              <div class="chart-card">
                <div class="chart-header">
                  <h3>商品分类分布</h3>
                </div>
                <div class="chart-container">
                  <div v-if="loading" class="loading-chart">
                    <el-loading :loading="true" text="加载中..." />
                  </div>
                  <div v-else class="chart-placeholder">
                    <el-empty description="图表组件开发中" />
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 最近活动 -->
        <div class="recent-activities">
          <div class="section-card">
            <div class="section-header">
              <h3>最近活动</h3>
              <el-button type="primary" size="small" @click="refreshActivities">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
            <div class="activities-list">
              <div v-if="recentActivities.length === 0" class="empty-activities">
                <el-empty description="暂无活动记录" />
              </div>
              <div v-else class="activity-items">
                <div 
                  v-for="activity in recentActivities" 
                  :key="activity.id"
                  class="activity-item"
                >
                  <div class="activity-icon">
                    <el-icon>
                      <component :is="getActivityIcon(activity.type)" />
                    </el-icon>
                  </div>
                  <div class="activity-content">
                    <div class="activity-title">{{ activity.title }}</div>
                    <div class="activity-time">{{ formatTime(activity.time) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 用户管理 -->
      <div v-else-if="activeTab === 'users'" class="users-tab">
        <div class="section-card">
          <div class="section-header">
            <h3>用户管理</h3>
            <div class="header-actions">
              <el-input
                v-model="userSearchKeyword"
                placeholder="搜索用户名或邮箱"
                style="width: 300px"
                @input="handleUserSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <el-button type="primary" @click="exportUsers">
                <el-icon><Download /></el-icon>
                导出用户
              </el-button>
            </div>
          </div>
          
          <el-table :data="filteredUsers" v-loading="loading">
            <el-table-column prop="username" label="用户名" width="120" />
            <el-table-column prop="email" label="邮箱" width="200" />
            <el-table-column prop="createdAt" label="注册时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column prop="productCount" label="发布商品" width="100" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
                  {{ row.status === 'active' ? '正常' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button size="small" @click="viewUserDetail(row)">查看</el-button>
                <el-button 
                  size="small" 
                  :type="row.status === 'active' ? 'danger' : 'success'"
                  @click="toggleUserStatus(row)"
                >
                  {{ row.status === 'active' ? '禁用' : '启用' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="userCurrentPage"
              v-model:page-size="userPageSize"
              :total="userTotal"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleUserSizeChange"
              @current-change="handleUserCurrentChange"
            />
          </div>
        </div>
      </div>

      <!-- 商品管理 -->
      <div v-else-if="activeTab === 'products'" class="products-tab">
        <div class="section-card">
          <div class="section-header">
            <h3>商品管理</h3>
            <div class="header-actions">
              <el-input
                v-model="productSearchKeyword"
                placeholder="搜索商品标题或描述"
                style="width: 300px"
                @input="handleProductSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>
          </div>
          
          <el-table :data="filteredProducts" v-loading="loading">
            <el-table-column prop="title" label="商品标题" width="200" />
            <el-table-column prop="profiles.username" label="发布者" width="120" />
            <el-table-column prop="price" label="价格" width="100">
              <template #default="{ row }">
                ¥{{ row.price }}
              </template>
            </el-table-column>
            <el-table-column prop="category" label="分类" width="100" />
            <el-table-column prop="created_at" label="发布时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'available' ? 'success' : 'warning'">
                  {{ row.status === 'available' ? '上架' : '下架' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="250">
              <template #default="{ row }">
                <el-button size="small" @click="viewProductDetail(row)">查看</el-button>
                <el-button 
                  size="small" 
                  :type="row.status === 'available' ? 'warning' : 'success'"
                  @click="toggleProductStatus(row)"
                >
                  {{ row.status === 'available' ? '下架' : '上架' }}
                </el-button>
                <el-button 
                  size="small" 
                  type="danger" 
                  @click="deleteProduct(row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="productCurrentPage"
              v-model:page-size="productPageSize"
              :total="productTotal"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleProductSizeChange"
              @current-change="handleProductCurrentChange"
            />
          </div>
        </div>
      </div>

      <!-- 内容审核 -->
      <div v-else-if="activeTab === 'content'" class="content-tab">
        <div class="section-card">
          <div class="section-header">
            <h3>内容审核</h3>
            <div class="header-actions">
              <el-button type="primary" @click="loadPendingReviews">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </div>
          
          <div v-if="pendingReviews.length === 0" class="empty-content">
            <el-empty description="暂无待审核内容" />
          </div>
          
          <div v-else class="review-list">
            <div 
              v-for="review in pendingReviews" 
              :key="review.id"
              class="review-item"
            >
              <div class="review-header">
                <span class="review-type">{{ review.content_type }}审核</span>
                <span class="review-time">{{ formatTime(review.created_at) }}</span>
              </div>
              <div class="review-content">
                <p><strong>内容ID:</strong> {{ review.content_id }}</p>
                <p v-if="review.profiles"><strong>提交者:</strong> {{ review.profiles.username }}</p>
              </div>
              <div class="review-actions">
                <el-button type="success" size="small" @click="approveContent(review)">
                  通过
                </el-button>
                <el-button type="danger" size="small" @click="rejectContent(review)">
                  拒绝
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 举报处理 -->
      <div v-else-if="activeTab === 'reports'" class="reports-tab">
        <div class="section-card">
          <div class="section-header">
            <h3>举报处理</h3>
          </div>
          
          <el-table :data="filteredReports" v-loading="loading">
            <el-table-column prop="profiles.username" label="举报人" width="120" />
            <el-table-column prop="target_type" label="举报类型" width="120" />
            <el-table-column prop="target_id" label="目标ID" width="120" />
            <el-table-column prop="report_type" label="举报原因" width="150" />
            <el-table-column prop="description" label="描述" min-width="200" />
            <el-table-column prop="created_at" label="举报时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag 
                  :type="row.status === 'pending' ? 'warning' : row.status === 'processing' ? 'info' : 'success'"
                >
                  {{ row.status === 'pending' ? '待处理' : row.status === 'processing' ? '处理中' : '已解决' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button 
                  v-if="row.status === 'pending'"
                  type="primary" 
                  size="small" 
                  @click="handleReport(row, 'processing')"
                >
                  开始处理
                </el-button>
                <el-button 
                  v-if="row.status === 'processing'"
                  type="success" 
                  size="small" 
                  @click="handleReport(row, 'resolved')"
                >
                  标记解决
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="reportCurrentPage"
              v-model:page-size="reportPageSize"
              :total="reportTotal"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleReportSizeChange"
              @current-change="handleReportCurrentChange"
            />
          </div>
        </div>
      </div>

      <!-- 系统设置 -->
      <div v-else-if="activeTab === 'settings'" class="settings-tab">
        <div class="section-card">
          <div class="section-header">
            <h3>系统设置</h3>
          </div>
          
          <div v-if="siteConfigs.length === 0" class="empty-content">
            <el-empty description="暂无系统配置" />
          </div>
          
          <div v-else class="config-list">
            <div 
              v-for="config in siteConfigs" 
              :key="config.id"
              class="config-item"
            >
              <div class="config-info">
                <div class="config-key">{{ config.config_key }}</div>
                <div class="config-description">{{ config.description }}</div>
                <div class="config-value">
                  <pre>{{ JSON.stringify(config.config_value, null, 2) }}</pre>
                </div>
              </div>
              <div class="config-actions">
                <el-button type="primary" size="small" @click="updateConfig(config)">
                  编辑
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 其他标签页内容 -->
      <div v-else class="tab-content">
        <div class="section-card">
          <div class="section-header">
            <h3>{{ getTabTitle(activeTab) }}</h3>
          </div>
          <div class="tab-placeholder">
            <el-empty :description="`${getTabTitle(activeTab)}功能开发中`" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Setting, DataBoard, User, Goods, Document, Warning,
  ArrowDown, SwitchButton, Search, Download, Refresh,
  Clock, Edit, Delete, HomeFilled, UserFilled, GoodsFilled, DocumentAdd
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import AdminAPI from '@/api/admin'

const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const activeTab = ref('dashboard')
const loading = ref(false)
const currentAdmin = ref({
  username: userStore.userInfo?.username || '管理员',
  avatar: userStore.userInfo?.avatar || ''
})

// 权限检查
const isAdmin = computed(() => userStore.isAdmin)

// 如果没有管理员权限，重定向到登录页
if (!isAdmin.value) {
  ElMessage.warning('您没有管理员权限，请先登录管理员账户')
  router.push('/admin/login')
}

// 统计数据
const stats = ref({
  totalUsers: 0,
  totalProducts: 0,
  totalPosts: 0,
  pendingReviews: 0,
  todayUsers: 0,
  todayProducts: 0,
  todayPosts: 0
})

// 用户管理相关
const userSearchKeyword = ref('')
const userCurrentPage = ref(1)
const userPageSize = ref(20)
const userTotal = ref(0)
const filteredUsers = ref([])

// 商品管理相关
const productSearchKeyword = ref('')
const productCurrentPage = ref(1)
const productPageSize = ref(20)
const productTotal = ref(0)
const filteredProducts = ref([])

// 内容审核相关
const pendingReviews = ref([])

// 举报处理相关
const reportCurrentPage = ref(1)
const reportPageSize = ref(20)
const reportTotal = ref(0)
const filteredReports = ref([])

// 网站配置相关
const siteConfigs = ref([])

// 最近活动
const recentActivities = ref([
  { id: 1, type: 'user', title: '新用户注册', time: new Date(Date.now() - 300000) },
  { id: 2, type: 'product', title: '新商品发布', time: new Date(Date.now() - 600000) },
  { id: 3, type: 'review', title: '内容审核通过', time: new Date(Date.now() - 900000) }
])

// 计算属性
const getTabTitle = (tab: string) => {
  const titles = {
    dashboard: '数据概览',
    users: '用户管理',
    products: '商品管理',
    content: '内容审核',
    reports: '举报处理',
    settings: '系统设置'
  }
  return titles[tab] || '未知页面'
}

const getActivityIcon = (type: string) => {
  const icons = {
    user: User,
    product: Goods,
    review: Document,
    report: Warning
  }
  return icons[type] || Setting
}

// 方法
const handleTabSelect = async (key: string) => {
  activeTab.value = key
  
  // 根据选中的标签页加载相应的数据
  switch (key) {
    case 'dashboard':
      await loadDashboardStats()
      break
    case 'users':
      await loadUsers()
      break
    case 'products':
      await loadProducts()
      break
    case 'content':
      await loadPendingReviews()
      break
    case 'reports':
      await loadReports()
      break
    case 'settings':
      await loadSiteConfigs()
      break
  }
}

// 加载数据概览
const loadDashboardStats = async () => {
  loading.value = true
  try {
    const statsData = await AdminAPI.getDashboardStats()
    stats.value = statsData
    
    // 加载最近活动
    const activities = await AdminAPI.getRecentActivities(5)
    recentActivities.value = activities
    
    // 加载今日数据
    await loadTodayStats()
  } catch (error) {
    console.error('加载数据概览失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 加载今日统计数据
const loadTodayStats = async () => {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // 获取今日新用户
    const { count: todayUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)
    
    // 获取今日新商品
    const { count: todayProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)
    
    // 获取今日新动态
    const { count: todayPosts } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)
    
    stats.value.todayUsers = todayUsers || 0
    stats.value.todayProducts = todayProducts || 0
    stats.value.todayPosts = todayPosts || 0
  } catch (error) {
    console.error('加载今日统计数据失败:', error)
  }
}

// 加载用户列表
const loadUsers = async () => {
  loading.value = true
  try {
    const { users, total } = await AdminAPI.getUsers(
      userCurrentPage.value, 
      userPageSize.value, 
      userSearchKeyword.value
    )
    filteredUsers.value = users
    userTotal.value = total
  } catch (error) {
    console.error('加载用户列表失败:', error)
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

// 加载商品列表
const loadProducts = async () => {
  loading.value = true
  try {
    const { products, total } = await AdminAPI.getProducts(
      productCurrentPage.value,
      productPageSize.value,
      productSearchKeyword.value
    )
    filteredProducts.value = products
    productTotal.value = total
  } catch (error) {
    console.error('加载商品列表失败:', error)
    ElMessage.error('加载商品列表失败')
  } finally {
    loading.value = false
  }
}

// 加载待审核内容
const loadPendingReviews = async () => {
  loading.value = true
  try {
    const reviews = await AdminAPI.getPendingReviews()
    pendingReviews.value = reviews
  } catch (error) {
    console.error('加载待审核内容失败:', error)
    ElMessage.error('加载待审核内容失败')
  } finally {
    loading.value = false
  }
}

// 加载举报记录
const loadReports = async () => {
  loading.value = true
  try {
    const { reports, total } = await AdminAPI.getReports(
      reportCurrentPage.value,
      reportPageSize.value
    )
    filteredReports.value = reports
    reportTotal.value = total
  } catch (error) {
    console.error('加载举报记录失败:', error)
    ElMessage.error('加载举报记录失败')
  } finally {
    loading.value = false
  }
}

// 加载网站配置
const loadSiteConfigs = async () => {
  loading.value = true
  try {
    const configs = await AdminAPI.getSiteConfigs()
    siteConfigs.value = configs
  } catch (error) {
    console.error('加载网站配置失败:', error)
    ElMessage.error('加载网站配置失败')
  } finally {
    loading.value = false
  }
}

const handleAdminCommand = (command: string) => {
  switch (command) {
    case 'profile':
      ElMessage.info('个人信息功能开发中')
      break
    case 'logs':
      ElMessage.info('操作日志功能开发中')
      break
    case 'logout':
      handleLogout()
      break
  }
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出管理员后台吗？', '确认退出', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 这里应该调用退出登录的API
    ElMessage.success('已退出管理员后台')
    router.push('/')
  } catch {
    // 用户取消操作
  }
}

const formatTime = (time: Date) => {
  return new Date(time).toLocaleString('zh-CN')
}

const refreshActivities = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('活动记录已刷新')
  }, 1000)
}

const handleUserSearch = () => {
  userCurrentPage.value = 1
  loadUsers()
}

const handleUserSizeChange = (size: number) => {
  userPageSize.value = size
  userCurrentPage.value = 1
  loadUsers()
}

const handleUserCurrentChange = (page: number) => {
  userCurrentPage.value = page
  loadUsers()
}

const handleProductSearch = () => {
  productCurrentPage.value = 1
  loadProducts()
}

const handleProductSizeChange = (size: number) => {
  productPageSize.value = size
  productCurrentPage.value = 1
  loadProducts()
}

const handleProductCurrentChange = (page: number) => {
  productCurrentPage.value = page
  loadProducts()
}

const handleReportSizeChange = (size: number) => {
  reportPageSize.value = size
  reportCurrentPage.value = 1
  loadReports()
}

const handleReportCurrentChange = (page: number) => {
  reportCurrentPage.value = page
  loadReports()
}

// 用户管理操作
const viewUserDetail = (user: any) => {
  ElMessage.info(`查看用户详情: ${user.username}`)
  // 这里可以跳转到用户详情页面
  // router.push(`/admin/users/${user.id}`)
}

const toggleUserStatus = async (user: any) => {
  try {
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    const action = user.status === 'active' ? '禁用' : '启用'
    
    await ElMessageBox.confirm(`确定要${action}用户 ${user.username} 吗？`, '确认操作', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 调用API更新用户状态
    const success = await AdminAPI.updateUserStatus(user.id, newStatus)
    
    if (success) {
      ElMessage.success(`${action}用户成功`)
      await loadUsers() // 重新加载用户列表
    } else {
      ElMessage.error(`${action}用户失败`)
    }
  } catch {
    // 用户取消操作
  }
}

const exportUsers = () => {
  ElMessage.info('导出用户功能开发中')
}

// 商品管理操作
const viewProductDetail = (product: any) => {
  ElMessage.info(`查看商品详情: ${product.title}`)
  // 这里可以跳转到商品详情页面
  router.push(`/products/${product.id}`)
}

const toggleProductStatus = async (product: any) => {
  try {
    const action = product.status === 'available' ? '下架' : '上架'
    const newStatus = product.status === 'available' ? 'sold' : 'available'
    
    await ElMessageBox.confirm(`确定要${action}商品 ${product.title} 吗？`, '确认操作', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 调用API更新商品状态
    const success = await AdminAPI.updateProductStatus(product.id, newStatus)
    
    if (success) {
      ElMessage.success(`${action}商品成功`)
      await loadProducts() // 重新加载商品列表
    } else {
      ElMessage.error(`${action}商品失败`)
    }
  } catch {
    // 用户取消操作
  }
}

// 删除商品
const deleteProduct = async (product: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除商品 "${product.title}" 吗？此操作不可恢复！`, '确认删除', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'error',
      confirmButtonClass: 'el-button--danger'
    })
    
    const success = await AdminAPI.deleteProduct(product.id)
    
    if (success) {
      ElMessage.success('商品删除成功')
      await loadProducts() // 重新加载商品列表
    } else {
      ElMessage.error('商品删除失败')
    }
  } catch {
    // 用户取消操作
  }
}

// 内容审核操作
const approveContent = async (review: any) => {
  try {
    await ElMessageBox.confirm('确定要通过此内容吗？', '确认审核', {
      confirmButtonText: '通过',
      cancelButtonText: '取消',
      type: 'success'
    })
    
    const success = await AdminAPI.reviewContent(review.id, 'approved', '审核通过')
    if (success) {
      ElMessage.success('内容审核通过')
      await loadPendingReviews()
    } else {
      ElMessage.error('审核操作失败')
    }
  } catch {
    // 用户取消操作
  }
}

const rejectContent = async (review: any) => {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入拒绝原因', '拒绝内容', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '请输入拒绝原因',
      type: 'warning'
    })
    
    const success = await AdminAPI.reviewContent(review.id, 'rejected', reason)
    if (success) {
      ElMessage.success('内容已拒绝')
      await loadPendingReviews()
    } else {
      ElMessage.error('审核操作失败')
    }
  } catch {
    // 用户取消操作
  }
}

// 举报处理操作
const handleReport = async (report: any, status: 'processing' | 'resolved') => {
  try {
    let resolution = ''
    if (status === 'resolved') {
      const { value } = await ElMessageBox.prompt('请输入处理结果', '处理举报', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入处理结果说明',
        type: 'info'
      })
      resolution = value
    }
    
    const success = await AdminAPI.handleReport(report.id, status, resolution)
    if (success) {
      ElMessage.success('举报处理成功')
      await loadReports()
    } else {
      ElMessage.error('处理操作失败')
    }
  } catch {
    // 用户取消操作
  }
}

// 网站配置操作
const updateConfig = async (config: any) => {
  try {
    const { value: newValue } = await ElMessageBox.prompt(
      `请输入新的配置值 (${config.config_key})`,
      '更新配置',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: JSON.stringify(config.config_value),
        type: 'info'
      }
    )
    
    const success = await AdminAPI.updateSiteConfig(config.config_key, JSON.parse(newValue))
    if (success) {
      ElMessage.success('配置更新成功')
      await loadSiteConfigs()
    } else {
      ElMessage.error('配置更新失败')
    }
  } catch {
    // 用户取消操作
  }
}

// 页面加载时初始化数据
onMounted(async () => {
  await loadDashboardStats()
})
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background: #f5f7fa;
}

/* 导航栏样式 */
.admin-navbar {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 600;
  color: #409eff;
}

.nav-menu {
  flex: 1;
  display: flex;
  justify-content: center;
}

.admin-menu {
  border: none;
  background: transparent;
}

.admin-menu .el-menu-item {
  height: 64px;
  line-height: 64px;
  border-bottom: 3px solid transparent;
  font-weight: 500;
}

.admin-menu .el-menu-item.is-active {
  border-bottom-color: #409eff;
  color: #409eff;
}

.admin-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background 0.3s;
}

.admin-dropdown:hover {
  background: #f5f7fa;
}

.admin-name {
  font-weight: 500;
  color: #303133;
}

/* 主要内容区域 */
.admin-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px;
}

/* 统计卡片样式 */
.stats-cards {
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
}

.stat-icon.users { background: linear-gradient(45deg, #409eff, #66b1ff); }
.stat-icon.products { background: linear-gradient(45deg, #67c23a, #85ce61); }
.stat-icon.posts { background: linear-gradient(45deg, #e6a23c, #ebb563); }
.stat-icon.pending { background: linear-gradient(45deg, #f56c6c, #f78989); }

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

/* 图表区域 */
.charts-section {
  margin-bottom: 24px;
}

.chart-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chart-header {
  margin-bottom: 16px;
}

.chart-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.chart-container {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-chart,
.chart-placeholder {
  width: 100%;
  height: 100%;
}

/* 最近活动 */
.recent-activities {
  margin-bottom: 24px;
}

.section-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.activities-list {
  min-height: 200px;
}

.empty-activities {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.activity-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
  background: #f8f9fa;
  transition: background 0.3s;
}

.activity-item:hover {
  background: #e9ecef;
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.activity-time {
  font-size: 12px;
  color: #909399;
}

/* 表格样式 */
.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

/* 标签页内容 */
.tab-placeholder {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
    height: auto;
    padding: 12px 20px;
    gap: 12px;
  }

  .nav-menu {
    order: 2;
    width: 100%;
  }

  .admin-menu {
    width: 100%;
  }

  .admin-menu .el-menu-item {
    height: 48px;
    line-height: 48px;
    font-size: 14px;
  }

  .admin-content {
    padding: 16px 12px;
  }

  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }

  .stat-value {
    font-size: 24px;
  }
}
</style>