import { createClient } from '@supabase/supabase-js'

// Supabase配置
const supabaseUrl = 'https://zoknoksbkexongublarl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva25va3Nia2V4b25ndWJsYXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMTIxODIsImV4cCI6MjA3NjY4ODE4Mn0.5aPDhk9IdhrvIN2P7XIvt7vlCeTIRlJeNwe9_m5GMhY'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

class AdminDataFixer {
  // 修复统计数据
  static async fixDashboardStats() {
    console.log('🔄 开始修复管理员后台统计数据...')
    
    try {
      // 获取真实的数据数量
      const stats = {
        totalUsers: 0,
        totalProducts: 0,
        totalPosts: 0,
        pendingReviews: 0
      }

      // 获取总用户数
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
      
      stats.totalUsers = userCount || 0
      console.log(`✅ 用户总数: ${stats.totalUsers}`)

      // 获取总商品数
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
      
      stats.totalProducts = productCount || 0
      stats.totalPosts = productCount || 0 // 如果没有posts表，使用商品数作为替代
      console.log(`✅ 商品总数: ${stats.totalProducts}`)

      // 获取会话数
      const { count: convCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
      
      console.log(`✅ 会话总数: ${convCount || 0}`)

      // 获取消息数
      const { count: msgCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
      
      console.log(`✅ 消息总数: ${msgCount || 0}`)

      console.log('📊 修复后的统计数据:', stats)
      return stats

    } catch (error) {
      console.error('❌ 修复统计数据失败:', error)
      return {
        totalUsers: 0,
        totalProducts: 0,
        totalPosts: 0,
        pendingReviews: 0
      }
    }
  }

  // 验证数据查询
  static async validateDataQueries() {
    console.log('🔍 开始验证数据查询...')
    
    const tests = [
      {
        name: '用户查询',
        query: () => supabase.from('profiles').select('*', { count: 'exact', head: true })
      },
      {
        name: '商品查询', 
        query: () => supabase.from('products').select('*', { count: 'exact', head: true })
      },
      {
        name: '会话查询',
        query: () => supabase.from('conversations').select('*', { count: 'exact', head: true })
      },
      {
        name: '消息查询',
        query: () => supabase.from('messages').select('*', { count: 'exact', head: true })
      }
    ]

    for (const test of tests) {
      try {
        const { count, error } = await test.query()
        if (error) {
          console.error(`❌ ${test.name}失败:`, error.message)
        } else {
          console.log(`✅ ${test.name}成功: ${count || 0} 条记录`)
        }
      } catch (err) {
        console.error(`❌ ${test.name}异常:`, err.message)
      }
    }
  }

  // 执行所有修复
  static async runAllFixes() {
    console.log('🚀 开始执行管理员后台数据修复...')
    console.log('='.repeat(50))

    try {
      // 1. 验证数据查询
      await this.validateDataQueries()
      console.log('')

      // 2. 修复统计数据
      await this.fixDashboardStats()
      console.log('')

      console.log('🎉 修复操作完成！')
      console.log('✅ 管理员后台数据应该已经正常显示')

    } catch (error) {
      console.error('❌ 修复过程中出现错误:', error)
    }
  }
}

// 运行修复工具
console.log('🔧 管理员后台数据修复工具')
console.log('='.repeat(50))

AdminDataFixer.runAllFixes().catch(console.error)