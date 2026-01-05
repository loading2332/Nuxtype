<script setup lang="ts">
import Placeholder from "@tiptap/extension-placeholder"
import StarterKit from "@tiptap/starter-kit"
import { EditorContent, useEditor } from "@tiptap/vue-3"

const props = defineProps<{
  modelValue?: Record<string, unknown>
  editable?: boolean
}>()

const emit = defineEmits(["update:modelValue"])

const isUpdating = ref(false)

const editor = useEditor({
  content: props.modelValue,
  editable: props.editable ?? true,
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder: "Untitled... write something amazing!",
    }),
  ],
  editorProps: {
    attributes: {
      class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl m-5 focus:outline-none max-w-none",
    },
  },
  onUpdate: ({ editor }) => {
    isUpdating.value = true
    emit("update:modelValue", editor.getJSON())
    // Reset flag immediately after current tick
    nextTick(() => {
      isUpdating.value = false
    })
  },
})

// Watch for external content changes (e.g. loaded from API)
watch(() => props.modelValue, (newValue) => {
  // 1. If we are currently typing (source is editor), SKIP everything.
  if (isUpdating.value)
    return

  // 2. If editor is focused, we also likely don't want to overwrite
  // (unless it's a critical remote change, but for now safe to skip to avoid conflicts)
  if (editor.value && newValue && !editor.value.isFocused) {
    const isSame = JSON.stringify(editor.value.getJSON()) === JSON.stringify(newValue)
    if (!isSame) {
      editor.value.commands.setContent(newValue as Record<string, unknown>, { emitUpdate: false })
    }
  }
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<template>
  <div class="w-full">
    <EditorContent v-if="editor" :editor="editor" />
  </div>
</template>

<style>
/* Tiptap specific styles if needed */
.ProseMirror p.is-editor-empty:first-child::before {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
</style>
