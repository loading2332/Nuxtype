import type { ApiResponse, User } from "@nuxtype/shared"
import { useToast } from "@/components/ui/toast/use-toast"

export function useAuth() {
  const token = useCookie("token")
  const { toast } = useToast()

  const isAuthenticated = computed(() => !!token.value)

  const login = async (email: string, password: string) => {
    try {
      const response = await $fetch<ApiResponse<{ token: string, user: User }>>("/api/login", {
        method: "POST",
        body: { email, password },
      })

      if (response.success && response.data) {
        token.value = response.data.token
        toast({ title: "登录成功", description: "跳转至主页面" })
        await navigateTo("/documents")
      }
    }
    catch (err: unknown) {
      const error = err as { data?: { message?: string }, message?: string }
      const message = error.data?.message || error.message || "登录失败"
      throw new Error(message)
    }
  }

  const register = async (email: string, password: string) => {
    try {
      await $fetch("/api/register", {
        method: "POST",
        body: { email, password },
      })
      toast({ title: "注册成功", description: "请登录您的账户" })
      await navigateTo("/auth/login")
    }
    catch (err: unknown) {
      const error = err as { data?: { message?: string }, message?: string }
      const message = error.data?.message || error.message || "注册失败"
      throw new Error(message)
    }
  }

  const logout = async () => {
    token.value = null
    toast({
      title: "Logged out",
      description: "See you next time!",
    })
    await navigateTo("/auth/login")
  }

  return {
    token,
    isAuthenticated,
    login,
    register,
    logout,
  }
}
