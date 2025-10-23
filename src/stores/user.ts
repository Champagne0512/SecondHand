import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { User, LoginForm, RegisterForm } from '@/types/user'

// 用户状态管理store
export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref<User | null>(null)
  const isLoading = ref(false)

  // 计算属性
  const isLoggedIn = computed(() => {
    // 简化登录状态检查，避免异步问题
    return !!user.value
  })
  const userInfo = computed(() => user.value)

  // 登录
  const login = async (form: LoginForm) => {
    isLoading.value = true
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password
      })

      if (error) throw error

      // 获取用户profile信息
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profileError) throw profileError

        user.value = {
          id: data.user.id,
          username: profile.username,
          email: profile.email,
          phone: profile.phone || '',
          avatar: profile.avatar_url || '/src/assets/default-avatar.png',
          createdAt: profile.created_at
        }
      }

      return { success: true, message: '登录成功' }
    } catch (error: any) {
      console.error('登录失败:', error)
      return { 
        success: false, 
        message: error.message || '登录失败，请检查邮箱和密码' 
      }
    } finally {
      isLoading.value = false
    }
  }

  // 注册
  const register = async (form: RegisterForm) => {
    isLoading.value = true
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            username: form.username,
            phone: form.phone
          }
        }
      })

      if (error) throw error

      // 创建用户profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username: form.username,
            email: form.email,
            phone: form.phone
          })

        if (profileError) throw profileError

        user.value = {
          id: data.user.id,
          username: form.username,
          email: form.email,
          phone: form.phone || '',
          avatar: '/src/assets/default-avatar.png',
          createdAt: new Date().toISOString()
        }
      }

      return { 
        success: true, 
        message: data.user ? '注册成功' : '请检查邮箱完成验证'
      }
    } catch (error: any) {
      console.error('注册失败:', error)
      return { 
        success: false, 
        message: error.message || '注册失败，请稍后重试' 
      }
    } finally {
      isLoading.value = false
    }
  }

  // 登出
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      user.value = null
    } catch (error) {
      console.error('登出失败:', error)
    }
  }

  // 更新用户信息
  const updateProfile = async (profile: Partial<User>) => {
    try {
      if (!user.value) throw new Error('用户未登录')

      const { error } = await supabase
        .from('profiles')
        .update({
          username: profile.username,
          phone: profile.phone,
          avatar_url: profile.avatar,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.value.id)

      if (error) throw error

      // 更新本地状态
      if (user.value) {
        user.value = { ...user.value, ...profile }
      }

      return { success: true, message: '更新成功' }
    } catch (error: any) {
      console.error('更新用户信息失败:', error)
      return { 
        success: false, 
        message: error.message || '更新失败，请稍后重试' 
      }
    }
  }

  // 初始化用户信息
  const initUser = async () => {
    // 如果用户已经初始化，直接返回成功
    if (user.value) {
      return true
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // 获取用户profile信息
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile && !profileError) {
          user.value = {
            id: session.user.id,
            username: profile.username,
            email: profile.email,
            phone: profile.phone || '',
            avatar: profile.avatar_url || '/src/assets/default-avatar.png',
            createdAt: profile.created_at
          }
        } else {
          // 如果没有profile，使用会话信息创建基础用户信息
          user.value = {
            id: session.user.id,
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || '用户',
            email: session.user.email || '',
            phone: session.user.user_metadata?.phone || '',
            avatar: '/src/assets/default-avatar.png',
            createdAt: session.user.created_at || new Date().toISOString()
          }
        }
        
        return true // 返回初始化成功
      }
      
      return false // 返回初始化失败
    } catch (error) {
      console.error('初始化用户信息失败:', error)
      return false
    }
  }

  // 监听认证状态变化
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      await initUser()
    } else if (event === 'SIGNED_OUT') {
      user.value = null
    }
  })

  return {
    user,
    isLoading,
    isLoggedIn,
    userInfo,
    login,
    register,
    logout,
    updateProfile,
    initUser
  }
})