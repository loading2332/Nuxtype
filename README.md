# Nuxtype

> 基于 Nuxt 4、PostgreSQL 和 Y.js 的实时协同笔记应用

一个全栈 TypeScript 项目，实现了 CRDT 实时协同编辑、AI 辅助写作和混合部署架构。

[![Nuxt 4](https://img.shields.io/badge/Nuxt-4.2-00DC82?style=flat&logo=nuxt.js)](https://nuxt.com)
[![Vue 3](https://img.shields.io/badge/Vue-3.5-42b883?style=flat&logo=vue.js)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)

## ✨ 核心特性

- 🎨 **现代化 UI** - 基于 Shadcn Vue 的美观组件库
- 📝 **富文本编辑** - Tiptap 编辑器，支持 Markdown 和 Slash 命令
- 🔄 **实时协同** - Y.js + WebSocket 实现多人同步编辑
- 🤖 **AI 辅助** - 集成 AI 续写和内容优化
- 🔐 **用户认证** - JWT Token 安全认证
- 🗄️ **数据持久化** - PostgreSQL + Drizzle ORM
- 📦 **Monorepo 架构** - pnpm workspace 统一管理
- 🚀 **混合部署** - Serverless + Stateful 服务分离

## 📋 技术栈

### 前端

- **框架**: Nuxt 4 (Vue 3)
- **样式**: Tailwind CSS 3
- **组件**: Shadcn Vue
- **编辑器**: Tiptap (ProseMirror)
- **实时协同**: Y.js, Hocuspocus

### 后端

- **服务端**: Nuxt Nitro (Serverless)
- **数据库**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **认证**: JWT + bcryptjs

### 开发工具

- **包管理**: pnpm
- **语言**: TypeScript
- **代码规范**: ESLint
- **版本控制**: Git

## 🏗️ 项目结构

```
Nuxtype/
├── apps/
│   ├── web/                    # Nuxt 应用 (部署到 Vercel)
│   │   ├── app/               # 应用核心
│   │   ├── components/        # Vue 组件
│   │   ├── server/            # API 路由
│   │   │   ├── api/          # HTTP API
│   │   │   └── utils/        # 服务端工具
│   │   └── assets/           # 静态资源
│   └── collaboration/         # WebSocket 服务 (部署到 Render/Railway)
│       └── index.ts          # Y.js 协同服务器
└── packages/
    └── shared/               # 共享代码库
        ├── schema.ts         # 数据库 Schema
        └── types.ts          # TypeScript 类型定义
```

## 🚀 快速开始

### 前置要求

- Node.js >= 18
- pnpm >= 8
- PostgreSQL 数据库 (推荐使用 [Neon](https://neon.tech))

### 安装

```bash
# 1. 克隆项目
git clone https://github.com/loading2332/Nuxtype.git
cd Nuxtype

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env，填入你的数据库连接字符串
```

### 配置环境变量

在 `.env` 文件中配置：

```bash
# 数据库连接 (从 Neon 获取)
DATABASE_URL="postgresql://user:password@host/dbname"

# JWT 密钥 (生产环境请使用强密码)
JWT_SECRET="your-super-secret-key"

# WebSocket 服务地址
NUXT_PUBLIC_WS_URL="ws://localhost:1234"
```

### 数据库迁移

```bash
# 推送数据库表结构
pnpm run db:push

# (可选) 打开数据库可视化工具
pnpm run db:studio
```

### 启动开发服务器

```bash
# 启动 Nuxt 应用 (http://localhost:3000)
pnpm dev

# 启动协同服务器 (ws://localhost:1234) - Week 3 后可用
pnpm run dev:collab
```

## 📚 开发指南

### 可用命令

```bash
# 开发
pnpm dev              # 启动 web 应用
pnpm dev:collab       # 启动协同服务

# 构建
pnpm build            # 构建所有包

# 数据库
pnpm run db:push      # 推送 schema 到数据库
pnpm run db:studio    # 打开 Drizzle Studio
pnpm run db:generate  # 生成迁移文件
```

### 添加 UI 组件

使用 Shadcn CLI 快速添加组件：

```bash
cd apps/web
pnpm dlx shadcn-vue@latest add button
pnpm dlx shadcn-vue@latest add card
```

### 数据库 Schema 修改

1. 修改 `packages/shared/src/schema.ts`
2. 运行 `pnpm run db:push` 同步到数据库
3. 类型会自动更新，前后端都能获得类型提示

## 🗄️ 数据库设计

### users 表

```typescript
{
  id: UUID (Primary Key)
  email: String (Unique)
  password: String (Hashed)
  avatar: String (URL)
  createdAt: Timestamp
}
```

### documents 表

```typescript
{
  id: UUID (Primary Key)
  userId: UUID (Foreign Key → users.id)
  title: String
  content: JSONB (Tiptap JSON)
  isPublic: Boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

## 🎯 开发路线图

### Week 1: 全栈基建 ✅ (当前进度)

- [x] Monorepo 结构搭建
- [x] 数据库连接与 Schema 定义
- [x] UI 框架集成 (Tailwind + Shadcn)
- [ ] 用户注册/登录 API
- [ ] 文档 CRUD 接口

### Week 2: 编辑器核心

- [ ] Tiptap 富文本编辑器
- [ ] Slash 命令菜单
- [ ] Markdown 支持
- [ ] 自动保存功能

### Week 3: 实时协同

- [ ] WebSocket 服务搭建
- [ ] Y.js 集成
- [ ] 多人光标同步
- [ ] 冲突解决机制

### Week 4: 高级特性

- [ ] AI 辅助写作
- [ ] 图片上传 (S3/R2)
- [ ] 混合部署架构
- [ ] 性能优化

## 🚢 部署

### Frontend (Vercel)

```bash
# Vercel 会自动识别 Nuxt 项目
# 设置根目录为 apps/web
# 添加环境变量
```

### Collaboration Server (Render/Railway)

```bash
# 设置 Root Directory 为 apps/collaboration
# 添加 Start Command: node index.js
# 配置环境变量
```

## 🤝 贡献

这是一个学习项目，欢迎提出建议和改进！

## 📄 许可证

ISC

## 🙏 致谢

- [shadcn-vue](https://www.shadcn-vue.com) - 优秀的 Vue 组件库
- [Tiptap](https://tiptap.dev) - 强大的编辑器框架
- [Y.js](https://yjs.dev) - CRDT 协同引擎
- [Neon](https://neon.tech) - Serverless PostgreSQL

---

**⭐ 如果这个项目对你有帮助，请给个 Star！**
