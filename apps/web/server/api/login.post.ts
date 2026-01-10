/**
 * 用户登录接口
 * POST /api/login
 */

import type { ApiResponse } from "@nuxtype/shared"
import { LoginSchema, users } from "@nuxtype/shared"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "../utils/db"
import { generateToken } from "../utils/jwt"

export default defineEventHandler(async (event) => {
  try {
    // 1. 获取请求体数据并验证
    const body = await readValidatedBody(event, LoginSchema.parse)
    const { email, password } = body

    // 2. 查询用户
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (!user) {
      throw createError({
        statusCode: 401,
        message: "邮箱或密码错误",
      })
    }

    // 4. 验证密码
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password,
    )

    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        message: "邮箱或密码错误",
      })
    }

    // 5. 生成 JWT Token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    })

    // 6. 返回成功响应
    return {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          avatar: user.avatar,
          createdAt: user.createdAt,
        },
      },
      message: "登录成功",
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
