<template>
  <div class="home">
    <!-- 英雄区域 -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">诗词赏析</h1>
        <p class="hero-subtitle">品味千年文化，感受诗词魅力</p>
        <div class="hero-stats">
          <div class="stat-item">
            <span class="stat-number">5000+</span>
            <span class="stat-label">首诗词</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">300+</span>
            <span class="stat-label">位诗人</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">10+</span>
            <span class="stat-label">个朝代</span>
          </div>
        </div>
        <div class="hero-actions">
          <button class="btn btn-primary" @click="navigateToPoems">开始探索</button>
          <button class="btn btn-secondary" @click="navigateToSearch">搜索诗词</button>
        </div>
      </div>
      <div class="hero-background">
        <div class="bg-pattern"></div>
      </div>
    </section>

    <!-- 精选诗词 -->
    <section class="featured-section">
      <div class="section-header">
        <h2>精选诗词</h2>
        <p>经典佳作，值得细细品味</p>
      </div>
      <div v-if="isLoading" class="loading">加载中...</div>
      <div v-else-if="featuredPoems.length === 0" class="no-data">
        <p>暂无诗词数据，请先添加诗词到数据库</p>
      </div>
      <div v-else class="featured-poems">
        <div v-for="poem in featuredPoems" :key="poem.id" class="poem-card" @click="viewPoem(poem.id)">
          <div class="poem-card-content">
            <h3 class="poem-title">{{ poem.title }}</h3>
            <p class="poem-author">{{ poem.author }} · {{ poem.dynasty }}</p>
            <p class="poem-excerpt">{{ getPoemExcerpt(poem.content) }}</p>
            <div class="poem-meta">
              <span class="favorite-count">❤️ {{ poem.favorite_count || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 热门排行 -->
    <section class="popular-section">
      <div class="section-header">
        <h2>热门排行</h2>
        <p>最受欢迎的诗词作品</p>
      </div>
      <div v-if="isLoading" class="loading">加载中...</div>
      <div v-else-if="popularPoems.length === 0" class="no-data">
        <p>暂无热门诗词数据</p>
      </div>
      <div v-else class="popular-list">
        <div v-for="poem in popularPoems" :key="poem.id" class="popular-item" @click="viewPoem(poem.id)">
          <div class="rank">{{ poem.rank }}</div>
          <div class="poem-info">
            <h4 class="poem-title">{{ poem.title }}</h4>
            <p class="poem-meta">{{ poem.author }} · {{ poem.dynasty }}</p>
          </div>
          <div class="views">{{ poem.view_count || 0 }} 浏览</div>
        </div>
      </div>
    </section>

    <!-- 快速导航 -->
    <section class="quick-nav">
      <div class="nav-grid">
        <div class="nav-item" @click="navigateToPoems">
          <div class="nav-icon">📚</div>
          <h3>全部诗词</h3>
          <p>浏览完整的诗词库</p>
        </div>
        <div class="nav-item" @click="navigateToSearch">
          <div class="nav-icon">🔍</div>
          <h3>搜索诗词</h3>
          <p>快速找到心仪的诗词</p>
        </div>
        <div class="nav-item" @click="navigateToProfile">
          <div class="nav-icon">👤</div>
          <h3>个人中心</h3>
          <p>管理收藏和评论</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'

const router = useRouter()
const featuredPoems = ref([])
const popularPoems = ref([])
const isLoading = ref(true)

// 获取诗词摘要
const getPoemExcerpt = (content) => {
  if (!content) return '暂无内容'
  const firstLine = content.split('\n')[0]
  return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine
}

// 页面加载动画
onMounted(async () => {
  try {
    console.log('开始加载诗词数据...')
    
    // 直接使用Supabase获取数据
    const { data: poemsData, error } = await supabase
      .from('poems')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) {
      console.error('Supabase查询错误:', error)
      throw error
    }
    
    console.log('从Supabase获取到的数据:', poemsData)
    
    if (poemsData && poemsData.length > 0) {
      // 精选诗词 - 取最新的3首
      featuredPoems.value = poemsData.slice(0, 3)
      
      // 热门排行 - 按收藏数排序
      const sortedPoems = [...poemsData].sort((a, b) => (b.favorite_count || 0) - (a.favorite_count || 0))
      popularPoems.value = sortedPoems.slice(0, 6).map((poem, index) => ({
        ...poem,
        rank: index + 1
      }))
      
      console.log('精选诗词:', featuredPoems.value)
      console.log('热门排行:', popularPoems.value)
    } else {
      console.log('Supabase中没有诗词数据')
      featuredPoems.value = []
      popularPoems.value = []
    }
  } catch (error) {
    console.error('加载诗词数据失败:', error)
    featuredPoems.value = []
    popularPoems.value = []
  } finally {
    isLoading.value = false
  }
})

// 导航方法
const navigateToPoems = () => {
  router.push('/poems')
}

const navigateToSearch = () => {
  router.push('/search')
}

const navigateToProfile = () => {
  router.push('/profile')
}

const viewPoem = (poemId) => {
  router.push(`/poem/${poemId}`)
}
</script>

<style scoped>
.home {
  font-family: var(--font-ui);
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.hero {
  position: relative;
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(45deg, #8B4513, #D2691E, #CD853F);
  color: white;
  text-align: center;
  overflow: hidden;
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 800px;
  padding: 2rem;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  font-family: 'Noto Serif SC', 'SimSun', serif;
}

.hero-subtitle {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.hero-stats {
  display: flex;
  justify-content: center;
  gap: 3rem;
  margin-bottom: 2rem;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 2rem;
  font-weight: bold;
}

.stat-label {
  font-size: 1rem;
  opacity: 0.8;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}

.btn-primary {
  background: #FFD700;
  color: #8B4513;
  font-weight: bold;
}

.btn-primary:hover {
  background: #FFC107;
  transform: translateY(-2px);
}

.btn-secondary {
  background: rgba(255,255,255,0.2);
  color: white;
  border: 2px solid white;
}

.btn-secondary:hover {
  background: rgba(255,255,255,0.3);
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.bg-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E");
  opacity: 0.3;
}

.featured-section, .popular-section, .quick-nav {
  padding: 4rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 3rem;
}

.section-header h2 {
  font-size: 2.5rem;
  color: #8B4513;
  margin-bottom: 1rem;
}

.section-header p {
  font-size: 1.2rem;
  color: #666;
}

.featured-poems {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
}

.poem-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e0e0e0;
}

.poem-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
}

.poem-title {
  font-size: 1.5rem;
  color: #8B4513;
  margin-bottom: 0.5rem;
  font-family: 'Noto Serif SC', 'SimSun', serif;
}

.poem-author {
  color: #666;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  font-family: 'Noto Serif SC', 'SimSun', serif;
}

.poem-excerpt {
  color: #333;
  line-height: 1.6;
  margin-bottom: 1rem;
  font-family: 'Noto Serif SC', 'SimSun', serif;
}

.poem-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: #888;
}

.popular-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.popular-item {
  display: flex;
  align-items: center;
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.popular-item:hover {
  transform: translateX(5px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.rank {
  font-size: 1.5rem;
  font-weight: bold;
  color: #8B4513;
  min-width: 40px;
}

.poem-info {
  flex: 1;
  margin: 0 1.5rem;
}

.poem-info h4 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.poem-info .poem-meta {
  margin: 0.25rem 0 0 0;
  color: #666;
}

.views {
  color: #888;
  font-size: 0.9rem;
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.nav-item {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.nav-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0,0,0,0.2);
}

.nav-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.nav-item h3 {
  color: #8B4513;
  margin-bottom: 0.5rem;
}

.nav-item p {
  color: #666;
  margin: 0;
}

.loading, .no-data {
  text-align: center;
  padding: 3rem;
  font-size: 1.2rem;
  color: #666;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-stats {
    flex-direction: column;
    gap: 1rem;
  }
  
  .hero-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .featured-poems {
    grid-template-columns: 1fr;
  }
  
  .nav-grid {
    grid-template-columns: 1fr;
  }
}
</style>