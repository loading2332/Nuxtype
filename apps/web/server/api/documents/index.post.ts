import { CreateDocumentSchema, documents } from "@nuxtype/shared"
import { requireAuth } from "../../utils/auth"
import { db } from "../../utils/db"

export default defineEventHandler(async (event) => {
  // 1. 验证请求体
  const body = await readValidatedBody(event, CreateDocumentSchema.parse)

  // 2. 认证用户
  const user = requireAuth(event)

  // 3. 插入文档
  const newDoc = await db.insert(documents).values({
    userId: user.userId,
    title: body.title,
    content: body.content,
  }).returning()

  return {
    success: true,
    data: newDoc[0],
  }
})
