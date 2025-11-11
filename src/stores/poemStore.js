import { defineStore } from 'pinia'
import { supabase } from '../utils/supabase.js'

export const usePoemStore = defineStore('poem', {
  state: () => ({
    poems: [],
    currentPoem: null,
    favorites: [],
    searchResults: [],
    userComments: [],
    userFavorites: new Set(),
    isLoading: false,
    error: null,
    user: null
  }),

  getters: {
    // 获取热门诗词（使用存储过程）
    popularPoems: (state) => {
      return state.poems.slice(0, 10)
    },

    // 获取最新诗词（使用存储过程）
    recentPoems: (state) => {
      return state.poems.slice(0, 10)
    },

    // 检查诗词是否被收藏
    isFavorite: (state) => (poemId) => {
      return state.userFavorites.has(poemId)
    },

    // 根据ID获取诗词
    getPoemById: (state) => (id) => {
      return state.poems.find(poem => poem.id === id) || null
    }
  },

  actions: {
    // 加载所有诗词
    async loadPoems() {
      this.isLoading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('poems')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) throw error
        this.poems = data
      } catch (error) {
        this.error = error.message
        console.error('加载诗词失败:', error)
      } finally {
        this.isLoading = false
      }
    },

    // 加载诗词详情
    async loadPoemDetail(id) {
      this.isLoading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('poems')
          .select('*')
          .eq('id', id)
          .single()
        
        if (error) throw error
        this.currentPoem = data
        
        // 增加浏览次数
        await this.incrementViewCount(id)
        
        // 获取该诗词的评论
        await this.fetchCommentsForPoem(id)
        
        // 检查用户是否已收藏
        await this.checkIfFavorite(id)
      } catch (error) {
        this.error = error.message
        console.error('加载诗词详情失败:', error)
      } finally {
        this.isLoading = false
      }
    },

    // 增加浏览次数
    async incrementViewCount(poemId) {
      try {
        const { error } = await supabase.rpc('increment_poem_view_count', {
          poem_id: poemId,
          user_id: this.user?.id || null
        })
        
        if (error) throw error
      } catch (error) {
        console.error('增加浏览次数失败:', error)
      }
    },

    // 搜索诗词（使用存储过程）
    async searchPoems(query) {
      this.isLoading = true
      this.error = null
      try {
        const { data, error } = await supabase.rpc('search_poems', {
          query_text: query
        })
        
        if (error) throw error
        this.searchResults = data
      } catch (error) {
        this.error = error.message
        console.error('搜索诗词失败:', error)
      } finally {
        this.isLoading = false
      }
    },

    // 按朝代筛选（使用存储过程）
    async filterByDynasty(dynasty) {
      this.isLoading = true
      this.error = null
      try {
        const { data, error } = await supabase.rpc('get_poems_by_dynasty', {
          dynasty_name: dynasty
        })
        
        if (error) throw error
        this.poems = data
      } catch (error) {
        this.error = error.message
        console.error('按朝代筛选失败:', error)
      } finally {
        this.isLoading = false
      }
    },

    // 获取热门诗词（使用存储过程）
    async fetchPopularPoems(limit = 10) {
      try {
        const { data, error } = await supabase.rpc('get_popular_poems', {
          limit_count: limit
        })
        
        if (error) throw error
        return data
      } catch (error) {
        console.error('获取热门诗词失败:', error)
        return []
      }
    },

    // 获取最新诗词（使用存储过程）
    async fetchRecentPoems(limit = 10) {
      try {
        const { data, error } = await supabase.rpc('get_recent_poems', {
          limit_count: limit
        })
        
        if (error) throw error
        return data
      } catch (error) {
        console.error('获取最新诗词失败:', error)
        return []
      }
    },

    // 收藏/取消收藏诗词
    async toggleFavorite(poemId) {
      if (!this.user) {
        this.error = '请先登录'
        throw new Error('请先登录')
      }

      try {
        if (this.userFavorites.has(poemId)) {
          // 取消收藏
          const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', this.user.id)
            .eq('poem_id', poemId)
          
          if (error) throw error
          this.userFavorites.delete(poemId)
        } else {
          // 添加收藏
          const { error } = await supabase
            .from('favorites')
            .insert({
              user_id: this.user.id,
              poem_id: poemId
            })
          
          if (error) throw error
          this.userFavorites.add(poemId)
        }
      } catch (error) {
        this.error = error.message
        console.error('收藏操作失败:', error)
        throw error
      }
    },

    // 检查是否已收藏
    async checkIfFavorite(poemId) {
      if (!this.user) return false

      try {
        const { data, error } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', this.user.id)
          .eq('poem_id', poemId)
          .single()
        
        if (error && error.code !== 'PGRST116') throw error
        
        if (data) {
          this.userFavorites.add(poemId)
          return true
        } else {
          this.userFavorites.delete(poemId)
          return false
        }
      } catch (error) {
        console.error('检查收藏状态失败:', error)
        return false
      }
    },

    // 获取用户收藏
    async fetchUserFavorites() {
      if (!this.user) return []

      try {
        const { data, error } = await supabase
          .from('favorites')
          .select(`
            poem_id,
            poems (*)
          `)
          .eq('user_id', this.user.id)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        return data.map(item => item.poems)
      } catch (error) {
        console.error('获取用户收藏失败:', error)
        return []
      }
    },

    // 添加评论
    async addComment(poemId, content) {
      if (!this.user) {
        this.error = '请先登录'
        throw new Error('请先登录')
      }

      try {
        const { data, error } = await supabase
          .from('comments')
          .insert({
            user_id: this.user.id,
            poem_id: poemId,
            content: content
          })
          .select()
        
        if (error) throw error
        
        // 刷新评论列表
        await this.fetchCommentsForPoem(poemId)
        return data
      } catch (error) {
        this.error = error.message
        console.error('添加评论失败:', error)
        throw error
      }
    },

    // 获取诗词评论
    async fetchCommentsForPoem(poemId) {
      try {
        const { data, error } = await supabase
          .from('comments')
          .select(`
            *,
            profiles:user_id (username, avatar_url)
          `)
          .eq('poem_id', poemId)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        this.userComments = data || []
      } catch (error) {
        console.error('获取评论失败:', error)
        this.userComments = []
      }
    },

    // 获取用户浏览历史
    async fetchUserHistory() {
      if (!this.user) return []

      try {
        const { data, error } = await supabase
          .from('browse_history')
          .select(`
            poem_id,
            viewed_at,
            poems (*)
          `)
          .eq('user_id', this.user.id)
          .order('viewed_at', { ascending: false })
          .limit(20)
        
        if (error) throw error
        return data.map(item => ({
          ...item.poems,
          viewed_at: item.viewed_at
        }))
      } catch (error) {
        console.error('获取浏览历史失败:', error)
        return []
      }
    },

    // 用户认证相关
    async signIn(email, password) {
      this.isLoading = true
      this.error = null
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        if (error) throw error
        this.user = data.user
        await this.fetchUserFavorites()
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async signUp(email, password, username) {
      this.isLoading = true
      this.error = null
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username
            }
          }
        })
        
        if (error) throw error
        this.user = data.user
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async signOut() {
      try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        this.user = null
        this.favorites = []
        this.userFavorites.clear()
        this.userComments = []
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    // 初始化认证状态监听
    initAuthListener() {
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          this.user = session.user
          this.fetchUserFavorites()
        } else if (event === 'SIGNED_OUT') {
          this.user = null
          this.favorites = []
          this.userFavorites.clear()
          this.userComments = []
        }
      })
    }
  }
})