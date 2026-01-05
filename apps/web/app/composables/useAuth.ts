import { useToast } from "@/components/ui/toast/use-toast"

export function useAuth() {
  const token = useCookie("token")
  const { toast } = useToast()

  const isAuthenticated = computed(() => !!token.value)

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
    logout,
  }
}
