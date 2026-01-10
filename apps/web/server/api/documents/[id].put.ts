import type { DocumentContent } from "@nuxtype/shared"
import { documents, UpdateDocumentSchema } from "@nuxtype/shared"
import { and, eq } from "drizzle-orm"
import { requireAuth } from "../../utils/auth"
import { db } from "../../utils/db"

export default defineEventHandler(async (event) => {
  // 1. 认证用户
  const user = requireAuth(event)

  // 2. 获取文档 ID
  const documentId = getRouterParam(event, "id")
  if (!documentId) {
    throw createError({ statusCode: 400, message: "Missing document ID" })
  }

  // 3. 验证请求体
  const body = await readValidatedBody(event, UpdateDocumentSchema.parse)

  // 4. 准备更新数据
  const updateData: Partial<typeof documents.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (body.title !== undefined)
    updateData.title = body.title
  if (body.content !== undefined)
    updateData.content = body.content as unknown as DocumentContent

  // 5. 执行更新 (确保所有权)
  const result = await db
    .update(documents)
    .set(updateData)
    .where(
      and(
        eq(documents.id, documentId),
        eq(documents.userId, user.userId), // Ensure ownership
      ),
    )
    .returning()

  if (result.length === 0) {
    throw createError({ statusCode: 404, message: "Document not found or unauthorized" })
  }

  return {
    success: true,
    data: result[0],
  }
})
