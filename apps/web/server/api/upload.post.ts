export default defineEventHandler(async (event) => {
  // 1. Auth Check: Ensure user is logged in
  const user = requireAuth(event)

  // 2. Content-Length Check (Fail fast before parsing)
  // Limit to 6MB (5MB file + multipart overhead)
  const MAX_PAYLOAD_SIZE = 6 * 1024 * 1024
  const contentLength = Number(getRequestHeader(event, "content-length"))
  if (contentLength > MAX_PAYLOAD_SIZE) {
    throw createError({ statusCode: 413, message: "Payload too large (Max 5MB)" })
  }

  // 3. Parse Multipart Data
  const files = await readMultipartFormData(event)
  if (!files || files.length === 0) {
    throw createError({ statusCode: 400, message: "No file uploaded" })
  }

  // Restriction: Single file upload for now
  if (files.length > 1) {
    throw createError({ statusCode: 400, message: "Multiple file upload not supported" })
  }

  const file = files[0]

  // 4. Validate Precise File Size
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  if (file.data.length > MAX_FILE_SIZE) {
    throw createError({ statusCode: 413, message: "File exceeds 5MB limit" })
  }

  // 5. Validate MIME Type
  // Must be consistent with r2.ts whitelist
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
  if (!file.type || !ALLOWED_TYPES.includes(file.type)) {
    throw createError({
      statusCode: 400,
      message: "Invalid file type. Only JPEG, PNG, WEBP, GIF allowed.",
    })
  }

  // 6. Upload to R2 (auto-imported from server/utils/r2.ts)
  // Calling uploadImage with buffer, mimeType, and userId
  const result = await uploadImage(file.data, file.type, user.userId)

  return {
    success: true,
    ...result,
  }
})
