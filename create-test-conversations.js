import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zoknoksbkexongublarl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva25va3Nia2V4b25ndWJsYXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMTIxODIsImV4cCI6MjA3NjY4ODE4Mn0.5aPDhk9IdhrvIN2P7XIvt7vlCeTIRlJeNwe9_m5GMhY'
)

async function createTestConversations() {
  console.log('=== 创建测试对话数据 ===')
  
  try {
    // 用户ID
    const zhangsanId = '8768e8dc-aa31-48b7-b769-b9eb1dcdad54'
    const lisiId = '09e88732-99ae-4afc-9b7c-43048e8e3fa4'
    const wangwuId = '3f3f010e-ec6d-4cb1-a8ba-23e8a0adbe77'
    
    // 商品ID
    const macbookId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    const airpodsId = 'b2c3d4e5-f6a7-8901-bcde-f23456789012'
    const ipadId = 'c3d4e5f6-a7b8-9012-cdef-345678901234'
    const sonyId = 'd4e5f6a7-b8c9-0123-def0-456789012345'
    
    console.log('1. 创建张三(买家) -> 李四(卖家) 的对话 (MacBook)')
    const { data: conv1, error: conv1Error } = await supabase
      .from('conversations')
      .insert({
        product_id: macbookId,
        buyer_id: zhangsanId,
        seller_id: lisiId,
        last_message: '这个MacBook能便宜点吗？',
        last_message_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (conv1Error) throw conv1Error
    console.log('✅ 对话1创建成功，ID:', conv1.id)
    
    console.log('2. 创建李四(买家) -> 王五(卖家) 的对话 (Sony耳机)')
    const { data: conv2, error: conv2Error } = await supabase
      .from('conversations')
      .insert({
        product_id: sonyId,
        buyer_id: lisiId,
        seller_id: wangwuId,
        last_message: '耳机还在吗？',
        last_message_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (conv2Error) throw conv2Error
    console.log('✅ 对话2创建成功，ID:', conv2.id)
    
    console.log('3. 创建王五(买家) -> 张三(卖家) 的对话 (AirPods)')
    const { data: conv3, error: conv3Error } = await supabase
      .from('conversations')
      .insert({
        product_id: airpodsId,
        buyer_id: wangwuId,
        seller_id: zhangsanId,
        last_message: 'AirPods支持降噪吗？',
        last_message_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (conv3Error) throw conv3Error
    console.log('✅ 对话3创建成功，ID:', conv3.id)
    
    // 为每个对话添加消息
    console.log('4. 为对话1添加消息...')
    const { error: msg1Error } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: conv1.id,
          sender_id: zhangsanId,
          content: '你好，这个MacBook还在吗？',
          is_read: true
        },
        {
          conversation_id: conv1.id,
          sender_id: lisiId,
          content: '在的，诚心要可以聊',
          is_read: true
        },
        {
          conversation_id: conv1.id,
          sender_id: zhangsanId,
          content: '这个MacBook能便宜点吗？',
          is_read: false
        }
      ])
    
    if (msg1Error) throw msg1Error
    console.log('✅ 对话1消息添加成功')
    
    console.log('5. 为对话2添加消息...')
    const { error: msg2Error } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: conv2.id,
          sender_id: lisiId,
          content: '你好，Sony耳机还在吗？',
          is_read: true
        },
        {
          conversation_id: conv2.id,
          sender_id: wangwuId,
          content: '在的，几乎全新',
          is_read: true
        },
        {
          conversation_id: conv2.id,
          sender_id: lisiId,
          content: '耳机还在吗？',
          is_read: false
        }
      ])
    
    if (msg2Error) throw msg2Error
    console.log('✅ 对话2消息添加成功')
    
    console.log('6. 为对话3添加消息...')
    const { error: msg3Error } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: conv3.id,
          sender_id: wangwuId,
          content: '你好，AirPods支持降噪吗？',
          is_read: true
        },
        {
          conversation_id: conv3.id,
          sender_id: zhangsanId,
          content: '支持的，Pro版本都有降噪',
          is_read: true
        }
      ])
    
    if (msg3Error) throw msg3Error
    console.log('✅ 对话3消息添加成功')
    
    console.log('=== 测试对话数据创建完成 ===')
    console.log('现在每个用户都有对话可以测试了！')
    
  } catch (error) {
    console.error('❌ 创建测试数据失败:', error)
  }
}

createTestConversations()