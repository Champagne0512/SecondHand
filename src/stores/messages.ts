import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Message, Conversation } from '@/types/message'

// 消息状态管理store
export const useMessageStore = defineStore('messages', () => {
  // 状态
  const conversations = ref<Conversation[]>([])
  const currentConversation = ref<Conversation | null>(null)
  const unreadCount = ref(0)

  // 获取对话列表
  const fetchConversations = async () => {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟数据
    conversations.value = [
      {
        id: 1,
        userId: 2,
        username: '张三',
        avatar: '/src/assets/default-avatar.png',
        lastMessage: '你好，这个MacBook Pro还能便宜点吗？',
        lastMessageTime: '2024-01-20T14:30:00Z',
        unreadCount: 2,
        productId: 1,
        productTitle: 'MacBook Pro 2020'
      },
      {
        id: 2,
        userId: 3,
        username: '李四',
        avatar: '/src/assets/default-avatar.png',
        lastMessage: '考研资料还有吗？',
        lastMessageTime: '2024-01-19T10:15:00Z',
        unreadCount: 0,
        productId: 2,
        productTitle: '考研数学复习资料'
      }
    ]
    
    // 计算总未读消息数
    unreadCount.value = conversations.value.reduce((total, conv) => total + conv.unreadCount, 0)
  }

  // 获取对话详情
  const fetchConversationDetail = async (conversationId: number) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const conversation = conversations.value.find(c => c.id === conversationId)
    if (conversation) {
      currentConversation.value = conversation
      
      // 模拟消息数据
      const messages: Message[] = [
        {
          id: 1,
          conversationId: conversationId,
          senderId: conversation.userId,
          content: conversation.lastMessage,
          timestamp: conversation.lastMessageTime,
          isRead: false
        }
      ]
      
      // 标记为已读
      conversation.unreadCount = 0
      unreadCount.value = conversations.value.reduce((total, conv) => total + conv.unreadCount, 0)
      
      return messages
    }
    return []
  }

  // 发送消息
  const sendMessage = async (conversationId: number, content: string) => {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const message: Message = {
      id: Date.now(),
      conversationId,
      senderId: 1, // 当前用户ID
      content,
      timestamp: new Date().toISOString(),
      isRead: true
    }
    
    // 更新对话最后消息
    const conversation = conversations.value.find(c => c.id === conversationId)
    if (conversation) {
      conversation.lastMessage = content
      conversation.lastMessageTime = message.timestamp
    }
    
    return message
  }

  // 创建新对话
  const createConversation = async (userId: number, productId: number, initialMessage: string) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const newConversation: Conversation = {
      id: Date.now(),
      userId,
      username: '新用户', // 实际应从API获取
      avatar: '/src/assets/default-avatar.png',
      lastMessage: initialMessage,
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
      productId,
      productTitle: '商品标题' // 实际应从API获取
    }
    
    conversations.value.unshift(newConversation)
    return newConversation
  }

  // 删除对话
  const deleteConversation = async (conversationId: number) => {
    const index = conversations.value.findIndex(c => c.id === conversationId)
    if (index !== -1) {
      conversations.value.splice(index, 1)
      
      if (currentConversation.value?.id === conversationId) {
        currentConversation.value = null
      }
      
      // 重新计算未读消息数
      unreadCount.value = conversations.value.reduce((total, conv) => total + conv.unreadCount, 0)
    }
  }

  return {
    conversations,
    currentConversation,
    unreadCount,
    fetchConversations,
    fetchConversationDetail,
    sendMessage,
    createConversation,
    deleteConversation
  }
})