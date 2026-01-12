# Nuxtype

> 基于 Nuxt 4、PostgreSQL 和 Y.js 的实时协同笔记应用

一个全栈 TypeScript 项目，实现了 CRDT 实时协同编辑、AI 辅助写作和混合部署架构。

[![Nuxt 4](https://img.shields.io/badge/Nuxt-4.2-00DC82?style=flat&logo=nuxt.js)](https://nuxt.com)
[![Vue 3](https://img.shields.io/badge/Vue-3.5-42b883?style=flat&logo=vue.js)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)

## ✨ 核心特性

- **现代化 UI** - 基于 Shadcn Vue 的美观组件库，App Shell 侧边栏布局
- **富文本编辑** - Tiptap v3 编辑器，支持 Markdown 和实时预览
- **实时协同** - Y.js CRDT + Hocuspocus 多人编辑，光标同步
- **图片上传** - Cloudflare R2 存储，用户权限隔离
- **自动保存** - 防抖机制实现无感知自动保存
- **安全认证** - JWT Token + bcryptjs，双重权限验证
- **数据持久化** - PostgreSQL + Drizzle ORM (JSONB + Y.js State)
- **性能优化** - 异步组件加载、骨架屏、Serverless 适配

## 技术栈

### 前端

- **框架**: Nuxt 4 (Vue 3)
- **样式**: Tailwind CSS 3
- **组件**: Shadcn Vue (Reka UI)
- **编辑器**: Tiptap (ProseMirror)
- **状态管理**: Vue Composables

### 后端

- **服务端**: Nuxt Nitro (Server Routes)
- **协作服务**: Hocuspocus Server (WebSocket)
- **数据库**: PostgreSQL (Neon/Supabase)
- **ORM**: Drizzle ORM
- **认证**: JWT + bcryptjs
- **存储**: Cloudflare R2 (S3 兼容)

### 开发工具

- **包管理**: pnpm
- **语言**: TypeScript (严格模式)
- **代码规范**: ESLint + 自动导入
- **版本控制**: Git

## 项目结构

```
Nuxtype/
├── apps/
│   ├── web/                    # Nuxt 应用
│   │   ├── app/               # 应用核心
│   │   │   ├── components/    # Vue 组件
│   │   │   │   ├── editor/   # Tiptap 编辑器 (协作支持)
│   │   │   │   └── ui/       # Shadcn 组件
│   │   │   ├── composables/  # 可复用逻辑 (useAuth, useDocuments)
│   │   │   ├── layouts/      # 布局组件
│   │   │   ├── pages/        # 路由页面
│   │   │   └── lib/          # 工具函数
│   │   └── server/           # API 路由
│   │       ├── api/          # HTTP API
│   │       │   ├── auth/     # 认证接口
│   │       │   ├── documents/# 文档 CRUD
│   │       │   └── upload.*  # 图片上传/删除
│   │       └── utils/        # 服务端工具
│   │           ├── db.ts     # 数据库连接 (Serverless 适配)
│   │           ├── jwt.ts    # JWT 认证
│   │           └── r2.ts     # R2 存储
│   └── collab/                # Hocuspocus 协作服务
│       └── src/
│           └── index.ts       # WebSocket 服务器
└── packages/
    └── shared/                # 共享代码库
        ├── schema.ts          # 数据库 Schema (含 Y.js State)
        ├── types.ts           # TypeScript 类型定义
        └── zod-schema.ts      # API 请求验证
```
## 数据库设计

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
  yjsState: bytea (Y.js CRDT 状态)
  isPublic: Boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

## 开发路线图

### Phase 1: 全栈基建 ✅

- [x] Monorepo 结构搭建
- [x] 数据库连接与 Schema 定义
- [x] UI 框架集成 (Tailwind + Shadcn)
- [x] 用户注册/登录 (JWT + Cookie)
- [x] 文档管理系统 (CRUD + Dashboard)
- [x] useAuth Composable 认证逻辑复用

### Phase 2: 编辑器核心 ✅

- [x] Tiptap 富文本编辑器集成
- [x] App Shell 布局 (Notion/Linear 风格侧边栏)
- [x] 文档自动保存 (防抖 1s)
- [x] 非阻塞数据获取 (useLazyFetch)
- [x] 骨架屏加载优化
- [x] 异步组件拆分

### Phase 3: 实时协同 ✅

- [x] Hocuspocus WebSocket 服务器
- [x] Y.js CRDT 集成 (无冲突协作)
- [x] Tiptap v3 迁移与协作扩展
- [x] 多用户光标同步
- [x] JWT 认证保护
- [x] PostgreSQL 持久化 Y.js 状态

### Phase 4: 存储与安全 ✅

- [x] Cloudflare R2 图片上传
- [x] 用户文件夹隔离
- [x] 图片删除权限验证
- [x] 数据库连接池 Serverless 适配

### Phase 5: 高级特性 (计划中)

- [ ] Slash 命令菜单
- [ ] AI 辅助写作 (OpenAI 集成)
- [ ] 文档版本历史
- [ ] 文档分享和协作邀请
- [ ] 性能监控 (Sentry)
- [ ] 单元测试和 E2E 测试
