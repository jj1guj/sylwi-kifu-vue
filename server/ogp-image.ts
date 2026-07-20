import { Router, Request, Response } from "express";
import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";
import { Huffman, fromPackedSfenWeb } from "../src/modules/psfenw.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

// フォント登録
const fontRegular = path.resolve(
  __dirname,
  "../node_modules/noto-sans-cjk-jp/fonts/NotoSansCJKjp-Regular.woff"
);
const fontBold = path.resolve(
  __dirname,
  "../node_modules/noto-sans-cjk-jp/fonts/NotoSansCJKjp-Bold.woff"
);
if (fs.existsSync(fontRegular)) {
  GlobalFonts.registerFromPath(fontRegular, "NotoSansCJK");
}
if (fs.existsSync(fontBold)) {
  GlobalFonts.registerFromPath(fontBold, "NotoSansCJKBold");
}

// 駒画像キャッシュ
const pieceImageCache = new Map<string, Awaited<ReturnType<typeof loadImage>>>();
const PIECES_DIR = path.resolve(
  __dirname,
  "../node_modules/kifu-for-js/src/images"
);

async function getPieceImage(name: string) {
  if (pieceImageCache.has(name)) return pieceImageCache.get(name)!;
  const img = await loadImage(path.join(PIECES_DIR, `${name}.png`));
  pieceImageCache.set(name, img);
  return img;
}

// game IDからp1/p2をパース
function parseGameId(gi: string): { p1: string; p2: string } {
  const parts = gi.split("+");
  if (parts.length >= 5) {
    return { p1: parts[2], p2: parts[3] };
  }
  return { p1: "", p2: "" };
}

// 定数
const IMX = 992;
const IMY = 496;
const IMXH = IMX / 2;
const IMYH = IMY / 2;
const CELL_W = 44;
const CELL_H = 49;
const PIECE_W = 43;
const PIECE_H = 48;

const X_LABELS = ["１", "２", "３", "４", "５", "６", "７", "８", "９"];
const Y_LABELS = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];

