import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { supabaseProductApi } from '@/api/supabase'
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
      console.log('正在获取商品详情，ID:', id)
      
      // 获取商品数据
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (productError) {
        console.error('获取商品数据失败:', productError)
        throw new Error(`商品不存在: ${productError.message}`)
      }

      if (!productData) {
        throw new Error('商品数据为空')
      }

      console.log('获取到商品数据:', productData)

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
      try {
        await supabase
          .from('products')
          .update({ view_count: (productData.view_count || 0) + 1 })
          .eq('id', id)
      } catch (viewError) {
        console.warn('增加浏览量失败:', viewError)
      }

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

      console.log('商品详情设置成功:', currentProduct.value)
    } catch (error) {
      console.error('获取商品详情失败:', error)
      currentProduct.value = null
      // 可以在这里添加更详细的错误处理，比如显示错误消息
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

      console.log('开始发布商品，表单数据:', form)

      // 上传图片到Supabase存储
      const imageUrls: string[] = []
      
      if (form.images && form.images.length > 0) {
        for (let i = 0; i < form.images.length; i++) {
          const imageFile = form.images[i]
          console.log(`处理图片 ${i + 1}:`, imageFile)
          
          try {
            let fileName: string
            let fileData: File | Blob
            
            if (imageFile instanceof File) {
              // 如果是File对象，直接使用
              fileName = `${Date.now()}_${i}_${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
              fileData = imageFile
            } else if (typeof imageFile === 'string' && imageFile.startsWith('data:')) {
              // 如果是base64数据URL，转换为Blob
              const response = await fetch(imageFile)
              const blob = await response.blob()
              fileName = `${Date.now()}_${i}.jpg`
              fileData = blob
            } else {
              console.warn(`跳过不支持的图片格式: ${typeof imageFile}`)
              continue
            }
            
            const filePath = `product-images/${userStore.user.id}/${fileName}`
            
            console.log(`上传图片到: ${filePath}`)
            
            // 检查存储桶是否存在，如果不存在则创建
            try {
              const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
              if (bucketsError) {
                console.warn('获取存储桶列表失败:', bucketsError)
              }
              
              const productImagesBucket = buckets?.find(b => b.name === 'product-images')
              if (!productImagesBucket) {
                console.warn('product-images存储桶不存在，将尝试创建')
                // 这里可以添加创建存储桶的逻辑，但需要管理员权限
              }
            } catch (bucketError) {
              console.warn('存储桶检查失败:', bucketError)
            }
            
            // 上传到Supabase存储
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('product-images')
              .upload(filePath, fileData, {
                cacheControl: '3600',
                upsert: false
              })

            if (uploadError) {
              console.error(`图片 ${i + 1} 上传失败:`, uploadError)
              
              // 如果存储桶不存在，使用备用方案：将图片转换为base64存储在数据库中
              if (uploadError.message.includes('bucket') || uploadError.message.includes('not found')) {
                console.warn('存储桶不存在，使用base64存储方案')
                if (imageFile instanceof File) {
                  const reader = new FileReader()
                  const base64Promise = new Promise<string>((resolve) => {
                    reader.onload = () => resolve(reader.result as string)
                    reader.readAsDataURL(imageFile)
                  })
                  const base64Data = await base64Promise
                  imageUrls.push(base64Data)
                } else {
                  imageUrls.push(imageFile as string)
                }
                continue
              }
              
              throw new Error(`图片上传失败: ${uploadError.message}`)
            }

            // 获取公开URL
            const { data: { publicUrl } } = supabase.storage
              .from('product-images')
              .getPublicUrl(filePath)

            console.log(`图片 ${i + 1} 公开URL:`, publicUrl)
            imageUrls.push(publicUrl)
            
          } catch (imageError) {
            console.error(`处理图片 ${i + 1} 失败:`, imageError)
            // 继续处理下一张图片，而不是失败整个发布
            continue
          }
        }
      }

      // 如果没有图片上传成功，使用默认图片
      if (imageUrls.length === 0) {
        console.warn('没有图片上传成功，使用默认图片')
        imageUrls.push('/src/assets/default-product.jpg')
      }

      console.log('所有图片URL:', imageUrls)

      const productData = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        original_price: form.originalPrice ? Number(form.originalPrice) : null,
        category: form.category,
        images: imageUrls,
        condition: form.condition,
        seller_id: userStore.user.id,
        status: 'available' as const,
        location: form.location.trim(),
        contact_info: form.contactInfo.trim()
      }

      console.log('准备插入商品数据:', productData)

      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single()

      if (error) {
        console.error('商品数据插入失败:', error)
        throw error
      }

      console.log('商品数据插入成功:', data)

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
      console.log('商品发布完成，新商品:', newProduct)
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

  // 更新商品
  const updateProduct = async (id: string, data: any) => {
    isLoading.value = true
    try {
      const userStore = useUserStore()
      if (!userStore.user) throw new Error('用户未登录')

      console.log('开始更新商品，ID:', id, '数据:', data)

      // 检查权限：只能更新自己的商品
      const product = products.value.find(p => p.id === id)
      if (!product) throw new Error('商品不存在')
      if (product.sellerId !== userStore.user.id) throw new Error('无权修改此商品')

      // 处理图片上传
      let finalImageUrls: string[] = []
      
      if (data.images && data.images.length > 0) {
        // 处理新上传的图片
        for (let i = 0; i < data.images.length; i++) {
          const imageFile = data.images[i]
          
          if (typeof imageFile === 'string') {
            // 如果是字符串（已存在的图片URL），直接使用
            finalImageUrls.push(imageFile)
          } else if (imageFile instanceof File) {
            // 如果是新上传的文件，需要上传到Supabase
            try {
              const fileName = `${Date.now()}_${i}_${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
              const filePath = `product-images/${userStore.user.id}/${fileName}`
              
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(filePath, imageFile, {
                  cacheControl: '3600',
                  upsert: false
                })

              if (uploadError) {
                console.error(`图片上传失败:`, uploadError)
                continue
              }

              const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath)

              finalImageUrls.push(publicUrl)
            } catch (imageError) {
              console.error(`处理图片失败:`, imageError)
              continue
            }
          }
        }
      } else {
        // 如果没有新图片，使用原有图片
        finalImageUrls = product.images || []
      }

      // 准备更新数据（将驼峰字段转换为下划线字段）
      const updateData = {
        title: data.title,
        description: data.description,
        price: data.price,
        original_price: data.originalPrice,
        category: data.category,
        condition: data.condition,
        location: data.location,
        contact_info: data.contactInfo,
        images: finalImageUrls
      }

      console.log('准备更新商品数据:', updateData)

      // 直接使用Supabase更新商品
      const { data: updatedProduct, error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        console.error('商品更新失败:', updateError)
        throw updateError
      }

      console.log('商品更新成功:', updatedProduct)

      // 更新本地状态
      const index = products.value.findIndex(p => p.id === id)
      if (index !== -1) {
        products.value[index] = {
          ...products.value[index],
          title: updatedProduct.title,
          description: updatedProduct.description,
          price: updatedProduct.price,
          originalPrice: updatedProduct.original_price,
          category: updatedProduct.category,
          images: updatedProduct.images,
          condition: updatedProduct.condition,
          location: updatedProduct.location,
          contactInfo: updatedProduct.contact_info,
          updatedAt: updatedProduct.updated_at,
          sellerName: userStore.user.username,
          sellerAvatar: userStore.user.avatar
        }
      }

      // 更新当前商品详情
      if (currentProduct.value && currentProduct.value.id === id) {
        currentProduct.value = {
          ...currentProduct.value,
          ...products.value[index]
        }
      }

      return { success: true, message: '商品更新成功', product: products.value[index] }
    } catch (error: any) {
      console.error('商品更新失败:', error)
      return { 
        success: false, 
        message: error.message || '商品更新失败' 
      }
    } finally {
      isLoading.value = false
    }
  }

  // 删除商品
  const deleteProduct = async (id: string) => {
    isLoading.value = true
    try {
      const userStore = useUserStore()
      if (!userStore.user) throw new Error('用户未登录')

      console.log('开始删除商品，ID:', id)

      // 检查权限：只能删除自己的商品
      const product = products.value.find(p => p.id === id)
      if (!product) throw new Error('商品不存在')
      if (product.sellerId !== userStore.user.id) throw new Error('无权删除此商品')

      // 调用API删除商品
      await supabaseProductApi.deleteProduct(id)
      
      console.log('商品删除成功')

      // 从本地状态中移除
      products.value = products.value.filter(p => p.id !== id)

      return { success: true, message: '商品删除成功' }
    } catch (error: any) {
      console.error('商品删除失败:', error)
      return { 
        success: false, 
        message: error.message || '商品删除失败' 
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
    updateProduct,
    deleteProduct,
    updateFilter,
    clearFilter
  }
})