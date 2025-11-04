const https = require('https');

const supabaseUrl = 'https://zoknoksbkexongublarl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpva25va3Nia2V4b25ndWJsYXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMTIxODIsImV4cCI6MjA3NjY4ODE4Mn0.5aPDhk9IdhrvIN2P7XIvt7vlCeTIRlJeNwe9_m5GMhY';

function testSupabaseConnection() {
  const url = `${supabaseUrl}/rest/v1/products?select=id,title&limit=3`;
  const options = {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json'
    }
  };

  console.log('正在测试Supabase连接...');
  console.log('URL:', url);

  https.get(url, options, (res) => {
    console.log('状态码:', res.statusCode);
    console.log('状态消息:', res.statusMessage);
    
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        try {
          const products = JSON.parse(data);
          console.log('✅ 数据库连接成功!');
          console.log('找到', products.length, '条商品记录');
          console.log('示例数据:', products);
        } catch (e) {
          console.log('❌ JSON解析错误:', e.message);
          console.log('原始响应:', data);
        }
      } else {
        console.log('❌ API请求失败');
        console.log('响应数据:', data);
      }
    });
  }).on('error', (err) => {
    console.log('❌ 网络连接错误:', err.message);
  });
}

testSupabaseConnection();