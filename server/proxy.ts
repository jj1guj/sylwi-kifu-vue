import { Router, Request, Response } from "express";

const router = Router();

const ALLOWED_PATH_PATTERN =
  /^(?:shogi-server\.log|\d{4}\/\d{2}\/\d{2}\/wdoor\+[A-Za-z0-9_.+\-]+\.csa)$/;

// キャッシュ: { content, timestamp }
const cache = new Map<string, { content: string; timestamp: number }>();

// CSA内に終局を示すキーワードがあるか判定
const GAME_END_PATTERN = /^%(TORYO|CHUDAN|SENNICHITE|TIME_UP|ILLEGAL_MOVE|JISHOGI|KACHI|HIKIWAKE|MATTA|TSUMI|FUZUMI|ERROR)/m;

function getCacheTtl(path: string, content: string): number {
  if (path === "shogi-server.log") {
    return 30_000; // 30秒
  }
  // CSAファイル
  if (GAME_END_PATTERN.test(content)) {
    return 24 * 60 * 60 * 1000; // 終了済み: 24時間
  }
  return 1_000; // 進行中: 1秒
}

router.get("/", async (req: Request, res: Response) => {
  const path = req.query.path;

  if (typeof path !== "string" || !ALLOWED_PATH_PATTERN.test(path)) {
    res.status(400).type("text/plain").send("Invalid Floodgate path");
    return;
  }

  // キャッシュ確認
  const cached = cache.get(path);
  if (cached && Date.now() - cached.timestamp < getCacheTtl(path, cached.content)) {
    res.type("text/plain").send(cached.content);
    return;
  }

  const encodedPath = path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  const url = `https://wdoor.c.u-tokyo.ac.jp/shogi/x/${encodedPath}`;

  try {
    const upstream = await fetch(url, {
      headers: {
        "User-Agent": "sylwi-kifu-vue Floodgate proxy",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!upstream.ok) {
      res
        .status(upstream.status === 404 ? 404 : 502)
        .type("text/plain")
        .send(`Floodgate upstream returned HTTP ${upstream.status}`);
      return;
    }

    const content = await upstream.text();

    // キャッシュ保存
    cache.set(path, { content, timestamp: Date.now() });

    res.type("text/plain").send(content);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(502).type("text/plain").send(message);
  }
});

export default router;
