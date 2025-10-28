const http = require('http');

console.log('🔍 检查n8n中已激活的工作流...');
console.log('='.repeat(40));

// 检查n8n服务状态
function checkN8nStatus() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5678,
            path: '/healthz',
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ n8n服务运行正常');
                    resolve(true);
                } else {
                    console.log('❌ n8n服务异常');
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ 无法连接到n8n服务:', error.message);
            resolve(false);
        });

        req.end();
    });
}

// 检查工作流是否激活
async function checkWorkflow() {
    const isN8nRunning = await checkN8nStatus();
    if (!isN8nRunning) {
        console.log('\n🔧 解决方案:');
        console.log('1. 启动n8n服务: n8n start');
        console.log('2. 确保端口5678未被占用');
        return;
    }

    console.log('\n🚀 测试工作流连接...');
    
    // 尝试访问工作流
    const options = {
        hostname: 'localhost',
        port: 5678,
        path: '/webhook/website-assistant',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const testData = JSON.stringify({
        message: '测试连接',
        userId: 'test-user',
        sessionId: 'test-session'
    });

    const req = http.request(options, (res) => {
        console.log(`📊 响应状态: ${res.statusCode}`);
        
        if (res.statusCode === 404) {
            console.log('\n⚠️  工作流未激活或未正确导入');
            console.log('\n📋 请按以下步骤操作:');
            console.log('1. 打开浏览器访问 http://localhost:5678');
            console.log('2. 导入 website-assistant-optimized-workflow.json 文件');
            console.log('3. 点击工作流右上角的 ⚡ 图标激活工作流');
            console.log('4. 点击 "Save" 保存更改');
            console.log('5. 重新运行此测试脚本');
        } else if (res.statusCode === 200) {
            console.log('✅ 工作流已正确激活并可访问！');
        } else {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                console.log('📄 响应内容:', data);
            });
        }
    });

    req.on('error', (error) => {
        console.log('❌ 请求失败:', error.message);
        console.log('\n🔧 可能的解决方案:');
        console.log('1. 检查n8n是否正在运行');
        console.log('2. 检查防火墙设置');
        console.log('3. 确认端口5678是否正确');
    });

    req.write(testData);
    req.end();
}

// 运行检查
checkWorkflow();