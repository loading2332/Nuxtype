<script setup lang="ts">
import { FileText, LogOut, Menu, Plus } from "lucide-vue-next"
import { Toaster } from "@/components/ui/toast"

const { logout } = useAuth()
const { documents, createDocument } = useDocuments()

const isMobileMenuOpen = ref(false)

async function handleCreate() {
  const newDoc = await createDocument()
  if (newDoc) {
    await navigateTo(`/documents/${newDoc.id}`)
    // 关闭移动端菜单（如果打开）
    isMobileMenuOpen.value = false
  }
}
</script>

<template>
  <div class="flex h-screen bg-background font-sans antialiased overflow-hidden">
    <!-- Sidebar (Desktop) -->
    <aside class="hidden md:flex w-64 flex-col border-r bg-muted/30">
      <!-- App Header -->
      <div class="h-14 flex items-center px-4 border-b font-semibold text-lg">
        Nuxtype
      </div>

      <!-- Document List (Scrollable) -->
      <div class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div class="text-xs font-medium text-muted-foreground px-2 mb-2">
          Private
        </div>

        <Button
          v-for="doc in documents"
          :key="doc.id"
          variant="ghost"
          class="w-full justify-start font-normal h-9"
          @click="navigateTo(`/documents/${doc.id}`)"
        >
          <FileText class="mr-2 h-4 w-4" />
          <span class="truncate">{{ doc.title }}</span>
        </Button>

        <Button
          variant="ghost"
          class="w-full justify-start text-muted-foreground h-9 mt-2"
          @click="handleCreate"
        >
          <Plus class="mr-2 h-4 w-4" />
          New Page
        </Button>
      </div>

      <!-- User Footer -->
      <div class="p-3 border-t mt-auto">
        <Button variant="ghost" class="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" @click="logout">
          <LogOut class="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Mobile Header -->
      <header class="md:hidden h-14 border-b flex items-center px-4 justify-between">
        <span class="font-semibold">Nuxtype</span>
        <Button variant="ghost" size="icon" @click="isMobileMenuOpen = !isMobileMenuOpen">
          <Menu class="h-5 w-5" />
        </Button>
      </header>

      <!-- Page Content -->
      <div class="flex-1 overflow-y-auto p-4 md:p-8">
        <slot />
      </div>
    </main>

    <!-- Toaster -->
    <div class="fixed bottom-0 right-0 p-4">
      <Toaster />
    </div>
  </div>
</template>
