import { createClient } from '@supabase/supabase-js'

// 使用与项目相同的配置
const supabaseUrl = 'https://zoknoksbkexongublarl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva25va3Nia2V4b25ndWJsYXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMTIxODIsImV4cCI6MjA3NjY4ODE4Mn0.5aPDhk9IdhrvIN2P7XIvt7vlCeTIRlJeNwe9_m5GMhY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestUser() {
  console.log('🔧 创建测试用户...')
  
  try {
    // 先尝试注册新用户
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'test@test.com',
      password: 'test123456',
      options: {
        data: {
          username: 'testuser',
          full_name: '测试用户'
        }
      }
    })

    if (signUpError) {
      console.log('❌ 注册失败:', signUpError.message)
      
      // 如果用户已存在，尝试直接登录
      if (signUpError.message.includes('already registered')) {
        console.log('📝 用户已存在，尝试登录...')
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: 'test@test.com',
          password: 'test123456'
        })
        
        if (signInError) {
          console.log('❌ 登录失败:', signInError.message)
          console.log('💡 建议：重置密码或使用其他邮箱')
        } else {
          console.log('✅ 登录成功:', signInData.user.email)
          console.log('📧 邮箱确认状态:', signInData.user.email_confirmed_at ? '已确认' : '未确认')
        }
      }
    } else {
      console.log('✅ 注册成功:', signUpData.user?.email)
      console.log('📧 邮箱确认状态:', signUpData.user?.email_confirmed_at ? '已确认' : '未确认')
      
      if (!signUpData.user?.email_confirmed_at) {
        console.log('⚠️  注意：需要邮箱确认才能登录')
        console.log('💡 解决方案：在Supabase项目中禁用邮箱确认要求')
      }
    }
    
  } catch (error) {
    console.log('❌ 创建用户异常:', error.message)
  }
}

createTestUser()