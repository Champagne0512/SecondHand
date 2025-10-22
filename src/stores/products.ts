import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
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
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          profiles:profiles(username, avatar_url)
        `)
        .eq('status', 'available')
        .order('created_at', { ascending: false })

      if (error) throw error

      // 转换数据格式
      products.value = data.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        price: item.price,
        originalPrice: item.original_price,
        category: item.category,
        images: item.images,
        condition: item.condition as any,
        sellerId: item.seller_id,
        sellerName: item.profiles?.username || '未知用户',
        sellerAvatar: item.profiles?.avatar_url,
        status: item.status,
        location: item.location,
        contactInfo: item.contact_info,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        viewCount: item.view_count || 0,
        likeCount: item.like_count || 0
      }))
    } catch (error) {
      console.error('获取商品列表失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  // 获取商品详情
  const fetchProductDetail = async (id: string) => {
    isLoading.value = true
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          profiles:profiles(username, avatar_url)
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      // 增加浏览量
      await supabase
        .from('products')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', id)

      currentProduct.value = {
        id: data.id,
        title: data.title,
        description: data.description,
        price: data.price,
        originalPrice: data.original_price,
        category: data.category,
        images: data.images,
        condition: data.condition as any,
        sellerId: data.seller_id,
        sellerName: data.profiles?.username || '未知用户',
        sellerAvatar: data.profiles?.avatar_url,
        status: data.status,
        location: data.location,
        contactInfo: data.contact_info,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        viewCount: (data.view_count || 0) + 1,
        likeCount: data.like_count || 0
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