router.get("/", async (req: Request, res: Response) => {
  const p = (req.query.p as string) ?? "";
  const gi = ((req.query.gi as string) ?? "").replace(/ /g, "+");
  const { p1, p2 } = parseGameId(gi);

  // psfenwデコード
  let board: { color?: number; kind?: string }[][] = Array.from(
    { length: 9 },
    () => Array.from({ length: 9 }, () => ({}))
  );
  let hands: { [key: string]: number }[] = [
    { HI: 0, KA: 0, KI: 0, GI: 0, KE: 0, KY: 0, FU: 0 },
    { HI: 0, KA: 0, KI: 0, GI: 0, KE: 0, KY: 0, FU: 0 },
  ];
  let move: {
    color?: number;
    from?: { x: number; y: number };
    to?: { x: number; y: number };
    piece?: string;
    capture?: string;
    promote?: boolean;
  } = {};
  let tesuu = NaN;
  let moveStr = "";

  try {
    if (p) {
      const h = Huffman.fromB64(p);
      const result = fromPackedSfenWeb(h);
      const shogi = result.shogi;
      board = shogi.board;
      hands = [shogi.getHandsSummary(0), shogi.getHandsSummary(1)];
      if (result.move) {
        move = result.move;
      }
      tesuu = result.tesuu;
      // 指し手文字列生成
      if (result.move?.piece) {
        const m = result.move;
        const colorStr = m.color === 0 ? "☗" : "☖";
        const toStr = m.to
          ? `${X_LABELS[m.to.x - 1]}${Y_LABELS[m.to.y - 1]}`
          : "";
        const PIECE_NAMES: Record<string, string> = {
          FU: "歩",
          KY: "香",
          KE: "桂",
          GI: "銀",
          KI: "金",
          KA: "角",
          HI: "飛",
          OU: "玉",
          TO: "と",
          NY: "成香",
          NK: "成桂",
          NG: "成銀",
          UM: "馬",
          RY: "龍",
        };
        const pieceStr = PIECE_NAMES[m.piece!] ?? m.piece;
        const promoteStr = m.promote ? "成" : "";
        moveStr = `${colorStr}${toStr}${pieceStr}${promoteStr}`;
      }
    }
  } catch {
    // デコード失敗時はエラー画像を返す
    const canvas = createCanvas(IMX, IMY);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, IMX, IMY);
    ctx.fillStyle = "#fff";
    ctx.font = "24px NotoSansCJK";
    ctx.textAlign = "center";
    ctx.fillText("局面データの読み込みに失敗しました", IMXH, IMYH);
    res.type("image/png").send(canvas.toBuffer("image/png"));
    return;
  }

  const canvas = createCanvas(IMX, IMY);
  const ctx = canvas.getContext("2d");

  // 背景（黒）
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, IMX, IMY);

  // 盤面（盤色）
  ctx.fillStyle = "rgb(253, 215, 117)";
  ctx.fillRect(IMXH - 216, IMYH - 238, 432, 476);

  // 先手駒台
  ctx.fillRect(IMXH + 220, IMYH + 10, 180, 228);
  // 後手駒台
  ctx.fillRect(IMXH - 400, IMYH - 238, 180, 228);

  // 移動元・移動先ハイライト
  const fromF =
    move.from != null ? move.from.x - 1 : undefined;
  const fromR =
    move.from != null ? move.from.y - 1 : undefined;
  const toF = move.to != null ? move.to.x - 1 : undefined;
  const toR = move.to != null ? move.to.y - 1 : undefined;

  for (let f = 0; f < 9; f++) {
    for (let r = 0; r < 9; r++) {
      const x = (3.5 - f) * CELL_W + IMXH;
      const y = (r - 4.5) * CELL_H + IMYH;

      if (fromF === f && fromR === r) {
        ctx.fillStyle = "rgb(255, 153, 0)";
        ctx.fillRect(x, y, CELL_W, CELL_H);
      }
      if (toF === f && toR === r) {
        ctx.fillStyle = "rgb(0, 204, 153)";
        ctx.fillRect(x, y, CELL_W, CELL_H);
      }

      const piece = board[f][r];
      if (piece?.kind) {
        const imgName = `${piece.color}${piece.kind}`;
        try {
          const img = await getPieceImage(imgName);
          ctx.drawImage(img, x, y, PIECE_W, PIECE_H);
        } catch {
          // 駒画像が見つからない場合はスキップ
        }
      }
    }
  }

  // 罫線
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  const x0 = IMXH - 4.5 * CELL_W;
  const x1 = IMXH + 4.5 * CELL_W;
  const y0 = IMYH - 4.5 * CELL_H;
  const y1 = IMYH + 4.5 * CELL_H;
  for (let i = 0; i <= 9; i++) {
    const x = IMXH + (i - 4.5) * CELL_W;
    const y = IMYH + (i - 4.5) * CELL_H;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
  }

  // 段・筋ラベル
  ctx.fillStyle = "#000";
  ctx.font = "10px NotoSansCJK";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < 9; i++) {
    const x = IMXH - (i - 4) * CELL_W;
    ctx.fillText(X_LABELS[i], x, IMYH - 229);
    const y = IMYH + (i - 4) * CELL_H;
    ctx.fillText(Y_LABELS[i], IMXH + 207, y);
  }

  // 持駒描画
  const HAND_PIECES_SENTE = ["HI", "KA", "KI", "GI", "KE", "KY", "FU"];
  const HAND_PIECES_GOTE = ["FU", "KY", "KE", "GI", "KI", "KA", "HI"];

  async function drawHand(
    color: number,
    startX: number,
    startY: number,
    pieces: string[]
  ) {
    let ix = 0;
    let iy = 0;
    for (const kind of pieces) {
      const num = hands[color][kind] ?? 0;
      if (num > 0) {
        const isFU = kind === "FU";
        if (ix > 0 && isFU) {
          ix = 0;
          iy += 1;
        }
        const imgName = `${color}${kind}`;
        try {
          const img = await getPieceImage(imgName);
          for (let i = num - 1; i >= 0; i--) {
            const dx = isFU
              ? num < 4
                ? i * 40
                : (i / (num - 1)) * 116
              : num < 2
                ? i * 40
                : (i / (num - 1)) * 36;
            ctx.drawImage(img, startX + ix * 80 + dx, startY + iy * CELL_H, PIECE_W, PIECE_H);
          }
        } catch {
          // skip
        }
        ix += isFU ? 2 : 1;
        if (ix > 1) {
          ix = 0;
          iy += 1;
        }
      }
    }
  }

  await drawHand(0, IMXH + 230, IMYH + 26, HAND_PIECES_SENTE);
  await drawHand(1, IMXH - 390, IMYH - 220, HAND_PIECES_GOTE);

  // 手数・指し手表示
  if (moveStr && !isNaN(tesuu)) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(IMXH + 220, 30, 200, 120);
    ctx.fillStyle = "#000";
    ctx.font = "16px NotoSansCJKBold";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${tesuu}手目`, IMXH + 320, 64);
    ctx.fillText(moveStr, IMXH + 320, 90);
    ctx.fillText("まで", IMXH + 320, 116);
  }

  // プレイヤー名
  ctx.fillStyle = "#fff";
  ctx.fillRect(IMXH + 430, IMYH - 128, 32, 366);
  ctx.fillRect(IMXH - 462, IMYH - 238, 32, 366);

  ctx.fillStyle = "#000";
  ctx.font = "16px NotoSansCJKBold";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // 先手名（縦書き）
  const senteText = `☗先手 ${p1}`;
  ctx.save();
  ctx.translate(IMXH + 446, IMYH + 238);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "left";
  ctx.fillText(senteText, 0, 0);
  ctx.restore();

  // 後手名（縦書き）
  const goteText = `☖後手 ${p2}`;
  ctx.save();
  ctx.translate(IMXH - 446, IMYH - 238);
  ctx.rotate(Math.PI / 2);
  ctx.textAlign = "left";
  ctx.fillText(goteText, 0, 0);
  ctx.restore();

  // PNG出力
  res.type("image/png").send(canvas.toBuffer("image/png"));
});

export default router;
