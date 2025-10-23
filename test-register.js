import { createClient } from '@supabase/supabase-js'

// 创建Supabase客户端
const supabase = createClient(
  'https://zoknoksbkexongublarl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva25va3Nia2V4b25ndWJsYXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMTIxODIsImV4cCI6MjA3NjY4ODE4Mn0.5aPDhk9IdhrvIN2P7XIvt7vlCeTIRlJeNwe9_m5GMhY'
)

async function testRegister() {
  console.log('=== 注册功能诊断测试 ===\n')
  
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
      console.log('   ❌ 认证注册失败:', authError)
      console.log('     错误代码:', authError.code)
      console.log('     错误信息:', authError.message)
      
      // 检查常见错误
      if (authError.code === 'email_address_invalid') {
        console.log('   💡 建议: 邮箱格式不正确，请使用有效的邮箱地址')
      } else if (authError.code === 'weak_password') {
        console.log('   💡 建议: 密码强度不够，请使用更强的密码')
      } else if (authError.code === 'user_already_exists') {
        console.log('   💡 建议: 用户已存在，请使用不同的邮箱')
      }
    } else {
      console.log('   ✅ 认证注册成功')
      console.log('     用户ID:', authData.user?.id)
      console.log('     邮箱确认状态:', authData.user?.email_confirmed_at ? '已确认' : '待确认')
    }
    
    // 2. 测试profiles表插入
    if (authData?.user) {
      console.log('\n2. 测试profiles表插入...')
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username: testUser.username,
          email: testUser.email,
          phone: testUser.phone
        })
      
      if (profileError) {
        console.log('   ❌ profiles表插入失败:', profileError)
        console.log('     错误代码:', profileError.code)
        console.log('     错误信息:', profileError.message)
        
        // 检查常见错误
        if (profileError.code === '23505') {
          console.log('   💡 建议: 唯一约束冲突，用户可能已存在')
        } else if (profileError.code === '42501') {
          console.log('   💡 建议: 权限不足，请检查RLS策略')
        }
      } else {
        console.log('   ✅ profiles表插入成功')
      }
    }
    
    // 3. 测试登录功能
    console.log('\n3. 测试登录功能...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    })
    
    if (loginError) {
      console.log('   ❌ 登录失败:', loginError)
    } else {
      console.log('   ✅ 登录成功')
      console.log('     会话状态:', loginData.session ? '有效' : '无效')
    }
    
    // 4. 检查profiles表权限
    console.log('\n4. 检查profiles表权限...')
    const { error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (selectError) {
      console.log('   ❌ 查询profiles表失败:', selectError)
      console.log('     错误代码:', selectError.code)
      console.log('     错误信息:', selectError.message)
    } else {
      console.log('   ✅ profiles表查询权限正常')
    }
    
  } catch (error) {
    console.log('\n❌ 测试过程中发生异常:', error)
  }
  
  console.log('\n=== 诊断完成 ===')
}

testRegister()