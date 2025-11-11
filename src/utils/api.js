// API工具函数
export class ApiClient {
  constructor(baseURL = '') {
    this.baseURL = baseURL
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' })
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' })
  }
}

// 诗词相关API
export const poemAPI = {
  // 获取诗词列表
  async getPoems(params = {}) {
    // 模拟API调用
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockPoems = [
          {
            id: 1,
            title: '静夜思',
            author: '李白',
            dynasty: '唐代',
            content: '床前明月光，疑是地上霜。\n举头望明月，低头思故乡。'
          }
        ]
        resolve(mockPoems)
      }, 500)
    })
  },

  // 获取诗词详情
  async getPoemDetail(id) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const poem = {
          id: parseInt(id),
          title: '静夜思',
          author: '李白',
          dynasty: '唐代',
          content: '床前明月光，疑是地上霜。\n举头望明月，低头思故乡。',
          analysis: '这首诗通过描绘月夜思乡的场景...',
          tags: ['思乡', '月亮']
        }
        resolve(poem)
      }, 300)
    })
  },

  // 搜索诗词
  async searchPoems(query) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const results = query ? [
          {
            id: 1,
            title: '静夜思',
            author: '李白',
            dynasty: '唐代',
            excerpt: '床前明月光，疑是地上霜...'
          }
        ] : []
        resolve(results)
      }, 400)
    })
  }
}

// 用户相关API
export const userAPI = {
  // 用户登录
  async login(credentials) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (credentials.username && credentials.password) {
          resolve({
            id: 1,
            username: credentials.username,
            name: '诗词爱好者',
            token: 'mock-jwt-token'
          })
        } else {
          reject(new Error('用户名或密码错误'))
        }
      }, 500)
    })
  },

  // 获取用户信息
  async getUserProfile() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: 1,
          name: '诗词爱好者',
          avatar: '/api/placeholder/avatar/80',
          bio: '热爱中国古典诗词'
        })
      }, 300)
    })
  },

  // 获取用户收藏
  async getUserCollections() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: 1, poemId: 1, title: '静夜思', author: '李白', dynasty: '唐代' }
        ])
      }, 400)
    })
  }
}

// 工具函数
export const API = {
  // 生成模拟延迟
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  },

  // 模拟错误
  simulateError(chance = 0.1) {
    if (Math.random() < chance) {
      throw new Error('模拟API错误')
    }
  },

  // 格式化错误信息
  formatError(error) {
    return {
      message: error.message,
      timestamp: new Date().toISOString(),
      code: error.code || 'UNKNOWN_ERROR'
    }
  }
}

export default new ApiClient()