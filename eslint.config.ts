import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import { defineConfig } from "eslint/config";

export default defineConfig([
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  pluginVue.configs["flat/recommended"],
  {
    ignores: ["dist/**"],
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
      globals: { ...globals.browser },
    },
    rules: {
      // typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
      // see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
      "no-undef": "off",
    },
  },
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        extraFileExtensions: [".vue"],
        projectService: true,
        parser: tseslint.parser,
      },
    },
  },
  {
    // use Node.js globals
    files: ["./*.config.{ts,mjs,js}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
      globals: { ...globals.nodeBuiltin },
    },
  },
]);
