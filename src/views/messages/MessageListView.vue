<template>
  <div class="message-list-view">
    <!-- 全局导航组件 -->
    <GlobalNavigation />

    <!-- 主要内容 -->
    <main class="main-content">
      <div class="container">
        <div class="message-layout">
          <!-- 消息列表 -->
          <aside class="message-sidebar">
            <div class="sidebar-header">
              <h2>对话列表</h2>
              <el-button type="primary" size="small" @click="handleNewConversation">
                <el-icon><Plus /></el-icon>
                新对话
              </el-button>
            </div>
            
            <div class="conversation-list">
              <div 
                v-for="conversation in conversations" 
                :key="conversation.id"
                class="conversation-item"
                :class="{ active: activeConversation?.id === conversation.id }"
                @click="handleSelectConversation(conversation)"
              >
                <div class="conversation-avatar">
                  <el-avatar :size="40" :src="conversation.avatar" />
                  <div v-if="conversation.unreadCount > 0" class="unread-badge">
                    {{ conversation.unreadCount }}
                  </div>
                </div>
                
                <div class="conversation-info">
                  <div class="conversation-header">
                    <h4>{{ conversation.name }}</h4>
                    <span class="time">{{ formatTime(conversation.lastMessageTime) }}</span>
                  </div>
                  
                  <p class="last-message">{{ conversation.lastMessage }}</p>
                  
                  <div v-if="conversation.product" class="product-preview">
                    <el-icon><Goods /></el-icon>
                    <span>{{ conversation.product.title }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-if="conversations.length === 0" class="empty-conversations">
              <el-empty description="暂无对话" />
            </div>
          </aside>

          <!-- 聊天窗口 -->
          <div class="chat-window">
            <div v-if="activeConversation" class="chat-container">
              <!-- 聊天头部 -->
              <div class="chat-header">
                <div class="chat-partner">
                  <el-avatar :size="40" :src="activeConversation.avatar" />
                  <div class="partner-info">
                    <h3>{{ activeConversation.name }}</h3>
                    <p v-if="activeConversation.product" class="product-info">
                      关于: {{ activeConversation.product.title }}
                    </p>
                  </div>
                </div>
                
                <div class="chat-actions">
                  <el-button size="small" @click="handleViewProduct">查看商品</el-button>
                  <el-button size="small" type="danger" @click="handleDeleteConversation">删除对话</el-button>
                </div>
              </div>

              <!-- 消息列表 -->
              <div class="message-list" ref="messageListRef">
                <div 
                  v-for="message in activeConversation.messages" 
                  :key="message.id"
                  class="message-item"
                  :class="{ 'own-message': message.isOwn }"
                >
                  <div class="message-avatar">
                    <el-avatar :size="32" :src="message.avatar" />
                  </div>
                  
                  <div class="message-content">
                    <div class="message-bubble">
                      <p>{{ message.content }}</p>
                    </div>
                    <div class="message-time">{{ formatTime(message.timestamp) }}</div>
                  </div>
                </div>
              </div>

              <!-- 消息输入 -->
              <div class="message-input">
                <el-input
                  v-model="newMessage"
                  type="textarea"
                  :rows="3"
                  placeholder="输入消息..."
                  @keydown.enter.prevent="handleSendMessage"
                />
                <div class="input-actions">
                  <el-button type="primary" @click="handleSendMessage" :disabled="!newMessage.trim()">
                    发送
                  </el-button>
                </div>
              </div>
            </div>
            
            <!-- 未选择对话 -->
            <div v-else class="no-conversation">
              <el-empty description="请选择一个对话开始聊天" />
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useProductStore } from '@/stores/products'
import { ShoppingBag, Plus, Goods } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const productStore = useProductStore()

const messageListRef = ref<HTMLElement>()
const activeConversation = ref<any>(null)
const newMessage = ref('')

// 对话列表（模拟数据）
const conversations = ref([
  {
    id: 1,
    name: '张三',
    avatar: '/src/assets/default-avatar.png',
    lastMessage: '你好，这个MacBook Pro还能便宜点吗？',
    lastMessageTime: '2024-01-20T14:30:00Z',
    unreadCount: 2,
    product: {
      id: 1,
      title: 'MacBook Pro 2020'
    },
    messages: [
      {
        id: 1,
        content: '你好，这个MacBook Pro还能便宜点吗？',
        timestamp: '2024-01-20T14:30:00Z',
        isOwn: false,
        avatar: '/src/assets/default-avatar.png'
      },
      {
        id: 2,
        content: '最低6200，已经很便宜了',
        timestamp: '2024-01-20T14:35:00Z',
        isOwn: true,
        avatar: userStore.userInfo?.avatar
      }
    ]
  },
  {
    id: 2,
    name: '李四',
    avatar: '/src/assets/default-avatar.png',
    lastMessage: '考研资料还有吗？',
    lastMessageTime: '2024-01-19T10:15:00Z',
    unreadCount: 0,
    product: {
      id: 2,
      title: '考研数学复习资料'
    },
    messages: [
      {
        id: 1,
        content: '考研资料还有吗？',
        timestamp: '2024-01-19T10:15:00Z',
        isOwn: false,
        avatar: '/src/assets/default-avatar.png'
      }
    ]
  }
])

// 格式化时间
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 24 * 60 * 60 * 1000) {
    // 今天内的消息
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  } else if (diff < 7 * 24 * 60 * 60 * 1000) {
    // 一周内的消息
    return date.toLocaleDateString('zh-CN', { 
      weekday: 'short'
    })
  } else {
    // 更早的消息
    return date.toLocaleDateString('zh-CN')
  }
}

