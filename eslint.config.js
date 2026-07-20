import pluginVue from "eslint-plugin-vue";
import vueTsEslintConfig from "@vue/eslint-config-typescript";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
    {
        ignores: ["dist/**", "node_modules/**"],
    },
    ...pluginVue.configs["flat/essential"],
    ...vueTsEslintConfig(),
    eslintConfigPrettier,
    {
        rules: {
            "vue/multi-word-component-names": "off",
            "no-console":
                process.env.NODE_ENV === "production" ? "warn" : "off",
            "no-debugger":
                process.env.NODE_ENV === "production" ? "warn" : "off",
        },
    },
];
