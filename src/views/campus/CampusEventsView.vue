<template>
  <div class="campus-events-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1>🎉 校园活动</h1>
        <p>参与精彩活动，丰富校园生活</p>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-section">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-select v-model="filters.eventCategory" placeholder="活动分类" @change="handleFilterChange">
            <el-option label="全部活动" value="all" />
            <el-option label="学术活动" value="academic" />
            <el-option label="社交活动" value="social" />
            <el-option label="体育活动" value="sports" />
            <el-option label="文化活动" value="culture" />
            <el-option label="志愿活动" value="volunteer" />
          </el-select>
        </el-col>
        <el-col :span="12">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索活动..."
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
      </el-row>
    </div>

    <!-- 活动列表 -->
    <div class="events-container">
      <div v-if="campusStore.isLoading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>
      
      <div v-else-if="filteredEvents.length > 0" class="events-grid">
        <div 
          v-for="event in filteredEvents" 
          :key="event.id" 
          class="event-card"
        >
          <!-- 活动日期 -->
          <div class="event-date">
            <div class="date-day">{{ formatEventDay(event.startTime) }}</div>
            <div class="date-month">{{ formatEventMonth(event.startTime) }}</div>
          </div>
          
          <!-- 活动信息 -->
          <div class="event-info">
            <div class="event-header">
              <h3>{{ event.title }}</h3>
              <el-tag :type="getEventCategoryTag(event.category)" size="small">
                {{ getEventCategoryLabel(event.category) }}
              </el-tag>
            </div>
            
            <p class="event-description">{{ event.description }}</p>
            
            <div class="event-details">
              <div class="detail-item">
                <el-icon><Clock /></el-icon>
                <span>{{ formatEventTime(event.startTime) }} - {{ formatEventTime(event.endTime) }}</span>
              </div>
              
              <div class="detail-item">
                <el-icon><Location /></el-icon>
                <span>{{ event.location }}</span>
              </div>
              
              <div class="detail-item">
                <el-icon><User /></el-icon>
                <span>{{ event.currentParticipants }}/{{ event.maxParticipants }} 人参与</span>
              </div>
              
              <div v-if="event.organizer" class="detail-item">
                <el-icon><Promotion /></el-icon>
                <span>主办方：{{ event.organizer }}</span>
              </div>
            </div>
            
            <div v-if="event.tags.length > 0" class="event-tags">
              <el-tag
                v-for="tag in event.tags"
                :key="tag"
                size="small"
                type="info"
              >
                {{ tag }}
              </el-tag>
            </div>
            
            <div class="event-actions">
              <el-button 
                type="primary" 
                size="default"
                :disabled="event.currentParticipants >= event.maxParticipants"
                @click="registerForEvent(event)"
              >
                {{ event.isRegistered ? '已报名' : '立即报名' }}
              </el-button>
              
              <el-button 
                type="default" 
                size="default"
                @click="showEventDetails(event)"
              >
                查看详情
              </el-button>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <el-empty description="暂无校园活动" />
      </div>
    </div>

    <!-- 活动详情对话框 -->
    <el-dialog
      v-model="showEventDialog"
      :title="selectedEvent?.title"
      width="600px"
    >
      <div v-if="selectedEvent" class="event-detail">
        <div class="detail-section">
          <h4>活动描述</h4>
          <p>{{ selectedEvent.description }}</p>
        </div>
        
        <div class="detail-section">
          <h4>活动信息</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <strong>时间：</strong>
              <span>{{ formatEventTime(selectedEvent.startTime) }} - {{ formatEventTime(selectedEvent.endTime) }}</span>
            </div>
            <div class="detail-item">
              <strong>地点：</strong>
              <span>{{ selectedEvent.location }}</span>
            </div>
            <div class="detail-item">
              <strong>主办方：</strong>
              <span>{{ selectedEvent.organizer }}</span>
            </div>
            <div class="detail-item">
              <strong>参与人数：</strong>
              <span>{{ selectedEvent.currentParticipants }}/{{ selectedEvent.maxParticipants }}</span>
            </div>
          </div>
        </div>
        
        <div v-if="selectedEvent.tags.length > 0" class="detail-section">
          <h4>活动标签</h4>
          <div class="tag-list">
            <el-tag
              v-for="tag in selectedEvent.tags"
              :key="tag"
              size="default"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showEventDialog = false">关闭</el-button>
          <el-button 
            type="primary" 
            :disabled="selectedEvent?.currentParticipants >= selectedEvent?.maxParticipants"
            @click="registerForEvent(selectedEvent!)"
          >
            {{ selectedEvent?.isRegistered ? '已报名' : '立即报名' }}
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

