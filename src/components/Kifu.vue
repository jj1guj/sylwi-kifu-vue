<template>
  <div
    class="kifu"
    v-if="
      (!props.disableNonGame || data.tesuuMax > 0) &&
      (!props.hideEnd ||
        data.inGame ||
        new Date().valueOf() < data.lastInGame + 60000)
    "
  >
    <div class="kifuheader">
      <div class="gamename">
        <button
          @click="doCopyURL"
          v-html="iconLinkRaw"
          title="棋譜URLをクリップボードにコピー"
          v-if="data.hasClipboard"
        />
        <router-link :to="{ path: `/${props.tournament}/${props.gameid}` }">{{
          props.gamename
        }}</router-link>
      </div>
    </div>
    <div v-if="data.activated">
      <TagBar
        :tournament="props.tournament"
        :gameid="props.gameid"
        :jkfstr="data.jkfstr"
        @tesuu-change="tesuuChange"
        v-if="!props.hideTags"
      />
      <ScoreGraph
        :jkf="data.jkfstr"
        :tesuu="data.tesuu"
        :tournament="props.tournament"
        :gameid="props.gameid"
        :gamename="props.gamename"
        :kifuurl="getKifuurl()"
        :kifuorgurl="getKifuorgurl()"
        @tesuu-change="tesuuChange"
        v-if="!props.hideGraph"
      />
      <div class="kifuforjs">
        <div
          :class="
            props.lightEnd ||
            (data.tesuuMax > 0 && data.tesuu >= 1 && data.inGame) ||
            (data.tesuu < data.tesuuMax && data.tesuu >= 1)
              ? `banset`
              : `banset end`
          "
        >
          <div>
            <div
              class="inlineblock players"
              :class="{ 'has-rating': data.blackRate || data.whiteRate }"
            >
              <Mochi
                :jkf="data.jkfstr"
                :tesuu="data.tesuu"
                :rotated="data.rotated"
                :side="1"
                :rating="data.rotated ? data.blackRate : data.whiteRate"
                :estimated="
                  data.rotated
                    ? data.blackRateEstimated
                    : data.whiteRateEstimated
                "
                @tesuu-diff="tesuuDiff"
              />
              <div class="mochi panel tesuu">
                <TesuuSel
                  :jkf="data.jkfstr"
                  :tesuu="data.tesuu"
                  :updated="data.updated"
                  @tesuu-change="tesuuChange"
                />
              </div>
            </div>
          </div>
          <Ban
            :jkf="data.jkfstr"
            :tesuu="data.tesuu"
            :rotated="data.rotated"
            @tesuu-diff="tesuuDiff"
          />
          <div>
            <div
              class="inlineblock players"
              :class="{ 'has-rating': data.blackRate || data.whiteRate }"
            >
              <div class="mochi info">
                <Info :jkf="data.jkfstr" head="{}" />
              </div>
              <Mochi
                :jkf="data.jkfstr"
                :tesuu="data.tesuu"
                :rotated="data.rotated"
                :side="0"
                :rating="data.rotated ? data.whiteRate : data.blackRate"
                :estimated="
                  data.rotated
                    ? data.whiteRateEstimated
                    : data.blackRateEstimated
                "
                @tesuu-diff="tesuuDiff"
              />
            </div>
          </div>
        </div>
        <div class="kifutools" v-if="!props.hideTools">
          <button
            @click="plyGo(-Infinity)"
            v-html="iconArrowBarToLeftRaw"
            title="初手に戻る"
          />
          <button
            @click="plyGo(-10)"
            v-html="iconChevronsLeftRaw"
            title="10手戻る"
          />
          <button
            @click="plyGo(-1)"
            v-html="iconCaretLeftRaw"
            title="1手戻る"
          />
          <input
            class="tesuu"
            type="number"
            min="0"
            :max="data.tesuuMax"
            :value="data.tesuu"
            @change="tesuuChangeEvent"
          />
          <button
            @click="plyGo(1)"
            v-html="iconCaretRightRaw"
            title="1手進む"
          />
          <button
            @click="plyGo(10)"
            title="10手進む"
            v-html="iconChevronsRightRaw"
          />
          <button
            @click="plyGo(Infinity)"
            v-html="iconArrowBarToRightRaw"
            title="最新に進む"
          />
          <button @click="doRotate" v-html="iconRotateRaw" title="盤面反転" />
          <button
            @click="doCopy"
            v-html="data.kifuCopied ? iconCheckRaw : iconCopyRaw"
            title="棋譜をクリップボードにコピー"
            v-if="data.hasClipboard"
          />
          <button
            @click="doDownload"
            v-html="iconDownloadRaw"
            title="棋譜をダウンロード"
          />
          <button @click="doTweet" v-html="iconTwitterRaw" title="ツイート" />
          <button
            @click="doShareCopy"
            v-html="data.shareCopyFailed ? iconAlertTriangleRaw : data.shareCopied ? iconCheckRaw : iconShareRaw"
            title="シェア用テキストをコピー"
          />
          <button @click="doDiag" v-html="iconBrushRaw" title="局面図" />
          <div
            v-if="data.shareCopyFailed"
            class="share-copy-fallback"
            role="status"
            aria-live="polite"
          >
            <div class="share-copy-fallback-header">
              <span>自動コピーできませんでした。下のテキストを選択してコピーしてください。</span>
              <button
                @click="closeShareCopyFallback"
                v-html="iconXRaw"
                title="手動コピー欄を閉じる"
              />
            </div>
            <textarea
              :value="data.shareCopyText"
              @click="selectShareCopyText"
              aria-label="手動コピー用シェアテキスト"
              readonly
            ></textarea>
          </div>
        </div>
        <div v-if="data.showDiag">
          <img
            class="diag"
            :src="`/api/ogp-image?gi=${encodeURIComponent(
              props.gameid
            )}&p=${getPSfenWB64()}`"
          />
        </div>
        <div v-if="!props.hideComments">
          <textarea :value="getComment()" class="comments" disabled></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
div.kifu {
  width: 570px;
  margin: 1em 0;
  div.kifuheader {
    button {
      img,
      svg {
        height: 1em;
        width: 1em;
      }
    }
    .gamename,
    .gameid {
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
  }
  div.kifuforjs {
    width: 570px;
    div.banset {
      .players {
        .mochi {
          .mochimain {
            background-color: #eee;
            span.mochigoma.from {
              background-color: #f90;
            }
            span.mochigoma.capture {
              background-color: #0c9;
            }
          }
        }
      }
      .ban {
        .square {
          background-color: #fdd775;
        }
        .square.fromsq {
          background-color: #f90;
        }
        .square.tosq {
          background-color: #0c9;
        }
      }
    }
    div.banset.end {
      .players {
        .mochi {
          .mochimain {
            background-color: #ddd;
            span.mochigoma.from {
              background-color: #e80;
            }
            span.mochigoma.capture {
              background-color: #0a7;
            }
            img {
              opacity: 1;
            }
          }
        }
      }
      .ban {
        .square {
          background-color: #a6832a;
        }
        .square.fromsq {
          background-color: #e80;
        }
        .square.tosq {
          background-color: #0a7;
        }
        img {
          opacity: 1;
        }
      }
    }
    div.banset {
      display: flex;
      justify-content: space-between;
      margin: 4px 0;
      .inlineblock {
        display: inline-block;
      }
      .players {
        height: 100%;
        width: 120px;
        .mochi {
          width: 120px;
          .tebanname {
            font-size: 14px;
            text-align: center;
            background-color: silver;
            margin-bottom: 0;
            margin-top: auto;
            width: 100%;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          .points {
            display: flex;
            align-items: baseline;
            justify-content: center;
            gap: 4px;
            text-align: center;
            background-color: #ddd;
            font-variant-numeric: tabular-nums;
            .rating-label {
              font-size: 9px;
              font-weight: bold;
              color: #d9dde0;
            }
            .rating-value {
              font-size: 14px;
              font-weight: bold;
            }
          }
          .points.rating {
            min-height: 24px;
            padding: 2px 4px;
            box-sizing: border-box;
            color: #fff;
            background-color: #3f454a;
          }
          .entering-status {
            font-size: 12px;
            font-weight: bold;
            white-space: nowrap;
          }
          .mochimain {
            width: 100%;
            height: 152px;
            margin-top: auto;
            margin-bottom: 0;
            img {
              width: 32px;
              height: 36px;
            }
            span.mochigoma {
              position: relative;
              display: none;
              height: 36px;
              padding: 0;
              border-spacing: 0;
            }
            span.mochigoma.fu {
              display: inline-block;
              width: 120px;
            }
            span.mochigoma.fu-else {
              display: inline-block;
              width: 60px;
            }
          }
          .panel {
            display: flex;
            flex-direction: column;
          }
          select.tesuu {
            font-size: 12px;
            width: 100%;
            height: 100%;
          }
          ul.lines {
            margin: 0;
            padding-left: 0;
            padding-top: 2px;
            list-style: none;
            li {
              display: list-item;
              text-align: -webkit-match-parent;
              padding: 1px;
              list-style: none;
            }
            button,
            select {
              width: 100%;
              height: 12%;
              padding: 1px;
            }
          }
        }
        .mochi.panel {
          height: 160px;
        }
        &.has-rating .mochi.panel {
          height: 136px;
        }
        .mochi.info {
          overflow-y: scroll;
          font-size: 13px;
          height: 160px;
          dl {
            margin-block-start: 0;
            margin-block-end: 0;
            dt {
              font-weight: bold;
              clear: both;
              float: left;
              margin-right: 5px;
              background-color: #eee;
            }
            dd {
              display: block;
              margin-inline-start: 10px;
              word-wrap: break-word;
            }
          }
        }
        &.has-rating .mochi.info {
          height: 136px;
        }
      }
      &:has(.points.entered) .players {
        .mochi {
          .points {
            box-sizing: border-box;
            height: 22px;
          }
          .points.entered .entering-status {
            background-color: #dce8e6;
            color: #263238;
          }
          .mochimain {
            height: 130px;
          }
        }
        &.has-rating .mochi {
          .points.rating {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 20px 24px;
            column-gap: 4px;
            gap: 0 4px;
            height: 46px;
            padding: 2px 4px 0;
            justify-content: stretch;
            background: linear-gradient(
              to bottom,
              #3f454a 0,
              #3f454a 22px,
              #eee 22px,
              #eee 100%
            );
            .rating-label {
              justify-self: end;
            }
            .rating-value {
              justify-self: start;
            }
            .entering-status {
              align-self: stretch;
              display: flex;
              grid-column: 1 / -1;
              align-items: center;
              justify-content: center;
              line-height: 24px;
              margin: 0 -4px;
              background-color: #dce8e6;
              color: #263238;
            }
          }
          .mochimain {
            height: 131px;
          }
        }
      }
      .ban {
        display: table;
        border-collapse: collapse;
        .rank {
          display: table-row;
          flex-direction: row;
        }
        .square {
          display: table-cell;
          border: 1px #000 solid;
          border-spacing: 0;
          padding: 0;
          text-align: center;
          vertical-align: middle;
        }
        .square,
        .square div,
        .square img {
          width: 32px;
          height: 36px;
        }
        .filenum {
          display: table-cell;
          width: 32px;
          height: 1.2em;
          vertical-align: middle;
          text-align: center;
          font-weight: bold;
        }
        .ranknum {
          display: table-cell;
          width: 1.2em;
          height: 36px;
          vertical-align: middle;
          text-align: center;
          font-weight: bold;
        }
      }
    }
    div.kifutools {
      margin: 4px 0;
      button {
        img,
        svg {
          height: 24px;
          width: 24px;
        }
        .icon-tabler-brand-twitter {
          color: #1da1f2;
        }
      }
      input[type="number"].tesuu {
        border: 1px solid black;
        border-radius: 2px;
        text-align: center;
        font-size: 24px;
        height: 26px;
        width: 84px;
      }
      .share-copy-fallback {
        background-color: #fff4e5;
        box-sizing: border-box;
        color: #b42318;
        font-size: 14px;
        margin-top: 4px;
        padding: 6px;
        width: 100%;

        .share-copy-fallback-header {
          align-items: center;
          display: flex;
          justify-content: space-between;
        }

        textarea {
          font-size: 16px;
          margin-top: 4px;
          min-height: 5em;
          width: 100%;
        }
      }
    }
    textarea.comments {
      width: 100%;
      height: 16em;
    }
    .tebanname {
      overflow: hidden;
    }
    img.diag {
      max-width: 570px;
    }
    textarea,
    textarea:disabled {
      color: #000;
      box-sizing: border-box;
      background-color: #fff;
      -webkit-text-fill-color: #000;
      opacity: 1;
      overflow: scroll;
    }
  }
}

@media (max-width: 430px) {
  div.kifu {
    width: 100%;
    container-type: inline-size;

    > * {
      width: 570px;
      zoom: calc(100cqw / 570px);
    }
  }
}

@media (orientation: landscape) and (max-height: 430px) {
  .single > div.kifu {
    zoom: min(1, calc((100dvh - 75px) / 590px));
  }
}
</style>

<script lang="ts">
import { defineComponent, reactive, SetupContext, watch } from "vue";
import { useStore } from "vuex";
import { JKFPlayer } from "json-kifu-format";
import { IMoveFormat } from "json-kifu-format/dist/src/Formats";
import { getKifuMirrorUrl, getKifuOrgUrl } from "@/modules/kifuurl";
import { toPackedSfenWeb } from "@/modules/psfenw";
import ScoreGraph from "@/modules/scoregraph";
import TagBar from "@/components/TagBar.vue";
import Info from "@/components/Kifu/Info.vue";
import Ban from "@/components/Kifu/Ban.vue";
import Mochi from "@/components/Kifu/Mochi.vue";
import TesuuSel from "@/components/Kifu/TesuuSel.vue";
import iconCaretLeftRaw from "@tabler/icons/icons/caret-left.svg?raw";
import iconChevronsLeftRaw from "@tabler/icons/icons/chevrons-left.svg?raw";
import iconArrowBarToLeftRaw from "@tabler/icons/icons/arrow-bar-to-left.svg?raw";
import iconCaretRightRaw from "@tabler/icons/icons/caret-right.svg?raw";
import iconChevronsRightRaw from "@tabler/icons/icons/chevrons-right.svg?raw";
import iconArrowBarToRightRaw from "@tabler/icons/icons/arrow-bar-to-right.svg?raw";
import iconRotateRaw from "@tabler/icons/icons/rotate.svg?raw";
import iconTwitterRaw from "@tabler/icons/icons/brand-twitter.svg?raw";
import iconShareRaw from "@tabler/icons/icons/share.svg?raw";
import iconAlertTriangleRaw from "@tabler/icons/icons/alert-triangle.svg?raw";
import iconXRaw from "@tabler/icons/icons/x.svg?raw";
import iconCheckRaw from "@tabler/icons/icons/check.svg?raw";
import iconCopyRaw from "@tabler/icons/icons/copy.svg?raw";
import iconDownloadRaw from "@tabler/icons/icons/download.svg?raw";
import iconLogoutRaw from "@tabler/icons/icons/logout.svg?raw";
import iconLinkRaw from "@tabler/icons/icons/link.svg?raw";
import iconBrushRaw from "@tabler/icons/icons/brush.svg?raw";

export default defineComponent({
  props: {
    tournament: {
      type: String,
      required: true,
    },
    gameid: {
      type: String,
      required: true,
    },
    gamename: {
      type: String,
      required: false,
    },
    ply: {
      type: Number,
      required: true,
    },
    hideTags: {
      type: Boolean,
      required: false,
      default: () => false,
    },
    hideGraph: {
      type: Boolean,
      required: false,
      default: () => false,
    },
    hideTools: {
      type: Boolean,
      required: false,
      default: () => false,
    },
    hideComments: {
      type: Boolean,
      required: false,
      default: () => false,
    },
    hideEnd: {
      type: Boolean,
      required: false,
      default: () => false,
    },
    lightEnd: {
      type: Boolean,
      required: false,
      default: () => false,
    },
    disableNonGame: {
      type: Boolean,
      required: false,
      default: () => false,
    },
  },
  setup(props, ctx: SetupContext) {
    const data = reactive({
      jkfstr: `{"header":{},"moves":[{}]}`,
      tesuu: 0,
      tesuuMax: 0,
      kifustr: "",
      ply: props.ply,
      error: "",
      rotated: false,
      intervalId: 0,
      inGame: false,
      hasClipboard: !!navigator?.clipboard,
      activated: false,
      updated: 0,
      showDiag: false,
      shareCopied: false,
      shareCopyFailed: false,
      shareCopyText: "",
      kifuCopied: false,
      lastInGame: 0,
      p1: "",
      p2: "",
      blackRate: "",
      whiteRate: "",
      blackRateEstimated: false,
      whiteRateEstimated: false,
    });
    const store = useStore();
    const getPSfenWB64 = (): string => {
      const player = JKFPlayer.parseJKF(data.jkfstr);
      player.goto(data.tesuu);
      let mvply = { move: player.getMove(), tesuu: player.tesuu };
      if (player.tesuu > 0 && !mvply.move) {
        mvply = {
          move: player.getMove(player.tesuu - 1),
          tesuu: player.tesuu - 1,
        };
      }
      if (player.tesuu > 1 && !mvply.move) {
        mvply = {
          move: player.getMove(player.tesuu - 2),
          tesuu: player.tesuu - 2,
        };
      }
      return toPackedSfenWeb(player.shogi, mvply.move, mvply.tesuu).toB64();
    };
    const getComment = (): string =>
      [data.error, ...JKFPlayer.parseJKF(data.jkfstr).getComments(data.tesuu)]
        .filter((e) => e)
        .join("\n");
    const getKifuurl = (): string =>
      getKifuMirrorUrl(props.tournament, props.gameid);
    const getKifuorgurl = (): string =>
      getKifuOrgUrl(props.tournament, props.gameid);
    const plyGo = (plyRel: number | string) => {
      const oldTesuu = data.tesuu;
      const newTesuu = Math.max(Math.min(oldTesuu + +plyRel, data.tesuuMax), 0);
      const newDataPly = newTesuu !== data.tesuuMax ? newTesuu : NaN;
      data.tesuu = newTesuu;
      data.ply = newDataPly;
      if (oldTesuu !== newTesuu) {
        ctx.emit("change-ply", {
          tournament: props.tournament,
          gameid: props.gameid,
          gamename: props.gamename,
          ply: newDataPly,
        });
      }
    };
    const plyGoto = (plyAbs: number | string) => {
      const oldTesuu = data.tesuu;
      const newTesuu = Math.max(Math.min(+plyAbs, data.tesuuMax), 0);
      const newDataPly = newTesuu !== data.tesuuMax ? newTesuu : NaN;
      data.tesuu = newTesuu;
      data.ply = newDataPly;
      if (oldTesuu !== newTesuu) {
        ctx.emit("change-ply", {
          tournament: props.tournament,
          gameid: props.gameid,
          gamename: props.gamename,
          ply: newDataPly,
        });
      }
    };
    const tesuuChange = (msg: { ply: number }) => {
      plyGoto(msg.ply);
    };
    const tesuuDiff = (msg: { plydiff: number }) => {
      plyGo(msg.plydiff);
    };
    const tesuuChangeEvent = (event: Event) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLSelectElement
      ) {
        plyGoto(event.target.value);
      }
    };
    const loadEmpty = () => {
      data.jkfstr = `{"header":{},"moves":[{}]}`;
      data.kifustr = "";
      data.tesuuMax = 0;
      data.tesuu = 0;
    };
    const updateData = () => {
      const tournament = props.tournament;
      const gameId = props.gameid;
      const tesuuMax = store.getters["shogiServer/getTesuuMax"](
        tournament,
        gameId
      );
      const gameEnd = store.getters["shogiServer/getGameEnd"](
        tournament,
        gameId
      );
      [
        data.kifustr,
        data.error,
        data.inGame,
        data.lastInGame,
        data.tesuuMax,
        data.jkfstr,
        data.tesuu,
        data.activated,
        data.p1,
        data.p2,
        data.blackRate,
        data.whiteRate,
        data.blackRateEstimated,
        data.whiteRateEstimated,
      ] = [
        store.getters["shogiServer/getRawCsa"](tournament, gameId),
        "",
        !gameEnd,
        gameEnd || tesuuMax === 0 ? data.lastInGame : new Date().valueOf(),
        tesuuMax,
        store.getters["shogiServer/getJkf"](tournament, gameId),
        Math.max(
          Math.min(Number.isNaN(data.ply) ? Infinity : data.ply, tesuuMax),
          0
        ),
        true,
        store.getters["shogiServer/getPlayer1"](tournament, gameId),
        store.getters["shogiServer/getPlayer2"](tournament, gameId),
        store.getters["shogiServer/getBlackRate"](tournament, gameId),
        store.getters["shogiServer/getWhiteRate"](tournament, gameId),
        store.getters["shogiServer/getBlackRateEstimated"](
          tournament,
          gameId
        ),
        store.getters["shogiServer/getWhiteRateEstimated"](
          tournament,
          gameId
        ),
      ];
      setTimeout(() => {
        // TesuuSel用の遅延更新呼び出し
        data.updated = new Date().valueOf();
      }, 0);
    };
    updateData();
    const loadKifu = () => {
      const tournament = props.tournament;
      const gameId = props.gameid;
      if (!tournament || !gameId) {
        return;
      }
      updateData();
      store.dispatch("shogiServer/fetchCsa", {
        tournament,
        gameId,
        callback: updateData,
      });
    };
    data.intervalId = window.setInterval(loadKifu, 5000);
    const moveToReadableKifu = (mv: IMoveFormat): string => {
      return JKFPlayer.moveToReadableKifu(mv);
    };
    const kifuUrlOpenEvent = () => {
      window.open(getKifuorgurl(), "_blank");
    };
    // 盤面反転ボタン
    const doRotate = () => {
      data.rotated = !data.rotated;
    };
    // 棋譜コピーボタン
    const doCopy = () => {
      if (navigator?.clipboard) {
        (
          navigator?.clipboard as
            | undefined
            | { writeText(str: string): Promise<unknown> }
        )?.writeText(data.kifustr);
        data.kifuCopied = true;
        setTimeout(() => { data.kifuCopied = false; }, 2000);
      }
    };
    // 棋譜URLコピーボタン
    const doCopyURL = () => {
      if (navigator?.clipboard) {
        (
          navigator?.clipboard as
            | undefined
            | { writeText(str: string): Promise<unknown> }
        )?.writeText(getKifuorgurl());
      }
    };
    // 棋譜ダウンロードボタン
    const doDownload = () => {
      const link = document.createElement("a");
      link.download = `${props.gameid}.csa`;
      const blob = new Blob([data.kifustr], {
        type: "application/octet-stream",
      });
      link.href = URL.createObjectURL(blob);
      link.click();
    };
    // ツイートボタン
    const doTweet = () => {
      const player = JKFPlayer.parseJKF(data.jkfstr);
      const readableKifu = player.getReadableKifu(data.tesuu);
      const tweetProp = {
        text: `${props.gamename} ${data.tesuu}手目 ${readableKifu}\n\n\n`,
        url: new URL(
          `./api/ogp?gi=${encodeURIComponent(
            props.gameid
          )}&p=${getPSfenWB64()}`,
          window.location.href
        ).href,
        hashtags: "将棋,floodgate",
        via: "",
      };
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          tweetProp.text
        )}${tweetProp.url ? `&url=${encodeURIComponent(tweetProp.url)}` : ""}${
          tweetProp.hashtags
            ? `&hashtags=${encodeURIComponent(tweetProp.hashtags)}`
            : ""
        }${tweetProp.via ? `&via=${encodeURIComponent(tweetProp.via)}` : ""}`,
        "_blank",
        "noopener=yes"
      );
    };
    const doShareFedi = () => {
      // unused, kept for compatibility
    };
    const closeShareCopyFallback = () => {
      data.shareCopyFailed = false;
      data.shareCopyText = "";
    };
    const selectShareCopyText = (event: Event) => {
      if (event.target instanceof HTMLTextAreaElement) {
        event.target.select();
      }
    };
    const doShareCopy = async () => {
      const player = JKFPlayer.parseJKF(data.jkfstr);
      const readableKifu = player.getReadableKifu(data.tesuu);
      const shareUrl = new URL(
        `./api/ogp?gi=${encodeURIComponent(
          props.gameid
        )}&p=${getPSfenWB64()}`,
        window.location.href
      ).href;
      const text = `${props.gamename} ${data.tesuu}手目 ${readableKifu}\n#将棋 #floodgate\n${shareUrl}`;

      try {
        if (!navigator.clipboard) {
          throw new Error("Clipboard API is unavailable");
        }
        await navigator.clipboard.writeText(text);
      } catch (error) {
        console.error("Failed to copy share text with Clipboard API", error);
        data.shareCopied = false;
        data.shareCopyFailed = true;
        data.shareCopyText = text;
        return;
      }

      closeShareCopyFallback();
      data.shareCopied = true;
      setTimeout(() => { data.shareCopied = false; }, 2000);
    };
    const doDiag = () => {
      data.showDiag = !data.showDiag;
    };
    // 情報ダイアログボタン
    const doInfoDiag = () => {
      // TODO
    };
    loadKifu();
    watch(
      () => props.tournament,
      () => {
        data.ply = props.ply;
        loadKifu();
      }
    );
    watch(
      () => props.gameid,
      () => {
        data.ply = props.ply;
        loadKifu();
      }
    );
    watch(
      () => props.ply,
      () => {
        data.ply = props.ply;
        plyGoto(isNaN(props.ply) ? Infinity : props.ply);
      }
    );
    return {
      props,
      data,
      getComment,
      getKifuurl,
      getKifuorgurl,
      getPSfenWB64,
      loadEmpty,
      loadKifu,
      moveToReadableKifu,
      doRotate,
      doTweet,
      doShareFedi,
      doShareCopy,
      closeShareCopyFallback,
      selectShareCopyText,
      doInfoDiag,
      doCopy,
      doCopyURL,
      doDownload,
      doDiag,
      plyGo,
      plyGoto,
      kifuUrlOpenEvent,
      tesuuChange,
      tesuuChangeEvent,
      tesuuDiff,
      iconCaretLeftRaw,
      iconChevronsLeftRaw,
      iconArrowBarToLeftRaw,
      iconCaretRightRaw,
      iconChevronsRightRaw,
      iconArrowBarToRightRaw,
      iconRotateRaw,
      iconTwitterRaw,
      iconShareRaw,
      iconAlertTriangleRaw,
      iconXRaw,
      iconCheckRaw,
      iconCopyRaw,
      iconDownloadRaw,
      iconLogoutRaw,
      iconLinkRaw,
      iconBrushRaw,
    };
  },
  beforeUnmount() {
    if (this.data.intervalId) {
      clearInterval(this.data.intervalId);
      this.data.intervalId = 0;
    }
  },
  components: {
    TagBar,
    ScoreGraph,
    Info,
    Ban,
    Mochi,
    TesuuSel,
  },
});
</script>
