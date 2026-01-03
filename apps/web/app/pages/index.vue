<script setup lang="ts">
import { Button } from "@/components/ui/button"
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-6">
    <div class="space-y-2">
      <h1 class="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-primary">
        Nuxtype
      </h1>
      <p class="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
        基于 Nuxt 4、PostgreSQL 和 Y.js 的实时协同笔记应用。
        <br>体验流畅的写作与无缝的团队协作。
      </p>
    </div>

    <div class="flex gap-4">
      <NuxtLink to="/auth/register">
        <Button size="lg">
          开始使用
        </Button>
      </NuxtLink>
      <NuxtLink to="/auth/login">
        <Button variant="outline" size="lg">
          登录账户
        </Button>
      </NuxtLink>
    </div>

    <div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-4xl">
      <div class="p-6 border rounded-lg bg-card">
        <h3 class="font-semibold mb-2">
          实时协同
        </h3>
        <p class="text-sm text-muted-foreground">
          多人同时编辑，毫秒级同步，让团队协作如临现场。
        </p>
      </div>
      <div class="p-6 border rounded-lg bg-card">
        <h3 class="font-semibold mb-2">
          Markdown 支持
        </h3>
        <p class="text-sm text-muted-foreground">
          专注于内容创作，支持标准的 Markdown 语法与快捷指令。
        </p>
      </div>
      <div class="p-6 border rounded-lg bg-card">
        <h3 class="font-semibold mb-2">
          安全可靠
        </h3>
        <p class="text-sm text-muted-foreground">
          数据加密，自动保存与历史版本回溯，数据永不丢失。
        </p>
      </div>
    </div>
  </div>
</template>
