import { createClient } from '@supabase/supabase-js'

// Supabase配置
const supabaseUrl = 'https://zoknoksbkexongublarl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva25va3Nia2V4b25ndWJsYXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMTIxODIsImV4cCI6MjA3NjY4ODE4Mn0.5aPDhk9IdhrvIN2P7XIvt7vlCeTIRlJeNwe9_m5GMhY'

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

async function testConnection() {
  console.log('正在测试Supabase连接...')
  try {
    // 测试连接 - 查询products表
    const { data, error } = await supabase
      .from('products')
      .select('id, title')
      .limit(3)
    
    if (error) {
      console.log('数据库查询错误:', error.message)
      console.log('错误详情:', error)
    } else {
      console.log('数据库连接成功!')
      console.log('找到', data.length, '条商品记录')
      console.log('示例数据:', data)
    }
    
    // 检查网络连接状态
    const { data: testData, error: testError } = await supabase
      .rpc('version')
    
    if (testError) {
      console.log('网络连接测试失败:', testError.message)
    } else {
      console.log('网络连接正常')
    }
    
  } catch (err) {
    console.log('连接错误:', err.message)
    console.log('错误堆栈:', err.stack)
  }
}

testConnection()