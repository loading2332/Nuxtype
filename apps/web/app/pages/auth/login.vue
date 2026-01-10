<script setup lang="ts">
import { ref } from "vue"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/toast/use-toast"

const { login } = useAuth()
const { toast } = useToast()

definePageMeta({
  middleware: "guest",
})

const email = ref("")
const password = ref("")
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  try {
    await login(email.value, password.value)
  }
  catch (e: unknown) {
    const message = e instanceof Error ? e.message : "未知错误"
    toast({
      title: "错误",
      description: message,
      variant: "destructive",
    })
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-[80vh]">
    <Card class="w-[350px]">
      <CardHeader>
        <CardTitle>登录</CardTitle>
        <CardDescription>
          欢迎回来，请登录您的账户
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleLogin">
          <div class="grid w-full items-center gap-4">
            <div class="flex flex-col space-y-1.5">
              <Label html-for="email">邮箱</Label>
              <Input id="email" v-model="email" type="email" placeholder="name@example.com" />
            </div>
            <div class="flex flex-col space-y-1.5">
              <Label html-for="password">密码</Label>
              <Input id="password" v-model="password" type="password" />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter class="flex flex-col gap-4">
        <Button class="w-full" :disabled="loading" @click="handleLogin">
          {{ loading ? '登录中...' : '登录' }}
        </Button>
        <div class="text-sm text-muted-foreground text-center">
          还没有账户？ <NuxtLink to="/auth/register" class="text-primary hover:underline">
            去注册
          </NuxtLink>
        </div>
      </CardFooter>
    </Card>
  </div>
</template>
