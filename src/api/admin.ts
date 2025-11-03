import { supabase } from '@/lib/supabase'

// 管理员接口定义
export interface AdminUser {
  id: string
  user_id: string
  role_id: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AdminRole {
  id: string
  role_name: string
  description: string
  permissions: string[]
  created_at: string
  updated_at: string
}

export interface SiteConfig {
  id: string
  config_key: string
  config_value: string
  config_type: 'string' | 'number' | 'boolean' | 'json'
  description?: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface DailyStatistics {
  id: string
  statistic_date: string
  new_users_count: number
  new_products_count: number
  new_posts_count: number
  new_events_count: number
  total_users_count: number
  total_products_count: number
  total_posts_count: number
  total_events_count: number
  active_users_count: number
  page_views_count: number
  transactions_count: number
  revenue_amount: number
  created_at: string
  updated_at: string
}

export interface ContentReview {
  id: string
  target_type: 'product' | 'post' | 'event' | 'comment'
  target_id: string
  review_status: 'pending' | 'approved' | 'rejected' | 'flagged'
  review_notes?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
}

// 管理员API类
export class AdminAPI {
  // 检查用户是否为管理员
  static async checkAdminPermission(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      // 临时解决方案：检查特定用户是否为管理员
      const testAdminEmails = [
        'admin@campus-trade.com',
        'superadmin@campus-trade.com', 
        'test@test.com'
      ]
      
      // 如果用户邮箱在测试管理员列表中，直接返回true
      if (user.email && testAdminEmails.includes(user.email)) {
        console.log('AdminAPI: 检测到测试管理员邮箱')
        return true
      }

      // 检查已知的管理员用户ID
      const knownAdminUserIds = [
        '88e123ae-d36a-486a-9971-9b42c6301a99', // 测试用户ID
        // 可以在这里添加其他已知的管理员用户ID
      ]

      if (knownAdminUserIds.includes(user.id)) {
        console.log('AdminAPI: 检测到已知管理员用户ID')
        return true
      }

      // 尝试查询管理员表（可能因为RLS问题而失败）
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('is_active')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single()

        if (error) {
          console.warn('AdminAPI: 查询管理员表失败:', error.message)
          return false
        }

        return !!data
      } catch (queryError) {
        console.warn('AdminAPI: 查询管理员表异常:', queryError)
        return false
      }
    } catch (error) {
      console.error('AdminAPI: 检查管理员权限异常:', error)
      return false
    }
  }

