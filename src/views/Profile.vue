<template>
  <div class="profile">
    <div class="profile-header">
      <div class="user-info">
        <div class="avatar">
          <img :src="user.avatar" :alt="user.name" />
        </div>
        <div class="user-details">
          <h1>{{ user.name }}</h1>
          <p class="user-bio">{{ user.bio }}</p>
          <div class="user-stats">
            <div class="stat">
              <span class="stat-number">{{ userStats.collections }}</span>
              <span class="stat-label">收藏</span>
            </div>
            <div class="stat">
              <span class="stat-number">{{ userStats.comments }}</span>
              <span class="stat-label">评论</span>
            </div>
            <div class="stat">
              <span class="stat-number">{{ userStats.views }}</span>
              <span class="stat-label">浏览</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="profile-content">
      <div class="tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          :class="['tab', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="tab-content">
        <!-- 收藏的诗词 -->
        <div v-if="activeTab === 'collections'" class="collections">
          <h2>我的收藏</h2>
          <div v-if="collections.length > 0" class="collection-list">
            <div v-for="poem in collections" :key="poem.id" class="collection-item" @click="viewPoem(poem.id)">
              <h3>{{ poem.title }}</h3>
              <p>{{ poem.author }} · {{ poem.dynasty }}</p>
              <button class="remove-btn" @click.stop="removeCollection(poem.id)">取消收藏</button>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>暂无收藏的诗词</p>
          </div>
        </div>

        <!-- 我的评论 -->
        <div v-if="activeTab === 'comments'" class="comments">
          <h2>我的评论</h2>
          <div v-if="userComments.length > 0" class="comment-list">
            <div v-for="comment in userComments" :key="comment.id" class="comment-item">
              <div class="comment-header">
                <span class="poem-title" @click="viewPoem(comment.poemId)">{{ comment.poemTitle }}</span>
                <span class="comment-time">{{ comment.time }}</span>
              </div>
              <p class="comment-content">{{ comment.content }}</p>
              <button class="delete-btn" @click="deleteComment(comment.id)">删除</button>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>暂无评论</p>
          </div>
        </div>

        <!-- 浏览历史 -->
        <div v-if="activeTab === 'history'" class="history">
          <h2>浏览历史</h2>
          <div v-if="browseHistory.length > 0" class="history-list">
            <div v-for="item in browseHistory" :key="item.id" class="history-item" @click="viewPoem(item.poemId)">
              <h3>{{ item.poemTitle }}</h3>
              <p>{{ item.author }} · {{ item.dynasty }}</p>
              <span class="view-time">{{ item.time }}</span>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>暂无浏览历史</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'

const router = useRouter()

// 用户信息
const user = ref({
  name: '诗词爱好者',
  avatar: '/api/placeholder/avatar/80',
  bio: '热爱中国古典诗词，喜欢在诗词中寻找生活的诗意。'
})

const userStats = ref({
  collections: 0,
  comments: 0,
  views: 0
})

const tabs = ref([
  { id: 'collections', label: '我的收藏' },
  { id: 'comments', label: '我的评论' },
  { id: 'history', label: '浏览历史' }
])

const activeTab = ref('collections')

const collections = ref([])
const userComments = ref([])
const browseHistory = ref([])
const isLoading = ref(false)

onMounted(async () => {
  isLoading.value = true
  try {
    // 加载用户数据
    await loadUserData()
  } catch (error) {
    console.error('加载用户数据失败:', error)
  } finally {
    isLoading.value = false
  }
})

const loadUserData = async () => {
  try {
    console.log('开始加载用户数据...')
    
    // 由于用户认证功能尚未完全实现，这里使用模拟数据
    // 在实际应用中，这里应该获取当前登录用户的数据
    
    // 模拟收藏列表
    const { data: favoriteData, error: favoriteError } = await supabase
      .from('poems')
      .select('*')
      .limit(3)
    
    if (!favoriteError) {
      collections.value = favoriteData || []
    }
    
    // 模拟用户评论
    userComments.value = [
      {
        id: 1,
        poemId: 1,
        poemTitle: '静夜思',
        content: '这首诗意境优美，读来令人回味无穷。',
        time: '2024-01-15'
      },
      {
        id: 2,
        poemId: 2,
        poemTitle: '春晓',
        content: '孟浩然的诗作清新自然，充满生活气息。',
        time: '2024-01-14'
      }
    ]
    
    // 模拟浏览历史
    const { data: historyData, error: historyError } = await supabase
      .from('poems')
      .select('*')
      .limit(5)
    
    if (!historyError) {
      browseHistory.value = (historyData || []).map(poem => ({
        id: poem.id,
        poemId: poem.id,
        poemTitle: poem.title,
        author: poem.author,
        dynasty: poem.dynasty,
        time: new Date().toLocaleDateString()
      }))
    }
    
    // 更新统计数据
    userStats.value.collections = collections.value.length
    userStats.value.comments = userComments.value.length
    userStats.value.views = browseHistory.value.length
    
    console.log('用户数据加载完成:', {
      collections: collections.value.length,
      comments: userComments.value.length,
      history: browseHistory.value.length
    })
  } catch (error) {
    console.error('加载用户数据失败:', error)
  }
}

const viewPoem = (poemId) => {
  router.push(`/poem/${poemId}`)
}

const removeCollection = async (poemId) => {
  try {
    console.log('取消收藏诗词，ID:', poemId)
    // 在实际应用中，这里应该调用Supabase API删除收藏记录
    collections.value = collections.value.filter(poem => poem.id !== poemId)
    userStats.value.collections = collections.value.length
  } catch (error) {
    console.error('取消收藏失败:', error)
  }
}

const deleteComment = async (commentId) => {
  try {
    console.log('删除评论，ID:', commentId)
    // 在实际应用中，这里应该调用Supabase API删除评论记录
    userComments.value = userComments.value.filter(comment => comment.id !== commentId)
    userStats.value.comments = userComments.value.length
  } catch (error) {
    console.error('删除评论失败:', error)
  }
}
</script>

<style scoped>
.profile {
  font-family: var(--font-ui);
  background: var(--bg-color);
  min-height: calc(100vh - 160px);
  padding: 2rem 0;
}

.profile-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 2rem;
}

