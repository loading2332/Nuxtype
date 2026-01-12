<script setup lang="ts">
import type { AnyExtension } from "@tiptap/core"
import type { JSONContent } from "@tiptap/vue-3"
import { HocuspocusProvider } from "@hocuspocus/provider"
import Collaboration from "@tiptap/extension-collaboration"
import CollaborationCaret from "@tiptap/extension-collaboration-caret"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import TaskItem from "@tiptap/extension-task-item"
import TaskList from "@tiptap/extension-task-list"
import Typography from "@tiptap/extension-typography"
import StarterKit from "@tiptap/starter-kit"
import { Editor, EditorContent } from "@tiptap/vue-3"
import { Bold, Image as ImageIcon, Italic, List, ListOrdered, Loader2, Users, Wifi, WifiOff } from "lucide-vue-next"
import { Markdown } from "tiptap-markdown"
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue"
import * as Y from "yjs"
import { useToast } from "@/components/ui/toast/use-toast"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip"

const props = withDefaults(defineProps<{
  modelValue?: JSONContent
  editable?: boolean
  docId?: string // 文档 ID (用于协同)
  token?: string // JWT Token (用于协同认证)
  userName?: string // 用户名 (显示在光标上)
  userColor?: string // 用户颜色
}>(), {
  editable: true,
  userName: "Anonymous",
  userColor: "#6366f1",
})
const emit = defineEmits(["update:modelValue"])
// 常量定义
const EDITOR_PLACEHOLDER = "Write something amazing..."
const COLLABORATION_COLORS = ["#f43f5e", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ec4899"] as const

// Awareness 状态类型
interface UserInfo {
  name: string
  color: string
}

interface AwarenessState {
  [key: string]: unknown
  [key: number]: unknown
  clientId: number
  user?: UserInfo
}

const { toast } = useToast()
const config = useRuntimeConfig()

const isUpdating = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)

// 协同状态
const connectionStatus = ref<"connecting" | "connected" | "disconnected">("disconnected")
const onlineUsers = ref<Array<{ name: string, color: string }>>([])

// R2 public domain for image detection
const R2_PUBLIC_DOMAIN = config.public.r2PublicDomain

// Y.js 和 Hocuspocus Provider (仅协同模式)
const ydoc = props.docId ? new Y.Doc() : null
const provider = ref<HocuspocusProvider | null>(null)

// Helper: Delete image from R2 (fire and forget)
function deleteR2Image(url: string) {
  if (!url.startsWith(R2_PUBLIC_DOMAIN))
    return

  $fetch("/api/upload", {
    method: "DELETE",
    body: { url },
  }).catch((err) => {
    console.warn("Failed to delete image from R2:", err)
  })
}

// 生成随机颜色
function getRandomColor() {
  return COLLABORATION_COLORS[Math.floor(Math.random() * COLLABORATION_COLORS.length)]
}

// 构建扩展列表
function buildExtensions() {
  const baseExtensions: AnyExtension[] = [
    StarterKit.configure({
      // 协同模式下禁用内置 undo/redo，使用 Y.js 的 undo 管理
      undoRedo: props.docId ? false : undefined,
    }),
    Placeholder.configure({
      placeholder: EDITOR_PLACEHOLDER,
    }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      defaultProtocol: "https",
    }),
    Image,
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    Typography,
    Markdown.configure({
      html: true,
      transformPastedText: true,
      transformCopiedText: true,
    }),
  ]

  // 协同模式扩展
  if (props.docId && ydoc && provider.value) {
    baseExtensions.push(
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCaret.configure({
        provider: provider.value,
        user: {
          name: props.userName,
          color: props.userColor || getRandomColor(),
        },
      }),
    )
  }

  return baseExtensions
}

// 创建编辑器
const editor = shallowRef<Editor | null>(null)

