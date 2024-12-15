import { FlatCompat } from "@eslint/eslintrc"

const compat = new FlatCompat({
  // Node.js 20.11.0以上では `import.meta.dirname` が使用可能
  baseDirectory: import.meta.dirname,
})

const eslintConfig = [
  ...compat.config({
    extends: ["next"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  }),
]

export default eslintConfig