import type { ApiResponse, CreateDocumentRequest, Document } from "@nuxtype/shared"
import { useToast } from "@/components/ui/toast/use-toast"

export function useDocuments() {
  const { toast } = useToast()

  // 使用 key 确保在 Layout 和 Page 之间共享数据缓存
  const { data: response, refresh, status, error } = useFetch<ApiResponse<Document[]>>("/api/documents", {
    key: "user-documents",
    // 客户端导航时，如果已有数据，稍微延迟后再后台刷新，或者是只在数据过期时刷新
    // 这里简单起见，利用 key 复用状态，避免并发重复请求
    dedupe: "defer",
  })

  const documents = computed(() => response.value?.data || [])
  const isLoading = computed(() => status.value === "pending")

  const createDocument = async (title = "Untitled Document") => {
    try {
      const payload: CreateDocumentRequest = { title }
      const data = await $fetch<ApiResponse<Document>>("/api/documents", {
        method: "POST",
        body: payload,
      })

      if (data.success && data.data) {
        toast({ title: "Success", description: "Document created successfully" })
        // 刷新列表
        await refresh()
        return data.data
      }
    }
    catch (err: unknown) {
      const error = err as { data?: { message?: string }, message?: string }
      const message = error.data?.message || error.message || "Failed to create document"
      toast({ title: "Error", description: message, variant: "destructive" })
      return null
    }
  }

  const deleteDocument = async (id: string) => {
    try {
      await $fetch(`/api/documents/${id}`, { method: "DELETE" })
      toast({ title: "Success", description: "Document deleted successfully" })
      await refresh() // 刷新列表
      return true
    }
    catch (err: unknown) {
      const error = err as { data?: { message?: string }, message?: string }
      const message = error.data?.message || error.message || "Failed to delete document"
      toast({ title: "Error", description: message, variant: "destructive" })
      return false
    }
  }

  const updateDocument = async (id: string, payload: Partial<CreateDocumentRequest>) => {
    try {
      const data = await $fetch<ApiResponse<Document>>(`/api/documents/${id}`, {
        method: "PUT",
        body: payload,
      })

      if (data.success && data.data) {
        // 手动更新本地列表缓存，实现无刷新同步
        if (response.value?.data) {
          const index = response.value.data.findIndex(d => d.id === id)
          if (index !== -1) {
            // 合并更新，保持列表中的其他字段（如 createdAt）不变
            response.value.data[index] = { ...response.value.data[index], ...data.data }
          }
        }
        return data.data
      }
    }
    catch (err: unknown) {
      const error = err as { data?: { message?: string }, message?: string }
      const message = error.data?.message || error.message || "Failed to update document"
      toast({ title: "Error", description: message, variant: "destructive" })
      throw err // 重新抛出错误供调用者处理（如防抖逻辑）
    }
  }

  return {
    documents,
    isLoading,
    error,
    refresh,
    createDocument,
    deleteDocument,
    updateDocument,
  }
}
