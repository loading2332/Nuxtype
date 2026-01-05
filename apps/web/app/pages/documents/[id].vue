<script setup lang="ts">
import type { ApiResponse, Document } from "@nuxtype/shared"
import { useDebounceFn } from "@vueuse/core"
import Skeleton from "@/components/ui/skeleton/Skeleton.vue"
import { useToast } from "@/components/ui/toast/use-toast"

const TiptapEditor = defineAsyncComponent(() => import("@/components/editor/TiptapEditor.vue"))

definePageMeta({
  layout: "app",
})

const route = useRoute()
const docId = route.params.id as string
const { toast } = useToast()

// 1. Fetch Document (NON-BLOCKING - 页面立即渲染)
const { data: response, error, status } = useLazyFetch<ApiResponse<Document>>(`/api/documents/${docId}`)

// 响应式文档内容
const document = computed(() => response.value?.data)
const content = ref<Record<string, unknown>>({})
const isSaving = ref(false)

// 当数据加载完成后，初始化 content
watch(document, (doc) => {
  if (doc?.content) {
    content.value = doc.content as unknown as Record<string, unknown>
  }
}, { immediate: true })

// 2. Auto-Save Logic
const saveDocument = useDebounceFn(async (newContent: Record<string, unknown>) => {
  if (!document.value)
    return // 文档未加载完成时不保存

  isSaving.value = true
  try {
    await $fetch(`/api/documents/${docId}`, {
      method: "PUT",
      body: {
        title: document.value.title,
        content: newContent,
      },
    })
  }
  catch {
    toast({
      title: "Error",
      description: "Failed to save document",
      variant: "destructive",
    })
  }
  finally {
    setTimeout(() => {
      isSaving.value = false
    }, 500)
  }
}, 1000)

// Watch for changes from Editor
watch(content, (newVal) => {
  if (document.value) {
    saveDocument(newVal)
  }
})

useHead({
  title: computed(() => document.value ? `${document.value.title} - Nuxtype` : "Loading..."),
})
</script>

<template>
  <div class="max-w-4xl mx-auto py-8 px-4 h-full flex flex-col">
    <!-- Error State -->
    <div v-if="error" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-destructive mb-2">
          Document Not Found
        </h2>
        <p class="text-muted-foreground">
          The document you're looking for doesn't exist or you don't have access.
        </p>
        <NuxtLink to="/documents" class="text-primary hover:underline mt-4 inline-block">
          ← Back to Documents
        </NuxtLink>
      </div>
    </div>

    <!-- Loading State -->
    <template v-else-if="status === 'pending'">
      <div class="flex items-center justify-between mb-4">
        <Skeleton class="h-4 w-16" />
      </div>
      <div class="flex-1 min-h-0 bg-card rounded-lg border shadow-sm p-6 space-y-4">
        <Skeleton class="h-10 w-3/4" />
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-4 w-2/3" />
        <Skeleton class="h-4 w-5/6" />
      </div>
    </template>

    <!-- Loaded State -->
    <template v-else-if="document">
      <!-- Header / Status -->
      <div class="flex items-center justify-between mb-4">
        <div class="text-sm text-muted-foreground">
          <span v-if="isSaving">Saving...</span>
          <span v-else>Saved</span>
        </div>
      </div>

      <!-- Editor -->
      <div class="flex-1 min-h-0 bg-card rounded-lg border shadow-sm p-2 overflow-y-auto">
        <ClientOnly>
          <TiptapEditor v-model="content" />
          <template #fallback>
            <div class="p-4 space-y-4">
              <Skeleton class="h-8 w-3/4" />
              <Skeleton class="h-4 w-full" />
              <Skeleton class="h-4 w-full" />
              <Skeleton class="h-4 w-2/3" />
            </div>
          </template>
        </ClientOnly>
      </div>
    </template>
  </div>
</template>
