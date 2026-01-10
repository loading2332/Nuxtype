import { documents } from "@nuxtype/shared"
import { desc, eq } from "drizzle-orm"
import { requireAuth } from "../../utils/auth"
import { db } from "../../utils/db"

export default defineEventHandler(async (event) => {
  // 使用工具函数进行认证
  const user = requireAuth(event)

  const docs = await db
    .select()
    .from(documents)
    .where(eq(documents.userId, user.userId))
    .orderBy(desc(documents.createdAt))

  return {
    success: true,
    data: docs,
  }
})
