/**
 * 用户注册接口
 * POST /api/register
 */

import type { ApiResponse } from "@nuxtype/shared"
import { RegisterSchema, users } from "@nuxtype/shared"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "../utils/db"

export default defineEventHandler(async (event) => {
  try {
    // 1. 获取请求体数据并验证
    const body = await readValidatedBody(event, RegisterSchema.parse)
    const { email, password } = body

    // 2. 检查邮箱是否已被注册
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existingUser.length > 0) {
      throw createError({
        statusCode: 400,
        message: "该邮箱已被注册",
      })
    }

    // 3. 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 4. 插入数据库
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
      })
      .returning({
        id: users.id,
        email: users.email,
        createdAt: users.createdAt,
      })

    // 5. 返回成功响应
    return {
      success: true,
      data: {
        user: newUser,
      },
      message: "注册成功",
    } satisfies ApiResponse
  }
  catch (error: unknown) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: error.issues[0].message,
      })
    }
    throw error
  }
})
