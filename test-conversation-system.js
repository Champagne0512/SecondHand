import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zoknoksbkexongublarl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva25va3Nia2V4b25ndWJsYXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMTIxODIsImV4cCI6MjA3NjY4ODE4Mn0.5aPDhk9IdhrvIN2P7XIvt7vlCeTIRlJeNwe9_m5GMhY'
)

async function testConversationSystem() {
  console.log('=== 测试对话系统功能 ===')
  
  try {
    // 1. 登录测试用户张三 (test1@qq.com)
    console.log('1. 登录用户张三...')
    const { data: zhangsanLogin, error: zhangsanError } = await supabase.auth.signInWithPassword({
      email: 'test1@qq.com',
      password: '123456'
    })
    
    if (zhangsanError) throw zhangsanError
    console.log('✅ 张三登录成功，用户ID:', zhangsanLogin.user.id)
    
    // 2. 获取张三的对话列表
    console.log('\n2. 获取张三的对话列表...')
    const { data: zhangsanConvs, error: convsError } = await supabase
      .from('conversations')
      .select(`
        *,
        products!inner(title, id),
        buyer:profiles!conversations_buyer_id_fkey(username, id),
        seller:profiles!conversations_seller_id_fkey(username, id)
      `)
      .or(`buyer_id.eq.${zhangsanLogin.user.id},seller_id.eq.${zhangsanLogin.user.id}`)
      .order('last_message_at', { ascending: false })
    
    if (convsError) throw convsError
    console.log('✅ 获取对话列表成功，数量:', zhangsanConvs?.length || 0)
    
    if (zhangsanConvs && zhangsanConvs.length > 0) {
      const conv = zhangsanConvs[0]
      console.log('示例对话:')
      console.log('  对话ID:', conv.id)
      console.log('  商品:', conv.products.title)
      console.log('  买家:', conv.buyer.username)
      console.log('  卖家:', conv.seller.username)
      
      // 3. 获取对话消息
      console.log('\n3. 获取对话消息...')
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(username, avatar_url)
        `)
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: true })
      
      if (msgError) throw msgError
      console.log('✅ 获取消息成功，数量:', messages?.length || 0)
      
      if (messages && messages.length > 0) {
        messages.forEach((msg, index) => {
          console.log(`  ${index + 1}. ${msg.sender.username}: ${msg.content} (${msg.is_read ? '已读' : '未读'})`)
        })
      }
      
      // 4. 测试发送消息
      console.log('\n4. 测试发送消息...')
      const testMessage = '这是一条测试消息，时间: ' + new Date().toLocaleString()
      
      const { data: newMessage, error: sendError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conv.id,
          sender_id: zhangsanLogin.user.id,
          content: testMessage,
          is_read: false
        })
        .select()
        .single()
      
      if (sendError) throw sendError
      console.log('✅ 消息发送成功，消息ID:', newMessage.id)
      console.log('消息内容:', newMessage.content)
      
      // 5. 测试更新对话最后消息
      console.log('\n5. 更新对话最后消息...')
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          last_message: testMessage,
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conv.id)
      
      if (updateError) throw updateError
      console.log('✅ 对话最后消息更新成功')
      
      // 6. 测试不同用户登录
      console.log('\n6. 切换用户李四登录...')
      await supabase.auth.signOut() // 先登出张三
      
      const { data: lisiLogin, error: lisiError } = await supabase.auth.signInWithPassword({
        email: 'test2@qq.com',
        password: '123456'
      })
      
      if (lisiError) throw lisiError
      console.log('✅ 李四登录成功，用户ID:', lisiLogin.user.id)
      
      // 7. 检查李四是否能收到消息
      console.log('\n7. 检查李四的对话列表...')
      const { data: lisiConvs, error: lisiConvsError } = await supabase
        .from('conversations')
        .select(`
          *,
          products!inner(title, id),
          buyer:profiles!conversations_buyer_id_fkey(username, id),
          seller:profiles!conversations_seller_id_fkey(username, id)
        `)
        .or(`buyer_id.eq.${lisiLogin.user.id},seller_id.eq.${lisiLogin.user.id}`)
        .order('last_message_at', { ascending: false })
      
      if (lisiConvsError) throw lisiConvsError
      console.log('✅ 李四的对话列表，数量:', lisiConvs?.length || 0)
      
      // 找到刚才的对话
      const sameConv = lisiConvs?.find(c => c.id === conv.id)
      if (sameConv) {
        console.log('✅ 李四也能看到刚才的对话')
        console.log('最后消息:', sameConv.last_message)
        
        // 8. 测试李四发送回复
        console.log('\n8. 李四发送回复消息...')
        const replyMessage = '这是李四的回复，时间: ' + new Date().toLocaleString()
        
        const { data: replyMsg, error: replyError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conv.id,
            sender_id: lisiLogin.user.id,
            content: replyMessage,
            is_read: false
          })
          .select()
          .single()
        
        if (replyError) throw replyError
        console.log('✅ 李四回复发送成功，消息ID:', replyMsg.id)
      } else {
        console.log('⚠️ 李四看不到刚才的对话，可能需要检查权限设置')
      }
      
    } else {
      console.log('张三没有对话数据')
    }
    
    console.log('\n=== 对话系统测试完成 ===')
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

testConversationSystem()