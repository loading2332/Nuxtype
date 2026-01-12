import { documents } from "@nuxtype/shared"
import { and, eq, sql } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  // 1. 认证检查：确保用户已登录
  const user = requireAuth(event)

  // 2. 解析请求体
  const body = await readBody<{ url: string }>(event)

  if (!body?.url || typeof body.url !== "string") {
    throw createError({
      statusCode: 400,
      message: "缺少或无效的图片 URL",
    })
  }

  const imageUrl = body.url

  // 3. 验证 URL 格式（第一层防护）
  // URL 格式: https://domain.com/images/{userId}/{filename}
  const urlPattern = new RegExp(`/images/${user.userId}/`)
  if (!urlPattern.test(imageUrl)) {
    throw createError({
      statusCode: 403,
      message: "您只能删除自己上传的图片",
    })
  }

  // 4. 数据库验证：确保图片在用户的文档中被使用（第二层防护）
  // 查询用户的所有文档，检查图片 URL 是否在任何文档的 content 中
  const userDocuments = await db
    .select({
      id: documents.id,
      content: documents.content,
    })
    .from(documents)
    .where(
      and(
        eq(documents.userId, user.userId),
        // 使用 PostgreSQL 的 JSONB 查询，检查 content 中是否包含该图片 URL
        sql`${documents.content}::text LIKE ${`%${imageUrl}%`}`,
      ),
    )

  // 如果没有找到任何文档使用这张图片，拒绝删除
  if (userDocuments.length === 0) {
    throw createError({
      statusCode: 403,
      message: "无法删除：该图片不在您的任何文档中，或您没有权限",
    })
  }

  // 5. 从 R2 删除图片
  const result = await deleteImage(imageUrl)

  return {
    ...result,
    success: true,
    message: "图片删除成功",
    documentsAffected: userDocuments.length,
  }
})
