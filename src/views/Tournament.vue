<template>
  <div class="tournament">
    <h1>tournament : {{ props.tournament }}</h1>
    <p>
      <GameSelect :tournament="props.tournament" @change-game="changeGame" />
    </p>
    <p>
      <a
        href="https://wdoor.c.u-tokyo.ac.jp/shogi/"
        target="_blank"
        rel="noopener"
        >⇒ 棋戦サイト</a
      >
    </p>
    <p>
      <router-link
        :to="{
          path: data.linkKifuMulti,
          query: { lt: 3540, ln: 50 },
        }"
        replace
        >⇒ 盤面複数表示(最新59分,最大50件)</router-link
      >
    </p>
    <p>
      <router-link :to="{ path: data.linkKifuMulti }" replace
        >⇒ 盤面複数表示(全棋譜)</router-link
      >
    </p>
    <p>
      <router-link :to="{ path: data.linkKifuMulti, query: { s: 1 } }" replace
        >⇒ 盤面複数表示(全棋譜,軽量)</router-link
      >
    </p>
    <section class="game-filter" aria-labelledby="game-filter-heading">
      <h2 id="game-filter-heading">対局を絞り込む</h2>
      <label class="game-filter-field">
        <span
          class="game-filter-search-icon"
          aria-hidden="true"
          v-html="iconSearchRaw"
        ></span>
        <input
          v-model="playerNameQuery"
          type="text"
          role="searchbox"
          aria-label="ソフト名で絞り込む"
          placeholder="ソフト名で絞り込む"
          autocomplete="off"
        />
        <button
          v-if="normalizedPlayerNameQuery"
          class="game-filter-clear"
          type="button"
          title="検索文字列を消去"
          aria-label="検索文字列を消去"
          @click="clearPlayerNameQuery"
          v-html="iconXRaw"
        ></button>
      </label>
      <p class="game-filter-status" aria-live="polite">
        <template v-if="normalizedPlayerNameQuery">
          <strong>検索結果 {{ filteredGameCount }}件</strong>
          <template v-if="filteredGameCount > 0">
            <span class="game-filter-separator">·</span>
            <template v-if="filteredGameCount > 50">
              盤面は最新50件を表示
            </template>
            <template v-else>盤面も{{ filteredGameCount }}件表示</template>
          </template>
        </template>
        <template v-else>{{ gameCount }}件</template>
      </p>
    </section>
    <p>
      ↓ : 盤面複数表示<span v-if="!normalizedPlayerNameQuery"
        >(最大{{ props.limitNumber }}件)</span
      >
    </p>
    <GameFlex
      :tournament="props.tournament"
      :limitTimeDur="normalizedPlayerNameQuery ? Infinity : props.limitTimeDur"
      :limitNumber="normalizedPlayerNameQuery ? 50 : props.limitNumber"
      :hideTags="props.hideTags"
      :hideGraph="props.hideGraph"
      :hideTools="props.hideTools"
      :hideComments="props.hideComments"
      :hideEnd="props.hideEnd"
      :gameNameInclude="normalizedPlayerNameQuery"
      :gameIdInclude="props.gameIdInclude"
    />
    <GameList
      :tournament="props.tournament"
      :gameNameInclude="normalizedPlayerNameQuery"
    />
  </div>
</template>

<style lang="scss">
.tournament {
  margin: 0 1vw;
}

.game-filter {
  max-width: 760px;
  margin: 24px 0 8px;
  padding-top: 20px;
  border-top: 1px solid #dce3df;

  h2 {
    margin: 0 0 12px;
    font-size: 1.15rem;
    letter-spacing: 0;
  }
}

.game-filter-field {
  position: relative;
  display: block;

  input {
    box-sizing: border-box;
    width: 100%;
    height: 42px;
    padding: 0 42px 0 38px;
    border: 1px solid #aebbb4;
    border-radius: 4px;
    outline: none;
    background: #fff;
    color: #20342b;
    font-size: 16px;

    &:focus {
      border-color: #27885d;
      box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.17);
    }

    &::placeholder {
      color: #78877f;
    }
  }
}

