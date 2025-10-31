// 详细测试n8n工作流
const testN8nWorkflow = async () => {
  const workflowUrl = 'https://cchencchen0512.app.n8n.cloud/webhook/campus-chat'
  
  console.log('详细测试n8n工作流...')
  console.log('目标URL:', workflowUrl)
  
  // 测试不同的请求格式
  const testCases = [
    {
      name: '标准格式',
      body: {
        message: '你好，我想买一部二手iPhone',
        userId: 'test-user-001',
        sessionId: 'session-test-001'
      }
    },
    {
      name: '带上下文格式',
      body: {
        message: '帮我搜索MacBook电脑',
        userId: 'test-user-002',
        sessionId: 'session-test-002',
        context: {
          pageType: 'product-search',
          userIntent: 'search-product',
          platform: 'campus-marketplace',
          timestamp: new Date().toISOString()
        }
      }
    },
    {
      name: '简化格式',
      body: {
        message: '测试消息'
      }
    }
  ]
  
  for (const testCase of testCases) {
    console.log(`\n📋 测试用例: ${testCase.name}`)
    console.log('📤 请求数据:', JSON.stringify(testCase.body, null, 2))
    
    try {
      const response = await fetch(workflowUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.body)
      })
      
      console.log('📥 响应状态:', response.status, response.statusText)
      
      // 获取响应内容
      const responseText = await response.text()
      
      if (response.ok) {
        try {
          const data = JSON.parse(responseText)
          console.log('✅ 响应数据:', JSON.stringify(data, null, 2))
        } catch (e) {
          console.log('📄 响应内容:', responseText.substring(0, 500))
        }
      } else {
        console.log('❌ 错误详情:', responseText.substring(0, 500))
      }
      
      // 检查响应头
      console.log('📋 响应头:')
      for (const [key, value] of response.headers.entries()) {
        if (key.includes('error') || key.includes('content')) {
          console.log(`   ${key}: ${value}`)
        }
      }
      
    } catch (error) {
      console.log('💥 请求异常:', error.message)
    }
  }
  
  console.log('\n问题诊断建议:')
  console.log('1. 检查n8n工作流是否已激活（绿色激活状态）')
  console.log('2. 确认DeepSeek API密钥在n8n中配置正确')
  console.log('3. 检查工作流中的Customer Service AI Agent节点配置')
  console.log('4. 验证Webhook节点的路径配置')
  console.log('5. 检查n8n工作流的执行日志')
}

// 运行测试
testN8nWorkflow().catch(console.error)