import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { User, LoginForm, RegisterForm } from '@/types/user'

// 用户状态管理store
export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const favorites = ref<string[]>([]) // 存储收藏的商品ID列表
  const isAdmin = ref(false) // 管理员权限状态

  // 计算属性
  const isLoggedIn = computed(() => {
    // 简化登录状态检查，避免异步问题
    return !!user.value
  })
  const userInfo = computed(() => user.value)
  const isAdminComputed = computed(() => isAdmin.value)

  // 登录
  const login = async (form: LoginForm) => {
    isLoading.value = true
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password
      })

      if (error) {
        // 检查是否是邮箱未确认错误
        if (error.message?.includes('Email not confirmed') || error.message?.includes('邮箱未确认')) {
          // 如果是邮箱未确认，尝试使用自定义登录逻辑
          console.warn('邮箱未确认，尝试使用自定义登录逻辑')
          
          // 尝试直接获取用户信息而不依赖邮箱确认
          const { data: userData, error: userError } = await supabase.auth.getUser()
          
          if (userError) {
            // 如果获取用户信息失败，尝试重新登录
            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
              email: form.email,
              password: form.password
            })
            
            if (retryError) throw retryError
            
            // 使用重试后的数据
            if (retryData.user) {
              user.value = {
                id: retryData.user.id,
                username: retryData.user.user_metadata?.username || retryData.user.email?.split('@')[0] || '用户',
                email: retryData.user.email || '',
                phone: retryData.user.user_metadata?.phone || '',
                avatar: '/src/assets/default-avatar.png',
                createdAt: retryData.user.created_at || new Date().toISOString()
              }
            }
          } else if (userData.user) {
            // 使用获取到的用户信息
            user.value = {
              id: userData.user.id,
              username: userData.user.user_metadata?.username || userData.user.email?.split('@')[0] || '用户',
              email: userData.user.email || '',
              phone: userData.user.user_metadata?.phone || '',
              avatar: '/src/assets/default-avatar.png',
              createdAt: userData.user.created_at || new Date().toISOString()
            }
          }
          
          return { success: true, message: '登录成功（邮箱未确认，但已允许访问）' }
        }
        throw error
      }

      // 获取用户profile信息
      if (data.user) {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)

        if (profileError) throw profileError

        if (profiles && profiles.length > 0) {
          const profile = profiles[0]
          user.value = {
            id: data.user.id,
            username: profile.username,
            email: profile.email,
            phone: profile.phone || '',
            avatar: profile.avatar_url || '/src/assets/default-avatar.png',
            createdAt: profile.created_at
          }
        } else {
          // 如果没有找到profile，使用认证数据创建基础用户信息
          user.value = {
            id: data.user.id,
            username: data.user.user_metadata?.username || data.user.email?.split('@')[0] || '用户',
            email: data.user.email || '',
            phone: data.user.user_metadata?.phone || '',
            avatar: '/src/assets/default-avatar.png',
            createdAt: data.user.created_at || new Date().toISOString()
          }
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
      // 1. 注册用户 - 禁用邮箱确认
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            username: form.username,
            phone: form.phone
          },
          emailRedirectTo: window.location.origin // 重定向URL
        }
      })

      if (error) throw error

      // 2. 注册成功后，立即尝试登录以创建会话
      if (data.user) {
        try {
          // 立即登录，即使邮箱未确认也允许登录
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: form.email,
            password: form.password
          })
          
          if (loginError) {
            console.warn('注册后自动登录失败:', loginError.message)
            // 如果登录失败，可能是因为邮箱未确认，但我们仍然设置用户状态
            // 让用户能够访问基本功能
          } else if (loginData.session) {
            console.log('注册后自动登录成功')
            // 登录成功，使用登录后的用户信息
          }
        } catch (loginError) {
          console.warn('注册后自动登录异常:', loginError)
        }
        
        // 3. 设置用户状态（无论自动登录是否成功）
        // 等待一下确保auth触发器已完成
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 获取触发器创建的profile信息
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profileError) {
          console.warn('获取profile失败:', profileError)
          // 如果没有profile，使用认证数据创建基础用户信息
          user.value = {
            id: data.user.id,
            username: form.username,
            email: form.email,
            phone: form.phone || '',
            avatar: '/src/assets/default-avatar.png',
            createdAt: new Date().toISOString()
          }
        } else {
          user.value = {
            id: data.user.id,
            username: profileData.username,
            email: profileData.email,
            phone: profileData.phone || '',
            avatar: profileData.avatar_url || '/src/assets/default-avatar.png',
            createdAt: profileData.created_at
          }
        }
        
        // 4. 立即加载用户收藏列表
        await fetchFavorites()
      }

      return { 
        success: true, 
        message: '注册成功！欢迎加入校园二手交易平台！'
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

  // 检查管理员权限
  const checkAdminPermission = async (userId?: string) => {
    try {
      const targetUserId = userId || user.value?.id
      if (!targetUserId) {
        isAdmin.value = false
        return false
      }

      // 临时解决方案：检查特定用户是否为管理员
      // 这里可以设置一些测试管理员账户
      const testAdminEmails = [
        'admin@campus-trade.com',
        'superadmin@campus-trade.com', 
        'test@test.com'
      ]
      
      // 获取当前用户信息
      const currentUser = user.value
      if (currentUser && testAdminEmails.includes(currentUser.email)) {
        console.log('检测到测试管理员账户，授予管理员权限')
        isAdmin.value = true
        return true
      }

      // 由于RLS策略问题，暂时使用本地存储的管理员列表
      // 这是一个临时解决方案，直到数据库RLS策略修复
      const knownAdminUserIds = [
        '88e123ae-d36a-486a-9971-9b42c6301a99', // 你的管理员用户ID
        // 可以在这里添加其他已知的管理员用户ID
      ]

      if (knownAdminUserIds.includes(targetUserId)) {
        console.log('检测到已知管理员用户ID，授予管理员权限')
        isAdmin.value = true
        return true
      }

      // 直接检查数据库中的管理员记录（绕过RLS问题）
      try {
        console.log('开始直接检查管理员记录...')
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('user_id')
          .eq('user_id', targetUserId)
          .eq('is_active', true)
          .limit(1)

        if (!adminError && adminData && adminData.length > 0) {
          console.log('数据库中找到管理员记录，授予管理员权限')
          isAdmin.value = true
          return true
        }
        
        if (adminError) {
          console.warn('查询管理员记录时出错:', adminError)
        }
      } catch (dbError) {
        console.warn('直接检查管理员记录失败:', dbError)
      }

      // 尝试通过profiles表检查用户邮箱是否在管理员列表中
      try {
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', targetUserId)
          .single()

        if (!profileError && userProfile) {
          // 检查用户邮箱是否在测试管理员邮箱列表中
          if (testAdminEmails.includes(userProfile.email)) {
            console.log('根据邮箱检测到管理员权限')
            isAdmin.value = true
            return true
          }
        }
      } catch (profileCheckError) {
        console.warn('检查用户邮箱失败:', profileCheckError)
      }

      console.log('用户不是管理员')
      isAdmin.value = false
      return false
    } catch (error) {
      console.error('检查管理员权限失败:', error)
      isAdmin.value = false
      return false
    }
  }

  // 临时设置管理员权限（用于测试）
  const setTemporaryAdmin = (isAdminFlag: boolean) => {
    isAdmin.value = isAdminFlag
    console.log(`临时设置管理员权限: ${isAdminFlag}`)
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
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)

        if (profiles && profiles.length > 0 && !profileError) {
          const profile = profiles[0]
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
        
        // 加载用户收藏列表
        await fetchFavorites()
        
        // 强制检查管理员权限，确保权限状态正确
        console.log('开始强制检查管理员权限...')
        const adminResult = await checkAdminPermission()
        console.log('管理员权限检查结果:', adminResult ? '是管理员' : '不是管理员')
        console.log('当前管理员状态:', isAdmin.value ? '已设置为管理员' : '未设置为管理员')
        
        // 如果检查失败但用户是已知管理员，强制设置为管理员
        if (!adminResult && session.user.id === '88e123ae-d36a-486a-9971-9b42c6301a99') {
          console.log('检测到指定管理员用户，强制设置管理员权限')
          isAdmin.value = true
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
      favorites.value = [] // 清空收藏列表
    }
  })

  // 获取用户收藏列表
  const fetchFavorites = async () => {
    if (!user.value) return []
    
    try {
      console.log('获取用户收藏列表，用户ID:', user.value.id)
      
      const { data, error } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', user.value.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('获取收藏列表失败:', error)
        return []
      }

      console.log('获取收藏列表成功，数量:', data?.length || 0)
      
      // 提取商品ID列表
      const favoriteIds = data?.map(item => item.product_id) || []
      favorites.value = favoriteIds
      return favoriteIds
    } catch (error) {
      console.error('获取收藏列表失败:', error)
      return []
    }
  }

  // 检查商品是否已收藏
  const isFavorited = (productId: string) => {
    return favorites.value.includes(productId)
  }

  // 添加收藏
  const addToFavorites = async (productId: string) => {
    if (!user.value) {
      ElMessage.warning('请先登录后再收藏商品')
      return { success: false, message: '用户未登录' }
    }

    try {
      console.log('添加收藏，商品ID:', productId)
      
      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: user.value.id,
          product_id: productId
        })

      if (error) {
        if (error.code === '23505') { // 唯一约束冲突
          console.log('商品已在收藏列表中')
          return { success: false, message: '商品已在收藏列表中' }
        }
        throw error
      }

      // 添加到本地列表
      if (!favorites.value.includes(productId)) {
        favorites.value.push(productId)
      }

      // 更新商品的收藏数（异步，不阻塞主流程）
      updateProductLikeCount(productId, 1).catch(err => 
        console.warn('更新商品收藏数失败:', err)
      )

      console.log('收藏成功')
      return { success: true, message: '收藏成功' }
    } catch (error: any) {
      console.error('收藏失败:', error)
      return { success: false, message: error.message || '收藏失败' }
    }
  }

  // 移除收藏
  const removeFromFavorites = async (productId: string) => {
    if (!user.value) {
      return { success: false, message: '用户未登录' }
    }

    try {
      console.log('移除收藏，商品ID:', productId)
      
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.value.id)
        .eq('product_id', productId)

      if (error) throw error

      // 从本地列表移除
      const index = favorites.value.indexOf(productId)
      if (index > -1) {
        favorites.value.splice(index, 1)
      }

      // 更新商品的收藏数（异步，不阻塞主流程）
      updateProductLikeCount(productId, -1).catch(err => 
        console.warn('更新商品收藏数失败:', err)
      )

      console.log('取消收藏成功')
      return { success: true, message: '已取消收藏' }
    } catch (error: any) {
      console.error('取消收藏失败:', error)
      return { success: false, message: error.message || '取消收藏失败' }
    }
  }

  // 更新商品收藏数（辅助函数）
  const updateProductLikeCount = async (productId: string, delta: number) => {
    try {
      const { error } = await supabase.rpc('adjust_like_count', {
        product_id: productId,
        delta: delta
      })
      
      if (error) throw error
      console.log(`商品 ${productId} 收藏数更新: ${delta > 0 ? '+' : ''}${delta}`)
    } catch (error) {
      console.error('更新商品收藏数失败:', error)
      // 不抛出错误，避免影响主流程
    }
  }

  return {
    user,
    isLoading,
    isLoggedIn,
    userInfo,
    favorites,
    isAdmin: isAdminComputed,
    login,
    register,
    logout,
    updateProfile,
    initUser,
    fetchFavorites,
    isFavorited,
    addToFavorites,
    removeFromFavorites,
    checkAdminPermission,
    setTemporaryAdmin
  }
})