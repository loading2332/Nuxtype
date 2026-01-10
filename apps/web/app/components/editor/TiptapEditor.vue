<script setup lang="ts">
import type { JSONContent } from "@tiptap/vue-3"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import TaskItem from "@tiptap/extension-task-item"
import TaskList from "@tiptap/extension-task-list"
import Typography from "@tiptap/extension-typography"
import StarterKit from "@tiptap/starter-kit"
import { EditorContent, useEditor } from "@tiptap/vue-3"
import { Bold, Image as ImageIcon, Italic, List, ListOrdered, Loader2 } from "lucide-vue-next"
import { Markdown } from "tiptap-markdown"
import { nextTick, onBeforeUnmount, ref, watch } from "vue"
import { useToast } from "@/components/ui/toast/use-toast"

const props = withDefaults(defineProps<{
  modelValue?: JSONContent
  editable?: boolean
}>(), {
  editable: true,
})

const emit = defineEmits(["update:modelValue"])

const { toast } = useToast()

const isUpdating = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)

// R2 public domain for image detection
const config = useRuntimeConfig()
const R2_PUBLIC_DOMAIN = config.public.r2PublicDomain

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

const editor = useEditor({
  content: props.modelValue,
  editable: props.editable,
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder: "Write something amazing...",
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
  ],
  editorProps: {
    attributes: {
      class: "prose prose-sm sm:prose lg:prose-lg xl:prose-xl m-5 focus:outline-none max-w-none min-h-[200px]",
    },
  },
  onUpdate: ({ editor }) => {
    isUpdating.value = true
    emit("update:modelValue", editor.getJSON())
    nextTick(() => {
      isUpdating.value = false
    })
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

watch(() => props.editable, (newEditable) => {
  editor.value?.setEditable(newEditable)
})

watch(() => props.modelValue, (newValue) => {
  if (isUpdating.value)
    return
  if (editor.value && newValue && !editor.value.isFocused) {
    editor.value.commands.setContent(newValue, { emitUpdate: false })
  }
})

onBeforeUnmount(() => {
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
    const message = (error as any).data?.message || "Failed to upload image. Please check your R2 configuration."
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
</style>
