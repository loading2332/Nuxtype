<script setup lang="ts">
import Placeholder from "@tiptap/extension-placeholder"
import StarterKit from "@tiptap/starter-kit"
import { EditorContent, useEditor } from "@tiptap/vue-3"

const props = withDefaults(defineProps<{
  modelValue?: Record<string, unknown>
  editable?: boolean
}>(), {
  editable: true, // 默认值
})

const emit = defineEmits(["update:modelValue"])

const isUpdating = ref(false)

const editor = useEditor({
  content: props.modelValue,
  editable: props.editable,
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder: "Write something amazing...",
    }),
  ],
  editorProps: {
    attributes: {
      class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl m-5 focus:outline-none max-w-none min-h-[200px]",
    },
  },
  onUpdate: ({ editor }) => {
    isUpdating.value = true
    emit("update:modelValue", editor.getJSON())
    nextTick(() => {
      isUpdating.value = false
    })
  },
})

// 响应式同步 editable 状态
watch(() => props.editable, (newEditable) => {
  editor.value?.setEditable(newEditable)
})

// 外部内容变化时同步到编辑器
watch(() => props.modelValue, (newValue) => {
  if (isUpdating.value)
    return
  if (editor.value && newValue && !editor.value.isFocused) {
    editor.value.commands.setContent(newValue, { emitUpdate: false })
  }
})

onMounted(() => {
  if (editor.value) {
    editor.value.setEditable(props.editable)
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
.ProseMirror p.is-editor-empty:first-child::before {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
</style>
