const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zoknoksbkexongublarl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva25va3Nia2V4b25ndWJsYXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMTIxODIsImV4cCI6MjA3NjY4ODE4Mn0.5aPDhk9IdhrvIN2P7XIvt7vlCeTIRlJeNwe9_m5GMhY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugStorage() {
  console.log('🔍 开始调试存储桶问题...\n');
  
  // 1. 检查所有存储桶
  console.log('1. 检查所有存储桶:');
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      console.log('❌ 获取存储桶列表失败:', error.message);
      console.log('错误详情:', error);
    } else {
      console.log('✅ 获取存储桶列表成功');
      if (buckets && buckets.length > 0) {
        console.log('当前存储桶:');
        buckets.forEach(bucket => {
          console.log(`   - ${bucket.name} (ID: ${bucket.id}, 公开: ${bucket.public})`);
        });
      } else {
        console.log('⚠️  没有找到任何存储桶');
      }
    }
  } catch (err) {
    console.log('❌ 检查存储桶列表异常:', err.message);
  }
  
  console.log('\n2. 单独检查campus-posts存储桶:');
  // 2. 单独检查campus-posts
  try {
    const { data, error } = await supabase.storage.getBucket('campus-posts');
    if (error) {
      console.log('❌ campus-posts存储桶检查失败:', error.message);
      console.log('错误代码:', error.code);
      console.log('错误详情:', error);
    } else {
      console.log('✅ campus-posts存储桶存在:');
      console.log('   - 名称:', data.name);
      console.log('   - ID:', data.id);
      console.log('   - 公开:', data.public);
    }
  } catch (err) {
    console.log('❌ 检查campus-posts异常:', err.message);
  }
  
  console.log('\n3. 检查备用存储桶:');
  // 3. 检查备用存储桶
  const backupBuckets = ['product-images', 'user-avatars'];
  for (const bucket of backupBuckets) {
    try {
      const { data, error } = await supabase.storage.getBucket(bucket);
      if (error) {
        console.log(`❌ ${bucket} 存储桶检查失败:`, error.message);
      } else {
        console.log(`✅ ${bucket} 存储桶存在 (公开: ${data.public})`);
      }
    } catch (err) {
      console.log(`❌ 检查${bucket}异常:`, err.message);
    }
  }
  
  console.log('\n4. 测试上传权限:');
  // 4. 测试上传权限
  try {
    const testFileName = `test-${Date.now()}.txt`;
    const testContent = 'test content';
    
    // 先尝试campus-posts
    const { error: uploadError } = await supabase.storage
      .from('campus-posts')
      .upload(testFileName, testContent);
      
    if (uploadError) {
      console.log('❌ campus-posts上传测试失败:', uploadError.message);
      console.log('错误代码:', uploadError.code);
    } else {
      console.log('✅ campus-posts上传测试成功');
    }
  } catch (err) {
    console.log('❌ 上传测试异常:', err.message);
  }
  
  console.log('\n📋 诊断完成');
}

debugStorage();