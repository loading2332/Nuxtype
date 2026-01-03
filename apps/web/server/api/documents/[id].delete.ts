import { documents } from "@nuxtype/shared"
import { and, eq } from "drizzle-orm"
import { db } from "../../utils/db"
import { extractToken, verifyToken } from "../../utils/jwt"

export default defineEventHandler(async (event) => {
  const token = extractToken(event)
  if (!token)
    throw createError({ statusCode: 401 })

  const user = verifyToken(token)
  if (!user)
    throw createError({ statusCode: 401 })

  const documentId = getRouterParam(event, "id")
  if (!documentId)
    throw createError({ statusCode: 400 })

  const result = await db
    .delete(documents)
    .where(and(eq(documents.userId, user.userId), eq(documents.id, documentId)))
    .returning()

  if (result.length === 0)
    throw createError({ statusCode: 404 })

  return {
    success: true,
  }
})