.game-filter-search-icon,
.game-filter-clear {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  color: #607269;

  svg {
    display: block;
    width: 18px;
    height: 18px;
  }
}

.game-filter-search-icon {
  left: 12px;
  pointer-events: none;
}

.game-filter-clear {
  right: 7px;
  width: 28px;
  height: 28px;
  padding: 5px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;

  &:hover {
    background: #edf3f0;
  }
}

.game-filter-status {
  min-height: 20px;
  margin: 8px 2px 0;
  color: #607269;
  font-size: 0.82rem;
  font-variant-numeric: tabular-nums;

  strong {
    color: #344b40;
    font-weight: 600;
  }
}

.game-filter-separator {
  margin: 0 8px;
  color: #a5b0aa;
}

@media (max-width: 520px) {
  .game-filter {
    margin-top: 20px;

    h2 {
      margin-bottom: 10px;
    }
  }

  .game-filter-status {
    line-height: 1.6;
  }
}
</style>

<script lang="ts">
import { defineComponent, reactive, computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import iconSearchRaw from "@tabler/icons/icons/search.svg?raw";
import iconXRaw from "@tabler/icons/icons/x.svg?raw";
import GameSelect from "@/components/GameSelect.vue";
import GameFlex from "@/components/GameFlex.vue";
import GameList from "@/components/GameList.vue";
import { GameListEntry, includesPlayerName } from "@/modules/game";

export default defineComponent({
  props: {
    tournament: {
      type: String,
      required: true,
    },
    limitTimeDur: {
      type: Number,
      required: false,
      default: () => Infinity,
    },
    limitNumber: {
      type: Number,
      required: false,
      default: () => 20,
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
    gameNameInclude: {
      type: String,
      required: false,
      default: () => "",
    },
    gameIdInclude: {
      type: String,
      required: false,
      default: () => "",
    },
  },
  setup(props) {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();
    const playerNameQuery = ref(props.gameNameInclude);
    const normalizedPlayerNameQuery = computed(() =>
      playerNameQuery.value.trim()
    );
    const data = reactive({
      linkKifuMulti: computed(() => `/${props.tournament}/multi`),
      linkKifuMultiAll: computed(() => `/${props.tournament}/multiall`),
    });
    const gameList = computed<GameListEntry[]>(() =>
      store.getters["shogiServer/getList"](props.tournament)
    );
    const gameCount = computed(() => gameList.value.length);
    const filteredGameCount = computed(
      () =>
        gameList.value.filter((game) =>
          includesPlayerName(game, normalizedPlayerNameQuery.value)
        ).length
    );
    watch(
      () => props.gameNameInclude,
      (gameNameInclude) => {
        playerNameQuery.value = gameNameInclude;
      }
    );
    watch(normalizedPlayerNameQuery, (playerName) => {
      const currentPlayerName = Array.isArray(route.query.name)
        ? route.query.name[0] ?? ""
        : route.query.name ?? "";
      if (playerName === currentPlayerName) {
        return;
      }

      const query = { ...route.query };
      if (playerName) {
        query.name = playerName;
      } else {
        delete query.name;
      }
      void router.replace({ query });
    });
    const changeGame = (msg: { tournament: string; gameid: string }) => {
      router.push(`/${msg.tournament}/${msg.gameid}`);
    };
    const clearPlayerNameQuery = () => {
      playerNameQuery.value = "";
    };
    return {
      props,
      data,
      iconSearchRaw,
      iconXRaw,
      playerNameQuery,
      normalizedPlayerNameQuery,
      gameCount,
      filteredGameCount,
      changeGame,
      clearPlayerNameQuery,
    };
  },
  components: {
    GameSelect,
    GameFlex,
    GameList,
  },
});
</script>
