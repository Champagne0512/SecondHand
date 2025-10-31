import fetch from 'node-fetch';

async function testN8nWorkflow() {
  const workflowUrl = 'https://cchencchen0512.app.n8n.cloud/webhook/02baeca7-10b5-4800-a9e4-7a85c857c10e/chat';
  
  console.log('🔍 测试n8n工作流连接...');
  console.log('📤 目标URL:', workflowUrl);
  
  // 测试1: 简单连接测试
  try {
    console.log('\n1️⃣ 测试简单连接...');
    const response = await fetch(workflowUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: '你好，测试一下连接',
        userId: 'test-user-001',
        sessionId: 'test-session-001'
      })
    });
    
    console.log('📥 响应状态:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ 连接成功！响应数据:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ 连接失败，状态码:', response.status);
      const errorText = await response.text();
      console.log('📄 错误详情:', errorText);
    }
  } catch (error) {
    console.log('❌ 连接异常:', error.message);
  }
  
  // 测试2: 使用LangChain Chat Trigger格式
  try {
    console.log('\n2️⃣ 测试LangChain Chat Trigger格式...');
    const response = await fetch(workflowUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          message: '你好，我是校园二手交易平台的用户',
          userId: 'test-user-002',
          sessionId: 'test-session-002'
        }
      })
    });
    
    console.log('📥 响应状态:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ LangChain格式连接成功！响应数据:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ LangChain格式连接失败，状态码:', response.status);
      const errorText = await response.text();
      console.log('📄 错误详情:', errorText);
    }
  } catch (error) {
    console.log('❌ LangChain格式连接异常:', error.message);
  }
  
  // 测试3: 检查URL是否正确
  console.log('\n3️⃣ 检查Webhook URL结构...');
  console.log('📋 工作流Webhook ID:', '02baeca7-10b5-4800-a9e4-7a85c857c10e');
  console.log('🔗 当前URL结构:', workflowUrl);
  console.log('💡 建议检查n8n工作流的Webhook配置是否正确');
}

testN8nWorkflow().catch(console.error);