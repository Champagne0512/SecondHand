<template>
  <div class="poems">
    <div class="page-header">
      <div class="header-content">
        <h1>诗词浏览</h1>
        <div class="filter-controls">
          <select v-model="selectedDynasty" @change="filterPoems">
            <option value="">全部朝代</option>
            <option v-for="dynasty in dynasties" :key="dynasty" :value="dynasty">{{ dynasty }}</option>
          </select>
          <select v-model="selectedAuthor" @change="filterPoems">
            <option value="">全部作者</option>
            <option v-for="author in authors" :key="author" :value="author">{{ author }}</option>
          </select>
        </div>
      </div>
    </div>
    
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>正在加载诗词数据...</p>
    </div>
    
    <div v-else class="poem-grid">
      <div v-for="poem in filteredPoems" :key="poem.id" class="poem-item" @click="viewPoem(poem.id)">
        <div class="poem-image" v-if="poem.image">
          <img :src="poem.image" :alt="poem.title" class="poem-img">
        </div>
        <h3 class="poem-title">{{ poem.title }}</h3>
        <p class="poem-meta">{{ poem.author }} · {{ poem.dynasty }}</p>
        <div class="poem-content">
          {{ poem.content }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'

const router = useRouter()
const poems = ref([])
const selectedDynasty = ref('')
const selectedAuthor = ref('')
const isLoading = ref(true)

// 组件挂载时加载诗词数据
onMounted(async () => {
  try {
    console.log('开始加载诗词数据...')
    const { data, error } = await supabase
      .from('poems')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    console.log('从Supabase获取到的诗词数据:', data)
    poems.value = data || []
    isLoading.value = false
  } catch (error) {
    console.error('加载诗词数据失败:', error)
    poems.value = []
    isLoading.value = false
  }
})

// 获取所有朝代和作者
const dynasties = computed(() => [...new Set(poems.value.map(p => p.dynasty))])
const authors = computed(() => [...new Set(poems.value.map(p => p.author))])

// 过滤诗词
const filteredPoems = computed(() => {
  return poems.value.filter(poem => {
    const matchDynasty = !selectedDynasty.value || poem.dynasty === selectedDynasty.value
    const matchAuthor = !selectedAuthor.value || poem.author === selectedAuthor.value
    return matchDynasty && matchAuthor
  })
})

const filterPoems = () => {
  // 过滤逻辑已在computed属性中实现
}

const viewPoem = (poemId) => {
  router.push(`/poem/${poemId}`)
}
</script>

<style scoped>
.poems {
  font-family: var(--font-ui);
  background: var(--bg-color);
  min-height: calc(100vh - 160px);
  padding: 2rem 0;
}

.page-header {
  background: var(--card-bg);
  padding: 1.5rem 0;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 2px 10px var(--shadow-color);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h1 {
  color: var(--accent-color);
  margin: 0;
  font-size: 1.8rem;
  font-weight: bold;
  font-family: var(--font-ui);
}

.filter-controls {
  display: flex;
  gap: 1rem;
}

.filter-controls select {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--card-bg);
  font-size: 0.9rem;
  color: var(--accent-color);
  transition: all 0.3s ease;
  font-family: var(--font-ui);
}

.filter-controls select:focus {
  outline: none;
  border-color: var(--primary-color);
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

.poem-grid {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.poem-item {
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

.poem-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 32px rgba(93, 64, 55, 0.15);
  border-color: var(--primary-color);
}

.poem-image {
  height: 120px;
  background: linear-gradient(135deg, var(--bg-color) 0%, var(--border-color) 100%);
  margin: -1.5rem -1.5rem 1rem -1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.poem-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.poem-title {
  color: var(--accent-color);
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
  font-weight: 600;
  font-family: 'Noto Serif SC', 'SimSun', serif;
}

.poem-meta {
  color: var(--secondary-color);
  font-size: 0.9rem;
  margin-bottom: 1rem;
  font-family: 'Noto Serif SC', 'SimSun', serif;
}

.poem-content {
  white-space: pre-line;
  line-height: 1.8;
  color: var(--text-color);
  font-family: 'Noto Serif SC', 'SimSun', serif;
  font-size: 1rem;
  max-height: 120px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
    padding: 0 1rem;
  }
  
  .filter-controls {
    width: 100%;
    justify-content: space-between;
  }
  
  .poem-grid {
    grid-template-columns: 1fr;
    padding: 0 1rem;
  }
}
</style>