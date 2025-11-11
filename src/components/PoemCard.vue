<template>
  <div class="poem-card" @click="handleClick">
    <div class="poem-header">
      <h3 class="poem-title">{{ poem.title }}</h3>
      <div class="poem-meta">
        <span class="author">{{ poem.author }}</span>
        <span class="dynasty">{{ poem.dynasty }}</span>
      </div>
    </div>
    
    <div class="poem-content">
      <p class="poem-excerpt">{{ poem.excerpt || getExcerpt(poem.content) }}</p>
    </div>
    
    <div class="poem-footer">
      <div class="poem-stats">
        <span class="stat">
          <i class="icon-view">👁️</i>
          {{ poem.views || 0 }}
        </span>
        <span class="stat">
          <i class="icon-favorite">❤️</i>
          {{ poem.favorites || 0 }}
        </span>
      </div>
      
      <div class="poem-actions">
        <button 
          v-if="showFavorite" 
          class="btn-favorite" 
          :class="{ active: isFavorited }"
          @click.stop="toggleFavorite"
        >
          {{ isFavorited ? '已收藏' : '收藏' }}
        </button>
        <button class="btn-view" @click.stop="viewPoem">查看详情</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const props = defineProps({
  poem: {
    type: Object,
    required: true
  },
  showFavorite: {
    type: Boolean,
    default: true
  }
})

const router = useRouter()
const userStore = useUserStore()

const isFavorited = computed(() => {
  return userStore.collections.some(item => item.id === props.poem.id)
})

const getExcerpt = (content) => {
  if (!content) return ''
  const lines = content.split('\n')
  return lines.slice(0, 2).join(' ') + '...'
}

const handleClick = () => {
  viewPoem()
}

const viewPoem = () => {
  router.push(`/poem/${props.poem.id}`)
}

const toggleFavorite = () => {
  if (isFavorited.value) {
    userStore.removeCollection(props.poem.id)
  } else {
    userStore.addCollection(props.poem.id)
  }
}
</script>

<style scoped>
.poem-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e9ecef;
}

.poem-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.poem-header {
  margin-bottom: 1rem;
}

.poem-title {
  font-size: 1.2rem;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}

.poem-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #7f8c8d;
}

.author {
  font-weight: 500;
}

.poem-content {
  margin-bottom: 1rem;
}

.poem-excerpt {
  color: #555;
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.poem-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #e9ecef;
  padding-top: 1rem;
}

.poem-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: #7f8c8d;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.poem-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-favorite,
.btn-view {
  padding: 0.4rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s;
}

.btn-favorite.active {
  background: #e74c3c;
  color: white;
  border-color: #e74c3c;
}

.btn-favorite:hover {
  background: #f8f9fa;
}

.btn-favorite.active:hover {
  background: #c0392b;
}

.btn-view {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

.btn-view:hover {
  background: #2980b9;
}
</style>