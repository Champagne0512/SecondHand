import { supabase } from '@/lib/supabase'

/**
 * 获取当前用户ID
 * 从Supabase会话中获取当前登录用户的ID
 */
export async function getCurrentUserId(): Promise<string> {
  try {
    // 获取当前会话
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session || !session.user) {
      console.error('未找到用户会话')
      return ''
    }
    
    return session.user.id
  } catch (error) {
    console.error('获取用户ID失败:', error)
    return ''
  }
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return null
  }
}

/**
 * 检查用户是否已登录
 */
export async function isLoggedIn(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return !!session
  } catch (error) {
    console.error('检查登录状态失败:', error)
    return false
  }
}