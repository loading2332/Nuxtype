/**
 * 数据库连接工具
 * 使用 Drizzle ORM + PostgreSQL
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

// 创建 PostgreSQL 连接
// 默认使用 10 个连接，适合 VPS/容器部署
// 如果部署到 Serverless (如 Vercel)，请在环境变量中设置 NUXT_DB_MAX_CONNECTIONS=1
const maxConnections = Number(process.env.NUXT_DB_MAX_CONNECTIONS) || 10
const client = postgres(connectionString, { max: maxConnections })

// 创建 Drizzle 实例，传入 schema 以获得类型支持
export const db = drizzle(client, { schema })
