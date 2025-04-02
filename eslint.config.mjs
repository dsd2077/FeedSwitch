import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";


export default defineConfig([
  js.configs.recommended, // 必须的推荐规则集
  { files: ["**/*.{js,mjs,cjs}"] },
  { files: ["**/*.{js,mjs,cjs}"], 
    languageOptions: { 
      globals: globals.browser,
      chrome: "readonly"     // 必须的 Chrome 扩展全局变量
    } },
  { files: ["**/*.{js,mjs,cjs}"], plugins: { js }, extends: ["js/recommended"] },
]);