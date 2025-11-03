// 测试管理员后台数据的脚本
import { createClient } from '@supabase/supabase-js'

// Supabase配置
const supabaseUrl = 'https://zoknoksbkexongublarl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva25va3Nia2V4b25ndWJsYXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMTIxODIsImV4cCI6MjA3NjY4ODE4Mn0.5aPDhk9IdhrvIN2P7XIvt7vlCeTIRlJeNwe9_m5GMhY'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAdminData() {
  console.log('开始测试管理员后台数据...')
  
  try {
    // 1. 检查用户数据
    console.log('\n1. 检查用户数据:')
    const { data: users, error: usersError, count: userCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
    
    if (usersError) {
      console.error('获取用户数据失败:', usersError)
    } else {
      console.log(`总用户数: ${userCount || 0}`)
      console.log('用户数据示例:', users?.slice(0, 2))
    }

    // 2. 检查商品数据
    console.log('\n2. 检查商品数据:')
    const { data: products, error: productsError, count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
    
    if (productsError) {
      console.error('获取商品数据失败:', productsError)
    } else {
      console.log(`总商品数: ${productCount || 0}`)
      console.log('商品数据示例:', products?.slice(0, 2))
    }

    // 3. 检查会话数据
    console.log('\n3. 检查会话数据:')
    const { data: conversations, error: convError, count: convCount } = await supabase
      .from('conversations')
      .select('*', { count: 'exact' })
    
    if (convError) {
      console.error('获取会话数据失败:', convError)
    } else {
      console.log(`总会话数: ${convCount || 0}`)
    }

    // 4. 检查消息数据
    console.log('\n4. 检查消息数据:')
    const { data: messages, error: msgError, count: msgCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })
    
    if (msgError) {
      console.error('获取消息数据失败:', msgError)
    } else {
      console.log(`总消息数: ${msgCount || 0}`)
    }

    // 5. 如果没有数据，创建测试数据
    if ((userCount || 0) === 0) {
      console.log('\n5. 创建测试用户数据...')
      await createTestUsers()
    }

    if ((productCount || 0) === 0) {
      console.log('\n6. 创建测试商品数据...')
      await createTestProducts()
    }

    if ((convCount || 0) === 0) {
      console.log('\n7. 创建测试会话数据...')
      await createTestConversations()
    }

    console.log('\n✅ 测试完成！')
    
  } catch (error) {
    console.error('测试过程中出错:', error)
  }
}

async function createTestUsers() {
  const testUsers = [
    {
      id: 'test-user-1',
      username: '测试用户1',
      email: 'test1@example.com',
      avatar_url: null,
      phone: '13800138000',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'test-user-2', 
      username: '测试用户2',
      email: 'test2@example.com',
      avatar_url: null,
      phone: '13900139000',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'test-user-3',
      username: '测试用户3', 
      email: 'test3@example.com',
      avatar_url: null,
      phone: '13700137000',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]

  for (const user of testUsers) {
    const { error } = await supabase
      .from('profiles')
      .insert(user)
    
    if (error) {
      console.error(`创建用户 ${user.username} 失败:`, error)
    } else {
      console.log(`✅ 创建用户: ${user.username}`)
    }
  }
}

async function createTestProducts() {
  const testProducts = [
    {
      id: 'test-product-1',
      title: '二手iPhone 13',
      description: '九成新，无磕碰，功能正常，配件齐全',
      price: 3500,
      original_price: 5999,
      category: '数码电子',
      images: ['https://example.com/iphone1.jpg', 'https://example.com/iphone2.jpg'],
      condition: '九成新',
      seller_id: 'test-user-1',
      status: 'available',
      location: '北京朝阳区',
      contact_info: '微信: test123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      view_count: 15,
      like_count: 3
    },
    {
      id: 'test-product-2',
      title: '考研数学教材全套',
      description: '李永乐复习全书+张宇1000题+真题解析',
      price: 120,
      original_price: 200,
      category: '教材书籍',
      images: ['https://example.com/math1.jpg'],
      condition: '八成新',
      seller_id: 'test-user-2',
      status: 'available',
      location: '上海浦东新区',
      contact_info: 'QQ: 123456789',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      view_count: 8,
      like_count: 1
    },
    {
      id: 'test-product-3',
      title: '宿舍台灯护眼LED',
      description: '可调节亮度，USB供电，适合宿舍使用',
      price: 35,
      original_price: 60,
      category: '生活用品',
      images: ['https://example.com/lamp1.jpg'],
      condition: '九成新',
      seller_id: 'test-user-3',
      status: 'sold',
      location: '广州天河区',
      contact_info: '电话: 13700137000',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      view_count: 22,
      like_count: 5
    }
  ]

  for (const product of testProducts) {
    const { error } = await supabase
      .from('products')
      .insert(product)
    
    if (error) {
      console.error(`创建商品 ${product.title} 失败:`, error)
    } else {
      console.log(`✅ 创建商品: ${product.title}`)
    }
  }
}

async function createTestConversations() {
  const testConversations = [
    {
      id: 'test-conv-1',
      product_id: 'test-product-1',
      buyer_id: 'test-user-2',
      seller_id: 'test-user-1',
      last_message: '这个iPhone还有保修吗？',
      last_message_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'test-conv-2',
      product_id: 'test-product-2',
      buyer_id: 'test-user-1',
      seller_id: 'test-user-2',
      last_message: '可以便宜点吗？',
      last_message_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]

  for (const conv of testConversations) {
    const { error } = await supabase
      .from('conversations')
      .insert(conv)
    
    if (error) {
      console.error(`创建会话失败:`, error)
    } else {
      console.log(`✅ 创建会话: ${conv.id}`)
    }
  }
}

// 运行测试
testAdminData().then(() => {
  console.log('测试脚本执行完成')
}).catch(console.error)