import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zoknoksbkexongublarl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva25va3Nia2V4b25ndWJsYXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMTIxODIsImV4cCI6MjA3NjY4ODE4Mn0.5aPDhk9IdhrvIN2P7XIvt7vlCeTIRlJeNwe9_m5GMhY'
)

async function simpleConversationTest() {
  console.log('=== 简化对话系统测试 ===\n')
  
  try {
    // 1. 登录张三
    console.log('1. 登录张三...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test1@qq.com',
      password: '123456'
    })
    
    if (authError) throw authError
    console.log('✅ 登录成功')
    
    // 2. 获取用户对话列表
    console.log('\n2. 获取用户对话列表...')
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select(`
        *,
        products!inner(title, id),
        buyer:profiles!conversations_buyer_id_fkey(username, id),
        seller:profiles!conversations_seller_id_fkey(username, id)
      `)
      .or(`buyer_id.eq.${authData.user.id},seller_id.eq.${authData.user.id}`)
      .order('last_message_at', { ascending: false })
    
    if (convError) throw convError
    console.log('✅ 找到对话数量:', conversations?.length || 0)
    
    // 3. 如果有对话，获取消息
    if (conversations && conversations.length > 0) {
      const conv = conversations[0]
      console.log('\n3. 获取对话消息...')
      console.log('对话信息:')
      console.log('  商品:', conv.products.title)
      console.log('  买家:', conv.buyer.username)
      console.log('  卖家:', conv.seller.username)
      console.log('  最后消息:', conv.last_message || '无')
      
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(username, avatar_url)
        `)
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: true })
      
      if (msgError) throw msgError
      console.log('消息数量:', messages?.length || 0)
      
      if (messages && messages.length > 0) {
        messages.forEach((msg, index) => {
          const senderName = msg.sender?.username || '未知用户'
          const isOwn = msg.sender_id === authData.user.id
          console.log(`${index + 1}. ${senderName} ${isOwn ? '(我)' : ''}: ${msg.content}`)
        })
      }
      
      // 4. 测试发送消息
      console.log('\n4. 测试发送消息...')
      const testMessage = '这是一条测试消息 ' + new Date().toLocaleTimeString()
      
      const { data: newMsg, error: sendError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conv.id,
          sender_id: authData.user.id,
          content: testMessage,
          is_read: false
        })
        .select()
        .single()
      
      if (sendError) throw sendError
      console.log('✅ 消息发送成功，ID:', newMsg.id)
      
    } else {
      console.log('没有对话数据，对话功能基础架构正常')
    }
    
    console.log('\n=== 测试完成 ===')
    console.log('✅ 对话系统基础功能正常')
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

simpleConversationTest()