<script setup lang="ts">
import { Toaster } from "@/components/ui/toast"
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
            文档
          </NuxtLink>
          <div class="flex items-center gap-2">
            <NuxtLink to="/auth/login" class="hover:text-primary transition-colors">
              登录
            </NuxtLink>
            <NuxtLink to="/auth/register" class="hover:text-primary transition-colors">
              注册
            </NuxtLink>
          </div>
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
