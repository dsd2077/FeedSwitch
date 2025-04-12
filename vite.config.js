import { defineConfig } from "vite"

export default defineConfig({
  build: {
    lib: {
      entry: "content.js",
      formats: ["es"],
      fileName: "content",
    },
    rollupOptions: {
      external: ["chrome"],
      output: {
        dir: "dist",
      },
    },
  },
})
