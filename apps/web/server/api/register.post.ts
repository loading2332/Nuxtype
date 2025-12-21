/**
 * 用户注册接口
 * POST /api/register
 *
 * 功能：
 * 1. 验证用户输入（email 格式、密码长度）
 * 2. 检查邮箱是否已被注册
 * 3. 加密密码
 * 4. 保存到数据库
 * 5. 返回成功响应
 */

import type { ApiResponse } from "@nuxtype/shared"
import { users } from "@nuxtype/shared"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "../utils/db"

// 定义注册数据的验证规则
const registerSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(6, "密码至少6位").max(100, "密码最多100位"),
})

export default defineEventHandler(async (event) => {
  try {
    // 1. 获取请求体数据
    const body = await readBody(event)

    // 2. 验证数据格式
    const validatedData = registerSchema.parse(body)

    // 3. 检查邮箱是否已被注册
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1)

    if (existingUser.length > 0) {
      // 如果用户已存在，返回错误
      throw createError({
        statusCode: 400,
        message: "该邮箱已被注册",
      })
    }

    // 4. 加密密码
    // bcrypt.hash(密码, 加密轮数)
    // 轮数越大越安全，但也越慢，10 是常用值
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    // 5. 插入数据库
    const [newUser] = await db
      .insert(users)
      .values({
        email: validatedData.email,
        password: hashedPassword,
      })
      .returning({
        id: users.id,
        email: users.email,
        createdAt: users.createdAt,
      })

    // 6. 返回成功响应（不返回密码！）
    return {
      success: true,
      data: {
        user: newUser,
      },
      message: "注册成功",
    } satisfies ApiResponse
  }
  catch (error: unknown) {
    // 处理 zod 验证错误
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: error.issues[0].message, // 返回第一个验证错误
      })
    }

    // 其他错误直接抛出
    throw error
  }
})
