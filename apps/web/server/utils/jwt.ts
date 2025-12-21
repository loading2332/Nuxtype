/**
 * JWT Token 工具函数
 * apps/web/server/utils/jwt.ts
 */
import type { AuthTokenPayload } from "@nuxtype/shared"
import type { H3Event } from "h3" // 显式引入类型
import jwt from "jsonwebtoken"

// 注意：在 server/utils 下，通常不需要在函数外层获取 config
// 最好在函数内部获取，或者确保该文件只在运行时被调用

/**
 * 获取密钥的辅助函数
 * 确保密钥存在，否则抛出异常
 */
function getSecret(): string {
  const config = useRuntimeConfig()
  const secret = config.jwtSecret

  if (!secret) {
    throw new Error("JWT_SECRET 未在 nuxt.config.ts 中配置")
  }
  return secret as string
}

export function generateToken(payload: AuthTokenPayload): string {
  const secret = getSecret()
  return jwt.sign(payload, secret, { expiresIn: "7d" })
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    const secret = getSecret()
    const decoded = jwt.verify(token, secret)

    // 类型守卫：确保解析出的内容符合 AuthTokenPayload 结构
    if (
      typeof decoded === "object"
      && decoded !== null
      && "userId" in decoded
      && "email" in decoded
    ) {
      return decoded as AuthTokenPayload
    }
    return null
  }
  catch {
    return null
  }
}

/**
 * 从请求中提取 Token
 * 显式使用 H3Event 类型，更规范
 */
export function extractToken(event: H3Event): string | null {
  // 方式1: 从 Authorization header 获取
  const authHeader = getHeader(event, "authorization")
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7)
  }

  // 方式2: 从 Cookie 获取
  const cookies = parseCookies(event)
  return cookies.token || null
}
