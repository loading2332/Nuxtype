/**
 * 数据库连接工具
 * 使用 Drizzle ORM + PostgreSQL
 *
 * 自动适配 Serverless 和传统部署环境
 */
import process from "node:process"
import * as schema from "@nuxtype/shared"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

// 从环境变量获取数据库连接字符串
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL 环境变量未设置")
}

/**
 * 检测是否为 Serverless 环境
 */
function isServerlessEnvironment(): boolean {
  return !!(
    process.env.VERCEL
    || process.env.NETLIFY
    || process.env.AWS_LAMBDA_FUNCTION_NAME
    || process.env.FUNCTION_NAME // Google Cloud Functions
  )
}

/**
 * 根据环境动态配置连接池
 */
const isServerless = isServerlessEnvironment()
const maxConnections = Number(process.env.NUXT_DB_MAX_CONNECTIONS) || (isServerless ? 1 : 10)

const client = postgres(connectionString, {
  max: maxConnections,
  // Serverless: 快速释放空闲连接，避免占用
  idle_timeout: isServerless ? 1 : 20,
  // Serverless: 短生命周期，传统环境可以更长
  max_lifetime: isServerless ? 60 : 60 * 30,
  // 连接超时
  connect_timeout: 10,
  // 确保 SSL 连接 (生产环境推荐)
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})

// 创建 Drizzle 实例，传入 schema 以获得类型支持
export const db = drizzle(client, { schema })

// 日志输出当前配置 (仅开发环境)
if (process.env.NODE_ENV === "development") {
  console.warn(`[DB] 环境: ${isServerless ? "Serverless" : "传统部署"}`)
  console.warn(`[DB] 连接池大小: ${maxConnections}`)
}
