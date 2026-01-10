<script setup lang="ts">
import { ref } from "vue"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/toast/use-toast"

const { register } = useAuth()
const { toast } = useToast()

definePageMeta({
  middleware: "guest",
})

const email = ref("")
const password = ref("")
const confirmPassword = ref("")
const loading = ref(false)

async function handleRegister() {
  if (password.value !== confirmPassword.value) {
    toast({
      title: "验证失败",
      description: "两次输入的密码不一致",
      variant: "destructive",
    })
    return
  }

  loading.value = true
  try {
    await register(email.value, password.value)
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
        <CardTitle>注册</CardTitle>
        <CardDescription>
          创建一个新账户开始协作
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleRegister">
          <div class="grid w-full items-center gap-4">
            <div class="flex flex-col space-y-1.5">
              <Label html-for="email">邮箱</Label>
              <Input id="email" v-model="email" type="email" placeholder="name@example.com" />
            </div>
            <div class="flex flex-col space-y-1.5">
              <Label html-for="password">密码</Label>
              <Input id="password" v-model="password" type="password" />
            </div>
            <div class="flex flex-col space-y-1.5">
              <Label html-for="confirmPassword">确认密码</Label>
              <Input id="confirmPassword" v-model="confirmPassword" type="password" />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter class="flex flex-col gap-4">
        <Button class="w-full" :disabled="loading" @click="handleRegister">
          {{ loading ? '注册中...' : '注册' }}
        </Button>
        <div class="text-sm text-muted-foreground text-center">
          已有账户？ <NuxtLink to="/auth/login" class="text-primary hover:underline">
            去登录
          </NuxtLink>
        </div>
      </CardFooter>
    </Card>
  </div>
</template>
