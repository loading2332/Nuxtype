import type { Buffer } from "node:buffer"
import { randomUUID } from "node:crypto"
import process from "node:process"
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

const MIME_TYPE_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
}

interface R2Config {
  bucketName: string
  publicDomain: string
  endpoint: string
  accessKeyId: string
  secretAccessKey: string
}

function getR2Config(): R2Config {
  // Use process.env directly since nuxt.config.ts might not be loading it in time for runtimeConfig
  const bucketName = process.env.R2_BUCKET_NAME
  const publicDomain = process.env.R2_PUBLIC_DOMAIN
  const endpoint = process.env.R2_ENDPOINT
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!bucketName || !publicDomain || !endpoint || !accessKeyId || !secretAccessKey) {
    console.error("Missing R2 Configuration", { bucketName, publicDomain, endpoint })
    throw createError({
      statusCode: 500,
      message: "Server storage configuration error",
    })
  }

  return { bucketName, publicDomain, endpoint, accessKeyId, secretAccessKey }
}

function createR2Client(config: R2Config) {
  return new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })
}

/**
 * Upload an image to R2 Bucket
 * @param fileBuffer The raw file buffer
 * @param mimeType The mime type of the file (e.g. image/png)
 * @param userId The ID of the uploading user (for path isolation)
 */
export async function uploadImage(fileBuffer: Buffer, mimeType: string, userId: number | string) {
  const config = getR2Config()

  // Validate Extension Mapping
  const ext = MIME_TYPE_MAP[mimeType]
  if (!ext) {
    throw createError({
      statusCode: 400,
      message: `Unsupported file type: ${mimeType}`,
    })
  }

  // Generate Secure Key: images/{userId}/{uuid}.{ext}
  const filename = `${randomUUID()}.${ext}`
  const key = `images/${userId}/${filename}`

  try {
    const client = createR2Client(config)

    // Upload to R2 with Cache-Control
    await client.send(new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      // Aggressive caching: Public, 1 year, immutable
      CacheControl: "public, max-age=31536000, immutable",
    }))

    // Construct Public URL
    // Ensure publicDomain does not have trailing slash
    const domain = config.publicDomain.replace(/\/$/, "")
    const url = `${domain}/${key}`

    return { key, url }
  }
  catch (error) {
    console.error("R2 Upload Error:", error)
    // Hide upstream error details from client
    throw createError({
      statusCode: 502,
      message: "Failed to upload image to storage provider",
    })
  }
}

/**
 * Delete an image from R2 Bucket
 * @param imageUrl The public URL of the image to delete
 */
export async function deleteImage(imageUrl: string) {
  const config = getR2Config()

  // Extract key from URL: https://domain.com/images/userId/filename.ext -> images/userId/filename.ext
  const domain = config.publicDomain.replace(/\/$/, "")
  if (!imageUrl.startsWith(domain)) {
    throw createError({
      statusCode: 400,
      message: "Invalid image URL - not from this storage",
    })
  }

  const key = imageUrl.replace(`${domain}/`, "")

  try {
    const client = createR2Client(config)

    await client.send(new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    }))

    return { success: true, key }
  }
  catch (error) {
    console.error("R2 Delete Error:", error)
    throw createError({
      statusCode: 502,
      message: "Failed to delete image from storage provider",
    })
  }
}
