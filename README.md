# 校园二手物品交易平台

一个基于Vue 3的校园二手物品交易平台最小可行产品(MVP)，提供用户认证、商品发布、搜索浏览、交易沟通等核心功能。

## 项目功能

### 核心功能模块
- **用户认证系统**：用户注册、登录、个人信息管理
- **商品管理**：商品发布、编辑、删除、状态管理
- **搜索浏览**：商品分类搜索、关键词搜索、筛选功能
- **交易沟通**：买卖双方消息沟通系统
- **个人中心**：我的发布、我的收藏、交易记录

### 技术栈
- **前端框架**：Vue 3 + Composition API
- **路由管理**：Vue Router 4
- **状态管理**：Pinia
- **UI组件**：Element Plus
- **构建工具**：Vite
- **开发语言**：TypeScript

## 项目结构

```
src/
├── components/          # 可复用组件
│   ├── common/         # 通用组件
│   ├── layout/         # 布局组件
│   └── business/       # 业务组件
├── views/              # 页面视图
├── stores/             # 状态管理
├── router/             # 路由配置
├── api/                # API接口
├── utils/              # 工具函数
├── types/              # TypeScript类型定义
└── assets/             # 静态资源
```

## 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 生产构建
```bash
npm run build
```

## 功能说明

### 用户认证模块
- 用户注册（邮箱/手机号验证）
- 用户登录（支持记住登录状态）
- 密码重置功能
- 用户信息编辑

### 商品管理模块
- 商品发布（标题、描述、价格、图片上传）
- 商品编辑和删除
- 商品状态管理（上架/下架/已售）
- 商品分类管理

### 搜索浏览模块
- 首页商品展示（最新发布、热门商品）
- 分类浏览（学习用品、电子产品、生活用品等）
- 关键词搜索（支持模糊匹配）
- 价格区间筛选

### 交易沟通模块
- 商品详情页联系卖家
- 实时消息沟通
- 交易状态跟踪
- 评价系统

## API接口设计

### 用户相关接口
- POST /api/auth/register - 用户注册
- POST /api/auth/login - 用户登录
- GET /api/user/profile - 获取用户信息
- PUT /api/user/profile - 更新用户信息

### 商品相关接口
- GET /api/products - 获取商品列表
- POST /api/products - 发布商品
- GET /api/products/:id - 获取商品详情
- PUT /api/products/:id - 更新商品信息
- DELETE /api/products/:id - 删除商品

### 消息相关接口
- GET /api/messages - 获取消息列表
- POST /api/messages - 发送消息
- GET /api/messages/:id - 获取消息详情

## 开发规范

- 使用Composition API进行组件开发
- 遵循Vue 3最佳实践
- 组件命名采用PascalCase
- 代码注释完整清晰
- 错误处理完善
- 响应式设计适配移动端