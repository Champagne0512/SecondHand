import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePoemStore = defineStore('poem', () => {
  // 诗词数据
  const poems = ref([
    {
      id: 1,
      title: '静夜思',
      author: '李白',
      dynasty: '唐代',
      content: '床前明月光，疑是地上霜。\n举头望明月，低头思故乡。',
      analysis: '这首诗通过描绘月夜思乡的场景，表达了诗人深切的思乡之情。语言简练，意境深远。',
      tags: ['思乡', '月亮', '夜晚'],
      views: 156,
      favorites: 89
    },
    {
      id: 2,
      title: '春晓',
      author: '孟浩然',
      dynasty: '唐代',
      content: '春眠不觉晓，处处闻啼鸟。\n夜来风雨声，花落知多少。',
      analysis: '这首诗描绘了春天早晨的景色，语言清新自然，表达了诗人对春天的热爱。',
      tags: ['春天', '早晨', '自然'],
      views: 134,
      favorites: 76
    },
    {
      id: 3,
      title: '登鹳雀楼',
      author: '王之涣',
      dynasty: '唐代',
      content: '白日依山尽，黄河入海流。\n欲穷千里目，更上一层楼。',
      analysis: '这首诗通过登高望远，表达了积极向上的人生态度和远大的志向。',
      tags: ['登高', '志向', '黄河'],
      views: 98,
      favorites: 65
    },
    {
      id: 4,
      title: '相思',
      author: '王维',
      dynasty: '唐代',
      content: '红豆生南国，春来发几枝。\n愿君多采撷，此物最相思。',
      analysis: '这首诗以红豆起兴，表达了深切的相思之情，语言含蓄优美。',
      tags: ['相思', '爱情', '红豆'],
      views: 112,
      favorites: 78
    },
    {
      id: 5,
      title: '江雪',
      author: '柳宗元',
      dynasty: '唐代',
      content: '千山鸟飞绝，万径人踪灭。\n孤舟蓑笠翁，独钓寒江雪。',
      analysis: '这首诗描绘了一幅江雪垂钓图，意境孤寂清冷，表达了诗人的孤高情怀。',
      tags: ['冬天', '雪景', '孤独'],
      views: 87,
      favorites: 54
    }
  ])

  // 搜索状态
  const searchResults = ref([])
  const isLoading = ref(false)

  // 计算属性
  const totalPoems = computed(() => poems.value.length)
  const popularPoems = computed(() => 
    [...poems.value].sort((a, b) => b.views - a.views).slice(0, 5)
  )
  const featuredPoems = computed(() => 
    [...poems.value].sort((a, b) => b.favorites - a.favorites).slice(0, 3)
  )

  // 获取所有朝代
  const dynasties = computed(() => 
    [...new Set(poems.value.map(poem => poem.dynasty))]
  )

  // 获取所有作者
  const authors = computed(() => 
    [...new Set(poems.value.map(poem => poem.author))]
  )

  // 获取所有标签
  const allTags = computed(() => {
    const tags = poems.value.flatMap(poem => poem.tags)
    return [...new Set(tags)]
  })

  // 方法
  const getPoemById = (id) => {
    // 处理数字ID和字符串ID
    const idNum = parseInt(id)
    return poems.value.find(poem => poem.id === idNum || poem.id.toString() === id)
  }

  const searchPoems = (query) => {
    isLoading.value = true
    
    // 模拟搜索延迟
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!query.trim()) {
          searchResults.value = []
        } else {
          const lowerQuery = query.toLowerCase()
          searchResults.value = poems.value.filter(poem =>
            poem.title.toLowerCase().includes(lowerQuery) ||
            poem.author.toLowerCase().includes(lowerQuery) ||
            poem.content.toLowerCase().includes(lowerQuery) ||
            poem.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
          )
        }
        isLoading.value = false
        resolve(searchResults.value)
      }, 300)
    })
  }

  const filterPoems = (filters) => {
    const { dynasty, author, tag } = filters
    return poems.value.filter(poem => {
      const matchDynasty = !dynasty || poem.dynasty === dynasty
      const matchAuthor = !author || poem.author === author
      const matchTag = !tag || poem.tags.includes(tag)
      return matchDynasty && matchAuthor && matchTag
    })
  }

  const incrementViews = (poemId) => {
    const poem = poems.value.find(p => p.id === poemId)
    if (poem) {
      poem.views++
    }
  }

  const incrementFavorites = (poemId) => {
    const poem = poems.value.find(p => p.id === poemId)
    if (poem) {
      poem.favorites++
    }
  }

  const getPoemsByDynasty = (dynasty) => {
    return poems.value.filter(poem => poem.dynasty === dynasty)
  }

  const getPoemsByAuthor = (author) => {
    return poems.value.filter(poem => poem.author === author)
  }

  const getPoemsByTag = (tag) => {
    return poems.value.filter(poem => poem.tags.includes(tag))
  }

  return {
    // 状态
    poems,
    searchResults,
    isLoading,
    
    // 计算属性
    totalPoems,
    popularPoems,
    featuredPoems,
    dynasties,
    authors,
    allTags,
    
    // 方法
    getPoemById,
    searchPoems,
    filterPoems,
    incrementViews,
    incrementFavorites,
    getPoemsByDynasty,
    getPoemsByAuthor,
    getPoemsByTag
  }
})