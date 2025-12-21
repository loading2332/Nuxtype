/**
 * 用户登录接口
 * POST /api/login
 *
 * 功能：
 * 1. 验证用户输入
 * 2. 查询用户是否存在
 * 3. 验证密码
 * 4. 生成 JWT Token
 * 5. 返回 Token 和用户信息
 */

import type { ApiResponse } from "@nuxtype/shared"
import { users } from "@nuxtype/shared"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "../utils/db"
import { generateToken } from "../utils/jwt"

// 定义登录数据的验证规则
const loginSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(1, "密码不能为空"),
})

export default defineEventHandler(async (event) => {
  try {
    // 1. 获取请求体数据
    const body = await readBody(event)

    // 2. 验证数据格式
    const validatedData = loginSchema.parse(body)

    // 3. 查询用户
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1)

    if (!user) {
      // 用户不存在
      throw createError({
        statusCode: 401,
        message: "邮箱或密码错误",
      })
    }

    // 4. 验证密码
    const isPasswordValid = await bcrypt.compare(
      validatedData.password,
      user.password,
    )

    if (!isPasswordValid) {
      // 密码错误
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

    // 6. 返回成功响应（不返回密码！）
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
    // 处理 zod 验证错误
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: error.issues[0].message,
      })
    }

    // 其他错误直接抛出
    throw error
  }
})
