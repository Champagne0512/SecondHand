// 测试Supabase连接
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fgjmlovomwvgzmdpymmb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnam1sb3ZvbXd2Z3ptZHB5bW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MDk0NjIsImV4cCI6MjA3NjA4NTQ2Mn0.XOuMrlvrw0UgiGKgUyU8mikH9PFrRCX4tvnrRFmdeOE'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  console.log('测试Supabase连接...')
  
  try {
    // 测试连接
    const { data, error } = await supabase
      .from('poems')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('Supabase连接错误:', error)
      return false
    }
    
    console.log('Supabase连接成功!')
    console.log('获取到的数据:', data)
    return true
  } catch (error) {
    console.error('连接测试失败:', error)
    return false
  }
}

testConnection().then(success => {
  if (success) {
    console.log('✅ Supabase配置正确，网站可以正常显示数据')
  } else {
    console.log('❌ Supabase连接有问题，请检查配置')
  }
})