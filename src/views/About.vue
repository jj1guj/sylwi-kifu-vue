<template>
  <div class="about">
    <div class="append">
      <PR />
      <h3>Computer Shogi</h3>
      <ul>
        <li>
          <a
            href="https://wdoor.c.u-tokyo.ac.jp/shogi/floodgate.html"
            target="_blank"
            rel="noopener"
            >コンピュータ将棋連続対局場所 (floodgate)</a
          >
        </li>
      </ul>
      <h3>Licenses</h3>
      <ul>
        <li v-for="(license, name) in licenses" :key="name">
          <p>{{ name }}</p>
          <ul>
            <template v-for="(data, key) in license" :key="key">
              <li v-if="key !== 'path' && key !== 'licenseFile'">
                {{ key }} : {{ data }}
              </li>
            </template>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import PR from "@/components/PR.vue";

export default defineComponent({
  name: "Home",
  setup(props) {
    return {
      props,
      licenses: require("@/assets/licenses.json"),
    };
  },
  components: {
    PR,
  },
});
</script>

<style scoped lang="scss">
div.append {
  margin: 0 1vw;
  h3 {
    margin: 40px 0 0;
  }
  a {
    color: #42b983;
  }
}
</style>
