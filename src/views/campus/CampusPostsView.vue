<template>
  <div class="campus-posts-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1>💬 校园动态</h1>
        <p>分享校园生活，连接同学情谊</p>
        <el-button type="primary" size="large" @click="showPublishDialog = true">
          <el-icon><Plus /></el-icon>
          发布动态
        </el-button>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-section">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-select v-model="filters.postType" placeholder="动态类型" @change="handleFilterChange">
            <el-option label="全部动态" value="all" />
            <el-option label="文字动态" value="text" />
            <el-option label="图片分享" value="image" />
            <el-option label="二手交易" value="trade" />
            <el-option label="活动信息" value="event" />
            <el-option label="求助信息" value="help" />
          </el-select>
        </el-col>
        <el-col :span="12">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索动态内容..."
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
      </el-row>
    </div>

    <!-- 动态列表 -->
    <div class="posts-container">
      <div v-if="campusStore.isLoading" class="loading-container">
        <el-loading :loading="true" text="加载中..." />
      </div>
      
      <div v-else-if="filteredPosts.length > 0" class="posts-list">
        <div 
          v-for="post in filteredPosts" 
          :key="post.id" 
          class="post-card"
        >
          <!-- 用户信息 -->
          <div class="post-header">
            <div class="user-info">
              <el-avatar :src="post.userAvatar" :size="40" />
              <div class="user-details">
                <span class="username">{{ post.username }}</span>
                <span class="post-time">{{ formatTime(post.createdAt) }}</span>
              </div>
            </div>
            <el-tag :type="getPostTypeTag(post.type)" size="small">
              {{ getPostTypeLabel(post.type) }}
            </el-tag>
          </div>

          <!-- 动态内容 -->
          <div class="post-content">
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
                @click="previewImage(image, post.images)"
              />
            </div>

            <!-- 位置和标签 -->
            <div v-if="post.location || post.tags.length > 0" class="post-meta">
              <span v-if="post.location" class="location">📍 {{ post.location }}</span>
              <div v-if="post.tags.length > 0" class="tags">
                <el-tag
                  v-for="tag in post.tags"
                  :key="tag"
                  size="small"
                  type="info"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </div>
          </div>

          <!-- 互动按钮 -->
          <div class="post-actions">
            <el-button 
              :type="post.isLiked ? 'danger' : 'default'"
              size="small"
              :icon="post.isLiked ? 'el-icon-star-on' : 'el-icon-star-off'"
              @click="toggleLike(post)"
            >
              {{ post.likes }} 点赞
            </el-button>
            
            <el-button 
              type="default"
              size="small"
              icon="el-icon-chat-dot-round"
              @click="showComments(post)"
            >
              {{ post.comments }} 评论
            </el-button>
            
            <el-button 
              type="default"
              size="small"
              icon="el-icon-share"
              @click="sharePost(post)"
            >
              分享
            </el-button>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <el-empty description="暂无校园动态，快来发布第一条动态吧！" />
        <el-button type="primary" size="large" @click="showPublishDialog = true">
          发布动态
        </el-button>
      </div>
    </div>

    <!-- 发布动态对话框 -->
    <el-dialog
      v-model="showPublishDialog"
      title="发布校园动态"
      width="600px"
      :before-close="handleCloseDialog"
    >
      <el-form :model="publishForm" label-width="80px">
        <el-form-item label="动态类型">
          <el-select v-model="publishForm.type" placeholder="选择类型">
            <el-option label="文字动态" value="text" />
            <el-option label="图片分享" value="image" />
            <el-option label="二手交易" value="trade" />
            <el-option label="活动信息" value="event" />
            <el-option label="求助信息" value="help" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="动态内容">
          <el-input
            v-model="publishForm.content"
            type="textarea"
            :rows="4"
            placeholder="分享你的校园生活..."
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="位置">
          <el-input v-model="publishForm.location" placeholder="如：图书馆、食堂、宿舍等" />
        </el-form-item>
        
        <el-form-item label="标签">
          <el-select
            v-model="publishForm.tags"
            multiple
            filterable
            allow-create
            placeholder="添加标签"
          >
            <el-option label="学习" value="学习" />
            <el-option label="生活" value="生活" />
            <el-option label="分享" value="分享" />
            <el-option label="求助" value="求助" />
            <el-option label="活动" value="活动" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showPublishDialog = false">取消</el-button>
          <el-button type="primary" @click="publishPost">发布</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCampusStore } from '@/stores/campus'
import { ElMessage } from 'element-plus'

import { Plus, Search } from '@element-plus/icons-vue'

const campusStore = useCampusStore()

// 状态
const searchKeyword = ref('')
const showPublishDialog = ref(false)
const filters = ref({
  postType: 'all'
})

const publishForm = ref({
  type: 'text',
  content: '',
  location: '',
  tags: []
})

