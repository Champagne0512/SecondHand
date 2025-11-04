// 测试评论加载脚本
import { createClient } from '@supabase/supabase-js'

// 从环境变量读取配置
const supabaseUrl = 'https://zoknoksbkexongublarl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva25va3Nia2V4b25ndWJsYXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMTIxODIsImV4cCI6MjA3NjY4ODE4Mn0.5aPDhk9IdhrvIN2P7XIvt7vlCeTIRlJeNwe9_m5GMhY'

console.log('测试评论加载功能...')

// 创建客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testComments() {
  try {
    console.log('1. 获取所有校园动态...')
    const { data: posts, error: postsError } = await supabase
      .from('campus_posts')
      .select('*')
      .limit(5)
    
    if (postsError) {
      console.error('❌ 获取动态失败:', postsError.message)
      return
    }
    
    console.log(`✅ 获取到 ${posts?.length || 0} 条动态`)
    
    if (posts && posts.length > 0) {
      const postId = posts[0].id
      console.log(`\n2. 测试动态 ${postId} 的评论...`)
      
      // 测试评论加载
      const { data: comments, error: commentsError } = await supabase
        .from('post_comments')
        .select(`
          *,
          profiles!post_comments_user_id_fkey(username, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false })
      
      if (commentsError) {
        console.error('❌ 加载评论失败:', commentsError.message)
        console.log('错误详情:', commentsError)
      } else {
        console.log(`✅ 加载评论成功，共 ${comments?.length || 0} 条评论`)
        
        if (comments && comments.length > 0) {
          console.log('\n评论详情:')
          comments.forEach((comment, index) => {
            console.log(`\n评论 ${index + 1}:`)
            console.log('  ID:', comment.id)
            console.log('  内容:', comment.content)
            console.log('  用户ID:', comment.user_id)
            console.log('  用户名:', comment.profiles?.username || '未获取到')
            console.log('  头像:', comment.profiles?.avatar_url || '默认头像')
            console.log('  点赞数:', comment.likes)
            console.log('  创建时间:', comment.created_at)
          })
        } else {
          console.log('⚠️ 该动态暂无评论')
        }
      }
    }
    
    // 测试直接查询评论表
    console.log('\n3. 直接查询评论表...')
    const { data: allComments, error: allCommentsError } = await supabase
      .from('post_comments')
      .select('*')
      .limit(10)
    
    if (allCommentsError) {
      console.error('❌ 查询评论表失败:', allCommentsError.message)
    } else {
      console.log(`✅ 评论表共有 ${allComments?.length || 0} 条记录`)
      
      if (allComments && allComments.length > 0) {
        console.log('\n评论表记录示例:')
        allComments.slice(0, 3).forEach((comment, index) => {
          console.log(`\n记录 ${index + 1}:`)
          console.log('  ID:', comment.id)
          console.log('  内容:', comment.content)
          console.log('  动态ID:', comment.post_id)
          console.log('  用户ID:', comment.user_id)
          console.log('  创建时间:', comment.created_at)
        })
      }
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出现异常:', error)
  }
}

testComments().then(() => {
  console.log('\n🎉 评论加载测试完成!')
})