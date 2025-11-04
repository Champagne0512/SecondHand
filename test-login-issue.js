// 登录问题诊断脚本
import { createClient } from '@supabase/supabase-js'

// Supabase配置
const supabaseUrl = 'https://zoknoksbkexongublarl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva25va3Nia2V4b25ndWJsYXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMTIxODIsImV4cCI6MjA3NjY4ODE4Mn0.5aPDhk9IdhrvIN2P7XIvt7vlCeTIRlJeNwe9_m5GMhY'

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function diagnoseLoginIssue() {
  console.log('🔍 开始诊断登录问题...\n')

  // 1. 测试基础连接
  console.log('1. 测试Supabase基础连接...')
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.log('❌ 基础连接失败:', error.message)
    } else {
      console.log('✅ 基础连接成功')
      console.log('   当前会话:', data.session ? '有活跃会话' : '无会话')
    }
  } catch (err) {
    console.log('❌ 连接异常:', err.message)
  }

  // 2. 测试数据库查询
  console.log('\n2. 测试数据库查询...')
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    if (error) {
      console.log('❌ 数据库查询失败:', error.message)
      console.log('   错误代码:', error.code)
      console.log('   错误详情:', error.details)
      console.log('   错误提示:', error.hint)
    } else {
      console.log('✅ 数据库查询成功')
    }
  } catch (err) {
    console.log('❌ 查询异常:', err.message)
  }

  // 3. 测试登录功能
  console.log('\n3. 测试登录功能...')
  try {
    const testEmail = 'test@test.com'
    const testPassword = 'test123456'
    
    console.log('   使用测试账户:', testEmail)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (error) {
      console.log('❌ 登录失败:', error.message)
      console.log('   错误状态:', error.status)
      
      // 分析常见错误
      if (error.message.includes('Invalid login credentials')) {
        console.log('   💡 提示: 邮箱或密码错误，或用户不存在')
      } else if (error.message.includes('Email not confirmed')) {
        console.log('   💡 提示: 邮箱未确认，需要在Supabase中禁用邮箱确认')
      } else if (error.message.includes('rate limit')) {
        console.log('   💡 提示: 请求频率过高，请稍后重试')
      }
    } else {
      console.log('✅ 登录成功')
      console.log('   用户ID:', data.user?.id)
      console.log('   邮箱:', data.user?.email)
    }
  } catch (err) {
    console.log('❌ 登录异常:', err.message)
  }

  // 4. 检查表结构
  console.log('\n4. 检查数据库表结构...')
  const tables = ['profiles', 'products', 'favorites', 'conversations', 'messages']
  
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('count').limit(1)
      if (error) {
        console.log(`   ❌ 表 ${table} 不存在或无法访问:`, error.message)
      } else {
        console.log(`   ✅ 表 ${table} 可正常访问`)
      }
    } catch (err) {
      console.log(`   ❌ 检查表 ${table} 异常:`, err.message)
    }
  }

  console.log('\n🔧 解决方案建议:')
  console.log('1. 检查Supabase项目是否正常运行')
  console.log('2. 确认URL和API密钥是否正确')
  console.log('3. 创建必要的数据库表（profiles等）')
  console.log('4. 在Supabase认证设置中禁用邮箱确认')
  console.log('5. 检查网络连接和防火墙设置')
}

// 运行诊断
diagnoseLoginIssue().catch(console.error)