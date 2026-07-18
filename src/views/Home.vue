<template>
  <div class="home">
    <PR />
    <ul>
      <li><router-link to="/">Home</router-link></li>
      <li><router-link to="/about">About</router-link></li>
      <li><router-link to="/castle">戦型・戦法・囲い等タグ</router-link></li>
      <li>
        <router-link to="/floodgate">Floodgate</router-link>
      </li>
    </ul>
  </div>
</template>

<style lang="scss">
.home {
  margin: 0 1vw;
}
</style>

<script lang="ts">
import { defineComponent } from "vue";
import PR from "@/components/PR.vue";

export default defineComponent({
  name: "Home",
  components: {
    PR,
  },
});
</script>