// 初始化协同连接
onMounted(() => {
  if (props.docId && props.token && ydoc) {
    const wsUrl = config.public.wsUrl || "ws://localhost:1234"

    provider.value = new HocuspocusProvider({
      url: wsUrl,
      name: props.docId,
      document: ydoc,
      token: props.token,
      onConnect: () => {
        connectionStatus.value = "connected"
      },
      onDisconnect: () => {
        connectionStatus.value = "disconnected"
      },
      onAwarenessUpdate: ({ states }) => {
        // 更新在线用户列表
        onlineUsers.value = Array.from(states.values())
          .filter((state): state is AwarenessState & { user: UserInfo } => {
            return !!(state as AwarenessState).user
          })
          .map(state => ({
            name: state.user.name,
            color: state.user.color,
          }))
      },
    })

    connectionStatus.value = "connecting" // Provider 创建后设置状态
  }

  editor.value = new Editor({
    content: props.docId ? undefined : props.modelValue,
    editable: props.editable,
    extensions: buildExtensions(),
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-xl m-5 focus:outline-none max-w-none min-h-[200px]",
      },
    },
    onUpdate: ({ editor }) => {
      // 非协同模式：通过 v-model 同步
      if (!props.docId) {
        isUpdating.value = true
        emit("update:modelValue", editor.getJSON())
        nextTick(() => {
          isUpdating.value = false
        })
      }
    },
    onTransaction: ({ editor, transaction }) => {
      // Detect deleted images by comparing before/after content
      if (!transaction.docChanged)
        return

      const beforeDoc = transaction.before
      const afterDoc = editor.state.doc

      // Extract image sources from both states
      const beforeImages = new Set<string>()
      const afterImages = new Set<string>()

      beforeDoc.descendants((node) => {
        if (node.type.name === "image" && node.attrs.src) {
          beforeImages.add(node.attrs.src)
        }
      })

      afterDoc.descendants((node) => {
        if (node.type.name === "image" && node.attrs.src) {
          afterImages.add(node.attrs.src)
        }
      })

      // Delete removed images from R2
      beforeImages.forEach((src) => {
        if (!afterImages.has(src)) {
          deleteR2Image(src)
        }
      })
    },
  })
},
)

watch(() => props.editable, (newEditable) => {
  editor.value?.setEditable(newEditable)
})

watch(() => props.modelValue, (newValue) => {
  // 协同模式下不通过 v-model 同步
  if (props.docId)
    return
  if (isUpdating.value)
    return
  if (editor.value && newValue && !editor.value.isFocused) {
    editor.value.commands.setContent(newValue, { emitUpdate: false })
  }
})

onBeforeUnmount(() => {
  provider.value?.destroy()
  editor.value?.destroy()
})

function triggerFileUpload() {
  fileInput.value?.click()
}

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file)
    return

  // Basic Frontend Validation
  if (!file.type.startsWith("image/")) {
    toast({
      title: "Upload Failed",
      description: "Please upload an image file.",
      variant: "destructive",
    })
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    toast({
      title: "Upload Failed",
      description: "Image size must be less than 5MB.",
      variant: "destructive",
    })
    return
  }

  isUploading.value = true

  try {
    const formData = new FormData()
    formData.append("file", file)

    const response = await $fetch<{ success: boolean, url: string }>("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (response.success && response.url) {
      editor.value?.chain().focus().setImage({ src: response.url }).run()
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      })
    }
  }
  catch (error: unknown) {
    console.error("Upload failed", error)
    const errorData = error as { data?: { message?: string } }
    const message = errorData.data?.message || "Failed to upload image. Please check your R2 configuration."
    toast({
      title: "Upload Failed",
      description: message,
      variant: "destructive",
    })
  }
  finally {
    isUploading.value = false
    if (fileInput.value)
      fileInput.value.value = "" // Reset input
  }
}
</script>