// 选择对话
const handleSelectConversation = (conversation: any) => {
  activeConversation.value = conversation
  // 标记为已读
  conversation.unreadCount = 0
  
  // 滚动到底部
  nextTick(() => {
    scrollToBottom()
  })
}

// 发送消息
const handleSendMessage = () => {
  if (!newMessage.value.trim() || !activeConversation.value) return
  
  const message = {
    id: Date.now(),
    content: newMessage.value.trim(),
    timestamp: new Date().toISOString(),
    isOwn: true,
    avatar: userStore.userInfo?.avatar
  }
  
  activeConversation.value.messages.push(message)
  activeConversation.value.lastMessage = message.content
  activeConversation.value.lastMessageTime = message.timestamp
  
  newMessage.value = ''
  
  // 滚动到底部
  nextTick(() => {
    scrollToBottom()
  })
  
  // 模拟对方回复（演示用）
  setTimeout(() => {
    if (activeConversation.value) {
      const reply = {
        id: Date.now() + 1,
        content: '收到，我会考虑的',
        timestamp: new Date().toISOString(),
        isOwn: false,
        avatar: activeConversation.value.avatar
      }
      
      activeConversation.value.messages.push(reply)
      activeConversation.value.lastMessage = reply.content
      activeConversation.value.lastMessageTime = reply.timestamp
      activeConversation.value.unreadCount++
      
      nextTick(() => {
        scrollToBottom()
      })
    }
  }, 2000)
}

// 滚动到底部
const scrollToBottom = () => {
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

// 查看商品
const handleViewProduct = () => {
  if (activeConversation.value?.product) {
    router.push(`/products/${activeConversation.value.product.id}`)
  }
}

// 删除对话
const handleDeleteConversation = () => {
  if (!activeConversation.value) return
  
  ElMessageBox.confirm('确定要删除这个对话吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = conversations.value.findIndex(c => c.id === activeConversation.value.id)
    if (index !== -1) {
      conversations.value.splice(index, 1)
      activeConversation.value = null
      ElMessage.success('对话已删除')
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// 新对话
const handleNewConversation = () => {
  ElMessage.info('新对话功能开发中')
}

onMounted(async () => {
  await userStore.initUser()
  
  // 如果用户未登录，跳转到登录页
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后再查看消息')
    router.push('/login')
    return
  }
  
  // 如果有路由参数，自动选择对话
  const sellerId = route.query.sellerId
  const productId = route.query.productId
  
  if (sellerId && productId) {
    // 查找或创建对话
    let conversation = conversations.value.find(c => 
      c.product?.id === parseInt(productId as string)
    )
    
    if (!conversation) {
      // 创建新对话（模拟）
      const product = productStore.products.find(p => p.id === parseInt(productId as string))
      if (product) {
        conversation = {
          id: Date.now(),
          name: product.sellerName,
          avatar: product.sellerAvatar || '/src/assets/default-avatar.png',
          lastMessage: `关于: ${product.title}`,
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
          product: product,
          messages: []
        }
        conversations.value.unshift(conversation)
      }
    }
    
    if (conversation) {
      activeConversation.value = conversation
    }
  }
})
</script>

<style scoped>
.message-list-view {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 头部样式 */
.header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header .container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.logo {
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
  cursor: pointer;
}

.logo .el-icon {
  margin-right: 8px;
}

.page-title h1 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

/* 主要内容 */
.main-content {
  padding: 20px 0;
  height: calc(100vh - 104px);
}

.message-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 20px;
  height: 100%;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 消息侧边栏 */
.message-sidebar {
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f2f5;
  transition: background-color 0.3s;
}

.conversation-item:hover {
  background-color: #f5f7fa;
}

.conversation-item.active {
  background-color: #ecf5ff;
}

.conversation-avatar {
  position: relative;
  margin-right: 12px;
}

.unread-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #f56c6c;
  color: white;
  border-radius: 10px;
  min-width: 18px;
  height: 18px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.conversation-info {
  flex: 1;
  min-width: 0;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.conversation-header h4 {
  margin: 0;
  font-size: 14px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.time {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}

.last-message {
  margin: 0;
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-preview {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 12px;
  color: #409eff;
}

.empty-conversations {
  padding: 40px 20px;
  text-align: center;
}

/* 聊天窗口 */
.chat-window {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
}

.chat-partner {
  display: flex;
  align-items: center;
  gap: 12px;
}

.partner-info h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #303133;
}

.product-info {
  margin: 0;
  font-size: 14px;
  color: #409eff;
}

.chat-actions {
  display: flex;
  gap: 8px;
}

/* 消息列表 */
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  display: flex;
  gap: 12px;
}

.message-item.own-message {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
}

.message-bubble {
  background: #f0f2f5;
  padding: 12px 16px;
  border-radius: 8px;
  word-wrap: break-word;
}

.message-bubble p {
  margin: 0;
  line-height: 1.4;
}

.own-message .message-bubble {
  background: #409eff;
  color: white;
}

.message-time {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  text-align: left;
}

.own-message .message-time {
  text-align: right;
}

/* 消息输入 */
.message-input {
  border-top: 1px solid #e4e7ed;
  padding: 16px 20px;
}

.input-actions {
  margin-top: 12px;
  text-align: right;
}

/* 未选择对话 */
.no-conversation {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .message-layout {
    grid-template-columns: 1fr;
  }
  
  .message-sidebar {
    display: none;
  }
  
  .header .container {
    flex-direction: column;
    height: auto;
    padding: 16px 20px;
    gap: 16px;
  }
  
  .page-title {
    order: -1;
  }
}
</style>