import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // 用户状态
  const user = ref(null)
  const isLoggedIn = ref(false)
  
  // 用户数据
  const collections = ref([])
  const comments = ref([])
  const browseHistory = ref([])

  // 计算属性
  const collectionCount = computed(() => collections.value.length)
  const commentCount = computed(() => comments.value.length)

  // 用户操作
  const login = (userData) => {
    user.value = userData
    isLoggedIn.value = true
    // 模拟加载用户数据
    loadUserData()
  }

  const logout = () => {
    user.value = null
    isLoggedIn.value = false
    collections.value = []
    comments.value = []
    browseHistory.value = []
  }

  const addCollection = (poem) => {
    if (!collections.value.find(item => item.id === poem.id)) {
      collections.value.push({
        id: poem.id,
        title: poem.title,
        author: poem.author,
        dynasty: poem.dynasty,
        addedAt: new Date().toISOString()
      })
    }
  }

  const removeCollection = (poemId) => {
    collections.value = collections.value.filter(item => item.id !== poemId)
  }

  const addComment = (poemId, poemTitle, content) => {
    const comment = {
      id: Date.now(),
      poemId,
      poemTitle,
      content,
      time: new Date().toLocaleDateString(),
      createdAt: new Date().toISOString()
    }
    comments.value.unshift(comment)
    return comment
  }

  const deleteComment = (commentId) => {
    comments.value = comments.value.filter(comment => comment.id !== commentId)
  }

  const addToHistory = (poem) => {
    const existingIndex = browseHistory.value.findIndex(item => item.poemId === poem.id)
    
    if (existingIndex > -1) {
      // 如果已存在，移到最前面
      const [existing] = browseHistory.value.splice(existingIndex, 1)
      existing.viewedAt = new Date().toISOString()
      browseHistory.value.unshift(existing)
    } else {
      // 添加新的浏览记录
      browseHistory.value.unshift({
        id: Date.now(),
        poemId: poem.id,
        poemTitle: poem.title,
        author: poem.author,
        dynasty: poem.dynasty,
        viewedAt: new Date().toISOString()
      })
      
      // 保持历史记录不超过50条
      if (browseHistory.value.length > 50) {
        browseHistory.value.pop()
      }
    }
  }

  // 模拟加载用户数据
  const loadUserData = () => {
    // 这里可以替换为实际的API调用
    collections.value = [
      { id: 1, title: '静夜思', author: '李白', dynasty: '唐代', addedAt: '2024-01-15T10:30:00Z' },
      { id: 2, title: '春晓', author: '孟浩然', dynasty: '唐代', addedAt: '2024-01-14T09:15:00Z' }
    ]
    
    comments.value = [
      { id: 1, poemId: 1, poemTitle: '静夜思', content: '这首诗意境优美！', time: '2024-01-15', createdAt: '2024-01-15T10:30:00Z' }
    ]
    
    browseHistory.value = [
      { id: 1, poemId: 1, poemTitle: '静夜思', author: '李白', dynasty: '唐代', viewedAt: '2024-01-15T10:30:00Z' },
      { id: 2, poemId: 2, poemTitle: '春晓', author: '孟浩然', dynasty: '唐代', viewedAt: '2024-01-14T09:15:00Z' }
    ]
  }

  return {
    // 状态
    user,
    isLoggedIn,
    collections,
    comments,
    browseHistory,
    
    // 计算属性
    collectionCount,
    commentCount,
    
    // 方法
    login,
    logout,
    addCollection,
    removeCollection,
    addComment,
    deleteComment,
    addToHistory,
    loadUserData
  }
})