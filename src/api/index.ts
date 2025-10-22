// API接口配置
import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加认证token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    // 统一错误处理
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // 未授权，清除token并跳转到登录页
          localStorage.removeItem('token')
          window.location.href = '/login'
          break
        case 403:
          ElMessage.error('权限不足')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(data?.message || '请求失败')
      }
    } else if (error.request) {
      ElMessage.error('网络错误，请检查网络连接')
    } else {
      ElMessage.error('请求配置错误')
    }
    
    return Promise.reject(error)
  }
)

// 用户相关API
export const userApi = {
  // 用户登录
  login: (data: { username: string; password: string }) => 
    api.post('/auth/login', data),
  
  // 用户注册
  register: (data: { username: string; email: string; password: string; phone?: string }) => 
    api.post('/auth/register', data),
  
  // 获取用户信息
  getProfile: () => 
    api.get('/user/profile'),
  
  // 更新用户信息
  updateProfile: (data: any) => 
    api.put('/user/profile', data),
  
  // 退出登录
  logout: () => 
    api.post('/auth/logout')
}

// 商品相关API
export const productApi = {
  // 获取商品列表
  getProducts: (params?: { category?: string; keyword?: string; page?: number; limit?: number }) => 
    api.get('/products', { params }),
  
  // 获取商品详情
  getProduct: (id: number) => 
    api.get(`/products/${id}`),
  
  // 发布商品
  createProduct: (data: FormData) => 
    api.post('/products', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  // 更新商品
  updateProduct: (id: number, data: any) => 
    api.put(`/products/${id}`, data),
  
  // 删除商品
  deleteProduct: (id: number) => 
    api.delete(`/products/${id}`),
  
  // 获取我的商品
  getMyProducts: () => 
    api.get('/user/products'),
  
  // 收藏商品
  favoriteProduct: (id: number) => 
    api.post(`/products/${id}/favorite`),
  
  // 取消收藏
  unfavoriteProduct: (id: number) => 
    api.delete(`/products/${id}/favorite`)
}

// 消息相关API
export const messageApi = {
  // 获取对话列表
  getConversations: () => 
    api.get('/messages/conversations'),
  
  // 获取对话详情
  getConversation: (id: number) => 
    api.get(`/messages/conversations/${id}`),
  
  // 发送消息
  sendMessage: (data: { conversationId: number; content: string }) => 
    api.post('/messages', data),
  
  // 创建对话
  createConversation: (data: { userId: number; productId: number; message: string }) => 
    api.post('/messages/conversations', data),
  
  // 删除对话
  deleteConversation: (id: number) => 
    api.delete(`/messages/conversations/${id}`),
  
  // 标记消息为已读
  markAsRead: (conversationId: number) => 
    api.put(`/messages/conversations/${conversationId}/read`)
}

// 文件上传API
export const uploadApi = {
  // 上传图片
  uploadImage: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  // 上传多个图片
  uploadImages: (files: File[]) => {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    return api.post('/upload/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

export default api