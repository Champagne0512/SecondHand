# Supabase 数据库配置指南

## 项目设置步骤

### 1. 创建 Supabase 项目

1. 访问 [Supabase官网](https://supabase.com)
2. 注册/登录账户
3. 点击 "New Project"
4. 填写项目信息：
   - **Name**: `poetry-website` (或其他名称)
   - **Database Password**: 设置安全的数据库密码
   - **Region**: 选择离您最近的区域（如 `ap-southeast-1`）
5. 点击 "Create new project"

### 2. 获取项目配置信息

项目创建完成后，在项目设置中获取以下信息：
- **Project URL**: 在 Settings > API 中查看
- **anon/public key**: 在 Settings > API 中查看

### 3. 配置环境变量

创建 `.env` 文件并填入配置：

```env
VITE_SUPABASE_URL=您的项目URL
VITE_SUPABASE_ANON_KEY=您的anon key
```

### 4. 执行数据库迁移

#### 方法一：使用 Supabase Dashboard
1. 进入 Supabase 项目控制台
2. 点击左侧菜单的 "SQL Editor"
3. 复制 `supabase/migrations/001_create_tables.sql` 内容并执行
4. 复制 `supabase/migrations/002_create_functions.sql` 内容并执行

#### 方法二：使用 Supabase CLI（推荐）
```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录
supabase login

# 链接项目
supabase link --project-ref 您的项目ID

# 执行迁移
supabase db push
```

### 5. 配置身份认证

在 Supabase Dashboard 中：
1. 进入 Authentication > Settings
2. 配置网站URL：`http://localhost:3000`
3. 启用邮箱验证（可选）
4. 配置第三方登录（如GitHub、Google，可选）

### 6. 测试数据库连接

启动开发服务器测试连接：
```bash
npm run dev
```

## 数据库表说明

### poems（诗词表）
- `id`: 唯一标识符
- `title`: 诗词标题
- `author`: 作者
- `dynasty`: 朝代
- `content`: 诗词内容
- `analysis`: 诗词赏析
- `tags`: 标签数组
- `favorite_count`: 收藏次数
- `view_count`: 浏览次数

### favorites（收藏表）
- 记录用户的收藏关系
- 自动更新诗词的收藏计数

### comments（评论表）
- 记录用户对诗词的评论
- 支持评论的创建和更新

### browse_history（浏览历史表）
- 记录用户的浏览历史
- 用于个人中心的浏览记录功能

## 安全策略

项目已配置行级安全策略（RLS）：
- 诗词数据公开可读
- 用户只能管理自己的收藏、评论和浏览历史
- 只有管理员可以管理诗词数据

## 管理员设置

要设置管理员账户，需要：
1. 在 Supabase Auth 中创建管理员用户
2. 更新数据库策略中的管理员邮箱

修改 `001_create_tables.sql` 中的策略：
```sql
-- 将 'admin@example.com' 替换为您的管理员邮箱
CREATE POLICY "仅管理员可插入诗词" ON poems FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' 
  AND auth.jwt() ->> 'email' = '您的管理员邮箱'
);
```

## 数据管理

### 添加新诗词
可以通过以下方式添加诗词数据：

1. **Supabase Dashboard**: 直接在表中插入数据
2. **API调用**: 使用前端的管理界面
3. **批量导入**: 使用 CSV 导入功能

### 备份和恢复
使用 Supabase 的备份功能定期备份数据。

## 性能优化建议

1. **启用数据库索引**: 迁移脚本已包含必要的索引
2. **监控性能**: 使用 Supabase 的监控工具
3. **缓存策略**: 考虑实现前端缓存
4. **CDN配置**: 为静态资源配置CDN

## 故障排除

### 常见问题

1. **连接失败**: 检查环境变量配置
2. **权限错误**: 检查RLS策略配置
3. **性能问题**: 检查索引和查询优化

### 获取帮助

- Supabase 官方文档：https://supabase.com/docs
- 社区支持：https://github.com/supabase/supabase/discussions