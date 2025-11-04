<template>
  <div class="campus-view">
    <!-- 页面头部 -->
    <div class="campus-header">
      <div class="header-content">
        <h1><el-icon><School /></el-icon> 校园生活</h1>
        <p>发现校园精彩，连接同学情谊</p>
      </div>
    </div>

    <!-- 快捷导航 -->
    <div class="quick-nav">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <div class="nav-card campus-posts" @click="$router.push('/campus/posts')">
            <div class="nav-icon">
              <el-icon size="32"><ChatDotRound /></el-icon>
            </div>
            <h3>校园动态</h3>
            <p>分享生活点滴，了解校园新鲜事</p>
            <div class="nav-stats">{{ campusStore.campusPosts.length }} 条动态</div>
          </div>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <div class="nav-card campus-events" @click="$router.push('/campus/events')">
            <div class="nav-icon">
              <el-icon size="32"><Promotion /></el-icon>
            </div>
            <h3>校园活动</h3>
            <p>参与精彩活动，丰富校园生活</p>
            <div class="nav-stats">{{ campusStore.campusEvents.length }} 个活动</div>
          </div>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <div class="nav-card lost-found" @click="$router.push('/campus/lost-found')">
            <div class="nav-icon">
              <el-icon size="32"><Search /></el-icon>
            </div>
            <h3>失物招领</h3>
            <p>丢失物品寻找，捡到物品归还</p>
            <div class="nav-stats">{{ campusStore.lostFoundItems.length }} 条信息</div>
          </div>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <div class="nav-card analytics" @click="$router.push('/analytics')">
            <div class="nav-icon">
              <el-icon size="32"><DataAnalysis /></el-icon>
            </div>
            <h3>数据分析</h3>
            <p>价格趋势分析，智能购买建议</p>
            <div class="nav-stats">智能分析</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 最新动态预览 -->
    <div class="section-preview">
      <div class="section-header">
        <h2><el-icon><Fire /></el-icon> 最新校园动态</h2>
        <el-link type="primary" @click="$router.push('/campus/posts')">查看更多</el-link>
      </div>
      
      <div v-if="campusStore.isLoading" class="loading-container">
        <el-loading :loading="true" text="加载中..." />
      </div>
      
      <div v-else-if="recentPosts.length > 0" class="posts-grid">
        <div 
          v-for="post in recentPosts" 
          :key="post.id" 
          class="post-card"
          @click="$router.push('/campus/posts')"
        >
          <div class="post-header">
            <div class="user-info">
              <el-avatar :src="post.userAvatar" :size="32" />
              <span class="username">{{ post.username }}</span>
            </div>
            <el-tag :type="getPostTypeTag(post.type)" size="small">
              {{ getPostTypeLabel(post.type) }}
            </el-tag>
          </div>
          
          <div class="post-content">
            <p>{{ truncateText(post.content, 100) }}</p>
            <div v-if="post.images && post.images.length > 0" class="post-images">
              <img 
                v-for="(image, index) in post.images.slice(0, 3)" 
                :key="index"
                :src="image" 
                :alt="`图片${index + 1}`"
                @click.stop="previewImage(image)"
              />
            </div>
          </div>
          
          <div class="post-footer">
            <div class="post-stats">
              <span><el-icon><Star /></el-icon> {{ post.likes }}</span>
              <span><el-icon><ChatDotRound /></el-icon> {{ post.comments }}</span>
            </div>
            <span class="post-time">{{ formatTime(post.createdAt) }}</span>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <el-empty description="暂无校园动态，快来发布第一条动态吧！" />
        <el-button type="primary" @click="$router.push('/campus/posts')">
          发布动态
        </el-button>
      </div>
    </div>

    <!-- 即将开始的活动 -->
    <div class="section-preview">
      <div class="section-header">
        <h2><el-icon><Calendar /></el-icon> 即将开始的活动</h2>
        <el-link type="primary" @click="$router.push('/campus/events')">查看更多</el-link>
      </div>
      
      <div v-if="campusStore.isLoading" class="loading-container">
        <el-loading :loading="true" text="加载中..." />
      </div>
      
      <div v-else-if="upcomingEvents.length > 0" class="events-grid">
        <div 
          v-for="event in upcomingEvents" 
          :key="event.id" 
          class="event-card"
          @click="$router.push('/campus/events')"
        >
          <div class="event-date">
            <div class="date-day">{{ formatEventDay(event.startTime) }}</div>
            <div class="date-month">{{ formatEventMonth(event.startTime) }}</div>
          </div>
          
          <div class="event-info">
            <h4>{{ event.title }}</h4>
            <p class="event-desc">{{ truncateText(event.description, 50) }}</p>
            <div class="event-meta">
              <span><el-icon><Location /></el-icon> {{ event.location }}</span>
              <span><el-icon><User /></el-icon> {{ event.currentParticipants }}/{{ event.maxParticipants }}</span>
            </div>
            <el-tag :type="getEventCategoryTag(event.category)" size="small">
              {{ getEventCategoryLabel(event.category) }}
            </el-tag>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <el-empty description="暂无校园活动" />
        <el-button type="primary" @click="$router.push('/campus/events')">
          查看活动
        </el-button>
      </div>
    </div>

    <!-- 失物招领 -->
    <div class="section-preview">
      <div class="section-header">
        <h2><el-icon><Search /></el-icon> 失物招领</h2>
        <el-link type="primary" @click="$router.push('/campus/lost-found')">查看更多</el-link>
      </div>
      
      <div v-if="campusStore.isLoading" class="loading-container">
        <el-loading :loading="true" text="加载中..." />
      </div>
      
      <div v-else-if="recentLostFound.length > 0" class="lost-found-grid">
        <div 
          v-for="item in recentLostFound" 
          :key="item.id" 
          class="lost-found-card"
          :class="item.type"
          @click="$router.push('/campus/lost-found')"
        >
          <div class="item-type">
            <el-tag :type="item.type === 'lost' ? 'danger' : 'success'">
              {{ item.type === 'lost' ? '寻物' : '招领' }}
            </el-tag>
          </div>
          
          <h4>{{ item.title }}</h4>
          <p class="item-desc">{{ truncateText(item.description, 60) }}</p>
          
          <div class="item-meta">
            <span><el-icon><Location /></el-icon> {{ item.location }}</span>
            <span><el-icon><Calendar /></el-icon> {{ formatDate(item.date) }}</span>
          </div>
          
          <div class="item-category">
            <el-tag size="small">{{ item.itemCategory }}</el-tag>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <el-empty description="暂无失物招领信息" />
        <el-button type="primary" @click="$router.push('/campus/lost-found')">
          发布信息
        </el-button>
      </div>
    </div>

    <!-- AI助手入口 -->
    <div class="ai-assistant-section">
      <div class="ai-header">
        <h2><el-icon><Robot /></el-icon> AI智能助手</h2>
        <p>让AI帮助你更好地使用平台</p>
      </div>
      
      <div class="ai-features">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8">
            <div class="ai-feature-card" @click="$router.push('/ai-assistant')">
              <div class="ai-icon">
                <el-icon size="32"><Edit /></el-icon>
              </div>
              <h4>智能文案</h4>
              <p>AI帮你写出吸引人的商品描述</p>
            </div>
          </el-col>
          
          <el-col :xs="24" :sm="12" :md="8">
            <div class="ai-feature-card" @click="$router.push('/analytics')">
              <div class="ai-icon">
                <el-icon size="32"><Money /></el-icon>
              </div>
              <h4>价格分析</h4>
              <p>智能分析商品价格趋势</p>
            </div>
          </el-col>
          
          <el-col :xs="24" :sm="12" :md="8">
            <div class="ai-feature-card" @click="$router.push('/ai-assistant')">
              <div class="ai-icon">
                <el-icon size="32"><Aim /></el-icon>
              </div>
              <h4>智能推荐</h4>
              <p>个性化商品推荐</p>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useCampusStore } from '@/stores/campus'
