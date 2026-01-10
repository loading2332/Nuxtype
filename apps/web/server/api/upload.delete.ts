export default defineEventHandler(async (event) => {
  // 1. Auth Check: Ensure user is logged in
  const user = requireAuth(event)

  // 2. Parse request body
  const body = await readBody<{ url: string }>(event)

  if (!body?.url || typeof body.url !== "string") {
    throw createError({
      statusCode: 400,
      message: "Missing or invalid image URL",
    })
  }

  // 3. Validate that the URL belongs to this user's folder
  // URL format: https://domain.com/images/{userId}/{filename}
  const urlPattern = new RegExp(`/images/${user.userId}/`)
  if (!urlPattern.test(body.url)) {
    throw createError({
      statusCode: 403,
      message: "You can only delete your own images",
    })
  }

  // 4. Delete from R2
  const result = await deleteImage(body.url)

  return {
    ...result,
  }
})
