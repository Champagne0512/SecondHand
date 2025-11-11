<template>
  <div class="poem-detail">
    <div v-if="poem">
      <div class="poem-container">
        <div class="poem-header">
          <h1 class="poem-title">{{ poem.title }}</h1>
          <div class="poem-meta">
            <span class="author">{{ poem.author }}</span>
            <span class="dynasty">{{ poem.dynasty }}</span>
          </div>
        </div>
        
        <div class="poem-content">
          <div class="poem-text">{{ formatPoemContent(poem.content) }}</div>
        </div>
        
        <div class="poem-actions">
          <button class="btn btn-primary" @click="toggleFavorite">
            {{ isFavorite ? '取消收藏' : '收藏' }}
          </button>
          <button class="btn btn-secondary" @click="sharePoem">分享</button>
        </div>
        
        <div class="poem-analysis">
          <h3>诗词赏析</h3>
          <p>{{ poem.analysis || '暂无赏析内容' }}</p>
        </div>
        
        <div class="comments-section">
          <h3>评论</h3>
          <div class="comment-form">
            <textarea v-model="newComment" placeholder="写下您的评论..."></textarea>
            <button class="btn btn-primary" @click="addComment">发表评论</button>
          </div>
          
          <div class="comments-list">
            <div v-for="comment in comments" :key="comment.id" class="comment">
              <div class="comment-header">
                <span class="user-name">{{ comment.user }}</span>
                <span class="comment-time">{{ comment.time }}</span>
              </div>
              <p class="comment-content">{{ comment.content }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else-if="isLoading" class="loading">
      <div class="loading-spinner"></div>
      <p>正在加载诗词详情...</p>
    </div>
    
    <div v-else class="error">
      <p>{{ error || '诗词详情加载失败' }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '@/utils/supabase'

const route = useRoute()
const poemId = ref(route.params.id)
const poem = ref(null)
const isFavorite = ref(false)
const newComment = ref('')
const comments = ref([])
const isLoading = ref(true)
const error = ref(null)

// 格式化诗词内容（处理换行符）
const formatPoemContent = (content) => {
  if (!content) return ''
  return content.replace(/\\n/g, '\n')
}

onMounted(async () => {
  try {
    console.log('开始加载诗词详情，ID:', poemId.value)
    isLoading.value = true
    error.value = null
    
    // 直接查询Supabase获取诗词详情
    const { data, error: supabaseError } = await supabase
      .from('poems')
      .select('*')
      .eq('id', poemId.value)
      .single()
    
    if (supabaseError) {
      console.error('Supabase查询错误:', supabaseError)
      throw supabaseError
    }
    
    if (data) {
      poem.value = data
      console.log('获取到的诗词数据:', data)
      
      // 增加浏览次数
      await supabase
        .from('poems')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', poemId.value)
      
      // 检查收藏状态（需要用户登录）
      const { data: userData } = await supabase.auth.getUser()
      if (userData.user) {
        const { data: favoriteData } = await supabase
          .from('favorites')
          .select('id')
          .eq('poem_id', poemId.value)
          .eq('user_id', userData.user.id)
          .single()
        
        isFavorite.value = !!favoriteData
      }
      
      // 模拟评论数据
      comments.value = [
        { id: 1, user: '诗词爱好者', time: '2024-01-15', content: '这首诗意境优美，读来令人回味无穷。' },
        { id: 2, user: '文学研究者', time: '2024-01-14', content: '李白的诗作总是充满浪漫主义色彩。' }
      ]
    } else {
      error.value = '未找到该诗词'
    }
  } catch (err) {
    console.error('加载诗词详情失败:', err)
    error.value = err.message || '加载失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
})

// 收藏/取消收藏
const toggleFavorite = async () => {
  try {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      alert('请先登录后再收藏')
      return
    }
    
    if (isFavorite.value) {
      // 取消收藏
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('poem_id', poemId.value)
        .eq('user_id', userData.user.id)
      
      if (!error) {
        isFavorite.value = false
        // 更新诗词的收藏数
        if (poem.value) {
          poem.value.favorite_count = Math.max(0, (poem.value.favorite_count || 0) - 1)
        }
      }
    } else {
      // 添加收藏
      const { error } = await supabase
        .from('favorites')
        .insert({
          poem_id: poemId.value,
          user_id: userData.user.id
        })
      
      if (!error) {
        isFavorite.value = true
        // 更新诗词的收藏数
        if (poem.value) {
          poem.value.favorite_count = (poem.value.favorite_count || 0) + 1
        }
      }
    }
  } catch (err) {
    console.error('收藏操作失败:', err)
    alert('操作失败，请稍后重试')
  }
}

const sharePoem = () => {
  // 模拟分享功能
  alert('分享功能开发中...')
}

const addComment = () => {
  if (newComment.value.trim()) {
    comments.value.unshift({
      id: Date.now(),
      user: '当前用户',
      time: new Date().toLocaleDateString(),
      content: newComment.value
    })
    newComment.value = ''
  }
}
</script>

<style scoped>
.poem-detail {
  font-family: var(--font-ui);
  background: var(--bg-color);
  min-height: calc(100vh - 160px);
  padding: 2rem 0;
}

.poem-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 2rem;
}

.poem-header {
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 4px 20px var(--shadow-color);
  border: 1px solid var(--border-color);
}

.poem-title {
  font-size: 2.2rem;
  color: var(--accent-color);
  margin-bottom: 1rem;
  font-weight: bold;
  font-family: 'Noto Serif SC', 'SimSun', serif;
  position: relative;
  display: inline-block;
}

.poem-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 25%;
  width: 50%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--primary-color), transparent);
}

