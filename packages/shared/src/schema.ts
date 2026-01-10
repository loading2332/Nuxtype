import { boolean, customType, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core"

/**
 * PostgreSQL bytea 类型 - 用于存储 Y.js 二进制状态
 */
const bytea = customType<{ data: Uint8Array | null }>({
  dataType() {
    return "bytea"
  },
})

/**
 * 用户表 - 存储认证信息
 */
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

/**
 * 文档表 - 核心内容存储
 * content 字段使用 JSONB 直接存储 Tiptap 的 JSON 文档树
 * yjsState 字段使用 bytea 存储 Y.js 协同编辑状态
 */
export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).default("Untitled").notNull(),
  content: jsonb("content").default({ type: "doc", content: [] }).notNull(),
  yjsState: bytea("yjs_state"), // Y.js 协同状态
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
