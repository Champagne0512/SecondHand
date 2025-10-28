import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

// 校园动态类型
export interface CampusPost {
  id: string
  userId: string
  username: string
  userAvatar: string
  content: string
  images?: string[]
  type: 'text' | 'image' | 'trade' | 'event' | 'help'
  likes: number
  comments: number
  isLiked: boolean
  createdAt: string
  updatedAt: string
  location?: string
  tags?: string[]
}

// 校园活动类型
export interface CampusEvent {
  id: string
  title: string
  description: string
  organizer: string
  startTime: string
  endTime: string
  location: string
  maxParticipants: number
  currentParticipants: number
  category: 'academic' | 'social' | 'sports' | 'culture' | 'volunteer'
  tags: string[]
  isRegistered: boolean
  createdAt: string
}

// 失物招领类型
export interface LostFoundItem {
  id: string
  type: 'lost' | 'found'
  title: string
  description: string
  itemCategory: string
  location: string
  date: string
  contactInfo: string
  images?: string[]
  status: 'active' | 'resolved' | 'expired'
  userId: string
  username: string
  createdAt: string
}

// 校园生活store
export const useCampusStore = defineStore('campus', () => {
  // 状态
  const campusPosts = ref<CampusPost[]>([])
  const campusEvents = ref<CampusEvent[]>([])
  const lostFoundItems = ref<LostFoundItem[]>([])
  const isLoading = ref(false)

  // 筛选条件
  const filters = ref({
    postType: 'all', // all, text, image, trade, event, help
    eventCategory: 'all',
    lostFoundType: 'all' // all, lost, found
  })

  // 计算属性
  const filteredPosts = computed(() => {
    if (filters.value.postType === 'all') {
      return campusPosts.value
    }
    return campusPosts.value.filter(post => post.type === filters.value.postType)
  })

  const filteredEvents = computed(() => {
    if (filters.value.eventCategory === 'all') {
      return campusEvents.value
    }
    return campusEvents.value.filter(event => event.category === filters.value.eventCategory)
  })

  const filteredLostFound = computed(() => {
    if (filters.value.lostFoundType === 'all') {
      return lostFoundItems.value
    }
    return lostFoundItems.value.filter(item => item.type === filters.value.lostFoundType)
  })

  // 获取校园动态
  const getCampusPosts = async (limit: number = 20) => {
    isLoading.value = true
    try {
      // 如果没有表，返回模拟数据
      const { data: posts, error } = await supabase
        .from('campus_posts')
        .select(`
          *,
          user:profiles!campus_posts_user_id_fkey(username, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.warn('获取校园动态失败，使用模拟数据:', error)
        // 返回模拟数据
        campusPosts.value = [
          {
            id: 'post_001',
            userId: '8768e8dc-aa31-48b7-b769-b9eb1dcdad54',
            username: '张三',
            userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            content: '今天在学校图书馆发现了一本绝版的好书，分享给大家！📚 这本书对我们的专业学习特别有帮助，有需要的同学可以来图书馆三楼找我借阅。',
            images: ['https://images.unsplash.com/photo-1481627834876-b6d793948c76?w=400'],
            type: 'text' as const,
            likes: 15,
            comments: 3,
            isLiked: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            location: '图书馆',
            tags: ['学习', '分享', '图书']
          },
          {
            id: 'post_002',
            userId: '09e88732-99ae-4afc-9b7c-43048e8e3fa4',
            username: '李四',
            userAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
            content: '明天下午2点在学生活动中心有编程技术分享会，欢迎对前端开发感兴趣的同学参加！🚀 我会分享一些Vue.js的实战经验。',
            images: [],
            type: 'event' as const,
            likes: 28,
            comments: 8,
            isLiked: false,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString(),
            location: '学生活动中心',
            tags: ['技术分享', '前端', 'Vue.js']
          }
        ]
        return campusPosts.value
      }

      campusPosts.value = (posts || []).map(post => ({
        id: post.id,
        userId: post.user_id,
        username: post.user?.username || '匿名用户',
        userAvatar: post.user?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        content: post.content,
        images: post.images || [],
        type: post.type,
        likes: post.likes || 0,
        comments: post.comments || 0,
        isLiked: post.is_liked || false,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        location: post.location,
        tags: post.tags || []
      }))
    } catch (error) {
      console.error('获取校园动态失败:', error)
      // 使用模拟数据
      campusPosts.value = [
        {
          id: 'post_001',
          userId: '8768e8dc-aa31-48b7-b769-b9eb1dcdad54',
          username: '张三',
          userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          content: '今天在学校图书馆发现了一本绝版的好书，分享给大家！📚 这本书对我们的专业学习特别有帮助，有需要的同学可以来图书馆三楼找我借阅。',
          images: ['https://images.unsplash.com/photo-1481627834876-b6d793948c76?w=400'],
          type: 'text' as const,
          likes: 15,
          comments: 3,
          isLiked: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          location: '图书馆',
          tags: ['学习', '分享', '图书']
        }
      ]
    } finally {
      isLoading.value = false
    }
  }

  // 发布校园动态
  const publishCampusPost = async (postData: {
    content: string
    images?: string[]
    type: 'text' | 'image' | 'trade' | 'event' | 'help'
    location?: string
    tags?: string[]
  }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('用户未登录')

    isLoading.value = true
    try {
      const { data, error } = await supabase
        .from('campus_posts')
        .insert({
          user_id: user.id,
          content: postData.content,
          images: postData.images || [],
          type: postData.type,
          location: postData.location,
          tags: postData.tags || []
        })
        .select()
        .single()

      if (error) throw error

      // 添加到本地列表
      campusPosts.value.unshift({
        id: data.id,
        userId: data.user_id,
        username: '当前用户', // 实际项目中应该从用户信息获取
        userAvatar: '/src/assets/default-avatar.png',
        content: data.content,
        images: data.images,
        type: data.type,
        likes: 0,
        comments: 0,
        isLiked: false,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        location: data.location,
        tags: data.tags
      })

      return { success: true, message: '发布成功' }
    } catch (error: any) {
      console.error('发布校园动态失败:', error)
      return { success: false, message: error.message || '发布失败' }
    } finally {
      isLoading.value = false
    }
  }

  // 获取校园活动
  const getCampusEvents = async (limit: number = 10) => {
    isLoading.value = true
    try {
      const { data: events, error } = await supabase
        .from('campus_events')
        .select('*')
        .gte('end_time', new Date().toISOString()) // 只获取未结束的活动
        .order('start_time', { ascending: true })
        .limit(limit)

      if (error) throw error

      campusEvents.value = (events || []).map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        organizer: event.organizer,
        startTime: event.start_time,
        endTime: event.end_time,
        location: event.location,
        maxParticipants: event.max_participants,
        currentParticipants: event.current_participants || 0,
        category: event.category,
        tags: event.tags || [],
        isRegistered: false, // 需要根据当前用户查询
        createdAt: event.created_at
      }))
    } catch (error) {
      console.error('获取校园活动失败:', error)
      campusEvents.value = []
    } finally {
      isLoading.value = false
    }
  }

  // 报名参加校园活动
  const registerForEvent = async (eventId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('用户未登录')

    try {
      const { error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          user_id: user.id
        })

      if (error) throw error

      // 更新活动参与人数
      await supabase.rpc('increment_event_participants', { event_id: eventId })

      // 更新本地数据
      const event = campusEvents.value.find(e => e.id === eventId)
      if (event) {
        event.currentParticipants += 1
        event.isRegistered = true
      }

      return { success: true, message: '报名成功' }
    } catch (error: any) {
      console.error('活动报名失败:', error)
      return { success: false, message: error.message || '报名失败' }
    }
  }

  // 获取失物招领信息
  const getLostFoundItems = async (limit: number = 20) => {
    isLoading.value = true
    try {
      const { data: items, error } = await supabase
        .from('lost_found_items')
        .select(`
          *,
          user:profiles!lost_found_items_user_id_fkey(username)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      lostFoundItems.value = (items || []).map(item => ({
        id: item.id,
        type: item.type,
        title: item.title,
        description: item.description,
        itemCategory: item.item_category,
        location: item.location,
        date: item.date,
        contactInfo: item.contact_info,
        images: item.images || [],
        status: item.status,
        userId: item.user_id,
        username: item.user?.username || '匿名用户',
        createdAt: item.created_at
      }))
    } catch (error) {
      console.error('获取失物招领信息失败:', error)
      lostFoundItems.value = []
    } finally {
      isLoading.value = false
    }
  }

  // 发布失物招领信息
  const publishLostFoundItem = async (itemData: {
    type: 'lost' | 'found'
    title: string
    description: string
    itemCategory: string
    location: string
    date: string
    contactInfo: string
    images?: string[]
  }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('用户未登录')

    try {
      const { data, error } = await supabase
        .from('lost_found_items')
        .insert({
          user_id: user.id,
          type: itemData.type,
          title: itemData.title,
          description: itemData.description,
          item_category: itemData.itemCategory,
          location: itemData.location,
          date: itemData.date,
          contact_info: itemData.contactInfo,
          images: itemData.images || []
        })
        .select()
        .single()

      if (error) throw error

      // 添加到本地列表
      lostFoundItems.value.unshift({
        id: data.id,
        type: data.type,
        title: data.title,
        description: data.description,
        itemCategory: data.item_category,
        location: data.location,
        date: data.date,
        contactInfo: data.contact_info,
        images: data.images,
        status: data.status,
        userId: data.user_id,
        username: '当前用户',
        createdAt: data.created_at
      })

      return { success: true, message: '发布成功' }
    } catch (error: any) {
      console.error('发布失物招领信息失败:', error)
      return { success: false, message: error.message || '发布失败' }
    }
  }

  // 更新筛选条件
  const updateFilters = (newFilters: Partial<typeof filters.value>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  return {
    campusPosts,
    campusEvents,
    lostFoundItems,
    isLoading,
    filters,
    filteredPosts,
    filteredEvents,
    filteredLostFound,
    getCampusPosts,
    publishCampusPost,
    getCampusEvents,
    registerForEvent,
    getLostFoundItems,
    publishLostFoundItem,
    updateFilters
  }
})