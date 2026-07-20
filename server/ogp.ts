import { Router, Request, Response } from "express";
import { Huffman, fromPackedSfenWeb } from "../src/modules/psfenw.js";
import { IMoveMoveFormat } from "json-kifu-format/dist/src/Formats";

const router = Router();

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

const X_LABELS = ["", "１", "２", "３", "４", "５", "６", "７", "８", "９"];
const Y_LABELS = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

function moveToString(move?: IMoveMoveFormat): string {
  if (!move || !move.piece) return "";
  const color = move.color === 0 ? "☗" : "☖";
  const to = move.to ? `${X_LABELS[move.to.x]}${Y_LABELS[move.to.y]}` : "";
  const piece = PIECE_NAMES[move.piece] ?? move.piece;
  const promote = move.promote ? "成" : "";
  return `${color}${to}${piece}${promote}`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// game ID (例: "wdoor+floodgate-300-10F+Player1+Player2+20260720153001") をパース
function parseGameId(gi: string): {
  p1: string;
  p2: string;
  gn: string;
  tn: string;
} {
  const parts = gi.split("+");
  // wdoor+floodgate...+player1+player2+timestamp
  if (parts.length >= 5) {
    const p1 = parts[2];
    const p2 = parts[3];
    const ts = parts[4];
    const dateStr =
      ts.length >= 14
        ? `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)} ${ts.slice(8, 10)}:${ts.slice(10, 12)}:${ts.slice(12, 14)}`
        : ts;
    return {
      p1,
      p2,
      gn: `☗${p1} ☖${p2} (${dateStr})`,
      tn: "floodgate",
    };
  }
  return { p1: "", p2: "", gn: gi, tn: "floodgate" };
}

router.get("/", (req: Request, res: Response) => {
  const p = (req.query.p as string) ?? "";
  const gi = ((req.query.gi as string) ?? "").replace(/ /g, "+");

  const { gn, tn } = parseGameId(gi);

  let tesuuStr = "";
  let mStr = "";
  let tesuu = "";

  try {
    if (p) {
      const h = Huffman.fromB64(p);
      const result = fromPackedSfenWeb(h);
      mStr = moveToString(result.move);
      if (!isNaN(result.tesuu)) {
        tesuu = String(result.tesuu);
        tesuuStr = `${result.tesuu}手目`;
      }
    }
  } catch {
    // デコード失敗時はメタ情報なしで続行
  }

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const ogTitle = `floodgate ${escapeHtml(gn)} ${tesuuStr} ${mStr} まで`;
  const ogImage = `${baseUrl}/api/ogp-image?gi=${encodeURIComponent(gi)}&p=${encodeURIComponent(p)}`;
  // クエリ文字列の+はスペースにデコードされるので、giは先頭で+に復元済み
  const ogUrl = `${baseUrl}/#/${tn}/${gi}/${tesuu}`;

  const html = `<!DOCTYPE html>
<html lang="ja" prefix="og: http://ogp.me/ns#">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width"/>
<meta property="og:title" content="${escapeHtml(ogTitle)}"/>
<meta property="og:description" content="${escapeHtml(ogTitle)}"/>
<meta property="og:site_name" content="floodgate"/>
<meta property="og:image" content="${escapeHtml(ogImage)}"/>
<meta property="og:url" content="${escapeHtml(ogUrl)}"/>
<meta property="og:locale" content="ja_JP"/>
<meta property="og:type" content="article"/>
<meta name="twitter:card" content="summary_large_image"/>
<title>floodgate ${escapeHtml(gn)}</title>
<style>
body, iframe {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  border: 0;
}
</style>
<script>
window.location.href = ${JSON.stringify(ogUrl)};
</script>
</head>
<body><iframe src="${escapeHtml(ogUrl)}"></iframe></body>
</html>`;

  res.type("html").send(html);
});

export default router;
