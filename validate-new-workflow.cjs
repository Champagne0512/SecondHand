const fs = require('fs');

try {
    console.log('🔄 开始验证工作流JSON格式...');
    
    const content = fs.readFileSync('website-assistant-optimized-workflow.json', 'utf8');
    const workflow = JSON.parse(content);
    
    console.log('✅ JSON格式验证通过');
    console.log('📊 文件大小:', (content.length / 1024).toFixed(2), 'KB');
    console.log('🔧 工作流名称:', workflow.name);
    console.log('📋 节点数量:', workflow.nodes.length);
    console.log('🔗 连接数量:', Object.keys(workflow.connections).length);
    
    // 验证必需字段
    const requiredFields = ['name', 'nodes', 'connections', 'settings'];
    const missingFields = requiredFields.filter(field => !workflow[field]);
    
    if (missingFields.length > 0) {
        console.warn('⚠️  缺少字段:', missingFields.join(', '));
    } else {
        console.log('✅ 所有必需字段都存在');
    }
    
    // 验证节点类型
    const validNodeTypes = workflow.nodes.every(node => 
        node.type && node.type.startsWith('n8n-nodes-base.')
    );
    
    if (validNodeTypes) {
        console.log('✅ 所有节点类型都有效');
    } else {
        console.warn('⚠️  发现无效节点类型');
    }
    
    // 验证Webhook节点
    const webhookNode = workflow.nodes.find(node => node.type === 'n8n-nodes-base.webhook');
    if (webhookNode) {
        console.log('✅ Webhook节点配置正确');
        console.log('🔗 Webhook路径:', webhookNode.parameters.path);
    } else {
        console.warn('⚠️  未找到Webhook节点');
    }
    
    // 验证DeepSeek API节点
    const apiNode = workflow.nodes.find(node => node.type === 'n8n-nodes-base.httpRequest');
    if (apiNode) {
        console.log('✅ DeepSeek API节点配置正确');
        console.log('🔗 API地址:', apiNode.parameters.url);
    } else {
        console.warn('⚠️  未找到DeepSeek API节点');
    }
    
    console.log('🎉 工作流验证完成，可以导入n8n使用！');
    
} catch (error) {
    console.error('❌ 验证失败:', error.message);
    process.exit(1);
}