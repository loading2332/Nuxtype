// @ts-check
import antfu from "@antfu/eslint-config"

export default antfu({
  vue: true,
  typescript: true,
  formatters: true,
  ignores: [
    "README.md", // README 包含示例代码块，可能有解析错误
  ],
  rules: {
    // 自定义规则
    "vue/multi-word-component-names": "off", // 允许单词组件名
    "@typescript-eslint/no-explicit-any": "warn", // any 类型警告
    "ts/no-explicit-any": "warn", // any 类型警告
    "no-console": "warn", // console 警告
    "style/quotes": ["error", "double"],
  },
})
