import { supabase, type Database } from '@/lib/supabase'
import type { Product, ProductForm, ProductFilter } from '@/types/product'

// 用户相关API
export const supabaseUserApi = {
  // 用户注册
  register: async (data: { username: string; email: string; password: string; phone?: string }) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          username: data.username,
          phone: data.phone
        }
      }
    })

    if (authError) throw authError

    if (authData.user) {
      // 创建用户profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username: data.username,
          email: data.email,
          phone: data.phone
        })

      if (profileError) throw profileError
    }

    return authData
  },

  // 用户登录
  login: async (data: { email: string; password: string }) => {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    })

    if (error) throw error
    return authData
  },

  // 获取用户信息
  getProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('用户未登录')

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error
    return profile
  },

  // 更新用户信息
  updateProfile: async (data: any) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('用户未登录')

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) throw error
    return profile
  },

  // 退出登录
  logout: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }
}

// 商品相关API
export const supabaseProductApi = {
  // 获取商品列表
  getProducts: async (params?: { category?: string; keyword?: string; page?: number; limit?: number }) => {
    // 先获取商品数据
    let query = supabase
      .from('products')
      .select('*')
      .eq('status', 'available')

    // 应用筛选条件
    if (params?.category) {
      query = query.eq('category', params.category)
    }

    if (params?.keyword) {
      query = query.or(`title.ilike.%${params.keyword}%,description.ilike.%${params.keyword}%`)
    }

    // 分页
    const page = params?.page || 1
    const limit = params?.limit || 20
    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query.range(from, to).order('created_at', { ascending: false })

    const { data: productsData, error: productsError } = await query

    if (productsError) throw productsError

    if (!productsData || productsData.length === 0) {
      return []
    }

    // 获取卖家信息
    const sellerIds = [...new Set(productsData.map(p => p.seller_id))]
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', sellerIds)

    if (profilesError) throw profilesError

    // 创建卖家信息映射
    const profilesMap = new Map()
    if (profilesData) {
      profilesData.forEach(profile => {
        profilesMap.set(profile.id, profile)
      })
    }

    // 转换数据格式
    return productsData.map(item => {
      const profile = profilesMap.get(item.seller_id)
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        price: item.price,
        originalPrice: item.original_price,
        category: item.category,
        images: item.images,
        condition: item.condition,
        sellerId: item.seller_id,
        sellerName: profile?.username || '未知用户',
        sellerAvatar: profile?.avatar_url,
        status: item.status,
        location: item.location,
        contactInfo: item.contact_info,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        viewCount: item.view_count || 0,
        likeCount: item.like_count || 0
      }
    })
  },

  // 获取商品详情
  getProduct: async (id: string) => {
    // 获取商品数据
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (productError) throw productError

    // 获取卖家信息
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', productData.seller_id)
      .single()

    if (profileError) {
      console.warn('获取卖家信息失败:', profileError)
    }

    // 增加浏览量
    await supabase
      .from('products')
      .update({ view_count: (productData.view_count || 0) + 1 })
      .eq('id', id)

    return {
      id: productData.id,
      title: productData.title,
      description: productData.description,
      price: productData.price,
      originalPrice: productData.original_price,
      category: productData.category,
      images: productData.images,
      condition: productData.condition,
      sellerId: productData.seller_id,
      sellerName: profileData?.username || '未知用户',
      sellerAvatar: profileData?.avatar_url,
      status: productData.status,
      location: productData.location,
      contactInfo: productData.contact_info,
      createdAt: productData.created_at,
      updatedAt: productData.updated_at,
      viewCount: (productData.view_count || 0) + 1,
      likeCount: productData.like_count || 0
    }
  },

  // 发布商品
  createProduct: async (data: ProductForm) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('用户未登录')

    const productData = {
      title: data.title,
      description: data.description,
      price: data.price,
      original_price: data.originalPrice,
      category: data.category,
      images: data.images,
      condition: data.condition,
      seller_id: user.id,
      status: 'available' as const,
      location: data.location,
      contact_info: data.contactInfo
    }

    const { data: product, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single()

    if (error) throw error
    return product
  },

  // 更新商品
  updateProduct: async (id: string, data: any) => {
    const { data: product, error } = await supabase
      .from('products')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return product
  },

  // 删除商品
  deleteProduct: async (id: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // 获取我的商品
  getMyProducts: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('用户未登录')

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // 收藏商品
  favoriteProduct: async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('用户未登录')

    const { error } = await supabase
      .from('favorites')
      .insert({
        user_id: user.id,
        product_id: id
      })

    if (error) throw error

    // 增加商品收藏数
    await supabase.rpc('increment_like_count', { product_id: id })
  },

  // 取消收藏
  unfavoriteProduct: async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('用户未登录')

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', id)

    if (error) throw error

    // 减少商品收藏数
    await supabase.rpc('decrement_like_count', { product_id: id })
  }
}

// 消息相关API
export const supabaseMessageApi = {
  // 获取对话列表
  getConversations: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('用户未登录')

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        products(title),
        buyer:profiles!conversations_buyer_id_fkey(username, avatar_url),
        seller:profiles!conversations_seller_id_fkey(username, avatar_url)
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false })

    if (error) throw error
    return data
  },

  // 获取对话详情
  getConversation: async (id: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles(username, avatar_url)
      `)
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data
  },

  // 发送消息
  sendMessage: async (data: { conversationId: string; content: string }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('用户未登录')

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: data.conversationId,
        sender_id: user.id,
        content: data.content
      })
      .select()
      .single()

    if (error) throw error

    // 更新对话最后消息
    await supabase
      .from('conversations')
      .update({
        last_message: data.content,
        last_message_at: new Date().toISOString()
      })
      .eq('id', data.conversationId)

    return message
  },

  // 创建对话
  createConversation: async (data: { userId: string; productId: string; message: string }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('用户未登录')

    // 检查是否已存在对话
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('product_id', data.productId)
      .eq('buyer_id', user.id)
      .single()

    if (existingConversation) {
      // 发送消息到现有对话
      return await supabaseMessageApi.sendMessage({
        conversationId: existingConversation.id,
        content: data.message
      })
    }

    // 创建新对话
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        product_id: data.productId,
        buyer_id: user.id,
        seller_id: data.userId,
        last_message: data.message,
        last_message_at: new Date().toISOString()
      })
      .select()
      .single()

    if (convError) throw convError

    // 发送第一条消息
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        content: data.message
      })
      .select()
      .single()

    if (msgError) throw msgError

    return { conversation, message }
  }
}

// 文件上传API
export const supabaseUploadApi = {
  // 上传图片
  uploadImage: async (file: File) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `images/${fileName}`

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file)

    if (error) throw error

    // 获取公开URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)

    return { url: publicUrl }
  }
}