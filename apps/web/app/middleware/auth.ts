/**
 * Auth 中间件
 * 保护需要登录才能访问的页面
 * 未登录用户将被重定向到登录页
 */
export default defineNuxtRouteMiddleware(() => {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated.value) {
    return navigateTo("/auth/login")
  }
})
