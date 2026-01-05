import type { DocumentContent, UpdateDocumentRequest } from "@nuxtype/shared"
import { documents } from "@nuxtype/shared"
import { and, eq } from "drizzle-orm"
import { db } from "../../utils/db"
import { extractToken, verifyToken } from "../../utils/jwt"

export default defineEventHandler(async (event) => {
  // 1. Auth Check
  const token = extractToken(event)
  if (!token) {
    throw createError({ statusCode: 401, message: "Unauthorized" })
  }
  const user = verifyToken(token)
  if (!user) {
    throw createError({ statusCode: 401, message: "Unauthorized" })
  }

  // 2. Parse ID and Body
  const documentId = getRouterParam(event, "id")
  if (!documentId) {
    throw createError({ statusCode: 400, message: "Missing document ID" })
  }

  const body = await readBody<UpdateDocumentRequest>(event)

  // 3. Prepare Update Data
  const updateData: Partial<typeof documents.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (body.title !== undefined)
    updateData.title = body.title
  if (body.content !== undefined)
    updateData.content = body.content as unknown as DocumentContent // Cast for Drizzle
  if (body.isPublic !== undefined)
    updateData.isPublic = body.isPublic

  // 4. Execute Update (with Ownership Check)
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
