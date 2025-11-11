// 消息相关类型定义

export interface Message {
  id: number
  conversationId: number
  senderId: number
  content: string
  timestamp: string
  isRead: boolean
}

export interface Conversation {
  id: number
  userId: number
  username: string
  avatar?: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  productId?: number
  productTitle?: string
}

export interface CreateMessageRequest {
  conversationId: number
  content: string
}

export interface CreateConversationRequest {
  userId: number
  productId: number
  initialMessage: string
}