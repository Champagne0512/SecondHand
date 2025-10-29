// 测试DeepSeek API连接
const testDeepSeekAPI = async () => {
  console.log('🔍 测试DeepSeek API连接...')
  
  // DeepSeek API端点
  const apiUrl = 'https://api.deepseek.com/v1/chat/completions'
  
  // 测试请求数据
  const testData = {
    model: 'deepseek-chat',
    messages: [
      {
        role: 'user',
        content: '你好，请简单介绍一下你自己'
      }
    ],
    max_tokens: 100,
    temperature: 0.7
  }
  
  console.log('📤 测试请求:', JSON.stringify(testData, null, 2))
  
  try {
    // 注意：这里需要真实的API密钥
    // 在实际使用时，应该从环境变量或安全存储中获取
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_DEEPSEEK_API_KEY' // 需要替换为真实密钥
      },
      body: JSON.stringify(testData)
    })
    
    console.log('📥 响应状态:', response.status, response.statusText)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ API连接成功:', JSON.stringify(data, null, 2))
    } else {
      const errorText = await response.text()
      console.log('❌ API连接失败:', errorText)
    }
    
  } catch (error) {
    console.error('💥 请求失败:', error.message)
  }
}

// 运行测试
testDeepSeekAPI().catch(console.error)