.profile-header {
  background: var(--card-bg);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px var(--shadow-color);
  margin-bottom: 2rem;
  border: 1px solid var(--border-color);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.avatar img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--bg-color);
  border: 2px solid var(--primary-color);
}

.user-details h1 {
  margin: 0 0 0.5rem 0;
  color: var(--accent-color);
  font-family: var(--font-ui);
}

.user-bio {
  color: var(--secondary-color);
  margin-bottom: 1rem;
  font-family: var(--font-ui);
}

.user-stats {
  display: flex;
  gap: 2rem;
}

.stat {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--primary-color);
  font-family: var(--font-ui);
}

.stat-label {
  font-size: 0.9rem;
  color: var(--secondary-color);
  font-family: var(--font-ui);
}

.tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 2rem;
}

.tab {
  padding: 1rem 2rem;
  background: none;
  border: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
  color: var(--primary-color);
  font-family: var(--font-ui);
}

.tab.active {
  border-bottom-color: var(--primary-color);
  color: var(--accent-color);
  font-weight: bold;
}

.tab:hover {
  background: var(--bg-color);
}

.collection-list,
.comment-list,
.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.collection-item,
.comment-item,
.history-item {
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px var(--shadow-color);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  border: 1px solid var(--border-color);
}

.collection-item:hover,
.comment-item:hover,
.history-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(93, 64, 55, 0.15);
}

.remove-btn,
.delete-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.25rem 0.5rem;
  background: var(--secondary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.3s ease;
  font-family: var(--font-ui);
}

.remove-btn:hover,
.delete-btn:hover {
  background: #8d6e63;
  transform: translateY(-1px);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.poem-title {
  color: var(--primary-color);
  cursor: pointer;
  font-weight: bold;
  font-family: 'Noto Serif SC', 'SimSun', serif;
}

.poem-title:hover {
  text-decoration: underline;
}

.comment-time,
.view-time {
  color: var(--secondary-color);
  font-size: 0.9rem;
  font-family: var(--font-ui);
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--secondary-color);
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 4px 20px var(--shadow-color);
  border: 1px solid var(--border-color);
  font-family: var(--font-ui);
}
</style>