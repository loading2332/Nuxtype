<script setup lang="ts">
import type { ApiResponse, CreateDocumentRequest, Document } from "@nuxtype/shared"
import { Loader2, Plus } from "lucide-vue-next"
import { useToast } from "@/components/ui/toast/use-toast"
import Card from "~/components/ui/card/Card.vue"

// 页面元数据
useHead({
  title: "Documents - Nuxtype",
})

// 状态管理
const isLoading = ref(false)
const { toast } = useToast()
const { data: response, refresh } = await useFetch<ApiResponse<Document[]>>("/api/documents")
const documents = computed(() => response.value?.data || [])

/**
 * 创建新文档
 * 1. 调用 POST /api/documents
 * 2. 成功后跳转到编辑器页面
 */
async function handleCreate() {
  try {
    isLoading.value = true

    // 构造请求数据 (符合我们的类型定义)
    const payload: CreateDocumentRequest = {
      title: "Untitled Document",
    }

    const data = await $fetch("/api/documents", {
      method: "POST",
      body: payload,
    })

    // $fetch 直接返回解析后的数据 (data)，不需要 .value，也不包含 error 对象 (会直接 throw)
    // 根据后端返回 { success: true, data: ... }
    const newDoc = (data as ApiResponse<Document>).data

    if (newDoc?.id) {
      toast({
        title: "Success",
        description: "Document created successfully",
      })
      // 跳转到文档详情页 (Week 2 会实现这个页面)
      await navigateTo(`/documents/${newDoc.id}`)
    }
  }
  catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create document"
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    })
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="container py-8">
    <!-- 顶部栏：标题 + 操作按钮 -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">
          Documents
        </h1>
        <p class="text-muted-foreground mt-2">
          Create and manage your documents.
        </p>
      </div>

      <Button :disabled="isLoading" @click="handleCreate">
        <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
        <Plus v-else class="mr-2 h-4 w-4" />
        New Document
      </Button>
    </div>

    <!-- 文档列表区域 (占位符) -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card
        v-for="doc in documents"
        :key="doc.id"
        class="cursor-pointer hover:border-primary transition-colors"
        @click="navigateTo(`/documents/${doc.id}`)"
      >
        <CardHeader>
          <CardTitle>{{ doc.title }}</CardTitle>
          <CardDescription>
            Created at {{ new Date(doc.createdAt).toLocaleDateString() }}
          </CardDescription>
        </CardHeader>
      </Card>
      <Card v-if="documents.length === 0" class="flex flex-col items-center justify-center h-[200px] border-dashed bg-muted/50">
        <p class="text-sm text-muted-foreground">
          No documents found. Create one to get started.
        </p>
      </Card>
    </div>
  </div>
</template>
