// 测试Supabase数据库连接和数据状态
import { createClient } from '@supabase/supabase-js'

// 使用环境变量
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fgjmlovomwvgzmdpymmb.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnam1sb3ZvbXd2Z3ptZHB5bW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MDk0NjIsImV4cCI6MjA3NjA4NTQ2Mn0.XOuMrlvrw0UgiGKgUyU8mikH9PFrRCX4tvnrRFmdeOE'

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key:', supabaseAnonKey ? '***' + supabaseAnonKey.slice(-8) : '未设置')

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDatabase() {
  console.log('\n=== 开始测试Supabase数据库 ===')
  
  try {
    // 1. 测试连接
    console.log('1. 测试数据库连接...')
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.error('❌ 认证连接失败:', authError.message)
    } else {
      console.log('✅ 认证连接成功')
    }

    // 2. 测试poems表查询
    console.log('\n2. 测试poems表查询...')
    const { data: poemsData, error: poemsError } = await supabase
      .from('poems')
      .select('*')
      .limit(5)
    
    if (poemsError) {
      console.error('❌ poems表查询失败:', poemsError.message)
      console.log('可能的原因:')
      console.log('- poems表不存在')
      console.log('- RLS策略阻止了查询')
      console.log('- 数据库迁移未执行')
    } else {
      console.log(`✅ poems表查询成功，找到 ${poemsData.length} 条记录`)
      if (poemsData.length > 0) {
        console.log('前5条记录:')
        poemsData.forEach((poem, index) => {
          console.log(`  ${index + 1}. ${poem.title} - ${poem.author} (${poem.dynasty})`)
        })
      } else {
        console.log('⚠️ poems表为空，需要导入示例数据')
      }
    }

    // 3. 测试表结构
    console.log('\n3. 测试表结构...')
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
    
    if (tablesError) {
      console.error('❌ 表结构查询失败:', tablesError.message)
    } else {
      console.log(`✅ 数据库中有 ${tablesData.length} 个表`)
      const tableNames = tablesData.map(t => t.table_name).sort()
      console.log('表列表:', tableNames.join(', '))
      
      // 检查关键表是否存在
      const requiredTables = ['poems', 'profiles', 'favorites', 'comments', 'browse_history']
      const missingTables = requiredTables.filter(table => !tableNames.includes(table))
      
      if (missingTables.length > 0) {
        console.log('❌ 缺少关键表:', missingTables.join(', '))
        console.log('请执行数据库迁移文件')
      } else {
        console.log('✅ 所有关键表都存在')
      }
    }

    // 4. 测试存储过程
    console.log('\n4. 测试存储过程...')
    try {
      const { data: recentData, error: recentError } = await supabase
        .rpc('get_recent_poems', { limit_count: 3 })
      
      if (recentError) {
        console.log('⚠️ 存储过程调用失败（可能未创建）:', recentError.message)
      } else {
        console.log('✅ 存储过程调用成功')
      }
    } catch (procError) {
      console.log('⚠️ 存储过程可能不存在:', procError.message)
    }

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error)
  }
}

// 运行测试
testDatabase().then(() => {
  console.log('\n=== 测试完成 ===')
  console.log('\n建议操作:')
  console.log('1. 在Supabase控制台的SQL编辑器中执行所有迁移文件')
  console.log('2. 确认poems表中有数据')
  console.log('3. 检查RLS策略设置')
  console.log('4. 重新部署Netlify应用')
}).catch(error => {
  console.error('测试失败:', error)
})