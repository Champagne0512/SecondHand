import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zoknoksbkexongublarl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva25va3Nia2V4b25ndWJsYXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMTIxODIsImV4cCI6MjA3NjY4ODE4Mn0.5aPDhk9IdhrvIN2P7XIvt7vlCeTIRlJeNwe9_m5GMhY'
)

async function testLogin() {
  console.log('测试用户登录...')
  
  // 使用数据库中的测试用户
  const testUsers = [
    { email: 'test1@qq.com', password: '123456' },
    { email: 'test2@qq.com', password: '123456' },
    { email: 'test3@qq.com', password: '123456' }
  ]
  
  for (const user of testUsers) {
    console.log(`尝试登录: ${user.email}`)
    const { data, error } = await supabase.auth.signInWithPassword(user)
    
    if (error) {
      console.log('登录失败:', error.message)
    } else {
      console.log('✅ 登录成功!')
      console.log('用户ID:', data.user.id)
      console.log('用户名:', data.user.user_metadata?.username || data.user.email)
      
      // 获取用户信息
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      console.log('用户信息:', profile)
      break
    }
  }
}

testLogin()