// 验证新的JSON文件
import { readFileSync } from 'fs';

try {
  const data = JSON.parse(readFileSync('n8n-campus-trade-ai-valid.json', 'utf8'));
  console.log('✅ JSON格式正确！');
  console.log('工作流名称:', data.name);
  console.log('节点数量:', data.nodes.length);
  console.log('连接数量:', Object.keys(data.connections).length);
  
  console.log('\n📋 工作流信息:');
  console.log('- Webhook路径:', data.nodes[0].parameters.path);
  console.log('- OpenAI模型:', data.nodes[2].parameters.model);
  console.log('- API密钥已配置:', !!data.nodes[2].credentials?.openAiApi?.apiKey);
  
  console.log('\n🎯 使用说明:');
  console.log('1. 在n8n中导入此JSON文件');
  console.log('2. Webhook将监听: /campus-ai-assistant');
  console.log('3. OpenAI API密钥已预设');
  console.log('4. 激活工作流即可使用');
  
} catch (error) {
  console.log('❌ JSON格式错误:', error.message);
  console.log('错误位置:', error.stack);
}