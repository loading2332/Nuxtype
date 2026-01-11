/**
 * Hocuspocus 实时协同服务
 * 基于 Y.js CRDT 实现多人实时编辑
 */
import process from "node:process"
import { Database } from "@hocuspocus/extension-database"
import { Server } from "@hocuspocus/server"
import jwt from "jsonwebtoken"
import postgres from "postgres"

// 环境变量
const PORT = Number(process.env.COLLAB_PORT) || 1234
const DATABASE_URL = process.env.DATABASE_URL
const JWT_SECRET = process.env.JWT_SECRET

if (!DATABASE_URL || !JWT_SECRET) {
  console.error("Missing required environment variables: DATABASE_URL, JWT_SECRET")
  process.exit(1)
}

// 数据库连接
const sql = postgres(DATABASE_URL)

// JWT Payload 类型
interface AuthTokenPayload {
  userId: string
  email: string
}

// Hocuspocus 服务器配置
const server = Server.configure({
  port: PORT,

  /**
   * 认证钩子 - 验证 JWT Token
   */
  async onAuthenticate({ token, documentName }) {
    if (!token) {
      throw new Error("No authentication token provided")
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET) as AuthTokenPayload

      // 验证用户对文档的访问权限
      const [doc] = await sql`
        SELECT id, user_id FROM documents
        WHERE id = ${documentName} AND user_id = ${payload.userId}
      `

      if (!doc) {
        throw new Error("Document not found or access denied")
      }

      console.log(`[Auth] User ${payload.email} joined document ${documentName}`)

      return {
        user: {
          id: payload.userId,
          email: payload.email,
        },
      }
    }
    catch (error) {
      console.error("[Auth] Failed:", error)
      throw new Error("Invalid token")
    }
  },

  /**
   * 连接关闭钩子
   */
  async onDisconnect({ documentName, context }) {
    console.log(`[Disconnect] User left document ${documentName}`)
  },

  extensions: [
    /**
     * 数据库持久化扩展
     * 使用 PostgreSQL 存储 Y.js 状态
     */
    new Database({
      /**
       * 加载文档 - 从数据库读取 Y.js 状态
       */
      async fetch({ documentName }) {
        const [doc] = await sql`
          SELECT yjs_state FROM documents WHERE id = ${documentName}
        `

        if (doc?.yjs_state) {
          console.log(`[DB] Loaded document ${documentName}`)
          return doc.yjs_state
        }

        console.log(`[DB] No saved state for ${documentName}`)
        return null
      },

      /**
       * 保存文档 - 将 Y.js 状态写入数据库
       */
      async store({ documentName, state }) {
        await sql`
          UPDATE documents
          SET yjs_state = ${state}, updated_at = NOW()
          WHERE id = ${documentName}
        `
        console.log(`[DB] Saved document ${documentName}`)
      },
    }),
  ],
})

// 启动服务
server.listen()
console.log(`
🚀 Hocuspocus Server running on port ${PORT}
📝 WebSocket URL: ws://localhost:${PORT}
`)
