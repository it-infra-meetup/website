import js from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  pluginVue.configs["flat/recommended"],
  { ignores: ["dist/**", "node_modules/**"] },
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.browser },
    },
    rules: { "no-undef": "off" },
  },
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        extraFileExtensions: [".vue"],
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        parser: tseslint.parser,
      },
    },
    rules: {
      "vue/max-attributes-per-line": ["error", {
        singleline: { max: 5 },
        multiline:  { max: 5 },
      }],
    },
  },
  {
    files: ["*.config.{ts,mjs,js}"],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.nodeBuiltin },
    },
  },
]);
