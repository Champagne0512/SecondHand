<template>
  <div class="search">
    <div class="search-header">
      <h1>诗词搜索</h1>
      <div class="search-box">
        <input 
          v-model="searchQuery" 
          @input="handleSearch" 
          placeholder="输入诗词标题、作者或内容..."
          type="text"
          class="search-input"
        />
        <button @click="performSearch" class="search-btn">搜索</button>
      </div>
    </div>
    
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>正在搜索...</p>
    </div>
    
    <div class="search-results" v-else-if="searchResults.length > 0">
      <h2>搜索结果 ({{ searchResults.length }})</h2>
      <div class="results-list">
        <div v-for="poem in searchResults" :key="poem.id" class="result-item" @click="viewPoem(poem.id)">
          <h3 class="poem-title">{{ poem.title }}</h3>
          <p class="poem-meta">{{ poem.author }} · {{ poem.dynasty }}</p>
          <p class="poem-excerpt">{{ getExcerpt(poem.content) }}</p>
        </div>
      </div>
    </div>
    
    <div class="no-results" v-else-if="searchQuery && !isLoading">
      <p>未找到相关诗词</p>
    </div>
    
    <div class="popular-searches" v-if="!searchQuery">
      <h2>热门搜索</h2>
      <div class="tags">
        <span v-for="tag in popularTags" :key="tag" class="tag" @click="searchByTag(tag)">
          {{ tag }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'

const router = useRouter()
const searchQuery = ref('')
const searchResults = ref([])
const isLoading = ref(false)
const poems = ref([])

const popularTags = ref(['李白', '唐诗', '宋词', '杜甫', '苏轼', '爱情诗', '山水诗'])

// 组件挂载时加载诗词数据
onMounted(async () => {
  try {
    console.log('开始加载诗词数据用于搜索...')
    const { data, error } = await supabase
      .from('poems')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    console.log('从Supabase获取到的搜索数据:', data)
    poems.value = data || []
  } catch (error) {
    console.error('加载诗词数据失败:', error)
    poems.value = []
  }
})

const getExcerpt = (content) => {
  if (!content) return ''
  return content.split('\n')[0].substring(0, 50) + '...'
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    performSearch()
  } else {
    searchResults.value = []
  }
}

const performSearch = async () => {
  if (!searchQuery.value.trim()) return
  
  isLoading.value = true
  
  try {
    const query = searchQuery.value.toLowerCase()
    console.log('执行搜索，关键词:', query)
    
    // 使用Supabase进行实时搜索
    const { data, error } = await supabase
      .from('poems')
      .select('*')
      .or(`title.ilike.%${query}%,author.ilike.%${query}%,content.ilike.%${query}%,dynasty.ilike.%${query}%`)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    console.log('搜索到的结果:', data)
    searchResults.value = data || []
  } catch (error) {
    console.error('搜索失败:', error)
    searchResults.value = []
  } finally {
    isLoading.value = false
  }
}

const searchByTag = (tag) => {
  searchQuery.value = tag
  performSearch()
}

const viewPoem = (poemId) => {
  router.push(`/poem/${poemId}`)
}
</script>

<style scoped>
.search {
  font-family: var(--font-ui);
  background: var(--bg-color);
  min-height: calc(100vh - 160px);
  padding: 2rem 0;
}

.search-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 2rem;
}

.search-header {
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 4px 20px var(--shadow-color);
  border: 1px solid var(--border-color);
}

.search-header h1 {
  color: var(--accent-color);
  margin-bottom: 1rem;
  font-family: var(--font-ui);
}

.search-box {
  display: flex;
  gap: 0.5rem;
  max-width: 500px;
  margin: 0 auto;
}

.search-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1rem;
  background: var(--card-bg);
  font-family: var(--font-ui);
}

.search-btn {
  padding: 0.75rem 1.5rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  font-family: var(--font-ui);
}

.search-btn:hover {
  background: #6d5c47;
  transform: translateY(-2px);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 0;
  color: var(--secondary-color);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.search-results h2,
.popular-searches h2 {
  color: var(--accent-color);
  margin-bottom: 1rem;
  border-bottom: 2px solid var(--primary-color);
  padding-bottom: 0.5rem;
  font-family: var(--font-ui);
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.result-item {
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px var(--shadow-color);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
  position: relative;
  overflow: hidden;
}

.result-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(93, 64, 55, 0.15);
}

.poem-title {
  color: var(--primary-color);
  margin-bottom: 0.5rem;
  font-weight: bold;
  font-family: 'Noto Serif SC', 'SimSun', serif;
}

.poem-meta {
  color: var(--secondary-color);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  font-family: 'Noto Serif SC', 'SimSun', serif;
}

.poem-excerpt {
  color: var(--text-color);
  line-height: 1.6;
  font-family: 'Noto Serif SC', 'SimSun', serif;
}

.no-results {
  text-align: center;
  padding: 2rem;
  color: var(--secondary-color);
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 4px 20px var(--shadow-color);
  border: 1px solid var(--border-color);
  font-family: var(--font-ui);
}

.popular-searches {
  margin-top: 2rem;
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px var(--shadow-color);
  border: 1px solid var(--border-color);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  background: var(--bg-color);
  color: var(--primary-color);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  border: 1px solid var(--border-color);
  font-family: var(--font-ui);
}

.tag:hover {
  background: var(--primary-color);
  color: white;
  transform: translateY(-2px);
}
</style>