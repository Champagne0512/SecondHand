// 验证最终JSON文件
import { readFileSync } from 'fs';

try {
  const data = JSON.parse(readFileSync('n8n-campus-trade-ai-final.json', 'utf8'));
  console.log('✅ JSON格式正确！');
  console.log('工作流名称:', data.name);
  console.log('节点数量:', data.nodes.length);
  console.log('连接数量:', Object.keys(data.connections).length);
  
  // 检查必需的字段
  const requiredFields = ['name', 'nodes', 'connections'];
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    console.log('⚠️ 缺少字段:', missingFields);
  } else {
    console.log('✅ 所有必需字段都存在');
  }
  
  // 检查节点结构
  const validNodes = data.nodes.every(node => 
    node.name && node.type && node.position && node.parameters
  );
  
  console.log('✅ 节点结构:', validNodes ? '正确' : '有问题');
  
  console.log('\n📋 工作流信息:');
  console.log('- Webhook路径:', data.nodes[0].parameters.path);
  console.log('- OpenAI模型:', data.nodes[2].parameters.model);
  
} catch (error) {
  console.log('❌ JSON格式错误:', error.message);
  if (error.message.includes('Unexpected token')) {
    console.log('这通常是JSON语法错误，请检查引号、逗号等符号');
  }
}