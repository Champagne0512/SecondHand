# 诗词赏析网站

基于Vue 3 + Supabase构建的现代诗词赏析网站。

## 功能特性

- 🎨 古风设计风格，统一页面布局
- 📚 诗词浏览、搜索、收藏功能
- 👤 用户个人中心（收藏、评论、浏览历史）
- 🔍 智能搜索和筛选功能
- 📱 响应式设计，支持移动端

## 技术栈

- **前端框架**: Vue 3 + Composition API
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **后端服务**: Supabase
- **构建工具**: Vite
- **样式**: CSS3 + 变量系统

## 项目结构

```
src/
├── components/          # 公共组件
├── views/              # 页面组件
│   ├── Home.vue        # 首页
│   ├── Poems.vue       # 诗词列表页
│   ├── PoemDetail.vue  # 诗词详情页
│   ├── Search.vue      # 搜索页
│   └── Profile.vue     # 个人中心
├── stores/             # 状态管理
│   └── poemStore.js    # 诗词数据管理
├── utils/              # 工具函数
│   └── supabase.js     # Supabase配置
├── style.css           # 全局样式
└── main.js             # 应用入口
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 文件为 `.env`，并填入你的Supabase项目配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 查看网站。

### 4. 构建生产版本

```bash
npm run build
```

## 页面功能

### 首页 (Home)
- 展示精选诗词
- 热门诗词排行
- 快速导航入口

### 诗词列表 (Poems)
- 浏览所有诗词
- 按朝代筛选
- 分页加载

### 诗词详情 (PoemDetail)
- 完整诗词内容
- 诗词赏析
- 评论功能
- 收藏功能

### 搜索页 (Search)
- 智能搜索诗词
- 热门搜索标签
- 实时搜索建议

### 个人中心 (Profile)
- 我的收藏
- 我的评论
- 浏览历史
- 用户统计

## 设计特色

### 古风设计
- 使用古风字体（马善政、华文行楷、宋体）
- 传统色彩搭配（赭石色、米色、深棕色）
- 毛玻璃效果和渐变背景
- 卡片悬浮动画效果

### 响应式布局
- 移动端友好设计
- 自适应屏幕尺寸
- 触摸友好的交互

## Supabase数据库结构

项目需要以下数据表：

```sql
-- 诗词表
CREATE TABLE poems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  dynasty TEXT NOT NULL,
  content TEXT NOT NULL,
  analysis TEXT,
  favorite_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 收藏表
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  poem_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 评论表
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  poem_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 浏览历史表
CREATE TABLE browse_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  poem_id UUID NOT NULL,
  viewed_at TIMESTAMP DEFAULT NOW()
);
```

## 开发说明

### 添加新功能
1. 在对应的页面组件中添加功能
2. 在 `poemStore.js` 中添加状态管理逻辑
3. 在 `supabase.js` 中添加API方法
4. 更新路由配置（如需要）

### 样式开发
- 使用CSS变量系统保持设计一致性
- 遵循古风设计规范
- 确保响应式兼容性

## GitHub部署配置

项目已配置GitHub Actions自动化部署，支持Vercel和Supabase数据库迁移。

### GitHub Actions工作流

项目包含两个自动化工作流：

1. **自动部署到Vercel** (`/.github/workflows/deploy.yml`)
   - 在推送到main/master分支时自动触发
   - 自动构建和部署到Vercel
   - 集成环境变量管理

2. **Supabase数据库迁移** (`/.github/workflows/supabase-migrations.yml`)
   - 在数据库迁移文件变更时自动运行
   - 自动推送数据库变更到Supabase

### 环境变量配置

在GitHub仓库的Settings → Secrets and variables → Actions中添加以下secrets：

| Secret名称 | 描述 | 获取方式 |
|-----------|------|----------|
| `VERCEL_TOKEN` | Vercel访问令牌 | Vercel账户设置 → Tokens |
| `VERCEL_ORG_ID` | Vercel组织ID | Vercel项目设置 |
| `VERCEL_PROJECT_ID` | Vercel项目ID | Vercel项目设置 |
| `SUPABASE_ACCESS_TOKEN` | Supabase访问令牌 | Supabase账户设置 → Access Tokens |
| `SUPABASE_PROJECT_ID` | Supabase项目ID | Supabase项目设置 |
| `VITE_SUPABASE_URL` | Supabase项目URL | Supabase项目设置 |
| `VITE_SUPABASE_ANON_KEY` | Supabase匿名密钥 | Supabase项目设置 |

### 部署步骤

1. **Fork或克隆仓库**
   ```bash
   git clone https://github.com/your-username/poetry-website.git
   cd poetry-website
   ```

2. **配置GitHub Secrets**
   - 按照上述表格配置所有必要的secrets

3. **推送代码到GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

4. **查看部署状态**
   - 在GitHub仓库的Actions标签页查看部署状态
   - 部署成功后访问Vercel提供的域名

### 手动部署选项

#### Vercel部署（推荐）
1. 连接GitHub仓库到Vercel
2. 配置环境变量
3. 自动部署

#### Netlify部署
1. 连接GitHub仓库到Netlify
2. 配置构建命令和环境变量
3. 部署网站

### 数据库迁移

项目包含完整的数据库迁移文件：

```bash
# 迁移文件执行顺序
supabase/migrations/001_initial_schema.sql    # 表结构和函数
supabase/migrations/002_utility_functions.sql # 实用函数
supabase/migrations/003_sample_data.sql       # 示例诗词数据
supabase/migrations/004_interaction_data.sql  # 用户互动数据
```

使用Supabase CLI手动运行迁移：
```bash
supabase db push
```

## 项目状态徽章

在README中添加项目状态徽章：

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/poetry-website)
[![GitHub Actions](https://github.com/your-username/poetry-website/actions/workflows/deploy.yml/badge.svg)](https://github.com/your-username/poetry-website/actions)

## 故障排除

### 常见问题

1. **构建失败**
   - 检查Node.js版本兼容性
   - 验证环境变量配置

2. **数据库连接错误**
   - 检查Supabase项目状态
   - 验证数据库迁移是否成功

3. **部署失败**
   - 查看GitHub Actions日志
   - 检查Vercel部署日志

### 获取帮助

- 查看详细部署指南: [DEPLOYMENT.md](DEPLOYMENT.md)
- 提交Issue: [GitHub Issues](https://github.com/your-username/poetry-website/issues)

## 贡献指南

欢迎提交Issue和Pull Request来改进项目。

## 许可证

MIT License"# Poems" 
