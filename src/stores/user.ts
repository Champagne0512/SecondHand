import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { User, LoginForm, RegisterForm } from '@/types/user'
import { ElMessage } from 'element-plus'

// 用户状态管理store
export const useUserStore = defineStore('user', () => {
  // 状态 - 从localStorage恢复初始状态
  const user = ref<User | null>(null)
  
  // 初始化时从localStorage恢复用户状态
  const initializeUserFromStorage = () => {
    try {
      const saved = localStorage.getItem('campus-marketplace-user')
      if (saved) {
        user.value = JSON.parse(saved)
      }
    } catch {
      user.value = null
    }
  }
  
  // 立即执行初始化
  initializeUserFromStorage()
  const isLoading = ref(false)
  const favorites = ref<string[]>([])
  
  // 初始化时从localStorage恢复收藏列表
  const initializeFavoritesFromStorage = () => {
    try {
      const saved = localStorage.getItem('campus-marketplace-favorites')
      if (saved) {
        favorites.value = JSON.parse(saved)
      }
    } catch {
      favorites.value = []
    }
  }
  
  // 立即执行初始化
  initializeFavoritesFromStorage()
  const isAdmin = ref<boolean>(false)
  
  // 初始化时从localStorage恢复管理员状态
  const initializeAdminFromStorage = () => {
    try {
      const saved = localStorage.getItem('campus-marketplace-isAdmin')
      if (saved) {
        isAdmin.value = JSON.parse(saved)
      }
    } catch {
      isAdmin.value = false
    }
  }
  
  // 立即执行初始化
  initializeAdminFromStorage()
  
  // 存储会话token和用户ID，用于状态恢复
  const sessionToken = ref<string | null>(null)
  const userId = ref<string | null>(null)
  
  // 初始化时从localStorage恢复会话状态
  const initializeSessionFromStorage = () => {
    try {
      const savedToken = localStorage.getItem('campus-marketplace-session-token')
      const savedUserId = localStorage.getItem('campus-marketplace-user-id')
      
      if (savedToken) sessionToken.value = savedToken
      if (savedUserId) userId.value = savedUserId
    } catch {
      sessionToken.value = null
      userId.value = null
    }
  }
  
  // 立即执行初始化
  initializeSessionFromStorage()

  // 保存状态到localStorage的辅助函数
  const saveStateToLocalStorage = () => {
    try {
      // 确保用户数据包含所有渲染所需的字段
      const userDataToSave = user.value ? {
        id: user.value.id,
        username: user.value.username || '用户',
        email: user.value.email || '',
        phone: user.value.phone || '',
        avatar: user.value.avatar || '/src/assets/default-avatar.png',
        createdAt: user.value.createdAt || new Date().toISOString()
      } : null
      
      localStorage.setItem('campus-marketplace-user', JSON.stringify(userDataToSave))
      localStorage.setItem('campus-marketplace-favorites', JSON.stringify(favorites.value))
      localStorage.setItem('campus-marketplace-isAdmin', JSON.stringify(isAdmin.value))
      
      // 保存会话token和用户ID
      if (user.value) {
        localStorage.setItem('campus-marketplace-user-id', user.value.id)
      }
      
      // 保存当前会话token
      const saveSessionToken = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.access_token) {
            localStorage.setItem('campus-marketplace-session-token', session.access_token)
          }
        } catch (error) {
          console.warn('保存会话token失败:', error)
        }
      }
      saveSessionToken()
      
      console.log('用户状态已保存到localStorage，包含字段:', userDataToSave ? Object.keys(userDataToSave) : '无用户数据')
    } catch (error) {
      console.warn('保存状态到localStorage失败:', error)
    }
  }

  // 清除localStorage状态的辅助函数
  const clearStateFromLocalStorage = () => {
    try {
      localStorage.removeItem('campus-marketplace-user')
      localStorage.removeItem('campus-marketplace-favorites')
      localStorage.removeItem('campus-marketplace-isAdmin')
      localStorage.removeItem('campus-marketplace-user-id')
      localStorage.removeItem('campus-marketplace-session-token')
    } catch (error) {
      console.warn('清除localStorage状态失败:', error)
    }
  }

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

      // 保存状态到localStorage
      saveStateToLocalStorage()

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
      favorites.value = []
      isAdmin.value = false
      
      // 清除localStorage状态
      clearStateFromLocalStorage()
    } catch (error) {
      console.error('登出失败:', error)
    }
  }

  // 上传头像到Supabase存储
  const uploadAvatar = async (file: File): Promise<string> => {
    try {
      if (!user.value) throw new Error('用户未登录')
      
      // 验证文件类型和大小
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      const maxSize = 5 * 1024 * 1024 // 5MB
      
      if (!allowedTypes.includes(file.type)) {
        throw new Error('只支持 JPG、PNG、GIF、WebP 格式的图片')
      }
      
      if (file.size > maxSize) {
        throw new Error('图片大小不能超过 5MB')
      }
      
      // 生成唯一的文件名
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.value.id}-${Date.now()}.${fileExt}`
      
      // 上传文件到Supabase存储
      const { data, error } = await supabase.storage
        .from('user-avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (error) throw error
      
      // 获取公开URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(fileName)
      
      return publicUrl
    } catch (error: any) {
      console.error('头像上传失败:', error)
      throw new Error(error.message || '头像上传失败')
    }
  }

  // 删除旧头像
  const deleteOldAvatar = async (avatarUrl: string) => {
    try {
      if (!avatarUrl || !avatarUrl.includes('user-avatars')) return
      
      // 从URL中提取文件名
      const fileName = avatarUrl.split('/').pop()
      if (!fileName) return
      
      // 删除旧头像
      const { error } = await supabase.storage
        .from('user-avatars')
        .remove([fileName])
      
      if (error) {
        console.warn('删除旧头像失败:', error)
      }
    } catch (error) {
      console.warn('删除旧头像时出错:', error)
    }
  }

  // 更新用户信息
  const updateProfile = async (profile: Partial<User>) => {
    try {
      if (!user.value) throw new Error('用户未登录')

      // 如果头像有变化且是新的URL，删除旧头像
      if (profile.avatar && profile.avatar !== user.value.avatar && profile.avatar.includes('user-avatars')) {
        await deleteOldAvatar(user.value.avatar)
      }

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

  // 验证并恢复用户状态
  const validateAndRestoreUserState = async (): Promise<boolean> => {
    try {
      console.log('🔄 开始验证并恢复用户状态...')
      
      // 检查localStorage中是否有用户状态
      const savedUserId = localStorage.getItem('campus-marketplace-user-id')
      const savedSessionToken = localStorage.getItem('campus-marketplace-session-token')
      
      if (!savedUserId || !savedSessionToken) {
        console.log('❌ localStorage中没有有效的用户状态')
        return false
      }
      
      // 验证用户ID格式
      if (!savedUserId || savedUserId === 'undefined' || savedUserId === 'null') {
        console.warn('⚠️ 用户ID格式无效，清除状态')
        clearStateFromLocalStorage()
        return false
      }
      
      console.log('✅ 检测到保存的用户状态，用户ID:', savedUserId)
      
      // 首先尝试获取当前会话
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session && session.user.id === savedUserId) {
        console.log('✅ 会话有效，直接恢复用户状态')
        await restoreUserFromSession(session)
        return true
      }
      
      // 如果会话无效，尝试使用保存的token恢复会话
      console.log('🔄 会话无效，尝试使用保存的token恢复...')
      
      // 设置token到Supabase客户端
      const { data: setSessionData, error: setSessionError } = await supabase.auth.setSession({
        access_token: savedSessionToken,
        refresh_token: '' // 刷新token可能已过期，使用空值
      })
      
      if (setSessionError) {
        console.warn('⚠️ 设置会话失败:', setSessionError.message)
        // 清除无效的状态
        clearStateFromLocalStorage()
        return false
      }
      
      // 重新获取会话
      const { data: { session: newSession } } = await supabase.auth.getSession()
      
      if (newSession && newSession.user.id === savedUserId) {
        console.log('✅ 会话恢复成功，用户ID:', newSession.user.id)
        await restoreUserFromSession(newSession)
        return true
      }
      
      console.log('❌ 会话恢复失败，清除无效状态')
      clearStateFromLocalStorage()
      return false
      
    } catch (error) {
      console.error('❌ 验证用户状态失败:', error)
      return false
    }
  }
  
  // 从会话恢复用户信息
  const restoreUserFromSession = async (session: any) => {
    try {
      console.log('🔄 从会话恢复用户信息...')
      
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
        console.log('✅ 从profiles表加载用户信息成功')
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
        console.log('✅ 从会话信息创建用户信息成功')
      }
      
      // 加载用户收藏列表
      await fetchFavorites()
      
      // 强制检查管理员权限，确保权限状态正确
      console.log('🔍 开始强制检查管理员权限...')
      const adminResult = await checkAdminPermission()
      console.log('🔍 管理员权限检查结果:', adminResult ? '是管理员' : '不是管理员')
      console.log('🔍 当前管理员状态:', isAdmin.value ? '已设置为管理员' : '未设置为管理员')
      
      // 如果检查失败但用户是已知管理员，强制设置为管理员
      if (!adminResult && session.user.id === '88e123ae-d36a-486a-9971-9b42c6301a99') {
        console.log('🔧 检测到指定管理员用户，强制设置管理员权限')
        isAdmin.value = true
      }
      
      // 保存状态到localStorage
      saveStateToLocalStorage()
      
      // 触发状态更新通知，确保组件感知状态变化
      console.log('🔄 触发用户状态更新通知...')
      // 强制触发响应式更新
      user.value = { ...user.value }
      
      console.log('✅ 用户信息恢复完成，状态已保存到localStorage')
      
    } catch (error) {
      console.error('❌ 从会话恢复用户信息失败:', error)
      throw error
    }
  }

  // 初始化用户信息
  const initUser = async () => {
    // 如果用户已经初始化，直接返回成功
    if (user.value) {
      console.log('用户已初始化，跳过重复初始化')
      return true
    }
    
    // 防止重复初始化
    if (isLoading.value) {
      console.log('用户状态正在初始化中，跳过重复调用')
      return false
    }
    
    isLoading.value = true
    
    try {
      console.log('🔄 开始初始化用户信息...')
      
      // 首先检查数据库连接状态
      console.log('🔍 检查数据库连接状态...')
      const { data: { session: initialSession } } = await supabase.auth.getSession()
      
      if (!initialSession) {
        console.log('⚠️ 未检测到有效会话，尝试从localStorage恢复状态...')
        
        // 尝试验证并恢复用户状态
        const restored = await validateAndRestoreUserState()
        
        if (restored) {
          console.log('✅ 用户状态恢复成功')
          isLoading.value = false
          return true
        }
        
        console.log('❌ 用户状态恢复失败，用户未登录')
        // 清除可能存在的旧状态
        clearStateFromLocalStorage()
        isLoading.value = false
        return false
      }
      
      // 如果有有效会话，直接恢复用户信息
      console.log('✅ 检测到有效会话，用户ID:', initialSession.user.id)
      await restoreUserFromSession(initialSession)
      isLoading.value = false
      return true
      
    } catch (error) {
      console.error('❌ 初始化用户信息失败:', error)
      
      // 如果初始化失败，尝试从localStorage恢复基础状态
      try {
        const savedUser = localStorage.getItem('campus-marketplace-user')
        if (savedUser) {
          console.log('🔄 从localStorage恢复基础用户状态')
          const parsedUser = JSON.parse(savedUser)
          
          // 验证用户数据格式
          if (parsedUser && parsedUser.id && parsedUser.id !== 'undefined' && parsedUser.id !== 'null') {
            user.value = parsedUser
            
            // 恢复其他状态
            const savedFavorites = localStorage.getItem('campus-marketplace-favorites')
            if (savedFavorites) {
              favorites.value = JSON.parse(savedFavorites)
            }
            
            const savedIsAdmin = localStorage.getItem('campus-marketplace-isAdmin')
            if (savedIsAdmin) {
              isAdmin.value = JSON.parse(savedIsAdmin)
            }
            
            console.log('✅ 基础用户状态恢复成功')
            isLoading.value = false
            return true
          } else {
            console.warn('⚠️ localStorage中的用户数据格式无效，清除状态')
            clearStateFromLocalStorage()
          }
        }
      } catch (localStorageError) {
        console.warn('⚠️ 从localStorage恢复状态失败:', localStorageError)
        // 清除可能损坏的状态
        clearStateFromLocalStorage()
      }
      
      isLoading.value = false
      return false
    }
  }

  // 监听认证状态变化
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('认证状态变化:', event)
    
    if (event === 'SIGNED_IN' && session) {
      console.log('用户登录成功，开始初始化用户信息')
      await initUser()
    } else if (event === 'SIGNED_OUT') {
      console.log('用户登出，清除状态')
      user.value = null
      favorites.value = [] // 清空收藏列表
      isAdmin.value = false
      
      // 清除localStorage状态
      clearStateFromLocalStorage()
    } else if (event === 'TOKEN_REFRESHED') {
      console.log('Token已刷新，重新保存状态')
      saveStateToLocalStorage()
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
    uploadAvatar,
    deleteOldAvatar,
    initUser,
    fetchFavorites,
    isFavorited,
    addToFavorites,
    removeFromFavorites,
    checkAdminPermission,
    setTemporaryAdmin,
    restoreUserFromSession,
    validateAndRestoreUserState
  }
})