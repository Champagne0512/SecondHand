import { createClient } from '@supabase/supabase-js'

// 创建Supabase客户端
const supabase = createClient(
  'https://zoknoksbkexongublarl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva25va3Nia2V4b25ndWJsYXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMTIxODIsImV4cCI6MjA3NjY4ODE4Mn0.5aPDhk9IdhrvIN2P7XIvt7vlCeTIRlJeNwe9_m5GMhY'
)

async function debugRegister() {
  console.log('=== 注册功能详细调试 ===\n')
  
  const testUser = {
    username: '测试用户_' + Date.now(),
    email: 'test' + Date.now() + '@test.com',
    password: '123456',
    phone: '13800138000'
  }
  
  console.log('测试用户信息:')
  console.log('  用户名:', testUser.username)
  console.log('  邮箱:', testUser.email)
  console.log('  密码:', testUser.password)
  console.log('  手机:', testUser.phone)
  
  try {
    // 1. 测试认证注册
    console.log('\n1. 测试Supabase认证注册...')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        data: {
          username: testUser.username,
          phone: testUser.phone
        }
      }
    })
    
    if (authError) {
      console.log('   ❌ 认证注册失败:')
      console.log('     完整错误对象:', JSON.stringify(authError, null, 2))
      console.log('     错误代码:', authError.code)
      console.log('     错误信息:', authError.message)
      console.log('     HTTP状态码:', authError.status)
      
      // 检查常见错误
      if (authError.code === 'email_address_invalid') {
        console.log('   💡 建议: 邮箱格式不正确，请使用有效的邮箱地址')
      } else if (authError.code === 'weak_password') {
        console.log('   💡 建议: 密码强度不够，请使用更强的密码')
      } else if (authError.code === 'user_already_exists') {
        console.log('   💡 建议: 用户已存在，请使用不同的邮箱')
      } else if (authError.code === 'invalid_credentials') {
        console.log('   💡 建议: 认证凭据无效，检查Supabase配置')
      }
    } else {
      console.log('   ✅ 认证注册成功')
      console.log('     用户ID:', authData.user?.id)
      console.log('     邮箱确认状态:', authData.user?.email_confirmed_at ? '已确认' : '待确认')
    }
    
    // 2. 检查Supabase配置
    console.log('\n2. 检查Supabase配置...')
    console.log('   Supabase URL:', supabase.supabaseUrl)
    console.log('   API Key长度:', supabase.supabaseKey?.length)
    
    // 3. 测试网络连接
    console.log('\n3. 测试网络连接...')
    try {
      const response = await fetch('https://zoknoksbkexongublarl.supabase.co/rest/v1/', {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva25va3Nia2V4b25ndWJsYXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMTIxODIsImV4cCI6MjA3NjY4ODE4Mn0.5aPDhk9IdhrvIN2P7XIvt7vlCeTIRlJeNwe9_m5GMhY',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva25va3Nia2V4b25ndWJsYXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMTIxODIsImV4cCI6MjA3NjY4ODE4Mn0.5aPDhk9IdhrvIN2P7XIvt7vlCeTIRlJeNwe9_m5GMhY'
        }
      })
      console.log('   网络连接状态:', response.status, response.statusText)
    } catch (networkError) {
      console.log('   网络连接失败:', networkError.message)
    }
    
  } catch (error) {
    console.log('\n❌ 测试过程中发生异常:')
    console.log('   错误信息:', error.message)
    console.log('   堆栈信息:', error.stack)
  }
  
  console.log('\n=== 调试完成 ===')
}

debugRegister()