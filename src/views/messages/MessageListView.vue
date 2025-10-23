<template>
  <div class="message-list-view">
    <!-- 全局导航组件 -->
    <GlobalNavigation />

    <!-- 主要内容 -->
    <main class="main-content" v-loading="messageStore.isLoading">
      <div class="container">
        <div class="message-layout">
          <!-- 对话列表 -->
          <aside class="message-sidebar">
            <div class="sidebar-header">
              <h2>对话列表</h2>
              <el-button type="primary" size="small" @click="handleNewConversation">
                <el-icon><Plus /></el-icon>
                新对话
              </el-button>
            </div>
            
            <!-- 错误状态 -->
            <div v-if="hasError" class="error-state">
              <el-empty description="加载失败">
                <template #description>
                  <p>消息加载失败</p>
                  <p style="font-size: 14px; color: #909399; margin-top: 8px;">
                    {{ errorMessage }}
                  </p>
                </template>
                <el-button type="primary" @click="loadConversations">重新加载</el-button>
              </el-empty>
            </div>
            
            <div v-else-if="conversations.length > 0" class="conversation-list">
              <div 
                v-for="conversation in conversations" 
                :key="conversation.id"
                class="conversation-item"
                :class="{ active: activeConversation?.id === conversation.id }"
                @click="handleSelectConversation(conversation)"
              >
                <div class="conversation-avatar">
                  <el-avatar :size="40" :src="conversation.otherParty.avatar" />
                  <div v-if="conversation.unreadCount > 0" class="unread-badge">
                    {{ conversation.unreadCount }}
                  </div>
                </div>
                
                <div class="conversation-info">
                  <div class="conversation-header">
                    <h4>{{ conversation.otherParty.name }}</h4>
                    <span class="time">{{ formatTime(conversation.lastMessageTime) }}</span>
                  </div>
                  
                  <p class="last-message">{{ conversation.lastMessage || '暂无消息' }}</p>
                  
                  <div v-if="conversation.product" class="product-preview">
                    <el-icon><Goods /></el-icon>
                    <span>{{ conversation.product.title }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 空对话状态 -->
            <div v-else class="empty-conversations">
              <el-empty description="暂无对话">
                <template #description>
                  <p>您还没有任何对话</p>
                  <p style="font-size: 14px; color: #909399; margin-top: 8px;">
                    在商品详情页点击"联系卖家"来开始对话
                  </p>
                </template>
              </el-empty>
            </div>
          </aside>

          <!-- 聊天窗口 -->
          <div class="chat-window">
            <div v-if="activeConversation" class="chat-container">
              <!-- 聊天头部 -->
              <div class="chat-header">
                <div class="chat-partner">
                  <el-avatar :size="40" :src="activeConversation.otherParty.avatar" />
                  <div class="partner-info">
                    <h3>{{ activeConversation.otherParty.name }}</h3>
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
              <div class="message-list" ref="messageListRef" v-loading="messageStore.isLoading">
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
                
                <!-- 空消息状态 -->
                <div v-if="activeConversation.messages.length === 0" class="empty-messages">
                  <el-empty description="暂无消息" :image-size="100">
                    <p style="color: #909399; font-size: 14px;">
                      开始与对方聊天吧！
                    </p>
                  </el-empty>
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
import { ref, reactive, onMounted, nextTick, watch, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useProductStore } from '@/stores/products'
import { useMessageStore } from '@/stores/messages'
import { ShoppingBag, Plus, Goods } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import GlobalNavigation from '@/components/GlobalNavigation.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const productStore = useProductStore()
const messageStore = useMessageStore()

const messageListRef = ref<HTMLElement>()
const subscription = ref<any>(null)

// 实时订阅状态
const isSubscribed = ref(false)

// 错误状态
const hasError = ref(false)
const errorMessage = ref('')

// 对话列表从store获取
const conversations = computed(() => messageStore.conversations)
const activeConversation = computed(() => messageStore.activeConversation)
const newMessage = computed({
  get: () => messageStore.newMessage,
  set: (value) => messageStore.newMessage = value
})

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

// 订阅实时消息
const subscribeToRealTimeMessages = (conversationId: string) => {
  if (subscription.value) {
    subscription.value.unsubscribe()
  }
  
  subscription.value = messageStore.subscribeToMessages(conversationId)
  isSubscribed.value = true
  console.log('已订阅实时消息，对话ID:', conversationId)
}

// 取消订阅
const unsubscribeFromMessages = () => {
  if (subscription.value) {
    subscription.value.unsubscribe()
    subscription.value = null
    isSubscribed.value = false
    console.log('已取消实时消息订阅')
  }
}

// 选择对话
const handleSelectConversation = async (conversation: any) => {
  try {
    console.log('选择对话:', conversation.id)
    
    // 取消之前的订阅
    unsubscribeFromMessages()
    
    await messageStore.selectConversation(conversation)
    
    // 订阅实时消息
    subscribeToRealTimeMessages(conversation.id)
    
    // 滚动到底部
    nextTick(() => {
      messageStore.scrollToBottom()
    })
  } catch (error) {
    console.error('选择对话失败:', error)
    ElMessage.error('选择对话失败')
  }
}

// 发送消息
const handleSendMessage = async () => {
  if (!newMessage.value.trim() || !activeConversation.value) return
  
  try {
    console.log('发送消息:', newMessage.value)
    
    const result = await messageStore.sendMessage(
      activeConversation.value.id,
      newMessage.value.trim()
    )
    
    if (result.success) {
      console.log('消息发送成功')
      // 清空输入框
      newMessage.value = ''
      
      // 滚动到底部
      nextTick(() => {
        messageStore.scrollToBottom()
      })
    } else {
      ElMessage.error(result.message || '发送失败')
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败')
  }
}

// 滚动到底部
const scrollToBottom = () => {
  messageStore.scrollToBottom()
}

// 查看商品
const handleViewProduct = () => {
  if (activeConversation.value?.product) {
    router.push(`/products/${activeConversation.value.product.id}`)
  }
}

// 删除对话
const handleDeleteConversation = async () => {
  if (!activeConversation.value) return
  
  try {
    const result = await ElMessageBox.confirm(
      '确定要删除这个对话吗？删除后将无法恢复聊天记录。',
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        distinguishCancelAndClose: true
      }
    )
    
    if (result) {
      const deleteResult = await messageStore.deleteConversation(activeConversation.value.id)
      
      if (deleteResult.success) {
        ElMessage.success('对话已删除')
        // 取消订阅
        unsubscribeFromMessages()
      } else {
        ElMessage.error(deleteResult.message || '删除失败')
      }
    }
  } catch (error) {
    // 用户取消删除
    console.log('用户取消删除对话')
  }
}

// 新对话
const handleNewConversation = () => {
  ElMessage.info('新对话功能：请在商品详情页点击"联系卖家"来开始新的对话')
}

// 重新加载对话列表
const loadConversations = async () => {
  hasError.value = false
  errorMessage.value = ''
  try {
    await messageStore.fetchConversations()
    ElMessage.success('对话列表已重新加载')
  } catch (error) {
    console.error('重新加载失败:', error)
    hasError.value = true
    errorMessage.value = '重新加载失败'
    ElMessage.error('重新加载失败')
  }
}

onMounted(async () => {
  console.log('消息页面开始初始化')
  hasError.value = false
  errorMessage.value = ''
  
  try {
    await userStore.initUser()
    
    // 如果用户未登录，跳转到登录页
    if (!userStore.isLoggedIn) {
      ElMessage.warning('请先登录后再查看消息')
      router.push('/login')
      return
    }
    
    console.log('用户已登录，开始加载消息数据')
    console.log('当前用户:', userStore.user?.id, userStore.user?.username)
    
    // 加载对话列表
    console.log('开始加载对话列表...')
    const conversations = await messageStore.fetchConversations()
    console.log('对话列表加载完成，数量:', conversations.length)
    console.log('对话列表详情:', conversations)
    
    // 检查对话列表是否为空
    if (conversations.length === 0) {
      console.log('对话列表为空，显示空状态')
    } else {
      console.log('找到对话，第一个对话:', conversations[0])
    }
    
    // 如果有路由参数，自动选择对话或创建新对话
    const sellerId = route.query.sellerId as string
    const productId = route.query.productId as string
    
    if (sellerId && productId) {
      console.log('检测到路由参数，商品ID:', productId, '卖家ID:', sellerId)
      
      // 查找是否已存在对话
      let conversation = messageStore.conversations.find(conv => 
        conv.productId === productId && conv.otherParty.id === sellerId
      )
      
      if (!conversation) {
        console.log('未找到现有对话，尝试创建新对话')
        // 创建新对话
        const createResult = await messageStore.createConversation(productId, sellerId)
        
        if (createResult.success) {
          console.log('新对话创建成功，对话ID:', createResult.conversationId)
          // 重新加载对话列表
          await messageStore.fetchConversations()
          // 找到新创建的对话
          conversation = messageStore.conversations.find(conv => conv.id === createResult.conversationId)
        } else {
          ElMessage.error(createResult.message || '创建对话失败')
          return
        }
      } else {
        console.log('找到现有对话，对话ID:', conversation.id)
      }
      
      if (conversation) {
        console.log('自动选择对话:', conversation.id)
        await handleSelectConversation(conversation)
      }
    }
    
    console.log('消息页面初始化完成')
  } catch (error) {
    console.error('消息页面初始化失败:', error)
    hasError.value = true
    errorMessage.value = (error as any).message || '页面加载失败'
    ElMessage.error('页面加载失败，请刷新重试')
  }
})

// 组件卸载时清理
onUnmounted(() => {
  unsubscribeFromMessages()
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

.error-state {
  padding: 40px 20px;
  text-align: center;
  background-color: #fef0f0;
  border-radius: 8px;
  margin: 20px;
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
  color: #909399;
}

.chat-actions {
  display: flex;
  gap: 8px;
}

/* 消息列表 */
.message-list {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #fafafa;
  position: relative;
}

.message-item {
  display: flex;
  margin-bottom: 16px;
  align-items: flex-end;
}

.message-item.own-message {
  flex-direction: row-reverse;
}

.message-avatar {
  margin: 0 12px;
}

.message-content {
  max-width: 60%;
}

.message-bubble {
  background: white;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  word-wrap: break-word;
  word-break: break-word;
}

.message-bubble p {
  margin: 0;
  line-height: 1.5;
}

.own-message .message-bubble {
  background: #409eff;
  color: white;
}

.message-time {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  text-align: right;
}

.own-message .message-time {
  text-align: left;
}

/* 空消息状态 */
.empty-messages {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  padding: 20px;
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