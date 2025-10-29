// 诊断n8n工作流500错误
const testN8nWorkflow = async () => {
  const workflowUrl = 'https://cchencchen0512.app.n8n.cloud/webhook/campus-chat'
  
  console.log('🔍 诊断n8n工作流500错误...')
  console.log('📤 目标URL:', workflowUrl)
  
  // 测试1: 简单连接测试
  try {
    console.log('\n1️⃣ 测试简单连接...')
    const response = await fetch(workflowUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: '你好，测试连接',
        userId: 'test-user-001',
        sessionId: 'test-session-001'
      })
    })
    
    console.log('📥 响应状态:', response.status, response.statusText)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ 连接成功！响应数据:', JSON.stringify(data, null, 2))
    } else {
      console.log('❌ 连接失败，状态码:', response.status)
      const errorText = await response.text()
      console.log('📄 错误详情:', errorText)
    }
  } catch (error) {
    console.log('❌ 连接异常:', error.message)
  }
  
  // 测试2: 检查工作流配置
  console.log('\n2️⃣ 分析工作流配置...')
  console.log('📋 Webhook路径: campus-chat')
  console.log('🔗 完整URL:', workflowUrl)
  console.log('💡 建议检查n8n工作流中的节点配置是否正确')
  
  // 测试3: 检查可能的CORS问题
  console.log('\n3️⃣ 检查CORS配置...')
  console.log('🌐 如果浏览器控制台有CORS错误，需要配置n8n的CORS设置')
  
  // 测试4: 检查请求格式
  console.log('\n4️⃣ 建议的请求格式:')
  console.log(JSON.stringify({
    message: '用户消息',
    userId: '用户ID',
    sessionId: '会话ID',
    context: {
      pageType: 'general',
      userIntent: 'general-chat',
      platform: 'campus-marketplace',
      timestamp: new Date().toISOString()
    }
  }, null, 2))
}

// 运行诊断
testN8nWorkflow().catch(console.error)