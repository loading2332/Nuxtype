/**
 * 通用 TypeScript 接口定义
 * 供前端和后端共享，保证端到端类型安全
 */

export interface User {
  id: string
  email: string
  avatar?: string | null
  createdAt: Date
}

export interface Document {
  id: string
  userId: string
  title: string
  content: DocumentContent
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Tiptap JSON 文档结构
 */
export interface DocumentContent {
  type: "doc"
  content?: Array<{
    type: string
    content?: unknown[]
    attrs?: Record<string, unknown>
  }>
}

/**
 * API 响应通用格式
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * 身份验证相关
 */
export interface AuthTokenPayload {
  userId: string
  email: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
}