// 计算属性
const filteredPosts = computed(() => {
  let posts = campusStore.filteredPosts
  
  // 搜索过滤
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase()
    posts = posts.filter(post => 
      post.content.toLowerCase().includes(keyword) ||
      post.username.toLowerCase().includes(keyword) ||
      post.tags.some(tag => tag.toLowerCase().includes(keyword))
    )
  }
  
  return posts
})

// 生命周期
onMounted(async () => {
  await campusStore.getCampusPosts(20)
})

// 方法
const handleFilterChange = () => {
  campusStore.updateFilters({ postType: filters.value.postType })
}

const handleSearch = () => {
  // 搜索功能已在计算属性中实现
}

const publishPost = async () => {
  if (!publishForm.value.content.trim()) {
    ElMessage.warning('请输入动态内容')
    return
  }
  
  try {
    const result = await campusStore.publishCampusPost(publishForm.value)
    if (result.success) {
      ElMessage.success('动态发布成功！')
      showPublishDialog.value = false
      resetPublishForm()
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    ElMessage.error('发布失败，请稍后重试')
  }
}

const toggleLike = async (post: any) => {
  // 实现点赞功能
  ElMessage.info('点赞功能开发中...')
}

const showComments = (post: any) => {
  ElMessage.info('评论功能开发中...')
}

const sharePost = (post: any) => {
  // 实现分享功能
  if (navigator.share) {
    navigator.share({
      title: '校园动态',
      text: post.content,
      url: window.location.href
    })
  } else {
    // 复制链接到剪贴板
    navigator.clipboard.writeText(window.location.href).then(() => {
      ElMessage.success('链接已复制到剪贴板')
    })
  }
}

const previewImage = (image: string, images: string[]) => {
  // Element Plus的el-image组件已经内置了预览功能
}

const handleCloseDialog = () => {
  resetPublishForm()
  showPublishDialog.value = false
}

const resetPublishForm = () => {
  publishForm.value = {
    type: 'text',
    content: '',
    location: '',
    tags: []
  }
}

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
</script>

<style scoped>
/* 动画定义 */
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

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.campus-posts-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 0;
  animation: fadeInUp 0.8s ease-out;
}

.page-header {
  text-align: center;
  padding: 80px 20px 60px;
  color: white;
  position: relative;
  overflow: hidden;
}

.page-header::before {
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
  font-size: 3.5rem;
  margin-bottom: 15px;
  font-weight: 800;
  background: linear-gradient(45deg, #fff, #e3f2fd);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: slideInLeft 0.8s ease-out 0.2s both;
}

.header-content p {
  font-size: 1.3rem;
  opacity: 0.9;
  margin-bottom: 25px;
  animation: slideInLeft 0.8s ease-out 0.4s both;
}

.filter-section {
  max-width: 800px;
  margin: 0 auto 50px;
  padding: 0 20px;
}

.posts-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.loading-container {
  text-align: center;
  padding: 80px 0;
}

.posts-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(520px, 1fr));
  gap: 25px;
}

.post-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.08),
    0 8px 32px rgba(0, 0, 0, 0.12);
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
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
  transform: translateY(-8px);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.15),
    0 20px 60px rgba(0, 0, 0, 0.1);
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
  gap: 15px;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: 700;
  color: #1a1a1a;
  font-size: 1.1rem;
}

.post-time {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}

.post-content {
  margin-bottom: 25px;
}

.post-text {
  color: #444;
  line-height: 1.7;
  margin-bottom: 20px;
  font-size: 1rem;
}

.post-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  margin-top: 20px;
}

.post-image {
  width: 100%;
  height: 140px;
  object-fit: cover;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.post-image:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.location {
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
}

.tags {
  display: flex;
  gap: 10px;
}

.post-actions {
  display: flex;
  gap: 20px;
  padding-top: 25px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.empty-state {
  text-align: center;
  padding: 80px 0;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .posts-list {
    grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  }
}

@media (max-width: 992px) {
  .header-content h1 {
    font-size: 2.8rem;
  }
  
  .filter-section {
    padding: 0 15px;
    margin: 0 auto 40px;
  }
}

@media (max-width: 768px) {
  .campus-posts-view {
    padding: 15px 0;
  }
  
  .page-header {
    padding: 60px 20px 40px;
  }
  
  .header-content h1 {
    font-size: 2.2rem;
  }
  
  .header-content p {
    font-size: 1.1rem;
  }
  
  .filter-section {
    padding: 0 10px;
    margin: 0 auto 30px;
  }
  
  .posts-list {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .post-card {
    padding: 25px 20px;
  }
  
  .post-images {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .post-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .post-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
}

@media (max-width: 480px) {
  .header-content h1 {
    font-size: 1.8rem;
  }
  
  .filter-section {
    padding: 0 5px;
    margin: 0 auto 25px;
  }
  
  .post-card {
    padding: 20px 15px;
  }
  
  .post-images {
    grid-template-columns: 1fr;
  }
}
</style>