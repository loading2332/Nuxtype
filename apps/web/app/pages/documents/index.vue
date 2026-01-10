<script setup lang="ts">
import { Loader2, Plus, Trash } from "lucide-vue-next"
import { useDocuments } from "@/composables/useDocuments"

// 页面元数据
useHead({
  title: "Documents - Nuxtype",
})
definePageMeta({
  layout: "app",
})

// 状态管理
const { documents, createDocument, deleteDocument } = useDocuments()
const isLoading = ref(false) // 用于按钮 Loading 状态

/**
 * 创建新文档
 */
async function handleCreate() {
  isLoading.value = true
  const newDoc = await createDocument()
  if (newDoc) {
    await navigateTo(`/documents/${newDoc.id}`)
  }
  isLoading.value = false
}

/**
 * 删除逻辑（优化后：全局弹窗）
 */
const isDeleteDialogOpen = ref(false)
const deleteId = ref<string | null>(null)

function openDeleteDialog(id: string) {
  deleteId.value = id
  isDeleteDialogOpen.value = true
}

async function confirmDelete() {
  if (!deleteId.value)
    return

  isLoading.value = true
  await deleteDocument(deleteId.value)
  isDeleteDialogOpen.value = false
  deleteId.value = null
  isLoading.value = false
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
        <CardFooter>
          <!-- 触发器：只负责打开全局弹窗 -->
          <Button
            variant="ghost"
            size="icon"
            @click.stop="openDeleteDialog(doc.id)"
          >
            <Trash class="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </Button>
        </CardFooter>
      </Card>
      <Card v-if="documents.length === 0" class="flex flex-col items-center justify-center h-[200px] border-dashed bg-muted/50">
        <p class="text-sm text-muted-foreground">
          No documents found. Create one to get started.
        </p>
      </Card>

      <!-- 全局删除确认框 -->
      <AlertDialog :open="isDeleteDialogOpen" @update:open="(v) => isDeleteDialogOpen = v">
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your document.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel @click="isDeleteDialogOpen = false">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              @click="confirmDelete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  </div>
</template>