import { ElMessage } from 'element-plus'


const campusStore = useCampusStore()

// 计算属性
const recentPosts = computed(() => {
  return campusStore.campusPosts.slice(0, 6)
})

const upcomingEvents = computed(() => {
  return campusStore.campusEvents.slice(0, 4)
})

const recentLostFound = computed(() => {
  return campusStore.lostFoundItems.slice(0, 6)
})

// 生命周期
onMounted(async () => {
  // 并行加载所有数据
  await Promise.all([
    campusStore.getCampusPosts(6),
    campusStore.getCampusEvents(4),
    campusStore.getLostFoundItems(6)
  ])
})

// 工具函数
const getPostTypeTag = (type: string) => {
  const tagMap = {
    text: 'info',
    image: 'success',
    trade: 'warning',
    event: 'primary',
    help: 'danger'
  }
  return tagMap[type as keyof typeof tagMap] || 'info'
}

const getPostTypeLabel = (type: string) => {
  const labelMap = {
    text: '文字',
    image: '图片',
    trade: '交易',
    event: '活动',
    help: '求助'
  }
  return labelMap[type as keyof typeof labelMap] || type
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

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const formatTime = (timeString: string) => {
  const date = new Date(timeString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return date.toLocaleDateString()
}

const formatEventDay = (timeString: string) => {
  const date = new Date(timeString)
  return date.getDate().toString()
}

const formatEventMonth = (timeString: string) => {
  const date = new Date(timeString)
  return date.toLocaleDateString('zh-CN', { month: 'short' })
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

const previewImage = (imageUrl: string) => {
  // 这里可以实现图片预览功能
  ElMessage.info('图片预览功能开发中...')
}
</script>

<style scoped>
/* 全局样式和动画定义 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 5px rgba(255,255,255,0.5); }
  50% { box-shadow: 0 0 20px rgba(255,255,255,0.8); }
}

.campus-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 0; /* 移除顶部padding，避免蓝色空白 */
  animation: fadeInUp 0.8s ease-out;
}

/* 修复导航栏背景问题 */
.campus-view :deep(.global-navigation) {
  background: white !important;
  position: relative;
  z-index: 1000;
}

.campus-view :deep(.main-navbar) {
  background: white !important;
}

.campus-header {
  text-align: center;
  padding: 80px 20px 60px;
  color: white;
  position: relative;
  overflow: hidden;
}

.campus-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%);
  animation: pulse 3s ease-in-out infinite;
}

