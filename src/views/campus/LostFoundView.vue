<template>
  <div class="lost-found-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1>🔍 失物招领</h1>
        <p>丢失物品寻找，捡到物品归还</p>
        <el-button type="primary" size="large" @click="showPublishDialog = true">
          <el-icon><Plus /></el-icon>
          发布信息
        </el-button>
      </div>
    </div>

    <!-- 筛选和类型切换 -->
    <div class="filter-section">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-radio-group v-model="filters.lostFoundType" @change="handleFilterChange">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="lost">寻物启事</el-radio-button>
            <el-radio-button label="found">失物招领</el-radio-button>
          </el-radio-group>
        </el-col>
        <el-col :span="16">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索物品信息..."
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
      </el-row>
    </div>

    <!-- 物品列表 -->
    <div class="items-container">
      <div v-if="campusStore.isLoading" class="loading-container">
        <el-loading :loading="true" text="加载中..." />
      </div>
      
      <div v-else-if="filteredItems.length > 0" class="items-grid">
        <div 
          v-for="item in filteredItems" 
          :key="item.id" 
          class="item-card"
          :class="item.type"
        >
          <!-- 类型标识 -->
          <div class="item-type-badge">
            <el-tag :type="item.type === 'lost' ? 'danger' : 'success'" size="large">
              {{ item.type === 'lost' ? '寻物启事' : '失物招领' }}
            </el-tag>
          </div>
          
          <!-- 物品图片 -->
          <div v-if="item.images && item.images.length > 0" class="item-images">
            <el-image
              v-for="(image, index) in item.images.slice(0, 3)"
              :key="index"
              :src="image"
              :preview-src-list="item.images"
              :initial-index="index"
              fit="cover"
              class="item-image"
            />
          </div>
          
          <!-- 物品信息 -->
          <div class="item-info">
            <h3 class="item-title">{{ item.title }}</h3>
            <p class="item-description">{{ item.description }}</p>
            
            <div class="item-details">
              <div class="detail-item">
                <el-icon><Collection /></el-icon>
                <span>分类：{{ item.itemCategory }}</span>
              </div>
              <div class="detail-item">
                <el-icon><Location /></el-icon>
                <span>地点：{{ item.location }}</span>
              </div>
              <div class="detail-item">
                <el-icon><Calendar /></el-icon>
                <span>时间：{{ formatDate(item.date) }}</span>
              </div>
              <div class="detail-item">
                <el-icon><User /></el-icon>
                <span>发布者：{{ item.username }}</span>
              </div>
            </div>
            
            <div class="contact-info">
              <el-icon><Phone /></el-icon>
              <span>联系方式：{{ item.contactInfo }}</span>
            </div>
          </div>
          
          <!-- 操作按钮 -->
          <div class="item-actions">
            <el-button 
              type="primary" 
              size="default"
              @click="contactPublisher(item)"
            >
              联系发布者
            </el-button>
            
            <el-button 
              type="default" 
              size="default"
              @click="showItemDetails(item)"
            >
              查看详情
            </el-button>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <el-empty :description="getEmptyDescription()" />
        <el-button type="primary" size="large" @click="showPublishDialog = true">
          发布信息
        </el-button>
      </div>
    </div>

    <!-- 发布信息对话框 -->
    <el-dialog
      v-model="showPublishDialog"
      title="发布失物招领信息"
      width="600px"
    >
      <el-form :model="publishForm" label-width="100px">
        <el-form-item label="信息类型">
          <el-radio-group v-model="publishForm.type">
            <el-radio label="lost">寻物启事</el-radio>
            <el-radio label="found">失物招领</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="物品分类">
          <el-select v-model="publishForm.itemCategory" placeholder="选择分类">
            <el-option label="证件卡片" value="证件卡片" />
            <el-option label="电子设备" value="电子设备" />
            <el-option label="生活用品" value="生活用品" />
            <el-option label="学习用品" value="学习用品" />
            <el-option label="服装鞋帽" value="服装鞋帽" />
            <el-option label="其他物品" value="其他物品" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="标题">
          <el-input 
            v-model="publishForm.title" 
            placeholder="简明扼要的标题"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="详细描述">
          <el-input
            v-model="publishForm.description"
            type="textarea"
            :rows="4"
            placeholder="详细描述物品特征、丢失/捡到经过等"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="地点">
          <el-input v-model="publishForm.location" placeholder="如：图书馆三楼、食堂门口等" />
        </el-form-item>
        
        <el-form-item label="时间">
          <el-date-picker
            v-model="publishForm.date"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item label="联系方式">
          <el-input 
            v-model="publishForm.contactInfo" 
            placeholder="微信、电话、QQ等联系方式"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showPublishDialog = false">取消</el-button>
          <el-button type="primary" @click="publishItem">发布</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 物品详情对话框 -->
    <el-dialog
      v-model="showItemDialog"
      :title="selectedItem?.title"
      width="600px"
    >
      <div v-if="selectedItem" class="item-detail">
        <div class="detail-section">
          <h4>物品描述</h4>
          <p>{{ selectedItem.description }}</p>
        </div>
        
        <div class="detail-section">
          <h4>详细信息</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <strong>类型：</strong>
              <el-tag :type="selectedItem.type === 'lost' ? 'danger' : 'success'">
                {{ selectedItem.type === 'lost' ? '寻物启事' : '失物招领' }}
              </el-tag>
            </div>
            <div class="detail-item">
              <strong>分类：</strong>
              <span>{{ selectedItem.itemCategory }}</span>
            </div>
            <div class="detail-item">
              <strong>地点：</strong>
              <span>{{ selectedItem.location }}</span>
            </div>
            <div class="detail-item">
              <strong>时间：</strong>
              <span>{{ formatDate(selectedItem.date) }}</span>
            </div>
            <div class="detail-item">
              <strong>发布者：</strong>
              <span>{{ selectedItem.username }}</span>
            </div>
            <div class="detail-item">
              <strong>状态：</strong>
              <el-tag :type="getStatusType(selectedItem.status)">
                {{ getStatusLabel(selectedItem.status) }}
              </el-tag>
            </div>
          </div>
        </div>
        
        <div class="detail-section">
          <h4>联系方式</h4>
          <p class="contact-info">{{ selectedItem.contactInfo }}</p>
        </div>
        
        <div v-if="selectedItem.images && selectedItem.images.length > 0" class="detail-section">
          <h4>物品图片</h4>
          <div class="image-gallery">
            <el-image
              v-for="(image, index) in selectedItem.images"
              :key="index"
              :src="image"
              :preview-src-list="selectedItem.images"
              :initial-index="index"
              fit="cover"
              class="detail-image"
            />
          </div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showItemDialog = false">关闭</el-button>
          <el-button type="primary" @click="contactPublisher(selectedItem!)">
            联系发布者
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCampusStore } from '@/stores/campus'
import { ElMessage } from 'element-plus'

