import { documents } from "@nuxtype/shared"
import { and, eq } from "drizzle-orm"
import { requireAuth } from "../../utils/auth"
import { db } from "../../utils/db"

export default defineEventHandler(async (event) => {
  // 使用工具函数进行认证
  const user = requireAuth(event)

  const documentId = getRouterParam(event, "id")
  if (!documentId) {
    throw createError({ statusCode: 400, message: "Missing document ID" })
  }

  const result = await db
    .delete(documents)
    .where(and(eq(documents.userId, user.userId), eq(documents.id, documentId)))
    .returning()

  if (result.length === 0) {
    throw createError({ statusCode: 404, message: "Document not found" })
  }

  return {
    success: true,
  }
})