.header-content {
  position: relative;
  z-index: 2;
}

.header-content h1 {
  font-size: 4.5rem;
  margin-bottom: 20px;
  font-weight: 900;
  background: linear-gradient(135deg, #fff 0%, #e3f2fd 25%, #bbdefb 50%, #90caf9 75%, #fff 100%);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: 
    gradientShift 4s ease-in-out infinite, 
    slideInLeft 1s ease-out 0.2s both,
    float 6s ease-in-out infinite 2s;
  text-shadow: none;
  letter-spacing: -0.03em;
  position: relative;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.header-content p {
  font-size: 1.5rem;
  opacity: 0.9;
  animation: slideInLeft 1s ease-out 0.4s both;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  line-height: 1.6;
  font-weight: 300;
  letter-spacing: 0.03em;
  margin-bottom: 0;
}

.quick-nav {
  padding: 0 20px 60px;
  max-width: 1200px;
  margin: 0 auto;
}

.nav-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 35px 25px;
  text-align: center;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.08),
    0 8px 32px rgba(0, 0, 0, 0.12);
  margin-bottom: 25px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
  /* 移除动画效果，避免悬停时重新播放 */
  transform-style: preserve-3d;
  perspective: 1000px;
}

.nav-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  transition: left 0.5s ease;
}