import { Search, Clock, Location, User, Promotion } from '@element-plus/icons-vue'

const campusStore = useCampusStore()

// 状态
const searchKeyword = ref('')
const showEventDialog = ref(false)
const selectedEvent = ref<any>(null)
const filters = ref({
  eventCategory: 'all'
})

// 计算属性
const filteredEvents = computed(() => {
  let events = campusStore.filteredEvents
  
  // 搜索过滤
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase()
    events = events.filter(event => 
      event.title.toLowerCase().includes(keyword) ||
      event.description.toLowerCase().includes(keyword) ||
      event.location.toLowerCase().includes(keyword) ||
      event.tags.some(tag => tag.toLowerCase().includes(keyword))
    )
  }
  
  return events
})

// 生命周期
onMounted(async () => {
  await campusStore.getCampusEvents(20)
})

// 方法
const handleFilterChange = () => {
  campusStore.updateFilters({ eventCategory: filters.value.eventCategory })
}

const handleSearch = () => {
  // 搜索功能已在计算属性中实现
}

const registerForEvent = async (event: any) => {
  if (event.currentParticipants >= event.maxParticipants) {
    ElMessage.warning('活动人数已满')
    return
  }
  
  try {
    const result = await campusStore.registerForEvent(event.id)
    if (result.success) {
      ElMessage.success('报名成功！')
      event.isRegistered = true
      event.currentParticipants += 1
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    ElMessage.error('报名失败，请稍后重试')
  }
}

const showEventDetails = (event: any) => {
  selectedEvent.value = event
  showEventDialog.value = true
}

const getEventCategoryTag = (category: string) => {
  const tagMap = {
    academic: 'primary',
    social: 'success',
    sports: 'warning',
    culture: 'info',
    volunteer: 'danger'
  }
  return tagMap[category as keyof typeof tagMap] || 'info'
}

const getEventCategoryLabel = (category: string) => {
  const labelMap = {
    academic: '学术',
    social: '社交',
    sports: '体育',
    culture: '文化',
    volunteer: '志愿'
  }
  return labelMap[category as keyof typeof labelMap] || category
}

const formatEventDay = (timeString: string) => {
  const date = new Date(timeString)
  return date.getDate().toString()
}

const formatEventMonth = (timeString: string) => {
  const date = new Date(timeString)
  return date.toLocaleDateString('zh-CN', { month: 'short' })
}

const formatEventTime = (timeString: string) => {
  const date = new Date(timeString)
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.campus-events-view {
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
}

.filter-section {
  max-width: 800px;
  margin: 0 auto 40px;
  padding: 0 20px;
}

.events-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.loading-container {
  text-align: center;
  padding: 60px 0;
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.event-card {
  background: white;
  border-radius: 16px;
  padding: 25px;
  display: flex;
  gap: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
}

.event-date {
  text-align: center;
  min-width: 80px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 12px;
}

.date-day {
  font-size: 2.5rem;
  font-weight: 700;
  color: #409eff;
  line-height: 1;
}

.date-month {
  font-size: 1rem;
  color: #909399;
  margin-top: 5px;
}

.event-info {
  flex: 1;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.event-header h3 {
  margin: 0;
  color: #303133;
  font-size: 1.3rem;
}

.event-description {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 20px;
}

.event-details {
  margin-bottom: 20px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #909399;
  font-size: 0.9rem;
}

.event-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.event-actions {
  display: flex;
  gap: 10px;
}

.empty-state {
  text-align: center;
  padding: 60px 0;
}

.event-detail {
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
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 768px) {
  .header-content h1 {
    font-size: 2rem;
  }
  
  .events-grid {
    grid-template-columns: 1fr;
  }
  
  .event-card {
    flex-direction: column;
    text-align: center;
  }
  
  .event-date {
    margin: 0 auto 20px;
  }
  
  .event-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>