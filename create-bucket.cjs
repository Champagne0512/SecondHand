const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zoknoksbkexongublarl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva25va3Nia2V4b25ndWJsYXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMTIxODIsImV4cCI6MjA3NjY4ODE4Mn0.5aPDhk9IdhrvIN2P7XIvt7vlCeTIRlJeNwe9_m5GMhY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createBucket() {
  console.log('🚀 尝试创建campus-posts存储桶...\n');
  
  try {
    // 尝试创建存储桶
    const { data, error } = await supabase.storage.createBucket('campus-posts', {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['image/*']
    });
    
    if (error) {
      console.log('❌ 创建存储桶失败:', error.message);
      console.log('错误详情:', error);
      
      if (error.message.includes('permission') || error.message.includes('unauthorized')) {
        console.log('\n⚠️  权限不足，无法通过API创建存储桶');
        console.log('请通过Supabase Dashboard手动创建存储桶:');
        console.log('1. 访问 https://supabase.com/dashboard');
        console.log('2. 选择项目 zoknoksbkexongublarl');
        console.log('3. 进入 Storage → Buckets');
        console.log('4. 点击 New Bucket');
        console.log('5. 名称: campus-posts, 公开: Yes');
        console.log('6. 点击 Create Bucket');
      }
    } else {
      console.log('✅ 存储桶创建成功:', data);
      console.log('\n📋 存储桶信息:');
      console.log('- 名称: campus-posts');
      console.log('- 公开: 是');
      console.log('- 文件大小限制: 50MB');
      console.log('- 允许的文件类型: 图片文件');
    }
  } catch (err) {
    console.log('❌ 创建存储桶异常:', err.message);
  }
}

createBucket();