.poem-meta {
  color: var(--secondary-color);
  font-family: 'Noto Serif SC', 'SimSun', serif;
}

.author {
  font-size: 1.3rem;
  margin-right: 1rem;
  color: var(--secondary-color);
  font-family: 'Noto Serif SC', 'SimSun', serif;
}

.poem-content {
  text-align: center;
  margin: 2rem 0;
  padding: 2rem;
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 4px 20px var(--shadow-color);
  border: 1px solid var(--border-color);
}

.poem-text {
  font-family: 'Noto Serif SC', 'SimSun', serif;
  font-size: 1.4rem;
  line-height: 2.2;
  white-space: pre-wrap;
  color: var(--text-color);
  text-shadow: 0.5px 0.5px 1px rgba(0, 0, 0, 0.05);
  font-weight: 400;
  letter-spacing: 0.5px;
}

.poem-actions {
  text-align: center;
  margin: 2rem 0;
}

.poem-actions .btn {
  margin: 0 0.5rem;
  background: var(--primary-color);
  border: none;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: var(--font-ui);
}

.poem-actions .btn:hover {
  background: #6d5c47;
  transform: translateY(-2px);
}

.poem-actions .btn-secondary {
  background: var(--secondary-color);
}

.poem-actions .btn-secondary:hover {
  background: #8d6e63;
}

.poem-analysis,
.comments-section {
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px var(--shadow-color);
  margin-bottom: 1rem;
  border: 1px solid var(--border-color);
}

.poem-analysis h3,
.comments-section h3 {
  color: var(--accent-color);
  border-bottom: 2px solid var(--primary-color);
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
  font-family: var(--font-ui);
}

.comment-form textarea {
  width: 100%;
  height: 80px;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  margin-bottom: 1rem;
  resize: vertical;
  background: var(--bg-color);
  font-family: var(--font-ui);
}

.comment {
  border-bottom: 1px solid var(--border-color);
  padding: 1rem 0;
}

.comment:last-child {
  border-bottom: none;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.user-name {
  font-weight: bold;
  color: var(--primary-color);
  font-family: var(--font-ui);
}

.comment-time {
  color: var(--secondary-color);
  font-size: 0.9rem;
  font-family: var(--font-ui);
}

.loading, .error {
  text-align: center;
  padding: 2rem;
  color: var(--primary-color);
  font-family: var(--font-ui);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>