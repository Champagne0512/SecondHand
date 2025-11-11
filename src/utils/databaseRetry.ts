// 数据库连接重试工具
import { supabase } from '@/lib/supabase'

// 重试配置
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1秒
  maxDelay: 5000, // 5秒
}

// 错误类型定义
export enum DatabaseErrorType {
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// 自定义数据库错误类
export class DatabaseError extends Error {
  constructor(
    message: string,
    public type: DatabaseErrorType,
    public originalError?: any,
    public retryCount?: number
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

// 判断错误是否可重试
function isRetryableError(error: any): boolean {
  // 网络错误、连接超时、服务不可用等错误可以重试
  const retryableCodes = [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ECONNRESET',
    'EHOSTUNREACH'
  ]
  
  const retryableMessages = [
    'network error',
    'timeout',
    'connection',
    'fetch failed',
    'service unavailable'
  ]
  
  const errorMessage = error?.message?.toLowerCase() || ''
  const errorCode = error?.code || ''
  
  return retryableCodes.includes(errorCode) || 
         retryableMessages.some(msg => errorMessage.includes(msg))
}

// 计算重试延迟（指数退避算法）
function calculateDelay(retryCount: number): number {
  const delay = Math.min(
    RETRY_CONFIG.baseDelay * Math.pow(2, retryCount),
    RETRY_CONFIG.maxDelay
  )
  return delay + Math.random() * 1000 // 添加随机抖动避免惊群效应
}

// 重试执行数据库操作
export async function retryDatabaseOperation<T>(
  operation: () => Promise<T>,
  operationName: string = 'database operation'
): Promise<T> {
  let lastError: any
  
  for (let retryCount = 0; retryCount <= RETRY_CONFIG.maxRetries; retryCount++) {
    try {
      const result = await operation()
      
      // 如果重试成功，记录重试信息
      if (retryCount > 0) {
        console.log(`✅ ${operationName} 在第 ${retryCount} 次重试后成功`)
      }
      
      return result
    } catch (error: any) {
      lastError = error
      
      // 如果不是可重试的错误，直接抛出
      if (!isRetryableError(error)) {
        throw new DatabaseError(
          `${operationName} 失败: ${error.message}`,
          DatabaseErrorType.UNKNOWN_ERROR,
          error
        )
      }
      
      // 如果达到最大重试次数，抛出错误
      if (retryCount === RETRY_CONFIG.maxRetries) {
        throw new DatabaseError(
          `${operationName} 在 ${RETRY_CONFIG.maxRetries} 次重试后仍然失败`,
          DatabaseErrorType.CONNECTION_ERROR,
          error,
          retryCount
        )
      }
      
      // 计算延迟并等待
      const delay = calculateDelay(retryCount)
      console.warn(`⚠️ ${operationName} 失败，将在 ${delay}ms 后重试 (${retryCount + 1}/${RETRY_CONFIG.maxRetries}):`, error.message)
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError // 这行代码理论上不会执行
}

// 检查数据库连接状态
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await retryDatabaseOperation(
      () => supabase.from('profiles').select('count').limit(1),
      '数据库连接检查'
    )
    
    if (error) {
      console.error('❌ 数据库连接检查失败:', error.message)
      return false
    }
    
    console.log('✅ 数据库连接正常')
    return true
  } catch (error) {
    console.error('❌ 数据库连接检查异常:', error)
    return false
  }
}

// 重新初始化数据库连接
export async function reinitializeDatabaseConnection(): Promise<boolean> {
  try {
    console.log('🔄 尝试重新初始化数据库连接...')
    
    // 检查localStorage中是否有保存的用户状态
    const savedUserId = localStorage.getItem('campus-marketplace-user-id')
    const savedSessionToken = localStorage.getItem('campus-marketplace-session-token')
    
    if (savedUserId && savedSessionToken) {
      console.log('检测到保存的用户状态，尝试恢复会话，用户ID:', savedUserId)
      
      // 尝试使用保存的token恢复会话
      const { data: setSessionData, error: setSessionError } = await supabase.auth.setSession({
        access_token: savedSessionToken,
        refresh_token: '' // 刷新token可能已过期，使用空值
      })
      
      if (setSessionError) {
        console.warn('设置会话失败:', setSessionError.message)
        // 清除无效的状态
        localStorage.removeItem('campus-marketplace-user-id')
        localStorage.removeItem('campus-marketplace-session-token')
      } else {
        console.log('✅ 会话恢复成功')
      }
    }
    
    // 尝试重新获取会话
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      console.log('✅ 会话恢复成功，用户ID:', session.user.id)
      
      // 测试数据库连接
      const isConnected = await checkDatabaseConnection()
      
      if (isConnected) {
        console.log('✅ 数据库连接重新初始化成功')
        
        // 触发用户状态恢复
        if (typeof window !== 'undefined' && (window as any).restoreUserState) {
          (window as any).restoreUserState()
        }
        
        return true
      }
    }
    
    console.warn('⚠️ 数据库连接重新初始化失败')
    return false
  } catch (error) {
    console.error('❌ 数据库连接重新初始化异常:', error)
    return false
  }
}

// 恢复用户状态（供外部调用）
export async function restoreUserState(): Promise<boolean> {
  try {
    console.log('🔄 尝试恢复用户状态...')
    
    // 检查是否有保存的用户状态
    const savedUserId = localStorage.getItem('campus-marketplace-user-id')
    const savedSessionToken = localStorage.getItem('campus-marketplace-session-token')
    
    if (!savedUserId || !savedSessionToken) {
      console.log('没有保存的用户状态')
      return false
    }
    
    console.log('检测到保存的用户状态，用户ID:', savedUserId)
    
    // 首先确保数据库连接正常
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      console.warn('数据库连接异常，无法恢复用户状态')
      return false
    }
    
    // 尝试使用保存的token恢复会话
    console.log('尝试使用保存的token恢复会话...')
    const { data: setSessionData, error: setSessionError } = await supabase.auth.setSession({
      access_token: savedSessionToken,
      refresh_token: '' // 刷新token可能已过期，使用空值
    })
    
    if (setSessionError) {
      console.warn('设置会话失败:', setSessionError.message)
      // 清除无效的状态
      localStorage.removeItem('campus-marketplace-user-id')
      localStorage.removeItem('campus-marketplace-session-token')
      return false
    }
    
    // 重新获取会话
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session && session.user.id === savedUserId) {
      console.log('✅ 用户状态恢复成功，用户ID:', session.user.id)
      
      // 触发全局用户状态更新
      if (typeof window !== 'undefined' && (window as any).updateUserState) {
        (window as any).updateUserState(session)
      }
      
      return true
    }
    
