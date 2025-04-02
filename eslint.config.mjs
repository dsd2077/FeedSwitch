// eslint.config.mjs
import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended, // 启用推荐规则集（包含 no-undef/no-unused-vars）
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        chrome: "readonly"
      }
    },
    rules: {
      "no-unused-vars": "error",    // 开启未使用变量检查
      "no-undef": "error"           // 加强未定义变量检查
    }
  }
];