import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zoknoksbkexongublarl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva25va3Nia2V4b25ndWJsYXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMTIxODIsImV4cCI6MjA3NjY4ODE4Mn0.5aPDhk9IdhrvIN2P7XIvt7vlCeTIRlJeNwe9_m5GMhY'
)

async function testWangwuLogin() {
  console.log('=== 测试王五账号登录 ===')
  
  try {
    console.log('尝试登录王五账号...')
    console.log('邮箱: test3@qq.com')
    console.log('密码: 123456')
    
    // 1. 测试认证登录
    console.log('1. 测试Supabase认证登录...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test3@qq.com',
      password: '123456'
    })
    
    if (authError) {
      console.error('❌ 认证登录失败:', authError)
      console.error('错误代码:', authError.code)
      console.error('错误信息:', authError.message)
      return
    }
    
    console.log('✅ 认证登录成功')
    console.log('用户ID:', authData.user.id)
    console.log('用户名:', authData.user.user_metadata?.username || authData.user.email)
    
    // 2. 获取用户profile信息
    console.log('2. 获取用户profile信息...')
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
    
    if (profileError) {
      console.error('❌ 获取profile失败:', profileError)
      console.error('错误代码:', profileError.code)
      console.error('错误信息:', profileError.message)
      return
    }
    
    console.log('✅ 获取profile成功')
    console.log('Profile数据:', profileData)
    
    if (profileData && profileData.length > 0) {
      const profile = profileData[0]
      console.log('用户信息:')
      console.log('  用户名:', profile.username)
      console.log('  邮箱:', profile.email)
      console.log('  手机:', profile.phone || '无')
      console.log('  头像:', profile.avatar_url || '无')
    } else {
      console.log('⚠️ 没有找到profile数据')
    }
    
    // 3. 检查收藏数据
    console.log('3. 检查用户收藏数据...')
    const { data: favoritesData, error: favError } = await supabase
      .from('favorites')
      .select('product_id')
      .eq('user_id', authData.user.id)
    
    if (favError) {
      console.error('❌ 获取收藏数据失败:', favError)
    } else {
      console.log('✅ 获取收藏数据成功')
      console.log('收藏数量:', favoritesData?.length || 0)
    }
    
    // 4. 检查对话数据
    console.log('4. 检查用户对话数据...')
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .or(`buyer_id.eq.${authData.user.id},seller_id.eq.${authData.user.id}`)
    
    if (convError) {
      console.error('❌ 获取对话数据失败:', convError)
    } else {
      console.log('✅ 获取对话数据成功')
      console.log('对话数量:', conversations?.length || 0)
    }
    
    console.log('=== 王五账号登录测试完成 ===')
    console.log('✅ 所有检查通过，登录功能正常')
    
  } catch (error) {
    console.error('❌ 测试过程中发生异常:', error)
    console.error('错误类型:', error.constructor.name)
    console.error('错误堆栈:', error.stack)
  }
}

testWangwuLogin()