    console.warn('⚠️ 用户状态恢复失败')
    return false
  } catch (error) {
    console.error('❌ 用户状态恢复异常:', error)
    return false
  }
}

// 全局错误处理
export function setupGlobalErrorHandler() {
  // 监听未处理的Promise拒绝
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason
    
    // 如果是数据库连接错误，尝试重新连接
    if (error?.name === 'DatabaseError' && error.type === DatabaseErrorType.CONNECTION_ERROR) {
      console.warn('检测到未处理的数据库连接错误，尝试重新连接...')
      event.preventDefault() // 阻止默认的错误处理
      
      // 延迟重新连接，避免频繁重试
      setTimeout(() => {
        reinitializeDatabaseConnection().catch(console.error)
      }, 2000)
    }
  })
  
  // 监听网络状态变化
  window.addEventListener('online', () => {
    console.log('🌐 网络连接恢复，检查数据库连接...')
    checkDatabaseConnection().catch(console.error)
  })
  
  window.addEventListener('offline', () => {
    console.warn('🌐 网络连接断开')
  })
}

// 初始化数据库监控
export function initializeDatabaseMonitoring() {
  console.log('🔍 初始化数据库连接监控...')
  
  // 设置全局错误处理
  setupGlobalErrorHandler()
  
  // 定期检查数据库连接（每5分钟）
  setInterval(() => {
    checkDatabaseConnection().catch(console.error)
  }, 5 * 60 * 1000)
  
  console.log('✅ 数据库连接监控已启动')
}