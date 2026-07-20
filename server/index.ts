import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import proxyRouter from "./proxy.js";
import ogpRouter from "./ogp.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT) || 3000;

async function createServer() {
  const app = express();

  // APIルート（Viteミドルウェアより先に登録）
  app.use("/api/floodgate", proxyRouter);
  app.use("/api/ogp", ogpRouter);

  if (isProduction) {
    // 本番: ビルド済み静的ファイルを配信
    const distPath = path.resolve(__dirname, "../dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    // 開発: Viteをミドルウェアとして統合
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

createServer();