<template>
  <div class="w-full flex flex-col gap-2">
    <!-- Toolbar -->
    <div v-if="editor && editable" class="flex gap-1 p-2 border rounded-md bg-white items-center flex-wrap shadow-sm">
      <button
        :class="{ 'bg-gray-100 text-black': editor.isActive('bold'), 'text-gray-600': !editor.isActive('bold') }"
        class="p-2 rounded hover:bg-gray-100 transition"
        title="Bold"
        @click="editor.chain().focus().toggleBold().run()"
      >
        <Bold class="w-4 h-4" />
      </button>
      <button
        :class="{ 'bg-gray-100 text-black': editor.isActive('italic'), 'text-gray-600': !editor.isActive('italic') }"
        class="p-2 rounded hover:bg-gray-100 transition"
        title="Italic"
        @click="editor.chain().focus().toggleItalic().run()"
      >
        <Italic class="w-4 h-4" />
      </button>
      <button
        :class="{ 'bg-gray-100 text-black': editor.isActive('bulletList'), 'text-gray-600': !editor.isActive('bulletList') }"
        class="p-2 rounded hover:bg-gray-100 transition"
        title="Bullet List"
        @click="editor.chain().focus().toggleBulletList().run()"
      >
        <List class="w-4 h-4" />
      </button>
      <button
        :class="{ 'bg-gray-100 text-black': editor.isActive('orderedList'), 'text-gray-600': !editor.isActive('orderedList') }"
        class="p-2 rounded hover:bg-gray-100 transition"
        title="Ordered List"
        @click="editor.chain().focus().toggleOrderedList().run()"
      >
        <ListOrdered class="w-4 h-4" />
      </button>

      <div class="w-px h-6 bg-gray-200 mx-1" />

      <button
        :disabled="isUploading"
        class="p-2 rounded hover:bg-gray-100 transition flex items-center gap-1 text-gray-600"
        title="Insert Image"
        @click="triggerFileUpload"
      >
        <Loader2 v-if="isUploading" class="w-4 h-4 animate-spin text-blue-500" />
        <ImageIcon v-else class="w-4 h-4" />
      </button>

      <input
        ref="fileInput"
        type="file"
        class="hidden"
        accept="image/png, image/jpeg, image/webp, image/gif"
        @change="handleFileUpload"
      >

      <!-- 协同模式状态指示器 -->
      <template v-if="docId">
        <div class="flex-1" />

        <!-- 连接状态 -->
        <div class="flex items-center gap-2 text-sm">
          <Wifi v-if="connectionStatus === 'connected'" class="w-4 h-4 text-green-500" />
          <WifiOff v-else-if="connectionStatus === 'disconnected'" class="w-4 h-4 text-red-500" />
          <Loader2 v-else class="w-4 h-4 animate-spin text-blue-500" />

          <!-- 在线用户 -->
          <div v-if="onlineUsers.length > 0" class="flex items-center gap-2">
            <Users class="w-4 h-4 text-gray-500" />
            <span class="text-gray-500">{{ onlineUsers.length }}</span>

            <!-- 用户彩色圆点（重叠显示） -->
            <TooltipProvider>
              <div class="flex items-center">
                <Tooltip v-for="(user, index) in onlineUsers" :key="user.name">
                  <TooltipTrigger as-child>
                    <div
                      :style="{
                        backgroundColor: user.color,
                        marginLeft: index === 0 ? '0' : '-6px',
                        zIndex: onlineUsers.length - index,
                      }"
                      class="w-3 h-3 rounded-full border-2 border-white shadow-sm cursor-pointer hover:scale-125 hover:z-50 transition-all duration-200"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p class="text-xs">
                      {{ user.name }}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        </div>
      </template>
    </div>

    <!-- Editor -->
    <EditorContent v-if="editor" :editor="editor" class="border rounded-md min-h-[300px] bg-white transition-colors focus-within:border-blue-500" />
  </div>
</template>

<style scoped>
:deep(.ProseMirror) {
  padding: 1rem;
  min-height: 300px;
  outline: none;
}

:deep(.ProseMirror p.is-editor-empty:first-child::before) {
  color: #9ca3af;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

/* Task List Styles */
:deep(ul[data-type='taskList']) {
  list-style: none;
  padding: 0;
}

:deep(li[data-type='taskItem']) {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

:deep(li[data-type='taskItem'] label) {
  margin-right: 0.5rem;
  user-select: none;
  margin-top: 0.1rem;
}

:deep(li[data-type='taskItem'] > div) {
  flex: 1;
}

/* Image Styles */
:deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin-top: 1rem;
  margin-bottom: 1rem;
  border: 1px solid #e5e7eb;
}

/* Collaboration Cursor Styles */
/* 协作光标样式 */
:deep(.collaboration-carets__caret) {
  position: relative;
  margin-left: -1px;
  margin-right: -1px;
  border-left: 1px solid;
  border-right: 1px solid;
  word-break: normal;
  pointer-events: none;
}

/* 协作选择区域样式 */
:deep(.collaboration-carets__selection) {
  opacity: 0.3;
  pointer-events: none;
}

/* 用户名标签样式 */
:deep(.collaboration-carets__label) {
  position: absolute !important;
  top: -1.4em;
  left: -1px;
  font-size: 12px;
  font-style: normal;
  font-weight: 600;
  line-height: normal;
  user-select: none;
  color: #fff;
  padding: 2px 6px;
  border-radius: 3px 3px 3px 0;
  white-space: nowrap;
  display: inline-block !important;
  width: auto !important;
}
</style>
