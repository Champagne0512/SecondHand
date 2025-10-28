// n8n工作流设置指南和诊断
const diagnoseN8nWorkflow = async () => {
  console.log('=== n8n工作流诊断 ===\n');
  
  // 1. 检查n8n服务状态
  console.log('1. 📡 检查n8n服务状态...');
  try {
    const healthResponse = await fetch('http://localhost:5678/healthz');
    console.log('   ✅ n8n服务状态: 200 (正常运行)');
  } catch (error) {
    console.log('   ❌ n8n服务不可达');
    console.log('   解决方案: 启动n8n服务');
    console.log('   docker-compose up -d 或 n8n start');
    return;
  }
  
  // 2. 检查n8n控制台可访问性
  console.log('\n2. 🌐 检查n8n控制台...');
  try {
    const consoleResponse = await fetch('http://localhost:5678');
    console.log('   ✅ n8n控制台可访问');
  } catch (error) {
    console.log('   ❌ n8n控制台不可访问');
  }
  
  // 3. 测试各种可能的Webhook路径
  console.log('\n3. 🔍 测试Webhook路径...');
  const testPaths = [
    '/webhook/chat-assistant',
    '/webhook/chat_assistant',
    '/webhook/campus-ai',
    '/webhook/test',
    '/webhook/workflow',
    '/chat-assistant',
    '/campus-ai',
    '/test'
  ];
  
  let foundActivePath = false;
  
  for (const path of testPaths) {
    const url = `http://localhost:5678${path}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      
      if (response.status === 200) {
        console.log(`   ✅ 找到有效路径: ${path}`);
        foundActivePath = true;
        break;
      }
    } catch (error) {
      // 忽略连接错误，继续测试其他路径
    }
  }
  
  if (!foundActivePath) {
    console.log('   ❌ 未找到有效的Webhook路径');
  }
  
  // 4. 提供详细的设置指南
  console.log('\n=== 🚀 n8n工作流设置步骤 ===');
  console.log('\n步骤1: 访问n8n控制台');
  console.log('   打开浏览器访问: http://localhost:5678');
  console.log('   使用默认凭据登录（如果需要）');
  
  console.log('\n步骤2: 导入工作流文件');
  console.log('   1. 点击左侧菜单的 "Workflows"');
  console.log('   2. 点击 "Import from file" 按钮');
  console.log('   3. 选择文件: n8n-workflow-campus-ai.json');
  console.log('   4. 点击 "Import" 导入');
  
  console.log('\n步骤3: 激活工作流');
  console.log('   1. 打开导入的工作流');
  console.log('   2. 找到右上角的 ⚡ 图标（Toggle Active）');
  console.log('   3. 点击激活（状态从 "Inactive" 变为 "Active"）');
  console.log('   4. 点击 "Save" 保存更改');
  
  console.log('\n步骤4: 检查Webhook配置');
  console.log('   1. 点击节点1（Webhook触发器）');
  console.log('   2. 查看 "Path" 字段的值');
  console.log('   3. 确保路径与测试URL匹配');
  
  console.log('\n步骤5: 测试工作流');
  console.log('   激活后，工作流应该显示 "Active" 状态');
  console.log('   而不是 "waiting for trigger event"');
  console.log('   然后使用正确的Webhook URL进行测试');
  
  console.log('\n=== 🔧 常见问题解决 ===');
  console.log('\n问题1: "waiting for trigger event" 但测试返回404');
  console.log('   原因: 工作流未真正激活');
  console.log('   解决: 确保点击了 ⚡ 图标并保存');
  
  console.log('\n问题2: Webhook路径不匹配');
  console.log('   原因: Path字段配置错误');
  console.log('   解决: 在Webhook节点中检查并修改Path');
  
  console.log('\n问题3: 工作流导入失败');
  console.log('   原因: JSON文件格式错误');
  console.log('   解决: 重新下载或检查JSON文件');
  
  console.log('\n=== 📞 立即操作 ===');
  console.log('\n请立即执行以下操作:');
  console.log('1. 打开浏览器访问 http://localhost:5678');
  console.log('2. 导入工作流文件');
  console.log('3. 激活工作流');
  console.log('4. 告诉我Webhook节点的实际Path值');
  
  return {
    n8nService: 'running',
    webhookPaths: 'not_found',
    nextSteps: 'import_and_activate_workflow'
  };
};

diagnoseN8nWorkflow().then(result => {
  console.log('\n=== 诊断完成 ===');
  console.log('请按照上述步骤设置n8n工作流');
});