import { Plus, Search, Collection, Location, Calendar, User, Phone } from '@element-plus/icons-vue'

const campusStore = useCampusStore()

// 状态
const searchKeyword = ref('')
const showPublishDialog = ref(false)
const showItemDialog = ref(false)
const selectedItem = ref<any>(null)
const filters = ref({
  lostFoundType: 'all'
})

const publishForm = ref({
  type: 'lost',
  title: '',
  description: '',
  itemCategory: '',
  location: '',
  date: new Date().toISOString().split('T')[0],
  contactInfo: ''
})

// 计算属性
const filteredItems = computed(() => {
  let items = campusStore.filteredLostFound
  
  // 搜索过滤
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase()
    items = items.filter(item => 
      item.title.toLowerCase().includes(keyword) ||
      item.description.toLowerCase().includes(keyword) ||
      item.location.toLowerCase().includes(keyword) ||
      item.itemCategory.toLowerCase().includes(keyword)
    )
  }
  
  return items
})

// 生命周期
onMounted(async () => {
  await campusStore.getLostFoundItems(20)
})

// 方法
const handleFilterChange = () => {
  campusStore.updateFilters({ lostFoundType: filters.value.lostFoundType })
}

const handleSearch = () => {
  // 搜索功能已在计算属性中实现
}

