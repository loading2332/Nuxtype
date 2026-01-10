/**
 * 认证工具函数
 * server/utils/auth.ts
 *
 * 提供统一的认证验证函数，保持 DRY 原则
 * 每个需要认证的 API 端点调用此函数即可
 */
import type { AuthTokenPayload } from "@nuxtype/shared"
import type { H3Event } from "h3"
import { extractToken, verifyToken } from "./jwt"

/**
 * 验证请求并返回已认证用户信息
 * 如果认证失败，直接抛出 401 错误
 */
export function requireAuth(event: H3Event): AuthTokenPayload {
  const token = extractToken(event)
  if (!token) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized: No token provided",
    })
  }

  const user = verifyToken(token)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized: Invalid token",
    })
  }

  return user
}
