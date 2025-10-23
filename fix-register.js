import { createClient } from '@supabase/supabase-js'

// 创建Supabase客户端
const supabase = createClient(
  'https://zoknoksbkexongublarl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva25va3Nia2V4b25ndWJsYXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMTIxODIsImV4cCI6MjA3NjY4ODE4Mn0.5aPDhk9IdhrvIN2P7XIvt7vlCeTIRlJeNwe9_m5GMhY'
)

async function testValidEmail() {
  console.log('=== 测试有效的邮箱格式 ===\n')
  
  // 测试不同的邮箱格式
  const testEmails = [
    'testuser@gmail.com',
    'testuser@qq.com', 
    'testuser@163.com',
    'testuser@outlook.com',
    'testuser@yahoo.com'
  ]
  
  for (const email of testEmails) {
    const testUser = {
      username: '测试用户_' + Date.now(),
      email: email,
      password: 'Test123456!', // 使用更强的密码
      phone: '13800138000'
    }
    
    console.log(`\n测试邮箱: ${email}`)
    
    try {
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
        console.log(`   ❌ 注册失败: ${authError.message}`)
        console.log(`     错误代码: ${authError.code}`)
        
        if (authError.code === 'weak_password') {
          console.log('   💡 建议: 密码需要包含大小写字母和特殊字符')
        }
      } else {
        console.log('   ✅ 注册成功!')
        console.log('     用户ID:', authData.user?.id)
        
        // 测试profiles表插入
        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              username: testUser.username,
              email: testUser.email,
              phone: testUser.phone
            })
          
          if (profileError) {
            console.log('   ❌ profiles表插入失败:', profileError.message)
          } else {
            console.log('   ✅ profiles表插入成功')
          }
        }
        
        break // 成功一个就停止
      }
      
    } catch (error) {
      console.log('   异常:', error.message)
    }
  }
  
  console.log('\n=== 测试完成 ===')
  console.log('\n📋 注册功能修复建议:')
  console.log('1. 使用真实的邮箱域名 (gmail.com, qq.com, 163.com等)')
  console.log('2. 密码需要包含大小写字母、数字和特殊字符')
  console.log('3. 避免使用 @test.com, @example.com 等测试域名')
  console.log('4. 检查Supabase项目的邮箱验证设置')
}

testValidEmail()