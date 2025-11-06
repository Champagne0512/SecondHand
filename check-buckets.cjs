const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zoknoksbkexongublarl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva25va3Nia2V4b25ndWJsYXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMTIxODIsImV4cCI6MjA3NjY4ODE4Mn0.5aPDhk9IdhrvIN2P7XIvt7vlCeTIRlJeNwe9_m5GMhY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkBuckets() {
  try {
    console.log('正在检查存储桶状态...\n');
    
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      console.log('❌ 检查存储桶时出错:', error.message);
      return;
    }
    
    console.log('📦 当前存在的存储桶:');
    if (buckets && buckets.length > 0) {
      buckets.forEach(bucket => {
        console.log(`   - ${bucket.name} (ID: ${bucket.id})`);
      });
    } else {
      console.log('   没有找到存储桶');
    }
    
    // 检查campus-posts是否存在
    const campusPostsExists = buckets && buckets.some(b => b.id === 'campus-posts');
    console.log('\n🔍 campus-posts存储桶状态:', campusPostsExists ? '✅ 已存在' : '❌ 不存在');
    
    if (!campusPostsExists) {
      console.log('\n📋 需要创建campus-posts存储桶，请使用方法1或2进行创建。');
    }
    
  } catch (err) {
    console.log('❌ 检查存储桶失败:', err.message);
  }
}

checkBuckets();