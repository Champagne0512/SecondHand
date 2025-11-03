# 网站助手AI工作流使用说明

## 概述
本文档详细说明如何设置和使用优化后的网站助手AI工作流。该工作流基于n8n平台，集成了AI，为校园二手交易平台提供专业、有针对性的技术支持。

## 文件说明
- `website-assistant-optimized-workflow.json` - 主要的工作流配置文件
- `validate-new-workflow.cjs` - 工作流文件验证脚本
- `test-optimized-workflow.cjs` - 工作流功能测试脚本

## 设置步骤

### 1. 启动n8n服务
```bash
# 如果使用Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# 或者直接安装
npm install n8n -g
n8n
```

### 2. 导入工作流
1. 打开浏览器访问 http://localhost:5678
2. 点击左侧菜单的 "Workflows"
3. 点击 "Import from file" 按钮
4. 选择 `website-assistant-optimized-workflow.json` 文件
5. 点击 "Import" 导入

### 3. 激活工作流
1. 打开导入的工作流
2. 点击右上角的 ⚡ 图标（Toggle Active）激活工作流
3. 点击 "Save" 保存更改

### 4. 验证工作流
```bash
# 验证工作流文件格式
node validate-new-workflow.cjs

# 测试工作流功能
node test-optimized-workflow.cjs
```

## 工作流特性

### 1. 针对性回答
工作流配置了专门的系统提示词，使AI助手具备以下特性：
- 了解校园二手交易平台的业务场景
- 熟悉平台功能和用户需求
- 能提供具体、可操作的解决方案
- 具备网站助手的自觉性

### 2. 上下文感知
工作流会传递以下上下文信息给AI：
- 用户ID
- 会话ID
- 时间戳
- 用户问题

### 3. 专业领域知识
AI助手具备以下专业能力：
- 网站使用指导
- 技术问题解决方案
- 商品描述和定价建议
- 安全交易指导
- 平台功能解释

## API集成

### Webhook端点
```
POST http://localhost:5678/webhook/website-assistant
```

### 请求格式
```json
{
  "message": "用户问题",
  "userId": "用户唯一标识",
  "sessionId": "会话唯一标识"
}
```

### 响应格式
```json
{
  "success": true,
  "data": {
    "response": "AI助手的回答内容",
    "userId": "用户唯一标识",
    "sessionId": "会话唯一标识",
    "timestamp": "响应时间戳"
  }
}
```

## 故障排除

### 1. 工作流未激活
**问题**: 测试时返回404错误
**解决方案**: 
- 确保工作流状态为"Active"
- 检查Webhook节点的路径配置
- 重新保存工作流

### 2. AI API调用失败
**问题**: AI未返回有效响应
**解决方案**:
- 检查AI API密钥是否正确
- 验证网络连接
- 查看n8n执行日志

### 3. 响应格式错误
**问题**: 响应不是期望的JSON格式
**解决方案**:
- 检查"Format Response"节点配置
- 验证AI API返回的数据结构

## 自定义配置

### 修改AI提示词
在工作流的"AI API Call"节点中，可以修改系统提示词来调整AI助手的行为。

### 更改Webhook路径
在工作流的"Webhook"节点中，可以修改"path"参数来更改Webhook路径。

### 调整AI参数
在工作流的"AI API Call"节点中，可以调整以下参数：
- temperature: 控制回复的随机性(0-1)
- max_tokens: 最大回复长度
- top_p: 控制回复的多样性(0-1)

## 测试验证

### 自动化测试
使用提供的测试脚本验证工作流功能：
```bash
node test-optimized-workflow.cjs
```

### 手动测试
使用curl命令手动测试：
```bash
curl -X POST http://localhost:5678/webhook/website-assistant \
  -H "Content-Type: application/json" \
  -d '{
    "message": "如何发布商品？",
    "userId": "test-user",
    "sessionId": "test-session"
  }'
```

## 维护建议

1. **定期检查**: 定期验证工作流是否正常运行
2. **日志监控**: 监控n8n执行日志，及时发现和解决问题
3. **性能优化**: 根据使用情况调整AI参数以优化性能
4. **安全更新**: 定期更新n8n和相关依赖以确保安全