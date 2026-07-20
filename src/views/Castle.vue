<template>
  <div class="castle">
    <h1>戦型・戦法・囲い等タグ</h1>

    <p>
      このサイトで使われている、戦型・戦法・囲い等タグの定義を公開しています。
      <a
        href="https://github.com/mizar/sylwi-kifu-vue/tree/main/src/assets/castle/"
        target="_blank"
        rel="noopener"
        >JSON形式・YAML形式のデータはGitHubでも公開しています。</a
      >
    </p>

    <h2>現行のタグ定義リスト</h2>
    <CastleList />
  </div>
</template>

<style lang="scss">
.castle {
  margin: 0 1vw;
  img {
    max-width: 100%;
  }
}
</style>

<script lang="ts">
import { defineComponent, SetupContext, reactive } from "vue";
import CastleList from "@/components/CastleList.vue";

export default defineComponent({
  props: {},
  setup(props, ctx: SetupContext) {
    const data = reactive({});
    return {
      props,
      data,
      ctx,
    };
  },
  components: {
    CastleList,
  },
});
</script>
