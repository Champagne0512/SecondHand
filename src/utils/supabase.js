import { createClient } from '@supabase/supabase-js'

// Supabase配置 - 这些值需要从Supabase项目设置中获取
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 诗词数据表操作
export const poemsApi = {
  // 获取所有诗词
  async getAllPoems() {
    const { data, error } = await supabase
      .from('poems')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // 根据ID获取诗词详情
  async getPoemById(id) {
    const { data, error } = await supabase
      .from('poems')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // 搜索诗词
  async searchPoems(query) {
    const { data, error } = await supabase
      .from('poems')
      .select('*')
      .or(`title.ilike.%${query}%,author.ilike.%${query}%,content.ilike.%${query}%`)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // 根据朝代筛选
  async getPoemsByDynasty(dynasty) {
    const { data, error } = await supabase
      .from('poems')
      .select('*')
      .eq('dynasty', dynasty)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // 添加收藏
  async addFavorite(poemId, userId) {
    const { data, error } = await supabase
      .from('favorites')
      .insert({ poem_id: poemId, user_id: userId })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 移除收藏
  async removeFavorite(poemId, userId) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('poem_id', poemId)
      .eq('user_id', userId)
    
    if (error) throw error
  },

  // 获取用户收藏
  async getUserFavorites(userId) {
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        poem_id,
        poems (*)
      `)
      .eq('user_id', userId)
    
    if (error) throw error
    return data.map(item => item.poems)
  },

  // 获取用户评论
  async getUserComments(userId) {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        poems (title)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data.map(comment => ({
      id: comment.id,
      poemId: comment.poem_id,
      poemTitle: comment.poems.title,
      content: comment.content,
      time: comment.created_at
    }))
  },

  // 获取浏览历史
  async getBrowseHistory(userId) {
    const { data, error } = await supabase
      .from('browse_history')
      .select(`
        *,
        poems (title, author, dynasty)
      `)
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
    
    if (error) throw error
    return data.map(history => ({
      id: history.id,
      poemId: history.poem_id,
      poemTitle: history.poems.title,
      author: history.poems.author,
      dynasty: history.poems.dynasty,
      time: history.viewed_at
    }))
  },

  // 删除评论
  async deleteComment(commentId, userId) {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId)
    
    if (error) throw error
  }
}

// 用户认证相关
export const authApi = {
  // 注册用户
  async signUp(email, password, username) {
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
    return data
  },

  // 登录
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  },

  // 退出登录
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // 获取当前用户
  getCurrentUser() {
    return supabase.auth.getUser()
  },

  // 监听认证状态变化
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}