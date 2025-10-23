import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zoknoksbkexongublarl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva25va3Nia2V4b25ndWJsYXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMTIxODIsImV4cCI6MjA3NjY4ODE4Mn0.5aPDhk9IdhrvIN2P7XIvt7vlCeTIRlJeNwe9_m5GMhY'
)

async function testCompleteConversationFlow() {
  console.log('=== 完整对话系统测试 ===')
  console.log('')
  
  try {
    // 1. 登录张三
    console.log('1. 登录用户张三...')
    const { data: zhangsanAuth, error: zhangsanError } = await supabase.auth.signInWithPassword({
      email: 'test1@qq.com',
      password: '123456'
    })
    
    if (zhangsanError) throw zhangsanError
    console.log('✅ 张三登录成功')
    
    // 2. 获取商品列表，选择一个商品来开始对话
    console.log('')
    console.log('2. 获取商品列表...')
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'available')
      .limit(3)
    
    if (prodError) throw prodError
    console.log('✅ 找到商品数量:', products.length)
    
    if (products.length === 0) {
      console.log('⚠️ 没有可用的商品，无法测试对话功能')
      return
    }
    
    const product = products[0]
    console.log('选择商品:', product.title, '价格: ¥' + product.price)
    
    // 3. 检查是否已存在对话
    console.log('')
    console.log('3. 检查是否已存在对话...')
    const { data: existingConv, error: checkError } = await supabase
      .from('conversations')
      .select('id')
      .eq('product_id', product.id)
      .eq('buyer_id', zhangsanAuth.user.id)
      .eq('seller_id', product.seller_id)
      .single()
    
    let conversationId
    if (existingConv) {
      console.log('✅ 找到现有对话，ID:', existingConv.id)
      conversationId = existingConv.id
    } else {
      console.log('📝 创建新对话...')
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          product_id: product.id,
          buyer_id: zhangsanAuth.user.id,
          seller_id: product.seller_id,
          last_message: null,
          last_message_at: null
        })
        .select()
        .single()
      
      if (createError) throw createError
      console.log('✅ 新对话创建成功，ID:', newConv.id)
      conversationId = newConv.id
    }
    
    // 4. 发送第一条消息
    console.log('')
    console.log('4. 发送第一条消息...')
    const firstMessage = '你好，我对这个商品很感兴趣，可以聊聊吗？'
    
    const { data: msg1, error: msg1Error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: zhangsanAuth.user.id,
        content: firstMessage,
        is_read: false
      })
      .select()
      .single()
    
    if (msg1Error) throw msg1Error
    console.log('✅ 消息发送成功，ID:', msg1.id)
    
    // 5. 更新对话最后消息
    console.log('')
    console.log('5. 更新对话最后消息...')
    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        last_message: firstMessage,
        last_message_at: new Date().toISOString()
      })
      .eq('id', conversationId)
    
    if (updateError) throw updateError
    console.log('✅ 对话更新成功')
    
    // 6. 获取对话消息列表
    console.log('')
    console.log('6. 获取对话消息列表...')
    const { data: messages, error: msgListError } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(username, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    
    if (msgListError) throw msgListError
    console.log('✅ 获取消息列表成功，数量:', messages.length)
    
    messages.forEach((msg, index) => {
      const senderName = msg.sender?.username || '未知用户'
      const isOwn = msg.sender_id === zhangsanAuth.user.id
      console.log(`${index + 1}. ${senderName} ${isOwn ? '(我)' : ''}: ${msg.content}`)
    })
    
    // 7. 测试实时订阅功能
    console.log('')
    console.log('7. 测试实时订阅功能...')
    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('🔄 收到实时消息:', payload.new.content)
        }
      )
      .subscribe()
    
    console.log('✅ 实时订阅设置成功')
    
    // 8. 模拟发送另一条消息
    console.log('')
    console.log('8. 发送第二条消息...')
    const secondMessage = '请问可以见面交易吗？'
    
    const { data: msg2, error: msg2Error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: zhangsanAuth.user.id,
        content: secondMessage,
        is_read: false
      })
      .select()
      .single()
    
    if (msg2Error) throw msg2Error
    console.log('✅ 第二条消息发送成功，ID:', msg2.id)
    
    // 等待一小段时间让实时订阅接收消息
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 9. 取消订阅
    console.log('')
    console.log('9. 取消实时订阅...')
    await subscription.unsubscribe()
    console.log('✅ 实时订阅已取消')
    
    // 10. 测试不同用户查看对话
    console.log('')
    console.log('10. 测试不同用户查看对话...')
    await supabase.auth.signOut()
    
    // 登录李四（假设李四是卖家）
    const { data: lisiAuth, error: lisiError } = await supabase.auth.signInWithPassword({
      email: 'test2@qq.com',
      password: '123456'
    })
    
    if (lisiError) throw lisiError
    console.log('✅ 李四登录成功')
    
    // 李四查看对话列表
    const { data: lisiConvs, error: lisiConvsError } = await supabase
      .from('conversations')
      .select(`
        *,
        products!inner(title, id),
        buyer:profiles!conversations_buyer_id_fkey(username, id),
        seller:profiles!conversations_seller_id_fkey(username, id)
      `)
      .or(`buyer_id.eq.${lisiAuth.user.id},seller_id.eq.${lisiAuth.user.id}`)
      .order('last_message_at', { ascending: false })
    
    if (lisiConvsError) throw lisiConvsError
    console.log('✅ 李四看到的对话数量:', lisiConvs?.length || 0)
    
    if (lisiConvs && lisiConvs.length > 0) {
      console.log('李四看到的对话:')
      lisiConvs.forEach((conv, index) => {
        console.log(`${index + 1}. 商品: ${conv.products.title}`)
        console.log(`   最后消息: ${conv.last_message || '无'}`)
        console.log(`   买家: ${conv.buyer.username}`)
        console.log(`   卖家: ${conv.seller.username}`)
      })
    }
    
    console.log('')
    console.log('=== 完整对话系统测试完成 ===')
    console.log('✅ 所有功能正常工作！')
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

testCompleteConversationFlow()