// 临时本地数据库解决方案
import { ref } from 'vue'

// 本地存储键名
const STORAGE_KEYS = {
  PRODUCTS: 'campus_marketplace_products',
  PROFILES: 'campus_marketplace_profiles',
  FAVORITES: 'campus_marketplace_favorites'
}

// 本地数据库类
export class LocalDatabase {
  private storage: Storage

  constructor() {
    this.storage = localStorage
  }

  // 初始化数据
  initializeData() {
    if (!this.storage.getItem(STORAGE_KEYS.PRODUCTS)) {
      this.storage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.getDefaultProducts()))
    }
    if (!this.storage.getItem(STORAGE_KEYS.PROFILES)) {
      this.storage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(this.getDefaultProfiles()))
    }
    if (!this.storage.getItem(STORAGE_KEYS.FAVORITES)) {
      this.storage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify([]))
    }
  }

  // 获取商品列表
  getProducts() {
    const products = this.storage.getItem(STORAGE_KEYS.PRODUCTS)
    return products ? JSON.parse(products) : []
  }

  // 添加商品
  addProduct(product: any) {
    const products = this.getProducts()
    const newProduct = {
      ...product,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewCount: 0,
      likeCount: 0
    }
    products.push(newProduct)
    this.storage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products))
    return newProduct
  }

  // 更新商品
  updateProduct(id: string, updates: any) {
    const products = this.getProducts()
    const index = products.findIndex((p: any) => p.id === id)
    if (index !== -1) {
      products[index] = {
        ...products[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      this.storage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products))
      return products[index]
    }
    return null
  }

  // 删除商品
  deleteProduct(id: string) {
    const products = this.getProducts()
    const filteredProducts = products.filter((p: any) => p.id !== id)
    this.storage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(filteredProducts))
    return true
  }

  // 获取用户资料
  getProfiles() {
    const profiles = this.storage.getItem(STORAGE_KEYS.PROFILES)
    return profiles ? JSON.parse(profiles) : []
  }

  // 获取单个用户
  getProfile(id: string) {
    const profiles = this.getProfiles()
    return profiles.find((p: any) => p.id === id)
  }

  // 添加用户
  addProfile(profile: any) {
    const profiles = this.getProfiles()
    const newProfile = {
      ...profile,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    profiles.push(newProfile)
    this.storage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles))
    return newProfile
  }

  // 获取收藏
  getFavorites(userId: string) {
    const favorites = this.storage.getItem(STORAGE_KEYS.FAVORITES)
    const allFavorites = favorites ? JSON.parse(favorites) : []
    return allFavorites.filter((f: any) => f.userId === userId)
  }

  // 添加收藏
  addFavorite(userId: string, productId: string) {
    const favorites = this.storage.getItem(STORAGE_KEYS.FAVORITES)
    const allFavorites = favorites ? JSON.parse(favorites) : []
    
    const existing = allFavorites.find((f: any) => f.userId === userId && f.productId === productId)
    if (!existing) {
      allFavorites.push({
        id: this.generateId(),
        userId,
        productId,
        createdAt: new Date().toISOString()
      })
      this.storage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(allFavorites))
      
      // 更新商品收藏数
      this.updateProductLikeCount(productId, 1)
      return true
    }
    return false
  }

  // 删除收藏
  removeFavorite(userId: string, productId: string) {
    const favorites = this.storage.getItem(STORAGE_KEYS.FAVORITES)
    const allFavorites = favorites ? JSON.parse(favorites) : []
    
    const filteredFavorites = allFavorites.filter((f: any) => !(f.userId === userId && f.productId === productId))
    this.storage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(filteredFavorites))
    
    // 更新商品收藏数
    this.updateProductLikeCount(productId, -1)
    return true
  }

  // 更新商品收藏数
  private updateProductLikeCount(productId: string, delta: number) {
    const product = this.getProducts().find((p: any) => p.id === productId)
    if (product) {
      this.updateProduct(productId, {
        likeCount: Math.max(0, (product.likeCount || 0) + delta)
      })
    }
  }

  // 生成唯一ID
  private generateId(): string {
    return 'local-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
  }

  // 默认商品数据
  private getDefaultProducts() {
    return [
      {
        id: 'local-prod-1',
        title: '二手MacBook Air M2',
        description: '2022款，8GB内存，256GB SSD，使用半年，外观完美，电池健康度95%',
        price: 6999,
        originalPrice: 8999,
        category: '电子产品',
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400'],
        condition: '轻微使用',
        sellerId: 'local-user-1',
        sellerName: '张同学',
        sellerAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=100',
        status: 'available',
        location: '北京市海淀区',
        contactInfo: '微信：zhang_student',
        createdAt: '2024-01-20T10:00:00Z',
        updatedAt: '2024-01-20T10:00:00Z',
        viewCount: 25,
        likeCount: 8
      },
      {
        id: 'local-prod-2',
        title: '高等数学教材（第七版）',
        description: '同济大学出版社，上下册全套，有少量笔记，无破损',
        price: 45,
        originalPrice: 68,
        category: '书籍教材',
        images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'],
        condition: '明显使用',
        sellerId: 'local-user-2',
        sellerName: '李学霸',
        sellerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
        status: 'available',
        location: '上海市浦东新区',
        contactInfo: '电话：138****5678',
        createdAt: '2024-01-19T14:30:00Z',
        updatedAt: '2024-01-19T14:30:00Z',
        viewCount: 18,
        likeCount: 3
      },
      {
        id: 'local-prod-3',
        title: '索尼WH-1000XM4降噪耳机',
        description: '主动降噪，音质出色，使用一年，功能完好，配件齐全',
        price: 1599,
        originalPrice: 2299,
        category: '电子产品',
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'],
        condition: '明显使用',
        sellerId: 'local-user-3',
        sellerName: '音乐爱好者',
        sellerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
        status: 'available',
        location: '广州市天河区',
        contactInfo: 'QQ：music_lover',
        createdAt: '2024-01-18T09:15:00Z',
        updatedAt: '2024-01-18T09:15:00Z',
        viewCount: 32,
        likeCount: 12
      },
      {
        id: 'local-prod-4',
        title: '宿舍小冰箱',
        description: '50L容量，节能环保，适合宿舍使用，运行安静，外观良好',
        price: 299,
        originalPrice: 450,
        category: '生活用品',
        images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'],
        condition: '轻微使用',
        sellerId: 'local-user-4',
        sellerName: '王同学',
        sellerAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
        status: 'available',
        location: '深圳市南山区',
        contactInfo: '微信：fridge_seller',
        createdAt: '2024-01-17T16:20:00Z',
        updatedAt: '2024-01-17T16:20:00Z',
        viewCount: 15,
        likeCount: 5
      }
    ]
  }

  // 默认用户数据
  private getDefaultProfiles() {
    return [
      {
        id: 'local-user-1',
        username: '张同学',
        email: 'zhang@student.com',
        avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=100',
        phone: '138****1234',
        createdAt: '2024-01-20T10:00:00Z',
        updatedAt: '2024-01-20T10:00:00Z'
      },
      {
        id: 'local-user-2',
        username: '李学霸',
        email: 'li@student.com',
        avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
        phone: '138****5678',
        createdAt: '2024-01-19T14:30:00Z',
        updatedAt: '2024-01-19T14:30:00Z'
      },
      {
        id: 'local-user-3',
        username: '音乐爱好者',
        email: 'music@student.com',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
        phone: '138****9012',
        createdAt: '2024-01-18T09:15:00Z',
        updatedAt: '2024-01-18T09:15:00Z'
      },
      {
        id: 'local-user-4',
        username: '王同学',
        email: 'wang@student.com',
        avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
        phone: '138****3456',
        createdAt: '2024-01-17T16:20:00Z',
        updatedAt: '2024-01-17T16:20:00Z'
      }
    ]
  }
}

// 创建本地数据库实例
export const localDB = new LocalDatabase()

// 初始化数据
localDB.initializeData()