// 商品相关类型定义

export interface Product {
  id: string
  title: string
  description: string
  price: number
  originalPrice?: number
  category: string
  images: string[]
  condition: '全新' | '几乎全新' | '轻微使用' | '明显使用'
  sellerId: string
  sellerName: string
  sellerAvatar?: string
  status: 'available' | 'sold' | 'pending'
  location: string
  contactInfo: string
  createdAt: string
  updatedAt: string
  viewCount: number
  likeCount: number
}

export interface ProductForm {
  title: string
  description: string
  price: number
  originalPrice?: number
  category: string
  images: string[]
  condition: '全新' | '几乎全新' | '轻微使用' | '明显使用'
  location: string
  contactInfo: string
}

export interface ProductFilter {
  category?: string
  minPrice?: number
  maxPrice?: number
  condition?: string
  keyword?: string
  sortBy?: 'price_asc' | 'price_desc' | 'date_desc' | 'popular'
}

export interface Category {
  id: string
  name: string
  icon: string
  description: string
}