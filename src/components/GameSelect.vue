<template>
  <select class="kifulist" v-model="data.gameId" @change="changeGameEvent">
    <option
      v-for="game in selectableGameList"
      :key="game.gameId"
      :value="game.gameId"
    >
      {{ game.gameName }}
    </option>
  </select>
</template>

<style lang="scss">
select.kifulist {
  max-width: 100%;
}
</style>

<script lang="ts">
import { defineComponent, SetupContext, reactive, watch, computed } from "vue";
import { useStore } from "vuex";
import {
  formatFloodgateGameName,
  type GameListEntry,
} from "@/modules/game";
export default defineComponent({
  props: {
    tournament: {
      type: String,
      required: true,
    },
    gameid: {
      type: String,
      required: false,
    },
    gamename: {
      type: String,
      required: false,
    },
  },
  setup(props, ctx: SetupContext) {
    const rememberedGames: GameListEntry[] = props.gameid
      ? [
          {
            gameId: props.gameid,
            gameName: formatFloodgateGameName(props.gameid),
          },
        ]
      : [];
    const data = reactive({
      intervalId: 0,
      selectedIndex: NaN,
      gameId: props.gameid || "",
      gameName: props.gamename || "",
      rememberedGames,
      error: "",
    });
    const store = useStore();
    const gameList = computed(() =>
      store.getters["shogiServer/getList"](props.tournament)
    );
    const selectableGameList = computed<GameListEntry[]>(() => {
      const listedGameIds = new Set(
        gameList.value.map((game: GameListEntry) => game.gameId)
      );
      return [
        ...data.rememberedGames.filter(
          (game) => !listedGameIds.has(game.gameId)
        ),
        ...gameList.value,
      ];
    });
    const rememberGame = (gameId?: string) => {
      if (
        !gameId ||
        data.rememberedGames.some((game) => game.gameId === gameId)
      ) {
        return;
      }
      data.rememberedGames.push({
        gameId,
        gameName: formatFloodgateGameName(gameId),
      });
    };
    const loadStream = () => {
      store.dispatch("shogiServer/fetchList", { tournament: props.tournament });
    };
    const changeGame = (newGameId: string) => {
      data.gameId = newGameId;
      data.gameName = formatFloodgateGameName(newGameId);
      ctx.emit("change-game", {
        tournament: props.tournament,
        gameid: data.gameId,
        gamename: data.gameName,
      });
    };
    const changeGameEvent = (event: Event) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLSelectElement
      ) {
        changeGame(event.target.value);
      }
    };
    const execInterval = () => {
      loadStream();
    };
    loadStream();
    watch(
      () => props.tournament,
      () => {
        data.gameId = "";
        data.gameName = "";
        data.rememberedGames = [];
        rememberGame(props.gameid);
        loadStream();
      }
    );
    watch(
      () => props.gameid,
      (gameId) => {
        data.gameId = gameId || "";
        data.gameName = gameId ? formatFloodgateGameName(gameId) : "";
        rememberGame(gameId);
      }
    );
    data.intervalId = window.setInterval(execInterval, 60000);
    return {
      props,
      data,
      gameList,
      selectableGameList,
      changeGame,
      changeGameEvent,
    };
  },
  beforeUnmount() {
    if (this.data.intervalId) {
      clearInterval(this.data.intervalId);
      this.data.intervalId = 0;
    }
  },
});
</script>
