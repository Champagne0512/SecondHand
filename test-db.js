// 测试数据库连接和查询
import { createClient } from '@supabase/supabase-js'

// 创建Supabase客户端
const supabase = createClient(
  'https://zoknoksbkexongublarl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva25va3Nia2V4b25ndWJsYXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMTIxODIsImV4cCI6MjA3NjY4ODE4Mn0.5aPDhk9IdhrvIN2P7XIvt7vlCeTIRlJeNwe9_m5GMhY',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
)

async function testDatabase() {
  console.log('开始测试数据库连接...')
  
  try {
    // 测试连接
    const { data: connectionData, error: connectionError } = await supabase.auth.getSession()
    if (connectionError) {
      console.error('数据库连接失败:', connectionError)
      return
    }
    console.log('✅ 数据库连接成功')

    // 测试查询profiles表
    console.log('\n测试查询profiles表...')
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5)

    if (profilesError) {
      console.error('查询profiles表失败:', profilesError)
    } else {
      console.log('✅ profiles表查询成功，找到', profilesData.length, '条记录')
      console.log('示例数据:', profilesData.slice(0, 2))
    }

    // 测试查询products表
    console.log('\n测试查询products表...')
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'available')
      .limit(5)

    if (productsError) {
      console.error('查询products表失败:', productsError)
    } else {
      console.log('✅ products表查询成功，找到', productsData.length, '条记录')
      if (productsData.length > 0) {
        console.log('示例商品:')
        productsData.forEach((product, index) => {
          console.log(`${index + 1}. ${product.title} - ¥${product.price}`)
        })
      }
    }

    // 测试关联查询
    console.log('\n测试关联查询...')
    if (productsData && productsData.length > 0) {
      const sellerIds = [...new Set(productsData.map(p => p.seller_id))]
      const { data: sellersData, error: sellersError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', sellerIds)

      if (sellersError) {
        console.error('关联查询失败:', sellersError)
      } else {
        console.log('✅ 关联查询成功，找到', sellersData.length, '个卖家')
      }
    }

  } catch (error) {
    console.error('测试过程中发生错误:', error)
  }
}

// 运行测试
testDatabase()