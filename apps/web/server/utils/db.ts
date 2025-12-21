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
// max: 1 表示每个服务器实例只使用一个连接（适合 serverless）
const client = postgres(connectionString, { max: 1 })

// 创建 Drizzle 实例，传入 schema 以获得类型支持
export const db = drizzle(client, { schema })
