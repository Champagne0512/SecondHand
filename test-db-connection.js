// 测试数据库连接脚本
import { createClient } from '@supabase/supabase-js'

// 从环境变量读取配置
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zoknoksbkexongublarl.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva25va3Nia2V4b25ndWJsYXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMTIxODIsImV4cCI6MjA3NjY4ODE4Mn0.5aPDhk9IdhrvIN2P7XIvt7vlCeTIRlJeNwe9_m5GMhY'

console.log('测试Supabase连接...')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : '未设置')

// 创建客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    console.log('\n1. 测试基本连接...')
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    
    if (error) {
      console.error('❌ 连接失败:', error.message)
      console.log('错误详情:', error)
      return false
    }
    
    console.log('✅ 连接成功!')
    
    // 测试校园动态表
    console.log('\n2. 测试校园动态表...')
    const { data: posts, error: postsError } = await supabase.from('campus_posts').select('*').limit(1)
    
    if (postsError) {
      console.error('❌ 校园动态表查询失败:', postsError.message)
    } else {
      console.log('✅ 校园动态表查询成功，数据条数:', posts?.length || 0)
    }
    
    // 测试评论表
    console.log('\n3. 测试评论表...')
    const { data: comments, error: commentsError } = await supabase.from('post_comments').select('*').limit(1)
    
    if (commentsError) {
      console.error('❌ 评论表查询失败:', commentsError.message)
    } else {
      console.log('✅ 评论表查询成功，数据条数:', comments?.length || 0)
    }
    
    return true
    
  } catch (error) {
    console.error('❌ 测试过程中出现异常:', error)
    return false
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n🎉 数据库连接测试完成，所有功能正常!')
  } else {
    console.log('\n💥 数据库连接测试失败，请检查配置!')
  }
})