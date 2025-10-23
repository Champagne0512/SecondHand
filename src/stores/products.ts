import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { localDB } from '@/lib/local-db'
import { useUserStore } from '@/stores/user'
import type { Product, ProductForm, ProductFilter } from '@/types/product'

// 商品状态管理store
export const useProductStore = defineStore('products', () => {
  // 状态
  const products = ref<Product[]>([])
  const currentProduct = ref<Product | null>(null)
  const isLoading = ref(false)
  const filter = ref<ProductFilter>({})

  // 计算属性
  const filteredProducts = computed(() => {
    let filtered = products.value
    
    if (filter.value.keyword) {
      const keyword = filter.value.keyword.toLowerCase()
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(keyword) || 
        p.description.toLowerCase().includes(keyword)
      )
    }
    
    if (filter.value.category) {
      filtered = filtered.filter(p => p.category === filter.value.category)
    }
    
    if (filter.value.minPrice !== undefined) {
      filtered = filtered.filter(p => p.price >= filter.value.minPrice!)
    }
    
    if (filter.value.maxPrice !== undefined) {
      filtered = filtered.filter(p => p.price <= filter.value.maxPrice!)
    }
    
    if (filter.value.condition) {
      filtered = filtered.filter(p => p.condition === filter.value.condition)
    }
    
    // 排序
    if (filter.value.sortBy) {
      switch (filter.value.sortBy) {
        case 'price_asc':
          filtered.sort((a, b) => a.price - b.price)
          break
        case 'price_desc':
          filtered.sort((a, b) => b.price - a.price)
          break
        case 'date_desc':
          filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          break
        case 'popular':
          filtered.sort((a, b) => b.viewCount - a.viewCount)
          break
      }
    }
    
    return filtered
  })

  // 获取商品列表
  const fetchProducts = async () => {
    isLoading.value = true
    try {
      // 先获取商品数据
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false })

      if (productsError) {
        console.error('❌ 数据库连接失败，错误详情:', productsError)
        console.warn('⚠️ 使用模拟数据作为后备方案')
        // 使用模拟数据作为后备，但记录错误
        products.value = getMockProducts()
        return
      }

      if (!productsData || productsData.length === 0) {
        console.log('数据库中暂无商品数据，使用模拟数据')
        products.value = getMockProducts()
        return
      }

      // 获取卖家信息
      const sellerIds = [...new Set(productsData.map(p => p.seller_id))]
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', sellerIds)

      if (profilesError) {
        console.warn('获取卖家信息失败:', profilesError)
      }

      // 创建卖家信息映射
      const profilesMap = new Map()
      if (profilesData) {
        profilesData.forEach(profile => {
          profilesMap.set(profile.id, profile)
        })
      }

      // 转换数据格式
      products.value = productsData.map(item => {
        const profile = profilesMap.get(item.seller_id)
        return {
          id: item.id,
          title: item.title,
          description: item.description,
          price: item.price,
          originalPrice: item.original_price,
          category: item.category,
          images: item.images,
          condition: item.condition as any,
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
    } catch (error) {
      console.error('❌ 获取商品列表失败，错误详情:', error)
      console.warn('⚠️ 使用模拟数据作为后备方案')
      products.value = getMockProducts()
    } finally {
      isLoading.value = false
    }
  }

  // 获取商品详情
  const fetchProductDetail = async (id: string) => {
    isLoading.value = true
    try {
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

      currentProduct.value = {
        id: productData.id,
        title: productData.title,
        description: productData.description,
        price: productData.price,
        originalPrice: productData.original_price,
        category: productData.category,
        images: productData.images,
        condition: productData.condition as any,
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
    } catch (error) {
      console.error('获取商品详情失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  // 发布商品
  const publishProduct = async (form: ProductForm) => {
    isLoading.value = true
    try {
      const userStore = useUserStore()
      if (!userStore.user) throw new Error('用户未登录')

      // 上传图片
      const imageUrls: string[] = []
      for (const image of form.images) {
        const fileExt = image.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `product-images/${fileName}`

        // 这里需要将base64或URL转换为File对象，实际项目中需要根据具体实现调整
        // 暂时使用模拟URL
        imageUrls.push(`https://yxrpcnrcptilmqfvfatd.supabase.co/storage/v1/object/public/product-images/${fileName}`)
      }

      const productData = {
        title: form.title,
        description: form.description,
        price: form.price,
        original_price: form.originalPrice,
        category: form.category,
        images: imageUrls,
        condition: form.condition,
        seller_id: userStore.user.id,
        status: 'available' as const,
        location: form.location,
        contact_info: form.contactInfo
      }

      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single()

      if (error) throw error

      // 添加到本地列表
      const newProduct: Product = {
        id: data.id,
        title: data.title,
        description: data.description,
        price: data.price,
        originalPrice: data.original_price,
        category: data.category,
        images: data.images,
        condition: data.condition as any,
        sellerId: data.seller_id,
        sellerName: userStore.user.username,
        sellerAvatar: userStore.user.avatar,
        status: data.status,
        location: data.location,
        contactInfo: data.contact_info,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        viewCount: data.view_count || 0,
        likeCount: data.like_count || 0
      }

      products.value.unshift(newProduct)
      return { success: true, message: '商品发布成功', product: newProduct }
    } catch (error: any) {
      console.error('商品发布失败:', error)
      return { 
        success: false, 
        message: error.message || '商品发布失败' 
      }
    } finally {
      isLoading.value = false
    }
  }

  // 更新筛选条件
  const updateFilter = (newFilter: ProductFilter) => {
    filter.value = { ...filter.value, ...newFilter }
  }

  // 清除筛选条件
  const clearFilter = () => {
    filter.value = {}
  }

  // 模拟商品数据（用于数据库连接失败时的后备方案）
  const getMockProducts = (): Product[] => {
    return [
      {
        id: 'mock-1',
        title: '二手iPhone 13 Pro',
        description: '几乎全新，使用不到3个月，无划痕无磕碰，全套配件齐全',
        price: 4999,
        originalPrice: 7999,
        category: '电子产品',
        images: ['https://via.placeholder.com/300x300?text=iPhone+13+Pro'],
        condition: '几乎全新',
        sellerId: 'mock-seller-1',
        sellerName: '数码达人',
        sellerAvatar: 'https://via.placeholder.com/50x50?text=卖家',
        status: 'available',
        location: '北京市朝阳区',
        contactInfo: '微信：digital_expert',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        viewCount: 128,
        likeCount: 45
      },
      {
        id: 'mock-2',
        title: 'MacBook Pro 14寸 M1 Pro',
        description: '2021款，16GB内存，512GB SSD，电池循环50次，外观完美',
        price: 8999,
        originalPrice: 12999,
        category: '电子产品',
        images: ['https://via.placeholder.com/300x300?text=MacBook+Pro'],
        condition: '轻微使用',
        sellerId: 'mock-seller-2',
        sellerName: '程序员小张',
        sellerAvatar: 'https://via.placeholder.com/50x50?text=卖家',
        status: 'available',
        location: '上海市浦东新区',
        contactInfo: '电话：138****1234',
        createdAt: '2024-01-14T15:30:00Z',
        updatedAt: '2024-01-14T15:30:00Z',
        viewCount: 256,
        likeCount: 89
      },
      {
        id: 'mock-3',
        title: '索尼PS5游戏主机',
        description: '国行版，带2个手柄，10款热门游戏，包装齐全',
        price: 3299,
        originalPrice: 3899,
        category: '游戏设备',
        images: ['https://via.placeholder.com/300x300?text=PS5'],
        condition: '明显使用',
        sellerId: 'mock-seller-3',
        sellerName: '游戏爱好者',
        sellerAvatar: 'https://via.placeholder.com/50x50?text=卖家',
        status: 'available',
        location: '广州市天河区',
        contactInfo: 'QQ：123456789',
        createdAt: '2024-01-13T09:15:00Z',
        updatedAt: '2024-01-13T09:15:00Z',
        viewCount: 189,
        likeCount: 67
      },
      {
        id: 'mock-4',
        title: '佳能EOS R6微单相机',
        description: '专业级微单，快门次数约5000，带24-105mm镜头',
        price: 12999,
        originalPrice: 18999,
        category: '摄影器材',
        images: ['https://via.placeholder.com/300x300?text=佳能+R6'],
        condition: '轻微使用',
        sellerId: 'mock-seller-4',
        sellerName: '摄影大师',
        sellerAvatar: 'https://via.placeholder.com/50x50?text=卖家',
        status: 'available',
        location: '深圳市南山区',
        contactInfo: '邮箱：photo@example.com',
        createdAt: '2024-01-12T14:20:00Z',
        updatedAt: '2024-01-12T14:20:00Z',
        viewCount: 312,
        likeCount: 112
      },
      {
        id: 'mock-5',
        title: 'AirPods Pro 2代',
        description: '无线降噪耳机，使用半年，功能完好，充电盒有轻微划痕',
        price: 1299,
        originalPrice: 1899,
        category: '电子产品',
        images: ['https://via.placeholder.com/300x300?text=AirPods+Pro'],
        condition: '明显使用',
        sellerId: 'mock-seller-5',
        sellerName: '耳机发烧友',
        sellerAvatar: 'https://via.placeholder.com/50x50?text=卖家',
        status: 'available',
        location: '杭州市西湖区',
        contactInfo: '微信：headphone_lover',
        createdAt: '2024-01-11T11:45:00Z',
        updatedAt: '2024-01-11T11:45:00Z',
        viewCount: 156,
        likeCount: 54
      }
    ]
  }

  return {
    products,
    currentProduct,
    isLoading,
    filter,
    filteredProducts,
    fetchProducts,
    fetchProductDetail,
    publishProduct,
    updateFilter,
    clearFilter
  }
})