.nav-card:hover {
  transform: translateY(-8px) scale(1.02) rotateX(5deg) rotateY(5deg);
  box-shadow: 
    0 16px 50px rgba(0, 0, 0, 0.2),
    0 25px 80px rgba(0, 0, 0, 0.15),
    0 0 30px rgba(255, 255, 255, 0.3);
  animation: glow 2s ease-in-out infinite;
}

.campus-posts:hover {
  background: linear-gradient(135deg, #ffffff 0%, #e6f3ff 50%, #d9edff 100%);
  box-shadow: 
    0 12px 35px rgba(64, 158, 255, 0.35),
    0 20px 60px rgba(64, 158, 255, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(64, 158, 255, 0.4);
}

.campus-events:hover {
  background: linear-gradient(135deg, #ffffff 0%, #f0ffe6 50%, #e6ffd9 100%);
  box-shadow: 
    0 12px 35px rgba(103, 194, 58, 0.35),
    0 20px 60px rgba(103, 194, 58, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(103, 194, 58, 0.4);
}

.lost-found:hover {
  background: linear-gradient(135deg, #ffffff 0%, #fff2d8 50%, #ffeed0 100%);
  box-shadow: 
    0 12px 35px rgba(230, 162, 60, 0.35),
    0 20px 60px rgba(230, 162, 60, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(230, 162, 60, 0.4);
}

.analytics:hover {
  background: linear-gradient(135deg, #ffffff 0%, #ffe6e6 50%, #ffd9d9 100%);
  box-shadow: 
    0 12px 35px rgba(245, 108, 108, 0.35),
    0 20px 60px rgba(245, 108, 108, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(245, 108, 108, 0.4);
}

.nav-card:hover::before {
  left: 100%;
}

.nav-icon {
  font-size: 3.5rem;
  margin-bottom: 20px;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
  transition: transform 0.3s ease;
}

.nav-card:hover .nav-icon {
  transform: scale(1.1) rotate(5deg);
}

.nav-card h3 {
  font-size: 1.4rem;
  margin-bottom: 12px;
  color: #1a1a1a;
  font-weight: 600;
}

.nav-card p {
  color: #666;
  margin-bottom: 20px;
  line-height: 1.6;
  font-size: 0.95rem;
}

.nav-stats {
  color: #409eff;
  font-weight: 700;
  font-size: 1rem;
  padding: 8px 16px;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 20px;
  display: inline-block;
  transition: all 0.3s ease;
}

.nav-card:hover .nav-stats {
  background: rgba(64, 158, 255, 0.2);
  transform: scale(1.05);
}

.campus-posts { 
  border-top: 4px solid #409eff;
  background: linear-gradient(135deg, #ffffff 0%, #f0f8ff 50%, #e6f3ff 100%);
  box-shadow: 
    0 6px 25px rgba(64, 158, 255, 0.25),
    0 12px 40px rgba(64, 158, 255, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(64, 158, 255, 0.2);
}
.campus-events { 
  border-top: 4px solid #67c23a;
  background: linear-gradient(135deg, #ffffff 0%, #f6ffed 50%, #f0ffe6 100%);
  box-shadow: 
    0 6px 25px rgba(103, 194, 58, 0.25),
    0 12px 40px rgba(103, 194, 58, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(103, 194, 58, 0.2);
}
.lost-found { 
  border-top: 4px solid #e6a23c;
  background: linear-gradient(135deg, #ffffff 0%, #fff7e6 50%, #fff2d8 100%);
  box-shadow: 
    0 6px 25px rgba(230, 162, 60, 0.25),
    0 12px 40px rgba(230, 162, 60, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(230, 162, 60, 0.2);
}
.analytics { 
  border-top: 4px solid #f56c6c;
  background: linear-gradient(135deg, #ffffff 0%, #fff0f0 50%, #ffe6e6 100%);
  box-shadow: 
    0 6px 25px rgba(245, 108, 108, 0.25),
    0 12px 40px rgba(245, 108, 108, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(245, 108, 108, 0.2);
}

.section-preview {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  margin: 0 20px 50px;
  border-radius: 20px;
  padding: 45px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: fadeInUp 0.6s ease-out 0.8s both;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 35px;
  padding-bottom: 20px;
  border-bottom: 2px solid rgba(0, 0, 0, 0.05);
}

.section-header h2 {
  color: #1a1a1a;
  font-size: 2.2rem;
  margin: 0;
  font-weight: 800;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 25%, #e6a23c 50%, #f56c6c 75%, #409eff 100%);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradientShift 3s ease-in-out infinite, slideInLeft 0.8s ease-out 0.6s both;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  letter-spacing: -0.01em;
}

.loading-container {
  text-align: center;
  padding: 80px 0;
}

.empty-state {
  text-align: center;
  padding: 80px 0;
}

.empty-state .el-button {
  margin-top: 25px;
  border-radius: 25px;
  padding: 12px 30px;
  font-weight: 600;
}

/* 动态卡片样式 */
.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 25px;
}

.post-card {
  background: white;
  border-radius: 16px;
  padding: 25px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
  animation: fadeInUp 0.6s ease-out 0.8s both;
  transform-style: preserve-3d;
}

.post-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #409eff, #67c23a, #e6a23c, #f56c6c);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.post-card:hover {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  transform: translateY(-5px);
}

.post-card:hover::before {
  transform: scaleX(1);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.username {
  font-weight: 600;
  color: #1a1a1a;
  font-size: 1rem;
}

.post-content {
  margin-bottom: 20px;
}

.post-content p {
  color: #444;
  line-height: 1.7;
  margin-bottom: 15px;
  font-size: 0.95rem;
}

.post-images {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.post-images img {
  width: 90px;
  height: 90px;
  object-fit: cover;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.post-images img:hover {
  transform: scale(1.05);
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.post-stats {
  display: flex;
  gap: 20px;
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
}

.post-time {
  color: #999;
  font-size: 0.85rem;
}

/* 活动卡片样式 */
.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 25px;
}

.event-card {
  display: flex;
  gap: 20px;
  background: white;
  border-radius: 16px;
  padding: 25px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  animation: fadeInUp 0.6s ease-out 0.9s both;
  transform-style: preserve-3d;
}

.event-card:hover {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  transform: translateY(-5px) rotateX(3deg) rotateY(3deg);
  animation: pulse 1s ease-in-out;
}

.event-date {
  text-align: center;
  min-width: 70px;
  flex-shrink: 0;
}

.date-day {
  font-size: 2.5rem;
  font-weight: 800;
  color: #409eff;
  line-height: 1;
  margin-bottom: 5px;
}

.date-month {
  font-size: 1rem;
  color: #666;
  font-weight: 600;
}

.event-info {
  flex: 1;
}

.event-info h4 {
  margin: 0 0 12px 0;
  color: #1a1a1a;
  font-size: 1.2rem;
  font-weight: 700;
}

.event-desc {
  color: #555;
  font-size: 0.95rem;
  margin-bottom: 15px;
  line-height: 1.6;
}

.event-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 15px;
}

.event-meta span {
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
}

/* 失物招领卡片样式 */
.lost-found-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 25px;
}

.lost-found-card {
  background: white;
  border-radius: 16px;
  padding: 25px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
  animation: fadeInUp 0.6s ease-out 1s both;
  transform-style: preserve-3d;
}

.lost-found-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  transition: all 0.3s ease;
}

.lost-found-card.lost::before {
  background: linear-gradient(180deg, #f56c6c, #e6a23c);
}

.lost-found-card.found::before {
  background: linear-gradient(180deg, #67c23a, #409eff);
}

.lost-found-card:hover {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  transform: translateY(-5px) rotateX(3deg) rotateY(3deg);
  animation: pulse 1s ease-in-out;
}

.lost-found-card:hover::before {
  width: 6px;
}

.item-type {
  position: absolute;
  top: 20px;
  right: 20px;
}

.lost-found-card h4 {
  margin: 0 0 15px 0;
  color: #1a1a1a;
  font-size: 1.2rem;
  font-weight: 700;
}

.item-desc {
  color: #555;
  font-size: 0.95rem;
  margin: 15px 0;
  line-height: 1.6;
}

.item-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 20px 0;
}

.item-meta span {
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
}

.item-category {
  margin-top: 15px;
}

.ai-assistant-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 0 20px 40px;
  border-radius: 20px;
  padding: 60px 40px;
  color: white;
  text-align: center;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  position: relative;
  overflow: hidden;
  animation: fadeInUp 0.6s ease-out 1s both;
}

.ai-assistant-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 70%);
  animation: pulse 4s ease-in-out infinite;
}

.ai-header {
  margin-bottom: 50px;
  position: relative;
  z-index: 2;
}

.ai-header h2 {
  font-size: 3rem;
  margin-bottom: 15px;
  font-weight: 800;
  background: linear-gradient(45deg, #fff, #e3f2fd);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.ai-header p {
  font-size: 1.3rem;
  opacity: 0.9;
  font-weight: 300;
}

.ai-features {
  max-width: 900px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.ai-feature-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 35px 25px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  margin-bottom: 25px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
}

.ai-feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  transition: left 0.5s ease;
}

.ai-feature-card:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2);
}

.ai-feature-card:hover::before {
  left: 100%;
}

.ai-icon {
  font-size: 3.5rem;
  margin-bottom: 20px;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.2));
  transition: transform 0.3s ease;
}

.ai-feature-card:hover .ai-icon {
  transform: scale(1.1) rotate(5deg);
}

.ai-feature-card h4 {
  font-size: 1.4rem;
  margin-bottom: 12px;
  font-weight: 600;
}

.ai-feature-card p {
  opacity: 0.9;
  line-height: 1.6;
  font-size: 0.95rem;
}

/* 响应式设计优化 */
@media (max-width: 1200px) {
  .posts-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
  
  .events-grid,
  .lost-found-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

@media (max-width: 992px) {
  .header-content h1 {
    font-size: 2.8rem;
  }
  
  .ai-header h2 {
    font-size: 2.5rem;
  }
  
  .section-preview {
    padding: 35px 30px;
    margin: 0 15px 40px;
  }
  
  .quick-nav .el-col {
    margin-bottom: 20px;
  }
}

@media (max-width: 768px) {
  .campus-view {
    padding: 15px 0;
  }
  
  .campus-header {
    padding: 60px 20px 40px;
  }
  
  .header-content h1 {
    font-size: 2.2rem;
  }
  
  .header-content p {
    font-size: 1.1rem;
  }
  
  .section-preview {
    padding: 25px 20px;
    margin: 0 10px 30px;
    border-radius: 16px;
  }
  
  .section-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .section-header h2 {
    font-size: 1.6rem;
  }
  
  .posts-grid,
  .events-grid,
  .lost-found-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .nav-card,
  .ai-feature-card {
    padding: 25px 20px;
  }
  
  .ai-assistant-section {
    padding: 40px 25px;
    margin: 0 10px 30px;
    border-radius: 16px;
  }
  
  .ai-header h2 {
    font-size: 2rem;
  }
  
  .ai-header p {
    font-size: 1.1rem;
  }
  
  .quick-nav {
    padding: 0 10px 30px;
  }
  
  .event-card {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
  
  .event-date {
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .header-content h1 {
    font-size: 1.8rem;
  }
  
  .section-preview {
    padding: 20px 15px;
    margin: 0 5px 25px;
  }
  
  .nav-card,
  .post-card,
  .event-card,
  .lost-found-card,
  .ai-feature-card {
    padding: 20px 15px;
  }
  
  .ai-assistant-section {
    padding: 30px 20px;
  }
  
  .ai-header h2 {
    font-size: 1.8rem;
  }
  
  .nav-icon,
  .ai-icon {
    font-size: 2.5rem;
  }
}
</style>