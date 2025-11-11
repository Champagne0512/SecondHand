# 诗词网站 Supabase 数据库部署指南

## 概述
本文档详细说明如何在Supabase中部署诗词网站的数据库结构，包括表创建、索引设置、存储过程和行级安全策略。

## 部署步骤

### 1. 创建Supabase项目
1. 登录 [Supabase控制台](https://supabase.com)
2. 点击"New Project"创建新项目
3. 选择组织、设置项目名称和数据库密码
4. 选择合适的地域（建议选择离用户最近的地域）
5. 等待项目创建完成（约1-2分钟）

### 2. 运行数据库迁移脚本

#### 方法一：通过SQL编辑器（推荐）
1. 进入Supabase项目控制台
2. 点击左侧菜单的"SQL Editor"
3. 复制 `001_initial_schema.sql` 文件内容到编辑器
4. 点击"Run"执行脚本
5. 等待执行完成（约30秒）
6. 同样方式执行 `002_utility_functions.sql`

#### 方法二：通过迁移文件
1. 在项目根目录运行Supabase CLI命令：
```bash
# 初始化Supabase（如果尚未初始化）
supabase init

# 应用迁移
supabase db push
```

### 3. 配置认证设置
1. 进入项目控制台的"Authentication" → "Settings"
2. 配置以下设置：
   - **Site URL**: 您的网站域名（开发时可设为 `http://localhost:5173`）
   - **Enable email confirmations**: 根据需求开启/关闭
   - **JWT Expiry**: 设置合适的token过期时间

### 4. 创建管理员用户（可选）
1. 在"Authentication" → "Users"中创建新用户
2. 记录用户的ID（UUID格式）
3. 在SQL编辑器中运行：
```sql
UPDATE profiles 
SET username = 'admin' 
WHERE id = '用户的UUID';
```

### 5. 测试数据库连接
使用以下代码测试连接：

```javascript
// 在您的Vue应用中测试连接
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = '您的项目URL'
const supabaseKey = '您的anon public key'

const supabase = createClient(supabaseUrl, supabaseKey)

// 测试查询
async function testConnection() {
  const { data, error } = await supabase.from('poems').select('*').limit(1)
  if (error) {
    console.error('连接失败:', error)
  } else {
    console.log('连接成功，数据:', data)
  }
}
```

## 数据库结构说明

### 核心表
1. **poems** - 诗词表
   - 存储诗词的基本信息
   - 包含浏览次数、收藏数等统计字段

2. **profiles** - 用户资料表
   - 与Supabase Auth集成
   - 存储用户个性化信息

3. **favorites** - 收藏表
   - 记录用户收藏的诗词
   - 自动更新诗词的收藏计数

4. **comments** - 评论表
   - 存储用户对诗词的评论
   - 包含用户信息和时间戳

5. **browse_history** - 浏览历史表
   - 记录用户的浏览行为
   - 用于个性化推荐

### 关键功能

#### 全文搜索
```sql
-- 使用存储过程搜索诗词
SELECT * FROM search_poems('李白');
```

#### 热门推荐
```sql
-- 获取热门诗词
SELECT * FROM get_popular_poems(10);
```

#### 用户数据
```sql
-- 获取用户收藏
SELECT * FROM get_user_favorites('用户UUID');

-- 获取浏览历史
SELECT * FROM get_user_browse_history('用户UUID');
```

## 安全配置

### 行级安全策略（RLS）
- 所有表都已启用RLS
- 用户只能修改自己的数据
- 诗词数据对所有人可读

### 认证集成
- 自动创建用户资料
- 安全的用户会话管理
- 基于角色的访问控制

## 性能优化

### 索引策略
- 为常用查询字段创建索引
- 全文搜索索引优化
- 复合索引支持复杂查询

### 存储过程
- 封装复杂业务逻辑
- 减少网络往返
- 提高查询性能

## 故障排除

### 常见问题

1. **RLS策略错误**
   - 检查用户是否已登录
   - 验证RLS策略是否正确应用

2. **存储过程执行失败**
   - 检查函数参数类型
   - 验证函数权限

3. **连接问题**
   - 检查Supabase项目URL和密钥
   - 验证网络连接

### 调试技巧

```sql
-- 检查表结构
\d poems

-- 查看RLS策略
SELECT * FROM pg_policies WHERE tablename = 'poems';

-- 测试存储过程
SELECT * FROM search_poems('test') LIMIT 1;
```

## 后续维护

### 数据备份
- 定期导出数据库备份
- 使用Supabase的自动备份功能

### 性能监控
- 监控查询性能
- 优化慢查询
- 定期更新统计信息

### 功能扩展
- 根据需要添加新的存储过程
- 扩展表结构支持新功能
- 优化现有查询性能

## 联系方式

如有问题，请参考：
- [Supabase官方文档](https://supabase.com/docs)
- [项目GitHub仓库](您的仓库地址)

---

**注意**: 在生产环境部署前，请务必在测试环境充分测试所有功能。