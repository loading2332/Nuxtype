<script setup lang="ts">
import { Toaster } from "@/components/ui/toast"
import { useToast } from "@/components/ui/toast/use-toast"

const token = useCookie("token")
const isAuthenticated = computed(() => !!token.value)
const { toast } = useToast()

async function handleLogout() {
  token.value = null
  toast({
    title: "Logged out",
    description: "You have been successfully logged out.",
  })
  await navigateTo("/auth/login")
}
</script>

<template>
  <div class="min-h-screen bg-background font-sans antialiased">
    <header class="border-b">
      <div class="container h-16 flex items-center justify-between px-4">
        <NuxtLink to="/" class="font-bold text-xl">
          Nuxtype
        </NuxtLink>
        <nav class="flex items-center gap-4 text-sm">
          <NuxtLink to="/documents" class="hover:text-primary transition-colors">
            Documents
          </NuxtLink>

          <template v-if="!isAuthenticated">
            <div class="flex items-center gap-2">
              <NuxtLink to="/auth/login" class="hover:text-primary transition-colors">
                Login
              </NuxtLink>
              <NuxtLink to="/auth/register" class="hover:text-primary transition-colors">
                Register
              </NuxtLink>
            </div>
          </template>

          <template v-else>
            <Button variant="ghost" size="sm" @click="handleLogout">
              Logout
            </Button>
          </template>
        </nav>
      </div>
    </header>
    <main class="container py-6">
      <slot />
    </main>
    <div class="fixed bottom-0 right-0 p-4">
      <Toaster />
    </div>
  </div>
</template>
