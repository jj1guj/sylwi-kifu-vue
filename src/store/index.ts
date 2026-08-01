import { fetchGameListMirrorUrl, getKifuMirrorUrl } from "@/modules/kifuurl";
import { JKFPlayer } from "json-kifu-format";
import { createStore } from "vuex";

export default createStore({
  modules: {
    shogiServer: {
      namespaced: true,
      state: () => ({
        gameList: {},
        listCheckTime: {},
        csa: {},
      }),
      getters: {
        getRawList: (state) => (tournament: string) => {
          return state.gameList[tournament]?.raw;
        },
        getList: (state) => (tournament: string) => {
          return [
            ...(state.gameList[tournament]?.list ?? []).map(
              (e: Record<string, unknown>) => ({
                ...e,
              })
            ),
          ];
        },
        getListJson: (state) => (tournament: string) => {
          return state.gameList[tournament]?.listjson;
        },
        getListCheckTime:
          (state) =>
          (tournament: string): number =>
            state.listCheckTime[tournament] ?? 0,
        getRawCsa: (state) => (tournament: string, gameId: string) => {
          return state.csa[`${tournament}/${gameId}`]?.csa;
        },
        getJkf: (state) => (tournament: string, gameId: string) => {
          return (
            state.csa[`${tournament}/${gameId}`]?.jkf ??
            `{"header":{},"moves":[{}]}`
          );
        },
        getTesuuMax:
          (state) =>
          (tournament: string, gameId: string): boolean => {
            return state.csa[`${tournament}/${gameId}`]?.tesuuMax ?? 0;
          },
        getGameEnd:
          (state) =>
          (tournament: string, gameId: string): boolean => {
            return state.csa[`${tournament}/${gameId}`]?.gameEnd ?? false;
          },
        getPlayer1:
          (state) =>
          (tournament: string, gameId: string): string => {
            return state.csa[`${tournament}/${gameId}`]?.p1 ?? "";
          },
        getPlayer2:
          (state) =>
          (tournament: string, gameId: string): string => {
            return state.csa[`${tournament}/${gameId}`]?.p2 ?? "";
          },
        getBlackRate:
          (state) =>
          (tournament: string, gameId: string): string => {
            const actualRate = state.csa[`${tournament}/${gameId}`]?.blackRate;
            return (
              actualRate ||
              (state.gameList[tournament]?.list.find(
                (game: { gameId: string }) => game.gameId === gameId
              )?.blackEstimatedRate ?? "")
            );
          },
        getWhiteRate:
          (state) =>
          (tournament: string, gameId: string): string => {
            const actualRate = state.csa[`${tournament}/${gameId}`]?.whiteRate;
            return (
              actualRate ||
              (state.gameList[tournament]?.list.find(
                (game: { gameId: string }) => game.gameId === gameId
              )?.whiteEstimatedRate ?? "")
            );
          },
        getBlackRateEstimated:
          (state) =>
          (tournament: string, gameId: string): boolean => {
            return (
              !state.csa[`${tournament}/${gameId}`]?.blackRate &&
              !!state.gameList[tournament]?.list.find(
                (game: { gameId: string }) => game.gameId === gameId
              )?.blackEstimatedRate
            );
          },
        getWhiteRateEstimated:
          (state) =>
          (tournament: string, gameId: string): boolean => {
            return (
              !state.csa[`${tournament}/${gameId}`]?.whiteRate &&
              !!state.gameList[tournament]?.list.find(
                (game: { gameId: string }) => game.gameId === gameId
              )?.whiteEstimatedRate
            );
          },
      },
      mutations: {
        mutList(state, { tournament, rawlist }) {
          const estimatedRatesByTime = new Map<string, Map<string, string>>();
          const gameStartTimes = new Map<string, string>();
          if (tournament === "floodgate") {
            rawlist.split("\n").forEach((line: string) => {
              const estimatedRate = line.match(
                /^(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d) \[INFO\] Floodgate: (?:No active opponent found\. )?Estimated ([\w.-]+)'s rate: (\d+)$/
              );
              if (estimatedRate) {
                const rates =
                  estimatedRatesByTime.get(estimatedRate[1]) ??
                  new Map<string, string>();
                rates.set(estimatedRate[2], estimatedRate[3]);
                estimatedRatesByTime.set(estimatedRate[1], rates);
              }

              const gameStarted = line.match(
                /^(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d) \[INFO\] game started ((?:[\w.-]+\+){4}\d+)$/
              );
              if (gameStarted) {
                gameStartTimes.set(gameStarted[2], gameStarted[1]);
              }
            });
          }
          const list = (
            tournament === "floodgate"
              ? rawlist
                  .split("\n")
                  .map((s: string) =>
                    s.match(
                      /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d \[INFO\] game (?:started|finished) ((?:[\w.-]+\+){4}\d+)/
                    )
                  )
                  .filter((s: RegExpMatchArray | null) => s)
                  .map((s: RegExpMatchArray) => ({
                    gameId: s[1],
                    gameName: `☗${s[1].split("+")[2]} ☖${
                      s[1].split("+")[3]
                    } (${s[1].split("+")[4].substring(0, 4)}-${s[1]
                      .split("+")[4]
                      .substring(4, 6)}-${s[1]
                      .split("+")[4]
                      .substring(6, 8)} ${s[1]
                      .split("+")[4]
                      .substring(8, 10)}:${s[1]
                      .split("+")[4]
                      .substring(10, 12)}:${s[1]
                      .split("+")[4]
                      .substring(12, 14)})`,
                  }))
              : rawlist
                  .split("\n")
                  .map((s: string) =>
                    s.match(
                      /^<div><a href="\.\/kifujs\/((?:[\w.-]+\+){4}\d+)\.html"[^>]*>([^\n]+)<\/a>/
                    )
                  )
                  .filter((s: RegExpMatchArray | null) => s)
                  .map((s: RegExpMatchArray) => ({
                    gameId: (s as string[])[1],
                    gameName: (s as string[])[2]
                      .replace(/<[^>]+>/g, "")
                      .replace(/[<>]/g, "")
                      .replace(/▲/g, "☗")
                      .replace(/△/g, "☖"),
                  }))
          )
            .filter(
              (
                x: { gameId: string; gameName: string },
                i: number,
                self: { gameId: string; gameName: string }[]
              ) => !self.some((s, j) => j < i && s.gameId === x.gameId)
            )
            .sort(
              (
                a: { gameId: string; gameName: string },
                b: { gameId: string; gameName: string }
              ) =>
                parseFloat(b.gameId.substring(b.gameId.length - 14)) -
                parseFloat(a.gameId.substring(a.gameId.length - 14))
            )
            .map((game: { gameId: string; gameName: string }) => {
              const players = game.gameId.split("+");
              const estimatedRates = estimatedRatesByTime.get(
                gameStartTimes.get(game.gameId) ?? ""
              );
              return {
                ...game,
                blackEstimatedRate: estimatedRates?.get(players[2]) ?? "",
                whiteEstimatedRate: estimatedRates?.get(players[3]) ?? "",
              };
            });
          state.gameList[tournament] = {
            raw: rawlist,
            list,
            listjson: JSON.stringify(list),
            updated: new Date().valueOf(),
          };
        },
        mutListCheckTime(state, { tournament, time }) {
          state.listCheckTime[tournament] = time;
        },
        mutCsa(state, { tournament, gameId, csa }) {
          const player = JKFPlayer.parseCSA(csa);
          const blackRate = csa.match(/^'black_rate:[^\r\n]*:(\d+)\r?$/m);
          const whiteRate = csa.match(/^'white_rate:[^\r\n]*:(\d+)\r?$/m);
          state.csa[`${tournament}/${gameId}`] = {
            csa,
            jkf: player.toJKF(),
            tesuuMax: player.kifu.moves.length - 1,
            gameEnd: player.kifu.moves[
              player.kifu.moves.length - 1
            ]?.comments?.some((s) => s.startsWith("$END_TIME:")),
            updated: new Date().valueOf(),
            p1: player.kifu.header.先手 ?? "",
            p2: player.kifu.header.後手 ?? "",
            blackRate: blackRate?.[1] ?? "",
            whiteRate: whiteRate?.[1] ?? "",
          };
        },
      },
      actions: {
        async fetchList(
          { commit, getters },
          {
            tournament,
            callback,
          }: {
            tournament: string;
            callback?: () => void;
          }
        ) {
          // 50秒以内には再取得を試みない
          const fetchTime = new Date().valueOf();
          const lastCheckTime = getters.getListCheckTime(tournament);
          if (fetchTime >= lastCheckTime && fetchTime < lastCheckTime + 50000) {
            return;
          }
          commit("mutListCheckTime", { tournament, time: fetchTime });
          // fetch実行
          fetch(fetchGameListMirrorUrl(tournament))
            .then((response) => {
              if (!response.ok) {
                throw new Error(
                  [
                    `Fetch Response was not ok : ${response.status} ${response.statusText}`,
                  ].join("\n")
                );
              }
              return response.text();
            })
            .then((rawlist) => {
              commit("mutList", { tournament, rawlist });
              callback?.();
            });
        },
        async fetchCsa(
          { commit, getters },
          {
            tournament,
            gameId,
            callback,
          }: {
            tournament: string;
            gameId: string;
            callback?: () => void;
          }
        ) {
          if (getters.getGameEnd(tournament, gameId)) {
            return;
          }
          fetch(getKifuMirrorUrl(tournament, gameId))
            .then((response) => {
              if (!response.ok) {
                throw new Error(
                  [
                    `Fetch Response was not ok : ${response.status} ${response.statusText}`,
                  ].join("\n")
                );
              }
              return response.text();
            })
            .then((csa) => {
              commit("mutCsa", { tournament, gameId, csa });
              callback?.();
            });
        },
      },
    },
  },
  strict: import.meta.env.DEV,
});
