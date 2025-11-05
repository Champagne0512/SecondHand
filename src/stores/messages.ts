import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import type { RealtimeChannel } from '@supabase/supabase-js'

// 消息状态管理store
export const useMessageStore = defineStore('messages', () => {
  // 状态
  const conversations = ref<any[]>([])
  const activeConversation = ref<any>(null)
  const isLoading = ref(false)
  const newMessage = ref('')
  const isSending = ref(false) // 添加发送状态
  const messageQueue = ref<any[]>([]) // 消息队列，用于处理发送失败的情况

  // 计算属性
  const unreadCount = computed(() => {
    return conversations.value.reduce((count, conv) => count + (conv.unreadCount || 0), 0)
  })

  const isActiveConversation = computed(() => {
    return !!activeConversation.value
  })

  const canSendMessage = computed(() => {
    return !!activeConversation.value && newMessage.value.trim() && !isSending.value
  })

  // 获取对话列表
  const fetchConversations = async () => {
    isLoading.value = true
    try {
      const userStore = useUserStore()
      if (!userStore.user) {
        console.warn('用户未登录，无法获取对话列表')
        return []
      }

      console.log('获取对话列表，用户ID:', userStore.user.id)

      // 验证用户ID格式
      if (!userStore.user.id || userStore.user.id === 'undefined' || userStore.user.id === 'null') {
        console.error('用户ID格式无效，无法查询对话')
        ElMessage.error('用户信息异常，请重新登录')
        return []
      }

      // 首先尝试简单的查询，确保基本功能正常
      console.log('执行基础查询...')
      const { data: simpleData, error: simpleError } = await supabase
        .from('conversations')
        .select('*')
        .or(`buyer_id.eq.${userStore.user.id},seller_id.eq.${userStore.user.id}`)
        .limit(10)

      if (simpleError) {
        console.error('基础查询失败:', simpleError)
        ElMessage.error('基础查询失败: ' + simpleError.message)
        return []
      }

      console.log('基础查询成功，数据:', simpleData)

      if (!simpleData || simpleData.length === 0) {
        console.log('没有找到任何对话数据')
        conversations.value = []
        return []
      }

      // 如果基础查询成功，执行完整的关联查询
      console.log('执行完整查询...')
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          *,
          products!inner(
            id,
            title,
            images,
            price,
            status
          ),
          buyer:profiles!conversations_buyer_id_fkey(
            id,
            username,
            avatar_url
          ),
          seller:profiles!conversations_seller_id_fkey(
            id,
            username,
            avatar_url
          )
        `)
        .or(`buyer_id.eq.${userStore.user.id},seller_id.eq.${userStore.user.id}`)
        .order('last_message_at', { ascending: false })

      if (conversationsError) {
        console.error('完整查询失败:', conversationsError)
        // 如果完整查询失败，回退到基础查询结果
        console.log('使用基础查询结果作为回退')
        ElMessage.warning('完整数据加载失败，显示基础信息')
        
        // 简化处理基础数据
        const basicConversations = simpleData.map((conv: any) => ({
          id: conv.id,
          productId: conv.product_id,
          product: {
            id: conv.product_id,
            title: '商品',
            image: '/src/assets/default-product.jpg',
            price: 0,
            status: 'unknown'
          },
          otherParty: {
            id: conv.buyer_id === userStore.user!.id ? conv.seller_id : conv.buyer_id,
            name: '用户',
            avatar: '/src/assets/default-avatar.png'
          },
          lastMessage: '暂无消息',
          lastMessageTime: conv.created_at,
          unreadCount: 0,
          isOwn: false,
          messages: []
        }))
        
        conversations.value = basicConversations
        return basicConversations
      }

      console.log('获取到完整对话数据，数量:', conversationsData?.length || 0)
      console.log('对话数据详情:', conversationsData)

      if (!conversationsData || conversationsData.length === 0) {
        console.log('没有找到任何对话数据')
        conversations.value = []
        return []
      }

      // 转换对话数据格式
      const formattedConversations = []
      
      for (const conv of conversationsData) {
        try {
          // 确定对话的另一方
          const isBuyer = conv.buyer_id === userStore.user!.id
          const otherParty = isBuyer ? conv.seller : conv.buyer
          
          console.log('处理对话:', conv.id, '对方:', otherParty)

          // 获取未读消息数
          const { count: unreadCount, error: unreadError } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('sender_id', otherParty.id)
            .eq('is_read', false)

          if (unreadError) {
            console.warn('获取未读消息数失败:', unreadError)
          }

          // 获取最后一条消息
          const { data: lastMessageData, error: lastMsgError } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          if (lastMsgError) {
            console.log('对话', conv.id, '没有消息')
          }

          const formattedConv = {
            id: conv.id,
            productId: conv.product_id,
            product: {
              id: conv.products.id,
              title: conv.products.title,
              image: conv.products.images?.[0] || '/src/assets/default-product.jpg',
              price: conv.products.price,
              status: conv.products.status
            },
            otherParty: {
              id: otherParty.id,
              name: otherParty.username,
              avatar: otherParty.avatar_url || '/src/assets/default-avatar.png'
            },
            lastMessage: lastMessageData?.content || '暂无消息',
            lastMessageTime: lastMessageData?.created_at || conv.created_at,
            unreadCount: unreadCount || 0,
            isOwn: false, // 用于消息显示
            messages: [] // 将在选择对话时加载
          }

          formattedConversations.push(formattedConv)
          console.log('对话格式化完成:', formattedConv.id)
        } catch (convError) {
          console.error('处理单个对话失败:', convError, '对话ID:', conv.id)
          continue // 跳过这个对话，继续处理下一个
        }
      }

      conversations.value = formattedConversations
      console.log('对话列表转换完成，总数:', formattedConversations.length)
      
      return formattedConversations
    } catch (error) {
      console.error('获取对话列表失败:', error)
      ElMessage.error('获取对话列表失败: ' + (error as any).message)
      return []
    } finally {
      isLoading.value = false
    }
  }

  // 获取对话消息
  const fetchMessages = async (conversationId: string) => {
    try {
      const userStore = useUserStore()
      if (!userStore.user) return []

      console.log('获取对话消息，对话ID:', conversationId)

      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(
            id,
            username,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (messagesError) {
        console.error('获取消息失败:', messagesError)
        return []
      }

      console.log('获取到消息数据，数量:', messagesData?.length || 0)

      // 转换消息数据格式
      const formattedMessages = (messagesData || []).map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        timestamp: msg.created_at,
        isOwn: msg.sender_id === userStore.user!.id,
        avatar: msg.sender?.avatar_url || '/src/assets/default-avatar.png',
        isRead: msg.is_read
      }))

      // 标记消息为已读（异步执行，不阻塞主流程）
      markMessagesAsRead(conversationId, userStore.user!.id).catch(err => 
        console.warn('标记消息为已读失败:', err)
      )

      return formattedMessages
    } catch (error) {
      console.error('获取消息失败:', error)
      return []
    }
  }

  // 选择对话
  const selectConversation = async (conversation: any) => {
    activeConversation.value = conversation
    
    // 加载消息
    const messages = await fetchMessages(conversation.id)
    conversation.messages = messages
    
    // 清除未读数
    conversation.unreadCount = 0
  }

  // 发送消息（增强版，带发送状态管理）
  const sendMessage = async (conversationId: string, content: string) => {
    const userStore = useUserStore()
    if (!userStore.user || !content.trim()) {
      return { success: false, message: '内容不能为空' }
    }

    // 防止重复发送
    if (isSending.value) {
      return { success: false, message: '正在发送中，请稍候' }
    }

    isSending.value = true

    try {
      console.log('发送消息，对话ID:', conversationId)

      // 检查用户是否属于这个对话
      const conversation = conversations.value.find(conv => conv.id === conversationId)
      if (!conversation) {
        return { success: false, message: '对话不存在' }
      }

      if (conversation.otherParty.id === userStore.user.id) {
        return { success: false, message: '不能给自己发送消息' }
      }

      // 创建本地消息对象（乐观更新）
      const tempMessageId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const tempMessage = {
        id: tempMessageId,
        content: content.trim(),
        timestamp: new Date().toISOString(),
        isOwn: true,
        avatar: userStore.user.avatar || '/src/assets/default-avatar.png',
        isRead: false,
        isSending: true, // 标记为发送中
        isFailed: false // 标记为未失败
      }

      // 乐观更新：立即显示消息
      if (activeConversation.value?.id === conversationId) {
        activeConversation.value.messages.push(tempMessage)
        activeConversation.value.lastMessage = content
        activeConversation.value.lastMessageTime = tempMessage.timestamp
        
        // 滚动到底部
        setTimeout(() => scrollToBottom(), 50)
      }

      // 更新对话列表
      const convIndex = conversations.value.findIndex(conv => conv.id === conversationId)
      if (convIndex !== -1) {
        conversations.value[convIndex].lastMessage = content
        conversations.value[convIndex].lastMessageTime = tempMessage.timestamp
        // 将对话移到最前面
        const updatedConv = conversations.value.splice(convIndex, 1)[0]
        conversations.value.unshift(updatedConv)
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userStore.user.id,
          content: content.trim(),
          is_read: false
        })
        .select()
        .single()

      if (error) {
        console.error('消息插入失败:', error)
        // 更新本地消息为失败状态
        if (activeConversation.value?.id === conversationId) {
          const msgIndex = activeConversation.value.messages.findIndex(msg => msg.id === tempMessageId)
          if (msgIndex !== -1) {
            activeConversation.value.messages[msgIndex].isSending = false
            activeConversation.value.messages[msgIndex].isFailed = true
          }
        }
        throw error
      }

      if (!data) {
        throw new Error('消息创建失败，未返回数据')
      }

      console.log('消息发送成功，消息ID:', data.id)

      // 更新对话的最后消息时间
      await updateConversationLastMessage(conversationId, content)

      // 替换临时消息为真实消息
      if (activeConversation.value?.id === conversationId) {
        const msgIndex = activeConversation.value.messages.findIndex(msg => msg.id === tempMessageId)
        if (msgIndex !== -1) {
          activeConversation.value.messages[msgIndex] = {
            id: data.id,
            content: data.content,
            timestamp: data.created_at,
            isOwn: true,
            avatar: userStore.user.avatar || '/src/assets/default-avatar.png',
            isRead: false,
            isSending: false,
            isFailed: false
          }
        }
      }

      return { success: true, message: '发送成功' }
    } catch (error: any) {
      console.error('发送消息失败:', error)
      
      // 添加到失败队列，允许重试
      messageQueue.value.push({
        conversationId,
        content: content.trim(),
        timestamp: new Date().toISOString(),
        retryCount: 0
      })
      
      return { success: false, message: error.message || '发送失败，请稍后重试' }
    } finally {
      isSending.value = false
    }
  }

  // 更新对话的最后消息时间
  const updateConversationLastMessage = async (conversationId: string, lastMessage: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({
          last_message: lastMessage,
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)

      if (error) throw error
      
      console.log('对话最后消息时间更新成功')
    } catch (error) {
      console.error('更新对话最后消息时间失败:', error)
    }
  }

  // 标记消息为已读
  const markMessagesAsRead = async (conversationId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId) // 只标记非自己发送的消息
        .eq('is_read', false)

      if (error) throw error
      
      console.log('消息标记为已读成功')
    } catch (error) {
      console.error('标记消息为已读失败:', error)
    }
  }

  // 创建新对话
  const createConversation = async (productId: string, sellerId: string) => {
    const userStore = useUserStore()
    if (!userStore.user) {
      return { success: false, message: '请先登录' }
    }

    if (sellerId === userStore.user.id) {
      return { success: false, message: '不能和自己创建对话' }
    }

    try {
      console.log('创建新对话，商品ID:', productId, '卖家ID:', sellerId)

      // 检查是否已存在对话
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('product_id', productId)
        .eq('buyer_id', userStore.user.id)
        .eq('seller_id', sellerId)
        .single()

      if (existingConv) {
        console.log('对话已存在，ID:', existingConv.id)
        return { success: true, conversationId: existingConv.id, message: '对话已存在' }
      }

      // 创建新对话
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          product_id: productId,
          buyer_id: userStore.user.id,
          seller_id: sellerId,
          last_message: null,
          last_message_at: null
        })
        .select()
        .single()

      if (error) throw error

      console.log('新对话创建成功，ID:', data.id)
      return { success: true, conversationId: data.id, message: '对话创建成功' }
    } catch (error: any) {
      console.error('创建对话失败:', error)
      return { success: false, message: error.message || '创建对话失败' }
    }
  }

  // 删除对话
  const deleteConversation = async (conversationId: string) => {
    const userStore = useUserStore()
    if (!userStore.user) {
      return { success: false, message: '请先登录' }
    }

    try {
      console.log('删除对话，对话ID:', conversationId)

      // 检查用户是否属于这个对话
      const conversation = conversations.value.find(conv => conv.id === conversationId)
      if (!conversation) {
        return { success: false, message: '对话不存在' }
      }

      // 删除对话（级联删除消息）
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .or(`buyer_id.eq.${userStore.user.id},seller_id.eq.${userStore.user.id}`)

      if (error) throw error

      // 从本地列表移除
      const index = conversations.value.findIndex(conv => conv.id === conversationId)
      if (index !== -1) {
        conversations.value.splice(index, 1)
      }

      // 如果删除的是当前活动对话，清空活动对话
      if (activeConversation.value?.id === conversationId) {
        activeConversation.value = null
      }

      console.log('对话删除成功')
      return { success: true, message: '对话删除成功' }
    } catch (error: any) {
      console.error('删除对话失败:', error)
      return { success: false, message: error.message || '删除对话失败' }
    }
  }

  // 监听实时消息（Supabase实时订阅）
  const subscribeToMessages = (conversationId: string): RealtimeChannel => {
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
        async (payload) => {
          console.log('收到新消息:', payload.new)
          
          try {
            // 获取发送者信息
            const { data: senderData, error: senderError } = await supabase
              .from('profiles')
              .select('id, username, avatar_url')
              .eq('id', payload.new.sender_id)
              .single()

            if (senderError) {
              console.warn('获取发送者信息失败:', senderError)
            }

            const newMessage = {
              id: payload.new.id,
              content: payload.new.content,
              timestamp: payload.new.created_at,
              isOwn: payload.new.sender_id === useUserStore().user?.id,
              avatar: senderData?.avatar_url || '/src/assets/default-avatar.png',
              isRead: payload.new.is_read
            }

            // 更新活动对话
            if (activeConversation.value?.id === conversationId) {
              activeConversation.value.messages.push(newMessage)
              // 滚动到底部
              setTimeout(() => scrollToBottom(), 100)
            }

            // 更新对话的最后消息
            const convIndex = conversations.value.findIndex(conv => conv.id === conversationId)
            if (convIndex !== -1) {
              conversations.value[convIndex].lastMessage = payload.new.content
              conversations.value[convIndex].lastMessageTime = payload.new.created_at
              
              // 如果不是自己发的消息，增加未读数
              if (payload.new.sender_id !== useUserStore().user?.id) {
                conversations.value[convIndex].unreadCount += 1
              }
              
              // 将对话移到最前面
              const updatedConv = conversations.value.splice(convIndex, 1)[0]
              conversations.value.unshift(updatedConv)
            }
          } catch (error) {
            console.error('处理实时消息失败:', error)
          }
        }
      )
      .subscribe()

    return subscription
  }

  // 滚动到底部
  const scrollToBottom = () => {
    const messageList = document.querySelector('.message-list')
    if (messageList) {
      messageList.scrollTop = messageList.scrollHeight
    }
  }

  return {
    // 状态
    conversations,
    activeConversation,
    isLoading,
    newMessage,
    isSending,
    messageQueue,
    unreadCount,
    
    // 计算属性
    isActiveConversation,
    canSendMessage,
    
    // 方法
    fetchConversations,
    fetchMessages,
    selectConversation,
    sendMessage,
    createConversation,
    deleteConversation,
    subscribeToMessages,
    scrollToBottom
  }
})