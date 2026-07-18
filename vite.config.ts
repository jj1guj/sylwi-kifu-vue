import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  base: "./",
  plugins: [
    vue(),
    viteStaticCopy({
      targets: [
        {
          src: "node_modules/noto-sans-cjk-jp/fonts/NotoSansCJKjp-Regular.woff",
          dest: "font",
        },
        {
          src: "node_modules/noto-sans-cjk-jp/fonts/NotoSansCJKjp-Bold.woff",
          dest: "font",
        },
        {
          src: "node_modules/kifu-for-js/src/images/*.png",
          dest: "img/pieces",
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