const publishItem = async () => {
  if (!publishForm.value.title.trim()) {
    ElMessage.warning('请输入标题')
    return
  }
  
  if (!publishForm.value.description.trim()) {
    ElMessage.warning('请输入详细描述')
    return
  }
  
  if (!publishForm.value.contactInfo.trim()) {
    ElMessage.warning('请输入联系方式')
    return
  }
  
  try {
    const result = await campusStore.publishLostFoundItem(publishForm.value)
    if (result.success) {
      ElMessage.success('信息发布成功！')
      showPublishDialog.value = false
      resetPublishForm()
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    ElMessage.error('发布失败，请稍后重试')
  }
}

const contactPublisher = (item: any) => {
  // 复制联系方式到剪贴板
  navigator.clipboard.writeText(item.contactInfo).then(() => {
    ElMessage.success('联系方式已复制到剪贴板')
  }).catch(() => {
    ElMessage.info(`联系方式：${item.contactInfo}`)
  })
}

const showItemDetails = (item: any) => {
  selectedItem.value = item
  showItemDialog.value = true
}

const getEmptyDescription = () => {
  if (filters.value.lostFoundType === 'lost') {
    return '暂无寻物启事'
  } else if (filters.value.lostFoundType === 'found') {
    return '暂无失物招领信息'
  }
  return '暂无失物招领信息'
}

const getStatusType = (status: string) => {
  const statusMap = {
    active: 'info',
    resolved: 'success',
    expired: 'danger'
  }
  return statusMap[status as keyof typeof statusMap] || 'info'
}

const getStatusLabel = (status: string) => {
  const statusMap = {
    active: '进行中',
    resolved: '已解决',
    expired: '已过期'
  }
  return statusMap[status as keyof typeof statusMap] || status
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

const resetPublishForm = () => {
  publishForm.value = {
    type: 'lost',
    title: '',
    description: '',
    itemCategory: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    contactInfo: ''
  }
}
</script>

<style scoped>
.lost-found-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 0;
}

.page-header {
  text-align: center;
  padding: 60px 20px;
  color: white;
}

.header-content h1 {
  font-size: 3rem;
  margin-bottom: 10px;
  font-weight: 700;
}

.header-content p {
  font-size: 1.2rem;
  opacity: 0.9;
  margin-bottom: 20px;
}

.filter-section {
  max-width: 800px;
  margin: 0 auto 40px;
  padding: 0 20px;
}

.items-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.loading-container {
  text-align: center;
  padding: 60px 0;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.item-card {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
}

.item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
}

.item-card.lost {
  border-left: 4px solid #f56c6c;
}

.item-card.found {
  border-left: 4px solid #67c23a;
}

.item-type-badge {
  position: absolute;
  top: 15px;
  right: 15px;
}

.item-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}

.item-image {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
}

.item-info {
  margin-bottom: 20px;
}

.item-title {
  color: #303133;
  font-size: 1.2rem;
  margin-bottom: 10px;
}

.item-description {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 15px;
}

.item-details {
  margin-bottom: 15px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #909399;
  font-size: 0.9rem;
}

.contact-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 8px;
  color: #409eff;
  font-weight: 500;
}

.item-actions {
  display: flex;
  gap: 10px;
}

.empty-state {
  text-align: center;
  padding: 60px 0;
}

.item-detail {
  padding: 20px 0;
}

.detail-section {
  margin-bottom: 25px;
}

.detail-section h4 {
  color: #303133;
  margin-bottom: 15px;
  font-size: 1.1rem;
}

.detail-section p {
  color: #606266;
  line-height: 1.6;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.detail-item strong {
  color: #303133;
  font-weight: 600;
}

.detail-item span {
  color: #606266;
}

.contact-info {
  background: #f0f9ff;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #b3d8ff;
  color: #409eff;
  font-weight: 500;
}

.image-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.detail-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
}

@media (max-width: 768px) {
  .header-content h1 {
    font-size: 2rem;
  }
  
  .items-grid {
    grid-template-columns: 1fr;
  }
  
  .item-card {
    padding: 20px;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>