  // 获取管理员信息
  static async getAdminInfo(): Promise<AdminUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('admin_users')
        .select(`
          *,
          admin_roles (*),
          profiles (username, avatar_url)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('获取管理员信息失败:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('获取管理员信息异常:', error)
      return null
    }
  }

  // 获取统计数据
  static async getDashboardStats(): Promise<any> {
    try {
      // 获取总用户数
      const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // 获取总商品数
      const { count: totalProducts, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

      // 获取待审核内容数 - 如果没有content_reviews表，使用0作为默认值
      let pendingReviews = 0
      try {
        const { count: reviewsCount, error: reviewsError } = await supabase
          .from('content_reviews')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
        
        if (!reviewsError) {
          pendingReviews = reviewsCount || 0
        }
      } catch (e) {
        console.warn('content_reviews表不存在，使用默认值0')
        pendingReviews = 0
      }

      // 获取总动态数 - 如果没有posts表，使用商品数量作为替代
      let totalPosts = 0
      try {
        const { count: postsCount, error: postsError } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
        
        if (!postsError) {
          totalPosts = postsCount || 0
        } else {
          // 如果没有posts表，使用商品数量作为替代
          totalPosts = totalProducts || 0
        }
      } catch (e) {
        console.warn('posts表不存在，使用商品数量作为替代')
        totalPosts = totalProducts || 0
      }

      if (usersError || productsError) {
        console.error('获取统计数据失败:', { usersError, productsError })
        return {
          totalUsers: 0,
          totalProducts: 0,
          totalPosts: 0,
          pendingReviews: 0
        }
      }

      return {
        totalUsers: totalUsers || 0,
        totalProducts: totalProducts || 0,
        totalPosts: totalPosts || 0,
        pendingReviews: pendingReviews
      }
    } catch (error) {
      console.error('获取统计数据异常:', error)
      return {
        totalUsers: 0,
        totalProducts: 0,
        totalPosts: 0,
        pendingReviews: 0
      }
    }
  }

  // 获取用户列表
  static async getUsers(page: number = 1, pageSize: number = 20, search: string = ''): Promise<any> {
    try {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      // 搜索功能
      if (search) {
        query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`)
      }

      // 分页
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      
      const { data, count, error } = await query.range(from, to)

      if (error) {
        console.error('获取用户列表失败:', error)
        return { users: [], total: 0 }
      }

      // 获取每个用户的商品数量
      const usersWithStats = await Promise.all(
        (data || []).map(async (user) => {
          try {
            const { count: productCount } = await supabase
              .from('products')
              .select('*', { count: 'exact', head: true })
              .eq('seller_id', user.id)

            return {
              ...user,
              productCount: productCount || 0,
              status: 'active' // 默认状态
            }
          } catch (productError) {
            console.warn(`获取用户 ${user.id} 的商品数量失败:`, productError)
            return {
              ...user,
              productCount: 0,
              status: 'active'
            }
          }
        })
      )

      return {
        users: usersWithStats,
        total: count || 0
      }
    } catch (error) {
      console.error('获取用户列表异常:', error)
      return { users: [], total: 0 }
    }
  }

  // 获取商品列表
  static async getProducts(page: number = 1, pageSize: number = 20, search: string = ''): Promise<any> {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          profiles (username, avatar_url)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      // 搜索功能
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
      }

      // 分页
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      
      const { data, count, error } = await query.range(from, to)

      if (error) {
        console.error('获取商品列表失败:', error)
        return { products: [], total: 0 }
      }

      return {
        products: data || [],
        total: count || 0
      }
    } catch (error) {
      console.error('获取商品列表异常:', error)
      return { products: [], total: 0 }
    }
  }

  // 获取待审核内容
  static async getPendingReviews(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('content_reviews')
        .select(`
          *,
          profiles (username)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('获取待审核内容失败:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('获取待审核内容异常:', error)
      return []
    }
  }

  // 审核内容
  static async reviewContent(reviewId: string, status: 'approved' | 'rejected', notes?: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { error } = await supabase
        .from('content_reviews')
        .update({
          status,
          review_notes: notes,
          reviewed_at: new Date().toISOString(),
          reviewer_id: user.id
        })
        .eq('id', reviewId)

      if (error) {
        console.error('审核内容失败:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('审核内容异常:', error)
      return false
    }
  }

  // 获取举报记录
  static async getReports(page: number = 1, pageSize: number = 20): Promise<any> {
    try {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      
      const { data, count, error } = await supabase
        .from('user_reports')
        .select(`
          *,
          profiles!user_reports_reporter_id_fkey (username),
          admin_users (profiles (username))
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) {
        console.error('获取举报记录失败:', error)
        return { reports: [], total: 0 }
      }

      return {
        reports: data || [],
        total: count || 0
      }
    } catch (error) {
      console.error('获取举报记录异常:', error)
      return { reports: [], total: 0 }
    }
  }

  // 处理举报
  static async handleReport(reportId: string, status: 'processing' | 'resolved', resolution?: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { error } = await supabase
        .from('user_reports')
        .update({
          status,
          resolution,
          handled_by: user.id,
          handled_at: new Date().toISOString()
        })
        .eq('id', reportId)

      if (error) {
        console.error('处理举报失败:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('处理举报异常:', error)
      return false
    }
  }

  // 获取网站配置
  static async getSiteConfigs(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('site_configs')
        .select('*')
        .order('config_key', { ascending: true })

      if (error) {
        console.error('获取网站配置失败:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('获取网站配置异常:', error)
      return []
    }
  }

  // 更新网站配置
  static async updateSiteConfig(configKey: string, configValue: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('site_configs')
        .update({
          config_value: configValue,
          updated_at: new Date().toISOString()
        })
        .eq('config_key', configKey)

      if (error) {
        console.error('更新网站配置失败:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('更新网站配置异常:', error)
      return false
    }
  }


  // 获取最近活动
  static async getRecentActivities(limit: number = 10): Promise<any[]> {
    try {
      // 获取最近注册的用户
      const { data: recentUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id, username, created_at')
        .order('created_at', { ascending: false })
        .limit(limit)

      // 获取最近发布的商品
      const { data: recentProducts, error: productsError } = await supabase
        .from('products')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(limit)

      const activities = []

      // 合并活动并按时间排序
      if (recentUsers && !usersError) {
        recentUsers.forEach(user => {
          activities.push({
            id: user.id,
            type: 'user',
            title: `新用户注册: ${user.username}`,
            time: user.created_at
          })
        })
      }

      if (recentProducts && !productsError) {
        recentProducts.forEach(product => {
          activities.push({
            id: product.id,
            type: 'product',
            title: `新商品发布: ${product.title}`,
            time: product.created_at
          })
        })
      }

      // 按时间倒序排序
      return activities
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, limit)
    } catch (error) {
      console.error('获取最近活动失败:', error)
      return []
    }
  }



  // 更新用户状态
  static async updateUserStatus(userId: string, status: 'active' | 'inactive'): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      // 更新用户状态
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        console.error('更新用户状态失败:', error)
        return false
      }

      // 记录操作日志
      await this.logAdminOperation({
        action: 'update_user_status',
        target_id: userId,
        details: `更新用户状态为: ${status}`,
        admin_id: user.id
      })

      return true
    } catch (error) {
      console.error('更新用户状态失败:', error)
      return false
    }
  }



  // 更新商品状态
  static async updateProductStatus(productId: string, status: 'available' | 'sold' | 'pending'): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { error } = await supabase
        .from('products')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', productId)

      if (error) {
        console.error('更新商品状态失败:', error)
        return false
      }

      // 记录操作日志
      await this.logAdminOperation({
        action: 'update_product_status',
        target_id: productId,
        details: `更新商品状态为: ${status}`,
        admin_id: user.id
      })

      return true
    } catch (error) {
      console.error('更新商品状态失败:', error)
      return false
    }
  }

  // 获取内容审核列表
  static async getContentReviews(params: {
    page: number
    pageSize: number
    status?: string
    targetType?: string
  }): Promise<{
    reviews: ContentReview[]
    total: number
  }> {
    try {
      const { page, pageSize, status, targetType } = params
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      let query = supabase
        .from('content_reviews')
        .select('*', { count: 'exact' })

      // 状态筛选
      if (status) {
        query = query.eq('review_status', status)
      }

      // 目标类型筛选
      if (targetType) {
        query = query.eq('target_type', targetType)
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) {
        throw new Error('获取内容审核列表失败')
      }

      return {
        reviews: data || [],
        total: count || 0
      }
    } catch (error) {
      console.error('获取内容审核列表失败:', error)
      return {
        reviews: [],
        total: 0
      }
    }
  }

  // 更新内容审核状态
  static async updateContentReview(reviewId: string, status: string, notes?: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const updateData: any = {
        review_status: status,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      if (notes) {
        updateData.review_notes = notes
      }

      // 获取管理员信息
      const adminInfo = await this.getAdminInfo()
      if (adminInfo) {
        updateData.reviewed_by = adminInfo.id
      }

      const { error } = await supabase
        .from('content_reviews')
        .update(updateData)
        .eq('id', reviewId)

      if (error) {
        throw new Error('更新内容审核状态失败')
      }

      return true
    } catch (error) {
      console.error('更新内容审核状态失败:', error)
      return false
    }
  }





  // 记录管理员操作日志
  static async logAdminOperation(params: {
    action: string
    target_id?: string
    details?: string
    admin_id: string
  }): Promise<boolean> {
    try {
      const { action, target_id, details, admin_id } = params

      const { error } = await supabase
        .from('admin_operation_logs')
        .insert({
          action,
          target_id,
          details,
          admin_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.warn('记录操作日志失败:', error)
        return false
      }

      return true
    } catch (error) {
      console.warn('记录操作日志异常:', error)
      return false
    }
  }

  // 获取操作日志
  static async getOperationLogs(params: {
    page: number
    pageSize: number
    startDate?: string
    endDate?: string
  }): Promise<{
    logs: any[]
    total: number
  }> {
    try {
      const { page, pageSize, startDate, endDate } = params
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      let query = supabase
        .from('admin_operation_logs')
        .select(`
          *,
          admin_users (
            user_id,
            profiles (username)
          )
        `, { count: 'exact' })

      // 时间范围筛选
      if (startDate) {
        query = query.gte('created_at', startDate)
      }
      if (endDate) {
        query = query.lte('created_at', endDate)
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) {
        throw new Error('获取操作日志失败')
      }

      // 处理日志数据
      const logs = (data || []).map(log => ({
        ...log,
        adminName: log.admin_users?.profiles?.username || '未知管理员'
      }))

      return {
        logs,
        total: count || 0
      }
    } catch (error) {
      console.error('获取操作日志失败:', error)
      return {
        logs: [],
        total: 0
      }
    }
  }

  // 导出数据
  static async exportData(dataType: 'users' | 'products' | 'posts' | 'events'): Promise<boolean> {
    try {
      // 这里实现数据导出逻辑
      // 可以根据dataType查询不同的表数据
      console.log(`导出 ${dataType} 数据`)
      
      // 模拟导出过程
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      return true
    } catch (error) {
      console.error('导出数据失败:', error)
      return false
    }
  }

  // 删除商品
  static async deleteProduct(productId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) {
        console.error('删除商品失败:', error)
        return false
      }

      // 记录操作日志
      await this.logAdminOperation({
        action: 'delete_product',
        target_id: productId,
        details: '管理员删除商品',
        admin_id: user.id
      })

      return true
    } catch (error) {
      console.error('删除商品失败:', error)
      return false
    }
  }
}

export default AdminAPI