// 测试n8n工作流与AI模型的集成
const testN8nDeepSeek = async () => {
  const workflowUrl = 'https://cchencchen0512.app.n8n.cloud/webhook/02baeca7-10b5-4800-a9e4-7a85c857c10e/chat'
  
  console.log('测试n8n工作流与AI模型...')
  console.log('工作流URL:', workflowUrl)
  
  // 测试不同的请求格式
  const testCases = [
    {
      name: '简单消息测试',
      body: { message: '你好，请介绍一下你自己' }
    },
    {
      name: '完整格式测试',
      body: {
        message: '你好，请介绍一下你自己',
        userId: 'test-user-123',
        sessionId: 'test-session-456',
        context: {
          pageType: 'general',
          userIntent: 'general-chat',
          platform: 'campus-marketplace',
          timestamp: new Date().toISOString()
        }
      }
    },
    {
      name: '最小格式测试',
      body: { message: 'Hello' }
    }
  ]
  
  for (const testCase of testCases) {
    console.log(`\n📋 测试用例: ${testCase.name}`)
    console.log('📤 请求体:', JSON.stringify(testCase.body, null, 2))
    
    try {
      const response = await fetch(workflowUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.body)
      })
      
      console.log('响应状态:', response.status, response.statusText)
      
      if (response.ok) {
        const data = await response.json()
        console.log('响应数据:', JSON.stringify(data, null, 2))
      } else {
        // 尝试获取错误详情
        const errorText = await response.text()
        console.log('错误响应:', errorText)
        
        // 检查响应头
        console.log('响应头:', Object.fromEntries(response.headers.entries()))
      }
    } catch (error) {
      console.error('请求失败:', error.message)
    }
  }
}

// 运行测试
testN8nDeepSeek().catch(console.error)