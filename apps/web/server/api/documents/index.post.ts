import type { CreateDocumentRequest } from "@nuxtype/shared"

import { documents } from "@nuxtype/shared"

import { db } from "../../utils/db"

import { extractToken, verifyToken } from "../../utils/jwt"

export default defineEventHandler(async (event) => {
  const body = await readBody<CreateDocumentRequest>(event)
  const token = extractToken(event)
  if (token == null || !token) {
    throw createError({ statusCode: 401 })
  }
  const user = verifyToken(token)
  if (!user) {
    throw createError({ statusCode: 401 })
  }
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
