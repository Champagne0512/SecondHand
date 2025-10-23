import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zoknoksbkexongublarl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva25va3Nia2V4b25ndWJsYXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMTIxODIsImV4cCI6MjA3NjY4ODE4Mn0.5aPDhk9IdhrvIN2P7XIvt7vlCeTIRlJeNwe9_m5GMhY'
)

async function checkConversations() {
  console.log('=== 检查对话数据 ===')
  
  // 获取所有对话
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('获取对话失败:', error)
    return
  }
  
  console.log('找到的对话数量:', conversations.length)
  conversations.forEach((conv, index) => {
    console.log(`${index + 1}. 对话ID: ${conv.id}`)
    console.log(`   商品ID: ${conv.product_id}`)
    console.log(`   买家ID: ${conv.buyer_id}`)
    console.log(`   卖家ID: ${conv.seller_id}`)
    console.log(`   最后消息: ${conv.last_message || '无'}`)
    console.log(`   创建时间: ${conv.created_at}`)
    console.log('')
  })
  
  // 检查用户ID
  const zhangsanId = '8768e8dc-aa31-48b7-b769-b9eb1dcdad54'
  const lisiId = '09e88732-99ae-4afc-9b7c-43048e8e3fa4'
  const wangwuId = '3f3f010e-ec6d-4cb1-a8ba-23e8a0adbe77'
  
  console.log('用户ID对照:')
  console.log('张三ID:', zhangsanId)
  console.log('李四ID:', lisiId)  
  console.log('王五ID:', wangwuId)
  
  // 检查李四应该能看到的对话
  const lisiConversations = conversations.filter(conv => 
    conv.buyer_id === lisiId || conv.seller_id === lisiId
  )
  
  console.log('\n李四应该能看到的对话数量:', lisiConversations.length)
  lisiConversations.forEach((conv, index) => {
    console.log(`${index + 1}. 对话ID: ${conv.id}`)
    console.log(`   买家ID: ${conv.buyer_id} (${conv.buyer_id === lisiId ? '李四' : '其他'})`)
    console.log(`   卖家ID: ${conv.seller_id} (${conv.seller_id === lisiId ? '李四' : '其他'})`)
  })
}

checkConversations()