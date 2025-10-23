import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zoknoksbkexongublarl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva25va3Nia2V4b25ndWJsYXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMTIxODIsImV4cCI6MjA3NjY4ODE4Mn0.5aPDhk9IdhrvIN2P7XIvt7vlCeTIRlJeNwe9_m5GMhY'
)

async function checkData() {
  console.log('=== 检查数据库状态 ===')
  
  // 检查用户
  const { data: users, error: userError } = await supabase
    .from('profiles')
    .select('*')
  
  if (userError) {
    console.error('获取用户失败:', userError)
  } else {
    console.log('用户数量:', users.length)
    users.forEach(u => console.log(` - ${u.username} (${u.email})`))
  }
  
  // 检查商品
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('*')
    .limit(5)
  
  if (prodError) {
    console.error('获取商品失败:', prodError)
  } else {
    console.log('商品数量:', products.length)
    products.forEach(p => console.log(` - ${p.title} (¥${p.price})`))
  }
  
  // 检查对话
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('*')
  
  if (convError) {
    console.error('获取对话失败:', convError)
  } else {
    console.log('对话数量:', conversations.length)
  }
}

checkData()