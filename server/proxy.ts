import { Router, Request, Response } from "express";
import fs from "node:fs";
import nodePath from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = nodePath.dirname(fileURLToPath(import.meta.url));
const DISK_CACHE_DIR = nodePath.resolve(__dirname, "../cache");

// ディスクキャッシュディレクトリを作成
fs.mkdirSync(DISK_CACHE_DIR, { recursive: true });

const router = Router();

const ALLOWED_PATH_PATTERN =
  /^(?:shogi-server\.log|\d{4}\/\d{2}\/\d{2}\/wdoor\+[A-Za-z0-9_.+\-]+\.csa)$/;

// インメモリキャッシュ（ログ・進行中用）
const cache = new Map<string, { content: string; timestamp: number }>();

// CSA内に終局を示すキーワードがあるか判定
const GAME_END_PATTERN = /^%(TORYO|CHUDAN|SENNICHITE|TIME_UP|ILLEGAL_MOVE|JISHOGI|KACHI|HIKIWAKE|MATTA|TSUMI|FUZUMI|ERROR)/m;

// パスからディスクキャッシュのファイルパスを生成
function getDiskCachePath(reqPath: string): string {
  // スラッシュをディレクトリ構造として保持
  return nodePath.join(DISK_CACHE_DIR, reqPath);
}

// ディスクキャッシュから読み取り
function readDiskCache(reqPath: string): string | null {
  const filePath = getDiskCachePath(reqPath);
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

// ディスクキャッシュに書き込み
function writeDiskCache(reqPath: string, content: string): void {
  const filePath = getDiskCachePath(reqPath);
  fs.mkdirSync(nodePath.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf-8");
}

function getMemoryCacheTtl(reqPath: string): number {
  if (reqPath === "shogi-server.log") {
    return 30_000; // 30秒
  }
  return 1_000; // 進行中: 1秒
}

router.get("/", async (req: Request, res: Response) => {
  const reqPath = req.query.path;

  if (typeof reqPath !== "string" || !ALLOWED_PATH_PATTERN.test(reqPath)) {
    res.status(400).type("text/plain").send("Invalid Floodgate path");
    return;
  }

  // 終了済み棋譜: ディスクキャッシュを確認
  if (reqPath !== "shogi-server.log") {
    const diskCached = readDiskCache(reqPath);
    if (diskCached && GAME_END_PATTERN.test(diskCached)) {
      res.type("text/plain").send(diskCached);
      return;
    }
  }

  // インメモリキャッシュ確認（ログ・進行中）
  const cached = cache.get(reqPath);
  if (cached && Date.now() - cached.timestamp < getMemoryCacheTtl(reqPath)) {
    res.type("text/plain").send(cached.content);
    return;
  }

  const encodedPath = reqPath
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

    // 終了済み棋譜はディスクキャッシュに保存
    if (reqPath !== "shogi-server.log" && GAME_END_PATTERN.test(content)) {
      writeDiskCache(reqPath, content);
    } else {
      // ログ・進行中はインメモリキャッシュ
      cache.set(reqPath, { content, timestamp: Date.now() });
    }

    res.type("text/plain").send(content);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(502).type("text/plain").send(message);
  }
});

export default router;
